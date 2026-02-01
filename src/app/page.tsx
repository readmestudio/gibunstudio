import Link from "next/link";
import { BootcampSection } from "@/components/BootcampSection";

export default function Home() {
  return (
    <div>
      {/* YouTube Husband Match Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full mb-6 border border-purple-200">
              <span className="text-2xl">💕</span>
              <span className="text-sm font-medium text-purple-900">New Service</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              YouTube로 미래의 남편상 찾기
            </h1>
            <p className="mt-6 text-lg text-gray-700 sm:text-xl">
              유튜브는 당신의 모든 것을 알고 있습니다. 구독 채널 분석으로 당신의 성격, 가치관, 그리고 이상적인 남편상을 발견하세요.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/husband-match/onboarding"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-8 py-3 text-base font-semibold text-white transition-colors hover:bg-purple-700"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                무료로 시작하기
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3 text-base font-semibold text-gray-900 border-2 border-gray-300 transition-colors hover:border-purple-600"
              >
                자세히 알아보기
              </a>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                무료 기본 분석
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                10장 카드 리포트
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>

      {/* 7일 프로그램 Hero Section */}
      <section className="relative overflow-hidden bg-[var(--surface)]">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl lg:text-5xl">
              7일간의 내면 아이 찾기
            </h1>
            <p className="mt-6 text-lg text-[var(--foreground)]/70 sm:text-xl">
              매일 하나의 미션으로 당신의 내면 아이를 발견하고, 전문 심리 상담가의 1:1 피드백을 받아보세요.
            </p>
            <div className="mt-10">
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-8 py-3 text-base font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--accent-hover)]"
              >
                카카오로 시작하기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* WHO WE ARE - placeholder */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">
            WHO WE ARE
          </h2>
          <p className="mt-4 text-[var(--foreground)]/70">
            추후 디벨롭 예정
          </p>
        </div>
      </section>

      {/* 7일간의 상담 부트캠프 섹션 */}
      <BootcampSection />

      {/* 1:1 상담 섹션 */}
      <section className="border-t border-[var(--border)] py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">
            1:1 심리 상담
          </h2>
          <p className="mt-4 text-[var(--foreground)]/70">
            7일 내면 아이 찾기 결과 리포트를 해석해주는 상담
          </p>
          <Link
            href="/programs/counseling"
            className="mt-6 inline-flex items-center text-[var(--accent)] font-medium hover:underline"
          >
            자세히 보기 →
          </Link>
        </div>
      </section>

      {/* 유의사항 */}
      <section className="border-t border-[var(--border)] bg-[var(--surface)] py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            유의사항
          </h3>
          <ul className="mt-3 space-y-1 text-sm text-[var(--foreground)]/70">
            <li>• 가입 시 이메일과 전화번호를 필수로 받습니다. 검사 결과지 전송에 사용됩니다.</li>
            <li>• 리포트는 1일~6일차 미션을 모두 완료한 경우에 작성됩니다.</li>
            <li>• 구매 후 14일 내에 미션을 수행하지 못하면 리포트가 제공되지 않습니다.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
