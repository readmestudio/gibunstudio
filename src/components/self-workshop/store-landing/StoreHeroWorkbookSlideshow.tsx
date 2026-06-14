"use client";

import { motion } from "framer-motion";
import type { DemoWorkshopResult } from "@/lib/self-workshop/getDemoWorkshopResult";

/**
 * 워크북 결과 리포트 슬라이드쇼 (가로 마퀴 무한 스크롤).
 *
 * 10개 step 각각의 *실제 리포트 미니어처* — 검정 placeholder 카드는 제거.
 * Step 02 (진단 결과) 만 demo 유저 데이터를 사용, 나머지는 mingle22 대표 시나리오 sample.
 */

interface Props {
  /** demo 유저 워크북 결과. Step 02 미니어처에서 활용. */
  demoResult?: DemoWorkshopResult | null;
}

interface ReportSlide {
  number: string;
  title: string;
  badge: string;
  /** 단계 한 줄 설명 — 카드 제목 아래 보조 캡션으로 노출. */
  description: string;
}

const REPORT_SLIDES: ReportSlide[] = [
  {
    number: "01",
    title: "자가 진단",
    badge: "LIKERT",
    description: "Likert 5점 척도 20문항 검사",
  },
  {
    number: "02",
    title: "진단 결과",
    badge: "DIAGNOSIS",
    description: "4영역 위험군 + 총점 분석",
  },
  {
    number: "03",
    title: "내 안의 마음들",
    badge: "INNER PARTS",
    description: "성취 앞에서 흔들리는 여러 마음 만나기",
  },
  {
    number: "04",
    title: "핵심 신념 찾기",
    badge: "CORE BELIEF",
    description: "자기·타인·세계, 세 갈래 핵심 신념",
  },
  {
    number: "05",
    title: "통합 패턴 분석",
    badge: "CASCADE",
    description: "1-2초 사이 일어난 인지 Cascade",
  },
  {
    number: "06",
    title: "대안 자동 사고",
    badge: "REFRAMING",
    description: "같은 상황, 다른 사고 시뮬레이션",
  },
  {
    number: "07",
    title: "새 핵심 신념",
    badge: "NEW BELIEF",
    description: "세 가지 신념을 다시 보기",
  },
  {
    number: "08",
    title: "근거 모으기",
    badge: "EVIDENCE",
    description: "새 신념을 떠받칠 작은 증거들",
  },
  {
    number: "09",
    title: "종합 가이드 리포트",
    badge: "DAILY",
    description: "한 달 동안의 DO & DON'T 가이드",
  },
  {
    number: "10",
    title: "마무리 성찰",
    badge: "REFLECTION",
    description: "워크북 완성, 나에게 한 마디",
  },
];

const LOOP_DURATION_SEC = 70;

export function StoreHeroWorkbookSlideshow({ demoResult = null }: Props) {
  const doubled = [...REPORT_SLIDES, ...REPORT_SLIDES];

  return (
    <div
      className="mt-14 sm:mt-16 relative w-full overflow-hidden"
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
      }}
      aria-label="워크북 결과 리포트 미리보기"
    >
      <motion.div
        className="flex gap-5 sm:gap-6 w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: LOOP_DURATION_SEC,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        {doubled.map((slide, i) => (
          <ReportSlideCard
            key={`${slide.number}-${i}`}
            slide={slide}
            data={demoResult}
          />
        ))}
      </motion.div>
    </div>
  );
}

/* ── 결과 리포트 슬라이드 카드 ── */
function ReportSlideCard({
  slide,
  data,
}: {
  slide: ReportSlide;
  data: DemoWorkshopResult | null;
}) {
  // 모든 카드는 코드 미니어처(목업)로 렌더 — 외부 스크린샷에 의존하지 않고
  // 워크북이 바뀌면 이 파일에서 곧바로 반영한다.
  return (
    <article className="flex-shrink-0 w-[300px] sm:w-[360px] aspect-[3/4] overflow-hidden rounded-2xl border-2 border-[var(--foreground)]/12 bg-white shadow-[3px_3px_0_rgba(0,0,0,0.06)] p-6 sm:p-7 flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-[var(--foreground)]/10 pb-3">
        <p className="text-[10px] sm:text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--foreground)]/55">
          STEP {slide.number}
        </p>
        <p className="text-[9px] tracking-[0.18em] uppercase text-[var(--foreground)]/30 font-semibold">
          {slide.badge}
        </p>
      </div>

      {/* 제목 + 한 줄 설명 */}
      <h4 className="mt-3.5 text-base sm:text-lg font-bold text-[var(--foreground)] break-keep leading-tight">
        {slide.title}
      </h4>
      <p className="mt-1 text-[10.5px] sm:text-[11px] leading-snug text-[var(--foreground)]/50 break-keep">
        {slide.description}
      </p>

      {/* 단계별 콘텐츠 */}
      <div className="mt-3.5 flex-1 min-h-0 flex flex-col">
        {renderStepContent(slide.number, data)}
      </div>
    </article>
  );
}

/* ── 단계 번호 → 콘텐츠 컴포넌트 매핑 ── */
function renderStepContent(
  stepNumber: string,
  data: DemoWorkshopResult | null,
): React.ReactNode {
  switch (stepNumber) {
    case "01":
      return <Step1LikertSurvey />;
    case "02":
      return <Step2Diagnosis data={data} />;
    case "03":
      return <Step3InnerParts />;
    case "04":
      return <Step4CoreBelief />;
    case "05":
      return <Step5Cascade />;
    case "06":
      return <Step6Reframing />;
    case "07":
      return <Step7NewBelief />;
    case "08":
      return <Step8Evidence />;
    case "09":
      return <Step9DailyAction />;
    case "10":
      return <Step10Reflection />;
    default:
      return null;
  }
}

/* ============================================================
 * STEP 01 · 자가 진단 (Likert 5점 척도)
 * ============================================================ */
function Step1LikertSurvey() {
  return (
    <>
      <div className="flex items-center justify-between text-[10px] text-[var(--foreground)]/45">
        <span className="tabular-nums">14 / 20</span>
        <span className="tracking-wider uppercase">진행도</span>
      </div>
      <div className="mt-1 h-0.5 w-full rounded-full bg-[var(--foreground)]/10 overflow-hidden">
        <div className="h-full w-[70%] bg-[var(--foreground)]" />
      </div>

      <p className="mt-5 text-[13px] sm:text-sm font-semibold leading-[1.55] text-[var(--foreground)] break-keep">
        Q14. 나의 가치는 내가 이룬
        <br />
        성과로 결정된다.
      </p>

      <div className="mt-auto">
        <div className="flex items-center justify-between gap-1">
          {[1, 2, 3, 4, 5].map((n) => {
            const selected = n === 4;
            return (
              <div
                key={n}
                className="flex flex-col items-center gap-1 flex-1"
              >
                <span
                  className={`block h-7 w-7 rounded-full border-2 border-[var(--foreground)] ${
                    selected ? "bg-[var(--foreground)]" : "bg-white"
                  }`}
                />
                <span className="text-[9px] tabular-nums text-[var(--foreground)]/45">
                  {n}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-1.5 flex justify-between text-[9px] text-[var(--foreground)]/35">
          <span>전혀 아니다</span>
          <span>매우 그렇다</span>
        </div>
      </div>
    </>
  );
}

/* ============================================================
 * STEP 02 · 진단 결과 (실제 demo 데이터 또는 sample)
 * ============================================================ */
function Step2Diagnosis({ data }: { data: DemoWorkshopResult | null }) {
  const TOTAL_MAX = 100;
  const DIM_MAX = 25;

  const scores = data?.diagnosisScores ?? {
    total: 72,
    level: 3,
    levelName: "성취 중독 위험군",
    dimensions: {
      conditional_self_worth: 19,
      compulsive_striving: 18,
      fear_of_failure: 21,
      emotional_avoidance: 14,
    },
  };

  const totalPct = Math.min(100, Math.round((scores.total / TOTAL_MAX) * 100));
  const DIM_LABELS = [
    { key: "conditional_self_worth" as const, label: "자기 가치 조건화" },
    { key: "compulsive_striving" as const, label: "과잉 추동" },
    { key: "fear_of_failure" as const, label: "실패 공포" },
    { key: "emotional_avoidance" as const, label: "정서적 회피" },
  ];

  return (
    <>
      <div className="text-center">
        <p className="text-[9px] tracking-widest uppercase text-[var(--foreground)]/45 font-semibold">
          TOTAL SCORE
        </p>
        <p className="mt-0.5 text-3xl sm:text-[34px] font-bold text-[var(--foreground)] leading-none tabular-nums">
          {scores.total}
          <span className="text-base text-[var(--foreground)]/40 font-bold ml-1">
            / {TOTAL_MAX}
          </span>
        </p>
        <p className="mt-2 inline-block rounded-full bg-[var(--foreground)] px-2.5 py-0.5 text-[10px] font-semibold text-white tracking-wide">
          LV.{scores.level} · {scores.levelName}
        </p>
      </div>

      <div className="mt-3 h-1 w-full rounded-full bg-[var(--foreground)]/10 overflow-hidden">
        <div
          className="h-full bg-[var(--foreground)]"
          style={{ width: `${totalPct}%` }}
        />
      </div>

      <div className="mt-3 space-y-1.5">
        {DIM_LABELS.map((d) => {
          const v = scores.dimensions[d.key] ?? 0;
          const pct = Math.min(100, Math.round((v / DIM_MAX) * 100));
          return (
            <div key={d.key}>
              <div className="flex items-center justify-between text-[10.5px] text-[var(--foreground)]/65">
                <span className="truncate">{d.label}</span>
                <span className="tabular-nums font-semibold text-[var(--foreground)]">
                  {v}
                </span>
              </div>
              <div className="mt-0.5 h-1 w-full rounded-full bg-[var(--foreground)]/10 overflow-hidden">
                <div
                  className="h-full bg-[var(--foreground)]/85"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ============================================================
 * STEP 03 · 내 안의 마음들 (IFS 파츠 발견)
 *  - 상황 속 여러 마음을 캐릭터로 만나고, 지금 앞에 나선 마음과
 *    서로 부딪치는 마음을 알아본다.
 * ============================================================ */
function Step3InnerParts() {
  return (
    <div className="flex-1 flex flex-col gap-2">
      {/* 지금 가장 앞에 나선 마음 (강조) */}
      <div className="rounded-lg border-2 border-[var(--foreground)] px-2.5 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12.5px] font-bold text-[var(--foreground)]">
            다그치는 나
          </span>
          <span className="flex-shrink-0 rounded-full border border-[var(--foreground)] px-1.5 py-0.5 text-[7.5px] font-bold tracking-[0.1em] text-[var(--foreground)]">
            앞에 나선 마음
          </span>
        </div>
        <p className="mt-1 text-[11px] italic leading-snug text-[var(--foreground)]/70 break-keep">
          &ldquo;이 정도로는 부족해&rdquo;
        </p>
      </div>

      {/* 그 옆의 다른 마음들 */}
      <div className="grid grid-cols-2 gap-1.5">
        {["불안이", "지친 나"].map((n) => (
          <div
            key={n}
            className="rounded-lg border border-[var(--foreground)]/15 px-2 py-1.5 text-center text-[11px] font-semibold text-[var(--foreground)]/80"
          >
            {n}
          </div>
        ))}
      </div>

      {/* 서로 자주 부딪치는 두 마음 */}
      <div className="mt-auto flex items-center gap-1.5 rounded-md bg-[var(--foreground)]/[0.04] px-2.5 py-1.5 text-[10.5px] text-[var(--foreground)]/75">
        <span className="font-semibold">다그치는 나</span>
        <span aria-hidden className="text-[var(--foreground)]/40">
          ↔
        </span>
        <span className="font-semibold">지친 나</span>
        <span className="ml-auto text-[9px] text-[var(--foreground)]/45">
          서로 부딪쳐요
        </span>
      </div>
    </div>
  );
}

/* ============================================================
 * STEP 04 · 핵심 신념 찾기 (자기·타인·세계 3축)
 *  - SCT(문장 완성) 응답을 LLM이 분석해 세 갈래 핵심 신념을 도출.
 * ============================================================ */
function Step4CoreBelief() {
  const AXES = [
    { axis: "자기", en: "SELF", belief: "성과가 없으면 난 가치 없다" },
    { axis: "타인", en: "OTHERS", belief: "사람들은 결과로 나를 본다" },
    { axis: "세계", en: "WORLD", belief: "멈추면 뒤처지는 세상이다" },
  ];
  return (
    <div className="flex-1 flex flex-col gap-1.5">
      {AXES.map((a) => (
        <div
          key={a.en}
          className="rounded-md border border-[var(--foreground)]/12 bg-[var(--foreground)]/[0.02] px-2.5 py-1.5"
        >
          <span className="text-[8.5px] font-bold uppercase tracking-[0.16em] text-[var(--foreground)]/55">
            {a.axis} · {a.en}
          </span>
          <p className="mt-0.5 text-[11.5px] font-semibold text-[var(--foreground)] break-keep leading-tight">
            &ldquo;{a.belief}&rdquo;
          </p>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
 * STEP 05 · 통합 패턴 분석 (인지 Cascade 미니)
 * ============================================================ */
function Step5Cascade() {
  const NODES = [
    { label: "트리거", v: "프로젝트 실패" },
    { label: "자동 사고", v: "또 못했다" },
    { label: "핵심 신념", v: "나는 부족하다" },
  ];
  return (
    <div className="flex-1 grid grid-cols-[28px_1fr] gap-3 min-h-0">
      <div className="relative">
        <div
          className="absolute left-1/2 -translate-x-1/2 w-px bg-[var(--foreground)]/20"
          style={{
            top: `${(0.5 / NODES.length) * 100}%`,
            bottom: `${(0.5 / NODES.length) * 100}%`,
          }}
        />
        {NODES.map((_, i) => {
          const top = ((i + 0.5) / NODES.length) * 100;
          return (
            <span
              key={i}
              className="absolute left-1/2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--foreground)] text-white text-[9px] font-bold tabular-nums"
              style={{ top: `${top}%`, translate: "-50% -50%" }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>
          );
        })}
      </div>
      <ul className="grid grid-rows-3">
        {NODES.map((n, i) => (
          <li key={i} className="flex flex-col justify-center min-h-0">
            <p className="text-[8.5px] tracking-widest uppercase font-bold text-[var(--foreground)]/55">
              {n.label}
            </p>
            <p className="mt-0.5 text-[12px] font-bold text-[var(--foreground)] break-keep leading-tight">
              {n.v}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ============================================================
 * STEP 06 · 대안 자동 사고 (Original → Alternative)
 * ============================================================ */
function Step6Reframing() {
  return (
    <div className="flex-1 grid grid-rows-[1fr_auto_1fr] gap-1.5">
      <div className="rounded-lg border-2 border-dashed border-[var(--foreground)]/22 px-3 py-2 flex items-center">
        <div>
          <p className="text-[8px] uppercase tracking-widest font-bold text-[var(--foreground)]/40">
            ORIGINAL
          </p>
          <p className="mt-1 text-[12px] text-[var(--foreground)]/55 break-keep leading-snug">
            또 망쳤다.
            <br />
            나는 안 돼.
          </p>
        </div>
      </div>
      <div className="text-center text-[var(--foreground)]/35 text-[11px] leading-none">
        ↓
      </div>
      <div className="rounded-lg bg-[var(--foreground)] text-white px-3 py-2 flex items-center">
        <div>
          <p className="text-[8px] uppercase tracking-widest font-bold text-white/55">
            ALTERNATIVE
          </p>
          <p className="mt-1 text-[12px] font-semibold break-keep leading-snug">
            이번엔 안 됐지만
            <br />
            다음엔 다를 수 있어.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * STEP 07 · 새 핵심 신념 (큰 인용)
 * ============================================================ */
function Step7NewBelief() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-1">
      <span
        aria-hidden
        className="text-3xl leading-none text-[var(--foreground)]/40"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        &ldquo;
      </span>
      <p className="mt-1 text-[15px] sm:text-base font-bold text-[var(--foreground)] break-keep leading-[1.4]">
        나는 성과 없이도
        <br />
        충분히 가치 있는
        <br />
        사람이다.
      </p>
      <p className="mt-3 text-[8.5px] tracking-[0.22em] uppercase font-bold text-[var(--foreground)]/40">
        New Core Belief
      </p>
    </div>
  );
}

/* ============================================================
 * STEP 08 · 근거 모으기 (신념 + 근거 카드 + 강도)
 * ============================================================ */
function Step8Evidence() {
  return (
    <>
      <div className="rounded-md bg-[var(--foreground)] text-white px-2.5 py-1.5">
        <p className="text-[8px] tracking-widest uppercase text-white/55 font-bold">
          새 신념
        </p>
        <p className="mt-0.5 text-[12px] font-bold break-keep">
          &ldquo;나는 쉴 권리가 있다&rdquo;
        </p>
      </div>

      <ul className="mt-2.5 space-y-1.5 flex-1 min-h-0">
        {[
          "어제 1시간 산책했다",
          "휴식 후 더 집중됐다",
          "친구가 부럽다고 했다",
        ].map((c, i) => (
          <li
            key={i}
            className="flex items-start gap-2 rounded border border-[var(--foreground)]/10 px-2 py-1.5"
          >
            <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-[var(--foreground)] flex-shrink-0" />
            <span className="text-[11px] text-[var(--foreground)]/85 break-keep leading-snug">
              {c}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-2 flex items-center justify-between">
        <span className="text-[9px] tracking-widest uppercase font-bold text-[var(--foreground)]/45">
          강도
        </span>
        <span className="flex gap-0.5 text-[12px] tracking-tight">
          {[1, 2, 3, 4].map((n) => (
            <span key={n} className="text-[var(--foreground)]">
              ★
            </span>
          ))}
          <span className="text-[var(--foreground)]/15">★</span>
        </span>
      </div>
    </>
  );
}

/* ============================================================
 * STEP 09 · 종합 가이드 리포트 (DO + 어퍼메이션)
 * ============================================================ */
function Step9DailyAction() {
  return (
    <>
      <p className="text-[12.5px] font-bold text-[var(--foreground)] break-keep leading-tight">
        다음 한 달,
        <br />
        이렇게 살아보세요.
      </p>

      <ul className="mt-2.5 space-y-1.5 flex-1 min-h-0">
        {[
          { num: "01", t: "성장 일지 쓰기" },
          { num: "02", t: "연결되는 시간 갖기" },
          { num: "03", t: "80% 버전 공유하기" },
        ].map((it) => (
          <li key={it.num} className="flex items-center gap-2 text-[11px]">
            <span className="text-[9px] tabular-nums font-mono text-[var(--foreground)]/40">
              {it.num}
            </span>
            <span className="flex-1 text-[var(--foreground)]/85 break-keep">
              {it.t}
            </span>
            <span
              aria-hidden
              className="inline-flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--foreground)] text-white"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={4}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-2 w-2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto rounded border border-[var(--foreground)]/12 bg-[var(--foreground)]/[0.02] px-2.5 py-2">
        <p className="text-[8px] tracking-widest uppercase font-bold text-[var(--foreground)]/40">
          AFFIRMATION
        </p>
        <p
          className="mt-0.5 text-[11.5px] font-semibold text-[var(--foreground)]/85 break-keep"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          &ldquo;나는 충분하다.&rdquo;
        </p>
      </div>
    </>
  );
}

/* ============================================================
 * STEP 10 · 마무리 성찰 (다짐 글)
 * ============================================================ */
function Step10Reflection() {
  return (
    <>
      <p className="text-[10px] tracking-widest uppercase font-bold text-[var(--foreground)]/45">
        Reflection
      </p>
      <p className="mt-1 text-[12px] text-[var(--foreground)]/70 break-keep leading-relaxed">
        워크북을 마치며,
        <br />
        나에게 남기는 한 마디.
      </p>

      <div className="mt-3 flex-1 rounded-md border border-[var(--foreground)]/12 bg-[var(--foreground)]/[0.02] p-3 flex flex-col">
        <p
          className="text-[11.5px] text-[var(--foreground)]/85 break-keep leading-[1.7]"
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontStyle: "italic",
          }}
        >
          쉬는 것은 게으름이 아니라
          <br />
          내일을 위한 준비라는 것을
          <br />
          이제는 안다.
        </p>
        <p className="mt-auto text-[9px] tracking-wider text-[var(--foreground)]/40 text-right">
          — 2026.05.01
        </p>
      </div>
    </>
  );
}
