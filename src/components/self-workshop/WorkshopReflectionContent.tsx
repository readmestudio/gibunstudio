"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface Reflections {
  new_insight: string;
  action_plan: string;
  self_message: string;
}

interface Props {
  workshopId: string;
  savedData?: Partial<Reflections>;
}

export function WorkshopReflectionContent({ workshopId, savedData }: Props) {
  const router = useRouter();
  const [data, setData] = useState<Reflections>({
    new_insight: "",
    action_plan: "",
    self_message: "",
    ...savedData,
  });
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  const autoSave = useCallback(
    (updated: Reflections) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        await fetch("/api/self-workshop/save-progress", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workshopId,
            field: "reflections",
            data: updated,
          }),
        });
      }, 1000);
    },
    [workshopId]
  );

  function updateField(key: keyof Reflections, value: string) {
    const updated = { ...data, [key]: value };
    setData(updated);
    autoSave(updated);
  }

  async function handleComplete() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/self-workshop/save-progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshopId,
          field: "reflections",
          data,
          complete: true,
        }),
      });
      if (!res.ok) throw new Error("저장에 실패했습니다.");
      setCompleted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  if (completed) {
    return (
      <div className="mx-auto max-w-lg text-center py-16">
        <div className="mb-6 text-6xl">*</div>
        <h2 className="mb-4 text-2xl font-bold text-[var(--foreground)]">
          워크북을 완료했습니다
        </h2>
        <p className="mb-2 text-base text-[var(--foreground)]/70">
          용기 있게 자신의 내면을 들여다본 당신, 정말 대단합니다.
        </p>
        <p className="mb-8 text-sm text-[var(--foreground)]/50">
          오늘 발견한 것들이 내일의 작은 변화가 되기를 바랍니다.
        </p>
        <button
          onClick={() => router.push("/dashboard/self-workshop")}
          className="inline-flex rounded-xl border-2 border-[var(--foreground)] px-8 py-4 text-base font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
        >
          대시보드로 돌아가기
        </button>
      </div>
    );
  }

  const FIELDS = [
    {
      key: "new_insight" as const,
      label: "이 워크북을 통해 새롭게 알게 된 것",
      placeholder: "나에 대해 처음 발견한 것, 또는 알고 있었지만 직면하게 된 것...",
      rows: 4,
    },
    {
      key: "action_plan" as const,
      label: "앞으로 내가 시도해 볼 한 가지",
      placeholder: "오늘부터, 또는 이번 주부터 해볼 수 있는 작은 변화...",
      rows: 3,
    },
    {
      key: "self_message" as const,
      label: "나에게 하고 싶은 말",
      placeholder: "지금의 나에게 건네고 싶은 한마디...",
      rows: 4,
    },
  ];

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div className="rounded-xl border-2 border-[var(--foreground)]/20 bg-white p-4">
        <p className="text-sm text-[var(--foreground)]/60">
          긴 여정을 함께해 주셔서 감사합니다.
          마지막으로, 이 워크북을 통해 느낀 점을 자유롭게 적어보세요.
        </p>
      </div>

      {FIELDS.map((f) => (
        <div key={f.key}>
          <label className="mb-2 block text-base font-semibold text-[var(--foreground)]">
            {f.label}
          </label>
          <textarea
            value={data[f.key]}
            onChange={(e) => updateField(f.key, e.target.value)}
            placeholder={f.placeholder}
            rows={f.rows}
            className="w-full resize-none rounded-xl border-2 border-[var(--foreground)]/20 px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:border-[var(--foreground)] focus:outline-none transition-colors"
          />
        </div>
      ))}

      <p className="text-center text-xs text-[var(--foreground)]/40">
        작성 내용은 자동으로 저장됩니다
      </p>

      {error && <p className="text-center text-sm text-red-600">{error}</p>}

      <div className="text-center">
        <button
          onClick={handleComplete}
          disabled={submitting}
          className="inline-flex rounded-xl border-2 border-[var(--foreground)] px-8 py-4 text-base font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] disabled:opacity-30"
        >
          {submitting ? "저장 중..." : "워크북 완료하기"}
        </button>
      </div>
    </div>
  );
}
