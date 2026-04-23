"use client";

import { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { WORKBOOK_CATALOG } from "@/lib/self-workshop/workbook-catalog";
import { NotifyButton } from "@/components/NotifyButton";
import { DiscountPriceDisplay } from "@/components/self-workshop/landing/DiscountPriceDisplay";

const NICEPAY_CLIENT_ID = process.env.NEXT_PUBLIC_NICEPAY_MERCHANT_ID || "";
const NICEPAY_SDK_URL =
  process.env.NEXT_PUBLIC_NICEPAY_SDK_URL || "https://pay.nicepay.co.kr/v1/js/";

/* ──────────────────────────────────────────────
   메인 WorkbookStorePage
   ────────────────────────────────────────────── */
export function WorkbookStorePage() {
  const [activeId, setActiveId] = useState(WORKBOOK_CATALOG[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  const active = WORKBOOK_CATALOG.find((w) => w.id === activeId)!;

  async function handlePayment() {
    if (!NICEPAY_CLIENT_ID) {
      alert("결제 모듈이 아직 설정되지 않았어요. 잠시 후 다시 시도해주세요.");
      return;
    }
    if (!window.AUTHNICE) {
      alert("결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/payment/workshop/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshopType: active.id,
          amount: active.price,
        }),
      });
      const data = await res.json();

      if (res.status === 401) {
        alert("로그인 후 결제를 진행해주세요.");
        window.location.href = `/login?next=${encodeURIComponent("/payment/self-workshop")}`;
        return;
      }

      if (data.already_purchased) {
        alert("이미 구매한 워크북입니다. 대시보드에서 이어가세요.");
        window.location.href = "/dashboard/self-workshop/step/3";
        return;
      }

      if (!data.order_id) {
        throw new Error(data.error || "결제 레코드 생성에 실패했습니다");
      }

      window.AUTHNICE.requestPay({
        clientId: NICEPAY_CLIENT_ID,
        method: "cardAndEasyPay",
        orderId: data.order_id,
        amount: active.price,
        goodsName: `마음 챙김 워크북 - ${active.title}`,
        returnUrl: `${window.location.origin}/api/payment/nicepay/return`,
        fnError: (result: { errorMsg: string }) => {
          console.error("NicePay 에러:", result);
          alert(`결제 오류: ${result.errorMsg}`);
          setIsSubmitting(false);
        },
      });
    } catch (err) {
      console.error("결제 시작 오류:", err);
      alert("결제를 시작할 수 없습니다. 잠시 후 다시 시도해주세요.");
      setIsSubmitting(false);
    }
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

      {/* 워크북 탭 선택기 */}
      <div className="mx-auto max-w-2xl px-4">
        <div
          role="tablist"
          aria-label="워크북 선택"
          className="flex flex-wrap gap-2 justify-center"
        >
          {WORKBOOK_CATALOG.map((wb) => {
            const isActive = activeId === wb.id;
            return (
              <button
                key={wb.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveId(wb.id)}
                className={
                  isActive
                    ? "inline-flex items-center gap-1.5 rounded-full border-2 border-[var(--foreground)] bg-[var(--foreground)] px-4 py-2 text-sm font-bold text-white"
                    : "inline-flex items-center gap-1.5 rounded-full border-2 border-[var(--foreground)]/20 bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)]/60 hover:border-[var(--foreground)]/50 hover:text-[var(--foreground)]"
                }
              >
                <span>{wb.title}</span>
                {wb.comingSoon && (
                  <span
                    className={
                      isActive
                        ? "text-[10px] font-medium text-white/70"
                        : "text-[10px] font-medium text-[var(--foreground)]/40"
                    }
                  >
                    · Coming Soon
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 상세 콘텐츠 */}
      <div key={activeId} className="mx-auto max-w-xl px-4 py-12">
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
          <p className="text-sm text-[var(--foreground)]/60 mb-3">결제 금액</p>
          {active.originalPrice && active.originalPrice > active.price ? (
            <DiscountPriceDisplay
              originalPrice={active.originalPrice}
              price={active.price}
              discountPercent={Math.round(
                (1 - active.price / active.originalPrice) * 100
              )}
              size="lg"
            />
          ) : (
            <p className="text-3xl font-bold text-[var(--foreground)]">
              {active.price.toLocaleString()}원
            </p>
          )}

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
          <button
            type="button"
            onClick={handlePayment}
            disabled={isSubmitting || (!!NICEPAY_CLIENT_ID && !sdkLoaded)}
            className="block w-full rounded-xl bg-[var(--foreground)] px-6 py-4 text-center text-base font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting
              ? "결제 진행 중..."
              : NICEPAY_CLIENT_ID && !sdkLoaded
                ? "결제 모듈 로딩 중..."
                : "결제하기"}
          </button>
        )}
        <p className="mt-3 text-center text-xs text-[var(--foreground)]/50">
          결제는 NicePay를 통해 안전하게 처리됩니다.
        </p>

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
