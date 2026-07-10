/**
 * intake_sessions DB 헬퍼 (SPEC §5).
 *
 * RLS 에 public/authenticated 정책이 없으므로 서비스롤(createAdminClient)로만 접근한다.
 * 유저 검사 페이지·submit 도 서버 라우트를 경유한다 (토큰이 곧 인증).
 * 서버(API 라우트·서버 액션) 전용 — 클라이언트에서 import 금지.
 */

import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { IntakeResponses, ScoreResult } from "./types";

/** 세션 상태. completed 후에는 submit 거부(1회 제출), 재발급 시 issued 로 복귀. */
export type IntakeSessionStatus =
  | "issued"
  | "in_progress"
  | "completed"
  | "expired";

/** intake_sessions 테이블 row (SPEC §5 컬럼 계약). */
export interface IntakeSessionRow {
  id: string;
  token: string;
  display_name: string;
  memo: string | null;
  session_date: string | null; // date (YYYY-MM-DD)
  status: IntakeSessionStatus;
  responses: IntakeResponses | null;
  result: ScoreResult | null;
  crisis_flag: boolean;
  quality_flag: string | null;
  completed_at: string | null;
  email_sent: boolean;
  created_at: string;
  updated_at: string;
}

const TABLE = "intake_sessions";

/** 예측 불가 토큰 생성 (base64url 24바이트 → 32자). */
export function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

/** 세션 생성 — 토큰 발급 후 row 반환. */
export async function createSession(input: {
  display_name: string;
  memo?: string;
  session_date?: string;
}): Promise<IntakeSessionRow> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      token: generateToken(),
      display_name: input.display_name,
      memo: input.memo ?? null,
      session_date: input.session_date ?? null,
      status: "issued",
    })
    .select()
    .single();

  if (error) throw new Error(`intake 세션 생성 실패: ${error.message}`);
  return data as IntakeSessionRow;
}

/** 토큰으로 세션 조회 (검사 페이지·submit 용). 없으면 null. */
export async function getSessionByToken(
  token: string,
): Promise<IntakeSessionRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error) throw new Error(`intake 세션 조회 실패: ${error.message}`);
  return (data as IntakeSessionRow) ?? null;
}

/** id 로 세션 조회 (관리자 리포트·export 용). 없으면 null. */
export async function getSessionById(
  id: string,
): Promise<IntakeSessionRow | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`intake 세션 조회 실패: ${error.message}`);
  return (data as IntakeSessionRow) ?? null;
}

/** 세션 목록 (관리자 대시보드 — 최신순). */
export async function listSessions(limit = 200): Promise<IntakeSessionRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`intake 세션 목록 조회 실패: ${error.message}`);
  return (data as IntakeSessionRow[]) ?? [];
}

/**
 * 제출 저장 — 응답·채점 결과를 기록하고 status→completed.
 * 이미 completed 인 세션(1회 제출 소진)은 거부한다.
 */
export async function saveSubmission(
  token: string,
  responses: IntakeResponses,
  result: ScoreResult,
  flags: {
    crisis_flag: boolean;
    quality_flag: "straight_lining_suspected" | null;
  },
): Promise<void> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from(TABLE)
    .update({
      responses,
      result,
      crisis_flag: flags.crisis_flag,
      quality_flag: flags.quality_flag,
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("token", token)
    .neq("status", "completed") // 1회 제출 — 완료된 세션은 갱신 불가
    .select("id");

  if (error) throw new Error(`intake 제출 저장 실패: ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error("유효하지 않거나 이미 완료된 세션입니다.");
  }
}

/** 토큰 재발급 — 새 토큰 세팅 + status→issued. 새 토큰 반환. */
export async function reissueToken(id: string): Promise<string> {
  const supabase = createAdminClient();
  const token = generateToken();
  const { data, error } = await supabase
    .from(TABLE)
    .update({ token, status: "issued" })
    .eq("id", id)
    .select("id");

  if (error) throw new Error(`intake 토큰 재발급 실패: ${error.message}`);
  if (!data || data.length === 0) {
    throw new Error("세션을 찾을 수 없습니다.");
  }
  return token;
}
