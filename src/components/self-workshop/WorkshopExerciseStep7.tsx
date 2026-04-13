"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { COGNITIVE_ERRORS } from "@/lib/self-workshop/diagnosis";

interface CopingPlan {
  cognitive_restructuring: {
    original_thought: string;
    cognitive_error_type: string[];
    evidence_for: string;
    evidence_against: string;
    alternative_thought: string;
    belief_rating: number;
  };
  behavioral_experiment: {
    experiment_situation: string;
    prediction: string;
    prediction_belief: number;
    coping_plan: string;
  };
  self_compassion: {
    self_compassion_letter: string;
    rest_permission: string;
    boundary_setting: string;
  };
}

interface Props {
  workshopId: string;
  savedData?: Partial<CopingPlan>;
  prefillThought?: string; // Step 4의 my_automatic_thoughts
  aiSuggestedErrors?: string[]; // Step 5 AI가 식별한 인지적 오류 id들
}

export function WorkshopExerciseStep7({
  workshopId,
  savedData,
  prefillThought,
  aiSuggestedErrors,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"A" | "B" | "C">("A");
  const [data, setData] = useState<CopingPlan>({
    cognitive_restructuring: {
      original_thought: prefillThought ?? "",
      cognitive_error_type: aiSuggestedErrors ?? [],
      evidence_for: "",
      evidence_against: "",
      alternative_thought: "",
      belief_rating: 0,
      ...savedData?.cognitive_restructuring,
    },
    behavioral_experiment: {
      experiment_situation: "",
      prediction: "",
      prediction_belief: 0,
      coping_plan: "",
      ...savedData?.behavioral_experiment,
    },
    self_compassion: {
      self_compassion_letter: "",
      rest_permission: "",
      boundary_setting: "",
      ...savedData?.self_compassion,
    },
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  const autoSave = useCallback(
    (updated: CopingPlan) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        await fetch("/api/self-workshop/save-progress", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workshopId,
            field: "coping_plan",
            data: updated,
          }),
        });
      }, 1000);
    },
    [workshopId]
  );

  function updateCR(key: string, value: string | string[] | number) {
    const updated = {
      ...data,
      cognitive_restructuring: { ...data.cognitive_restructuring, [key]: value },
    };
    setData(updated);
    autoSave(updated);
  }

  function updateBE(key: string, value: string | number) {
    const updated = {
      ...data,
      behavioral_experiment: { ...data.behavioral_experiment, [key]: value },
    };
    setData(updated);
    autoSave(updated);
  }

  function updateSC(key: string, value: string) {
    const updated = {
      ...data,
      self_compassion: { ...data.self_compassion, [key]: value },
    };
    setData(updated);
    autoSave(updated);
  }

  function toggleCognitiveError(errorId: string) {
    const current = data.cognitive_restructuring.cognitive_error_type;
    const next = current.includes(errorId)
      ? current.filter((e) => e !== errorId)
      : [...current, errorId];
    updateCR("cognitive_error_type", next);
  }

  async function handleNext() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/self-workshop/save-progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshopId,
          field: "coping_plan",
          data,
          advanceStep: 7,
        }),
      });
      if (!res.ok) throw new Error("저장에 실패했습니다.");
      router.push("/dashboard/self-workshop/step/7");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  const TABS = [
    { id: "A" as const, label: "인지 재구조화" },
    { id: "B" as const, label: "행동 실험" },
    { id: "C" as const, label: "자기 돌봄" },
  ];

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* 탭 */}
      <div className="flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 rounded-lg border-2 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                : "border-[var(--foreground)]/20 text-[var(--foreground)]/60 hover:border-[var(--foreground)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 워크시트 A: 인지 재구조화 */}
      {activeTab === "A" && (
        <div className="space-y-6">
          <TextareaField
            label="나의 자동적 사고"
            guide="Step 4에서 작성한 내용이 자동으로 불러와졌습니다. 수정도 가능해요."
            value={data.cognitive_restructuring.original_thought}
            onChange={(v) => updateCR("original_thought", v)}
            rows={3}
          />

          <div>
            <label className="mb-1 block text-sm font-semibold text-[var(--foreground)]">
              이 생각에 포함된 인지적 오류
            </label>
            <div className="flex flex-wrap gap-2">
              {COGNITIVE_ERRORS.map((ce) => {
                const selected =
                  data.cognitive_restructuring.cognitive_error_type.includes(ce.id);
                return (
                  <button
                    key={ce.id}
                    onClick={() => toggleCognitiveError(ce.id)}
                    className={`rounded-full border-2 px-3 py-1.5 text-xs font-medium transition-colors ${
                      selected
                        ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                        : "border-[var(--foreground)]/20 text-[var(--foreground)]/60 hover:border-[var(--foreground)]"
                    }`}
                    title={ce.example}
                  >
                    {ce.label}
                  </button>
                );
              })}
            </div>
          </div>

          <TextareaField
            label="이 생각을 뒷받침하는 근거"
            value={data.cognitive_restructuring.evidence_for}
            onChange={(v) => updateCR("evidence_for", v)}
            rows={3}
          />
          <TextareaField
            label="이 생각에 반하는 근거"
            value={data.cognitive_restructuring.evidence_against}
            onChange={(v) => updateCR("evidence_against", v)}
            rows={3}
          />
          <TextareaField
            label="더 균형 잡힌 대안적 생각"
            value={data.cognitive_restructuring.alternative_thought}
            onChange={(v) => updateCR("alternative_thought", v)}
            rows={3}
          />

          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
              대안적 생각을 얼마나 믿을 수 있나요?
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  onClick={() => updateCR("belief_rating", v)}
                  className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-colors ${
                    data.cognitive_restructuring.belief_rating === v
                      ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                      : "border-[var(--foreground)]/20 text-[var(--foreground)]/60"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-xs text-[var(--foreground)]/40">
              <span>전혀 안 믿김</span>
              <span>충분히 믿김</span>
            </div>
          </div>
        </div>
      )}

      {/* 워크시트 B: 행동 실험 */}
      {activeTab === "B" && (
        <div className="space-y-6">
          <TextareaField
            label="시도해 볼 상황"
            guide="예: '주말에 아무것도 안 하고 쉬기', '일찍 퇴근해보기'"
            value={data.behavioral_experiment.experiment_situation}
            onChange={(v) => updateBE("experiment_situation", v)}
            rows={2}
          />
          <TextareaField
            label="예상되는 최악의 결과"
            value={data.behavioral_experiment.prediction}
            onChange={(v) => updateBE("prediction", v)}
            rows={2}
          />

          <div>
            <label className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
              그 결과가 일어날 확률
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  onClick={() => updateBE("prediction_belief", v)}
                  className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-colors ${
                    data.behavioral_experiment.prediction_belief === v
                      ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                      : "border-[var(--foreground)]/20 text-[var(--foreground)]/60"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-xs text-[var(--foreground)]/40">
              <span>거의 없음</span>
              <span>거의 확실</span>
            </div>
          </div>

          <TextareaField
            label="불안하면 어떻게 대처할 것인가"
            value={data.behavioral_experiment.coping_plan}
            onChange={(v) => updateBE("coping_plan", v)}
            rows={3}
          />
        </div>
      )}

      {/* 워크시트 C: 자기 돌봄 서약 */}
      {activeTab === "C" && (
        <div className="space-y-6">
          <TextareaField
            label="성취하지 않는 나에게 보내는 한 마디"
            guide="아무것도 하지 않아도 괜찮은 나에게, 무슨 말을 해주고 싶나요?"
            value={data.self_compassion.self_compassion_letter}
            onChange={(v) => updateSC("self_compassion_letter", v)}
            rows={4}
          />
          <TextareaField
            label="내가 허락하는 쉼의 형태 3가지"
            guide="죄책감 없이 할 수 있는 쉼을 구체적으로 적어보세요."
            value={data.self_compassion.rest_permission}
            onChange={(v) => updateSC("rest_permission", v)}
            placeholder="1. \n2. \n3. "
            rows={3}
          />
          <TextareaField
            label="내가 줄이거나 멈출 한 가지 행동"
            value={data.self_compassion.boundary_setting}
            onChange={(v) => updateSC("boundary_setting", v)}
            rows={2}
          />
        </div>
      )}

      <p className="text-center text-xs text-[var(--foreground)]/40">
        작성 내용은 자동으로 저장됩니다
      </p>

      {error && <p className="text-center text-sm text-red-600">{error}</p>}

      <div className="text-center">
        <button
          onClick={handleNext}
          disabled={submitting}
          className="inline-flex rounded-xl border-2 border-[var(--foreground)] px-8 py-4 text-base font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] disabled:opacity-30"
        >
          {submitting ? "저장 중..." : "전체 써머리 보기 →"}
        </button>
      </div>
    </div>
  );
}

// ── 공통 Textarea 필드 ──

function TextareaField({
  label,
  guide,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  guide?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-[var(--foreground)]">
        {label}
      </label>
      {guide && (
        <p className="mb-2 text-xs text-[var(--foreground)]/60">{guide}</p>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full resize-none rounded-xl border-2 border-[var(--foreground)]/20 px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:border-[var(--foreground)] focus:outline-none transition-colors"
      />
    </div>
  );
}
