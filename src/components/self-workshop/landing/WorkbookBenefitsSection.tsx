import { WORKBOOK_BENEFITS } from "@/lib/self-workshop/landing-data";

/**
 * 워크북으로 얻을 수 있는 것 섹션
 *
 * 후기 섹션 바로 위에 배치되어, 구매 전 기대 효과를 명확히 전달.
 * 2열 그리드 6카드 (모바일은 1열).
 */
export function WorkbookBenefitsSection() {
  return (
    <section className="py-16">
      <p className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-3 text-center">
        OUTCOME
      </p>
      <h2
        className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] text-center mb-3"
        style={{ wordBreak: "keep-all" }}
      >
        워크북을 마치면, 이런 변화가 찾아옵니다
      </h2>
      <p className="text-sm text-[var(--foreground)]/60 text-center mb-10 max-w-md mx-auto break-keep">
        마음이 정리되면, 성과와 일상은 따라옵니다.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {WORKBOOK_BENEFITS.map((item, idx) => (
          <div
            key={item.title}
            className="rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-[var(--foreground)] text-xs font-bold text-[var(--foreground)]">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <h3 className="text-base font-bold text-[var(--foreground)]">
                {item.title}
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-[var(--foreground)]/70 break-keep">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
