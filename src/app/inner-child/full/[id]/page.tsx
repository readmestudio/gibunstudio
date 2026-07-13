/**
 * /inner-child/full/[id] — 유료 "내면 아이 심층 리포트" (₩9,900).
 *
 * [id] 는 minds_relationship_purchases 의 결제 레코드 UUID(order_id prefix IC-). 결제 승인 후
 * NicePay return 라우트가 이 페이지로 리다이렉트한다. 운영자가 문의 유저에게 전달하는 영구
 * 링크이기도 하다.
 *
 * /minds/relationship/[id] 와 동형이되 두 가지 가드가 다르다:
 *  - 역가드: order_id 가 IC- 로 시작하지 않으면(=다섯 배역 MR- 구매) 그쪽 페이지로 redirect.
 *  - 소유권: user_id 있고 세션 불일치면 /login?next= 로 redirect.
 *
 * 서버에서 결제 상태·캐시된 report_json 을 미리 읽어 넘긴다:
 *  - confirmed + report_json 있음 → 즉시 렌더(재방문·공유 시 대기 0).
 *  - confirmed + report_json 없음 → 클라이언트가 생성 라우트를 호출(최초 1회, ~30초).
 *  - 그 외(미결제/없음) → 클라이언트가 안내.
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { readPaidReport } from "@/lib/minds/inner-child/paid-report";
import { getSavedFreeReport } from "@/lib/minds/inner-child/free-report-store";
import type { PaidReportGenerated } from "@/lib/minds/inner-child/report-types";
import type { ScoreResult } from "@/lib/minds/inner-child/types";
import { InnerChildPaidView } from "./InnerChildPaidView";
import { ReportPurchasePixel } from "@/components/analytics/ReportPurchasePixel";
import { PURCHASE_PIXEL_WINDOW_MS } from "@/lib/minds/relationship-constants";

export const metadata: Metadata = {
  title: "내면 아이 심층 리포트 · 기분",
  robots: { index: false, follow: false },
};

export default async function InnerChildFullPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let status: string | null = null;
  let initialReport: PaidReportGenerated | null = null;
  let ownerId: string | null = null;
  let leadId: string | null = null;
  let orderId: string | null = null;
  let amount: number | null = null;
  let paidAt: string | null = null;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("minds_relationship_purchases")
      .select("status, report_json, user_id, order_id, lead_id, amount, paid_at")
      .eq("id", id)
      .maybeSingle();
    if (data) {
      status = data.status;
      ownerId = (data.user_id as string | null) ?? null;
      orderId = (data.order_id as string | null) ?? null;
      leadId = (data.lead_id as string | null) ?? null;
      amount = (data.amount as number | null) ?? null;
      paidAt = (data.paid_at as string | null) ?? null;
      // 캐시된 report_json 은 렌더 전에 반드시 현재 스키마로 정규화한다(그냥 캐스팅 금지).
      // 깨진 캐시면 초기값 없이 넘겨 클라이언트가 재생성한다.
      if (data.report_json) {
        try {
          initialReport = readPaidReport(data.report_json);
        } catch {
          initialReport = null;
        }
      }
    }
  } catch {
    // 조회 실패 — 클라이언트가 생성 호출로 재시도/안내.
  }

  // 역가드 — MR-(다섯 배역) 링크가 이 경로로 잘못 들어오면 그쪽 리포트로 보낸다.
  // 조회 자체가 안 된 경우(orderId=null)는 클라이언트 안내에 맡긴다(무한 redirect 방지).
  if (orderId && !orderId.startsWith("IC-")) {
    redirect(`/minds/relationship/${id}`);
  }

  // 소유권 — 계정에 묶인 리포트는 주인만 볼 수 있다(URL 만 알면 보던 구조 보완).
  // 비로그인으로 결제했던 과거 건(ownerId=null)은 그대로 링크로 접근 가능(하위호환).
  if (ownerId) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || user.id !== ownerId) {
      redirect(`/login?next=/inner-child/full/${id}`);
    }
  }

  // 고정 섹션(카드/지킴이 블록)에 필요한 채점 결과를 함께 넘긴다. 유료 리포트가 뜨는 건
  // 무료 리포트가 저장된 뒤이므로 거의 항상 존재한다.
  let score: ScoreResult | null = null;
  if (leadId) {
    const blob = await getSavedFreeReport(leadId);
    score = blob?.score_result ?? null;
  }

  // 유료광고 Purchase 전환 신호 — 결제 직후(paid_at 최근 24h) 조회에서만 켠다.
  // 며칠 뒤 재방문엔 렌더 안 됨. 창 안 중복 발화는 eventID(결제 id)로 메타가 1건 처리.
  const firePurchasePixel =
    status === "confirmed" &&
    amount != null &&
    paidAt != null &&
    Date.now() - new Date(paidAt).getTime() < PURCHASE_PIXEL_WINDOW_MS;

  return (
    <>
      {firePurchasePixel && (
        <ReportPurchasePixel
          amount={amount!}
          contentName="inner_child_full"
          eventId={id}
        />
      )}
      <InnerChildPaidView
        purchaseId={id}
        status={status}
        initialReport={initialReport}
        score={score}
      />
    </>
  );
}
