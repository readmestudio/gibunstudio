"use client";

import { useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { ConsequencesSection } from "./ConsequencesSection";
import { SolutionStepsSection } from "./SolutionStepsSection";
import { WorkbookPreviewSection } from "./WorkbookPreviewSection";
import { CurriculumSection } from "./CurriculumSection";
import { WorkbookTestimonialSection } from "./WorkbookTestimonialSection";
import { StickyCtaButton } from "./StickyCtaButton";
import {
  WORKSHOP_PRICE,
  WORKBOOK_FEATURES,
} from "@/lib/self-workshop/landing-data";

const NICEPAY_CLIENT_ID = process.env.NEXT_PUBLIC_NICEPAY_MERCHANT_ID || "";
const NICEPAY_SDK_URL =
  process.env.NEXT_PUBLIC_NICEPAY_SDK_URL || "https://pay.nicepay.co.kr/v1/js/";

export function AchievementLandingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);

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
          workshopType: "achievement-addiction",
          amount: WORKSHOP_PRICE,
        }),
      });
      const data = await res.json();

      if (data.already_purchased) {
        alert("이미 구매한 워크북입니다.");
        setIsSubmitting(false);
        return;
      }

      if (!data.order_id) {
        throw new Error(data.error || "결제 레코드 생성에 실패했습니다");
      }

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

      <div className="mx-auto max-w-2xl px-4 pt-16 pb-32">
        {/* 뒤로가기 */}
        <Link
          href="/payment/self-workshop"
          className="inline-flex items-center text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)] mb-8"
        >
          ← 워크북 목록
        </Link>

        {/* Hero */}
        <section className="text-center py-12">
          <p className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-4">
            SELF WORKSHOP
          </p>
          <h1
            className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] mb-3"
            style={{ wordBreak: "keep-all" }}
          >
            성취 중독
          </h1>
          <p
            className="text-base text-[var(--foreground)]/60 mb-6 max-w-md mx-auto"
            style={{ wordBreak: "keep-all" }}
          >
            멈출 수 없는 성취 욕구, 쉼에 대한 죄책감.
            <br />
            CBT 기반으로 나만의 순환 패턴을 발견하고 대처법을 찾아보세요.
          </p>
          <div className="inline-flex items-baseline gap-1">
            <span className="text-3xl font-bold text-[var(--foreground)]">
              {WORKSHOP_PRICE.toLocaleString()}
            </span>
            <span className="text-base text-[var(--foreground)]/50">원</span>
          </div>
        </section>

        {/* 섹션 1: 방치 경고 → 전환 */}
        <ConsequencesSection />

        {/* 섹션 2: 4가지 해결 솔루션 */}
        <SolutionStepsSection />

        {/* 섹션 3: 워크북 미리보기 */}
        <WorkbookPreviewSection />

        {/* 섹션 4: 커리큘럼 */}
        <CurriculumSection />

        {/* 섹션 5: 유저 후기 */}
        <WorkbookTestimonialSection />

        {/* 가격 + 포함 내용 카드 */}
        <section className="py-16">
          <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
            <p className="text-sm text-[var(--foreground)]/60 mb-1">결제 금액</p>
            <p className="text-3xl font-bold text-[var(--foreground)]">
              {WORKSHOP_PRICE.toLocaleString()}원
            </p>

            <ul className="mt-5 space-y-2.5">
              {WORKBOOK_FEATURES.map((feature) => (
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

          <p className="mt-4 text-center text-xs text-[var(--foreground)]/40">
            결제는 NicePay를 통해 안전하게 처리됩니다.
          </p>
        </section>
      </div>

      {/* 하단 고정 CTA */}
      <StickyCtaButton
        label="워크북 시작하기"
        price={WORKSHOP_PRICE}
        onClick={handlePayment}
        disabled={isSubmitting || (!!NICEPAY_CLIENT_ID && !sdkLoaded)}
      />
    </div>
  );
}
