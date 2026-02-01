"use client";

import { useState } from "react";
import Link from "next/link";
import {
  EMOTION_WORDS,
  WORD_TO_BASIC,
  BASIC_EMOTION_LABELS,
  type BasicEmotion,
} from "@/lib/onboarding/emotion-mapping";
import { ONBOARDING_QUESTIONS } from "@/lib/onboarding/questions";
import { computeResult } from "@/lib/onboarding/result";

type Step = "step1" | "step2" | "result";

type Step2Answer = { questionId: number; emotion: BasicEmotion; weight: number };

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("step1");
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [step2Answers, setStep2Answers] = useState<Step2Answer[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [result, setResult] = useState<{ primary: BasicEmotion; secondary: BasicEmotion[] } | null>(null);

  const selectedBasics = [...new Set(selectedWords.map((w) => WORD_TO_BASIC[w]).filter(Boolean))];

  const toggleWord = (word: string) => {
    setSelectedWords((prev) =>
      prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]
    );
  };

  const canProceedStep1 = selectedWords.length >= 3;
  const showTooManyWarning = selectedWords.length >= 8;

  const handleStep1Next = () => {
    if (canProceedStep1) setStep("step2");
  };

  const handleStep2Answer = (emotion: BasicEmotion, weight: number) => {
    const q = ONBOARDING_QUESTIONS[currentQuestion];
    setStep2Answers((prev) => {
      const filtered = prev.filter((a) => a.questionId !== q.id);
      return [...filtered, { questionId: q.id, emotion, weight }];
    });
    if (currentQuestion < ONBOARDING_QUESTIONS.length - 1) {
      setCurrentQuestion((c) => c + 1);
    } else {
      const r = computeResult(
        [...step2Answers.filter((a) => a.questionId !== q.id), { questionId: q.id, emotion, weight }],
        selectedBasics
      );
      setResult(r);
      setStep("result");
    }
  };

  const getChoiceWeight = (emotion: BasicEmotion) =>
    selectedBasics.includes(emotion) ? 1 : 0.5;

  if (step === "step1") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            요즘의 감정 상태 진단
          </h1>
          <p className="mt-3 text-[var(--foreground)]/70">
            요즘의 나와 가까운 감정을 골라보세요. 평소의 내가 아니라, 최근 1~2주의 상태를 떠올려 주세요. 정답은 없고, 여러 개 골라도 괜찮아요.
          </p>
        </div>

        {showTooManyWarning && (
          <div className="mb-6 rounded-lg bg-[var(--accent-muted)] px-4 py-3 text-sm text-[var(--foreground)]">
            요즘 특히 자주 느낀 감정 위주로 조금만 줄여주세요
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {EMOTION_WORDS.map((word) => (
            <button
              key={word}
              type="button"
              onClick={() => toggleWord(word)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                selectedWords.includes(word)
                  ? "bg-[var(--accent)] text-[var(--foreground)]"
                  : "border border-[var(--border)] bg-white text-[var(--foreground)]/80 hover:border-[var(--accent)]"
              }`}
            >
              {word}
            </button>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-between">
          <p className="text-sm text-[var(--foreground)]/60">
            {selectedWords.length}개 선택 (최소 3개)
          </p>
          <button
            type="button"
            onClick={handleStep1Next}
            disabled={!canProceedStep1}
            className="rounded-lg bg-[var(--accent)] px-6 py-2.5 font-semibold text-[var(--foreground)] disabled:opacity-50 hover:bg-[var(--accent-hover)] disabled:hover:bg-[var(--accent)]"
          >
            다음
          </button>
        </div>
      </div>
    );
  }

  if (step === "step2") {
    const q = ONBOARDING_QUESTIONS[currentQuestion];
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8">
          <p className="text-sm text-[var(--foreground)]/60">
            {currentQuestion + 1} / {ONBOARDING_QUESTIONS.length}
          </p>
          <h2 className="mt-2 text-lg font-semibold text-[var(--foreground)]">
            아래 문장은 '평소의 나'가 아니라, '요즘의 나(최근 1~2주)'에 가장 가까운 문장을 고르는 검사입니다. 맞고 틀림은 없어요.
          </h2>
        </div>

        <p className="mb-6 text-xl font-medium text-[var(--foreground)]">{q.text}</p>

        <div className="space-y-3">
          {q.choices.map((choice) => {
            const isSelected = selectedBasics.includes(choice.emotion);
            return (
              <button
                key={choice.text}
                type="button"
                onClick={() => handleStep2Answer(choice.emotion, getChoiceWeight(choice.emotion))}
                className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${
                  isSelected
                    ? "border-[var(--accent)] bg-[var(--accent-muted)]"
                    : "border-[var(--border)] bg-white hover:border-[var(--foreground)]/30"
                }`}
              >
                <span className="block font-medium text-[var(--foreground)]">{choice.text}</span>
                {!isSelected && (
                  <span className="mt-1 block text-xs text-[var(--foreground)]/50">덜 가까움</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // result
  if (!result) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">
        요즘의 나
      </h1>
      <p className="mt-2 text-[var(--foreground)]/70">
        요즘의 당신은 아래 감정 상태에 더 가깝습니다.
      </p>

      <div className="mt-10 space-y-6">
        <div className="rounded-xl border border-[var(--border)] bg-white p-6">
          <p className="text-sm font-medium text-[var(--foreground)]/60">주된 감정</p>
          <p className="mt-2 text-xl font-bold text-[var(--foreground)]">
            {BASIC_EMOTION_LABELS[result.primary]}
          </p>
          <p className="mt-2 text-[var(--foreground)]/70">
            요즘 {BASIC_EMOTION_LABELS[result.primary]}이(가) 더 자주 느껴지는 상태예요.
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <p className="text-sm font-medium text-[var(--foreground)]/60">보조 감정</p>
          <p className="mt-2 font-semibold text-[var(--foreground)]">
            {result.secondary.map((e) => BASIC_EMOTION_LABELS[e]).join(", ")}
          </p>
          <p className="mt-2 text-sm text-[var(--foreground)]/70">
            {BASIC_EMOTION_LABELS[result.secondary[0]]}, {BASIC_EMOTION_LABELS[result.secondary[1]]}도 함께 자주 느껴지고 있어요.
          </p>
        </div>
      </div>

      <div className="mt-12 rounded-xl border-2 border-[var(--accent)] bg-[var(--accent-muted)] p-6">
        <h2 className="text-lg font-bold text-[var(--foreground)]">
          왜 이 감정이 반복될까?
        </h2>
        <p className="mt-2 text-[var(--foreground)]/70">
          7일 내면 아이 찾기 프로그램으로 반복되는 패턴을 찾아보세요.
        </p>
        <Link
          href="/programs/7day"
          className="mt-6 inline-flex rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--foreground)] hover:bg-[var(--accent-hover)]"
        >
          7일 프로그램 알아보기
        </Link>
      </div>
    </div>
  );
}
