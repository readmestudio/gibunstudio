"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/**
 * 워크북 미리보기 슬라이드쇼 (HERO 우측)
 *
 * 실제 워크북 이미지는 아직 제작 중이라, 각 슬라이드에 `src`를 지정하지 않으면
 * 종이 느낌의 플레이스홀더 카드가 표시된다. 이미지가 준비되면 아래 SLIDES 배열에
 * `src: "/workbook-preview/..."` 를 추가하기만 하면 자동으로 교체된다.
 */

interface WorkbookSlide {
  step: string;
  title: string;
  description: string;
  /** 실제 이미지 파일 경로. 지정 시 플레이스홀더 대신 이미지가 렌더된다. */
  src?: string;
}

const SLIDES: WorkbookSlide[] = [
  {
    step: "STEP 01",
    title: "진단 테스트",
    description: "20문항 자가 진단으로 나의 성취 중독 레벨을 확인합니다.",
  },
  {
    step: "STEP 02",
    title: "분석 리포트",
    description: "진단 결과를 기반으로 한 심층 해석과 패턴 분석.",
  },
  {
    step: "STEP 03",
    title: "심리학 기반 실습",
    description: "CBT · 라이팅 테라피로 자동적 사고를 전환합니다.",
  },
  {
    step: "STEP 04",
    title: "실전 DO&DON'T",
    description: "직장 생활에서 바로 쓰는 체크리스트.",
  },
];

const AUTOPLAY_MS = 4500;

export function WorkbookSlideshow() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () => setIdx((i) => (i + 1) % SLIDES.length),
      AUTOPLAY_MS
    );
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 슬라이드 뷰포트 */}
      <div className="relative w-full max-w-[320px] md:max-w-[420px] aspect-square overflow-hidden rounded-2xl border-2 border-[var(--foreground)]/15 bg-white">
        {SLIDES.map((slide, i) => (
          <div
            key={slide.title}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === idx ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
            aria-hidden={i !== idx}
          >
            {slide.src ? (
              <Image
                src={slide.src}
                alt={slide.title}
                fill
                sizes="(max-width: 768px) 320px, 420px"
                className="object-cover"
                priority={i === 0}
              />
            ) : (
              <WorkbookPlaceholder
                step={slide.step}
                title={slide.title}
                description={slide.description}
              />
            )}
          </div>
        ))}
      </div>

      {/* 인디케이터 */}
      <div className="flex items-center gap-2" role="tablist" aria-label="워크북 슬라이드">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.title}
            type="button"
            role="tab"
            aria-selected={i === idx}
            aria-label={`${i + 1}번째 슬라이드: ${slide.title}`}
            onClick={() => setIdx(i)}
            className={`h-2 rounded-full transition-all ${
              i === idx
                ? "w-6 bg-[var(--foreground)]"
                : "w-2 bg-[var(--foreground)]/25 hover:bg-[var(--foreground)]/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

/* ── 플레이스홀더: 실제 이미지 준비 전까지 노출 ── */

function WorkbookPlaceholder({
  step,
  title,
  description,
}: {
  step: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex h-full w-full flex-col p-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-[var(--foreground)]/10 pb-3 mb-6">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-[var(--foreground)]/40">
          {step}
        </p>
        <span className="inline-block w-8 h-1 bg-[var(--foreground)]/20 rounded" />
      </div>

      {/* 중앙 콘텐츠 */}
      <div className="flex-1 flex flex-col justify-center">
        <h3
          className="text-xl sm:text-2xl font-bold text-[var(--foreground)] mb-3 break-keep"
        >
          {title}
        </h3>
        <p className="text-xs text-[var(--foreground)]/50 leading-relaxed break-keep mb-6">
          {description}
        </p>

        {/* 워크북 라인 (글 적힌 느낌) */}
        <div className="space-y-2">
          <div className="h-2 rounded bg-[var(--foreground)]/10 w-full" />
          <div className="h-2 rounded bg-[var(--foreground)]/10 w-5/6" />
          <div className="h-2 rounded bg-[var(--foreground)]/10 w-4/6" />
        </div>
      </div>

      {/* 플레이스홀더 표식 */}
      <p className="mt-6 text-[10px] text-[var(--foreground)]/30 text-center">
        미리보기 이미지 준비 중
      </p>
    </div>
  );
}
