"use client";

import { useState } from "react";
import { CORE_BELIEF_SENTENCES } from "@/lib/missions/core-belief";

type Props = { onSubmit?: (data: Record<string, string>) => void; submitted?: boolean };

export function CoreBeliefMission({ onSubmit, submitted = false }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const updateAnswer = (key: string, value: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    onSubmit?.(answers);
  };

  return (
    <div className="space-y-6">
      <p className="text-[var(--foreground)]/80">
        각 문장의 뒷부분이 빠져 있습니다. 맨 먼저 떠오르는 생각으로 완성해 주세요.
        솔직한 마음을 그대로 나타내고, 빠뜨리지 말고 모두 작성해 주세요.
      </p>

      {submitted && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
          제출해주셔서 감사합니다. 남겨주신 정보는 심리 상담사에게만 공유됩니다.
          답변 내용에 대한 분석은 7일차 최종 리포트 해석에서 확인하실 수 있습니다.
        </div>
      )}

      <div className="space-y-4">
        {CORE_BELIEF_SENTENCES.map((sentence) => (
          <div key={sentence} className="rounded-lg border border-[var(--border)] bg-white p-4">
            <label className="block text-sm font-medium text-[var(--foreground)]">
              {sentence}
            </label>
            <input
              type="text"
              value={answers[sentence] ?? ""}
              onChange={(e) => updateAnswer(sentence, e.target.value)}
              disabled={submitted}
              placeholder="여기에 입력하세요"
              className="mt-2 w-full rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--foreground)] placeholder:text-[var(--foreground)]/40 disabled:bg-[var(--surface)]"
            />
          </div>
        ))}
      </div>

      {!submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          className="rounded-lg bg-white px-6 py-3 font-semibold text-[var(--foreground)] border-2 border-[var(--foreground)] hover:bg-[var(--surface)]"
        >
          제출하기
        </button>
      )}
    </div>
  );
}
