import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { CounselingSurveyForm } from "@/components/counseling/CounselingSurveyForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "상담 사전 설문",
};

/**
 * 상담 사전 설문 작성 페이지.
 *
 * 결제 완료(`/payment/counseling/complete`)에서 넘어온다. order 파라미터로 실제
 * 결제(confirmed)인지 확인하고, 이미 제출했으면 완료 안내로 돌려보낸다.
 * 상담은 비로그인 결제가 가능하므로 회원 인증 대신 order_id 로 검증한다.
 */
export default async function CounselingSurveyPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  const orderId = (order ?? "").trim();

  // order 가 없으면 안내가 불가능 → 상담 페이지로.
  if (!orderId) {
    redirect("/programs/counseling");
  }

  const admin = createAdminClient();

  // 결제(confirmed) 확인 — 실제 결제 건만 설문 작성 가능.
  const { data: purchase } = await admin
    .from("counseling_purchases")
    .select("order_id, status")
    .eq("order_id", orderId)
    .eq("status", "confirmed")
    .maybeSingle();

  if (!purchase) {
    redirect("/programs/counseling");
  }

  // 이미 제출했으면 완료(접수) 안내로 보낸다(중복 작성 방지).
  const { data: existing } = await admin
    .from("counseling_survey_responses")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (existing) {
    redirect(`/payment/counseling/complete?order=${encodeURIComponent(orderId)}`);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--foreground)]/45">
          COUNSELING SURVEY
        </p>
        <h1 className="mt-2 text-2xl font-bold text-[var(--foreground)]">
          상담사 배정을 위한 사전 설문
        </h1>
        <p className="mt-3 break-keep text-sm leading-relaxed text-[var(--foreground)]/60">
          답변을 바탕으로 회원님께 가장 잘 맞는 심리 상담사를 배정해 드려요.
          <br />2~3분이면 충분합니다.
        </p>
      </header>

      <div className="mt-10">
        <CounselingSurveyForm orderId={orderId} />
      </div>
    </div>
  );
}
