import { LANDING_REVIEWS } from "./content";

/**
 * [08] 후기
 *
 * 구조: 시작 전 상태 → 진행 중 변화 → 현재 변화.
 * 직업 · 연령대 표기. 성취 중독 / 불안 워크북 후기 섞어서 배치.
 */
export function StoreTestimonialsSection() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-20">
      <p className="text-center text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-3">
        REVIEWS
      </p>
      <h2 className="text-center text-2xl sm:text-3xl font-bold text-[var(--foreground)] break-keep">
        먼저 해본 분들의 이야기
      </h2>
      <p className="mt-4 text-center text-sm sm:text-base text-[var(--foreground)]/60 max-w-xl mx-auto break-keep">
        시작 전에 어떤 상태였는지, 진행 중 무엇이 바뀌었는지, 지금은 어떤지를 있는 그대로 적었습니다.
      </p>

      <ul className="mt-12 grid gap-5 md:grid-cols-2">
        {LANDING_REVIEWS.map((r) => (
          <li
            key={r.name}
            className="rounded-2xl border-2 border-[var(--foreground)]/15 bg-white p-6"
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-[var(--foreground)]/10">
              <div>
                <p className="text-sm font-bold text-[var(--foreground)]">
                  {r.name}
                </p>
                <p className="text-xs text-[var(--foreground)]/60">{r.meta}</p>
              </div>
              <span className="rounded-full border-2 border-[var(--foreground)] bg-white px-2.5 py-0.5 text-[10px] font-semibold text-[var(--foreground)]">
                {r.workbook} 워크북
              </span>
            </div>

            {/* 시작 전 → 진행 중 → 현재 */}
            <dl className="space-y-4">
              <ReviewBlock label="시작 전" value={r.before} />
              <ReviewBlock label="진행 중 변화" value={r.during} />
              <ReviewBlock label="현재" value={r.now} highlight />
            </dl>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-center text-xs text-[var(--foreground)]/50 break-keep">
        * 후기는 본인 동의 하에 닉네임·일부 표현을 다듬어 게재했습니다.
      </p>
    </section>
  );
}

function ReviewBlock({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <dt
        className={`text-[10px] font-semibold tracking-widest uppercase mb-1.5 ${
          highlight ? "text-[var(--foreground)]" : "text-[var(--foreground)]/40"
        }`}
      >
        {label}
      </dt>
      <dd
        className={`text-sm leading-relaxed break-keep ${
          highlight
            ? "text-[var(--foreground)] font-semibold"
            : "text-[var(--foreground)]/70"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
