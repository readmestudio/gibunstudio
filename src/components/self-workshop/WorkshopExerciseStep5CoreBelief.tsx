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
import {
  Body,
  COL,
  D,
  EditorialFrame,
  EditorialInput,
  EditorialItem,
  Headline,
  Mono,
  SectionHeader,
  SkipToggle,
  TS,
} from "@/components/self-workshop/clinical-report/v3-shared";

// 카테고리 코드 → 메타 라벨용 영문 코드 매핑.
// SCT_CATEGORIES 에는 한글 라벨만 있어서 여기서만 보조로 갖는다.
const SCT_CATEGORY_EN: Record<SctCategoryCode, string> = {
  A: "SELF-VALUE",
  B: "ACHIEVEMENT",
  C: "TRUST",
  D: "CONTROL",
};

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
      <div
        className="py-20 text-center"
        style={{ maxWidth: COL + 96, margin: "0 auto", padding: "80px 48px" }}
      >
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
    <div
      className="space-y-8 pb-20"
      style={{ maxWidth: COL + 96, margin: "0 auto", padding: "0 48px" }}
    >
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

      {/* 진행 카드 — 박스 없이 메타 라벨 + 진행률 줄 + CTA */}
      <section className="space-y-5 pt-4">
        <SectionHeader kicker="● 작성 완료 후" rightLabel="PROGRESS" />

        <Headline size="h3">다음 단계에서 함께 분석할게요</Headline>
        <Body muted style={{ marginTop: 12 }}>
          여기서 적은 응답들은 다음 단계에서 Step 3의 자동사고와 함께 묶여,
          당신의 핵심 신념과 성취 중독 패턴이 어떻게 연결되는지 통합으로
          분석돼요.
        </Body>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[var(--foreground)]/65">
            <Mono size={10} weight={500} color={D.text3} tracking={0.16}>
              {String(answeredCount).padStart(2, "0")} / {String(SCT_TOTAL_COUNT).padStart(2, "0")} 답변됨
            </Mono>
            <Mono size={10} weight={500} color={D.text3} tracking={0.16}>
              MIN {SCT_MIN_FOR_ANALYSIS}
            </Mono>
          </div>
          <div className="h-px w-full bg-[var(--foreground)]/10" />
          <div className="h-px w-full overflow-hidden">
            <div
              className="h-px transition-all"
              style={{
                width: `${Math.min(100, (answeredCount / SCT_TOTAL_COUNT) * 100)}%`,
                background: D.accent,
                marginTop: -1,
              }}
            />
          </div>
        </div>

        <div className="pt-2 text-center">
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
          <p className="text-center text-sm text-red-600">{error}</p>
        )}
      </section>

      <p className="text-center text-xs text-[var(--foreground)]/40">
        작성 내용은 자동으로 저장됩니다
      </p>
    </div>
  );
}

/* ─────────────────────────── 인트로 카드 ─────────────────────────── */

function SctIntroCard() {
  return (
    <section className="space-y-5">
      <SectionHeader kicker="● PART A · STEP 4" rightLabel="OPENING" />

      <Headline>성취 중독 아래에 있는 핵심 신념 찾기</Headline>

      <Body muted style={{ marginTop: 12 }}>
        Step 3에서는 성취 중독 패턴이 <strong style={{ color: D.ink }}>트리거된 한 상황</strong>과
        그때 따라온 감정·생각·신체·행동 반응을 살펴봤어요. 표면에서 일어난
        한 번의 사건을 분석한 거예요.
      </Body>

      <Body muted>
        이제는 그 패턴 <strong style={{ color: D.ink }}>아래에 깔려 있는 핵심 신념</strong>을 찾아볼
        차례예요.{" "}
        <span className="box-decoration-clone rounded-sm bg-sky-100 px-1 py-0.5">
          핵심 신념은 내가 살아오면서 만들어온{" "}
          <strong>오래된 안경</strong> 같은 거예요.
        </span>{" "}
        같은 상황에서도 누군가는 &ldquo;괜찮아, 다음에 잘하면 되지&rdquo;라고
        보고, 누군가는 &ldquo;역시 나는 안 돼&rdquo;라고 느끼는 차이가 바로
        이 안경에서 나와요.
      </Body>

      <SameSceneTwoLensesAnimation />

      <Body muted>
        보통 어린 시절이나 중요한 관계에서 학습되어 자리잡고, 이후엔 의식하지
        않아도 자동으로 작동해요. 그래서 같은 트리거에 같은 반응이 반복되는
        거예요.
      </Body>
    </section>
  );
}

function SctHowToFindCard() {
  return (
    <section className="space-y-4">
      <SectionHeader kicker="● PART B · 어떻게 찾을까요" rightLabel="METHOD" />
      <Body muted style={{ marginTop: 8 }}>
        핵심 신념은 평소엔 의식 밖에 있어서 직접 묻기 어려워요. 그래서
        심리학에서는 미완성 문장을 짧게 채우게 해서, 떠오르는 첫 문장으로
        그 사람의 신념 구조를 추정하는{" "}
        <strong style={{ color: D.ink }}>문장 완성검사(SCT)</strong>를 자주 써요.
      </Body>
      <Body muted>
        이 방식을 워크북 톤으로 변형해 {SCT_TOTAL_COUNT}개의 미완성 문장을
        준비했어요. 자기 가치 · 성취·인정 · 관계 · 통제 네 영역에서 짧게
        답해주시면 돼요.
      </Body>
    </section>
  );
}

function SctBeforeStartCard() {
  const items = [
    "정답이 없어요",
    "떠오르는 첫 문장이 가장 솔직해요",
    "어려운 문항은 건너뛰어도 괜찮아요",
    "결과는 진단이 아니라 가설이에요",
  ];
  return (
    <section className="space-y-4">
      <SectionHeader kicker="● PART C · 시작하기 전에" rightLabel="GUIDELINES" />
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li
            key={it}
            className="flex items-start gap-3"
            style={{ fontFamily: D.font, fontSize: TS.body, lineHeight: 1.7, color: D.text2 }}
          >
            <span style={{ minWidth: 24 }}>
              <Mono size={11} weight={500} color={D.text3} tracking={0.16}>
                {String(i + 1).padStart(2, "0")}
              </Mono>
            </span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </section>
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
    >
      <EditorialFrame label="FIG. 04-A · SAME EVENT → DIFFERENT LENS">
        {/* 같은 사건 — EditorialItem 으로 정렬 */}
        <motion.div variants={fadeUp}>
          <EditorialItem label="STEP 01 · 같은 사건" kind="EVENT">
            <p
              style={{
                margin: 0,
                fontFamily: D.font,
                fontSize: TS.lede,
                fontWeight: 700,
                lineHeight: 1.5,
                color: D.ink,
              }}
            >
              &ldquo;쉬는 주말이 생겼어요&rdquo;
            </p>
          </EditorialItem>
        </motion.div>

        {/* 분기 화살표 */}
        <motion.div
          variants={fadeUp}
          aria-hidden
          className="my-3 flex justify-center"
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

        {/* 두 안경 — 박스 없이 안경 일러스트 + Mono 라벨만 */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div variants={fromLeft} className="px-1">
            <Glasses
              tint="light"
              leftText="대박이다!"
              rightText="푹 쉬어야지!"
            />
            <p className="mt-3 text-center">
              <Mono size={10} weight={600} color={D.text3} tracking={0.18}>
                핵심 믿음 A
              </Mono>
            </p>
          </motion.div>
          <motion.div variants={fromRight} className="px-1">
            <Glasses
              tint="dark"
              leftText="쉬면 안돼,"
              rightText="뭐라도 해야해"
            />
            <p className="mt-3 text-center">
              <Mono size={10} weight={600} color={D.accent} tracking={0.18}>
                핵심 믿음 B
              </Mono>
            </p>
          </motion.div>
        </div>

        <motion.p
          variants={fadeUp}
          style={{
            margin: "16px 0 0",
            textAlign: "center",
            fontFamily: D.font,
            fontSize: TS.bodySm,
            lineHeight: 1.6,
            color: D.text2,
          }}
        >
          같은 사건도 어떤 안경으로 보느냐에 따라 의미가 달라져요.
          <br />
          Step 4에서 찾는 건 바로 그 <strong style={{ color: D.ink }}>안경</strong>이에요.
        </motion.p>
      </EditorialFrame>
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
  const sectionLabel = `● ${String(index).padStart(2, "0")} · ${category.labelKo}`;

  return (
    <section className="space-y-4">
      <SectionHeader kicker={sectionLabel} rightLabel={SCT_CATEGORY_EN[categoryCode]} accent />
      <Body muted small>
        {category.introKo}
      </Body>

      <div className="space-y-4">
        {questions.map((q) => (
          <SctItem
            key={q.code}
            question={q}
            categoryEn={SCT_CATEGORY_EN[categoryCode]}
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
  categoryEn,
  response,
  onChange,
  onToggleSkip,
}: {
  question: SctQuestion;
  categoryEn: string;
  response: { answer: string; skipped: boolean } | undefined;
  onChange: (value: string) => void;
  onToggleSkip: () => void;
}) {
  const skipped = response?.skipped ?? false;
  const value = response?.answer ?? "";
  const hasValue = value.trim().length > 0;

  return (
    <EditorialItem
      label={`FIG. SCT-${question.code} · ${categoryEn}`}
      kind={skipped ? "SKIPPED" : hasValue ? "ACTIVE" : "EMPTY"}
      accent={hasValue}
      style={skipped ? { opacity: 0.6 } : undefined}
    >
      <p
        style={{
          margin: 0,
          fontFamily: D.font,
          fontSize: TS.body,
          fontWeight: 600,
          lineHeight: 1.6,
          color: D.ink,
        }}
      >
        {question.prompt}{" "}
        <span style={{ color: D.text4 }}>_______</span>
      </p>

      {question.examples.length > 0 && (
        <p
          style={{
            margin: "6px 0 0",
            fontFamily: D.font,
            fontSize: TS.bodySm,
            lineHeight: 1.6,
            color: D.text2,
          }}
        >
          {question.examples.join(" · ")}
        </p>
      )}

      <EditorialInput
        value={value}
        onChange={onChange}
        disabled={skipped}
        maxLength={200}
        placeholder="여기에 짧게 적어주세요"
        ariaLabel={`${question.code} 답변`}
      />

      <SkipToggle skipped={skipped} onToggle={onToggleSkip} />
    </EditorialItem>
  );
}

