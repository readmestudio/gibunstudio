import { EXPERT_CONSULT } from "./content";

/**
 * [07] 전문가 해석 상담 (옵션)
 *
 * 워크북을 기반으로 진행되는 1회성 해석 상담. 종결 부담 없음을 강조.
 */
export function StoreExpertConsultSection() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20">
      <p className="text-center text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-3">
        OPTIONAL
      </p>
      <h2 className="text-center text-2xl sm:text-3xl font-bold text-[var(--foreground)] break-keep">
        {EXPERT_CONSULT.tagline}
      </h2>

      <div className="mt-10 rounded-2xl border-2 border-[var(--foreground)] bg-white p-8">
        {/* 배지 */}
        <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-[var(--foreground)] bg-[var(--foreground)] px-3 py-1 text-xs font-semibold text-white">
          <span aria-hidden>◎</span>
          {EXPERT_CONSULT.credential}
        </div>

        {/* 불릿 리스트 */}
        <ul className="mt-6 space-y-3">
          {EXPERT_CONSULT.bullets.map((b) => (
            <li
              key={b}
              className="flex items-start gap-3 text-sm sm:text-base text-[var(--foreground)]/80 break-keep leading-relaxed"
            >
              <span
                aria-hidden
                className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-[var(--foreground)] text-[10px] font-bold text-[var(--foreground)]"
              >
                ✓
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>

        {/* 메타 정보 */}
        <dl className="mt-8 grid grid-cols-3 gap-3 rounded-xl border-2 border-[var(--foreground)]/10 bg-[var(--surface)] p-4">
          <InfoField label="진행 방식" value={EXPERT_CONSULT.format} />
          <InfoField label="1회 소요" value={EXPERT_CONSULT.duration} />
          <InfoField label="비용" value={EXPERT_CONSULT.priceLabel} />
        </dl>

        {/* CTA */}
        <div className="mt-8">
          <button
            type="button"
            disabled
            className="flex w-full items-center justify-center rounded-xl border-2 border-[var(--foreground)]/25 bg-white px-5 py-3.5 text-sm font-semibold text-[var(--foreground)]/50 cursor-not-allowed"
            aria-label="1회 해석 상담 신청 (준비 중)"
          >
            1회 해석 상담 신청하기 (준비 중)
          </button>
          <p className="mt-3 text-center text-xs text-[var(--foreground)]/50 break-keep">
            상담은 워크북 완료 후 신청 가능합니다. 오픈 시 워크북 구매자에게 먼저 안내드려요.
          </p>
        </div>
      </div>
    </section>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <dt className="text-[10px] font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-1">
        {label}
      </dt>
      <dd className="text-xs sm:text-sm font-semibold text-[var(--foreground)] break-keep">
        {value}
      </dd>
    </div>
  );
}
