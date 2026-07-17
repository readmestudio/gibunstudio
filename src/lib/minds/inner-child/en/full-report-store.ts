/**
 * 영어 full 리포트 저장 — minds_leads.parts_map.manual_report 에 병합 기록.
 *
 * 조회는 manual-report-store.ts(getManualReport). 여기는 자동 생성 파이프라인이 원고를 쓰는 쪽.
 *
 * ⚠️ 병합 저장이 핵심: parts_map 에는 이미 무료 리포트 블롭(test_version·score_result·
 *    free_report·concern)이 들어 있다. 통째로 덮어쓰면 무료 리포트가 날아가므로, 기존 parts_map
 *    을 읽어 manual_report 키만 얹어 되쓴다(수동 등록 스크립트 put-en-manual-report.js 와 동일 원칙).
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { ManualReport } from "./manual-reports";

/** manual_report 를 기존 parts_map 에 병합해 저장. 성공 여부 반환(실패해도 throw 안 함). */
export async function saveManualReport(
  leadId: string,
  report: ManualReport,
): Promise<boolean> {
  if (!leadId) return false;
  try {
    const admin = createAdminClient();
    const { data, error: readErr } = await admin
      .from("minds_leads")
      .select("parts_map")
      .eq("id", leadId)
      .maybeSingle();
    if (readErr) {
      console.error("[inner-child/en] parts_map 조회 실패(저장 중단):", readErr);
      return false;
    }
    const existing =
      data?.parts_map && typeof data.parts_map === "object"
        ? (data.parts_map as Record<string, unknown>)
        : {};
    const { error: writeErr } = await admin
      .from("minds_leads")
      .update({ parts_map: { ...existing, manual_report: report } })
      .eq("id", leadId);
    if (writeErr) {
      console.error("[inner-child/en] manual_report 저장 실패:", writeErr);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[inner-child/en] manual_report 저장 예외:", err);
    return false;
  }
}
