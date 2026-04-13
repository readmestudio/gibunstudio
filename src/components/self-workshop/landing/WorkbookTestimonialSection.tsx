import {
  WORKBOOK_STATS,
  FEATURED_REVIEW,
  WORKBOOK_REVIEWS,
} from "@/lib/self-workshop/landing-data";

export function WorkbookTestimonialSection() {
  return (
    <section className="py-16">
      {/* 타이틀 */}
      <p className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-3 text-center">
        REVIEW
      </p>
      <h2
        className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] text-center mb-2"
        style={{ wordBreak: "keep-all" }}
      >
        먼저 패턴을 발견한 분들
      </h2>
      <p className="text-base text-[var(--foreground)]/60 text-center mb-10">
        워크북을 마친 분들의 실제 후기입니다
      </p>

      {/* 통계 배너 */}
      <div className="grid grid-cols-2 gap-3 mb-12">
        {WORKBOOK_STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-[var(--border)] p-4 text-center"
          >
            <p className="text-xl sm:text-2xl font-bold text-[var(--foreground)] mb-1">
              {s.value}
            </p>
            <p className="text-xs text-[var(--foreground)]/50">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 피처드 후기 */}
      <div
        className="rounded-2xl bg-[var(--foreground)] text-white p-6 sm:p-8 mb-8"
        style={{ wordBreak: "keep-all" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm">★★★★★</span>
          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-white/20">
            {FEATURED_REVIEW.badge}
          </span>
        </div>
        <p className="text-base leading-relaxed text-white/90">
          &ldquo;{FEATURED_REVIEW.content}&rdquo;
        </p>
      </div>

      {/* 후기 카드 */}
      <div className="space-y-4">
        {WORKBOOK_REVIEWS.map((review) => (
          <div
            key={review.name}
            className="rounded-2xl border-2 border-[var(--foreground)] p-6"
            style={{ wordBreak: "keep-all" }}
          >
            {/* 헤더 */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">★★★★★</span>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[var(--foreground)]/10 text-[var(--foreground)]">
                {review.badge}
              </span>
            </div>

            {/* 본문 */}
            <p className="text-sm leading-relaxed text-[var(--foreground)]/80 mb-3">
              &ldquo;{review.content}&rdquo;
            </p>

            {/* 하이라이트 */}
            <div className="rounded-lg bg-[var(--surface)] p-3 mb-4">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                &ldquo;{review.highlight}&rdquo;
              </p>
            </div>

            {/* 프로필 */}
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--foreground)] text-white text-xs font-bold">
                {review.name[0]}
              </span>
              <span className="text-xs text-[var(--foreground)]/50">
                {review.name} 님 · {review.age} / {review.occupation}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
