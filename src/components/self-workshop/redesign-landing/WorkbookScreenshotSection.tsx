"use client";

import { motion } from "framer-motion";
import Image from "next/image";

/**
 * WorkbookScreenshotSection — 실제 워크북 페이지 스크린샷 쇼케이스.
 *
 * 기존 StoreHeroWorkbookSlideshow(코드 미니어처)와 달리, 실제 제품 화면을
 * 캡처한 스크린샷을 가로 마퀴로 흘려보낸다. 카드마다 *상단에 동일한 헤더
 * (PREVIEW NN · 영문 뱃지 · 한국어 타이틀 · 한 줄 설명)* 를 얹어, 안의
 * 스크린샷은 제각각이어도 전체가 하나의 일관된 템플릿처럼 보이게 한다.
 *
 * - 위쪽: 메인/서브 카피 (lr-* 헤더 스타일)
 * - 가운데: 스크린샷 카드 무한 마퀴
 * - 아래쪽: "예시 이미지 — 상담 주제에 따라 달라질 수 있음" 캡션
 */

interface PreviewSlide {
  /** /public 기준 이미지 경로 */
  src: string;
  /** 카드 상단 영문 뱃지 (우측) */
  badge: string;
  /** 카드 상단 한국어 타이틀 */
  title: string;
  /** 타이틀 아래 한 줄 설명 */
  description: string;
  /** 어두운 배경 스크린샷 여부 — 하단 페이드 색을 맞춘다 */
  dark?: boolean;
  /** 좌우 여백을 더 줘 화면 전체 폭이 잘리지 않게 보여줄지 (contain 맞춤) */
  padded?: boolean;
}

const PREVIEW_SLIDES: PreviewSlide[] = [
  {
    src: "/images/workbook-preview/01-self-test.png",
    badge: "SELF TEST",
    title: "자가 진단 테스트",
    description: "Likert 5점 척도로 지금의 나를 측정",
  },
  {
    src: "/images/workbook-preview/02-diagnosis.png",
    badge: "DIAGNOSIS",
    title: "진단 결과 리포트",
    description: "4영역 위험군 + 총점 분석",
  },
  {
    src: "/images/workbook-preview/03-loop.png",
    badge: "THE LOOP",
    title: "닫힌 고리의 작동 원리",
    description: "트리거 → 자동사고 → 행동 → 핵심 믿음",
    dark: true,
  },
  {
    src: "/images/workbook-preview/05-inner-parts.png",
    badge: "WHO YOU MET",
    title: "내가 만난 마음",
    description: "발견한 마음 파츠를 정리한 리포트",
  },
  {
    src: "/images/workbook-preview/06-core-wish.png",
    badge: "CORE WISH",
    title: "그 마음이 바란 것",
    description: "반응 뒤에 숨어 있던 긍정적 의도 찾기",
  },
  {
    src: "/images/workbook-preview/07-core-belief.png",
    badge: "CORE BELIEF",
    title: "핵심 신념 고르기",
    description: "익숙한 자동사고를 직접 골라보기",
    padded: true,
  },
  {
    src: "/images/workbook-preview/08-keywords.png",
    badge: "KEYWORDS",
    title: "세 가지 키워드로 응축",
    description: "응답 전체를 관통하는 신념의 골조",
  },
  {
    src: "/images/workbook-preview/09-cascade.png",
    badge: "CASCADE",
    title: "1–2초의 인지 흐름",
    description: "순간에 일어난 사고 회로 추적",
  },
  {
    src: "/images/workbook-preview/10-cascade-timeline.png",
    badge: "CASCADE",
    title: "자동사고 도미노",
    description: "트리거에서 신념까지 한 단계씩",
  },
  {
    src: "/images/workbook-preview/11-cycle.png",
    badge: "THE CYCLE",
    title: "순환하는 여섯 노드",
    description: "스스로 회로처럼 반복되는 고리",
    dark: true,
  },
  {
    src: "/images/workbook-preview/12-distortions.png",
    badge: "DISTORTIONS",
    title: "동시에 작동하는 인지 왜곡",
    description: "재앙화·흑백사고 등 5가지 왜곡",
  },
  {
    src: "/images/workbook-preview/13-reshape.png",
    badge: "RESHAPE",
    title: "새 신념 다시 빚기",
    description: "다음 챕터에서 손대어 볼 것들",
  },
];

const LOOP_DURATION_SEC = 90;

/* ── 스크린샷 카드 무한 마퀴 + 예시 캡션 (재사용 단위) ── */
function WorkbookScreenshotMarquee({ topMargin }: { topMargin: string }) {
  // 끊김 없는 무한 루프를 위해 카드 배열을 2배로 이어 붙인다.
  const doubled = [...PREVIEW_SLIDES, ...PREVIEW_SLIDES];

  return (
    <>
      {/* 스크린샷 마퀴 — 양 끝을 부드럽게 페이드 처리 */}
      <div
        className={`${topMargin} relative w-full overflow-hidden`}
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
        }}
        aria-label="워크북 실제 화면 미리보기"
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
            <PreviewCard key={`${slide.src}-${i}`} slide={slide} />
          ))}
        </motion.div>
      </div>

      {/* 예시 이미지 안내 캡션 */}
      <div className="lr-wrap-5">
        <p className="mt-8 text-center text-[12px] sm:text-[12.5px] leading-relaxed text-[var(--foreground)]/45 break-keep">
          * 예시 이미지입니다. 실제 화면 구성과 내용은
          <br className="sm:hidden" />
          {" "}선택한 상담 주제에 따라 달라질 수 있어요.
        </p>
      </div>
    </>
  );
}

/**
 * 카피 헤더 + 스크린샷 마퀴 (페이지 상단 도입부용).
 */
export function WorkbookScreenshotSection() {
  return (
    <section className="lr-section" id="preview">
      <div className="lr-wrap-5">
        <div className="lr-s-header">
          <span className="lr-eyebrow lr-f-up">
            <span className="lr-dot" />
            WORKBOOK PREVIEW
          </span>
          <h2 className="lr-f-up lr-d1">
            명상은 어렵고,
            <br />
            <em>심리 상담은 부담스러워요</em>
          </h2>
          <p className="lr-lede lr-f-up lr-d2">
            이런 분들을 위해 만든 심리 상담 워크북을 소개합니다
          </p>
        </div>
      </div>
      <WorkbookScreenshotMarquee topMargin="mt-12 sm:mt-14" />
    </section>
  );
}

/**
 * 카피 헤더 없이 스크린샷 마퀴만 보여주는 스트립 (페이지 중간 재노출용).
 * 코드 미니어처 슬라이드쇼를 대체한다.
 */
export function WorkbookScreenshotStrip() {
  return (
    <section className="lr-section-sm">
      <WorkbookScreenshotMarquee topMargin="" />
    </section>
  );
}

/* ── 스크린샷 카드: 상단 동일 헤더 + 실제 화면 ── */
function PreviewCard({ slide }: { slide: PreviewSlide }) {
  return (
    <article className="flex-shrink-0 w-[280px] sm:w-[330px] overflow-hidden rounded-2xl border-2 border-[var(--foreground)]/12 bg-white shadow-[3px_3px_0_rgba(0,0,0,0.06)] flex flex-col">
      {/* 동일 템플릿 헤더 */}
      <div className="px-5 pt-5 pb-3.5 border-b border-[var(--foreground)]/10">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--foreground)]/55">
            PREVIEW
          </span>
          <span className="text-[9px] tracking-[0.18em] uppercase text-[var(--foreground)]/30 font-semibold">
            {slide.badge}
          </span>
        </div>
        <h4 className="mt-2.5 text-[15px] sm:text-base font-bold text-[var(--foreground)] break-keep leading-tight">
          {slide.title}
        </h4>
        <p className="mt-1 text-[10.5px] sm:text-[11px] leading-snug text-[var(--foreground)]/50 break-keep">
          {slide.description}
        </p>
      </div>

      {/* 실제 화면 — 상단 정렬로 채우고, 하단은 페이드로 '더 이어지는 페이지' 느낌 */}
      <div
        className={`relative h-[300px] sm:h-[340px] overflow-hidden ${
          slide.dark ? "bg-[#161412]" : "bg-[var(--foreground)]/[0.015]"
        }`}
      >
        <div className={`absolute inset-0 ${slide.padded ? "px-4 sm:px-5" : ""}`}>
          <Image
            src={slide.src}
            alt={`${slide.title} 화면 미리보기`}
            fill
            sizes="(max-width: 640px) 280px, 330px"
            className={
              slide.padded
                ? "object-contain object-top"
                : "object-cover object-top"
            }
          />
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-14"
          style={{
            background: slide.dark
              ? "linear-gradient(to top, #161412, transparent)"
              : "linear-gradient(to top, #ffffff, transparent)",
          }}
        />
      </div>
    </article>
  );
}
