import Link from "next/link";
import HeroSection from "./_components/HeroSection";
import PainPointCards from "./_components/PainPointCards";
import ChemistrySection from "./_components/ChemistrySection";
import YoutubeAnalysis from "./_components/YoutubeAnalysis";
import TciIntroSection from "./_components/TciIntroSection";
import Phase2Detail from "./_components/Phase2Detail";
import PricingSection from "./_components/PricingSection";
import TestimonialSection from "./_components/TestimonialSection";
import FinalCtaSection from "./_components/FinalCtaSection";
import CtaButton from "../[testId]/CtaButton";

export default function HusbandMatchLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-4 pt-16 pb-32">
        {/* 뒤로가기 */}
        <Link
          href="/self-hacking"
          className="inline-flex items-center text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)] mb-8"
        >
          ← 검사 목록
        </Link>

        {/* 섹션 1 — 히어로 */}
        <HeroSection />

        {/* 섹션 2-3 — 고민 카드 */}
        <PainPointCards />

        {/* 섹션 4 — 연애 vs 결혼 */}
        <ChemistrySection />

        {/* 섹션 5 — YouTube 분석 */}
        <YoutubeAnalysis />

        {/* 섹션 6 — TCI 소개 + Phase 1 미리보기 */}
        <TciIntroSection />

        {/* 섹션 8 — Phase 2 유료 리포트 */}
        <Phase2Detail />

        {/* 섹션 9 — 요금 비교 */}
        <PricingSection />

        {/* 섹션 11 — 유저 후기 */}
        <TestimonialSection />

        {/* 섹션 12 — 최종 CTA */}
        <FinalCtaSection />
      </div>

      {/* 하단 고정 CTA */}
      <CtaButton href="/husband-match/birth-info" label="무료로 시작하기" />
    </div>
  );
}
