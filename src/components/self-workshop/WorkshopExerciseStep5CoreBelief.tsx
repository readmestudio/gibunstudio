"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  isAnalysisReport,
  type AnalysisReport,
} from "@/lib/self-workshop/analysis-report";

/* ─────────────────────────────── 타입 ─────────────────────────────── */

interface Answers {
  q1_meaning: string;
  q2_about_self: string;
  q3_core_sentence: string;
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

interface Props {
  workshopId: string;
  savedData?: Partial<CoreBeliefExcavation>;
  mechanismInsights: unknown;
}

const EMPTY_ANSWERS: Answers = {
  q1_meaning: "",
  q2_about_self: "",
  q3_core_sentence: "",
  q4_origin: "",
  q5_compassion: "",
};

const Q1_EXAMPLES = [
  "'나만 뒤쳐졌다'가 사실이라면 → 나는 능력이 부족한 사람이라는 뜻이에요",
  "'더 해야 한다'가 사실이라면 → 지금의 나로는 부족하다는 뜻이에요",
];

const Q2_EXAMPLES = [
  "나는 사랑받을 자격이 부족한 사람이다",
  "나는 늘 증명해야만 하는 사람이다",
];

const Q3_EXAMPLES = [
  "성과가 없으면 가치 없는",
  "완벽하지 않으면 사랑받을 수 없는",
  "쉬면 뒤쳐지는",
];

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
}: Props) {
  const router = useRouter();

  const report: AnalysisReport | null = isAnalysisReport(mechanismInsights)
    ? mechanismInsights
    : null;

  const hotThought =
    report?.pattern_cycle.nodes.find((n) => n.stage === "thought")?.label ??
    "자동적으로 떠오르는 생각";
  const patternHeadline = report?.pattern_cycle.headline ?? "";

  const [answers, setAnswers] = useState<Answers>({
    ...EMPTY_ANSWERS,
    ...(savedData?.answers ?? {}),
  });
  const [hypothesis, setHypothesis] = useState<MidHypothesis | undefined>(
    savedData?.mid_hypothesis
  );
  const [synthesis, setSynthesis] = useState<Synthesis | undefined>(
    savedData?.synthesis
  );
  const [hypothesizing, setHypothesizing] = useState(false);
  const [synthesizing, setSynthesizing] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

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

  const part1Complete =
    answers.q1_meaning.trim().length > 0 &&
    answers.q2_about_self.trim().length > 0 &&
    answers.q3_core_sentence.trim().length > 0;

  const part2Complete =
    part1Complete &&
    !!hypothesis &&
    answers.q4_origin.trim().length > 0 &&
    answers.q5_compassion.trim().length > 0;

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
          answers,
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
          answers,
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
    router.push("/dashboard/self-workshop/step/6");
  }

  /* ─────────────────────────── 렌더 ─────────────────────────── */

  if (!report) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <p className="text-sm text-[var(--foreground)]/60">
          Step 4 리포트를 먼저 완료해 주세요.
        </p>
        <Link
          href="/dashboard/self-workshop/step/4"
          className="mt-4 inline-block text-sm font-medium text-[var(--foreground)] underline"
        >
          Step 4로 돌아가기 →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 pb-20">
      <Link
        href="/dashboard/self-workshop/step/4"
        className="inline-flex items-center text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:underline"
      >
        ← Step 4 리포트 다시 보기
      </Link>

      {/* 컨텍스트 */}
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
            자동으로 떠오르는 뜨거운 생각
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
            “{hotThought}”
          </p>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-[var(--foreground)]/75">
          이 생각 뒤에 숨어있는 <strong>&lsquo;당신이 진실이라고 믿는 것&rsquo;</strong>을
          같이 찾아볼게요. 정답은 없어요. 떠오르는 대로 솔직하게 적어주세요.
        </p>
      </div>

      {/* Part 1 */}
      <PartHeader num="Part 1" title="뜨거운 생각에서 믿음으로" />

      <QuestionBlock
        step={1}
        label={`그 생각이 100% 사실이라면, 당신에게 무엇을 의미하나요?`}
        examples={Q1_EXAMPLES}
        value={answers.q1_meaning}
        onChange={(v) => update("q1_meaning", v)}
        placeholder="예: 그 생각이 사실이라면 나는 …"
      />

      <QuestionBlock
        step={2}
        label={
          <>
            {answers.q1_meaning.trim() ? (
              <>
                <span className="text-[var(--foreground)]/55">
                  &ldquo;{truncate(answers.q1_meaning, 40)}&rdquo;
                </span>
                이 진짜라면,
                <br />
              </>
            ) : null}
            그건 &lsquo;당신&rsquo;이라는 사람에 대해 뭐라고 말하고 있나요?
          </>
        }
        examples={Q2_EXAMPLES}
        value={answers.q2_about_self}
        onChange={(v) => update("q2_about_self", v)}
        disabled={!answers.q1_meaning.trim()}
        placeholder="예: 나는 …한 사람이다"
      />

      <QuestionBlock
        step={3}
        label="그렇다면 당신은 &lsquo;어떤 사람&rsquo;이라는 뜻일까요?"
        examples={Q3_EXAMPLES}
        disabled={!answers.q2_about_self.trim()}
        prefix="나는 "
        suffix="한 사람이다."
        value={answers.q3_core_sentence}
        onChange={(v) => update("q3_core_sentence", v)}
        placeholder="예: 성과가 없으면 가치 없는"
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
                핵심 믿음을 발견하는 중…
              </>
            ) : (
              "핵심 믿음 발견하기 →"
            )}
          </button>
          {!part1Complete && (
            <p className="mt-2 text-xs text-[var(--foreground)]/50">
              Q1~Q3을 모두 채우면 활성화돼요
            </p>
          )}
        </div>
      ) : (
        <HypothesisCard hotThought={hypothesis.hot_thought} belief={hypothesis.core_belief} />
      )}

      {/* Part 2 — 가설이 있어야만 렌더 */}
      {hypothesis && (
        <>
          <PartHeader num="Part 2" title="이 믿음의 뿌리와 재해석" />

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
                  “{hypothesis.core_belief}”
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
  examples,
  value,
  onChange,
  placeholder,
  disabled,
  prefix,
  suffix,
  extraAbove,
}: {
  step: number;
  label: ReactNode;
  examples: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  prefix?: string;
  suffix?: string;
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
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-[var(--foreground)]/10 bg-[var(--surface)]/40 p-3">
        <p className="text-[11px] font-semibold text-[var(--foreground)]/55">
          💡 이렇게 적어볼 수 있어요
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

      {prefix || suffix ? (
        <div className="mt-4 flex items-baseline gap-1.5 rounded-xl border-2 border-[var(--foreground)]/20 bg-white p-3 focus-within:border-[var(--foreground)]">
          {prefix && (
            <span className="text-base font-medium text-[var(--foreground)]/80">
              {prefix}
            </span>
          )}
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="min-w-0 flex-1 bg-transparent text-base text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:outline-none"
          />
          {suffix && (
            <span className="text-base font-medium text-[var(--foreground)]/80">
              {suffix}
            </span>
          )}
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

function HypothesisCard({
  hotThought,
  belief,
}: {
  hotThought: string;
  belief: string;
}) {
  return (
    <div className="rounded-xl border-2 border-blue-500 bg-blue-50/50 p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700">
        💎 발견된 핵심 믿음
      </p>
      <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)]/75">
        나의 <strong className="text-[var(--foreground)]">&ldquo;{hotThought}&rdquo;</strong>
        이라는 뜨거운 생각은
        <br />
        이 핵심 믿음에 기반하고 있을지도 몰라요:
      </p>
      <blockquote className="mt-4 rounded-lg border-l-4 border-blue-500 bg-white p-4">
        <p className="text-base font-semibold leading-relaxed text-[var(--foreground)]">
          “{belief}”
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
        🌿 당신이 발굴한 진실
      </p>
      <blockquote className="mt-4 border-l-2 border-[var(--foreground)] pl-5">
        <p className="text-lg font-bold leading-relaxed text-[var(--foreground)]">
          “{data.belief_line}”
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
            재해석의 초대
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
