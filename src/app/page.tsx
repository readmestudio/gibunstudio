import Link from "next/link";
import { ProgramCards } from "@/components/ProgramCards";
import { ComparisonSection } from "@/components/ComparisonSection";
import { FeatureTwo } from "@/components/FeatureTwo";
import { SelfHackingElements } from "@/components/SelfHackingElements";
import { Testimonials } from "@/components/Testimonials";
import { PricingTable } from "@/components/PricingTable";
import { FinalCTA } from "@/components/FinalCTA";

export default function Home() {
  return (
    <div>
      {/* Hero Section — Monotone 스타일 */}
      <section
        className="relative w-full h-screen overflow-hidden bg-center bg-no-repeat bg-cover"
        style={{ backgroundImage: "url('/patterns/patternTop.svg')" }}
      >
        <div className="container relative w-full px-8 pt-32 pb-24 mx-auto lg:px-4">
          <div className="flex flex-col w-full mb-12 text-center">
            <strong className="mb-4 text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/70">
              심리학 기반 셀프 해킹 플랫폼
            </strong>
            <h1
              className="mb-6 font-bold text-[var(--foreground)] leading-[1.15]"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)', wordBreak: 'keep-all' }}
            >
              인생은 결국 기분 관리,
              <br />
              나를 이해하는 순간 모든 게 시작됩니다
            </h1>
            <p className="mx-auto text-lg leading-snug text-[var(--foreground)]/70 lg:w-1/2" style={{ wordBreak: 'keep-all' }}>
              심리학 기반 분석으로 나의 기질, 감정, 관계 패턴을 탐색하고
              더 기분 좋은 나로 나아가세요.
            </p>
          </div>
          <div className="flex w-full mt-6 justify-center">
            <div className="mt-3 rounded-lg sm:mt-0">
              <Link
                href="/self-hacking/detail/husband-match"
                className="inline-flex items-center gap-2 px-8 py-3 text-lg font-medium text-[var(--foreground)] bg-[var(--accent)] border-2 border-[var(--accent)] rounded-lg transition-all duration-300 hover:bg-[var(--accent-hover)]"
              >
                무료 검사 리포트 받기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 프로그램 카드 */}
      <ProgramCards />

      {/* 기존 상담 vs 셀프 해킹 비교 */}
      <ComparisonSection />

      {/* 브랜드 선언문 + 폰 목업 */}
      <FeatureTwo />

      {/* 셀프 해킹 구성요소 4카드 */}
      <SelfHackingElements />

      {/* 유저 리뷰 */}
      <Testimonials />

      {/* 상담 프라이싱 */}
      <PricingTable />

      {/* 최종 전환 CTA */}
      <FinalCTA />
    </div>
  );
}
