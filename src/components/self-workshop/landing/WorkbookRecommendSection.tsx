import { WORKBOOK_RECOMMEND } from "@/lib/self-workshop/landing-data";

/**
 * 이런 분에게 추천드려요 섹션
 *
 * 후기 섹션 아래에 배치되어 구매 직전의 맞춤 공감 포인트를 전달.
 */
export function WorkbookRecommendSection() {
  return (
    <section className="py-16">
      <p className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-3 text-center">
        FOR YOU
      </p>
      <h2
        className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] text-center mb-10"
        style={{ wordBreak: "keep-all" }}
      >
        이런 분에게 추천드려요
      </h2>

      <ul className="space-y-3">
        {WORKBOOK_RECOMMEND.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-4 sm:p-5"
          >
            <span
              aria-hidden
              className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--foreground)] text-white"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <span className="text-sm sm:text-base leading-relaxed text-[var(--foreground)]/80 break-keep">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
