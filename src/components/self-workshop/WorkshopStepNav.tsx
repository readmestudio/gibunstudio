import Link from "next/link";
import { WORKSHOP_STEPS } from "@/lib/self-workshop/diagnosis";

interface Props {
  currentStep: number;
  maxAccessibleStep: number; // 접근 가능한 최대 step
}

export function WorkshopStepNav({ currentStep, maxAccessibleStep }: Props) {
  const prev = WORKSHOP_STEPS.find((s) => s.step === currentStep - 1);
  const next = WORKSHOP_STEPS.find((s) => s.step === currentStep + 1);

  const canGoPrev = !!prev && currentStep > 1;
  const canGoNext = !!next && currentStep + 1 <= maxAccessibleStep;

  return (
    <nav
      className="mt-5 flex items-stretch gap-2 rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-2"
      aria-label="단계 이동"
    >
      {canGoPrev ? (
        <Link
          href={`/dashboard/self-workshop/step/${prev.step}`}
          className="group flex flex-1 items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-[var(--surface)]"
        >
          <span className="text-lg text-[var(--foreground)]/50 group-hover:text-[var(--foreground)] transition-colors">
            ←
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground)]/50">
              {prev.sectionLabel} · {prev.sectionStepNumber}단계
            </p>
            <p className="truncate text-sm font-medium text-[var(--foreground)]/80">
              {prev.title}
            </p>
          </div>
        </Link>
      ) : (
        <div className="flex flex-1 items-center gap-3 rounded-lg px-3 py-2 opacity-30">
          <span className="text-lg">←</span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground)]/40">
              이전
            </p>
            <p className="truncate text-sm text-[var(--foreground)]/50">
              처음 단계예요
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center px-2 text-xs font-semibold text-[var(--foreground)]/40 border-l-2 border-r-2 border-[var(--foreground)]/10">
        {currentStep} / {WORKSHOP_STEPS.length}
      </div>

      {canGoNext ? (
        <Link
          href={`/dashboard/self-workshop/step/${next.step}`}
          className="group flex flex-1 items-center justify-end gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-[var(--surface)]"
        >
          <div className="min-w-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground)]/50">
              {next.sectionLabel} · {next.sectionStepNumber}단계
            </p>
            <p className="truncate text-sm font-medium text-[var(--foreground)]/80">
              {next.title}
            </p>
          </div>
          <span className="text-lg text-[var(--foreground)]/50 group-hover:text-[var(--foreground)] transition-colors">
            →
          </span>
        </Link>
      ) : (
        <div className="flex flex-1 items-center justify-end gap-3 rounded-lg px-3 py-2 opacity-30">
          <div className="min-w-0 text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground)]/40">
              다음
            </p>
            <p className="truncate text-sm text-[var(--foreground)]/50">
              {next ? "아직 잠겨 있어요" : "마지막 단계예요"}
            </p>
          </div>
          <span className="text-lg">→</span>
        </div>
      )}
    </nav>
  );
}
