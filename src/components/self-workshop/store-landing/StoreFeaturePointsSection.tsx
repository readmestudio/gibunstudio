"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  smoothstep,
  lerp,
  clamp,
  useInView,
  useTimeline,
} from "@/components/self-workshop/clinical-report/v3-shared";

/**
 * [06] 4 POINT — 워크북의 핵심 가치 + 실제 워크북 화면을 미니어처화한 모션
 *
 * 좌측: POINT 라벨 + 헤드라인 + 서브카피 + 체크리스트
 * 우측: 실제 워크북 페이지의 시각·인터랙션을 작은 카드 안에 재현
 *  - POINT 1: 자가 진단 → Step 2 진단 리포트
 *  - POINT 2: 3가지 리포트 캐러셀 (Step 2 / Step 5 / Step 9)
 *  - POINT 3: 라이팅 테라피 — 이전 답변 인용 + 새 질문 + 타이핑 효과
 *  - POINT 4: 신념 강화 (위) + 일상 To-do (아래) 공간 분할
 *
 * monotone 디자인 가이드 충실 (검정/흰/회색만, accent 미사용).
 * v3-shared 의 timeline/easing helper 를 재사용해 톤 일관성 유지.
 */

interface FeaturePoint {
  number: string;
  title: string;
  description: string;
  checklist: string[];
}

const POINTS: FeaturePoint[] = [
  {
    number: "01",
    title: "쉬지 못하는 마음을\n진단과 분석부터 시작해요",
    description:
      "Likert 5점 척도 20문항으로 자기 가치 조건화·과잉 추동·실패 공포·정서적 회피 4개 영역을 정밀하게 측정합니다. 어느 축이 과활성화되어 있는지 객관적 점수로 드러나요.",
    checklist: [
      "표준화된 자기 보고식 척도",
      "총점 기반 4단계 수준 분석",
      "4개 영역별 점수 시각화",
    ],
  },
  {
    number: "02",
    title: "워크북을 마치면\n3가지 리포트를 받게 돼요",
    description:
      "한 번의 워크북에서 서로 다른 시점에서 분석된 리포트가 누적됩니다. 한 번의 분석으로 끝나지 않고 자기 자신을 다각도에서 마주할 수 있어요.",
    checklist: [
      "자가 진단 리포트 · 4영역 위험군 분석",
      "통합 패턴 분석 리포트 · 인지 Cascade",
      "종합 가이드 리포트 · 한 달 행동 안내",
    ],
  },
  {
    number: "03",
    title: "심리 상담사가\n대화를 이끌듯 글로 따라가요",
    description:
      "전 단계의 답변이 다음 질문의 단서가 되는 라이팅 테라피. 실습지를 한 칸씩 채우는 동안 성취 중독을 만든 생각과 신념이 한 줄씩 모습을 드러냅니다.",
    checklist: [
      "5-Part 인지 모델 워크시트",
      "하향 화살표 기법 (Downward Arrow)",
      "문장 완성 검사 (Sentence Completion Test)",
    ],
  },
  {
    number: "04",
    title: "답을 찾는 것에서\n끝나지 않아요",
    description:
      "찾은 답이 진짜 신념이 되고 믿음이 될 때까지 근거로 강화하고, 일상의 행동 가이드와 자기 확언 카드로 단단히 굳혀갑니다.",
    checklist: [
      "근거 카드로 새 신념 강화 (★★★ → ★★★★★)",
      "DO & DON'T 일상 행동 가이드",
      "자기 확언 카드 (Affirmation Cards)",
    ],
  },
];

export function StoreFeaturePointsSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24">
      {/* 섹션 헤더 */}
      <p className="text-center text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-3">
        HOW IT WORKS
      </p>
      <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold leading-[1.35] text-[var(--foreground)] break-keep">
        워크북은 이렇게 작동합니다
      </h2>
      <p className="mt-5 text-center text-sm sm:text-base text-[var(--foreground)]/65 max-w-2xl mx-auto break-keep leading-relaxed">
        실제 워크북 화면 그대로의 4가지 핵심 흐름을 보여드릴게요.
      </p>

      {/* POINT 블록들 */}
      <div className="mt-20 sm:mt-24 space-y-24 sm:space-y-32">
        {POINTS.map((point, idx) => (
          <PointBlock key={point.number} point={point} idx={idx} />
        ))}
      </div>
    </section>
  );
}

/* ── POINT 단일 블록 (좌: 카피 / 우: 모션) ── */
function PointBlock({ point, idx }: { point: FeaturePoint; idx: number }) {
  return (
    <motion.div
      className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.1fr)] gap-10 lg:gap-16 items-center"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      {/* 좌측 — 카피 */}
      <div>
        <p className="text-xs tracking-[0.22em] font-semibold text-[var(--foreground)]/45">
          POINT {point.number}
        </p>
        <h3 className="mt-4 text-2xl sm:text-3xl md:text-[34px] font-bold leading-[1.3] text-[var(--foreground)] break-keep whitespace-pre-line">
          {point.title}
        </h3>
        <p className="mt-5 text-sm sm:text-base leading-[1.85] text-[var(--foreground)]/65 break-keep">
          {point.description}
        </p>
        <ul className="mt-6 space-y-2.5">
          {point.checklist.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 text-sm sm:text-[15px] text-[var(--foreground)]/85"
            >
              <CheckIcon />
              <span className="break-keep leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 우측 — 모션 */}
      <div>
        {idx === 0 && <Point1DiagnosisMotion />}
        {idx === 1 && <Point2ThreeReportsMotion />}
        {idx === 2 && <Point3WritingTherapyMotion />}
        {idx === 3 && <Point4BeliefAndTodoMotion />}
      </div>
    </motion.div>
  );
}

/* ── 작은 체크 아이콘 ── */
function CheckIcon() {
  return (
    <span
      aria-hidden
      className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--foreground)] text-white"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-2.5 w-2.5"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
}

/* ── 공통 모션 카드 프레임 ── */
function MotionFrame({
  children,
  kicker,
  badge,
}: {
  children: React.ReactNode;
  kicker: string;
  badge: string;
}) {
  return (
    <div className="rounded-2xl border-2 border-[var(--foreground)]/10 bg-white shadow-[3px_3px_0_rgba(0,0,0,0.06)] aspect-[5/4] overflow-hidden p-6 sm:p-7 flex flex-col">
      <div className="flex items-center justify-between text-[10px] tracking-widest uppercase font-semibold">
        <span className="text-[var(--foreground)]/55">{kicker}</span>
        <span className="text-[var(--foreground)]/25">{badge}</span>
      </div>
      <div className="mt-3 flex-1 min-h-0 flex flex-col">{children}</div>
    </div>
  );
}

/* ============================================================
 * POINT 1 모션 — 자가 진단 서베이 → Step 2 진단 리포트
 * ============================================================ */

const SURVEY_QUESTIONS = [
  {
    num: 1,
    text: "나의 가치는 내가 이룬 성과에 의해 결정된다고 느낀다.",
    answer: 4,
  },
  {
    num: 2,
    text: "성과가 없는 하루는 낭비한 하루처럼 느껴진다.",
    answer: 5,
  },
  {
    num: 3,
    text: "쉬려고 하면 뒤처질 것 같은 불안이 밀려온다.",
    answer: 4,
  },
];

const REPORT_DIMENSIONS = [
  { label: "자기 가치 조건화", v: 19 },
  { label: "과잉 추동", v: 18 },
  { label: "실패 공포", v: 21 },
  { label: "정서적 회피", v: 14 },
];
const DIM_MAX = 25;

function Point1DiagnosisMotion() {
  // 서베이 무한 루프 — 진단 결과 단계는 POINT 2 와 중복되므로 제거.
  const [qIdx, setQIdx] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setQIdx((i) => (i + 1) % SURVEY_QUESTIONS.length);
    }, 2200);
    return () => clearTimeout(t);
  }, [qIdx]);

  return (
    <div className="rounded-2xl border-2 border-[var(--foreground)]/10 bg-white shadow-[3px_3px_0_rgba(0,0,0,0.06)] aspect-[5/4] overflow-hidden">
      <AnimatePresence mode="wait">
        <SurveyView
          key={`q-${qIdx}`}
          q={SURVEY_QUESTIONS[qIdx]}
          idx={qIdx}
          total={SURVEY_QUESTIONS.length}
        />
      </AnimatePresence>
    </div>
  );
}

function SurveyView({
  q,
  idx,
  total,
}: {
  q: (typeof SURVEY_QUESTIONS)[number];
  idx: number;
  total: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="h-full flex flex-col p-6 sm:p-7"
    >
      <div className="flex items-center justify-between text-[10px] tracking-widest uppercase font-semibold">
        <span className="text-[var(--foreground)]/55">STEP 01 · 자가 진단</span>
        <span className="tabular-nums text-[var(--foreground)]/40">
          {idx + 1} / {total}
        </span>
      </div>

      <div className="mt-3 h-1 w-full rounded-full bg-[var(--foreground)]/10 overflow-hidden">
        <motion.div
          className="h-full bg-[var(--foreground)]"
          initial={{ width: `${(idx / total) * 100}%` }}
          animate={{ width: `${((idx + 1) / total) * 100}%` }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        />
      </div>

      <p className="mt-6 text-base sm:text-lg font-semibold leading-[1.55] text-[var(--foreground)] break-keep">
        Q{q.num}.{" "}
        <span className="font-medium text-[var(--foreground)]/85">{q.text}</span>
      </p>

      <div className="mt-auto pt-6">
        <div className="flex items-center justify-between gap-2">
          {[1, 2, 3, 4, 5].map((score) => {
            const isSelected = score === q.answer;
            return (
              <div
                key={score}
                className="flex flex-col items-center gap-1.5 flex-1"
              >
                <motion.span
                  className="block h-9 w-9 sm:h-10 sm:w-10 rounded-full border-2 border-[var(--foreground)]"
                  initial={{ backgroundColor: "#ffffff", scale: 1 }}
                  animate={{
                    backgroundColor: isSelected ? "#191919" : "#ffffff",
                    scale: isSelected ? 1.18 : 1,
                  }}
                  transition={{
                    delay: isSelected ? 1.1 : 0,
                    duration: 0.4,
                    ease: "easeOut",
                  }}
                />
                <span className="text-[10px] tabular-nums text-[var(--foreground)]/45">
                  {score}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-[var(--foreground)]/35">
          <span>전혀 아니다</span>
          <span>매우 그렇다</span>
        </div>
      </div>
    </motion.div>
  );
}

/* Step 2 진단 리포트 inner — POINT 1 fallback + POINT 2 Slide 0 에서 재사용 */
function DiagnosisReportInner({ countUp = false }: { countUp?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="h-full flex flex-col p-6 sm:p-7"
    >
      <div className="flex items-center justify-between text-[10px] tracking-widest uppercase font-semibold">
        <span className="text-[var(--foreground)]/55">STEP 02 · 진단 결과</span>
        <span className="text-[var(--foreground)]/25">DIAGNOSIS REPORT</span>
      </div>

      <div className="mt-4 text-center">
        <p className="text-[10px] tracking-widest uppercase font-semibold text-[var(--foreground)]/40">
          TOTAL SCORE
        </p>
        <p className="mt-1 text-4xl sm:text-5xl font-bold text-[var(--foreground)] tabular-nums leading-none">
          {countUp ? <CountUp from={0} to={72} duration={1.3} /> : 72}
          <span className="text-lg sm:text-xl text-[var(--foreground)]/40 font-bold ml-1">
            / 100
          </span>
        </p>
        <motion.p
          className="mt-3 inline-block rounded-full bg-[var(--foreground)] px-3 py-1 text-[11px] font-semibold text-white tracking-wide"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.4 }}
        >
          LV.3 · 성취 중독 위험군
        </motion.p>
      </div>

      <div className="mt-5 sm:mt-6 space-y-2.5">
        {REPORT_DIMENSIONS.map((d, i) => (
          <div key={d.label}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--foreground)]/65">{d.label}</span>
              <span className="font-semibold text-[var(--foreground)] tabular-nums">
                {d.v}
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-[var(--foreground)]/10 overflow-hidden">
              <motion.div
                className="h-full bg-[var(--foreground)]/85"
                initial={{ width: 0 }}
                animate={{ width: `${(d.v / DIM_MAX) * 100}%` }}
                transition={{
                  delay: 1.6 + i * 0.18,
                  duration: 0.7,
                  ease: "easeOut",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function CountUp({
  from,
  to,
  duration,
}: {
  from: number;
  to: number;
  duration: number;
}) {
  const [n, setN] = useState(from);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / (duration * 1000));
      setN(Math.round(from + (to - from) * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [from, to, duration]);
  return <>{n}</>;
}

/* ============================================================
 * POINT 2 모션 — 3가지 리포트 캐러셀
 *   슬라이드 0: Step 2 진단 리포트 (DiagnosisReportInner 재사용)
 *   슬라이드 1: Step 5 통합 패턴 분석 (인지 Cascade)
 *   슬라이드 2: Step 9 종합 가이드 리포트 (Escape Loop + DO/DON'T)
 *   각 슬라이드 3.5s 표시, 0.4s 페이드, 총 ~10.5s 루프
 * ============================================================ */

function Point2ThreeReportsMotion() {
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setSlideIdx((i) => (i + 1) % 3), 5500);
    return () => clearTimeout(t);
  }, [slideIdx]);

  return (
    <div className="rounded-2xl border-2 border-[var(--foreground)]/10 bg-white shadow-[3px_3px_0_rgba(0,0,0,0.06)] aspect-[5/4] overflow-hidden relative">
      <AnimatePresence mode="wait">
        {slideIdx === 0 && <DiagnosisReportInner key="s0" countUp />}
        {slideIdx === 1 && <CascadeSlide key="s1" />}
        {slideIdx === 2 && <DailyActionSlide key="s2" />}
      </AnimatePresence>

      {/* 캐러셀 인디케이터 */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`block h-1 rounded-full transition-all duration-300 ${
              i === slideIdx
                ? "w-6 bg-[var(--foreground)]"
                : "w-1.5 bg-[var(--foreground)]/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Slide 1 — Step 5 인지 Cascade
 *   3 phase 한 번에 하나씩, 큰 글씨로. 동그라미가 척추 따라 위→아래 이동.
 *   각 phase 1.7초 × 3 = 5.1초 (슬라이드 5.5s 안에 마무리)
 * ── */

interface CascadeNode {
  label: string;
  title: string;
  desc: string;
}

const CASCADE_NODES: CascadeNode[] = [
  {
    label: "트리거",
    title: "프로젝트를 완성하지 못한 상황",
    desc: "이 상황이 '나는 무능하다'는 증거로 즉시 해석됩니다.",
  },
  {
    label: "자동 사고",
    title: "이번에도 하다 포기한다",
    desc: "과거 경험을 투사해 최악의 시나리오로 확장됩니다.",
  },
  {
    label: "자기 정의",
    title: "나는 결과를 못 만들어",
    desc: "행동 패턴을 영구적이고 본질적인 정체성으로 낙인 찍습니다.",
  },
];

function CascadeSlide() {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const N = CASCADE_NODES.length;

  useEffect(() => {
    if (phaseIdx >= N - 1) return; // 마지막 phase 에서 정지 (슬라이드 전환은 부모가)
    const t = setTimeout(() => setPhaseIdx((i) => i + 1), 1700);
    return () => clearTimeout(t);
  }, [phaseIdx, N]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="h-full flex flex-col p-5 sm:p-6"
    >
      <div className="flex items-center justify-between text-[10px] tracking-widest uppercase font-semibold">
        <span className="text-[var(--foreground)]/55">
          STEP 05 · 통합 패턴 분석
        </span>
        <span className="text-[var(--foreground)]/25">COGNITIVE CASCADE</span>
      </div>

      <div className="mt-3 flex-1 grid grid-cols-[44px_1fr] gap-4 min-h-0">
        {/* 좌측: 척추 + 누적 노드 */}
        <div className="relative">
          {/* 척추 — phase 진행에 따라 길이 늘어남 */}
          <motion.div
            className="absolute left-1/2 -translate-x-1/2 w-px origin-top bg-[var(--foreground)]/20"
            style={{ top: `${(0.5 / N) * 100}%` }}
            initial={false}
            animate={{ height: `${(phaseIdx / N) * 100}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />

          {/* 3개 노드 — phaseIdx 이하만 등장 (누적) */}
          {CASCADE_NODES.map((_, i) => {
            const top = ((i + 0.5) / N) * 100;
            const visible = i <= phaseIdx;
            const isCurrent = i === phaseIdx;
            return (
              <motion.span
                key={i}
                className="absolute left-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold tabular-nums bg-[var(--foreground)] text-white"
                style={{ top: `${top}%`, x: "-50%", y: "-50%" }}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{
                  scale: visible ? 1 : 0.5,
                  opacity: visible ? 1 : 0,
                  boxShadow: isCurrent
                    ? "0 0 0 5px rgba(25,25,25,0.10)"
                    : "0 0 0 0 rgba(25,25,25,0)",
                }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                {String(i + 1).padStart(2, "0")}
              </motion.span>
            );
          })}
        </div>

        {/* 우측: 콘텐츠 누적 stack — 노드 위치와 grid-rows 정렬 일치 */}
        <ul className="grid grid-rows-3 min-h-0">
          {CASCADE_NODES.map((node, i) => {
            const visible = i <= phaseIdx;
            return (
              <li
                key={i}
                className="flex flex-col justify-center min-h-0 py-0.5"
              >
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: visible ? 1 : 0,
                    y: visible ? 0 : 10,
                  }}
                  transition={{
                    duration: 0.5,
                    ease: "easeOut",
                    delay: visible && i === phaseIdx ? 0.18 : 0,
                  }}
                >
                  <p className="text-[9px] tracking-[0.22em] uppercase font-bold text-[var(--foreground)]/55">
                    {String(i + 1).padStart(2, "0")} · {node.label}
                  </p>
                  <h4 className="mt-1 text-[14px] sm:text-[15px] font-bold text-[var(--foreground)] break-keep leading-[1.35]">
                    {node.title}
                  </h4>
                  <p className="mt-1 text-[11.5px] leading-[1.55] text-[var(--foreground)]/60 break-keep">
                    {node.desc}
                  </p>
                </motion.div>
              </li>
            );
          })}
        </ul>
      </div>
    </motion.div>
  );
}

/* ── Slide 2 — Step 9 종합 가이드 리포트 · "다음 한 달, 이렇게 살아보세요"
 *   DO 행동 리스트 01·02·03 가 차례로 등장. 각 항목 텍스트 → 체크 아이콘 시퀀스.
 * ── */

const DAILY_DO_ACTIONS = [
  {
    num: "01",
    title: "성장 일지 쓰기",
    desc: "결과가 아닌 배운 점에 집중",
  },
  {
    num: "02",
    title: "연결되는 시간 갖기",
    desc: "성과와 무관한 나 자신을 느끼기",
  },
  {
    num: "03",
    title: "80% 버전 공유하기",
    desc: "미완성을 신뢰하는 사람에게",
  },
];

function DailyActionSlide() {
  // step 시퀀스:
  //  0 = 헤드라인 + DO 헤더만
  //  1 = 항목 01 텍스트
  //  2 = 01 체크
  //  3 = 항목 02 텍스트
  //  4 = 02 체크
  //  5 = 항목 03 텍스트
  //  6 = 03 체크 (끝, hold)
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= 6) return;
    const delay = step === 0 ? 600 : step % 2 === 1 ? 350 : 400;
    const t = setTimeout(() => setStep((s) => s + 1), delay);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      className="h-full flex flex-col p-6 sm:p-7"
    >
      <div className="flex items-center justify-between text-[10px] tracking-widest uppercase font-semibold">
        <span className="text-[var(--foreground)]/55">
          STEP 09 · 종합 가이드
        </span>
        <span className="text-[var(--foreground)]/25">DAILY ACTION</span>
      </div>

      {/* 큰 헤드라인 */}
      <h4 className="mt-3 text-base sm:text-lg md:text-xl font-bold text-[var(--foreground)] break-keep leading-[1.3]">
        다음 한 달, 이렇게 살아보세요.
      </h4>

      {/* DO 헤더 (체크 아이콘 + 라벨) */}
      <div className="mt-4 flex items-center gap-2">
        <span
          aria-hidden
          className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--foreground)] text-white"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-2.5 w-2.5"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <p className="text-[10px] tracking-[0.18em] uppercase font-bold text-[var(--foreground)]/85">
          DO · 새 신념을 지키는 행동
        </p>
      </div>

      {/* 구분선 */}
      <div className="mt-2 h-px bg-[var(--foreground)]/12" />

      {/* 행동 리스트 */}
      <ul className="flex-1 min-h-0 divide-y divide-[var(--foreground)]/10">
        {DAILY_DO_ACTIONS.map((it, i) => {
          const textVisible = step >= 1 + i * 2;
          const checkVisible = step >= 2 + i * 2;
          return (
            <motion.li
              key={i}
              className="grid grid-cols-[28px_1fr_18px] items-center gap-3 py-2.5"
              initial={{ opacity: 0, y: 8 }}
              animate={{
                opacity: textVisible ? 1 : 0,
                y: textVisible ? 0 : 8,
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <span className="text-[11px] tabular-nums font-mono text-[var(--foreground)]/45">
                {it.num}
              </span>
              <div>
                <p className="text-[13px] sm:text-sm font-bold text-[var(--foreground)] leading-snug break-keep">
                  {it.title}
                </p>
                <p className="mt-0.5 text-[11px] leading-snug text-[var(--foreground)]/55 break-keep">
                  {it.desc}
                </p>
              </div>
              <motion.span
                aria-hidden
                className="text-[var(--foreground)]"
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{
                  opacity: checkVisible ? 1 : 0,
                  scale: checkVisible ? 1 : 0.4,
                }}
                transition={{
                  duration: 0.35,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </motion.span>
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
}

/* ============================================================
 * POINT 3 모션 — 라이팅 테라피 (이전 답변 → 새 질문 → 타이핑)
 * ============================================================ */

interface TypingSeq {
  prev: string | null;
  question: string;
  stem: string;
  typed: string;
  progress: string;
}

const TYPING_SEQUENCES: TypingSeq[] = [
  {
    prev: null,
    question: "그때 머릿속에 처음 떠오른 생각은?",
    stem: "그 생각은…",
    typed: "또 못했다. 나는 무능해.",
    progress: "3 / 10",
  },
  {
    prev: "또 못했다. 나는 무능해.",
    question: "그 생각 아래엔 어떤 신념이 있을까요?",
    stem: "나의 가치는…",
    typed: "내가 무엇을 해냈는가에 달려 있다.",
    progress: "5 / 10",
  },
  {
    prev: "내가 무엇을 해냈는가에 달려 있다.",
    question: "그 신념을 누구에게 처음 배웠나요?",
    stem: "어릴 때 나는…",
    typed: "성과로만 사랑받는다고 느꼈다.",
    progress: "7 / 10",
  },
];

function Point3WritingTherapyMotion() {
  const [seqIdx, setSeqIdx] = useState(0);
  const seq = TYPING_SEQUENCES[seqIdx];

  // 타이핑 진행 (글자 수 기반)
  const totalDur = seq.typed.length * 60 + 1400; // 타이핑 + hold
  const [ref, seen] = useInView<HTMLDivElement>(0.2);
  const t = useTimeline(seen, totalDur, 0, false);

  // 타이핑 끝나는 시점 (전체 duration 중 비율)
  const typingEndRatio =
    (seq.typed.length * 60) / totalDur;
  const typingProgress = clamp(t / typingEndRatio, 0, 1);
  const visibleChars = Math.floor(seq.typed.length * typingProgress);
  const visibleText = seq.typed.slice(0, visibleChars);
  const isTyping = typingProgress < 1;

  // 한 시퀀스 끝나면 다음으로
  useEffect(() => {
    if (t >= 0.999) {
      const timer = setTimeout(
        () => setSeqIdx((i) => (i + 1) % TYPING_SEQUENCES.length),
        100,
      );
      return () => clearTimeout(timer);
    }
  }, [t]);

  return (
    <div ref={ref}>
      <MotionFrame
        kicker="STEP 04 · 라이팅 테라피"
        badge={seq.progress}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={seqIdx}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
            className="flex-1 flex flex-col gap-3 min-h-0 mt-1"
          >
            {/* 이전 답변 인용 박스 */}
            {seq.prev && (
              <div className="border-l-2 border-[var(--foreground)]/30 pl-3 py-1">
                <p className="text-[9px] tracking-widest uppercase font-semibold text-[var(--foreground)]/40">
                  이전 답변
                </p>
                <p className="mt-0.5 text-[13px] italic text-[var(--foreground)]/55 break-keep leading-snug">
                  &ldquo;{seq.prev}&rdquo;
                </p>
              </div>
            )}

            {/* 새 질문 */}
            <div>
              <p className="text-[10px] tracking-widest uppercase font-semibold text-[var(--foreground)]/55">
                Q.
              </p>
              <p className="mt-1 text-sm sm:text-[15px] font-semibold leading-snug text-[var(--foreground)] break-keep">
                {seq.question}
              </p>
            </div>

            {/* 입력 영역 (sentence stem + 타이핑) */}
            <div className="mt-auto rounded-md border-2 border-[var(--foreground)]/15 bg-[var(--foreground)]/[0.02] p-3">
              <p className="text-[11px] text-[var(--foreground)]/45 italic">
                {seq.stem}
              </p>
              <p className="mt-1.5 text-sm leading-snug text-[var(--foreground)] break-keep min-h-[40px]">
                {visibleText}
                {isTyping && (
                  <motion.span
                    className="inline-block w-[2px] h-[1em] ml-0.5 bg-[var(--foreground)] align-middle"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{
                      duration: 0.9,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                )}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </MotionFrame>
    </div>
  );
}

/* ============================================================
 * POINT 4 모션 — 신념 강화 (위) + 일상 To-do (아래) 공간 분할
 * ============================================================ */

const EVIDENCE_CARDS = [
  "어제 1시간 산책했더니 다음날 더 집중됐다",
  "친구가 내 휴식 모습을 부럽다고 했다",
  "쉰 다음날 보고서 오타가 줄었다",
];

interface Affirmation {
  num: string;
  text: string;
}

const AFFIRMATIONS: Affirmation[] = [
  { num: "01", text: "나는 성과 없이도\n충분히 가치 있다." },
  { num: "02", text: "쉼은 게으름이 아니라\n회복의 시간이다." },
];

function Point4BeliefAndTodoMotion() {
  const [ref, seen] = useInView<HTMLDivElement>(0.2);
  const t = useTimeline(seen, 10000, 0, true);

  // 근거 카드 누적
  const evidenceCount =
    t < 0.06 ? 0 : t < 0.20 ? 1 : t < 0.34 ? 2 : 3;

  // 강도 (30 → 90)
  const strength = lerp(30, 90, smoothstep(0.06, 0.34, t));
  const filledStars = Math.round(strength / 20);

  // 자기 확언 카드 영역
  const affirmationVisible = t > 0.48;
  const affirmationsShown = t > 0.66 ? 2 : t > 0.56 ? 1 : 0;

  return (
    <div ref={ref} className="rounded-2xl border-2 border-[var(--foreground)]/10 bg-white shadow-[3px_3px_0_rgba(0,0,0,0.06)] aspect-[5/4] overflow-hidden p-5 sm:p-6 flex flex-col">
      {/* === 위: Step 8 근거 모으기 === */}
      <div className="flex-[0.62] min-h-0 flex flex-col">
        <div className="flex items-center justify-between text-[10px] tracking-widest uppercase font-semibold">
          <span className="text-[var(--foreground)]/55">
            STEP 08 · 근거 모으기
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-[var(--foreground)]/40">STRENGTH</span>
            <span className="flex gap-0.5 text-[12px] tracking-tight tabular-nums">
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  className={
                    s <= filledStars
                      ? "text-[var(--foreground)]"
                      : "text-[var(--foreground)]/15"
                  }
                >
                  ★
                </span>
              ))}
            </span>
          </span>
        </div>

        {/* 새 신념 헤더 */}
        <div className="mt-2 px-3 py-2 rounded-md bg-[var(--foreground)] text-white">
          <p className="text-[9px] tracking-widest uppercase font-semibold text-white/60">
            새 신념
          </p>
          <p className="mt-0.5 text-[13px] sm:text-sm font-bold break-keep leading-snug">
            &ldquo;나는 쉴 권리가 있다&rdquo;
          </p>
        </div>

        {/* 근거 카드 누적 */}
        <ul className="mt-2 flex-1 min-h-0 space-y-1.5 overflow-hidden">
          {EVIDENCE_CARDS.map((c, i) => {
            const visible = i < evidenceCount;
            return (
              <motion.li
                key={i}
                className="flex items-start gap-2 rounded border border-[var(--foreground)]/10 bg-white px-2.5 py-1.5"
                initial={{ opacity: 0, y: 6 }}
                animate={{
                  opacity: visible ? 1 : 0,
                  y: visible ? 0 : 6,
                }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <span className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--foreground)]" />
                <span className="text-[11.5px] leading-snug text-[var(--foreground)]/85 break-keep">
                  {c}
                </span>
              </motion.li>
            );
          })}
        </ul>
      </div>

      {/* 구분선 */}
      <div className="my-3 h-px bg-[var(--foreground)]/10" />

      {/* === 아래: Step 9 자기 확언 카드 === */}
      <motion.div
        className="flex-[0.38] min-h-0 flex flex-col"
        animate={{ opacity: affirmationVisible ? 1 : 0.25 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between text-[10px] tracking-widest uppercase font-semibold">
          <span className="text-[var(--foreground)]/55">
            STEP 09 · 자기 확언
          </span>
          <span className="text-[var(--foreground)]/25">
            AFFIRMATION CARDS
          </span>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 flex-1 min-h-0">
          {AFFIRMATIONS.map((af, i) => {
            const visible = i < affirmationsShown;
            return (
              <motion.div
                key={i}
                className="rounded-lg border border-[var(--foreground)]/15 bg-[var(--foreground)]/[0.02] px-2.5 py-2 flex flex-col"
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{
                  opacity: visible ? 1 : 0,
                  y: visible ? 0 : 8,
                  scale: visible ? 1 : 0.96,
                }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              >
                <span
                  aria-hidden
                  className="block text-xl leading-none text-[var(--foreground)]/45"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                  &ldquo;
                </span>
                <p className="mt-0.5 flex-1 text-[10.5px] leading-[1.45] font-semibold text-[var(--foreground)]/85 break-keep whitespace-pre-line">
                  {af.text}
                </p>
                <p className="mt-1 text-[8px] tracking-[0.18em] uppercase font-bold text-[var(--foreground)]/35 text-right">
                  AFFIRMATION · {af.num}
                </p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
