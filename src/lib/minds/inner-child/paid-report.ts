/**
 * 내면 아이 유료 리포트 엔진 (₩9,900) — 생성 9필드 + 정규화 리더.
 *
 * 무료 리포트는 pro + 5필드(portrait·insight·daily_prediction·gap·relation_pattern). 유료는 pro + 9필드
 * (daily_domains{관계·일·자기관리}·loop_stages{촉발·해석·행동·결과·강화}·guardian_anatomy·
 * conflict_problems·second_child_relation·core_need_bridge·getting_along·reparenting·closing)로
 * 깊게 파고들어, 결제 레코드(minds_relationship_purchases.report_json)에 1회 캐시된다.
 * reparenting 은 그 사람의 SCT 트리거·도피행동을 해석한 개인화 실행계획(고정 3단계 대체).
 *
 * 설계 원칙(relationship-report.ts 미러):
 *  - 유료 산출물이라 **폴백 없음**. 필드 중 하나라도 비거나 지나치게 짧으면 readPaidReport 가
 *    throw 하고, 호출 측(라우트)이 재시도(2회)를 판단한다.
 *  - 채점 결과(ScoreResult) + 유형카드 2장(대표·두번째)만 프롬프트에 주입한다.
 */

import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import { PAID_SYSTEM_PROMPT, buildPaidUserMessage } from "./paid-report-prompt";
import { getTypeCard } from "./type-cards";
import type { DailyDomains, LoopStages, PaidReportGenerated, ReparentingPlan } from "./report-types";
import type { ScoreResult } from "./types";

/** 서술형 필드 각각의 최소 유효 길이(자). 이보다 짧으면 생성이 잘렸거나 빈 것으로 보고 재시도. */
const MIN_LEN: Record<
  | "guardian_anatomy"
  | "conflict_problems"
  | "second_child_relation"
  | "core_need_bridge"
  | "getting_along"
  | "closing",
  number
> = {
  guardian_anatomy: 100,
  conflict_problems: 120,
  second_child_relation: 60,
  core_need_bridge: 40,
  getting_along: 120,
  closing: 40,
};

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * reparenting 객체 정규화·검증. scene + steps(2~3, 각 body 충분)를 요구한다.
 * 미달이면 throw(유료라 폴백 없음 — 라우트가 재시도). 구버전 캐시(필드 부재)도 여기서 걸려 재생성된다.
 */
function readReparenting(v: unknown): ReparentingPlan {
  const o = v && typeof v === "object" ? (v as Record<string, unknown>) : null;
  const scene = str(o?.scene);
  const rawSteps = Array.isArray(o?.steps) ? (o!.steps as unknown[]) : [];
  const steps = rawSteps
    .map((s) => {
      const so = s && typeof s === "object" ? (s as Record<string, unknown>) : {};
      return { title: str(so.title), body: str(so.body) };
    })
    .filter((s) => s.title.length > 0 && s.body.length >= 24);
  if (scene.length < 24) {
    throw new Error(`유료 리포트 'reparenting.scene' 이 비었거나 너무 짧습니다(${scene.length}자).`);
  }
  if (steps.length < 2) {
    throw new Error(`유료 리포트 'reparenting.steps' 가 부족합니다(${steps.length}개).`);
  }
  return { scene, steps: steps.slice(0, 3) };
}

/** loop_stages(촉발/해석/행동/결과/강화) 정규화·검증. 각 단계 최소 길이 미달이면 throw. */
function readLoopStages(v: unknown): LoopStages {
  const o = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  const keys: (keyof LoopStages)[] = ["trigger", "interpretation", "action", "result", "reinforcement"];
  const out = {} as LoopStages;
  for (const k of keys) {
    const s = str(o[k]);
    if (s.length < 30) {
      throw new Error(`유료 리포트 'loop_stages.${k}' 가 비었거나 너무 짧습니다(${s.length}자).`);
    }
    out[k] = s;
  }
  return out;
}

/** daily_domains(관계/일/자기관리) 정규화·검증. 각 영역 최소 길이 미달이면 throw. */
function readDailyDomains(v: unknown): DailyDomains {
  const o = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  const keys: (keyof DailyDomains)[] = ["relationship", "work", "self_care"];
  const out = {} as DailyDomains;
  for (const k of keys) {
    const s = str(o[k]);
    if (s.length < 40) {
      throw new Error(`유료 리포트 'daily_domains.${k}' 가 비었거나 너무 짧습니다(${s.length}자).`);
    }
    out[k] = s;
  }
  return out;
}

/**
 * LLM 응답(unknown)을 PaidReportGenerated 로 정규화한다. 모든 필드가 존재하고 최소 길이를
 * 넘어야 통과한다 — 하나라도 미달이면 throw(유료라 폴백 없음, 라우트가 재시도).
 * 캐시된 report_json 을 렌더 전에 다시 통과시켜 스키마 안정성을 보장하는 데도 쓴다.
 */
export function readPaidReport(parsed: unknown): PaidReportGenerated {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("유료 리포트 응답이 객체가 아닙니다.");
  }
  const o = parsed as Record<string, unknown>;
  const strFields = {
    guardian_anatomy: str(o.guardian_anatomy),
    conflict_problems: str(o.conflict_problems),
    second_child_relation: str(o.second_child_relation),
    core_need_bridge: str(o.core_need_bridge),
    getting_along: str(o.getting_along),
    closing: str(o.closing),
  };

  for (const key of Object.keys(MIN_LEN) as (keyof typeof MIN_LEN)[]) {
    if (strFields[key].length < MIN_LEN[key]) {
      throw new Error(
        `유료 리포트 필드 '${key}' 가 비었거나 너무 짧습니다(${strFields[key].length}자).`
      );
    }
  }
  return {
    daily_domains: readDailyDomains(o.daily_domains),
    loop_stages: readLoopStages(o.loop_stages),
    ...strFields,
    reparenting: readReparenting(o.reparenting),
  };
}

/**
 * 채점 결과(ScoreResult)를 받아 유료 리포트 생성 필드를 만든다.
 * 실패(타임아웃·JSON 깨짐·필드 미달) 시 throw — 호출 측(라우트)이 재시도/500 을 판단한다.
 */
export async function generateInnerChildPaidReport(
  score: ScoreResult
): Promise<PaidReportGenerated> {
  const primaryCard = getTypeCard(score.primary_child.schema_id);
  if (!primaryCard) {
    throw new Error(
      `대표 유형카드를 찾을 수 없습니다: ${score.primary_child.schema_id}`
    );
  }
  const secondSchemaId = score.secondary_children[0]?.schema_id;
  const secondCard = secondSchemaId ? getTypeCard(secondSchemaId) : null;

  const response = await chatCompletion(
    [
      { role: "system", content: PAID_SYSTEM_PROMPT },
      { role: "user", content: buildPaidUserMessage(score, primaryCard, secondCard) },
    ],
    {
      // 유료 상품 — 품질 우선. pro + 넉넉한 토큰(한국어 토큰 비효율 + 9필드 MBTI식 상세 서술).
      model: "gemini-2.5-pro",
      temperature: 0.6,
      max_tokens: 24576,
      response_format: { type: "json_object" },
    }
  );

  const parsed = safeJsonParse<Record<string, unknown>>(response);
  return readPaidReport(parsed);
}
