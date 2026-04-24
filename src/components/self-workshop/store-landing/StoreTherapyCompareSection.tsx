import { THERAPY_COMPARISON_ROWS } from "./content";

/**
 * [03] 상담 vs 워크북 비교 표
 *
 * 7개 항목 비교. 표 아래에 핵심 효용 3가지는 유지된다는 강조 메시지 포함.
 */
export function StoreTherapyCompareSection() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-20">
      <p className="text-center text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-3">
        THERAPY VS WORKBOOK
      </p>
      <h2 className="text-center text-2xl sm:text-3xl font-bold text-[var(--foreground)] break-keep">
        상담의 장점은 그대로,
        <br className="sm:hidden" /> 단점만 덜어냈습니다
      </h2>
      <p className="mt-4 text-center text-sm sm:text-base text-[var(--foreground)]/60 max-w-xl mx-auto break-keep">
        상담의 본질적 효용은 유지하되, 현실적 부담(비용·반복성·상담사 의존·종결 부담)을 해결합니다.
      </p>

      {/* 데스크톱: 3열 테이블 / 모바일: 카드형 */}
      <div className="mt-10">
        {/* 데스크톱 테이블 */}
        <div className="hidden md:block overflow-hidden rounded-2xl border-2 border-[var(--foreground)]">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[var(--foreground)] text-white">
                <th className="p-4 text-sm font-semibold w-[18%]">항목</th>
                <th className="p-4 text-sm font-semibold w-[41%]">일반 상담</th>
                <th className="p-4 text-sm font-semibold w-[41%] bg-[var(--foreground)]">
                  마음 챙김 워크북
                </th>
              </tr>
            </thead>
            <tbody>
              {THERAPY_COMPARISON_ROWS.map((row, idx) => (
                <tr
                  key={row.label}
                  className={
                    idx % 2 === 0
                      ? "bg-white"
                      : "bg-[var(--surface)]"
                  }
                >
                  <td className="p-4 text-sm font-semibold text-[var(--foreground)] border-t border-[var(--foreground)]/10">
                    {row.label}
                  </td>
                  <td className="p-4 text-sm text-[var(--foreground)]/60 break-keep border-t border-[var(--foreground)]/10">
                    {row.therapy}
                  </td>
                  <td className="p-4 text-sm text-[var(--foreground)] font-semibold break-keep border-t border-[var(--foreground)]/10">
                    {row.workbook}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 모바일 카드형 */}
        <ul className="md:hidden space-y-3">
          {THERAPY_COMPARISON_ROWS.map((row) => (
            <li
              key={row.label}
              className="rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-4"
            >
              <p className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/50 mb-3">
                {row.label}
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-[var(--foreground)]/40 flex-shrink-0 w-14">
                    일반 상담
                  </span>
                  <span className="text-sm text-[var(--foreground)]/60 break-keep">
                    {row.therapy}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs font-semibold text-[var(--foreground)] flex-shrink-0 w-14">
                    워크북
                  </span>
                  <span className="text-sm font-semibold text-[var(--foreground)] break-keep">
                    {row.workbook}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* 핵심 효용 유지 메시지 */}
      <div className="mt-10 rounded-2xl border-2 border-[var(--foreground)] bg-[var(--foreground)] px-6 py-10 sm:py-14 text-center text-white">
        <p className="text-xl sm:text-2xl md:text-3xl font-bold leading-[1.4] break-keep">
          심리 상담의 장점은 취하고
          <br />
          단점은 완벽하게 덜어냈습니다
        </p>
      </div>
    </section>
  );
}
