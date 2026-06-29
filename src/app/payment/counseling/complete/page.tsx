import Link from "next/link";
import { KAKAO_CHANNEL_URL } from "@/app/programs/counseling/content";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "상담 결제 완료",
};

/**
 * 상담 결제 완료 안내.
 *
 * 워크북과 동일하게 "사전 설문 제출 → 상담사 배정 → 카카오톡 연락" 흐름으로 안내한다.
 * order 파라미터로 설문 제출 여부를 확인해 두 갈래로 분기:
 *   · 설문 미제출 → "사전 설문 작성하러 가기" 유도
 *   · 설문 제출됨 → 접수 안내 + 카카오톡 채널 추가
 * order 가 없거나 결제를 못 찾으면(직접 진입 등) 설문 단계 없이 일반 안내만 보여준다.
 */
export default async function CounselingPaymentCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  const orderId = (order ?? "").trim();

  // order 가 있으면 결제·설문 제출 여부를 확인한다(비로그인 결제 대응 → admin).
  let hasPurchase = false;
  let surveyDone = false;
  if (orderId) {
    const admin = createAdminClient();
    const { data: purchase } = await admin
      .from("counseling_purchases")
      .select("order_id")
      .eq("order_id", orderId)
      .eq("status", "confirmed")
      .maybeSingle();
    hasPurchase = !!purchase;

    if (hasPurchase) {
      const { data: survey } = await admin
        .from("counseling_survey_responses")
        .select("id")
        .eq("order_id", orderId)
        .maybeSingle();
      surveyDone = !!survey;
    }
  }

  // 설문 단계를 안내할 수 있는 경우(결제 확인됨 + 미제출)
  const showSurveyCta = hasPurchase && !surveyDone;

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      {/* 완료 체크 아이콘 */}
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--foreground)]">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-[var(--foreground)]">
        결제가 완료되었습니다
      </h1>
      <p className="mt-4 break-keep text-base leading-relaxed text-[var(--foreground)]/80">
        상담을 신청해 주셔서 진심으로 감사합니다.
        <br />
        사전 설문을 작성해 주시면 가장 잘 맞는 상담사를 배정해 드려요.
      </p>

      {/* 안내 박스 — 진행 순서 3단계 */}
      <div className="mt-8 rounded-xl border-2 border-[var(--foreground)]/20 bg-white p-6 text-left">
        <p className="text-sm font-semibold text-[var(--foreground)]">
          이렇게 진행돼요
        </p>
        <ol className="mt-3 space-y-2.5 text-sm leading-relaxed text-[var(--foreground)]/70">
          <li className="flex gap-2">
            <span className="font-semibold text-[var(--foreground)]">1.</span>
            <span className="break-keep">
              아래 버튼을 눌러 사전 설문을 작성·제출해 주세요.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-[var(--foreground)]">2.</span>
            <span className="break-keep">
              답변을 바탕으로 고민과 상황에 가장 잘 맞는 심리 상담사를
              배정합니다.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-[var(--foreground)]">3.</span>
            <span className="break-keep">
              배정된 상담사가 상담 시간 조율과 사전 인터뷰를 위해 카카오톡으로
              연락드립니다.
            </span>
          </li>
        </ol>
      </div>

      {surveyDone ? (
        /* 설문 제출 완료 → 접수 안내 + 카카오톡 채널 추가 */
        <>
          <div className="mt-8 rounded-xl border-2 border-[var(--foreground)]/10 bg-[var(--surface)] p-5">
            <p className="break-keep text-sm font-semibold text-[var(--foreground)]">
              설문이 잘 접수되었어요 ✓
            </p>
            <p className="mt-1.5 break-keep text-sm leading-relaxed text-[var(--foreground)]/60">
              지금부터 가장 잘 맞는 심리 상담사를 배정합니다. 배정이 완료되면
              담당 상담사가 카카오톡으로 연락드릴게요.
            </p>
          </div>

          <a
            href={KAKAO_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-4 text-base font-bold text-[var(--foreground)] transition-transform hover:-translate-y-0.5"
          >
            <span aria-hidden>💬</span> 카카오톡 채널 추가하고 알림 받기
          </a>
          <p className="mt-3 break-keep text-xs leading-relaxed text-[var(--foreground)]/55">
            상담사 연락을 카카오톡으로 보내드려요. 채널을 미리 추가해 두시면
            놓치지 않고 받아보실 수 있어요.
          </p>
        </>
      ) : showSurveyCta ? (
        /* 설문 미제출 → 사전 설문 작성 유도 */
        <>
          <Link
            href={`/payment/counseling/survey?order=${encodeURIComponent(orderId)}`}
            className="mt-8 inline-flex w-full items-center justify-center rounded-xl border-2 border-[var(--foreground)] bg-[var(--foreground)] px-6 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90"
          >
            사전 설문 작성하러 가기
          </Link>
          <p className="mt-3 break-keep text-xs leading-relaxed text-[var(--foreground)]/55">
            설문을 제출해 주시면 영업일 기준 빠르게 상담사를 배정해 연락드려요.
          </p>
        </>
      ) : (
        /* order 없음/결제 확인 불가 → 카카오톡 안내만 */
        <a
          href={KAKAO_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-4 text-base font-bold text-[var(--foreground)] transition-transform hover:-translate-y-0.5"
        >
          <span aria-hidden>💬</span> 카카오톡 채널로 문의하기
        </a>
      )}

      <Link
        href="/dashboard"
        className="mt-6 inline-flex w-full items-center justify-center rounded-xl border-2 border-[var(--foreground)] px-6 py-4 text-base font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
      >
        대시보드로 이동
      </Link>
    </div>
  );
}
