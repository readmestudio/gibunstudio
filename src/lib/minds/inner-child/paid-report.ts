/**
 * 내면 아이 유료 리포트 엔진 (₩19,900) — 생성 5필드 + 정규화 리더.
 *
 * 무료 리포트는 flash + 2필드(gap·relation_pattern)로 가볍게 만든다. 유료는 pro + 5필드
 * (loop_narrative·second_child_relation·guardian_anatomy·core_need_bridge·closing)로 깊게
 * 파고들어, 결제 레코드(minds_relationship_purchases.report_json)에 1회 캐시된다.
 *
 * 설계 원칙(relationship-report.ts 미러):
 *  - 유료 산출물이라 **폴백 없음**. 5필드 중 하나라도 비거나 지나치게 짧으면 readPaidReport 가
 *    throw 하고, 호출 측(라우트)이 재시도(2회)를 판단한다.
 *  - 채점 결과(ScoreResult) + 유형카드 2장(대표·두번째)만 프롬프트에 주입한다.
 */

import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import { PAID_SYSTEM_PROMPT, buildPaidUserMessage } from "./paid-report-prompt";
import { getTypeCard } from "./type-cards";
import type { PaidReportGenerated } from "./report-types";
import type { ScoreResult } from "./types";

/** 5필드 각각의 최소 유효 길이(자). 이보다 짧으면 생성이 잘렸거나 빈 것으로 보고 재시도. */
const MIN_LEN: Record<keyof PaidReportGenerated, number> = {
  loop_narrative: 120,
  second_child_relation: 60,
  guardian_anatomy: 100,
  core_need_bridge: 40,
  closing: 40,
};

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

/**
 * LLM 응답(unknown)을 PaidReportGenerated 로 정규화한다. 5필드가 모두 존재하고 최소 길이를
 * 넘어야 통과한다 — 하나라도 미달이면 throw(유료라 폴백 없음, 라우트가 재시도).
 * 캐시된 report_json 을 렌더 전에 다시 통과시켜 스키마 안정성을 보장하는 데도 쓴다.
 */
export function readPaidReport(parsed: unknown): PaidReportGenerated {
  if (!parsed || typeof parsed !== "object") {
    throw new Error("유료 리포트 응답이 객체가 아닙니다.");
  }
  const o = parsed as Record<string, unknown>;
  const report: PaidReportGenerated = {
    loop_narrative: str(o.loop_narrative),
    second_child_relation: str(o.second_child_relation),
    guardian_anatomy: str(o.guardian_anatomy),
    core_need_bridge: str(o.core_need_bridge),
    closing: str(o.closing),
  };

  for (const key of Object.keys(MIN_LEN) as (keyof PaidReportGenerated)[]) {
    if (report[key].length < MIN_LEN[key]) {
      throw new Error(
        `유료 리포트 필드 '${key}' 가 비었거나 너무 짧습니다(${report[key].length}자).`
      );
    }
  }
  return report;
}

/**
 * 채점 결과(ScoreResult)를 받아 유료 리포트 생성 5필드를 만든다.
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
      // 유료 상품 — 품질 우선. pro + 넉넉한 토큰(한국어 토큰 비효율 + 5필드 서술).
      model: "gemini-2.5-pro",
      temperature: 0.6,
      max_tokens: 16384,
      response_format: { type: "json_object" },
    }
  );

  const parsed = safeJsonParse<Record<string, unknown>>(response);
  return readPaidReport(parsed);
}
