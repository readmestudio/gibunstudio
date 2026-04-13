"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DIAGNOSIS_QUESTIONS,
  LIKERT_OPTIONS,
} from "@/lib/self-workshop/diagnosis";

const TOTAL = DIAGNOSIS_QUESTIONS.length;

interface Props {
  workshopId: string;
  savedAnswers?: Record<string, number>;
}

export function WorkshopDiagnosisContent({ workshopId, savedAnswers }: Props) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>(
    savedAnswers ?? {}
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === TOTAL;
  const question = DIAGNOSIS_QUESTIONS[currentIndex];
  const progress = ((currentIndex + 1) / TOTAL) * 100;

  const handleSelect = useCallback(
    (value: number) => {
      setAnswers((prev) => ({
        ...prev,
        [String(question.id)]: value,
      }));
      // 자동으로 다음 문항으로
      if (currentIndex < TOTAL - 1) {
        setTimeout(() => setCurrentIndex((i) => i + 1), 300);
      }
    },
    [currentIndex, question.id]
  );

  async function handleSubmit() {
    if (!allAnswered) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/self-workshop/diagnosis/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workshopId, answers }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "점수 계산에 실패했습니다.");
      }

      // Step 2 (진단 결과)로 이동
      router.push("/dashboard/self-workshop/step/2");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  if (submitting) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[var(--foreground)] border-t-transparent" />
          <p className="text-[var(--foreground)]/70">진단 결과를 계산하고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      {/* 프로그레스 바 */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-xs text-[var(--foreground)]/60">
          <span>
            {currentIndex + 1} / {TOTAL}
          </span>
          <span>{answeredCount}개 답변 완료</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--foreground)]/10">
          <div
            className="h-full rounded-full bg-[var(--foreground)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 문항 */}
      <div className="mb-8">
        <p className="text-lg font-medium leading-relaxed text-[var(--foreground)]">
          {question.text}
        </p>
      </div>

      {/* 리커트 5점 버튼 */}
      <div className="space-y-3">
        {LIKERT_OPTIONS.map((opt) => {
          const isSelected = answers[String(question.id)] === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => handleSelect(opt.value)}
              className={`w-full rounded-xl border-2 px-5 py-4 text-left text-base font-medium transition-colors ${
                isSelected
                  ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                  : "border-[var(--foreground)]/20 text-[var(--foreground)] hover:border-[var(--foreground)]"
              }`}
            >
              <span className="mr-3 text-sm opacity-60">{opt.value}</span>
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* 네비게이션 */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="rounded-lg border-2 border-[var(--foreground)]/20 px-5 py-2.5 text-sm font-medium text-[var(--foreground)]/60 transition-colors hover:border-[var(--foreground)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-30"
        >
          ← 이전
        </button>

        {currentIndex < TOTAL - 1 ? (
          <button
            onClick={() => setCurrentIndex((i) => i + 1)}
            className="rounded-lg border-2 border-[var(--foreground)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
          >
            다음 →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="rounded-lg border-2 border-[var(--foreground)] px-6 py-2.5 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-30"
          >
            결과 보기
          </button>
        )}
      </div>

      {currentIndex === TOTAL - 1 && !allAnswered && (
        <p className="mt-4 text-center text-xs text-[var(--foreground)]/50">
          아직 {TOTAL - answeredCount}개 문항이 남아 있습니다.
        </p>
      )}

      {error && (
        <p className="mt-4 text-center text-sm text-red-600">{error}</p>
      )}

      {/* 문항 점프 도트 */}
      <div className="mt-10 flex flex-wrap justify-center gap-1.5">
        {DIAGNOSIS_QUESTIONS.map((q, i) => {
          const hasAnswer = String(q.id) in answers;
          const isCurrent = i === currentIndex;
          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={`h-6 w-6 rounded-full text-[10px] font-medium transition-colors ${
                isCurrent
                  ? "bg-[var(--foreground)] text-white"
                  : hasAnswer
                    ? "bg-[var(--foreground)]/20 text-[var(--foreground)]"
                    : "bg-[var(--foreground)]/5 text-[var(--foreground)]/40"
              }`}
              title={`${q.id}번 문항`}
            >
              {q.id}
            </button>
          );
        })}
      </div>
    </div>
  );
}
