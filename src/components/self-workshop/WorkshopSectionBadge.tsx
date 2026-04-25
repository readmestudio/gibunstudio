import type { WorkshopStep } from "@/lib/self-workshop/diagnosis";

interface Props {
  step: WorkshopStep;
  size?: "sm" | "md";
}

export function WorkshopSectionBadge({ step, size = "md" }: Props) {
  const padding = size === "sm" ? "px-2 py-0.5" : "px-3 py-1";
  const labelSize = size === "sm" ? "text-[9px]" : "text-[10px]";
  const stepSize = size === "sm" ? "text-[11px]" : "text-xs";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border-2 border-[var(--foreground)]/20 bg-white ${padding}`}
    >
      <span
        className={`${labelSize} font-bold uppercase tracking-widest text-[var(--foreground)]/80`}
      >
        {step.sectionLabel}
      </span>
      <span className="text-[var(--foreground)]/30">·</span>
      <span className={`${stepSize} font-medium text-[var(--foreground)]/70`}>
        {step.sectionStepNumber}단계
      </span>
    </div>
  );
}
