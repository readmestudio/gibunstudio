import { DEFINITION_ONE_LINER, SOLUTION_HIGHLIGHTS } from "./content";

/**
 * [02] 마음챙김 워크북 소개 — 한 줄 정의 + 3줄 요약
 *
 * 공감이 아니라 '해결'에 초점. 제품의 기능적 가치가 한눈에 들어오도록.
 */
export function StoreIntroSection() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20">
      <p className="text-center text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-3">
        WHAT IT IS
      </p>
      <h2 className="text-center text-2xl sm:text-3xl font-bold text-[var(--foreground)] break-keep">
        마음 챙김 워크북이란
      </h2>

      {/* 한 줄 정의 */}
      <div className="mt-8 rounded-2xl border-2 border-[var(--foreground)] bg-white p-8 text-center">
        <p className="text-lg sm:text-xl font-semibold leading-relaxed text-[var(--foreground)] break-keep">
          &ldquo;{DEFINITION_ONE_LINER}&rdquo;
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
