"use client";

import { useState } from "react";
import { THOUGHT_FEELING_ITEMS, type ThoughtFeelingType } from "@/lib/missions/thought-feeling";

type Props = { onSubmit?: (data: { item: string; answer: ThoughtFeelingType }[]) => void; submitted?: boolean };

const OPTIONS: ThoughtFeelingType[] = ["사고", "기분", "상황"];

export function ThoughtFeelingMission({ onSubmit, submitted = false }: Props) {
  const [answers, setAnswers] = useState<Record<number, ThoughtFeelingType>>({});
  const [showLockWarning, setShowLockWarning] = useState(false);

  const updateAnswer = (idx: number, value: ThoughtFeelingType) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [idx]: value }));
  };

  const handleSubmit = () => {
    setShowLockWarning(true);
    const data = THOUGHT_FEELING_ITEMS.map((item, idx) => ({
      item: item.text,
      answer: answers[idx] ?? (null as unknown as ThoughtFeelingType),
    })).filter((r) => r.answer);
    onSubmit?.(data as { item: string; answer: ThoughtFeelingType }[]);
  };

  const allAnswered = THOUGHT_FEELING_ITEMS.every((_, idx) => answers[idx]);

  return (
    <div className="space-y-6">
      <p className="text-[var(--foreground)]/80">
        각 문장을 읽고 사고 / 기분 / 상황 중 무엇인지 판단하세요.
      </p>

      {showLockWarning && !submitted && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
          제출 전까지만 수정할 수 있습니다. 제출 후에는 수정할 수 없습니다.
        </div>
      )}

      {submitted && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
          제출해주셔서 감사합니다. 남겨주신 정보는 심리 상담사에게만 공유됩니다.
        </div>
      )}

      <div className="space-y-3">
        {THOUGHT_FEELING_ITEMS.map((item, idx) => (
          <div key={idx} className="flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-medium text-[var(--foreground)]">{item.text}</p>
            <div className="flex gap-2">
              {OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => updateAnswer(idx, opt)}
                  disabled={submitted}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                    answers[idx] === opt
                      ? "bg-[var(--accent)] text-[var(--foreground)]"
                      : "border border-[var(--border)] text-[var(--foreground)]/80 hover:border-[var(--accent)]"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {!submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allAnswered}
          className="rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--foreground)] disabled:opacity-50 hover:bg-[var(--accent-hover)]"
        >
          제출하기
        </button>
      )}
    </div>
  );
}
