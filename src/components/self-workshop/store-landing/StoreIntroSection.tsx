import { SOLUTION_HIGHLIGHTS } from "./content";

/**
 * [02] 마음챙김 워크북 소개 — 한 줄 정의 + 3줄 요약
 *
 * 공감이 아니라 '해결'에 초점. 제품의 기능적 가치가 한눈에 들어오도록.
 */
export function StoreIntroSection() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20">
      <p className="text-center text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-4">
        WHAT IT IS
      </p>

      {/* 서브 카피 (타깃 묘사) */}
      <p className="text-center text-sm sm:text-base leading-relaxed text-[var(--foreground)]/60 break-keep">
        심리 상담은 부담스럽고,
        <br className="sm:hidden" />
        {" "}혼자서는 엄두가 나지 않는 분들을 위한
      </p>

      {/* 메인 제목 (제품명) */}
      <h2 className="mt-3 text-center text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.25] text-[var(--foreground)] break-keep">
        마음 챙김 워크북
      </h2>

      {/* 사용 방식 한 줄 — 박스 강조 */}
      <div className="mt-10 rounded-2xl border-2 border-[var(--foreground)] bg-white px-6 py-8 sm:px-10 sm:py-10 text-center">
        <p className="text-lg sm:text-xl font-semibold leading-[1.6] text-[var(--foreground)] break-keep">
          학습지 하듯 워크북을 따라가며
          <br />
          진단부터 분석, 해결책까지 모두 찾아가요
        </p>
      </div>

      {/* 3줄 요약 */}
      <ul className="mt-10 space-y-4">
        {SOLUTION_HIGHLIGHTS.map((item, idx) => (
          <li
            key={item.title}
            className="flex gap-5 rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-6"
          >
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 border-[var(--foreground)] text-sm font-bold text-[var(--foreground)]">
              {idx + 1}
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] mb-2 break-keep">
                {item.title}
              </h3>
              <p className="text-sm sm:text-base leading-relaxed text-[var(--foreground)]/70 break-keep">
                {item.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
