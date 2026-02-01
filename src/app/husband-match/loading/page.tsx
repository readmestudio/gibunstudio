'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoadingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('YouTube 데이터 가져오는 중...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const tokens = searchParams.get('tokens');

    if (!tokens) {
      router.push('/husband-match/onboarding?error=no_tokens');
      return;
    }

    const analyze = async () => {
      try {
        // Decode tokens
        const { access_token } = JSON.parse(atob(tokens));

        // Step 1: Fetch YouTube subscriptions (0-30%)
        setStatus('YouTube 구독 채널 가져오는 중...');
        setProgress(10);

        const subsResponse = await fetch('/api/youtube/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ access_token }),
        });

        if (!subsResponse.ok) {
          throw new Error('Failed to fetch subscriptions');
        }

        setProgress(30);

        // Step 2: Analyze Phase 1 (30-90%)
        setStatus('채널 분석 중...');
        setProgress(40);

        const analyzeResponse = await fetch('/api/analyze/phase1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!analyzeResponse.ok) {
          throw new Error('Failed to analyze');
        }

        const { phase1_id } = await analyzeResponse.json();

        setProgress(90);
        setStatus('리포트 생성 완료!');
        setProgress(100);

        // Redirect to report
        setTimeout(() => {
          router.push(`/husband-match/report/${phase1_id}`);
        }, 500);
      } catch (error) {
        console.error('Analysis error:', error);
        router.push('/husband-match/onboarding?error=analysis_failed');
      }
    };

    analyze();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--surface)] to-white px-4">
      <div className="max-w-md w-full text-center">
        {/* Animated Icon */}
        <div className="mb-8">
          <div className="relative w-24 h-24 mx-auto">
            <div className="absolute inset-0 border-4 border-[var(--accent)]/20 rounded-full"></div>
            <div
              className="absolute inset-0 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"
              style={{
                animationDuration: '1s',
              }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-[var(--accent)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Status */}
        <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          분석 중입니다
        </h2>
        <p className="text-[var(--foreground)]/70 mb-8">{status}</p>

        {/* Progress Bar */}
        <div className="relative h-2 bg-[var(--surface)] rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="mt-2 text-sm text-[var(--foreground)]/60">{progress}%</p>

        {/* Fun Fact */}
        <div className="mt-12 p-4 bg-[var(--accent)]/5 rounded-lg">
          <p className="text-sm text-[var(--foreground)]/70">
            💡 평균적으로 사람들은 50-100개의 채널을 구독하고 있습니다
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoadingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full"></div>
      </div>
    }>
      <LoadingContent />
    </Suspense>
  );
}
