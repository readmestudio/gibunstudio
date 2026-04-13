"use client";

import { useState } from "react";
import Script from "next/script";
import Link from "next/link";

const NICEPAY_CLIENT_ID = process.env.NEXT_PUBLIC_NICEPAY_MERCHANT_ID || "";
const NICEPAY_SDK_URL =
  process.env.NEXT_PUBLIC_NICEPAY_SDK_URL || "https://pay.nicepay.co.kr/v1/js/";

const WORKSHOP_PRICE = 99000;

/**
 * 진단 완료 후 결과 접근 전 결제를 유도하는 게이트 컴포넌트
 */
export function WorkshopPaymentGate() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  async function handlePayment() {
    if (!NICEPAY_CLIENT_ID || !window.AUTHNICE) {
      alert("결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. 결제 레코드 먼저 생성
      const res = await fetch("/api/payment/workshop/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshopType: "achievement-addiction",
          amount: WORKSHOP_PRICE,
        }),
      });

      const data = await res.json();

      if (data.already_purchased) {
        // 이미 구매됨 → 새로고침으로 결과 표시
        window.location.reload();
        return;
      }

      if (!data.order_id) {
        throw new Error(data.error || "결제 레코드 생성에 실패했습니다");
      }

      // 2. NicePay 결제창 호출
      window.AUTHNICE.requestPay({
        clientId: NICEPAY_CLIENT_ID,
        method: "card",
        orderId: data.order_id,
        amount: WORKSHOP_PRICE,
        goodsName: "마음 챙김 워크북 - 성취 중독",
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
    <div className="mx-auto max-w-lg space-y-8">
      {/* NicePay SDK */}
      {NICEPAY_CLIENT_ID && (
        <Script
          src={NICEPAY_SDK_URL}
          strategy="afterInteractive"
          onLoad={() => setSdkLoaded(true)}
          onReady={() => setSdkLoaded(true)}
        />
      )}

      {/* 진단 완료 메시지 */}
      <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--foreground)]">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[var(--foreground)]">
          진단이 완료되었습니다
        </h2>
        <p className="mt-2 text-sm text-[var(--foreground)]/60">
          결과 확인과 전체 워크북을 진행하려면 구매가 필요합니다.
        </p>
      </div>

      {/* 가격 + 포함 내용 */}
      <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
        <p className="text-sm text-[var(--foreground)]/60 mb-1">결제 금액</p>
        <p className="text-3xl font-bold text-[var(--foreground)]">
          {WORKSHOP_PRICE.toLocaleString()}원
        </p>

        <ul className="mt-5 space-y-2.5">
          {FEATURES.map((feature) => (
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
          <span>소요 시간: 65~100분</span>
          <span>컨텐츠 조회 기간: 결제 후 90일</span>
        </div>
      </div>

      {/* 결제 버튼 */}
      <button
        type="button"
        onClick={handlePayment}
        disabled={isSubmitting || (!!NICEPAY_CLIENT_ID && !sdkLoaded)}
        className="w-full rounded-xl border-2 border-[var(--foreground)] bg-white px-6 py-4 text-base font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting
          ? "결제 진행 중..."
          : NICEPAY_CLIENT_ID && !sdkLoaded
            ? "결제 모듈 로딩 중..."
            : "구매하기"}
      </button>
      <p className="text-center text-xs text-[var(--foreground)]/50">
        결제는 NicePay를 통해 안전하게 처리됩니다.
      </p>

      {/* 돌아가기 */}
      <div className="text-center">
        <Link
          href="/dashboard"
          className="text-sm text-[var(--foreground)]/60 underline hover:text-[var(--foreground)]"
        >
          대시보드로 돌아가기
        </Link>
      </div>
    </div>
  );
}

const FEATURES = [
  "나의 진단 결과 + 성취 중독 이해",
  "나의 메커니즘 분석 + AI 교차검증",
  "인지 재구조화 · 행동 실험 · 자기 돌봄 워크시트",
  "전체 요약 리포트",
];
