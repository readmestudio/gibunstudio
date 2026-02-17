"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CORE_BELIEF_SENTENCES } from "@/lib/missions/core-belief";

const TOTAL = CORE_BELIEF_SENTENCES.length;

export default function CoreBeliefTestPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"intro" | "test" | "submitting">("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* 문항 이동 시 자동 포커스 */
  useEffect(() => {
    if (phase === "test" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, phase]);

  const currentAnswer = answers[currentIndex] ?? "";
  const answeredCount = Object.values(answers).filter(
    (v) => v.trim().length > 0
  ).length;
  const allAnswered = answeredCount === TOTAL;

  function handleAnswerChange(value: string) {
    setAnswers((prev) => ({ ...prev, [currentIndex]: value }));
  }

  function goNext() {
    if (currentIndex < TOTAL - 1) {
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
      const res = await fetch("/api/core-belief/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      const data = await res.json();

      if (!res.ok) {
        /* 비로그인 → 로그인 유도 */
        if (res.status === 401) {
          sessionStorage.setItem(
            "core_belief_answers",
            JSON.stringify(answers)
          );
          router.push("/login?redirect=/self-hacking/core-belief");
          return;
        }
        throw new Error(data.error || "제출에 실패했습니다.");
      }

      router.push(`/self-hacking/core-belief/result?id=${data.submission_id}`);
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
            핵심 신념 검사
          </h1>
          <p className="text-base text-[var(--foreground)]/70 mb-2">
            문장완성 25문항
          </p>
          <p className="text-sm text-[var(--foreground)]/60 leading-relaxed mb-8">
            아래 문장들의 빈칸을 자유롭게 완성해 주세요.
            <br />
            정답은 없습니다. 떠오르는 대로 솔직하게 적어 주세요.
            <br />
            당신의 무의식 속 핵심 신념을 탐색하는 검사입니다.
          </p>

          <button
            onClick={() => setPhase("test")}
            className="w-full max-w-xs py-4 rounded-xl border-2 border-[var(--foreground)] bg-white text-[var(--foreground)] font-semibold text-lg hover:bg-[var(--surface)] transition-colors"
          >
            검사 시작하기
          </button>

          <p className="mt-6 text-xs text-[var(--foreground)]/40">
            소요 시간: 약 10~15분 | 검사 무료
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
          <p className="text-[var(--foreground)]/70">답변을 저장하고 있습니다...</p>
        </div>
      </div>
    );
  }

  /* ── 검사 화면 ── */
  const sentence = CORE_BELIEF_SENTENCES[currentIndex];
  const progress = ((currentIndex + 1) / TOTAL) * 100;

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="mx-auto max-w-lg">
        {/* 프로그레스 바 */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-[var(--foreground)]/60 mb-2">
            <span>
              {currentIndex + 1} / {TOTAL}
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
        <div className="mb-6">
          <p className="text-lg font-medium text-[var(--foreground)] leading-relaxed">
            {sentence}
          </p>
        </div>

        {/* 입력 */}
        <textarea
          ref={inputRef}
          value={currentAnswer}
          onChange={(e) => handleAnswerChange(e.target.value)}
          placeholder="떠오르는 대로 자유롭게 적어 주세요..."
          rows={3}
          className="w-full resize-none rounded-xl border-2 border-[var(--foreground)]/20 px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:border-[var(--foreground)] focus:outline-none transition-colors"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (currentIndex < TOTAL - 1) goNext();
            }
          }}
        />

        {/* 네비게이션 */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="px-5 py-2.5 rounded-lg border-2 border-[var(--foreground)]/20 text-sm font-medium text-[var(--foreground)]/60 hover:border-[var(--foreground)] hover:text-[var(--foreground)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← 이전
          </button>

          {currentIndex < TOTAL - 1 ? (
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
        {currentIndex === TOTAL - 1 && !allAnswered && (
          <p className="mt-4 text-center text-xs text-[var(--foreground)]/50">
            아직 {TOTAL - answeredCount}개 문항이 남아 있습니다.
          </p>
        )}

        {/* 에러 메시지 */}
        {error && (
          <p className="mt-4 text-center text-sm text-red-600">{error}</p>
        )}

        {/* 문항 점프 (하단 도트) */}
        <div className="mt-10 flex flex-wrap justify-center gap-1.5">
          {Array.from({ length: TOTAL }, (_, i) => {
            const hasAnswer = (answers[i] ?? "").trim().length > 0;
            const isCurrent = i === currentIndex;
            return (
              <button
                key={i}
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
