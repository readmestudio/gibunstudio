/**
 * 저장된 내면 아이 무료 리포트 조회 (서버 전용 — admin 클라이언트 사용).
 *
 * result-store.ts 의 내면아이판. 두 곳이 공유한다:
 *  - free-report 라우트: 리드당 1회 캐시(이미 v2.0 블롭이 있으면 저장본 반환, LLM 미호출)
 *  - 결과 다시보기: 페이지 /inner-child/r/[id] 서버 렌더
 *
 * minds_leads.parts_map 에는 FreeReportBlob(무료 리포트 블롭)이 저장돼 있다. /minds 의
 * PartsMap 과 구분하기 위해 test_version==="v2.0" + score_result.primary_child 존재로만
 * 유효 판정한다(캐스팅 금지, 깨진 블롭은 null).
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { FreeReportGenerated } from "./report-types";
import type { ScoreResult } from "./types";

/**
 * 저장 블롭. 위기(crisis) 응답은 LLM 을 건너뛰므로 free_report 가 없다(null).
 * free_report 유무는 소비 측(결과 뷰)이 판별한다.
 */
export interface StoredFreeReport {
  test_version: "v2.0";
  score_result: ScoreResult;
  free_report: FreeReportGenerated | null;
}

/** parts_map 원본(unknown)을 형태 검증해 StoredFreeReport 로 정규화. 깨졌으면 null. */
export function readFreeReportBlob(raw: unknown): StoredFreeReport | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.test_version !== "v2.0") return null;

  const score = o.score_result;
  if (!score || typeof score !== "object") return null;
  const primary = (score as Record<string, unknown>).primary_child;
  if (!primary || typeof primary !== "object") return null;

  const fr = o.free_report;
  let free: FreeReportGenerated | null = null;
  if (fr && typeof fr === "object") {
    const g = (fr as Record<string, unknown>).gap;
    const r = (fr as Record<string, unknown>).relation_pattern;
    const p = (fr as Record<string, unknown>).portrait;
    const ins = (fr as Record<string, unknown>).insight;
    const dp = (fr as Record<string, unknown>).daily_prediction;
    if (typeof g === "string" && typeof r === "string") {
      // portrait·insight·daily_prediction 은 옵션 — 있으면 무료 개인화 필드로 함께 넘긴다.
      free = {
        gap: g,
        relation_pattern: r,
        ...(typeof p === "string" && p ? { portrait: p } : {}),
        ...(typeof ins === "string" && ins ? { insight: ins } : {}),
        ...(typeof dp === "string" && dp ? { daily_prediction: dp } : {}),
      };
    }
  }

  return {
    test_version: "v2.0",
    score_result: score as ScoreResult,
    free_report: free,
  };
}

export async function getSavedFreeReport(
  leadId: string,
): Promise<StoredFreeReport | null> {
  if (!leadId) return null;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("minds_leads")
      .select("parts_map")
      .eq("id", leadId)
      .maybeSingle();
    if (error || !data?.parts_map) return null;
    return readFreeReportBlob(data.parts_map);
  } catch (err) {
    console.error("[inner-child] free_report 조회 실패:", err);
    return null;
  }
}
