/**
 * /dashboard/mind-spill/period/[id]
 *
 * Period 종합 리포트 페이지 (3일치 누적).
 *  · 결제 안 했으면 → MindSpillReportPaymentGate (가치 메시지 + NicePay 결제창)
 *  · 결제 + LLM 미생성 → ReportLoading (자동 generate 트리거)
 *  · 결제 + LLM 완료 → DailyReportView (Coach + Strengths + Rx)
 */
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { canViewPeriodReport } from "@/lib/mind-spill/access";
import { DailyReportView } from "@/components/mind-spill/DailyReportView";
import { MindSpillReportPaymentGate } from "@/components/mind-spill/MindSpillReportPaymentGate";
import { ReportLoading } from "@/components/mind-spill/ReportLoading";
import { MindSpillFonts } from "@/components/mind-spill/MindSpillFonts";
import { MIND_SPILL_REPORT_PRICE } from "@/lib/mind-spill/constants";
import type { PeriodReport } from "@/lib/mind-spill/types";
import "@/components/mind-spill/mind-spill-theme.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Params = { id: string };

export default async function PeriodReportPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=/dashboard/mind-spill/period/${id}`);
  }

  const { data } = await supabase
    .from("mind_spill_period_reports")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data || data.user_id !== user.id) notFound();

  const periodReport = data as PeriodReport;
  const dateRangeLabel = formatDateRange(
    periodReport.period_start,
    periodReport.period_end
  );

  const allowed = await canViewPeriodReport(
    supabase,
    user.id,
    user.email,
    periodReport.id
  );

  // 1. 미결제 → 결제 게이트
  if (!allowed) {
    // pending purchase 조회 (period 생성 시 함께 생성됨).
    const { data: pending } = await supabase
      .from("mind_spill_period_purchases")
      .select("order_id, amount")
      .eq("period_report_id", id)
      .eq("user_id", user.id)
      .eq("status", "pending")
      .maybeSingle();

    if (!pending) {
      // pending이 없는 비정상 케이스 (테스트 유저가 아닌데 결제 미생성) → 캘린더로.
      redirect("/dashboard/mind-spill?error=period_no_pending");
    }

    return (
      <>
        <MindSpillFonts />
        <MindSpillReportPaymentGate
          periodReportId={periodReport.id}
          dateRangeLabel={dateRangeLabel}
          entryCount={periodReport.entry_ids.length}
          pendingOrderId={pending.order_id}
          amount={pending.amount ?? MIND_SPILL_REPORT_PRICE}
        />
      </>
    );
  }

  // 2. 결제 완료 + LLM 미생성 → 자동 트리거
  if (!periodReport.generated_at) {
    return (
      <>
        <MindSpillFonts />
        <ReportLoading periodReportId={periodReport.id} />
      </>
    );
  }

  // 3. 완성된 리포트
  return (
    <>
      <MindSpillFonts />
      <DailyReportView
        periodReport={periodReport}
        dateRangeLabel={dateRangeLabel}
      />
    </>
  );
}

function formatDateRange(start: string, end: string): string {
  const fmt = (iso: string) => {
    const d = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };
  if (start === end) return fmt(start);
  return `${fmt(start)}~${fmt(end)}`;
}
