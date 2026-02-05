'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Phase1SurveyAnswer } from '@/lib/husband-match/data/phase1-survey-questions';

const STORAGE_KEY = 'husband_match_survey_answers';

export default function SurveyClaimPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'checking' | 'submitting' | 'done' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (cancelled) return;
      if (!user) {
        router.replace('/login?next=/husband-match/survey/claim');
        return;
      }

      if (typeof window === 'undefined') return;
      const raw = window.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        router.replace('/husband-match/survey');
        return;
      }

      let answers: Phase1SurveyAnswer;
      try {
        answers = JSON.parse(raw) as Phase1SurveyAnswer;
      } catch {
        window.sessionStorage.removeItem(STORAGE_KEY);
        router.replace('/husband-match/survey');
        return;
      }

      setStatus('submitting');
      try {
        const res = await fetch('/api/analyze/phase1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ survey_answers: answers }),
        });
        const data = await res.json().catch(() => ({}));

        if (cancelled) return;
        if (!res.ok) {
          setErrorMessage(data.error || '분석 요청에 실패했습니다.');
          setStatus('error');
          return;
        }
        if (data.phase1_id) {
          window.sessionStorage.removeItem(STORAGE_KEY);
          setStatus('done');
          router.push(`/husband-match/report/${data.phase1_id}`);
          return;
        }
        setErrorMessage('결과를 받지 못했습니다.');
        setStatus('error');
      } catch (e) {
        if (cancelled) return;
        setErrorMessage(e instanceof Error ? e.message : '요청 중 오류가 났습니다.');
        setStatus('error');
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[var(--surface)] to-white px-4">
        <p className="text-red-600 mb-4">{errorMessage}</p>
        <button
          type="button"
          onClick={() => router.push('/husband-match/survey')}
          className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--foreground)]"
        >
          서베이로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--surface)] to-white px-4">
      <p className="text-[var(--foreground)]/70">
        {status === 'checking' ? '확인 중...' : '결과를 불러오는 중...'}
      </p>
    </div>
  );
}
