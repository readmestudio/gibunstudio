import Link from "next/link";
import { StoreHeroSection } from "./store-landing/StoreHeroSection";
import { StoreIntroSection } from "./store-landing/StoreIntroSection";
import { StoreTherapyCompareSection } from "./store-landing/StoreTherapyCompareSection";
import { StoreWorkbookGridSection } from "./store-landing/StoreWorkbookGridSection";
import { StoreCreatorStorySection } from "./store-landing/StoreCreatorStorySection";
import { StoreHowItWorksSection } from "./store-landing/StoreHowItWorksSection";
import { StoreExpertConsultSection } from "./store-landing/StoreExpertConsultSection";
import { StoreTestimonialsSection } from "./store-landing/StoreTestimonialsSection";
import { StoreFaqSection } from "./store-landing/StoreFaqSection";
import { StoreStickyStartButton } from "./store-landing/StoreStickyStartButton";

/**
 * 마음 챙김 워크북 마케팅 랜딩 페이지
 *
 * /payment/self-workshop — 워크북 종류 선택 + 제품 스토리 · 차별점 · 후기 · FAQ.
 * 플로팅 "워크북 시작하기" 버튼은 #workbooks 섹션으로 부드럽게 스크롤.
 */
export function WorkbookStorePage() {
  return (
    <div className="min-h-screen bg-white pb-40">
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

      {/* [06] 어떻게 진행되나요 — 실제 8단계 흐름 */}
      <StoreHowItWorksSection />

      {/* [05] 창작자 스토리 */}
      <StoreCreatorStorySection />

      <SectionDivider />

      {/* [07] 전문가 해석 상담 (옵션) */}
      <StoreExpertConsultSection />

      {/* [08] 후기 */}
      <StoreTestimonialsSection />

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
