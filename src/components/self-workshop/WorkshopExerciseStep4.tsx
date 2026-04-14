"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EMOTION_CHIPS } from "@/lib/self-workshop/diagnosis";

interface MechanismAnalysis {
  my_core_belief: string;
  my_triggers: string;
  my_automatic_thoughts: string;
  my_emotions_body: {
    text: string;
    emotions: string[];
  };
  my_behaviors: string;
  my_cycle_insight: string;
}

interface Props {
  workshopId: string;
  savedData?: Partial<MechanismAnalysis>;
}

const FIELDS = [
  {
    key: "my_core_belief" as const,
    label: "1. 핵심 신념",
    guide: "나에게 반복되는 믿음은 무엇인가요?",
    placeholder: "예: '1등이 아니면 의미 없다', '노력하지 않으면 뒤처진다'",
    rows: 3,
  },
  {
    key: "my_triggers" as const,
    label: "2. 촉발 상황",
    guide: "어떤 상황에서 이 믿음이 강하게 나타나나요? 최근 구체적 상황을 떠올려 보세요.",
    placeholder: "예: '동기가 승진했다는 소식을 들었을 때', '주말에 아무 계획이 없을 때'",
    rows: 4,
  },
  {
    key: "my_automatic_thoughts" as const,
    label: "3. 자동적 사고",
    guide: "그 상황에서 자동으로 떠오른 생각은 무엇이었나요?",
    placeholder: "예: '나는 뭐 하고 있는 거지', '더 열심히 했어야 했는데'",
    rows: 3,
  },
  {
    key: "my_behaviors" as const,
    label: "5. 행동",
    guide: "결국 어떤 행동을 하게 되었나요?",
    placeholder: "예: '밤새 새 프로젝트 계획을 세웠다', '주말에도 일을 했다'",
    rows: 3,
  },
  {
    key: "my_cycle_insight" as const,
    label: "6. 패턴 인식",
    guide: "이 순환이 반복된다고 느끼시나요? 얼마나 자주, 어떤 상황에서 반복되는지 적어보세요.",
    placeholder: "예: '비교 상황이 생길 때마다', '한 달에 서너 번은 이 패턴이 반복된다'",
    rows: 4,
  },
];

export function WorkshopExerciseStep4({ workshopId, savedData }: Props) {
  const router = useRouter();
  const [data, setData] = useState<Partial<MechanismAnalysis>>({
    my_core_belief: "",
    my_triggers: "",
    my_automatic_thoughts: "",
    my_emotions_body: { text: "", emotions: [] },
    my_behaviors: "",
    my_cycle_insight: "",
    ...savedData,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  // 자동 저장 (debounce 1초)
  const autoSave = useCallback(
    (updated: Partial<MechanismAnalysis>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        await fetch("/api/self-workshop/save-progress", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workshopId,
            field: "mechanism_analysis",
            data: updated,
          }),
        });
      }, 1000);
    },
    [workshopId]
  );

  function updateField(key: string, value: string) {
    const updated = { ...data, [key]: value };
    setData(updated);
    autoSave(updated);
  }

  function toggleEmotion(emotion: string) {
    const current = data.my_emotions_body?.emotions ?? [];
    const next = current.includes(emotion)
      ? current.filter((e) => e !== emotion)
      : [...current, emotion];
    const updated = {
      ...data,
      my_emotions_body: { text: data.my_emotions_body?.text ?? "", emotions: next },
    };
    setData(updated);
    autoSave(updated);
  }

  function updateEmotionText(text: string) {
    const updated = {
      ...data,
      my_emotions_body: { text, emotions: data.my_emotions_body?.emotions ?? [] },
    };
    setData(updated);
    autoSave(updated);
  }

  const isComplete =
    (data.my_core_belief?.trim().length ?? 0) > 0 &&
    (data.my_triggers?.trim().length ?? 0) > 0 &&
    (data.my_automatic_thoughts?.trim().length ?? 0) > 0 &&
    (data.my_behaviors?.trim().length ?? 0) > 0;

  async function handleNext() {
    if (!isComplete) return;
    setSubmitting(true);
    setError("");

    try {
      // 최종 저장
      const res = await fetch("/api/self-workshop/save-progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshopId,
          field: "mechanism_analysis",
          data,
          advanceStep: 4,
        }),
      });

      if (!res.ok) throw new Error("저장에 실패했습니다.");

      router.push("/dashboard/self-workshop/step/4");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 pb-16">
      {/* 이전 페이지로 돌아가기 */}
      <Link
        href="/dashboard/self-workshop/step/3"
        className="inline-flex items-center text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:underline"
      >
        ← 이전 페이지 보기
      </Link>

      {/* 실습 안내 */}
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-[var(--foreground)]">
          이제, 당신의 순환을 적어볼 차례예요
        </h3>
        <div className="rounded-xl border-2 border-[var(--foreground)]/20 bg-white p-4">
          <p className="text-sm text-[var(--foreground)]/60">
            앞에서 본 5단계 순환 모델을 떠올리며, 나의 경험을 적어보세요.
            정답은 없습니다. 떠오르는 대로 솔직하게 적으면 됩니다.
          </p>
        </div>
      </div>

      {/* 텍스트 필드들 */}
      {FIELDS.slice(0, 3).map((f) => (
        <div key={f.key}>
          <label className="mb-1 block text-base font-semibold text-[var(--foreground)]">
            {f.label}
          </label>
          <p className="mb-2 text-sm text-[var(--foreground)]/60">{f.guide}</p>
          <textarea
            value={(data[f.key] as string) ?? ""}
            onChange={(e) => updateField(f.key, e.target.value)}
            placeholder={f.placeholder}
            rows={f.rows}
            className="w-full resize-none rounded-xl border-2 border-[var(--foreground)]/20 px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:border-[var(--foreground)] focus:outline-none transition-colors"
          />
        </div>
      ))}

      {/* 감정/신체 반응 (특수 필드) */}
      <div>
        <label className="mb-1 block text-base font-semibold text-[var(--foreground)]">
          4. 정서/신체 반응
        </label>
        <p className="mb-2 text-sm text-[var(--foreground)]/60">
          그때 느낀 감정과 몸의 반응은 어땠나요?
        </p>

        {/* 감정 칩 */}
        <div className="mb-3 flex flex-wrap gap-2">
          {EMOTION_CHIPS.map((emotion) => {
            const selected =
              data.my_emotions_body?.emotions?.includes(emotion) ?? false;
            return (
              <button
                key={emotion}
                onClick={() => toggleEmotion(emotion)}
                className={`rounded-full border-2 px-3 py-1 text-sm font-medium transition-colors ${
                  selected
                    ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                    : "border-[var(--foreground)]/20 text-[var(--foreground)]/60 hover:border-[var(--foreground)]"
                }`}
              >
                {emotion}
              </button>
            );
          })}
        </div>

        <textarea
          value={data.my_emotions_body?.text ?? ""}
          onChange={(e) => updateEmotionText(e.target.value)}
          placeholder="몸의 반응도 함께 적어주세요. 예: '가슴이 답답했다', '잠을 못 잤다'"
          rows={3}
          className="w-full resize-none rounded-xl border-2 border-[var(--foreground)]/20 px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:border-[var(--foreground)] focus:outline-none transition-colors"
        />
      </div>

      {/* 나머지 텍스트 필드 */}
      {FIELDS.slice(3).map((f) => (
        <div key={f.key}>
          <label className="mb-1 block text-base font-semibold text-[var(--foreground)]">
            {f.label}
          </label>
          <p className="mb-2 text-sm text-[var(--foreground)]/60">{f.guide}</p>
          <textarea
            value={(data[f.key] as string) ?? ""}
            onChange={(e) => updateField(f.key, e.target.value)}
            placeholder={f.placeholder}
            rows={f.rows}
            className="w-full resize-none rounded-xl border-2 border-[var(--foreground)]/20 px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:border-[var(--foreground)] focus:outline-none transition-colors"
          />
        </div>
      ))}

      {/* 저장 안내 */}
      <p className="text-center text-xs text-[var(--foreground)]/40">
        작성 내용은 자동으로 저장됩니다
      </p>

      {error && (
        <p className="text-center text-sm text-red-600">{error}</p>
      )}

      {/* 다음 단계 */}
      <div className="text-center">
        <button
          onClick={handleNext}
          disabled={!isComplete || submitting}
          className="inline-flex rounded-xl border-2 border-[var(--foreground)] px-8 py-4 text-base font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-30"
        >
          {submitting ? "저장 중..." : "인지 패턴 분석 받기 →"}
        </button>
        {!isComplete && (
          <p className="mt-2 text-xs text-[var(--foreground)]/50">
            1~5번 항목을 모두 작성해야 다음 단계로 이동할 수 있습니다
          </p>
        )}
      </div>
    </div>
  );
}
