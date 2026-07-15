/**
 * 손원고 유료 리포트 조회 — minds_leads.parts_map.manual_report.
 *
 * 무료 리포트의 `free-report-store.ts` 와 같은 자리다(같은 테이블·같은 jsonb 컬럼의 다른 키).
 * 형태 검증/만료 판정은 `manual-reports.ts`(순수)에 있다 — 여기는 DB 왕복만 한다.
 *
 * ⚠️ 원고는 개인정보라 코드가 아니라 DB 에만 있다. 등록: `scripts/put-en-manual-report.js`
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { readManualReport, type ManualReport } from "./manual-reports";

/** leadId → 손으로 쓴 리포트. 없거나 깨졌으면 null(호출부가 "준비 중" 안내). */
export async function getManualReport(leadId: string): Promise<ManualReport | null> {
  if (!leadId) return null;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("minds_leads")
      .select("parts_map")
      .eq("id", leadId)
      .maybeSingle();
    if (error || !data?.parts_map) return null;
    const partsMap = data.parts_map as Record<string, unknown>;
    return readManualReport(partsMap.manual_report);
  } catch (err) {
    console.error("[inner-child/en] manual_report 조회 실패:", err);
    return null;
  }
}
