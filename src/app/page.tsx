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
              YOUTUBE 알고리즘 심리 분석
            </strong>
            <h1
              className="mb-6 font-bold tracking-tighter text-[var(--foreground)] leading-[1.15]"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)', wordBreak: 'keep-all' }}
            >
              내가 어떤 사람인지 알면,
              <br />
              맞는 사람도 보입니다
            </h1>
            <p className="mx-auto text-lg leading-snug text-[var(--foreground)]/70 lg:w-1/2">
              유튜브 알고리즘 속에는 당신의 기질, 성격, 감성이 담겨 있습니다.
              <br />
              AI가 이를 분석해 진짜 나를 읽어내고, 나에게 맞는 파트너 유형을 추천해 드립니다.
            </p>
          </div>
          <div className="flex w-full mt-6 justify-center">
            <div className="mt-3 rounded-lg sm:mt-0">
              <Link
                href="/husband-match/onboarding"
                className="inline-flex items-center gap-2 px-8 py-3 text-lg font-medium text-[var(--foreground)] bg-[var(--accent)] border-2 border-[var(--accent)] rounded-lg transition-all duration-300 hover:bg-[var(--accent-hover)]"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.724 1.8 5.117 4.508 6.467-.199.747-.721 2.707-.826 3.127-.13.524.192.517.404.376.166-.11 2.641-1.792 3.712-2.52.714.099 1.447.15 2.202.15 5.523 0 10-3.463 10-7.691C22 6.463 17.523 3 12 3z"/>
                </svg>
                무료로 내 남편상 찾기
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
