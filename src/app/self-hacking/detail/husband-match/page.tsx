import Link from "next/link";
import HeroSection from "./_components/HeroSection";
import TestIntroSection from "./_components/TestIntroSection";
import PainPointCards from "./_components/PainPointCards";
import ChemistrySection from "./_components/ChemistrySection";
import HowItWorks from "./_components/HowItWorks";
import HowToSection from "./_components/HowToSection";
import TestimonialSection from "./_components/TestimonialSection";
import FinalCtaSection from "./_components/FinalCtaSection";

export default function HusbandMatchLandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-4 pt-16 pb-24">
        {/* 뒤로가기 */}
        <Link
          href="/"
          className="inline-flex items-center text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)] mb-8"
        >
          ← 홈으로
        </Link>

        {/* 섹션 1 — 히어로 */}
        <HeroSection />

        {/* 6가지 분석 항목 */}
        <ChemistrySection />

        {/* 고민 카드 */}
        <PainPointCards />

        {/* 검사 소개 */}
        <TestIntroSection />

        {/* 분석 원리 3단계 */}
        <HowItWorks />

        {/* 검사 진행 방법 */}
        <HowToSection />

        {/* 유저 후기 */}
        <TestimonialSection />

        {/* 섹션 12 — 최종 CTA */}
        <FinalCtaSection />
      </div>
    </div>
  );
}
