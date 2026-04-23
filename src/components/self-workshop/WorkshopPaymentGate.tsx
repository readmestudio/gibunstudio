"use client";

import { useState } from "react";
import Script from "next/script";
import Link from "next/link";
import {
  DIMENSIONS,
  DIAGNOSIS_LEVELS,
  type DiagnosisScores,
  type DimensionKey,
} from "@/lib/self-workshop/diagnosis";

const NICEPAY_CLIENT_ID = process.env.NEXT_PUBLIC_NICEPAY_MERCHANT_ID || "";
const NICEPAY_SDK_URL =
  process.env.NEXT_PUBLIC_NICEPAY_SDK_URL || "https://pay.nicepay.co.kr/v1/js/";

import {
  CONSEQUENCES,
  WORKSHOP_PRICE,
  WORKSHOP_ORIGINAL_PRICE,
  WORKSHOP_DISCOUNT_PERCENT,
  WORKBOOK_FEATURES,
} from "@/lib/self-workshop/landing-data";
import { SolutionStepsSection } from "@/components/self-workshop/landing/SolutionStepsSection";
import { WorkbookPreviewSection } from "@/components/self-workshop/landing/WorkbookPreviewSection";
import { CurriculumSection } from "@/components/self-workshop/landing/CurriculumSection";
import { StickyCtaButton } from "@/components/self-workshop/landing/StickyCtaButton";
import { DiscountPriceDisplay } from "@/components/self-workshop/landing/DiscountPriceDisplay";
import { AddictionCycleDiagram } from "@/components/self-workshop/AddictionCycleDiagram";
import { useWorkshopCheckout } from "@/lib/payment/useWorkshopCheckout";

const PRODUCT_ID = "achievement-addiction";
const PRODUCT_NAME = "마음 챙김 워크북 · 성취 중독";
const GOODS_NAME = "마음 챙김 워크북 - 성취 중독";

interface Props {
  scores?: DiagnosisScores;
}

/* ── 시나리오 데이터 (직장인 3~15년차 페르소나) ── */

const SCENARIO_CARDS: {
  dimensionKey: DimensionKey;
  keyword: string;
  scenario: string;
}[] = [
  {
    dimensionKey: "conditional_self_worth",
    keyword: "자기 가치의 조건화",
    scenario:
      "연봉이 오르거나 좋은 평가를 받아야만 '나 괜찮은 사람이야'라고 느낄 확률이 높아요. 성과 없는 나는 불안하고, 동기들의 승진 소식에 괜히 마음이 무거워질 수 있어요.",
  },
  {
    dimensionKey: "compulsive_striving",
    keyword: "과잉 추동",
    scenario:
      "프로젝트가 끝나면 '다음엔 뭘 해야 하지' 하고 바로 다음 목표를 세우고 있을 확률이 높아요. 주말에 쉬면서도 '이 시간에 자격증이라도 따야 하나' 생각이 자주 들 수 있어요.",
  },
  {
    dimensionKey: "fear_of_failure",
    keyword: "실패 공포 / 완벽주의",
    scenario:
      "회의에서 발표를 잘 마쳤는데, 퇴근길에 '그때 그 말은 왜 했지' 되짚고 있을 확률이 높아요. 작은 실수도 오래 남고, '완벽하지 않으면 의미 없다'는 생각이 습관처럼 따라올 수 있어요.",
  },
  {
    dimensionKey: "emotional_avoidance",
    keyword: "정서적 회피",
    scenario:
      "힘든 일이 있으면 감정을 느끼기보다 야근을 선택할 확률이 높아요. 바쁘면 생각을 안 해도 되니까요. 감정이 올라올 때 '일단 할 일부터 하자'가 자동 반응일 수 있어요.",
  },
];


function getSignalLevel(score: number) {
  // 25점 만점 기준
  if (score >= 18) {
    return {
      emoji: "\u{1F6A8}", // 🚨
      label: "위험",
      className: "bg-red-100 text-red-700",
      dotClass: "bg-red-500",
    };
  }
  if (score >= 13) {
    return {
      emoji: "\u{26A0}\u{FE0F}", // ⚠️
      label: "주의 필요",
      className: "bg-orange-100 text-orange-700",
      dotClass: "bg-orange-500",
    };
  }
  if (score >= 8) {
    return {
      emoji: "\u{1F7E1}", // 🟡
      label: "주의",
      className: "bg-yellow-100 text-yellow-700",
      dotClass: "bg-yellow-500",
    };
  }
  return {
    emoji: "\u{1F7E2}", // 🟢
    label: "안전",
    className: "bg-green-100 text-green-700",
    dotClass: "bg-green-500",
  };
}

export function WorkshopPaymentGate({ scores }: Props) {
  const [sdkLoaded, setSdkLoaded] = useState(false);

  const level = scores
    ? DIAGNOSIS_LEVELS.find((l) => l.level === scores.level)
    : null;

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
    onAlreadyPurchased: () => window.location.reload(),
  });

  return (
    <div className="mx-auto max-w-lg space-y-8 pb-40">
      {/* NicePay SDK */}
      {NICEPAY_CLIENT_ID && (
        <Script
          src={NICEPAY_SDK_URL}
          strategy="afterInteractive"
          onLoad={() => setSdkLoaded(true)}
          onReady={() => setSdkLoaded(true)}
        />
      )}

      {/* ── 1. 총점 + 레벨 ── */}
      {scores && level && (
        <>
          <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-8 text-center">
            <p className="text-sm font-medium text-[var(--foreground)]/50 uppercase tracking-wider">
              나의 진단 결과
            </p>
            <p className="mt-4 text-6xl font-bold text-[var(--foreground)]">
              {scores.total}
              <span className="text-lg font-normal text-[var(--foreground)]/40">
                /100
              </span>
            </p>
            <div className="mt-3 inline-block rounded-full border-2 border-[var(--foreground)] px-4 py-1">
              <span className="text-sm font-semibold">
                Level {scores.level}: {level.name}
              </span>
            </div>
            <p className="mt-2 text-xs text-[var(--foreground)]/50">
              {level.keyword}
            </p>
          </div>

          {/* 레벨 설명 */}
          <div className="rounded-xl border-2 border-[var(--foreground)]/20 bg-white p-6">
            <p className="text-sm leading-relaxed text-[var(--foreground)]/80">
              {level.description}
            </p>
          </div>

          {/* ── 2. 영역별 점수 ── */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-[var(--foreground)]">
              영역별 점수
            </h3>
            {DIMENSIONS.map((dim) => {
              const score = scores.dimensions[dim.key];
              const maxScore = 25;
              const percent = (score / maxScore) * 100;
              return (
                <div key={dim.key}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--foreground)]">
                      {dim.label}
                    </span>
                    <span className="text-sm font-bold text-[var(--foreground)]">
                      {score}/{maxScore}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[var(--foreground)]/10">
                    <div
                      className="h-full rounded-full bg-[var(--foreground)] transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--foreground)]/50">
                    {dim.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* ── 3. 시나리오 카드 ── */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-[var(--foreground)]">
              이런 생각을 자주 할 확률이 높아요
            </h3>
            <div className="space-y-3">
              {SCENARIO_CARDS.map((card) => {
                const dimScore = scores.dimensions[card.dimensionKey] ?? 0;
                const signal = getSignalLevel(dimScore);
                return (
                  <div
                    key={card.dimensionKey}
                    className="rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-[var(--foreground)]/50">
                        {card.keyword}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${signal.className}`}
                      >
                        <span className="text-sm">{signal.emoji}</span>
                        {signal.label}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-[var(--foreground)]/80">
                      {card.scenario}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          {/* ── 3-1. 성취 중독 반복 순환 도식 ── */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-[var(--foreground)]">
              이 패턴이 반복됩니다
            </h3>
            <p className="text-sm text-[var(--foreground)]/60">
              성취 중독은 하나의 고정된 감정이 아니라, 끝없이 반복되는 순환 구조예요.
            </p>
            <AddictionCycleDiagram />
          </div>
        </>
      )}

      {/* ── 4. 경고 섹션: 방치하면 이렇게 됩니다 ── */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-[var(--foreground)]">
          이 패턴을 방치하면
        </h3>
        <p className="text-sm text-[var(--foreground)]/60">
          성취 중독은 의지로 해결되지 않습니다. 패턴을 인식하지 못하면 시간이
          지날수록 더 강해져요.
        </p>
        <div className="grid grid-cols-1 gap-3">
          {CONSEQUENCES.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-5"
            >
              <p className="text-sm font-semibold text-[var(--foreground)] mb-1">
                {item.title}
              </p>
              <p className="text-sm leading-relaxed text-[var(--foreground)]/70">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. 솔루션 로직: 이 워크북이 해결하는 방법 ── */}
      <SolutionStepsSection />

      {/* ── 6. 워크북 미리보기 ── */}
      <WorkbookPreviewSection />

      {/* ── 7. 커리큘럼 ── */}
      <CurriculumSection />

      {/* 가격 + 포함 내용 */}
      <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
        <p className="text-sm text-[var(--foreground)]/60 mb-3">결제 금액</p>
        <DiscountPriceDisplay
          originalPrice={WORKSHOP_ORIGINAL_PRICE}
          price={WORKSHOP_PRICE}
          discountPercent={WORKSHOP_DISCOUNT_PERCENT}
          size="lg"
        />

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

      {/* 돌아가기 */}
      <div className="text-center">
        <Link
          href="/dashboard"
          className="text-sm text-[var(--foreground)]/60 underline hover:text-[var(--foreground)]"
        >
          대시보드로 돌아가기
        </Link>
      </div>

      {/* 하단 고정 구매 바 */}
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

const FEATURES = WORKBOOK_FEATURES;
