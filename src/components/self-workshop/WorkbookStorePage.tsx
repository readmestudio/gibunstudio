import Link from "next/link";
import { StoreHeroSection } from "./store-landing/StoreHeroSection";
import { StoreIntroSection } from "./store-landing/StoreIntroSection";
import { StoreTherapyCompareSection } from "./store-landing/StoreTherapyCompareSection";
import { StoreWorkbookGridSection } from "./store-landing/StoreWorkbookGridSection";
import { StoreAchievementCycleSection } from "./store-landing/StoreAchievementCycleSection";
import { StoreCreatorStorySection } from "./store-landing/StoreCreatorStorySection";
import { StoreFeaturePointsSection } from "./store-landing/StoreFeaturePointsSection";
import { StorePricingSection } from "./store-landing/StorePricingSection";
import { StorePrivacyBanner } from "./store-landing/StorePrivacyBanner";
import { StoreSoftLaunchBanner } from "./store-landing/StoreSoftLaunchBanner";
import { StoreTestimonialsSection } from "./store-landing/StoreTestimonialsSection";
import { StoreFaqSection } from "./store-landing/StoreFaqSection";
import { StoreStickyStartButton } from "./store-landing/StoreStickyStartButton";
import { getDemoWorkshopResult } from "@/lib/self-workshop/getDemoWorkshopResult";

/**
 * 마음 챙김 워크북 마케팅 랜딩 페이지
 *
 * /payment/self-workshop — 워크북 종류 선택 + 제품 스토리 · 차별점 · 후기 · FAQ.
 * 플로팅 "워크북 시작하기" 버튼은 #workbooks 섹션으로 부드럽게 스크롤.
 *
 * 슬라이드쇼는 demo 유저(mingle22)의 실제 워크북 결과를 server-side fetch 해서
 * 카드 콘텐츠로 사용한다 — fetch 실패/데이터 없음 시 placeholder fallback.
 */
export async function WorkbookStorePage() {
  const demoResult = await getDemoWorkshopResult();

  return (
    <div className="min-h-screen bg-white pb-40">
      {/* 페이지 최상단 띠 배너 — 소프트 런칭 안내 */}
      <StoreSoftLaunchBanner />

      {/* [01] Hero + 공감 체크리스트 */}
      <StoreHeroSection />

      {/* 섹션 구분선 */}
      <SectionDivider />

      {/* [02] 한 줄 정의 + 3줄 요약 */}
      <StoreIntroSection />

      {/* [03] 상담 vs 워크북 비교표 */}
      <StoreTherapyCompareSection />

      <SectionDivider />

      {/* [04] 워크북 종류 (스티키 버튼 타겟: #workbooks) */}
      <StoreWorkbookGridSection />

      <SectionDivider />

      {/* [04.5] 성취 중독 정의 + 6단계 순환 패턴 다이어그램 */}
      <StoreAchievementCycleSection demoResult={demoResult} />

      <SectionDivider />

      {/* [06] 4 POINT — 워크북 핵심 가치 + 실제 동작 모션 */}
      <StoreFeaturePointsSection />

      <SectionDivider />

      {/* [06.5] 가격 — 알림 신청 특가 + 포함 항목 */}
      <StorePricingSection />

      {/* [06.7] 보안 배너 — 100% 보안 보장 신뢰감 강조 */}
      <StorePrivacyBanner />

      {/* [08] 후기 */}
      <StoreTestimonialsSection />

      {/* [05] 창작자 스토리 — 후기 다음 / FAQ 앞 */}
      <StoreCreatorStorySection />

      {/* [09] FAQ */}
      <StoreFaqSection />

      {/* 홈 링크 */}
      <div className="text-center pb-12">
        <Link
          href="/"
          className="text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:underline"
        >
          ← 홈으로 돌아가기
        </Link>
      </div>

      {/* 플로팅 CTA */}
      <StoreStickyStartButton />
    </div>
  );
}

function SectionDivider() {
  return (
    <div className="mx-auto max-w-3xl px-4">
      <div className="h-px bg-[var(--foreground)]/10" />
    </div>
  );
}
