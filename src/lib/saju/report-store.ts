import { createAdminClient } from "@/lib/supabase/admin";
import type { SajuBlob, SajuReport } from "./report-types";
import type { SajuChart } from "./types";

/**
 * 사주 블롭 저장/조회 (서버 전용 — admin 클라이언트).
 * inner-child free-report-store 패턴 재사용: minds_leads.parts_map 에 봉투를 담는다.
 * test_version==="saju-v1" + chart.four.dayMaster 존재로만 유효 판정(캐스팅 금지).
 */

export function readSajuBlob(raw: unknown): SajuBlob | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.test_version !== "saju-v1") return null;

  const chart = o.chart;
  if (!chart || typeof chart !== "object") return null;
  const four = (chart as Record<string, unknown>).four;
  if (!four || typeof four !== "object") return null;
  const dayMaster = (four as Record<string, unknown>).dayMaster;
  if (typeof dayMaster !== "string" || !dayMaster) return null;

  const rep = o.report;
  let report: SajuReport | null = null;
  if (rep && typeof rep === "object") {
    report = rep as SajuReport;
  }

  const concern = typeof o.concern === "string" && o.concern ? o.concern : null;

  return {
    test_version: "saju-v1",
    chart: chart as SajuChart,
    concern,
    report,
  };
}

export async function saveSajuBlob(leadId: string, blob: SajuBlob): Promise<boolean> {
  if (!leadId) return false;
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("minds_leads")
      .update({ parts_map: blob })
      .eq("id", leadId);
    if (error) {
      console.error("[saju] 블롭 저장 실패:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[saju] 블롭 저장 예외:", err);
    return false;
  }
}

export async function getSavedSaju(leadId: string): Promise<SajuBlob | null> {
  if (!leadId) return null;
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("minds_leads")
      .select("parts_map")
      .eq("id", leadId)
      .maybeSingle();
    if (error || !data?.parts_map) return null;
    return readSajuBlob(data.parts_map);
  } catch (err) {
    console.error("[saju] 블롭 조회 실패:", err);
    return null;
  }
}
