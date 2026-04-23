import { WORKSHOP_COMPARISON } from "@/lib/self-workshop/landing-data";

/**
 * 일반 심리 검사 vs 워크북 비교 섹션
 *
 * 좌우 2카드 비교 — 일반 검사(흐린 톤) vs 워크북(강조 톤).
 * "진단에서 끝나지 않는다"는 차별점을 명확히 전달.
 */
export function WorkshopComparisonSection() {
  return (
    <section className="py-16">
      <p className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-3 text-center">
        VS
      </p>
      <h2
        className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] text-center mb-3"
        style={{ wordBreak: "keep-all" }}
      >
        일반 심리 검사와 무엇이 다른가요?
      </h2>
      <p className="text-sm text-[var(--foreground)]/60 text-center mb-10 max-w-md mx-auto break-keep">
        진단에서 끝나지 않고, 실전까지 이어집니다.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 좌측: 일반 심리 검사 (dim) */}
        <div className="rounded-2xl border-2 border-[var(--foreground)]/15 bg-[var(--surface)] p-6 opacity-80">
          <p className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-2">
            GENERAL
          </p>
          <h3 className="text-lg font-bold text-[var(--foreground)]/70 mb-2">
            {WORKSHOP_COMPARISON.standard.label}
          </h3>
          <p className="text-sm font-semibold text-[var(--foreground)]/60 mb-5">
            {WORKSHOP_COMPARISON.standard.summary}
          </p>
          <ul className="space-y-2.5">
            {WORKSHOP_COMPARISON.standard.points.map((point) => (
              <li
                key={point}
                className="flex items-start gap-2 text-sm text-[var(--foreground)]/60 break-keep"
              >
                <span aria-hidden className="mt-0.5 text-[var(--foreground)]/40">
                  ✕
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 우측: 워크북 (강조) */}
        <div className="rounded-2xl border-2 border-[var(--foreground)] bg-white p-6 shadow-[4px_4px_0_var(--foreground)]">
          <p className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)] mb-2">
            WORKBOOK
          </p>
          <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
            {WORKSHOP_COMPARISON.workbook.label}
          </h3>
          <p className="text-sm font-semibold text-[var(--foreground)] mb-5">
            {WORKSHOP_COMPARISON.workbook.summary}
          </p>
          <ul className="space-y-2.5">
            {WORKSHOP_COMPARISON.workbook.points.map((point) => (
              <li
                key={point}
                className="flex items-start gap-2 text-sm text-[var(--foreground)]/80 break-keep"
              >
                <span
                  aria-hidden
                  className="mt-0.5 text-[var(--foreground)] font-bold"
                >
                  ✓
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
