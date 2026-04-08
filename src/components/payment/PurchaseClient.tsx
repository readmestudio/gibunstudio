"use client";

import { useState } from "react";
import Script from "next/script";
import Link from "next/link";

const NICEPAY_CLIENT_ID = process.env.NEXT_PUBLIC_NICEPAY_MERCHANT_ID || "";
const NICEPAY_SDK_URL =
  process.env.NEXT_PUBLIC_NICEPAY_SDK_URL || "https://pay.nicepay.co.kr/v1/js/";

interface PurchaseClientProps {
  /** 주문번호 prefix 및 returnUrl 경로에 사용할 슬러그 (예: "self-workshop") */
  slug: string;
  /** 페이지 상단 타이틀 */
  title: string;
  /** 한 줄 설명 */
  description: string;
  /** 결제 금액 (원) */
  amount: number;
  /** NicePay에 전달할 상품명 */
  goodsName: string;
  /** 카드 위에 표시할 핵심 혜택 (선택) */
  features?: string[];
}

export function PurchaseClient({
  slug,
  title,
  description,
  amount,
  goodsName,
  features = [],
}: PurchaseClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  const handleCardPayment = () => {
    if (!NICEPAY_CLIENT_ID) {
      alert("결제 모듈이 아직 설정되지 않았어요. 잠시 후 다시 시도해주세요.");
      return;
    }
    if (!window.AUTHNICE) {
      alert("결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setIsSubmitting(true);

    // 클라이언트 측 주문번호 생성 (백엔드 결제 기록 없이 NicePay 결제창만 호출)
    const orderId = `${slug.toUpperCase()}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`;

    window.AUTHNICE.requestPay({
      clientId: NICEPAY_CLIENT_ID,
      method: "card",
      orderId,
      amount,
      goodsName,
      returnUrl: `${window.location.origin}/payment/${slug}/complete`,
      fnError: (result: { errorMsg: string }) => {
        console.error("NicePay 에러:", result);
        alert(`결제 오류: ${result.errorMsg}`);
        setIsSubmitting(false);
      },
    });
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      {/* NicePay SDK 로드 */}
      {NICEPAY_CLIENT_ID && (
        <Script
          src={NICEPAY_SDK_URL}
          strategy="afterInteractive"
          onLoad={() => setSdkLoaded(true)}
          onReady={() => setSdkLoaded(true)}
        />
      )}

      <h1 className="text-2xl font-bold text-[var(--foreground)]">{title}</h1>
      <p className="mt-2 text-[var(--foreground)]/70">{description}</p>

      {/* 가격 */}
      <div className="mt-8 rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
        <p className="text-sm text-[var(--foreground)]/60">결제 금액</p>
        <p className="mt-1 text-3xl font-bold text-[var(--foreground)]">
          {amount.toLocaleString()}원
        </p>

        {features.length > 0 && (
          <ul className="mt-5 space-y-2">
            {features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2 text-sm text-[var(--foreground)]/80"
              >
                <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--foreground)]" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-5 border-t border-[var(--border)] pt-4 text-sm text-[var(--foreground)]/70">
          컨텐츠 조회 및 다운로드 기간은 결제 후 90일간 가능합니다.
        </p>
      </div>

      {/* 카드 결제 버튼 */}
      <button
        type="button"
        onClick={handleCardPayment}
        disabled={isSubmitting || (!!NICEPAY_CLIENT_ID && !sdkLoaded)}
        className="mt-8 w-full rounded-lg border-2 border-[var(--foreground)] bg-white px-6 py-4 font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting
          ? "결제 진행 중..."
          : NICEPAY_CLIENT_ID && !sdkLoaded
            ? "결제 모듈 로딩 중..."
            : "카드로 결제하기"}
      </button>

      <p className="mt-3 text-center text-xs text-[var(--foreground)]/50">
        결제는 NicePay를 통해 안전하게 처리됩니다.
      </p>

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="text-sm text-[var(--foreground)]/60 underline hover:text-[var(--foreground)]"
        >
          돌아가기
        </Link>
      </div>
    </div>
  );
}
