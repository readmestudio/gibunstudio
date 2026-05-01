"use client";

import { motion } from "framer-motion";
import { THERAPY_COMPARISON_ROWS } from "./content";

/**
 * [03] 상담 vs 워크북 비교 — 좌우 카드 대비
 *
 * 좌측: 일반 상담 (흐린 톤, X 마커)
 * 우측: 마음 챙김 워크북 (검정 fill + 흰 글자, ✓ 마커) — 시각적 강조
 * 사이: 화살표 (모바일↓ / 데스크톱→)
 */
export function StoreTherapyCompareSection() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-20">
      <p className="text-center text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-3">
        THERAPY VS WORKBOOK
      </p>
      <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold text-[var(--foreground)] break-keep leading-[1.3]">
        상담의 장점은 그대로,
        <br className="sm:hidden" /> 단점만 덜어냈습니다
      </h2>
      <p className="mt-4 text-center text-sm sm:text-base text-[var(--foreground)]/60 max-w-xl mx-auto break-keep">
        1:1 심리 상담에서 오는 부담은 최소화하고, 효용은 극대화했습니다.
      </p>

      {/* 좌·우 카드 비교 */}
      <div className="mt-14 sm:mt-16 grid gap-5 sm:gap-0 sm:grid-cols-[1fr_auto_1fr] items-stretch">
        {/* 좌측 — 일반 상담 (Before) */}
        <ComparisonCard
          eyebrow="지금까지"
          title="일반 상담"
          isPositive={false}
          rows={THERAPY_COMPARISON_ROWS.map((r) => ({
            label: r.label,
            value: r.therapy,
          }))}
          delay={0}
        />

        {/* 사이 화살표 */}
        <div className="flex items-center justify-center sm:px-3 md:px-5">
          <ArrowMark />
        </div>

        {/* 우측 — 마음 챙김 워크북 (After, 강조) */}
        <ComparisonCard
          eyebrow="마음 챙김 워크북과 함께"
          title="마음 챙김 워크북"
          isPositive
          rows={THERAPY_COMPARISON_ROWS.map((r) => ({
            label: r.label,
            value: r.workbook,
          }))}
          delay={0.2}
        />
      </div>
    </section>
  );
}

/* ── 좌/우 비교 카드 ── */
function ComparisonCard({
  eyebrow,
  title,
  isPositive,
  rows,
  delay,
}: {
  eyebrow: string;
  title: string;
  isPositive: boolean;
  rows: { label: string; value: string }[];
  delay: number;
}) {
  return (
    <motion.div
      className={`relative rounded-2xl p-7 sm:p-8 md:p-9 h-full flex flex-col ${
        isPositive
          ? "bg-[var(--foreground)] text-white shadow-[6px_6px_0_var(--foreground)]"
          : "bg-white border-2 border-[var(--foreground)]/12"
      }`}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, delay, ease: "easeOut" }}
    >
      {/* 헤더 */}
      <p
        className={`text-[10px] sm:text-xs font-semibold tracking-widest uppercase ${
          isPositive ? "text-white/55" : "text-[var(--foreground)]/40"
        }`}
      >
        {eyebrow}
      </p>
      <h3
        className={`mt-2 text-xl sm:text-2xl md:text-[26px] font-bold leading-tight break-keep ${
          isPositive ? "text-white" : "text-[var(--foreground)]/55"
        }`}
      >
        {title}
      </h3>

      {/* 구분선 */}
      <div
        className={`mt-6 mb-6 sm:mt-7 sm:mb-7 h-px ${
          isPositive ? "bg-white/15" : "bg-[var(--foreground)]/10"
        }`}
      />

      {/* 항목 리스트 */}
      <ul className="space-y-4 sm:space-y-5">
        {rows.map((row) => (
          <li key={row.label} className="flex items-start gap-3 sm:gap-4">
            <Marker positive={isPositive} />
            <p
              className={`flex-1 min-w-0 text-base sm:text-lg font-semibold leading-relaxed break-keep ${
                isPositive ? "text-white" : "text-[var(--foreground)]/65"
              }`}
            >
              {row.value}
            </p>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

/* ── X / ✓ 마커 ── */
function Marker({ positive }: { positive: boolean }) {
  if (positive) {
    return (
      <span
        aria-hidden
        className="mt-0.5 inline-flex h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0 items-center justify-center rounded-full bg-white text-[var(--foreground)]"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5 sm:h-4 sm:w-4"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    );
  }
  return (
    <span
      aria-hidden
      className="mt-0.5 inline-flex h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0 items-center justify-center rounded-full border-2 border-[var(--foreground)]/20 text-[var(--foreground)]/40"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3 w-3 sm:h-3.5 sm:w-3.5"
      >
        <line x1="6" y1="6" x2="18" y2="18" />
        <line x1="18" y1="6" x2="6" y2="18" />
      </svg>
    </span>
  );
}

/* ── 두 카드 사이 화살표 ── */
function ArrowMark() {
  return (
    <div className="rotate-90 sm:rotate-0 text-white">
      <motion.span
        className="inline-flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[var(--foreground)]"
        animate={{ x: [0, 4, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </motion.span>
    </div>
  );
}
