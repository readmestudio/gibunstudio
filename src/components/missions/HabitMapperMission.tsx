"use client";

import { useState } from "react";

type Props = { onSubmit?: (data: { behavior: string; triggers: string; shortTerm: string; longTerm: string; reflection: string }) => void; submitted?: boolean };

export function HabitMapperMission({ onSubmit, submitted = false }: Props) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [behavior, setBehavior] = useState("");
  const [triggers, setTriggers] = useState("");
  const [shortTerm, setShortTerm] = useState("");
  const [longTerm, setLongTerm] = useState("");
  const [reflection, setReflection] = useState("");

  const handleSubmit = () => {
    onSubmit?.({
      behavior,
      triggers,
      shortTerm,
      longTerm,
      reflection,
    });
  };

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg bg-green-50 border border-green-200 p-6 text-center">
          <p className="font-medium text-green-800">아주 중요한 한 걸음을 내디뎠어요</p>
          <p className="mt-2 text-sm text-green-700">
            습관을 반복하게 만드는 트리거를 아는 것만으로도 이 습관의 굴레를 끊어내는 과정은
            이미 시작된 거예요. 오늘 작성한 내용은 심리 상담사에게 전달되어
            7일차 내면 아이 리포트 분석에 활용됩니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {step === 1 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            습관은 어떻게 만들어질까요?
          </h3>
          <p className="text-[var(--foreground)]/80">
            우리가 반복하는 모든 습관은 항상 세 가지로 이루어져 있어요.
            트리거(시작 계기) → 행동 → 결과(보상). 이 구조를 이해하면 습관을 의지가 아니라
            이해를 통해 바꿀 수 있어요.
          </p>
          <div className="rounded-xl border-2 border-[var(--foreground)] bg-[var(--surface)] p-6">
            <p className="font-medium text-[var(--foreground)]">
              내가 고치고 싶은 습관(행동)을 적어보세요.
            </p>
            <input
              type="text"
              value={behavior}
              onChange={(e) => setBehavior(e.target.value)}
              placeholder="예: 불안할 때 계속 휴대폰을 본다"
              className="mt-3 w-full rounded-lg border border-[var(--border)] px-4 py-3 text-[var(--foreground)]"
            />
          </div>
          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={!behavior.trim()}
            className="rounded-lg bg-white px-6 py-3 font-semibold text-[var(--foreground)] border-2 border-[var(--foreground)] disabled:opacity-50 hover:bg-[var(--surface)]"
          >
            다음
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <p className="font-medium text-[var(--foreground)]">
            이 행동을 하게 만드는 트리거는 무엇인가요? (감정, 몸의 감각, 특정 상황)
          </p>
          <textarea
            value={triggers}
            onChange={(e) => setTriggers(e.target.value)}
            placeholder="트리거를 입력하세요"
            rows={4}
            className="w-full rounded-lg border border-[var(--border)] px-4 py-3 text-[var(--foreground)]"
          />
          <button
            type="button"
            onClick={() => setStep(3)}
            disabled={!triggers.trim()}
            className="rounded-lg bg-white px-6 py-3 font-semibold text-[var(--foreground)] border-2 border-[var(--foreground)] disabled:opacity-50 hover:bg-[var(--surface)]"
          >
            다음
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6">
          <p className="font-medium text-[var(--foreground)]">
            그 습관 행동을 했을 때 나에게 돌아오는 것은 무엇인가요?
          </p>
          <div>
            <label className="block text-sm text-[var(--foreground)]/70">단기적 보상</label>
            <input
              type="text"
              value={shortTerm}
              onChange={(e) => setShortTerm(e.target.value)}
              placeholder="단기적으로 느끼는 것"
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--foreground)]"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--foreground)]/70">장기적 보상</label>
            <input
              type="text"
              value={longTerm}
              onChange={(e) => setLongTerm(e.target.value)}
              placeholder="장기적으로 얻는 것"
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--foreground)]"
            />
          </div>
          <button
            type="button"
            onClick={() => setStep(4)}
            disabled={!shortTerm.trim() || !longTerm.trim()}
            className="rounded-lg bg-white px-6 py-3 font-semibold text-[var(--foreground)] border-2 border-[var(--foreground)] disabled:opacity-50 hover:bg-[var(--surface)]"
          >
            다음
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6">
          <p className="rounded-lg bg-[var(--surface)] p-4 font-medium text-[var(--foreground)]">
            {triggers}일 때, {shortTerm}을(를) 위해 {behavior}을(를) 반복하고 있군요.
          </p>
          <div>
            <label className="block font-medium text-[var(--foreground)]">
              Habit Mapper를 완성하고 나니 어떤 생각이 드나요?
            </label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="자유롭게 작성해 주세요"
              rows={5}
              className="mt-2 w-full rounded-lg border border-[var(--border)] px-4 py-3 text-[var(--foreground)]"
            />
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded-lg border border-[var(--border)] px-6 py-3 font-medium text-[var(--foreground)]/80"
            >
              이전
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-lg bg-white px-6 py-3 font-semibold text-[var(--foreground)] border-2 border-[var(--foreground)] hover:bg-[var(--surface)]"
            >
              제출하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
