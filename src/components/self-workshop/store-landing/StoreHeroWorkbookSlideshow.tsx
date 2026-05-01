"use client";

import { Fragment } from "react";
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
  /** 단계 한 줄 설명 — 원본 이미지의 본문 큰 헤드라인을 통일 헤더로 덮을 때 사용 */
  description: string;
  /** 실제 페이지 스크린샷 경로 — 있으면 미니어처 대신 이미지 렌더 */
  src?: string;
}

const REPORT_SLIDES: ReportSlide[] = [
  {
    number: "01",
    title: "자가 진단",
    badge: "LIKERT",
    description: "Likert 5점 척도 20문항 검사",
    src: "/workbook-preview/01.png",
  },
  {
    number: "02",
    title: "진단 결과",
    badge: "DIAGNOSIS",
    description: "4영역 위험군 + 총점 분석",
    src: "/workbook-preview/02.png",
  },
  {
    number: "03",
    title: "메커니즘 실습",
    badge: "5-PART",
    description: "상황·감정·생각·행동·신체 5축 추적",
    src: "/workbook-preview/03.png",
  },
  {
    number: "04",
    title: "핵심 신념 찾기",
    badge: "DOWNWARD",
    description: "하향 화살표 문답으로 깊이 파고들기",
    src: "/workbook-preview/04.png",
  },
  {
    number: "05",
    title: "통합 패턴 분석",
    badge: "CASCADE",
    description: "1-2초 사이 일어난 인지 Cascade",
    src: "/workbook-preview/05.png",
  },
  {
    number: "06",
    title: "대안 자동 사고",
    badge: "REFRAMING",
    description: "같은 상황, 다른 사고 시뮬레이션",
    src: "/workbook-preview/06.png",
  },
  {
    number: "07",
    title: "새 핵심 신념",
    badge: "NEW BELIEF",
    description: "세 가지 신념을 다시 보기",
    src: "/workbook-preview/07.png",
  },
  {
    number: "08",
    title: "근거 모으기",
    badge: "EVIDENCE",
    description: "새 신념을 떠받칠 작은 증거들",
    src: "/workbook-preview/08.png",
  },
  {
    number: "09",
    title: "종합 가이드 리포트",
    badge: "DAILY",
    description: "한 달 동안의 DO & DON'T 가이드",
    src: "/workbook-preview/09.png",
  },
  {
    number: "10",
    title: "마무리 성찰",
    badge: "REFLECTION",
    description: "워크북 완성, 나에게 한 마디",
    src: "/workbook-preview/10.png",
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
  // 실제 스크린샷이 있으면 이미지 카드 — 카드 위에 통일 헤더를 띄워서 각 이미지의
  // 큰 숫자/제목 영역을 가린다. 결과적으로 *모든 카드가 동일한 헤더 위계* 를 갖게 됨.
  if (slide.src) {
    return (
      <div className="relative flex-shrink-0 w-[300px] sm:w-[360px] aspect-[3/4] overflow-hidden rounded-2xl border-2 border-[var(--foreground)]/12 bg-white shadow-[3px_3px_0_rgba(0,0,0,0.06)]">
        {/* 이미지 wrapper — 헤더 영역(top 180px) 만큼 띄우고, 좌우/하단에 흰 여백
            패딩을 줘서 카드 가장자리에 본문이 붙지 않도록 통일. */}
        <div className="absolute inset-0 px-6 sm:px-7 pt-[180px] pb-6 sm:pb-7">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.src}
            alt={`STEP ${slide.number} · ${slide.title} 실제 페이지`}
            className="h-full w-full object-cover object-top"
            loading="lazy"
            draggable={false}
          />
        </div>

        {/* 통일 헤더 — 영역 더 크게: STEP 라벨 + 큰 단계명 + 한 줄 설명까지 포함.
            원본 이미지의 큰 숫자 + 본문 큰 헤드라인 영역을 모두 가려서, 카드마다
            제각각인 위계를 *완전히 통일* 시킨다. */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-white px-6 sm:px-7 pt-6 sm:pt-7 pb-5">
          <div className="flex items-center justify-between border-b border-[var(--foreground)]/10 pb-3">
            <p className="text-[10px] sm:text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--foreground)]/55">
              STEP {slide.number}
            </p>
            <p className="text-[9px] tracking-[0.18em] uppercase text-[var(--foreground)]/30 font-semibold">
              {slide.badge}
            </p>
          </div>
          {/* 큰 단계명 헤드라인 — 모든 카드가 동일 위계 */}
          <h4 className="mt-4 text-lg sm:text-xl font-bold text-[var(--foreground)] break-keep leading-[1.3]">
            {slide.title}
          </h4>
          {/* 한 줄 설명 — 헤더 영역을 자연스럽게 채워서 본문 큰 헤드라인까지 가림 */}
          <p className="mt-2 text-[11px] sm:text-xs leading-[1.55] text-[var(--foreground)]/55 break-keep">
            {slide.description}
          </p>
        </div>
      </div>
    );
  }

  // 스크린샷이 없는 단계는 미니어처 fallback
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

      {/* 제목 */}
      <h4 className="mt-3.5 text-base sm:text-lg font-bold text-[var(--foreground)] break-keep leading-tight">
        {slide.title}
      </h4>

      {/* 단계별 콘텐츠 */}
      <div className="mt-4 flex-1 min-h-0 flex flex-col">
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
      return <Step3Mechanism />;
    case "04":
      return <Step4DownwardArrow />;
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
 * STEP 03 · 메커니즘 실습 (5-Part 모델)
 * ============================================================ */
function Step3Mechanism() {
  const PARTS = [
    { label: "상황", v: "팀장이 보고서를 다시 쓰라 함" },
    { label: "사고", v: "또 못했다. 나는 무능해" },
    { label: "감정", v: "수치심 · 무력감" },
    { label: "행동", v: "주말 출근해 처음부터" },
    { label: "신체", v: "두통 · 불면" },
  ];
  return (
    <ul className="space-y-1.5">
      {PARTS.map((p) => (
        <li key={p.label} className="flex items-start gap-2">
          <span className="flex-shrink-0 inline-flex h-5 w-12 items-center justify-center rounded text-[8.5px] font-bold uppercase tracking-wide bg-[var(--foreground)]/[0.06] text-[var(--foreground)]/65">
            {p.label}
          </span>
          <p className="text-[11.5px] leading-snug text-[var(--foreground)]/85 break-keep">
            {p.v}
          </p>
        </li>
      ))}
    </ul>
  );
}

/* ============================================================
 * STEP 04 · 핵심 신념 찾기 (하향 화살표 기법)
 * ============================================================ */
function Step4DownwardArrow() {
  const STAIRS = [
    { q: "그게 왜 의미 있나요?", a: "나는 능력이 부족하다" },
    { q: "그게 사실이라면?", a: "나는 사랑받을 수 없다" },
    { q: "결국 어떤 의미?", a: "나는 충분하지 않다" },
  ];
  return (
    <div className="flex-1 flex flex-col gap-1.5">
      {STAIRS.map((s, i) => (
        <Fragment key={i}>
          <div className="rounded-md border border-[var(--foreground)]/12 bg-[var(--foreground)]/[0.02] px-2.5 py-1.5">
            <p className="text-[8.5px] text-[var(--foreground)]/45 italic">
              {s.q}
            </p>
            <p className="mt-0.5 text-[11.5px] font-semibold text-[var(--foreground)] break-keep leading-tight">
              {s.a}
            </p>
          </div>
          {i < STAIRS.length - 1 && (
            <div className="text-center text-[var(--foreground)]/35 text-[11px] leading-none">
              ↓
            </div>
          )}
        </Fragment>
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
