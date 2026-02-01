"use client";

import { useState } from "react";
import { COGNITIVE_ERROR_ITEMS } from "@/lib/missions/cognitive-error";

type Props = { onSubmit?: (data: string[]) => void; submitted?: boolean };

export function CognitiveErrorMission({ onSubmit, submitted = false }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    if (submitted) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = () => {
    onSubmit?.(Array.from(selected));
  };

  return (
    <div className="space-y-6">
      <p className="text-[var(--foreground)]/80">
        다음 중 자신을 서술하는 내용이거나 자주 하는 생각에 체크하세요.
      </p>

      {submitted && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
          제출해주셔서 감사합니다. 남겨주신 정보는 심리 상담사에게만 공유됩니다.
          답변 내용에 대한 분석은 7일차 최종 리포트 해석에서 확인하실 수 있습니다.
        </div>
      )}

      <div className="space-y-3">
        {COGNITIVE_ERROR_ITEMS.map((item) => (
          <label
            key={item.id}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
              selected.has(item.id)
                ? "border-[var(--accent)] bg-[var(--accent-muted)]"
                : "border-[var(--border)] bg-white hover:border-[var(--foreground)]/20"
            } ${submitted ? "cursor-default" : ""}`}
          >
            <input
              type="checkbox"
              checked={selected.has(item.id)}
              onChange={() => toggle(item.id)}
              disabled={submitted}
              className="mt-1 h-4 w-4 rounded border-[var(--border)]"
            />
            <div>
              <p className="font-medium text-[var(--foreground)]">{item.label}</p>
              <p className="text-sm text-[var(--foreground)]/70">{item.desc}</p>
            </div>
          </label>
        ))}
      </div>

      {!submitted && (
        <button
          type="button"
          onClick={handleSubmit}
          className="rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--foreground)] hover:bg-[var(--accent-hover)]"
        >
          제출하기
        </button>
      )}
    </div>
  );
}
