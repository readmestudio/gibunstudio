import { SOLUTION_CARDS } from "@/lib/self-workshop/landing-data";

export function SolutionStepsSection() {
  return (
    <section className="py-16">
      <p className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-3 text-center">
        SOLUTION
      </p>
      <h2
        className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] text-center mb-3"
        style={{ wordBreak: "keep-all" }}
      >
        성취중독은 이렇게 해결됩니다
      </h2>
      <p className="text-sm text-[var(--foreground)]/60 text-center mb-10 max-w-md mx-auto">
        진단부터 실천까지, 4단계 CBT 기반 솔루션
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SOLUTION_CARDS.map((card) => (
          <div
            key={card.step}
            className="rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-6"
          >
            {/* 상단: 번호 + 태그 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-[var(--foreground)] text-sm font-bold text-[var(--foreground)]">
                  {String(card.step).padStart(2, "0")}
                </span>
                <span className="text-base font-bold text-[var(--foreground)]">
                  {card.title}
                </span>
              </div>
              <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-[var(--foreground)]/10 text-[var(--foreground)]">
                {card.tag}
              </span>
            </div>

            {/* 구분선 */}
            <div className="h-px bg-[var(--foreground)]/10 mb-4" />

            {/* 불릿 */}
            <ul className="space-y-2 mb-4">
              {card.bullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex items-start gap-2 text-sm text-[var(--foreground)]/80"
                >
                  <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--foreground)]" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            {/* 결론 */}
            <p className="text-xs font-semibold text-[var(--foreground)]/50">
              → {card.summary}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
