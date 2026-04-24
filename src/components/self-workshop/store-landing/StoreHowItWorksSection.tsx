import { HOW_IT_WORKS_STEPS } from "./content";

/**
 * [06] 어떻게 진행되나요?
 *
 * "그냥 다이어리 아닌가?"라는 의심을 해소하는 섹션.
 * 실제 구현된 8단계 + 각 단계의 상담심리학 기법 근거를 명시.
 */
export function StoreHowItWorksSection() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-20">
      <p className="text-center text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-3">
        HOW IT WORKS
      </p>
      <h2 className="text-center text-2xl sm:text-3xl font-bold text-[var(--foreground)] break-keep">
        어떻게 진행되나요?
      </h2>
      <p className="mt-4 text-center text-sm sm:text-base text-[var(--foreground)]/60 max-w-2xl mx-auto break-keep">
        &ldquo;그냥 다이어리 아닌가?&rdquo; 아니요. 상담심리학의 대표 프레임을 따라 진단 →
        패턴 → 핵심 믿음 → 대처 계획으로 이어지는 8단계 구조입니다.
      </p>

      {/* 이론 근거 배지 */}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {["CBT (인지행동치료)", "라이팅 테라피", "하향 화살표 기법", "5영역 모델"].map(
          (tag) => (
            <span
              key={tag}
              className="rounded-full border-2 border-[var(--foreground)] bg-white px-3 py-1 text-xs font-semibold text-[var(--foreground)]"
            >
              {tag}
            </span>
          ),
        )}
      </div>

      {/* 단계 목록 */}
      <ol className="mt-12 space-y-4">
        {HOW_IT_WORKS_STEPS.map((s) => (
          <li
            key={s.step}
            className="rounded-2xl border-2 border-[var(--foreground)]/15 bg-white p-6 sm:p-7"
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
              {/* 단계 번호 + phase */}
              <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-1 sm:w-28 flex-shrink-0">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[var(--foreground)] bg-white text-base font-bold text-[var(--foreground)]">
                  {s.step}
                </span>
                <span className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/50">
                  {s.phase}
                </span>
              </div>

              {/* 내용 */}
              <div className="flex-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
                  <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] break-keep">
                    {s.title}
                  </h3>
                  <span className="text-xs text-[var(--foreground)]/40">
                    {s.minutes}
                  </span>
                </div>
                <p className="text-sm sm:text-base leading-relaxed text-[var(--foreground)]/75 break-keep">
                  {s.description}
                </p>
                {s.technique && (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--foreground)]/25 bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--foreground)]/70">
                    <span
                      aria-hidden
                      className="text-[var(--foreground)]/40"
                    >
                      기법
                    </span>
                    <span className="font-semibold text-[var(--foreground)]">
                      {s.technique}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-10 text-center text-sm text-[var(--foreground)]/60 break-keep">
        단순 감정 일기가 아니라, 매 단계가 상담심리학 이론에 따라 설계된 구조적 실습입니다.
      </p>
    </section>
  );
}
