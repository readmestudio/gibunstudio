import type { AnalysisReport } from "@/lib/self-workshop/analysis-report";

interface Props {
  errors: AnalysisReport["cognitive_errors"];
}

export function CognitiveErrorsSection({ errors }: Props) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--foreground)]/40">
          Section 01
        </span>
        <span className="h-px flex-1 bg-[var(--foreground)]/15" />
        <span className="text-sm font-bold text-[var(--foreground)]">
          당신의 자동사고 속 숨은 함정
        </span>
      </div>

      {/* intro */}
      <div className="rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-6">
        <p className="text-sm leading-relaxed text-[var(--foreground)]/80">
          {errors.intro}
        </p>
      </div>

      {/* items — 인지 오류 카드 */}
      <div className="mt-4 space-y-3">
        {errors.items.map((item, i) => (
          <div
            key={item.id}
            className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[var(--foreground)] text-xs font-bold">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]/45">
                  Cognitive Error
                </p>
                <h3 className="mt-1 text-base font-bold text-[var(--foreground)]">
                  {item.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]/60">
                  {item.definition}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-[var(--foreground)]/15 bg-[var(--surface)]/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--foreground)]/50">
                당신의 자동사고에서는
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--foreground)]/85">
                {item.interpretation}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* closing */}
      <div className="mt-4 rounded-xl border border-dashed border-[var(--foreground)]/30 bg-[var(--surface)]/40 p-5">
        <p className="text-sm leading-relaxed text-[var(--foreground)]/75">
          {errors.closing}
        </p>
      </div>
    </section>
  );
}
