/**
 * /inner-child/r/[id] — 저장된 내면 아이 무료 리포트 다시보기 (로그인 없이, 링크 접근).
 *
 * [id] 는 minds_leads 의 leadId(UUID). 서버에서 admin 으로 parts_map(FreeReportBlob)을
 * 읽어 그대로 렌더하므로 새로고침·북마크·공유 어디서든 같은 결과를 다시 볼 수 있다.
 * 결과가 없으면 클라이언트 뷰가 친절한 안내를 보여주고 저장키를 정리한다.
 */

import type { Metadata } from "next";
import { getSavedFreeReport } from "@/lib/minds/inner-child/free-report-store";
import { createAdminClient } from "@/lib/supabase/admin";
import { InnerChildResultView } from "./InnerChildResultView";

export const metadata: Metadata = {
  title: "내 내면 아이 결과 · 기분",
  robots: { index: false, follow: false },
};

export default async function InnerChildResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const blob = await getSavedFreeReport(id);

  // 복구 브릿지 — 이 리드로 이미 유료 리포트를 결제(confirmed)했다면, 그 구매 UUID 를 찾아
  // 무료 리포트 화면에 "유료 리포트 다시 보기" 버튼으로 노출한다. 비로그인 구매자도 무료
  // 링크(leadId)만 있으면 유료 리포트를 되찾을 수 있게 하는 경로(로그인 강제 없음).
  let paidPurchaseId: string | null = null;
  try {
    const admin = createAdminClient();
    const { data: purchase } = await admin
      .from("minds_relationship_purchases")
      .select("id, created_at")
      .eq("lead_id", id)
      .eq("status", "confirmed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    paidPurchaseId = (purchase?.id as string | null) ?? null;
  } catch {
    // 조회 실패는 무시 — 복구 버튼만 안 뜰 뿐, 무료 리포트는 정상 렌더.
  }

  return <InnerChildResultView leadId={id} blob={blob} paidPurchaseId={paidPurchaseId} />;
}
