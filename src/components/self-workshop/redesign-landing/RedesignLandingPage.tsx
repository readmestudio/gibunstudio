"use client";

import type { DemoWorkshopResult } from "@/lib/self-workshop/getDemoWorkshopResult";

import "./landing.css";

import {
  Divider,
  Footer,
  SoftLaunchBanner,
  StickyCTA,
} from "./Chrome";
import {
  BigQuestionSection,
  HeroSection,
  ProblemsSection,
} from "./HeroSection";
import {
  CompareSection,
  CycleSection,
  IntroSection,
  MaySection,
} from "./MidSections";
import { PointsSection } from "./PointsSection";
import {
  CreatorSection,
  FaqSection,
  FinalCTA,
  PricingSection,
  PrivacySection,
  TestimonialsSection,
} from "./RestSections";
import { SlideshowWrap } from "./SlideshowWrap";
import { useFadeIn } from "./useFadeIn";

/**
 * /payment/self-workshop 새 디자인 — Apple-style 마케팅 랜딩.
 *
 * 디자인 핸드오프(redesign-landing/) 기반. 핵심 차이점:
 * - 오렌지 액센트(#FF5A1F) + 그라디언트
 * - sticky topbar + scroll-driven f-up 모션
 * - 회전 점선 링이 있는 6단계 cycle 다이어그램
 * - 4 POINT 모션 카드 (Likert / Cascade carousel / 타이핑 / 근거-확언)
 *
 * 슬라이드쇼는 사용자 요청에 따라 기존 StoreHeroWorkbookSlideshow(실제
 * 워크북 페이지 스크린샷 사용)를 그대로 재사용한다 — `SlideshowWrap` 참조.
 */
export function RedesignLandingPage({
  demoResult,
}: {
  demoResult: DemoWorkshopResult | null;
}) {
  useFadeIn();

  return (
    <div className="lr">
      <SoftLaunchBanner />
      <HeroSection />
      <SlideshowWrap demoResult={demoResult} />
      <ProblemsSection />
      <BigQuestionSection />
      <IntroSection />
      <Divider />
      <CompareSection />
      <Divider />
      <MaySection />
      <CycleSection />
      <SlideshowWrap demoResult={demoResult} />
      <PointsSection />
      <PricingSection />
      <PrivacySection />
      <TestimonialsSection />
      <CreatorSection />
      <FaqSection />
      <FinalCTA />
      <Footer />
      <StickyCTA />
    </div>
  );
}
