"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { COGNITIVE_ERRORS } from "@/lib/self-workshop/diagnosis";
import {
  type BeliefDestroyData,
  sanitizeCognitiveErrors,
} from "@/lib/self-workshop/belief-destroy";
import { type CognitiveErrorId } from "@/lib/self-workshop/cognitive-errors";

interface Props {
  workshopId: string;
  savedData?: Partial<BeliefDestroyData>;
  /** FIND_OUT 2단계 synthesis.belief_line — 반박 대상 */
  beliefLine: string;
  /** Step 3 mechanism_analysis.automatic_thought */
  prefillAutomaticThought?: string;
  /** Step 5 mechanism_insights.cognitive_errors.items[].id */
  prefillCognitiveErrors?: CognitiveErrorId[];
}

export function WorkshopBeliefDestroyContent({
  workshopId,
  savedData,
  beliefLine,
  prefillAutomaticThought,
  prefillCognitiveErrors,
}: Props) {
  const router = useRouter();

  // 사용자가 한 번이라도 저장한 적 있으면 saved 우선, 아니면 prefill
  const initial: BeliefDestroyData = {
    input_belief_line: savedData?.input_belief_line ?? beliefLine,
    triple_column: {
      automatic_thought:
        savedData?.triple_column?.automatic_thought ??
        prefillAutomaticThought ??
        "",
      cognitive_errors: sanitizeCognitiveErrors(
        savedData?.triple_column?.cognitive_errors ?? prefillCognitiveErrors
      ),
      rational_response: savedData?.triple_column?.rational_response ?? "",
    },
    double_standard: {
      letter_to_friend: savedData?.double_standard?.letter_to_friend ?? "",
    },
    evidence_review: {
      supporting: savedData?.evidence_review?.supporting ?? "",
      refuting: savedData?.evidence_review?.refuting ?? "",
    },
    cost_benefit: {
      benefits: savedData?.cost_benefit?.benefits ?? "",
      costs: savedData?.cost_benefit?.costs ?? "",
    },
    ai_extra_points: savedData?.ai_extra_points,
  };

  const [data, setData] = useState<BeliefDestroyData>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  const autoSave = useCallback(
    (updated: BeliefDestroyData) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        await fetch("/api/self-workshop/save-progress", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workshopId,
            field: "belief_destroy",
            data: updated,
          }),
        });
      }, 1000);
    },
    [workshopId]
  );

  function update(patch: Partial<BeliefDestroyData>) {
    const updated = { ...data, ...patch };
    setData(updated);
    autoSave(updated);
  }

  function toggleCognitiveError(id: CognitiveErrorId) {
    const current = data.triple_column.cognitive_errors;
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    update({
      triple_column: { ...data.triple_column, cognitive_errors: next },
    });
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
          field: "belief_destroy",
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

  // belief_line이 비어있으면 이전 단계로 안내
  if (!beliefLine) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <p className="text-sm text-[var(--foreground)]/60">
          먼저 핵심 신념 찾기 실습을 완료해 주세요.
        </p>
        <Link
          href="/dashboard/self-workshop/step/4"
          className="mt-4 inline-block text-sm font-medium text-[var(--foreground)] underline"
        >
          핵심 신념 찾기로 이동 →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 pb-20">
      {/* 인트로 카드 */}
      <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground)]/50">
          반박을 시작해요
        </p>
        <p className="mt-3 text-base font-bold leading-snug text-[var(--foreground)]">
          오랜 시간 당신을 움직여 온 핵심 믿음
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]/70">
          이 믿음은 오랜 시간 당신을 지켜준 보호막이기도 했어요. 하지만
          지금은 당신을 더 자주 다치게 하고 있어요. 네 가지 도구로 천천히
          흔들어볼게요. 정답은 없어요. 정답을 찾는 게 목적이 아니라,
          이 믿음에 균열을 내는 게 목적이에요.
        </p>
        <div className="mt-5 rounded-lg border-2 border-[var(--foreground)]/20 bg-[var(--surface)] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground)]/50">
            반박 대상
          </p>
          <p className="mt-2 text-base font-bold leading-relaxed text-[var(--foreground)]">
            “{beliefLine}”
          </p>
        </div>
      </div>

      {/* 섹션 A: 삼중 컬럼 */}
      <SectionCard
        index={1}
        label="삼중 컬럼 기법"
        guide="자동사고 옆에 인지 왜곡을 짚고, 합리적 반응을 직접 써보세요. 강의에서 배운 핵심 기법이에요."
      >
        <div className="space-y-4">
          <Field label="자동사고 (수정 가능)">
            <textarea
              value={data.triple_column.automatic_thought}
              onChange={(e) =>
                update({
                  triple_column: {
                    ...data.triple_column,
                    automatic_thought: e.target.value,
                  },
                })
              }
              rows={2}
              className="w-full resize-none rounded-lg border-2 border-[var(--foreground)]/15 bg-white px-3 py-2 text-sm focus:border-[var(--foreground)] focus:outline-none"
              placeholder="예: 나는 쉬면 뒤쳐진다"
            />
          </Field>

          <Field label="이 자동사고에서 보이는 인지 왜곡 (해당되는 것 모두 선택)">
            <div className="grid grid-cols-2 gap-2">
              {COGNITIVE_ERRORS.map((err) => {
                const checked = data.triple_column.cognitive_errors.includes(
                  err.id as CognitiveErrorId
                );
                return (
                  <button
                    key={err.id}
                    type="button"
                    onClick={() =>
                      toggleCognitiveError(err.id as CognitiveErrorId)
                    }
                    className={`rounded-lg border-2 px-3 py-2 text-left text-xs transition-colors ${
                      checked
                        ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                        : "border-[var(--foreground)]/15 bg-white text-[var(--foreground)]/70 hover:border-[var(--foreground)]/40"
                    }`}
                  >
                    <span className="font-semibold">{err.label}</span>
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="합리적 반응 — 이 자동사고에 어떻게 답해주고 싶나요?">
            <textarea
              value={data.triple_column.rational_response}
              onChange={(e) =>
                update({
                  triple_column: {
                    ...data.triple_column,
                    rational_response: e.target.value,
                  },
                })
              }
              rows={4}
              className="w-full resize-none rounded-lg border-2 border-[var(--foreground)]/15 bg-white px-3 py-2 text-sm focus:border-[var(--foreground)] focus:outline-none"
              placeholder="예: 쉬는 게 뒤처지는 게 아니라 회복이야. 회복이 있어야 다시 일어설 수 있어."
            />
          </Field>
        </div>
      </SectionCard>

      {/* 섹션 B: 이중 표준 */}
      <SectionCard
        index={2}
        label="이중 표준 기법"
        guide="당신이 자신에게 적용하는 잣대와, 사랑하는 친구에게 적용하는 잣대는 같나요?"
      >
        <Field label='사랑하는 친구가 같은 핵심 믿음("{beliefLine}")을 갖고 있다면, 친구에게 뭐라고 말해주고 싶나요?'>
          <textarea
            value={data.double_standard.letter_to_friend}
            onChange={(e) =>
              update({
                double_standard: { letter_to_friend: e.target.value },
              })
            }
            rows={5}
            className="w-full resize-none rounded-lg border-2 border-[var(--foreground)]/15 bg-white px-3 py-2 text-sm focus:border-[var(--foreground)] focus:outline-none"
            placeholder="예: 너는 이미 충분히 잘하고 있어. 잠깐 쉬는 건 게으름이 아니라 너 자신을 지키는 일이야."
          />
        </Field>
      </SectionCard>

      {/* 섹션 C: 증거 검토 */}
      <SectionCard
        index={3}
        label="증거 검토"
        guide="감정이 아닌 사실로 따져봐요. 양쪽을 다 적어보면 믿음의 무게가 달라져요."
      >
        <div className="space-y-4">
          <Field label='이 믿음("{beliefLine}")을 뒷받침하는 증거'>
            <textarea
              value={data.evidence_review.supporting}
              onChange={(e) =>
                update({
                  evidence_review: {
                    ...data.evidence_review,
                    supporting: e.target.value,
                  },
                })
              }
              rows={4}
              className="w-full resize-none rounded-lg border-2 border-[var(--foreground)]/15 bg-white px-3 py-2 text-sm focus:border-[var(--foreground)] focus:outline-none"
              placeholder="예: 작년에 휴식했을 때 동료에게 따라잡혔다고 느꼈던 적이 있다."
            />
          </Field>
          <Field label="이 믿음을 반박하는 증거">
            <textarea
              value={data.evidence_review.refuting}
              onChange={(e) =>
                update({
                  evidence_review: {
                    ...data.evidence_review,
                    refuting: e.target.value,
                  },
                })
              }
              rows={4}
              className="w-full resize-none rounded-lg border-2 border-[var(--foreground)]/15 bg-white px-3 py-2 text-sm focus:border-[var(--foreground)] focus:outline-none"
              placeholder="예: 휴식 후 오히려 집중력이 좋아져 더 좋은 결과를 낸 적이 여러 번 있다."
            />
          </Field>
        </div>
      </SectionCard>

      {/* 섹션 D: 비용-편익 */}
      <SectionCard
        index={4}
        label="비용-편익 분석"
        guide="이 믿음을 계속 갖고 살 때 어떤 일이 벌어지는지 양쪽을 다 적어보세요."
      >
        <div className="space-y-4">
          <Field label="이 믿음을 계속 갖고 있을 때의 장점 / 효용">
            <textarea
              value={data.cost_benefit.benefits}
              onChange={(e) =>
                update({
                  cost_benefit: {
                    ...data.cost_benefit,
                    benefits: e.target.value,
                  },
                })
              }
              rows={3}
              className="w-full resize-none rounded-lg border-2 border-[var(--foreground)]/15 bg-white px-3 py-2 text-sm focus:border-[var(--foreground)] focus:outline-none"
              placeholder="예: 단기적으로 더 많은 성과를 낸다. 게으르다는 비난을 피할 수 있다."
            />
          </Field>
          <Field label="이 믿음을 계속 갖고 있을 때의 단점 / 비용">
            <textarea
              value={data.cost_benefit.costs}
              onChange={(e) =>
                update({
                  cost_benefit: {
                    ...data.cost_benefit,
                    costs: e.target.value,
                  },
                })
              }
              rows={3}
              className="w-full resize-none rounded-lg border-2 border-[var(--foreground)]/15 bg-white px-3 py-2 text-sm focus:border-[var(--foreground)] focus:outline-none"
              placeholder="예: 만성 피로, 관계 단절, 즐거움이 사라짐, 몸이 자꾸 아픔."
            />
          </Field>
        </div>
      </SectionCard>

      {/* 다음 단계 */}
      {error && (
        <p className="text-center text-sm text-red-600">{error}</p>
      )}
      <div className="text-center pt-2">
        <button
          onClick={handleNext}
          disabled={submitting}
          className="inline-flex rounded-xl border-2 border-[var(--foreground)] bg-[var(--foreground)] px-8 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "저장 중..." : "대안 자동사고 시뮬레이션 →"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────── 보조 컴포넌트 ─────────────────────────── */

function SectionCard({
  index,
  label,
  guide,
  children,
}: {
  index: number;
  label: string;
  guide: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--foreground)] text-xs font-bold text-white">
          {index}
        </span>
        <p className="text-base font-bold text-[var(--foreground)]">{label}</p>
      </div>
      <p className="mb-5 text-xs leading-relaxed text-[var(--foreground)]/60">
        {guide}
      </p>
      {children}
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
