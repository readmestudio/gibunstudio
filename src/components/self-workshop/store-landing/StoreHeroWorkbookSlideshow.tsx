"use client";

import { motion } from "framer-motion";

/**
 * 히어로 영역 워크북 이미지 슬라이드쇼 (placeholder).
 *
 * 가로로 끊김 없이 흐르는 마퀴 스타일 모션.
 * 실제 워크북 페이지 이미지가 준비되면 PLACEHOLDER_SLIDES의 각 항목에
 * `src`를 추가하면 그대로 교체됨 (현재는 종이 느낌 placeholder만 표시).
 */

interface HeroSlide {
  step: string;
  title: string;
  /** 실제 이미지 파일 경로. 지정 시 플레이스홀더 대신 이미지가 렌더된다. */
  src?: string;
}

const PLACEHOLDER_SLIDES: HeroSlide[] = [
  { step: "STEP 01", title: "진단 테스트" },
  { step: "STEP 02", title: "분석 리포트" },
  { step: "STEP 03", title: "패턴 찾기" },
  { step: "STEP 04", title: "인지 오류 분석" },
  { step: "STEP 05", title: "핵심 믿음" },
  { step: "STEP 06", title: "대처 계획" },
  { step: "STEP 07", title: "요약 리포트" },
  { step: "STEP 08", title: "마무리 성찰" },
];

/** 한 바퀴 이동에 걸리는 시간(초). 값이 클수록 천천히 흐름. */
const LOOP_DURATION_SEC = 40;

export function StoreHeroWorkbookSlideshow() {
  // 끊김 없는 무한 루프를 위해 슬라이드 배열을 두 번 이어붙임.
  const doubled = [...PLACEHOLDER_SLIDES, ...PLACEHOLDER_SLIDES];

  return (
    <div
      className="mt-10 relative w-full overflow-hidden"
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
      }}
      aria-label="워크북 페이지 미리보기"
    >
      <motion.div
        className="flex gap-5 w-max"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: LOOP_DURATION_SEC,
          ease: "linear",
          repeat: Infinity,
        }}
      >
        {doubled.map((slide, i) => (
          <SlideCard key={i} slide={slide} />
        ))}
      </motion.div>
    </div>
  );
}

/* ── 슬라이드 카드 (placeholder) ── */

function SlideCard({ slide }: { slide: HeroSlide }) {
  return (
    <div className="flex-shrink-0 w-[180px] sm:w-[200px] aspect-[3/4] rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-5 shadow-[2px_2px_0_rgba(0,0,0,0.04)]">
      {/* 상단 kicker */}
      <div className="flex items-center justify-between border-b border-[var(--foreground)]/10 pb-2.5">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-[var(--foreground)]/45">
          {slide.step}
        </p>
        <span className="inline-block h-1 w-5 rounded bg-[var(--foreground)]/15" />
      </div>

      {/* 제목 */}
      <h4 className="mt-4 text-sm sm:text-base font-bold text-[var(--foreground)] break-keep leading-snug">
        {slide.title}
      </h4>

      {/* 본문 라인(글 적힌 느낌) */}
      <div className="mt-4 space-y-1.5">
        <div className="h-1.5 rounded bg-[var(--foreground)]/10 w-full" />
        <div className="h-1.5 rounded bg-[var(--foreground)]/10 w-[85%]" />
        <div className="h-1.5 rounded bg-[var(--foreground)]/10 w-[70%]" />
        <div className="h-1.5 rounded bg-[var(--foreground)]/10 w-[90%]" />
        <div className="h-1.5 rounded bg-[var(--foreground)]/10 w-[55%]" />
      </div>

      {/* 플레이스홀더 표식 */}
      <p className="mt-5 text-[9px] text-[var(--foreground)]/30 text-center tracking-wider">
        PREVIEW
      </p>
    </div>
  );
}
