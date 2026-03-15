"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ATTACHMENT_QUESTIONS,
  TOTAL_QUESTIONS,
  LIKERT_LABELS,
} from "@/lib/self-hacking/attachment-questions";

export default function AttachmentTestPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"intro" | "test" | "submitting">("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [error, setError] = useState("");

  const question = ATTACHMENT_QUESTIONS[currentIndex];
  const currentAnswer = question ? answers[question.id] : undefined;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === TOTAL_QUESTIONS;
  const progress = ((currentIndex + 1) / TOTAL_QUESTIONS) * 100;

  function handleSelect(value: number) {
    if (!question) return;
    setAnswers((prev) => ({ ...prev, [question.id]: value }));

    // 자동으로 다음 문항으로 이동 (마지막 문항이 아닐 때)
    if (currentIndex < TOTAL_QUESTIONS - 1) {
      setTimeout(() => setCurrentIndex((i) => i + 1), 300);
    }
  }

  function goNext() {
    if (currentIndex < TOTAL_QUESTIONS - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }

  async function handleSubmit() {
    if (!allAnswered) return;

    setPhase("submitting");
    setError("");

    try {
      const res = await fetch("/api/attachment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          sessionStorage.setItem(
            "attachment_answers",
            JSON.stringify(answers)
          );
          router.push("/login?redirect=/self-hacking/attachment");
          return;
        }
        throw new Error(data.error || "제출에 실패했습니다.");
      }

      router.push(`/self-hacking/attachment/result?id=${data.submission_id}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "오류가 발생했습니다.";
      setError(message);
      setPhase("test");
    }
  }

  /* ── 인트로 화면 ── */
  if (phase === "intro") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="max-w-lg w-full text-center">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-4">
            연애 애착 검사
          </h1>
          <p className="text-base text-[var(--foreground)]/70 mb-2">
            친밀 관계 경험 척도(ECR-R) 기반 24문항
          </p>
          <p className="text-sm text-[var(--foreground)]/60 leading-relaxed mb-8">
            각 문항을 읽고, 평소 연애 관계에서 느끼는 정도를
            <br />
            1(전혀 아니다)~5(매우 그렇다)로 선택해 주세요.
            <br />
            정답은 없습니다. 솔직하게 응답해 주세요.
          </p>

          <button
            onClick={() => setPhase("test")}
            className="w-full max-w-xs py-4 rounded-xl border-2 border-[var(--foreground)] bg-white text-[var(--foreground)] font-semibold text-lg hover:bg-[var(--surface)] transition-colors"
          >
            검사 시작하기
          </button>

          <p className="mt-6 text-xs text-[var(--foreground)]/40">
            소요 시간: 약 3~5분 | 검사 무료
          </p>
        </div>
      </div>
    );
  }

  /* ── 제출 중 ── */
  if (phase === "submitting") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-[var(--foreground)] border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-[var(--foreground)]/70">
            답변을 저장하고 있습니다...
          </p>
        </div>
      </div>
    );
  }

  /* ── 검사 화면 ── */
  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="mx-auto max-w-lg">
        {/* 프로그레스 바 */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-[var(--foreground)]/60 mb-2">
            <span>
              {currentIndex + 1} / {TOTAL_QUESTIONS}
            </span>
            <span>{answeredCount}개 답변 완료</span>
          </div>
          <div className="h-1.5 bg-[var(--foreground)]/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--foreground)] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* 문항 */}
        <div className="mb-8">
          <p className="text-lg font-medium text-[var(--foreground)] leading-relaxed">
            {question.text}
          </p>
        </div>

        {/* 5점 리커트 버튼 */}
        <div className="space-y-3 mb-8">
          {LIKERT_LABELS.map((label, i) => {
            const value = i + 1;
            const isSelected = currentAnswer === value;
            return (
              <button
                key={value}
                onClick={() => handleSelect(value)}
                className={`w-full py-3.5 px-4 rounded-xl border-2 text-left text-base font-medium transition-all ${
                  isSelected
                    ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                    : "border-[var(--foreground)]/20 text-[var(--foreground)] hover:border-[var(--foreground)]/50"
                }`}
              >
                <span className="mr-3 text-sm opacity-60">{value}</span>
                {label}
              </button>
            );
          })}
        </div>

        {/* 네비게이션 */}
        <div className="flex items-center justify-between">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="px-5 py-2.5 rounded-lg border-2 border-[var(--foreground)]/20 text-sm font-medium text-[var(--foreground)]/60 hover:border-[var(--foreground)] hover:text-[var(--foreground)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← 이전
          </button>

          {currentIndex < TOTAL_QUESTIONS - 1 ? (
            <button
              onClick={goNext}
              className="px-5 py-2.5 rounded-lg border-2 border-[var(--foreground)] text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
            >
              다음 →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className="px-6 py-2.5 rounded-lg border-2 border-[var(--foreground)] text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              제출하기
            </button>
          )}
        </div>

        {/* 미답변 문항 안내 */}
        {currentIndex === TOTAL_QUESTIONS - 1 && !allAnswered && (
          <p className="mt-4 text-center text-xs text-[var(--foreground)]/50">
            아직 {TOTAL_QUESTIONS - answeredCount}개 문항이 남아 있습니다.
          </p>
        )}

        {/* 에러 메시지 */}
        {error && (
          <p className="mt-4 text-center text-sm text-red-600">{error}</p>
        )}

        {/* 문항 점프 (하단 도트) */}
        <div className="mt-10 flex flex-wrap justify-center gap-1.5">
          {ATTACHMENT_QUESTIONS.map((q, i) => {
            const hasAnswer = answers[q.id] !== undefined;
            const isCurrent = i === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                className={`w-6 h-6 rounded-full text-[10px] font-medium transition-colors ${
                  isCurrent
                    ? "bg-[var(--foreground)] text-white"
                    : hasAnswer
                      ? "bg-[var(--foreground)]/20 text-[var(--foreground)]"
                      : "bg-[var(--foreground)]/5 text-[var(--foreground)]/40"
                }`}
                title={`${i + 1}번 문항`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
