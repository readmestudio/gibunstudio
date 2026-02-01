'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  PHASE1_SURVEY_QUESTIONS,
  type Phase1SurveyAnswer,
  type Phase1SurveyQuestionDef,
} from '@/lib/husband-match/data/phase1-survey-questions';

function Phase1SurveyClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [answers, setAnswers] = useState<Phase1SurveyAnswer>({});
  const [step, setStep] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        setIsLoggedIn(!!user);
        setLoading(false);
        if (!user) router.replace('/login?next=/husband-match/survey');
      });
  }, [router]);

  const q = PHASE1_SURVEY_QUESTIONS[step];
  const isLast = step === PHASE1_SURVEY_QUESTIONS.length - 1;

  const setAnswer = <K extends keyof Phase1SurveyAnswer>(key: K, value: Phase1SurveyAnswer[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const canProceed = () => {
    const a = answers[q.id];
    if (q.type === 'rank3of9') return Array.isArray(a) && (a as string[]).length === 3;
    if (q.type === 'multi') {
      const arr = a as string[] | undefined;
      if (q.id === 'S2') return Array.isArray(arr) && arr.length >= 1;
      if (q.id === 'S4') return Array.isArray(arr) && arr.length === 2;
      if (q.id === 'S9') return Array.isArray(arr) && arr.length === 2;
      if (q.id === 'S12') return Array.isArray(arr) && arr.length === 2;
      return Array.isArray(arr) && arr.length >= 1;
    }
    if (q.type === 'binary4') return Array.isArray(a) && (a as unknown[]).length === 4;
    if (q.type === 'keywords3') return Array.isArray(a) && (a as string[]).length === 3;
    if (q.type === 'slider3') return Array.isArray(a) && (a as number[]).length === 3;
    if (q.type === 'single3') return Array.isArray(a) && (a as string[]).length === 3;
    if (q.type === 'scenario3') return Array.isArray(a) && (a as number[]).length === 3;
    if (q.type === 'rank3of6') {
      const r = a as { first?: string; second?: string; third?: string } | undefined;
      return r && r.first && r.second && r.third && r.first !== r.second && r.second !== r.third && r.first !== r.third;
    }
    if (q.type === 'single') return typeof a === 'string' && a.length > 0;
    return false;
  };

  const handleNext = async () => {
    if (!canProceed() && q.type !== 'slider3') return;
    if (q.type === 'slider3' && !answers.S6) {
      setAnswer('S6', [50, 50, 50]);
    }
    if (isLast) {
      setSubmitLoading(true);
      setError(null);
      const toSend = { ...answers };
      if (toSend.S6 == null) toSend.S6 = [50, 50, 50];
      try {
        const res = await fetch('/api/analyze/phase1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ survey_answers: toSend }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.error || '분석 요청에 실패했습니다.');
          setSubmitLoading(false);
          return;
        }
        if (data.phase1_id) {
          router.push(`/husband-match/report/${data.phase1_id}`);
          return;
        }
        setError('결과를 받지 못했습니다.');
      } catch (e) {
        setError(e instanceof Error ? e.message : '요청 중 오류가 났습니다.');
      }
      setSubmitLoading(false);
    } else {
      setStep((s) => s + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  if (loading || !isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--surface)] to-white px-4">
        <p className="text-[var(--foreground)]/70">확인 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--surface)] to-white px-4 py-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/husband-match/onboarding"
            className="text-sm text-[var(--foreground)]/60 hover:underline"
          >
            ← 온보딩으로
          </Link>
          <span className="text-sm text-[var(--foreground)]/60">
            {step + 1} / {PHASE1_SURVEY_QUESTIONS.length}
          </span>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[var(--foreground)]">{q.title}</h2>
          {q.subtitle && (
            <p className="mt-1 text-sm text-[var(--foreground)]/60">{q.subtitle}</p>
          )}

          <div className="mt-6">
            <QuestionRenderer
              def={q}
              value={answers[q.id]}
              onChange={(v) => setAnswer(q.id, v)}
            />
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          )}

          <div className="mt-8 flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)]"
              >
                이전
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={(!canProceed() && q.type !== 'slider3') || submitLoading}
              className="flex-1 rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              {submitLoading ? '분석 중...' : isLast ? '결과 보기' : '다음'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionRenderer({
  def,
  value,
  onChange,
}: {
  def: Phase1SurveyQuestionDef;
  value: unknown;
  onChange: (v: Phase1SurveyAnswer[keyof Phase1SurveyAnswer]) => void;
}) {
  if (def.type === 'rank3of9' && def.options) {
    const arr = (value as string[] | undefined) || [];
    const setRank = (idx: 0 | 1 | 2, id: string) => {
      const next = [...arr];
      next[idx] = id;
      onChange(next as [string, string, string]);
    };
    return (
      <div className="space-y-2">
        {([0, 1, 2] as const).map((idx) => (
          <div key={idx}>
            <p className="mb-2 text-xs font-medium text-[var(--foreground)]/60">
              {idx === 0 ? '1위' : idx === 1 ? '2위' : '3위'}
            </p>
            <div className="flex flex-wrap gap-2">
              {def.options!.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRank(idx, opt.id)}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    arr[idx] === opt.id
                      ? 'border-[var(--accent)] bg-[var(--accent-muted)]'
                      : 'border-[var(--border)] hover:border-[var(--foreground)]/30'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (def.type === 'multi' && def.options) {
    const arr = (value as string[] | undefined) || [];
    const max = def.id === 'S4' || def.id === 'S9' || def.id === 'S12' ? 2 : 999;
    const toggle = (id: string) => {
      const next = arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id].slice(-max);
      onChange(next);
    };
    return (
      <div className="space-y-2">
        {def.options.map((opt) => (
          <label key={opt.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--border)] p-3 hover:bg-[var(--surface)]">
            <input
              type="checkbox"
              checked={arr.includes(opt.id)}
              onChange={() => toggle(opt.id)}
              className="h-4 w-4 rounded border-[var(--border)]"
            />
            <span className="text-sm text-[var(--foreground)]">{opt.label}</span>
          </label>
        ))}
        {(def.id === 'S4' || def.id === 'S9' || def.id === 'S12') && (
          <p className="text-xs text-[var(--foreground)]/60">2개만 선택해 주세요</p>
        )}
      </div>
    );
  }

  if (def.type === 'binary4' && def.pairs) {
    const arr = (value as ('A' | 'B')[] | undefined) || [];
    const setPair = (idx: number, choice: 'A' | 'B') => {
      const next = [...arr];
      next[idx] = choice;
      onChange(next as ['A' | 'B', 'A' | 'B', 'A' | 'B', 'A' | 'B']);
    };
    return (
      <div className="space-y-4">
        {def.pairs.map(([question, a, b], idx) => (
          <div key={idx}>
            <p className="mb-2 text-sm font-medium text-[var(--foreground)]">{question}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPair(idx, 'A')}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                  arr[idx] === 'A' ? 'border-[var(--accent)] bg-[var(--accent-muted)]' : 'border-[var(--border)]'
                }`}
              >
                {a}
              </button>
              <button
                type="button"
                onClick={() => setPair(idx, 'B')}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                  arr[idx] === 'B' ? 'border-[var(--accent)] bg-[var(--accent-muted)]' : 'border-[var(--border)]'
                }`}
              >
                {b}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (def.type === 'keywords3' && def.keywordOptions) {
    const arr = (value as string[] | undefined) || [];
    const toggle = (kw: string) => {
      const next = arr.includes(kw) ? arr.filter((x) => x !== kw) : [...arr, kw].slice(-3);
      onChange(next as [string, string, string]);
    };
    return (
      <div className="flex flex-wrap gap-2">
        {def.keywordOptions.map((kw) => (
          <button
            key={kw}
            type="button"
            onClick={() => toggle(kw)}
            className={`rounded-lg border px-3 py-2 text-sm ${
              arr.includes(kw) ? 'border-[var(--accent)] bg-[var(--accent-muted)]' : 'border-[var(--border)]'
            }`}
          >
            {kw}
          </button>
        ))}
        <p className="w-full text-xs text-[var(--foreground)]/60">3개 선택</p>
      </div>
    );
  }

  if (def.type === 'slider3' && def.sliderLabels) {
    const arr = (value as [number, number, number] | undefined) || [50, 50, 50];
    const setSlider = (idx: number, v: number) => {
      const next = [...arr];
      next[idx] = v;
      onChange(next as [number, number, number]);
    };
    return (
      <div className="space-y-6">
        {def.sliderLabels!.map((label, idx) => (
          <div key={idx}>
            <p className="mb-2 text-sm text-[var(--foreground)]">{label}</p>
            <input
              type="range"
              min={0}
              max={100}
              value={arr[idx] ?? 50}
              onChange={(e) => setSlider(idx, Number(e.target.value))}
              className="w-full"
            />
            <span className="text-xs text-[var(--foreground)]/60">{arr[idx] ?? 50}</span>
          </div>
        ))}
      </div>
    );
  }

  if (def.type === 'single3' && def.single3Questions) {
    const arr = (value as string[] | undefined) || [];
    const setSingle = (idx: number, id: string) => {
      const next = [...arr];
      next[idx] = id;
      onChange(next as [string, string, string]);
    };
    return (
      <div className="space-y-6">
        {def.single3Questions!.map((sq, idx) => (
          <div key={idx}>
            <p className="mb-2 font-medium text-[var(--foreground)]">{sq.question}</p>
            <div className="space-y-2">
              {sq.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSingle(idx, opt.id)}
                  className={`block w-full rounded-lg border px-3 py-2 text-left text-sm ${
                    arr[idx] === opt.id ? 'border-[var(--accent)] bg-[var(--accent-muted)]' : 'border-[var(--border)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (def.type === 'scenario3' && def.scenarios) {
    const arr = (value as (0 | 1 | 2)[] | undefined) || [];
    const setScen = (idx: number, choice: 0 | 1 | 2) => {
      const next = [...arr];
      next[idx] = choice;
      onChange(next as [0 | 1 | 2, 0 | 1 | 2, 0 | 1 | 2]);
    };
    return (
      <div className="space-y-6">
        {def.scenarios!.map((sc, idx) => (
          <div key={idx}>
            <p className="mb-2 font-medium text-[var(--foreground)]">{sc.situation}</p>
            <div className="space-y-2">
              {sc.choices.map((choice, cIdx) => (
                <button
                  key={cIdx}
                  type="button"
                  onClick={() => setScen(idx, cIdx as 0 | 1 | 2)}
                  className={`block w-full rounded-lg border px-3 py-2 text-left text-sm ${
                    arr[idx] === cIdx ? 'border-[var(--accent)] bg-[var(--accent-muted)]' : 'border-[var(--border)]'
                  }`}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (def.type === 'rank3of6' && def.rank6Options) {
    const r = (value as { first?: string; second?: string; third?: string } | undefined) || {};
    const opts = def.rank6Options!;
    const setRank = (which: 'first' | 'second' | 'third', id: string) => {
      onChange({ ...r, [which]: id } as Phase1SurveyAnswer[keyof Phase1SurveyAnswer]);
    };
    return (
      <div className="space-y-4">
        {(['first', 'second', 'third'] as const).map((which, idx) => (
          <div key={which}>
            <p className="mb-2 text-sm font-medium text-[var(--foreground)]/80">
              {idx === 0 ? '1위' : idx === 1 ? '2위' : '3위'}
            </p>
            <div className="flex flex-wrap gap-2">
              {opts.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRank(which, opt.id)}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    r[which] === opt.id ? 'border-[var(--accent)] bg-[var(--accent-muted)]' : 'border-[var(--border)]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (def.type === 'single' && def.options) {
    const sel = value as string | undefined;
    return (
      <div className="space-y-2">
        {def.options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`block w-full rounded-lg border px-3 py-2 text-left text-sm ${
              sel === opt.id ? 'border-[var(--accent)] bg-[var(--accent-muted)]' : 'border-[var(--border)]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  return null;
}

export default function Phase1SurveyPage() {
  return <Phase1SurveyClient />;
}
