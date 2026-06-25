"use client";

import "./landing.css";

import {
  Divider,
  Footer,
  SoftLaunchBanner,
  StickyCTA,
} from "./Chrome";
import { ProblemsSection } from "./HeroSection";
import { CompareSection } from "./MidSections";
import { OverviewHero, OverviewBigQuestion } from "./OverviewHero";
import { OverviewIntroSection } from "./OverviewIntroSection";
import { OverviewPointsSection } from "./OverviewPointsSection";
import {
  OverviewApproachSection,
  OverviewJourneySection,
  OverviewLineupSection,
  OverviewMethodSection,
} from "./OverviewSections";
import { OverviewTestimonialsSection } from "./OverviewTestimonialsSection";
import {
  FaqSection,
  FinalCTA,
  PricingSection,
  PrivacySection,
} from "./RestSections";
import { useFadeIn } from "./useFadeIn";
import { WorkshopCheckoutProvider } from "./WorkshopCheckoutContext";
import {
  WorkbookScreenshotSection,
  WorkbookScreenshotStrip,
} from "./WorkbookScreenshotSection";

/**
 * `/payment/self-workshop` — 심리 상담 워크북 *전반* 상세 페이지.
 *
 * 같은 디자인 언어(lr-* CSS, fade-in 모션)를 유지하면서, 성취 중독 한정
 * 콘텐츠(MaySection·CycleSection·기존 TestimonialsSection·PointsSection의
 * 4영역/타이핑 시퀀스)는 IFS + CBT 워크북 전반 톤으로 교체했다.
 *
 * 톤 가이드:
 * - 내면가족체계(IFS) 관점 — "마음 안의 여러 부분"
 * - 과거 원인보다 다음 한 달의 행동
 * - 힐링/위로보다 다음 시도할 수 있는 대안
 */
export function OverviewLandingPage() {
  useFadeIn();

  return (
    <WorkshopCheckoutProvider>
      <div className="lr">
        <SoftLaunchBanner />
        <OverviewHero />
      <WorkbookScreenshotSection />
      <ProblemsSection />
      <OverviewBigQuestion />
      <OverviewIntroSection />
      <Divider />
      <CompareSection />
      <Divider />
      <OverviewMethodSection />
      <OverviewJourneySection />
      <WorkbookScreenshotStrip />
      <OverviewApproachSection />
      <OverviewLineupSection />
      <PricingSection />
      <OverviewPointsSection />
      <PrivacySection />
      <OverviewTestimonialsSection />
      <FaqSection />
      <FinalCTA />
      <Footer />
      <StickyCTA />
      </div>
    </WorkshopCheckoutProvider>
  );
}
