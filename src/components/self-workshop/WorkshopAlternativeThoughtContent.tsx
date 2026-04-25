"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  type AlternativeThoughtSimulation,
  type ScenarioSimulation,
  type AlternativeThought,
  EMPTY_ALTERNATIVE_THOUGHT,
  createEmptyScenario,
} from "@/lib/self-workshop/alternative-thought-simulation";

interface MechanismSnapshot {
  situation: string;
  automatic_thought: string;
  emotion: string;
  behavior: string;
}

interface Props {
  workshopId: string;
  savedData?: Partial<AlternativeThoughtSimulation>;
  /** Step 3 mechanism_analysis에서 추출한 스냅샷 (read-only로 표시) */
  mechanism: MechanismSnapshot;
}

export function WorkshopAlternativeThoughtContent({
  workshopId,
  savedData,
  mechanism,
}: Props) {
  const router = useRouter();

  const initial: AlternativeThoughtSimulation = {
    scenarios:
      savedData?.scenarios && savedData.scenarios.length > 0
        ? savedData.scenarios
        : [
            createEmptyScenario({
              situation: mechanism.situation,
              original_automatic_thought: mechanism.automatic_thought,
              original_emotion: mechanism.emotion,
              original_behavior: mechanism.behavior,
            }),
          ],
    insight: savedData?.insight ?? "",
  };

  const [data, setData] = useState<AlternativeThoughtSimulation>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  const autoSave = useCallback(
    (updated: AlternativeThoughtSimulation) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        await fetch("/api/self-workshop/save-progress", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workshopId,
            field: "alternative_thought_simulation",
            data: updated,
          }),
        });
      }, 1000);
    },
    [workshopId],
  );

  function commit(next: AlternativeThoughtSimulation) {
    setData(next);
    autoSave(next);
  }

  function updateAlternative(
    scenarioIdx: number,
    altIdx: number,
    patch: Partial<AlternativeThought>,
  ) {
    const nextScenarios = data.scenarios.map((s, i) => {
      if (i !== scenarioIdx) return s;
      return {
        ...s,
        alternatives: s.alternatives.map((a, j) =>
          j === altIdx ? { ...a, ...patch } : a,
        ),
      };
    });
    commit({ ...data, scenarios: nextScenarios });
  }

  function addAlternativeSlot(scenarioIdx: number) {
    const nextScenarios = data.scenarios.map((s, i) =>
      i === scenarioIdx
        ? { ...s, alternatives: [...s.alternatives, { ...EMPTY_ALTERNATIVE_THOUGHT }] }
        : s,
    );
    commit({ ...data, scenarios: nextScenarios });
  }

  function updateInsight(value: string) {
    commit({ ...data, insight: value });
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
          field: "alternative_thought_simulation",
          data,
          advanceStep: 8,
        }),
      });
      if (!res.ok) throw new Error("저장에 실패했습니다.");
      router.push("/dashboard/self-workshop/step/8");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  // mechanism_analysis 자체가 비어있으면 step 3으로 안내
  if (!mechanism.situation || !mechanism.automatic_thought) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <p className="text-sm text-[var(--foreground)]/60">
          먼저 트리거 → 자동사고 실습을 완료해 주세요.
        </p>
        <Link
          href="/dashboard/self-workshop/step/3"
          className="mt-4 inline-block text-sm font-medium text-[var(--foreground)] underline"
        >
          자동사고 찾기로 이동 →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 pb-20">
      {/* 인트로 카드 */}
      <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground)]/50">
          같은 상황, 다른 사고였다면
        </p>
        <p className="mt-3 text-base font-bold leading-snug text-[var(--foreground)]">
          생각이 바뀌면 마음과 행동이 어떻게 달라질까요?
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]/70">
          앞 단계에서 핵심 신념을 흔들어 봤어요. 이번엔 같은 상황에 대해 다른
          자동사고를 떠올려 보고, 그 사고가 만들어낼 마음과 행동을 직접 적어
          보세요. 정답은 없어요. 사고가 달라지면 마음도 달라진다는 걸
          몸으로 느껴보는 게 목적이에요.
        </p>
      </div>

      {/* 시나리오 카드 */}
      {data.scenarios.map((scenario, sIdx) => (
        <ScenarioCard
          key={sIdx}
          scenario={scenario}
          onUpdateAlternative={(altIdx, patch) =>
            updateAlternative(sIdx, altIdx, patch)
          }
          onAddSlot={() => addAlternativeSlot(sIdx)}
        />
      ))}

      {/* 마무리 통찰 */}
      <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground)]/50">
          마무리 통찰
        </p>
        <p className="mt-3 text-sm font-bold leading-snug text-[var(--foreground)]">
          이 시뮬레이션을 통해 깨달은 점을 한 줄로 적어보세요
        </p>
        <textarea
          value={data.insight}
          onChange={(e) => updateInsight(e.target.value)}
          rows={3}
          className="mt-4 w-full resize-none rounded-lg border-2 border-[var(--foreground)]/15 bg-white px-3 py-2 text-sm focus:border-[var(--foreground)] focus:outline-none"
          placeholder="예: 같은 상황도 어떤 사고를 거치느냐에 따라 내 마음이 완전히 달라질 수 있구나."
        />
      </div>

      {/* 다음 단계 */}
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
      <div className="text-center pt-2">
        <button
          onClick={handleNext}
          disabled={submitting}
          className="inline-flex rounded-xl border-2 border-[var(--foreground)] bg-[var(--foreground)] px-8 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "저장 중..." : "새 핵심 신념 찾기 →"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────── 시나리오 카드 ─────────────────────────── */

function ScenarioCard({
  scenario,
  onUpdateAlternative,
  onAddSlot,
}: {
  scenario: ScenarioSimulation;
  onUpdateAlternative: (altIdx: number, patch: Partial<AlternativeThought>) => void;
  onAddSlot: () => void;
}) {
  return (
    <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
      {/* 원본 스냅샷 (read-only) */}
      <div className="rounded-lg border-2 border-[var(--foreground)]/15 bg-[var(--surface)] p-4 space-y-3">
        <ReadOnlyField label="상황" value={scenario.situation} />
        <ReadOnlyField
          label="기존 자동사고"
          value={`"${scenario.original_automatic_thought}"`}
          emphasize
        />
        <div className="grid grid-cols-2 gap-3">
          <ReadOnlyField
            label="당시 마음"
            value={scenario.original_emotion || "(작성 없음)"}
          />
          <ReadOnlyField
            label="당시 행동"
            value={scenario.original_behavior || "(작성 없음)"}
          />
        </div>
      </div>

      {/* 구분선 + 안내 */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--foreground)]/15" />
        <p className="text-xs font-semibold text-[var(--foreground)]/60">
          만약 다른 사고를 했다면?
        </p>
        <div className="h-px flex-1 bg-[var(--foreground)]/15" />
      </div>

      {/* 대안 슬롯 */}
      <div className="space-y-5">
        {scenario.alternatives.map((alt, idx) => (
          <AlternativeSlot
            key={idx}
            index={idx + 1}
            alt={alt}
            situation={scenario.situation}
            originalThought={scenario.original_automatic_thought}
            onChange={(patch) => onUpdateAlternative(idx, patch)}
          />
        ))}
      </div>

      {/* 슬롯 추가 버튼 */}
      <button
        type="button"
        onClick={onAddSlot}
        className="mt-5 w-full rounded-lg border-2 border-dashed border-[var(--foreground)]/25 px-4 py-3 text-sm font-medium text-[var(--foreground)]/60 hover:border-[var(--foreground)]/50 hover:text-[var(--foreground)] transition-colors"
      >
        + 다른 대안 사고 추가하기
      </button>
    </div>
  );
}

/* ─────────────────────────── 대안 사고 슬롯 ─────────────────────────── */

function AlternativeSlot({
  index,
  alt,
  situation,
  originalThought,
  onChange,
}: {
  index: number;
  alt: AlternativeThought;
  situation: string;
  originalThought: string;
  onChange: (patch: Partial<AlternativeThought>) => void;
}) {
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[] | null>(null);
  const [aiError, setAiError] = useState("");

  async function loadAiSuggestions() {
    setAiLoading(true);
    setAiError("");
    try {
      const res = await fetch(
        "/api/self-workshop/alternative-thought-suggestions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            situation,
            original_automatic_thought: originalThought,
          }),
        },
      );
      if (!res.ok) throw new Error("AI 제안을 받지 못했어요");
      const json = (await res.json()) as { suggestions?: string[] };
      const list = (json.suggestions ?? []).filter(
        (s) => typeof s === "string" && s.trim().length > 0,
      );
      if (list.length === 0) throw new Error("제안이 비어 있어요");
      setAiSuggestions(list);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "오류가 발생했어요");
    } finally {
      setAiLoading(false);
    }
  }

  function pickSuggestion(suggestion: string) {
    onChange({ alternative_thought: suggestion, ai_assisted: true });
    setAiSuggestions(null);
  }

  return (
    <div className="rounded-lg border-2 border-[var(--foreground)]/15 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--foreground)] text-[11px] font-bold text-white">
          {index}
        </span>
        <button
          type="button"
          onClick={loadAiSuggestions}
          disabled={aiLoading}
          className="text-xs font-medium text-[var(--foreground)]/60 hover:text-[var(--foreground)] disabled:opacity-50"
        >
          {aiLoading ? "생각 중..." : "✨ AI 도움"}
        </button>
      </div>

      {/* AI 제안 박스 */}
      {aiSuggestions && (
        <div className="rounded-lg border-2 border-[var(--foreground)]/20 bg-[var(--surface)] p-3 space-y-2">
          <p className="text-[11px] font-semibold text-[var(--foreground)]/60">
            마음에 드는 후보를 골라보세요
          </p>
          <div className="space-y-1.5">
            {aiSuggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => pickSuggestion(s)}
                className="w-full rounded-md border-2 border-[var(--foreground)]/15 bg-white px-3 py-2 text-left text-sm text-[var(--foreground)]/80 hover:border-[var(--foreground)] hover:text-[var(--foreground)] transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setAiSuggestions(null)}
            className="text-[11px] text-[var(--foreground)]/50 underline"
          >
            닫기
          </button>
        </div>
      )}
      {aiError && <p className="text-xs text-red-600">{aiError}</p>}

      <Field label="대안 자동사고">
        <textarea
          value={alt.alternative_thought}
          onChange={(e) =>
            onChange({ alternative_thought: e.target.value, ai_assisted: false })
          }
          rows={2}
          className="w-full resize-none rounded-md border-2 border-[var(--foreground)]/15 bg-white px-3 py-2 text-sm focus:border-[var(--foreground)] focus:outline-none"
          placeholder="예: 그냥 몸이 피곤한가?"
        />
      </Field>

      <Field label="이 사고로 바라본다면, 내 마음은 ( )">
        <textarea
          value={alt.predicted_emotion}
          onChange={(e) => onChange({ predicted_emotion: e.target.value })}
          rows={2}
          className="w-full resize-none rounded-md border-2 border-[var(--foreground)]/15 bg-white px-3 py-2 text-sm focus:border-[var(--foreground)] focus:outline-none"
          placeholder="예: 걱정되는 마음, 챙겨주고 싶은 마음"
        />
      </Field>

      <Field label="그러면 내 행동은 ( )">
        <textarea
          value={alt.predicted_behavior}
          onChange={(e) => onChange({ predicted_behavior: e.target.value })}
          rows={2}
          className="w-full resize-none rounded-md border-2 border-[var(--foreground)]/15 bg-white px-3 py-2 text-sm focus:border-[var(--foreground)] focus:outline-none"
          placeholder="예: '오늘 힘들었어?'라고 물어볼 것 같다"
        />
      </Field>
    </div>
  );
}

/* ─────────────────────────── 보조 컴포넌트 ─────────────────────────── */

function ReadOnlyField({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground)]/50">
        {label}
      </p>
      <p
        className={`mt-1 text-sm leading-relaxed ${
          emphasize
            ? "font-bold text-[var(--foreground)]"
            : "text-[var(--foreground)]/75"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-[var(--foreground)]/70">
        {label}
      </label>
      {children}
    </div>
  );
}
