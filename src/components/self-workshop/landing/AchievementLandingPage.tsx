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
import { WorkbookBenefitsSection } from "./WorkbookBenefitsSection";
import { WorkshopComparisonSection } from "./WorkshopComparisonSection";
import { WorkbookTestimonialSection } from "./WorkbookTestimonialSection";
import { WorkbookRecommendSection } from "./WorkbookRecommendSection";
import { WorkbookFaqSection } from "./WorkbookFaqSection";
import { StickyCtaButton } from "./StickyCtaButton";
import { useWorkshopCheckout } from "@/lib/payment/useWorkshopCheckout";
import {
  WORKSHOP_PRICE,
  WORKSHOP_ORIGINAL_PRICE,
  WORKSHOP_DISCOUNT_PERCENT,
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

      {/* 기존 하단 섹션들 — 워크북 로직 부터 */}
      <div className="mx-auto max-w-2xl px-4 pt-16">
        <SolutionStepsSection />
        <WorkbookPreviewSection />
        <CurriculumSection />
        <WorkbookBenefitsSection />
        <WorkshopComparisonSection />
        <WorkbookTestimonialSection />
        <WorkbookRecommendSection />
        <WorkbookFaqSection />
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
