'use client';

import Link from 'next/link';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-2xl w-full">
        {/* 시작 화면 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4">
            유튜브 알고리즘을 통해 백년해로 남편상을 찾아보세요
          </h1>
          <p className="text-lg text-[var(--foreground)]/70">
            취향에 맞는 질문에 답하고, 당신만의 이상형을 발견하세요
          </p>
        </div>

        {/* 메인 CTA */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-[var(--foreground)] p-8 mb-6">
          <Link
            href="/husband-match/capture"
            className="block w-full text-center py-5 px-6 rounded-xl bg-white text-[var(--foreground)] font-semibold text-lg border-2 border-[var(--foreground)] hover:bg-[var(--surface)] transition-all"
          >
            테스트 시작하기
          </Link>
          <p className="mt-4 text-center text-sm text-[var(--foreground)]/60">
            구독 목록 캡처를 3장 이상 올리면 분석해 드려요. 결과를 보려면 로그인이 필요합니다.
          </p>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:underline"
          >
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
