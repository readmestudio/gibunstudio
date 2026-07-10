/**
 * POST /api/intake/submit — 검사 응답 제출 (SPEC Phase B).
 *
 * body: { token, partA, partB, partC, timings }
 * - 토큰으로 세션 조회 → 없으면 404, completed 면 409 (1회 제출).
 * - 서버에서 computeScore 로 권위 재채점 (클라이언트 점수는 신뢰하지 않음).
 * - saveSubmission 으로 응답+결과 저장 (status→completed).
 * - 응답은 { ok: true } 만 — 점수·유형·crisis 여부는 유저에게 절대 반환하지 않는다.
 */

import { NextResponse } from "next/server";
import { computeScore } from "@/lib/intake/scoring";
import { getSessionByToken, saveSubmission } from "@/lib/intake/store";
import { ITEM_ORDER } from "@/lib/intake/item-order";
import { PART_B_QUESTIONS, PART_C_QUESTIONS } from "@/lib/intake/questions";
import type {
  GuardianType,
  IntakeResponses,
  PartAAnswers,
  PartBAnswers,
  PartCAnswers,
  ScaleValue,
} from "@/lib/intake/types";

export const dynamic = "force-dynamic";

const GUARDIAN_VALUES: GuardianType[] = [
  "surrender",
  "avoidance",
  "overcompensation",
];

/** Part C 최소 입력 길이 (UI 계약과 동일). */
const C_MIN_LENGTH = 2;

/** Part A 응답 검증: ITEM_ORDER 72문항 전부 1~6 정수. */
function parsePartA(input: unknown): PartAAnswers | null {
  if (!input || typeof input !== "object") return null;
  const record = input as Record<string, unknown>;
  const parsed: PartAAnswers = {};
  for (const itemId of ITEM_ORDER) {
    const value = record[itemId];
    if (
      typeof value !== "number" ||
      !Number.isInteger(value) ||
      value < 1 ||
      value > 6
    ) {
      return null;
    }
    parsed[itemId] = value as ScaleValue;
  }
  return parsed;
}

/** Part B 응답 검증: P1~P3 전부 guardian 값. */
function parsePartB(input: unknown): PartBAnswers | null {
  if (!input || typeof input !== "object") return null;
  const record = input as Record<string, unknown>;
  const parsed = {} as PartBAnswers;
  for (const question of PART_B_QUESTIONS) {
    const value = record[question.item_id];
    if (
      typeof value !== "string" ||
      !GUARDIAN_VALUES.includes(value as GuardianType)
    ) {
      return null;
    }
    parsed[question.item_id] = value as GuardianType;
  }
  return parsed;
}

/** Part C 응답 검증: C1~C5 전부 2자 이상 서술. 원문 그대로 보존(트림 저장 안 함). */
function parsePartC(input: unknown): PartCAnswers | null {
  if (!input || typeof input !== "object") return null;
  const record = input as Record<string, unknown>;
  const parsed = {} as PartCAnswers;
  for (const question of PART_C_QUESTIONS) {
    const value = record[question.item_id];
    if (typeof value !== "string" || value.trim().length < C_MIN_LENGTH) {
      return null;
    }
    parsed[question.item_id] = value;
  }
  return parsed;
}

/** 타이밍 검증 — 문자열(ISO)만 통과, 나머지는 버림. */
function parseTimings(input: unknown): IntakeResponses["timings"] {
  const timings: NonNullable<IntakeResponses["timings"]> = {};
  if (input && typeof input === "object") {
    const record = input as Record<string, unknown>;
    if (typeof record.a_started_at === "string") {
      timings.a_started_at = record.a_started_at;
    }
    if (typeof record.a_submitted_at === "string") {
      timings.a_submitted_at = record.a_submitted_at;
    }
    if (typeof record.submitted_at === "string") {
      timings.submitted_at = record.submitted_at;
    }
  }
  // 제출 시각은 서버 기준으로 보정 (클라 누락 대비)
  if (!timings.submitted_at) {
    timings.submitted_at = new Date().toISOString();
  }
  return timings;
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "잘못된 요청 형식입니다." },
      { status: 400 },
    );
  }

  const token = typeof body.token === "string" ? body.token : "";
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "토큰이 없습니다." },
      { status: 400 },
    );
  }

  // 토큰이 곧 인증 — 세션 존재/상태 확인
  const session = await getSessionByToken(token);
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "유효하지 않은 검사 링크입니다." },
      { status: 404 },
    );
  }
  if (session.status === "completed") {
    return NextResponse.json(
      { ok: false, error: "이미 제출이 완료된 검사입니다." },
      { status: 409 },
    );
  }

  const partA = parsePartA(body.partA);
  const partB = parsePartB(body.partB);
  const partC = parsePartC(body.partC);
  if (!partA || !partB || !partC) {
    return NextResponse.json(
      { ok: false, error: "응답이 완전하지 않습니다. 모든 문항에 응답해주세요." },
      { status: 400 },
    );
  }
  const timings = parseTimings(body.timings);

  // 서버 권위 재채점 (결정적 엔진 — 클라이언트 계산은 신뢰하지 않음)
  const result = computeScore({ partA, partB, partC, timings });

  const responses: IntakeResponses = { partA, partB, partC, timings };

  try {
    await saveSubmission(token, responses, result, {
      crisis_flag: result.crisis_flag,
      quality_flag: result.quality_flag,
    });
  } catch (e) {
    // 동시 제출 경합 등으로 이미 완료된 경우 → 409
    const message = e instanceof Error ? e.message : "";
    if (message.includes("이미 완료")) {
      return NextResponse.json(
        { ok: false, error: "이미 제출이 완료된 검사입니다." },
        { status: 409 },
      );
    }
    console.error("[intake/submit] 저장 실패:", e);
    return NextResponse.json(
      { ok: false, error: "제출 저장에 실패했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 },
    );
  }

  // 점수·유형·crisis 등 산출물은 절대 반환하지 않는다.
  return NextResponse.json({ ok: true });
}
