import Link from "next/link";
import { ProgramCards } from "@/components/ProgramCards";
import { FeatureTwo } from "@/components/FeatureTwo";
import { Testimonials } from "@/components/Testimonials";
import { PricingTable } from "@/components/PricingTable";

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
              YouTube 구독 기반 심리 분석
            </strong>
            <h1
              className="mb-6 font-bold tracking-tighter text-[var(--foreground)] leading-[1.15]"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.75rem)', wordBreak: 'keep-all' }}
            >
              결혼, 망설여지나요?
              <br />
              유튜브가 답을 알고 있습니다
            </h1>
            <p className="mx-auto text-lg leading-snug text-[var(--foreground)]/70 lg:w-1/2">
              당신이 즐겨보는 영상들이 말해주는 진짜 나, 그리고 나와 맞는 사람.
              <br />
              AI가 분석한 당신의 가치관과 이상형을 만나보세요.
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
                카카오로 시작하기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 프로그램 카드 3개 */}
      <ProgramCards />

      {/* 브랜드 선언문 + 폰 목업 */}
      <FeatureTwo />

      {/* 유저 리뷰 */}
      <Testimonials />

      {/* 상담 프라이싱 */}
      <PricingTable />
    </div>
  );
}
