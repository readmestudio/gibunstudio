"use client";

import { useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { HeroSection } from "./HeroSection";
import { SelfCheckSection } from "./SelfCheckSection";
import { ProblemStatementSection } from "./ProblemStatementSection";
import { AddictionCycleSection } from "./AddictionCycleSection";
import { SolutionStepsSection } from "./SolutionStepsSection";
import { WorkbookPreviewSection } from "./WorkbookPreviewSection";
import { CurriculumSection } from "./CurriculumSection";
import { WorkbookTestimonialSection } from "./WorkbookTestimonialSection";
import { StickyCtaButton } from "./StickyCtaButton";
import { DiscountPriceDisplay } from "./DiscountPriceDisplay";
import { useWorkshopCheckout } from "@/lib/payment/useWorkshopCheckout";
import {
  WORKSHOP_PRICE,
  WORKSHOP_ORIGINAL_PRICE,
  WORKSHOP_DISCOUNT_PERCENT,
  WORKBOOK_FEATURES,
} from "@/lib/self-workshop/landing-data";

const PRODUCT_ID = "achievement-addiction";
const PRODUCT_NAME = "마음 챙김 워크북 · 성취 중독";
const GOODS_NAME = "마음 챙김 워크북 - 성취 중독";

const NICEPAY_CLIENT_ID = process.env.NEXT_PUBLIC_NICEPAY_MERCHANT_ID || "";
const NICEPAY_SDK_URL =
  process.env.NEXT_PUBLIC_NICEPAY_SDK_URL || "https://pay.nicepay.co.kr/v1/js/";

export function AchievementLandingPage() {
  const [sdkLoaded, setSdkLoaded] = useState(false);

  const {
    submittingAction,
    isSubmitting,
    handleBuyNow,
    handleNpay,
    handleAddToCart,
  } = useWorkshopCheckout({
    productId: PRODUCT_ID,
    workshopType: PRODUCT_ID,
    amount: WORKSHOP_PRICE,
    goodsName: GOODS_NAME,
  });

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* NicePay SDK */}
      {NICEPAY_CLIENT_ID && (
        <Script
          src={NICEPAY_SDK_URL}
          strategy="afterInteractive"
          onLoad={() => setSdkLoaded(true)}
          onReady={() => setSdkLoaded(true)}
        />
      )}

      {/* 뒤로가기 */}
      <div className="mx-auto max-w-5xl px-4 pt-8">
        <Link
          href="/payment/self-workshop"
          className="inline-flex items-center text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)]"
        >
          ← 워크북 목록
        </Link>
      </div>

      {/* [01] HERO */}
      <HeroSection />

      {/* [02] 공감 체크리스트 */}
      <SelfCheckSection />

      {/* [03] 문제 현상 */}
      <ProblemStatementSection />

      {/* [04] 악순환 메커니즘 (풀폭 배경) */}
      <AddictionCycleSection />

      {/* 기존 하단 섹션들 — 성취 중독은 이렇게 해결됩니다 부터 */}
      <div className="mx-auto max-w-2xl px-4 pt-16">
        <SolutionStepsSection />
        <WorkbookPreviewSection />
        <CurriculumSection />
        <WorkbookTestimonialSection />

        {/* 가격 + 포함 내용 카드 */}
        <section className="py-16">
          <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
            <p className="text-sm text-[var(--foreground)]/60 mb-3">결제 금액</p>
            <DiscountPriceDisplay
              originalPrice={WORKSHOP_ORIGINAL_PRICE}
              price={WORKSHOP_PRICE}
              discountPercent={WORKSHOP_DISCOUNT_PERCENT}
              size="lg"
            />

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
        productId={PRODUCT_ID}
        productName={PRODUCT_NAME}
        originalPrice={WORKSHOP_ORIGINAL_PRICE}
        price={WORKSHOP_PRICE}
        discountPercent={WORKSHOP_DISCOUNT_PERCENT}
        onBuyNow={handleBuyNow}
        onAddToCart={handleAddToCart}
        onNpayBuy={handleNpay}
        isSubmitting={isSubmitting}
        submittingAction={submittingAction}
        disabled={isSubmitting || (!!NICEPAY_CLIENT_ID && !sdkLoaded)}
        disabledLabel={
          isSubmitting ? "결제 진행 중..." : "결제 모듈 로딩 중..."
        }
      />
    </div>
  );
}
