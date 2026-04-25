"use client";

import { useState, useCallback, useMemo } from "react";
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
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // 재진입 시점의 기준 스냅샷 — 이후 답 변경 감지에 사용
  const initialAnswers = useMemo(() => savedAnswers ?? {}, [savedAnswers]);
  const hasPreviousSubmission = Object.keys(initialAnswers).length === TOTAL;
  const answersChanged =
    hasPreviousSubmission &&
    DIAGNOSIS_QUESTIONS.some(
      (q) => answers[String(q.id)] !== initialAnswers[String(q.id)]
    );

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === TOTAL;
  // currentIndex가 어떤 이유로든 범위를 벗어나도 안전하게 첫/마지막 문항으로 클램프
  const safeIndex = Math.min(Math.max(currentIndex, 0), TOTAL - 1);
  const question = DIAGNOSIS_QUESTIONS[safeIndex];
  const questionId = question.id;
  const progress = ((safeIndex + 1) / TOTAL) * 100;

  const handleSelect = useCallback(
    (value: number) => {
      setAnswers((prev) => ({
        ...prev,
        [String(questionId)]: value,
      }));
      // 자동으로 다음 문항으로 — 범위 밖으로 나가지 않도록 Math.min 캡
      if (safeIndex < TOTAL - 1) {
        setTimeout(
          () => setCurrentIndex((i) => Math.min(i + 1, TOTAL - 1)),
          300,
        );
      }
    },
    [safeIndex, questionId]
  );

  function handleSubmitClick() {
    if (!allAnswered) return;
    // 기존 제출이 있고 답이 바뀐 경우에만 리셋 경고 모달 노출
    if (answersChanged) {
      setShowResetConfirm(true);
      return;
    }
    void submitDiagnosis();
  }

  async function submitDiagnosis() {
    setShowResetConfirm(false);
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

      // Step 2 (진단 결과)로 이동 — router cache 완전 우회 위해 full navigation.
      // (router.push + refresh로는 stale RSC payload가 잡히는 케이스가 있어서)
      window.location.href = "/dashboard/self-workshop/step/2";
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
      {/* 재진입 안내 배너 */}
      {hasPreviousSubmission && (
        <div className="mb-6 rounded-xl border-2 border-[var(--foreground)]/20 bg-[var(--surface)]/50 p-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">
            이미 진단을 완료하셨어요
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--foreground)]/70">
            답을 <strong>그대로 두고 결과 보기</strong>를 누르면 이후 단계의 진행 상태가
            그대로 유지돼요. 답을 바꾸시면 진단 결과가 달라지기 때문에
            Step 2부터 다시 짚어봐야 해요.
          </p>
        </div>
      )}

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

        {safeIndex < TOTAL - 1 ? (
          <button
            onClick={() => setCurrentIndex((i) => Math.min(i + 1, TOTAL - 1))}
            className="rounded-lg border-2 border-[var(--foreground)] px-5 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
          >
            다음 →
          </button>
        ) : (
          <button
            onClick={handleSubmitClick}
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

      {/* 답 변경 시 리셋 경고 모달 */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowResetConfirm(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-confirm-title"
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border-2 border-[var(--foreground)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="reset-confirm-title"
              className="text-lg font-bold text-[var(--foreground)]"
            >
              답이 바뀌었어요
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]/75">
              진단 답변이 달라졌기 때문에 진단 결과도 다시 계산돼요.
              <br />
              <strong>Step 2부터 다시 확인</strong>해야 하지만, 이전에 작성하신
              Step 3 이후의 답변은 그대로 남아 있어요.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 rounded-lg border-2 border-[var(--foreground)]/20 px-4 py-2.5 text-sm font-medium text-[var(--foreground)]/70 transition-colors hover:border-[var(--foreground)]/40"
              >
                다시 확인할게요
              </button>
              <button
                type="button"
                onClick={submitDiagnosis}
                className="flex-1 rounded-lg border-2 border-[var(--foreground)] bg-[var(--foreground)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                그래도 진행할게요
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
