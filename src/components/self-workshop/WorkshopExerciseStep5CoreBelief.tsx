"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  isAnalysisReport,
  type AnalysisReport,
} from "@/lib/self-workshop/analysis-report";

/* ─────────────────────────────── 타입 ─────────────────────────────── */

interface Answers {
  selected_hot_thought: string;
  q1_selected: string[];
  q1_custom: string;
  q2_selected: string[];
  q2_custom: string;
  q3_selected: string[];
  q3_custom: string;
  q4_origin: string;
  q5_compassion: string;
}

interface MidHypothesis {
  hot_thought: string;
  core_belief: string;
  generated_at: string;
}

interface Synthesis {
  belief_line: string;
  how_it_works: string;
  reframe_invitation: string;
}

export interface CoreBeliefExcavation {
  answers: Answers;
  mid_hypothesis?: MidHypothesis;
  synthesis?: Synthesis;
}

interface MechanismAnalysisData {
  automatic_thought?: string;
  common_thoughts_checked?: string[];
  candidate_thoughts?: string[];
}

interface Props {
  workshopId: string;
  savedData?: Partial<CoreBeliefExcavation>;
  mechanismInsights: unknown;
  mechanismAnalysis: unknown;
}

const EMPTY_ANSWERS: Answers = {
  selected_hot_thought: "",
  q1_selected: [],
  q1_custom: "",
  q2_selected: [],
  q2_custom: "",
  q3_selected: [],
  q3_custom: "",
  q4_origin: "",
  q5_compassion: "",
};

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function migrateAnswers(
  saved: Record<string, unknown> | undefined
): Partial<Answers> {
  if (!saved) return {};
  // 레거시 자유텍스트 필드(q1_consequence, q1_meaning 등)는 q1_custom으로 이관해
  // 기존 진행 중 사용자의 답을 잃지 않도록 함.
  const legacyQ1 =
    (saved.q1_consequence as string) ?? (saved.q1_meaning as string) ?? "";
  const legacyQ2 =
    (saved.q2_fear as string) ?? (saved.q2_about_self as string) ?? "";
  const legacyQ3 =
    (saved.q3_identity as string) ?? (saved.q3_core_sentence as string) ?? "";
  return {
    selected_hot_thought: (saved.selected_hot_thought as string) ?? "",
    q1_selected: asStringArray(saved.q1_selected),
    q1_custom: (saved.q1_custom as string) ?? legacyQ1 ?? "",
    q2_selected: asStringArray(saved.q2_selected),
    q2_custom: (saved.q2_custom as string) ?? legacyQ2 ?? "",
    q3_selected: asStringArray(saved.q3_selected),
    q3_custom: (saved.q3_custom as string) ?? legacyQ3 ?? "",
    q4_origin: (saved.q4_origin as string) ?? "",
    q5_compassion: (saved.q5_compassion as string) ?? "",
  };
}

const Q4_EXAMPLES = [
  "어릴 때 부모님이 성적으로만 저를 칭찬해 주셨어요",
  "학창시절 성적이 곧 존재 가치였던 환경이 기억나요",
  "첫 직장에서 '성과 없으면 쓸모없다'는 말을 자주 들었어요",
  "(떠오르지 않으면 '모르겠어요'도 괜찮아요)",
];

const Q5_EXAMPLES = [
  "너는 성과가 아니라 그냥 너여서 소중해",
  "쉬는 게 뭐가 나빠, 기본이야",
  "네가 어떤 모습이든 난 네 곁에 있을 거야",
];

/* ─────────────────────────────── 메인 ─────────────────────────────── */

export function WorkshopExerciseStep5CoreBelief({
  workshopId,
  savedData,
  mechanismInsights,
  mechanismAnalysis,
}: Props) {
  const router = useRouter();

  const report: AnalysisReport | null = isAnalysisReport(mechanismInsights)
    ? mechanismInsights
    : null;

  const mechanism = (mechanismAnalysis ?? {}) as MechanismAnalysisData;
  const patternHeadline = report?.pattern_cycle.headline ?? "";

  const migrated = migrateAnswers(
    savedData?.answers as Record<string, unknown> | undefined
  );
  const [answers, setAnswers] = useState<Answers>({
    ...EMPTY_ANSWERS,
    ...migrated,
  });
  const [hypothesis, setHypothesis] = useState<MidHypothesis | undefined>(
    savedData?.mid_hypothesis
  );
  const [synthesis, setSynthesis] = useState<Synthesis | undefined>(
    savedData?.synthesis
  );

  /* ── Phase 0: 뜨거운 생각 후보 ── */
  const [candidates, setCandidates] = useState<string[]>([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [hotThoughtConfirmed, setHotThoughtConfirmed] = useState(
    !!migrated.selected_hot_thought
  );
  const [customThought, setCustomThought] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  /* ── Part 1: Q1~Q3 객관식 옵션 ── */
  const [q1Options, setQ1Options] = useState<string[]>([]);
  const [q2Options, setQ2Options] = useState<string[]>([]);
  const [q3Options, setQ3Options] = useState<string[]>([]);
  const [q1Loading, setQ1Loading] = useState(false);
  const [q2Loading, setQ2Loading] = useState(false);
  const [q3Loading, setQ3Loading] = useState(false);
  const [q1UseCustom, setQ1UseCustom] = useState(
    !!migrated.q1_custom && (migrated.q1_selected?.length ?? 0) === 0
  );
  const [q2UseCustom, setQ2UseCustom] = useState(
    !!migrated.q2_custom && (migrated.q2_selected?.length ?? 0) === 0
  );
  const [q3UseCustom, setQ3UseCustom] = useState(
    !!migrated.q3_custom && (migrated.q3_selected?.length ?? 0) === 0
  );

  const [hypothesizing, setHypothesizing] = useState(false);
  const [synthesizing, setSynthesizing] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    if (hotThoughtConfirmed) return;
    setCandidatesLoading(true);
    fetch("/api/self-workshop/excavate-belief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workshopId, phase: "generate-candidates" }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.candidates?.length) setCandidates(data.candidates);
      })
      .catch(() => {})
      .finally(() => setCandidatesLoading(false));
  }, [workshopId, hotThoughtConfirmed]);

  const q1HasAnswer =
    answers.q1_selected.length > 0 || answers.q1_custom.trim().length > 0;
  const q2HasAnswer =
    answers.q2_selected.length > 0 || answers.q2_custom.trim().length > 0;
  const q3HasAnswer =
    answers.q3_selected.length > 0 || answers.q3_custom.trim().length > 0;

  const fetchQuestionOptions = useCallback(
    async (q: "q1" | "q2" | "q3") => {
      const setLoading =
        q === "q1" ? setQ1Loading : q === "q2" ? setQ2Loading : setQ3Loading;
      const setOptions =
        q === "q1" ? setQ1Options : q === "q2" ? setQ2Options : setQ3Options;

      setLoading(true);
      try {
        const res = await fetch("/api/self-workshop/excavate-belief", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workshopId,
            phase: `generate-options-${q}`,
            hotThought: answers.selected_hot_thought,
            q1Answer: joinAnswer(answers.q1_selected, answers.q1_custom),
            q2Answer: joinAnswer(answers.q2_selected, answers.q2_custom),
          }),
        });
        const data = await res.json();
        if (Array.isArray(data.options) && data.options.length > 0) {
          setOptions(data.options);
        }
      } catch {
        /* 실패 시 options는 빈 상태로 유지 — UI가 "직접 쓰기" fallback 유도 */
      } finally {
        setLoading(false);
      }
    },
    [
      workshopId,
      answers.selected_hot_thought,
      answers.q1_selected,
      answers.q1_custom,
      answers.q2_selected,
      answers.q2_custom,
    ]
  );

  // Q1 옵션: 뜨거운 생각 확정 직후 최초 1회만 생성
  useEffect(() => {
    if (!hotThoughtConfirmed) return;
    if (q1Options.length > 0 || q1Loading) return;
    fetchQuestionOptions("q1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotThoughtConfirmed]);

  // Q2 옵션: Q1에 답이 있으면 최초 1회만 생성
  useEffect(() => {
    if (!hotThoughtConfirmed || !q1HasAnswer) return;
    if (q2Options.length > 0 || q2Loading) return;
    fetchQuestionOptions("q2");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotThoughtConfirmed, q1HasAnswer]);

  // Q3 옵션: Q2에 답이 있으면 최초 1회만 생성
  useEffect(() => {
    if (!hotThoughtConfirmed || !q2HasAnswer) return;
    if (q3Options.length > 0 || q3Loading) return;
    fetchQuestionOptions("q3");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotThoughtConfirmed, q2HasAnswer]);

  const autoSave = useCallback(
    (updated: Answers) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        await fetch("/api/self-workshop/save-progress", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workshopId,
            field: "core_belief_excavation",
            data: { answers: updated },
          }),
        });
      }, 1000);
    },
    [workshopId]
  );

  function update<K extends keyof Answers>(key: K, value: Answers[K]) {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    autoSave(next);
  }

  function confirmHotThought() {
    const selected = useCustom ? customThought.trim() : answers.selected_hot_thought;
    if (!selected) return;
    const next = { ...answers, selected_hot_thought: selected };
    setAnswers(next);
    autoSave(next);
    setHotThoughtConfirmed(true);
  }

  function returnToHotThoughtSelection() {
    // 뜨거운 생각이 바뀌면 Q1~Q3 보기와 답이 맥락에 안 맞으므로 모두 초기화.
    // mid_hypothesis/synthesis도 리셋해 Part 2 UI가 닫히도록.
    const reset: Answers = {
      ...answers,
      selected_hot_thought: "",
      q1_selected: [],
      q1_custom: "",
      q2_selected: [],
      q2_custom: "",
      q3_selected: [],
      q3_custom: "",
    };
    setAnswers(reset);
    autoSave(reset);
    setQ1Options([]);
    setQ2Options([]);
    setQ3Options([]);
    setQ1UseCustom(false);
    setQ2UseCustom(false);
    setQ3UseCustom(false);
    setHypothesis(undefined);
    setSynthesis(undefined);
    setError("");
    setCustomThought("");
    setUseCustom(false);
    setHotThoughtConfirmed(false);
  }

  function toggleQSelection(
    key: "q1_selected" | "q2_selected" | "q3_selected",
    option: string
  ) {
    const current = answers[key];
    const next = current.includes(option)
      ? current.filter((o) => o !== option)
      : [...current, option];
    update(key, next);
  }

  function joinAnswer(selected: string[], custom: string): string {
    return [...selected, custom.trim()].filter((s) => s.length > 0).join(" / ");
  }

  const part1Complete = q1HasAnswer && q2HasAnswer && q3HasAnswer;

  const part2Complete =
    part1Complete &&
    !!hypothesis &&
    answers.q4_origin.trim().length > 0 &&
    answers.q5_compassion.trim().length > 0;

  // LLM이 기대하는 기존 스키마(q1_consequence/q2_fear/q3_identity)로
  // 다중 선택 + 직접 입력을 합본해 전달.
  function buildApiAnswers() {
    return {
      selected_hot_thought: answers.selected_hot_thought,
      q1_consequence: joinAnswer(answers.q1_selected, answers.q1_custom),
      q2_fear: joinAnswer(answers.q2_selected, answers.q2_custom),
      q3_identity: joinAnswer(answers.q3_selected, answers.q3_custom),
      q4_origin: answers.q4_origin,
      q5_compassion: answers.q5_compassion,
    };
  }

  async function handleHypothesize() {
    setHypothesizing(true);
    setError("");
    try {
      const res = await fetch("/api/self-workshop/excavate-belief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshopId,
          phase: "hypothesize",
          answers: buildApiAnswers(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "가설 생성에 실패했어요");
      setHypothesis(data.hypothesis as MidHypothesis);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했어요");
    } finally {
      setHypothesizing(false);
    }
  }

  async function handleSynthesize() {
    setSynthesizing(true);
    setError("");
    try {
      const res = await fetch("/api/self-workshop/excavate-belief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshopId,
          phase: "synthesize",
          answers: buildApiAnswers(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "종합에 실패했어요");
      setSynthesis(data.synthesis as Synthesis);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했어요");
    } finally {
      setSynthesizing(false);
    }
  }

  function handleNext() {
    router.push("/dashboard/self-workshop/step/5");
  }

  /* ─────────────────────────── 렌더 ─────────────────────────── */

  // 새 흐름: 트리거-자동사고 실습(FIND_OUT 1)이 선행 조건.
  // mechanism_analysis가 비어 있으면 그 단계로 돌려보냄.
  const hasMechanism =
    !!mechanism.automatic_thought ||
    (mechanism.candidate_thoughts?.length ?? 0) > 0 ||
    (mechanism.common_thoughts_checked?.length ?? 0) > 0;
  if (!hasMechanism) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <p className="text-sm text-[var(--foreground)]/60">
          먼저 트리거 → 자동사고 실습을 완료해 주세요.
        </p>
        <Link
          href="/dashboard/self-workshop/step/3"
          className="mt-4 inline-block text-sm font-medium text-[var(--foreground)] underline"
        >
          이전 단계로 돌아가기 →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 pb-20">
      {hotThoughtConfirmed ? (
        <button
          type="button"
          onClick={returnToHotThoughtSelection}
          className="inline-flex items-center text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:underline"
        >
          ← 뜨거운 생각 다시 선택하기
        </button>
      ) : (
        <Link
          href="/dashboard/self-workshop/step/3"
          className="inline-flex items-center text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:underline"
        >
          ← 자동사고 실습 다시 보기
        </Link>
      )}

      {/* ── Phase 0: 뜨거운 생각 선택 ── */}
      {!hotThoughtConfirmed ? (
        <>
          {/* 설명 카드 */}
          <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground)]/50">
              Step 5 시작하기
            </p>
            <p className="mt-3 text-base font-bold leading-snug text-[var(--foreground)]">
              성취 중독을 해결하는 첫 번째 열쇠
            </p>

            <p className="mt-4 text-sm leading-relaxed text-[var(--foreground)]/75">
              Step 4에서 우리는 성취 중독이 작동하는 순간을 살펴봤어요.
              어떤 상황이 불안을 촉발하고, 그때 어떤 감정이 올라오며,
              &ldquo;나만 뒤처졌어&rdquo;, &ldquo;더 해야 해&rdquo; 같은
              생각이 자동으로 떠오르는 것까지요.
            </p>

            <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)]/75">
              그런데 이 자동적 사고는 혼자서 갑자기 생겨난 게 아니에요.
              그 밑에는 오랜 시간에 걸쳐 형성된, 나 자신에 대한
              깊은 믿음이 있어요. 심리학에서는 이것을 <strong>핵심 신념</strong>이라고 불러요.
            </p>

            {/* 도식 */}
            <div className="mt-5 rounded-lg border border-[var(--foreground)]/15 bg-[var(--surface)]/40 p-4">
              <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground)]/40">
                예시
              </p>
              <div className="flex flex-col items-center gap-1">
                <div className="w-full rounded-lg border-2 border-[var(--foreground)] bg-white px-4 py-2.5 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground)]/45">
                    핵심 신념
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-[var(--foreground)]">
                    &ldquo;나는 충분하지 않은 사람이다&rdquo;
                  </p>
                </div>
                <span className="text-[var(--foreground)]/30 text-lg leading-none">↓</span>
                <div className="w-full rounded-lg border border-[var(--foreground)]/25 bg-white px-4 py-2 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground)]/45">
                    중간 신념 (규칙)
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--foreground)]/70">
                    &ldquo;성과로 증명하지 않으면 인정받을 수 없어&rdquo;
                  </p>
                </div>
                <span className="text-[var(--foreground)]/30 text-lg leading-none">↓</span>
                <div className="w-full rounded-lg border border-[var(--foreground)]/25 bg-white px-4 py-2 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground)]/45">
                    자동적 사고
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--foreground)]/70">
                    &ldquo;나만 뒤처졌어&rdquo; &ldquo;더 해야 해&rdquo;
                  </p>
                </div>
                <span className="text-[var(--foreground)]/30 text-lg leading-none">↓</span>
                <div className="flex w-full gap-2">
                  <div className="flex-1 rounded-lg border border-[var(--foreground)]/15 bg-white px-3 py-2 text-center">
                    <p className="text-[10px] font-semibold text-[var(--foreground)]/45">감정</p>
                    <p className="mt-0.5 text-xs text-[var(--foreground)]/60">불안, 자책</p>
                  </div>
                  <div className="flex-1 rounded-lg border border-[var(--foreground)]/15 bg-white px-3 py-2 text-center">
                    <p className="text-[10px] font-semibold text-[var(--foreground)]/45">행동</p>
                    <p className="mt-0.5 text-xs text-[var(--foreground)]/60">과몰두, 비교</p>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-[var(--foreground)]/50">
                Step 4에서 본 것은 아래쪽이에요. 이제 위로 올라가 볼 거예요.
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <p className="text-sm leading-relaxed text-[var(--foreground)]/75">
                핵심 신념은 보통 어린 시절이나 중요한 관계에서 만들어져요.
                그리고 안경처럼 세상을 바라보는 방식 전체에 영향을 줘요.
                같은 상황에서도 누군가는 &ldquo;괜찮아, 다음에 하면 되지&rdquo;라고 생각하고,
                누군가는 &ldquo;역시 나는 안 돼&rdquo;라고 느끼는 이유가 바로 이 핵심 신념의 차이예요.
              </p>

              <p className="text-sm font-semibold leading-relaxed text-[var(--foreground)]">
                핵심 신념을 발견하면 무엇이 달라질까요?
              </p>

              {/* Before / After */}
              <div className="space-y-3">
                <div className="rounded-lg border border-[var(--foreground)]/15 bg-[var(--surface)]/40 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground)]/40">
                    Before — 핵심 신념을 모를 때
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    <li className="text-sm leading-relaxed text-[var(--foreground)]/60">
                      &ldquo;왜 나는 항상 이럴까&rdquo; — 원인을 모른 채 같은 패턴 반복
                    </li>
                    <li className="text-sm leading-relaxed text-[var(--foreground)]/60">
                      자동적 사고에 그대로 휩쓸려 감정과 행동이 연쇄 반응
                    </li>
                    <li className="text-sm leading-relaxed text-[var(--foreground)]/60">
                      &ldquo;나는 원래 이런 사람이야&rdquo; — 바꿀 수 없다고 느낌
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border-2 border-[var(--foreground)] bg-white p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground)]/50">
                    After — 핵심 신념을 발견한 뒤
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    <li className="text-sm leading-relaxed text-[var(--foreground)]">
                      반복되는 감정과 행동의 진짜 원인이 보이기 시작해요
                    </li>
                    <li className="text-sm leading-relaxed text-[var(--foreground)]">
                      &ldquo;아, 또 그 믿음이 작동하고 있구나&rdquo; — 한 발짝 물러서서 바라볼 수 있어요
                    </li>
                    <li className="text-sm leading-relaxed text-[var(--foreground)]">
                      사실이 아니라 학습된 것임을 알면, 다르게 생각하고 행동할 여지가 생겨요
                    </li>
                  </ul>
                </div>
              </div>

              <p className="mt-1 text-sm leading-relaxed text-[var(--foreground)]/75">
                지금부터 Step 4에서 발견한 자동적 사고 하나를 골라,
                그 생각의 뿌리까지 한 겹씩 따라가 볼 거예요.
              </p>
            </div>
          </div>

          {/* 뜨거운 생각 고르기 */}
          <PartHeader num="Step 5-1" title="뜨거운 생각 고르기" />

          <div className="rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-5">
            <p className="text-sm leading-relaxed text-[var(--foreground)]/75">
              <strong className="text-[var(--foreground)]">뜨거운 생각</strong>이란,
              스트레스 상황에서 순간적으로 떠오르면서 감정을 가장 강하게 흔드는 생각이에요.
              여러 생각 중 하나를 골라 깊이 따라가 보면, 그 밑에 있는 핵심 신념에 닿을 수 있어요.
            </p>

            <p className="mt-4 text-sm font-semibold text-[var(--foreground)]">
              아래 중 <strong>가장 마음이 불편해지는 생각</strong>을 골라주세요.
            </p>

            {candidatesLoading ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-[var(--foreground)]/50">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--foreground)]/30 border-t-transparent" />
                Step 4의 생각들을 정리하고 있어요…
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                {candidates.map((thought) => {
                  const selected =
                    !useCustom && answers.selected_hot_thought === thought;
                  return (
                    <button
                      key={thought}
                      type="button"
                      onClick={() => {
                        setUseCustom(false);
                        update("selected_hot_thought", thought);
                      }}
                      className={`flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition-colors ${
                        selected
                          ? "border-[var(--foreground)] bg-[var(--foreground)]/5"
                          : "border-[var(--foreground)]/15 bg-white hover:border-[var(--foreground)]/40"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          selected
                            ? "border-[var(--foreground)] bg-[var(--foreground)]"
                            : "border-[var(--foreground)]/30"
                        }`}
                      >
                        {selected && (
                          <span className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </span>
                      <span
                        className={`min-w-0 break-words leading-relaxed ${
                          selected
                            ? "font-semibold text-[var(--foreground)]"
                            : "text-[var(--foreground)]/80"
                        }`}
                      >
                        {thought}
                      </span>
                    </button>
                  );
                })}

                {/* 직접 쓰기 */}
                <button
                  type="button"
                  onClick={() => {
                    setUseCustom(true);
                    update("selected_hot_thought", "");
                  }}
                  className={`flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition-colors ${
                    useCustom
                      ? "border-[var(--foreground)] bg-[var(--foreground)]/5"
                      : "border-[var(--foreground)]/15 bg-white hover:border-[var(--foreground)]/40"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      useCustom
                        ? "border-[var(--foreground)] bg-[var(--foreground)]"
                        : "border-[var(--foreground)]/30"
                    }`}
                  >
                    {useCustom && (
                      <span className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </span>
                  <span
                    className={`leading-relaxed ${
                      useCustom
                        ? "font-semibold text-[var(--foreground)]"
                        : "text-[var(--foreground)]/80"
                    }`}
                  >
                    직접 쓸게요
                  </span>
                </button>

                {useCustom && (
                  <input
                    type="text"
                    value={customThought}
                    onChange={(e) => setCustomThought(e.target.value)}
                    placeholder="떠오르는 생각을 적어주세요"
                    className="mt-2 w-full rounded-xl border-2 border-[var(--foreground)]/20 px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:border-[var(--foreground)] focus:outline-none transition-colors"
                  />
                )}
              </div>
            )}

            <div className="mt-5 text-center">
              <button
                onClick={confirmHotThought}
                disabled={
                  useCustom
                    ? customThought.trim().length === 0
                    : answers.selected_hot_thought.trim().length === 0
                }
                className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--foreground)] bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
              >
                이 생각으로 시작하기 →
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* ── 선택된 뜨거운 생각 컨텍스트 ── */}
          <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground)]/50">
              Step 4에서 발견한 패턴
            </p>
            {patternHeadline && (
              <p className="mt-2 text-base font-bold leading-snug text-[var(--foreground)]">
                {patternHeadline}
              </p>
            )}
            <div className="mt-4 rounded-lg border border-[var(--foreground)]/15 bg-[var(--surface)]/40 p-3">
              <p className="text-[11px] font-semibold text-[var(--foreground)]/55">
                내가 고른 뜨거운 생각
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                &ldquo;{answers.selected_hot_thought}&rdquo;
              </p>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[var(--foreground)]/75">
              이 생각을 한 겹씩 따라가면서, 그 밑에 숨어 있는
              <strong> 오래된 믿음</strong>을 찾아볼게요.
              정답은 없어요. 떠오르는 대로 솔직하게 적어주세요.
            </p>
          </div>

          {/* ── Part 1: 한 겹씩 따라가 보기 ── */}
          <PartHeader num="Part 1" title="한 겹씩 따라가 보기" />

          <QuestionBlockMultiSelect
            step={1}
            label="내가 고른 뜨거운 생각이 사실이라면, 어떤 일이 벌어지나요?"
            guide="해당되는 걸 모두 골라주세요. 직접 적어도 좋아요."
            options={q1Options}
            loading={q1Loading}
            selected={answers.q1_selected}
            onToggle={(opt) => toggleQSelection("q1_selected", opt)}
            useCustom={q1UseCustom}
            onToggleCustom={() => setQ1UseCustom((v) => !v)}
            customValue={answers.q1_custom}
            onCustomChange={(v) => update("q1_custom", v)}
            customPlaceholder="예: 결국 아무도 나를 필요로 하지 않게 돼요"
          />

          <QuestionBlockMultiSelect
            step={2}
            label={
              <>
                {q1HasAnswer ? (
                  <>
                    <span className="text-[var(--foreground)]/55">
                      &ldquo;
                      {truncate(
                        joinAnswer(answers.q1_selected, answers.q1_custom),
                        40
                      )}
                      &rdquo;
                    </span>
                    {" "}— 이게 진짜 일어난다면,
                    <br />
                  </>
                ) : null}
                가장 두려운 건 뭔가요?
              </>
            }
            guide="가슴으로 느껴지는 두려움을 모두 골라주세요. 직접 적어도 좋아요."
            options={q2Options}
            loading={q2Loading}
            selected={answers.q2_selected}
            onToggle={(opt) => toggleQSelection("q2_selected", opt)}
            useCustom={q2UseCustom}
            onToggleCustom={() => setQ2UseCustom((v) => !v)}
            customValue={answers.q2_custom}
            onCustomChange={(v) => update("q2_custom", v)}
            disabled={!q1HasAnswer}
            customPlaceholder="예: 혼자 남겨지는 게 가장 무서워요"
          />

          <QuestionBlockMultiSelect
            step={3}
            label="그 두려움은 결국, 당신이 어떤 사람이라고 말하고 있나요?"
            guide="해당되는 문장을 모두 골라주세요. 직접 적어도 좋아요."
            options={q3Options}
            loading={q3Loading}
            selected={answers.q3_selected}
            onToggle={(opt) => toggleQSelection("q3_selected", opt)}
            useCustom={q3UseCustom}
            onToggleCustom={() => setQ3UseCustom((v) => !v)}
            customValue={answers.q3_custom}
            onCustomChange={(v) => update("q3_custom", v)}
            disabled={!q2HasAnswer}
            prefix="나는 "
            customPlaceholder="예: 증명하지 않으면 사랑받을 수 없는 사람이다"
          />

          {/* 가설 생성 버튼 또는 가설 카드 */}
          {!hypothesis ? (
            <div className="text-center">
              <button
                onClick={handleHypothesize}
                disabled={!part1Complete || hypothesizing}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--foreground)] bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
              >
                {hypothesizing ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    핵심 믿음을 찾는 중…
                  </>
                ) : (
                  "내 답에서 핵심 믿음 찾기 →"
                )}
              </button>
              {!part1Complete && (
                <p className="mt-2 text-xs text-[var(--foreground)]/50">
                  세 질문을 모두 답하면 활성화돼요
                </p>
              )}
            </div>
          ) : (
            <HypothesisCard
              hotThought={hypothesis.hot_thought}
              belief={hypothesis.core_belief}
            />
          )}

          {/* ── Part 2 — 가설이 있어야만 렌더 ── */}
          {hypothesis && (
            <>
              <PartHeader num="Part 2" title="이 믿음은 어디서 왔을까" />

              <QuestionBlock
                step={4}
                label="이 믿음이 처음 생긴 순간이 떠오르세요? 어떤 경험·관계에서 배운 것 같나요?"
                examples={Q4_EXAMPLES}
                value={answers.q4_origin}
                onChange={(v) => update("q4_origin", v)}
                placeholder="예: 어릴 때 …"
              />

              <QuestionBlock
                step={5}
                label={
                  <>
                    사랑하는 친구가 <strong>똑같은 믿음</strong>을 갖고 있다면,
                    <br />
                    당신은 뭐라고 말해주고 싶으세요?
                  </>
                }
                examples={Q5_EXAMPLES}
                value={answers.q5_compassion}
                onChange={(v) => update("q5_compassion", v)}
                disabled={!answers.q4_origin.trim()}
                placeholder="친구에게 건네는 한 문장"
                extraAbove={
                  <div className="mb-3 rounded-lg border border-[var(--foreground)]/15 bg-[var(--surface)]/60 p-3">
                    <p className="text-[11px] font-semibold text-[var(--foreground)]/55">
                      다시 마주하는 핵심 믿음
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
                      &ldquo;{hypothesis.core_belief}&rdquo;
                    </p>
                  </div>
                }
              />

              {!synthesis ? (
                <div className="text-center">
                  <button
                    onClick={handleSynthesize}
                    disabled={!part2Complete || synthesizing}
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--foreground)] bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    {synthesizing ? (
                      <>
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        마지막 정리 중…
                      </>
                    ) : (
                      "마지막 정리 보기 →"
                    )}
                  </button>
                </div>
              ) : (
                <SynthesisCard data={synthesis} />
              )}
            </>
          )}

          {error && (
            <p className="rounded-lg border border-red-300 bg-red-50 p-3 text-center text-sm text-red-700">
              {error}
            </p>
          )}

          {/* 다음 단계 버튼 — synthesis 완료 후에만 */}
          {synthesis && (
            <div className="text-center pt-4">
              <button
                onClick={handleNext}
                className="inline-flex rounded-xl border-2 border-[var(--foreground)] bg-[var(--foreground)] px-8 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90"
              >
                다음 단계로 →
              </button>
            </div>
          )}

          <p className="text-center text-xs text-[var(--foreground)]/40">
            작성 내용은 자동으로 저장됩니다
          </p>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────── 하위 컴포넌트 ─────────────────────────── */

function PartHeader({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground)]/45">
        {num}
      </span>
      <span className="h-px flex-1 bg-[var(--foreground)]/15" />
      <span className="text-sm font-bold text-[var(--foreground)]">{title}</span>
    </div>
  );
}

function QuestionBlock({
  step,
  label,
  guide,
  examples,
  value,
  onChange,
  placeholder,
  disabled,
  prefix,
  extraAbove,
}: {
  step: number;
  label: ReactNode;
  guide?: string;
  examples: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  prefix?: string;
  extraAbove?: ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-5 transition-opacity ${
        disabled ? "opacity-40" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[var(--foreground)] text-xs font-bold">
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-relaxed text-[var(--foreground)]">
            {label}
          </p>
          {guide && (
            <p className="mt-1 text-xs leading-relaxed text-[var(--foreground)]/55">
              {guide}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-[var(--foreground)]/10 bg-[var(--surface)]/40 p-3">
        <p className="text-[11px] font-semibold text-[var(--foreground)]/55">
          이렇게 적어볼 수 있어요
        </p>
        <ul className="mt-2 space-y-1.5">
          {examples.map((ex) => (
            <li
              key={ex}
              className="flex items-start gap-2 text-xs leading-relaxed text-[var(--foreground)]/65"
            >
              <span
                aria-hidden
                className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-[var(--foreground)]/40"
              />
              <span>{ex}</span>
            </li>
          ))}
        </ul>
      </div>

      {extraAbove}

      {prefix ? (
        <div className="mt-4 flex items-baseline gap-1.5 rounded-xl border-2 border-[var(--foreground)]/20 bg-white p-3 focus-within:border-[var(--foreground)]">
          <span className="text-base font-medium text-[var(--foreground)]/80">
            {prefix}
          </span>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="min-w-0 flex-1 bg-transparent text-base text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:outline-none"
          />
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
          className="mt-4 w-full resize-none rounded-xl border-2 border-[var(--foreground)]/20 px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:border-[var(--foreground)] focus:outline-none transition-colors"
        />
      )}
    </div>
  );
}

function QuestionBlockMultiSelect({
  step,
  label,
  guide,
  options,
  loading,
  selected,
  onToggle,
  useCustom,
  onToggleCustom,
  customValue,
  onCustomChange,
  disabled,
  prefix,
  customPlaceholder,
}: {
  step: number;
  label: ReactNode;
  guide?: string;
  options: string[];
  loading: boolean;
  selected: string[];
  onToggle: (option: string) => void;
  useCustom: boolean;
  onToggleCustom: () => void;
  customValue: string;
  onCustomChange: (v: string) => void;
  disabled?: boolean;
  prefix?: string;
  customPlaceholder?: string;
}) {
  return (
    <div
      className={`rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-5 transition-opacity ${
        disabled ? "opacity-40 pointer-events-none" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[var(--foreground)] text-xs font-bold">
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-relaxed text-[var(--foreground)]">
            {label}
          </p>
          {guide && (
            <p className="mt-1 text-xs leading-relaxed text-[var(--foreground)]/55">
              {guide}
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-[var(--foreground)]/50">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--foreground)]/30 border-t-transparent" />
          내 뜨거운 생각에 맞춘 보기를 만드는 중…
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {options.map((opt) => {
            const isChecked = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onToggle(opt)}
                className={`flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition-colors ${
                  isChecked
                    ? "border-[var(--foreground)] bg-[var(--foreground)]/5"
                    : "border-[var(--foreground)]/15 bg-white hover:border-[var(--foreground)]/40"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                    isChecked
                      ? "border-[var(--foreground)] bg-[var(--foreground)]"
                      : "border-[var(--foreground)]/30"
                  }`}
                >
                  {isChecked && (
                    <svg
                      viewBox="0 0 12 12"
                      className="h-3 w-3"
                      aria-hidden
                    >
                      <path
                        d="M2.5 6.5l2.2 2.2 4.8-4.8"
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <span
                  className={`min-w-0 break-words leading-relaxed ${
                    isChecked
                      ? "font-semibold text-[var(--foreground)]"
                      : "text-[var(--foreground)]/80"
                  }`}
                >
                  {prefix ? (
                    <>
                      <span className="text-[var(--foreground)]/55">
                        {prefix}
                      </span>
                      {opt}
                    </>
                  ) : (
                    opt
                  )}
                </span>
              </button>
            );
          })}

          {/* 직접 입력 토글 */}
          <button
            type="button"
            onClick={onToggleCustom}
            className={`flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition-colors ${
              useCustom
                ? "border-[var(--foreground)] bg-[var(--foreground)]/5"
                : "border-[var(--foreground)]/15 bg-white hover:border-[var(--foreground)]/40"
            }`}
          >
            <span
              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                useCustom
                  ? "border-[var(--foreground)] bg-[var(--foreground)]"
                  : "border-[var(--foreground)]/30"
              }`}
            >
              {useCustom && (
                <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
                  <path
                    d="M2.5 6.5l2.2 2.2 4.8-4.8"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span
              className={`leading-relaxed ${
                useCustom
                  ? "font-semibold text-[var(--foreground)]"
                  : "text-[var(--foreground)]/80"
              }`}
            >
              직접 적기
            </span>
          </button>

          {useCustom &&
            (prefix ? (
              <div className="mt-2 flex items-baseline gap-1.5 rounded-xl border-2 border-[var(--foreground)]/20 bg-white p-3 focus-within:border-[var(--foreground)]">
                <span className="text-base font-medium text-[var(--foreground)]/80">
                  {prefix}
                </span>
                <input
                  type="text"
                  value={customValue}
                  onChange={(e) => onCustomChange(e.target.value)}
                  placeholder={customPlaceholder}
                  className="min-w-0 flex-1 bg-transparent text-base text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:outline-none"
                />
              </div>
            ) : (
              <textarea
                value={customValue}
                onChange={(e) => onCustomChange(e.target.value)}
                placeholder={customPlaceholder}
                rows={3}
                className="mt-2 w-full resize-none rounded-xl border-2 border-[var(--foreground)]/20 px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:border-[var(--foreground)] focus:outline-none transition-colors"
              />
            ))}
        </div>
      )}
    </div>
  );
}

function HypothesisCard({
  hotThought,
  belief,
}: {
  hotThought: string;
  belief: string;
}) {
  return (
    <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground)]/55">
        지금까지 따라온 결과
      </p>
      <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)]/75">
        나의 <strong className="text-[var(--foreground)]">&ldquo;{hotThought}&rdquo;</strong>
        이라는 뜨거운 생각은
        <br />
        이 핵심 믿음에 기반하고 있을지도 몰라요:
      </p>
      <blockquote className="mt-4 rounded-lg border-l-4 border-[var(--foreground)] bg-[var(--surface)]/40 p-4">
        <p className="text-base font-semibold leading-relaxed text-[var(--foreground)]">
          &ldquo;{belief}&rdquo;
        </p>
      </blockquote>
      <p className="mt-4 text-xs text-[var(--foreground)]/55">
        이제 이 믿음을 조금 더 깊이 들여다볼까요?
      </p>
    </div>
  );
}

function SynthesisCard({ data }: { data: Synthesis }) {
  return (
    <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground)]/55 text-center">
        당신이 발견한 오래된 믿음
      </p>
      <blockquote className="mt-4 border-l-2 border-[var(--foreground)] pl-5">
        <p className="text-lg font-bold leading-relaxed text-[var(--foreground)]">
          &ldquo;{data.belief_line}&rdquo;
        </p>
      </blockquote>
      <div className="mt-5 space-y-4">
        <div>
          <p className="text-[11px] font-semibold text-[var(--foreground)]/55">
            이 믿음이 당신에게 하는 일
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--foreground)]/80">
            {data.how_it_works}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-[var(--foreground)]/55">
            다시 바라보기
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--foreground)]/80">
            {data.reframe_invitation}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── 유틸 ─────────────────────────── */

function truncate(s: string, n: number): string {
  const clean = s.trim();
  return clean.length <= n ? clean : clean.slice(0, n) + "…";
}
