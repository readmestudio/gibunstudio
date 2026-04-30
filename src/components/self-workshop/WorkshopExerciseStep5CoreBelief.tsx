"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  SCT_CATEGORIES,
  SCT_MIN_FOR_ANALYSIS,
  SCT_QUESTIONS,
  SCT_TOTAL_COUNT,
  type SctCategoryCode,
  type SctQuestion,
} from "@/lib/self-workshop/sct-questions";
import {
  countAnsweredResponses,
  migrateLegacyExcavation,
  type CoreBeliefExcavation,
  type SctResponses,
} from "@/lib/self-workshop/core-belief-excavation";

/* ─────────────────────────────── Props ─────────────────────────────── */

interface MechanismAnalysisData {
  automatic_thought?: string;
  candidate_thoughts?: string[];
  common_thoughts_checked?: string[];
}

interface Props {
  workshopId: string;
  savedData?: unknown;
  mechanismInsights: unknown;
  mechanismAnalysis: unknown;
}

/* ─────────────────────────────── 메인 ─────────────────────────────── */

export function WorkshopExerciseStep5CoreBelief({
  workshopId,
  savedData,
  mechanismAnalysis,
}: Props) {
  const router = useRouter();

  const mechanism = (mechanismAnalysis ?? {}) as MechanismAnalysisData;
  const hasMechanism =
    !!mechanism.automatic_thought ||
    (mechanism.candidate_thoughts?.length ?? 0) > 0 ||
    (mechanism.common_thoughts_checked?.length ?? 0) > 0;

  const initial = useMemo<CoreBeliefExcavation>(
    () => migrateLegacyExcavation(savedData),
    [savedData]
  );

  const [responses, setResponses] = useState<SctResponses>(initial.sct_responses);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const answeredCount = useMemo(
    () => countAnsweredResponses(responses),
    [responses]
  );
  const canAdvance = answeredCount >= SCT_MIN_FOR_ANALYSIS;

  const autoSave = useCallback(
    (next: SctResponses) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        await fetch("/api/self-workshop/save-progress", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workshopId,
            field: "core_belief_excavation",
            data: {
              sct_responses: next,
              // 기존 synthesis/legacy_downward_arrow/belief_analysis는 보존
              // (병합되지 않으면 다운스트림이 빈 값을 받아 회귀)
              ...(initial.synthesis ? { synthesis: initial.synthesis } : {}),
              ...(initial.belief_analysis
                ? { belief_analysis: initial.belief_analysis }
                : {}),
              ...(initial.legacy_downward_arrow
                ? { legacy_downward_arrow: initial.legacy_downward_arrow }
                : {}),
            },
          }),
        });
      }, 1000);
    },
    [
      workshopId,
      initial.synthesis,
      initial.legacy_downward_arrow,
      initial.belief_analysis,
    ]
  );

  function updateAnswer(code: string, answer: string) {
    const next: SctResponses = {
      ...responses,
      [code]: {
        answer,
        skipped: false,
        updated_at: new Date().toISOString(),
      },
    };
    setResponses(next);
    autoSave(next);
  }

  function toggleSkip(code: string) {
    const current = responses[code];
    const willSkip = !current?.skipped;
    const next: SctResponses = {
      ...responses,
      [code]: {
        answer: willSkip ? "" : (current?.answer ?? ""),
        skipped: willSkip,
        updated_at: new Date().toISOString(),
      },
    };
    setResponses(next);
    autoSave(next);
  }

  async function handleNext() {
    setAdvancing(true);
    setError("");
    try {
      // pending debounce가 있으면 즉시 flush — 마지막 응답이 누락되지 않도록
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = undefined;
      }
      const res = await fetch("/api/self-workshop/save-progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshopId,
          field: "core_belief_excavation",
          advanceStep: 5,
          data: {
            sct_responses: responses,
            ...(initial.synthesis ? { synthesis: initial.synthesis } : {}),
            ...(initial.belief_analysis
              ? { belief_analysis: initial.belief_analysis }
              : {}),
            ...(initial.legacy_downward_arrow
              ? { legacy_downward_arrow: initial.legacy_downward_arrow }
              : {}),
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "저장에 실패했어요");
      }
      router.push("/dashboard/self-workshop/step/5");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했어요");
      setAdvancing(false);
    }
  }

  /* ─────────────────────────── 가드 ─────────────────────────── */

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

  /* ─────────────────────────── 렌더 ─────────────────────────── */

  const categoryCodes: SctCategoryCode[] = ["A", "B", "C", "D"];

  return (
    <div className="mx-auto max-w-lg space-y-8 pb-20">
      <Link
        href="/dashboard/self-workshop/step/3"
        className="inline-flex items-center text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:underline"
      >
        ← 자동사고 실습 다시 보기
      </Link>

      <SctIntroCard />
      <SctHowToFindCard />
      <SctBeforeStartCard />

      {categoryCodes.map((code, idx) => (
        <SctCategorySection
          key={code}
          index={idx + 1}
          categoryCode={code}
          responses={responses}
          onAnswerChange={updateAnswer}
          onToggleSkip={toggleSkip}
        />
      ))}

      {/* 진행 카드 — 응답 작성 후 다음 단계로 */}
      <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground)]/50">
          작성 완료 후
        </p>
        <p className="mt-2 text-base font-bold leading-snug text-[var(--foreground)]">
          다음 단계에서 함께 분석할게요
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)]/75">
          여기서 적은 응답들은 다음 단계에서 Step 3의 자동사고와 함께 묶여,
          당신의 핵심 신념과 성취 중독 패턴이 어떻게 연결되는지 통합으로
          분석돼요.
        </p>
        <div className="mt-4 rounded-lg border border-[var(--foreground)]/15 bg-[var(--surface)]/40 p-3">
          <p className="text-xs text-[var(--foreground)]/65">
            {answeredCount}문항 작성됨 · 최소 {SCT_MIN_FOR_ANALYSIS}문항 이상이면
            다음으로 넘어갈 수 있어요
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--foreground)]/10">
            <div
              className="h-full bg-[var(--foreground)] transition-all"
              style={{
                width: `${Math.min(100, (answeredCount / SCT_TOTAL_COUNT) * 100)}%`,
              }}
            />
          </div>
        </div>

        <div className="mt-5 text-center">
          <button
            onClick={handleNext}
            disabled={!canAdvance || advancing}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--foreground)] bg-[var(--foreground)] px-8 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {advancing ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                저장하는 중…
              </>
            ) : (
              "다음 단계로 →"
            )}
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-lg border border-red-300 bg-red-50 p-3 text-center text-sm text-red-700">
            {error}
          </p>
        )}
      </div>

      <p className="text-center text-xs text-[var(--foreground)]/40">
        작성 내용은 자동으로 저장됩니다
      </p>
    </div>
  );
}

/* ─────────────────────────── 인트로 카드 ─────────────────────────── */

function SctIntroCard() {
  return (
    <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground)]/50">
        Step 4 시작하기
      </p>
      <p className="mt-3 text-base font-bold leading-snug text-[var(--foreground)]">
        성취 중독 아래에 있는 핵심 신념 찾기
      </p>

      <p className="mt-4 text-sm leading-relaxed text-[var(--foreground)]/75">
        Step 3에서는 성취 중독 패턴이 <strong>트리거된 한 상황</strong>과
        그때 따라온 감정·생각·신체·행동 반응을 살펴봤어요. 표면에서 일어난
        한 번의 사건을 분석한 거예요.
      </p>

      <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)]/75">
        이제는 그 패턴 <strong>아래에 깔려 있는 핵심 신념</strong>을 찾아볼
        차례예요.{" "}
        <span className="box-decoration-clone rounded-sm bg-sky-100 px-1 py-0.5">
          핵심 신념은 내가 살아오면서 만들어온{" "}
          <strong>오래된 안경</strong> 같은 거예요.
        </span>{" "}
        같은 상황에서도 누군가는 &ldquo;괜찮아, 다음에 잘하면 되지&rdquo;라고
        보고, 누군가는 &ldquo;역시 나는 안 돼&rdquo;라고 느끼는 차이가 바로
        이 안경에서 나와요.
      </p>

      <SameSceneTwoLensesAnimation />

      <p className="mt-5 text-sm leading-relaxed text-[var(--foreground)]/75">
        보통 어린 시절이나 중요한 관계에서 학습되어 자리잡고, 이후엔 의식하지
        않아도 자동으로 작동해요. 그래서 같은 트리거에 같은 반응이 반복되는
        거예요.
      </p>
    </div>
  );
}

function SctHowToFindCard() {
  return (
    <div className="rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-6">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground)]/50">
        어떻게 찾을까요?
      </p>
      <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)]/75">
        핵심 신념은 평소엔 의식 밖에 있어서 직접 묻기 어려워요. 그래서
        심리학에서는 미완성 문장을 짧게 채우게 해서, 떠오르는 첫 문장으로
        그 사람의 신념 구조를 추정하는{" "}
        <strong>문장 완성검사(SCT)</strong>를 자주 써요.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]/75">
        이 방식을 워크북 톤으로 변형해 {SCT_TOTAL_COUNT}개의 미완성 문장을
        준비했어요. 자기 가치 · 성취·인정 · 관계 · 통제 네 영역에서 짧게
        답해주시면 돼요.
      </p>
    </div>
  );
}

function SctBeforeStartCard() {
  return (
    <div className="rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-6">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground)]/50">
        시작하기 전에
      </p>
      <ul className="mt-3 space-y-1.5">
        <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--foreground)]/75">
          <Bullet />
          정답이 없어요
        </li>
        <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--foreground)]/75">
          <Bullet />
          떠오르는 첫 문장이 가장 솔직해요
        </li>
        <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--foreground)]/75">
          <Bullet />
          어려운 문항은 건너뛰어도 괜찮아요
        </li>
        <li className="flex items-start gap-2 text-sm leading-relaxed text-[var(--foreground)]/75">
          <Bullet />
          결과는 진단이 아니라 가설이에요
        </li>
      </ul>
    </div>
  );
}

/* ─────────────────────────── 안경 비유 모션 ───────────────────────────
 * "같은 상황도 어떤 안경으로 보느냐에 따라 다른 의미가 된다"는
 * 핵심 신념의 작동 방식을 시각화한다. 같은 사건 카드 1개에서 좌우 두
 * 안경이 펼쳐지고, 각각의 해석 말풍선이 따라 등장한다.
 */
function SameSceneTwoLensesAnimation() {
  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: 0.35, delayChildren: 0.1 },
    },
  };
  const fadeUp = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
  };
  const fromLeft = {
    hidden: { opacity: 0, x: -16 },
    show: { opacity: 1, x: 0, transition: { duration: 0.5 } },
  };
  const fromRight = {
    hidden: { opacity: 0, x: 16 },
    show: { opacity: 1, x: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
      className="mt-5 rounded-lg border border-[var(--foreground)]/15 bg-[var(--surface)]/30 p-5"
    >
      <motion.p
        variants={fadeUp}
        className="text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]/50"
      >
        같은 상황, 다른 안경
      </motion.p>

      {/* 같은 상황 */}
      <motion.div
        variants={fadeUp}
        className="mx-auto mt-3 max-w-[220px] rounded-lg border-2 border-[var(--foreground)] bg-white px-4 py-2.5 text-center"
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground)]/45">
          같은 사건
        </p>
        <p className="mt-0.5 text-sm font-bold text-[var(--foreground)]">
          &ldquo;쉬는 주말이 생겼어요&rdquo;
        </p>
      </motion.div>

      {/* 분기 화살표 */}
      <motion.div
        variants={fadeUp}
        aria-hidden
        className="my-2 flex justify-center"
      >
        <svg
          width="120"
          height="24"
          viewBox="0 0 120 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-[var(--foreground)]/35"
        >
          <path d="M60 0 L20 22" />
          <path d="M60 0 L100 22" />
          <path d="M14 16 L20 22 L26 18" />
          <path d="M94 18 L100 22 L106 16" />
        </svg>
      </motion.div>

      {/* 두 안경 — 렌즈 안에 인용문, 프레임 아래에 라벨 */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div variants={fromLeft} className="px-1">
          <Glasses
            tint="light"
            leftText="대박이다!"
            rightText="푹 쉬어야지!"
          />
          <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground)]/45">
            핵심 믿음 A
          </p>
        </motion.div>
        <motion.div variants={fromRight} className="px-1">
          <Glasses
            tint="dark"
            leftText="쉬면 안돼,"
            rightText="뭐라도 해야해"
          />
          <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground)]/55">
            핵심 믿음 B
          </p>
        </motion.div>
      </div>

      <motion.p
        variants={fadeUp}
        className="mt-4 text-center text-xs leading-relaxed text-[var(--foreground)]/55"
      >
        같은 사건도 어떤 안경으로 보느냐에 따라 의미가 달라져요.
        <br />
        Step 4에서 찾는 건 바로 그 <strong className="text-[var(--foreground)]/75">안경</strong>이에요.
      </motion.p>
    </motion.div>
  );
}

/**
 * 렌즈 안에 인용문이 들어가는 안경 모양.
 * 좌우 두 정사각 렌즈(rounded-full)와 짧은 다리·브릿지로 구성.
 * tint=dark는 안경 B 강조용 — 더 진한 테두리와 살짝 어둑한 배경.
 */
function Glasses({
  tint,
  leftText,
  rightText,
}: {
  tint: "light" | "dark";
  leftText: string;
  rightText: string;
}) {
  const isDark = tint === "dark";
  const lensClass = isDark
    ? "border-2 border-[var(--foreground)] bg-[var(--foreground)]/[0.06]"
    : "border-2 border-[var(--foreground)]/35 bg-white";
  const textClass = isDark
    ? "font-semibold text-[var(--foreground)]"
    : "text-[var(--foreground)]/70";
  const lineClass = isDark
    ? "bg-[var(--foreground)]"
    : "bg-[var(--foreground)]/35";

  return (
    <div className="flex w-full items-center">
      {/* 왼쪽 다리 */}
      <span
        aria-hidden
        className={`h-0.5 w-2 shrink-0 rounded-full ${lineClass}`}
      />
      {/* 좌 렌즈 */}
      <div
        className={`flex aspect-square flex-1 items-center justify-center rounded-full px-1.5 ${lensClass}`}
      >
        <p
          className={`text-center text-[10px] leading-[1.25] ${textClass}`}
        >
          &ldquo;{leftText}&rdquo;
        </p>
      </div>
      {/* 브릿지 */}
      <span
        aria-hidden
        className={`h-0.5 w-2 shrink-0 rounded-full ${lineClass}`}
      />
      {/* 우 렌즈 */}
      <div
        className={`flex aspect-square flex-1 items-center justify-center rounded-full px-1.5 ${lensClass}`}
      >
        <p
          className={`text-center text-[10px] leading-[1.25] ${textClass}`}
        >
          &ldquo;{rightText}&rdquo;
        </p>
      </div>
      {/* 오른쪽 다리 */}
      <span
        aria-hidden
        className={`h-0.5 w-2 shrink-0 rounded-full ${lineClass}`}
      />
    </div>
  );
}

function Bullet() {
  return (
    <span
      aria-hidden
      className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-[var(--foreground)]/40"
    />
  );
}

/* ─────────────────────────── 카테고리 섹션 ─────────────────────────── */

function SctCategorySection({
  index,
  categoryCode,
  responses,
  onAnswerChange,
  onToggleSkip,
}: {
  index: number;
  categoryCode: SctCategoryCode;
  responses: SctResponses;
  onAnswerChange: (code: string, answer: string) => void;
  onToggleSkip: (code: string) => void;
}) {
  const category = SCT_CATEGORIES[categoryCode];
  const questions = SCT_QUESTIONS.filter((q) => q.category === categoryCode);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[var(--foreground)] text-sm font-bold">
          {index}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[var(--foreground)]">
            {category.labelKo}
          </p>
          <p className="text-xs text-[var(--foreground)]/55">
            {category.introKo}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {questions.map((q) => (
          <SctItem
            key={q.code}
            question={q}
            response={responses[q.code]}
            onChange={(value) => onAnswerChange(q.code, value)}
            onToggleSkip={() => onToggleSkip(q.code)}
          />
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────── 단일 SCT 문항 ─────────────────────────── */

function SctItem({
  question,
  response,
  onChange,
  onToggleSkip,
}: {
  question: SctQuestion;
  response: { answer: string; skipped: boolean } | undefined;
  onChange: (value: string) => void;
  onToggleSkip: () => void;
}) {
  const skipped = response?.skipped ?? false;
  const value = response?.answer ?? "";

  return (
    <div
      className={`rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-5 transition-opacity ${
        skipped ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-baseline gap-2">
        <span className="text-[11px] font-semibold text-[var(--foreground)]/50">
          {question.code}
        </span>
        <p className="min-w-0 flex-1 text-sm font-semibold leading-relaxed text-[var(--foreground)]">
          {question.prompt}{" "}
          <span className="text-[var(--foreground)]/40">_______</span>
        </p>
      </div>

      {question.examples.length > 0 && (
        <p className="mt-1.5 ml-7 text-xs leading-relaxed text-[var(--foreground)]/55">
          {question.examples.join(" · ")}
        </p>
      )}

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={skipped}
        maxLength={200}
        placeholder="여기에 짧게 적어주세요"
        className="mt-3 w-full rounded-xl border-2 border-[var(--foreground)]/20 px-4 py-3 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:border-[var(--foreground)] focus:outline-none transition-colors disabled:cursor-not-allowed disabled:bg-[var(--surface)]/40"
      />

      <button
        type="button"
        onClick={onToggleSkip}
        className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--foreground)]/55 hover:text-[var(--foreground)] hover:underline"
      >
        <span
          className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors ${
            skipped
              ? "border-[var(--foreground)] bg-[var(--foreground)]"
              : "border-[var(--foreground)]/30"
          }`}
        >
          {skipped && (
            <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" aria-hidden>
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
        {skipped ? "건너뛰는 중 — 다시 답할게요" : "이 문항은 건너뛸게요"}
      </button>
    </div>
  );
}

