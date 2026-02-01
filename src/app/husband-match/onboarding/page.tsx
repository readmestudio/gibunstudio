'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
      setLoading(false);
      if (!user) {
        router.replace('/login?next=/husband-match/onboarding');
      }
    });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--surface)] to-white px-4">
        <p className="text-[var(--foreground)]/70">확인 중...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--surface)] to-white px-4">
      <div className="max-w-2xl w-full">
        {/* Logo/Brand */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4">
            YouTube로 미래의 남편상 찾기
          </h1>
          <p className="text-lg text-[var(--foreground)]/70">
            구독 채널 분석으로 당신의 이상형을 발견하세요
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-[var(--border)] p-8 mb-6">
          {/* How it works */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
              어떻게 작동하나요?
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-[var(--accent)]">1</span>
                </div>
                <div>
                  <p className="font-medium text-[var(--foreground)]">YouTube 연동</p>
                  <p className="text-sm text-[var(--foreground)]/70">
                    구독 채널 정보를 안전하게 가져옵니다 (가입은 되지 않습니다)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-[var(--accent)]">2</span>
                </div>
                <div>
                  <p className="font-medium text-[var(--foreground)]">AI 분석</p>
                  <p className="text-sm text-[var(--foreground)]/70">
                    구독 채널로 성격, 가치관, 취향을 분석합니다
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-[var(--accent)]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-[var(--accent)]">3</span>
                </div>
                <div>
                  <p className="font-medium text-[var(--foreground)]">결과 확인</p>
                  <p className="text-sm text-[var(--foreground)]/70">
                    10장의 카드로 당신의 이상적인 남편상을 확인하세요
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">
                  개인정보 보호
                </p>
                <p className="text-xs text-blue-800">
                  YouTube 구독 정보는 분석 목적으로만 사용되며, 안전하게 보관됩니다.
                  언제든지 삭제 요청이 가능합니다.
                </p>
              </div>
            </div>
          </div>

          {/* YouTube 연동 버튼 (Google OAuth는 YouTube 권한만, 가입/로그인 아님) */}
          <a
            href="/api/auth/google"
            className="w-full flex items-center justify-center gap-3 py-4 px-6 bg-white border-2 border-[var(--border)] rounded-lg hover:border-[var(--accent)] hover:bg-[var(--surface)] transition-all font-medium text-[var(--foreground)]"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="red"
                d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
              />
            </svg>
            YouTube 연동하기
          </a>
          <p className="mt-3 text-center text-xs text-[var(--foreground)]/60">
            카카오/이메일로 로그인한 계정에 YouTube 구독 데이터만 연동됩니다. Google로 가입되지 않습니다.
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
