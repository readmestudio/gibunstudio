"use client";

import { useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { WORKBOOK_CATALOG, type WorkbookInfo } from "@/lib/self-workshop/workbook-catalog";
import { NotifyButton } from "@/components/NotifyButton";

const NICEPAY_CLIENT_ID = process.env.NEXT_PUBLIC_NICEPAY_MERCHANT_ID || "";
const NICEPAY_SDK_URL =
  process.env.NEXT_PUBLIC_NICEPAY_SDK_URL || "https://pay.nicepay.co.kr/v1/js/";

export function WorkbookStorePage() {
  const [activeId, setActiveId] = useState(WORKBOOK_CATALOG[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  const active = WORKBOOK_CATALOG.find((w) => w.id === activeId)!;

  function handleCardPayment(workbook: WorkbookInfo) {
    if (workbook.comingSoon) return;
    if (!NICEPAY_CLIENT_ID) {
      alert("결제 모듈이 아직 설정되지 않았어요. 잠시 후 다시 시도해주세요.");
      return;
    }
    if (!window.AUTHNICE) {
      alert("결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setIsSubmitting(true);

    const orderId = `${workbook.slug.toUpperCase()}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;

    window.AUTHNICE.requestPay({
      clientId: NICEPAY_CLIENT_ID,
      method: "card",
      orderId,
      amount: workbook.price,
      goodsName: `마음 챙김 워크북 - ${workbook.title}`,
      returnUrl: `${window.location.origin}/payment/self-workshop/complete`,
      fnError: (result: { errorMsg: string }) => {
        console.error("NicePay 에러:", result);
        alert(`결제 오류: ${result.errorMsg}`);
        setIsSubmitting(false);
      },
    });
  }

  return (
    <div className="min-h-screen bg-white">
      {/* NicePay SDK */}
      {NICEPAY_CLIENT_ID && (
        <Script
          src={NICEPAY_SDK_URL}
          strategy="afterInteractive"
          onLoad={() => setSdkLoaded(true)}
          onReady={() => setSdkLoaded(true)}
        />
      )}

      {/* 페이지 헤더 */}
      <div className="px-4 pt-16 pb-8 text-center">
        <h1 className="text-3xl font-bold text-[var(--foreground)] md:text-4xl">
          마음 챙김 워크북
        </h1>
        <p className="mt-3 text-base text-[var(--foreground)]/70">
          나의 마음 패턴을 이해하고, 스스로 대처법을 찾아가는 셀프 워크북
        </p>
      </div>

      {/* 탭 */}
      <div className="sticky top-0 z-10 bg-white border-b border-[var(--foreground)]/10">
        <div className="mx-auto max-w-2xl overflow-x-auto">
          <div className="flex justify-center gap-0 min-w-max px-4">
            {WORKBOOK_CATALOG.map((wb) => (
              <button
                key={wb.id}
                onClick={() => setActiveId(wb.id)}
                className={`relative px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeId === wb.id
                    ? "text-[var(--foreground)] font-semibold"
                    : "text-[var(--foreground)]/50 hover:text-[var(--foreground)]/80"
                }`}
              >
                {wb.title}
                {wb.comingSoon && (
                  <span className="ml-1.5 text-[10px] text-[var(--foreground)]/40">
                    soon
                  </span>
                )}
                {/* 활성 탭 언더라인 */}
                {activeId === wb.id && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[3px] w-10 bg-[var(--foreground)] rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 상세 콘텐츠 */}
      <div className="mx-auto max-w-xl px-4 py-12">
        {/* 타이틀 영역 */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-[var(--foreground)] md:text-3xl">
            {active.title}
          </h2>
          <p className="mt-2 text-base text-[var(--foreground)]/60">
            {active.subtitle}
          </p>
          <div className="mx-auto mt-4 h-[3px] w-8 bg-[var(--foreground)]/30 rounded-full" />
        </div>

        {/* 설명 */}
        <p className="text-sm leading-relaxed text-[var(--foreground)]/80 text-center mb-10">
          {active.description}
        </p>

        {/* 포함 내용 카드 */}
        <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6 mb-6">
          <p className="text-sm text-[var(--foreground)]/60 mb-1">결제 금액</p>
          <p className="text-3xl font-bold text-[var(--foreground)]">
            {active.price.toLocaleString()}원
          </p>

          <ul className="mt-5 space-y-2.5">
            {active.features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2 text-sm text-[var(--foreground)]/80"
              >
                <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--foreground)]" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-4 text-xs text-[var(--foreground)]/50">
            <span>소요 시간: {active.estimatedMinutes}</span>
            <span>컨텐츠 조회 기간: 결제 후 90일</span>
          </div>
        </div>

        {/* CTA */}
        {active.comingSoon ? (
          <div className="text-center">
            <NotifyButton programId={active.id} programTitle={`마음 챙김 워크북 - ${active.title}`} />
            <p className="mt-3 text-xs text-[var(--foreground)]/50">
              오픈 시 알림을 받으실 수 있어요
            </p>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => handleCardPayment(active)}
              disabled={isSubmitting || (!!NICEPAY_CLIENT_ID && !sdkLoaded)}
              className="w-full rounded-xl border-2 border-[var(--foreground)] bg-white px-6 py-4 text-base font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? "결제 진행 중..."
                : NICEPAY_CLIENT_ID && !sdkLoaded
                  ? "결제 모듈 로딩 중..."
                  : "구매하기"}
            </button>
            <p className="mt-3 text-center text-xs text-[var(--foreground)]/50">
              결제는 NicePay를 통해 안전하게 처리됩니다.
            </p>
          </>
        )}

        {/* 돌아가기 */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-[var(--foreground)]/60 underline hover:text-[var(--foreground)]"
          >
            돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
