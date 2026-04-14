import { WORKSHOP_STEPS } from "@/lib/self-workshop/diagnosis";

const TYPE_LABELS: Record<string, string> = {
  diagnosis: "진단",
  result: "결과",
  exercise: "실습",
  ai_analysis: "인지 패턴 분석",
  read: "학습",
  reflection: "성찰",
};

export function CurriculumSection() {
  return (
    <section className="py-16">
      <p className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-3 text-center">
        CURRICULUM
      </p>
      <h2 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] text-center mb-2">
        워크북 <span className="text-[var(--foreground)]">커리큘럼</span>
      </h2>
      <p className="text-sm text-[var(--foreground)]/60 text-center mb-10">
        8단계 · 총 65~100분
      </p>

      {/* 테이블 */}
      <div className="rounded-xl border-2 border-[var(--foreground)] overflow-hidden">
        {/* 헤더 */}
        <div className="flex bg-[var(--foreground)] text-white">
          <div className="w-16 flex-shrink-0 p-3 text-center text-xs font-semibold">
            STEP
          </div>
          <div className="flex-1 p-3 text-xs font-semibold">내용</div>
          <div className="w-24 flex-shrink-0 p-3 text-center text-xs font-semibold hidden sm:block">
            소요 시간
          </div>
        </div>

        {/* 행 */}
        {WORKSHOP_STEPS.map((step, i) => (
          <div
            key={step.step}
            className={`flex items-center ${
              i < WORKSHOP_STEPS.length - 1
                ? "border-b border-[var(--foreground)]/10"
                : ""
            }`}
          >
            {/* Step 번호 */}
            <div className="w-16 flex-shrink-0 p-3 text-center">
              <span className="text-base font-bold text-[var(--foreground)]">
                {String(step.step).padStart(2, "0")}
              </span>
            </div>

            {/* 내용 */}
            <div className="flex-1 p-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-[var(--foreground)]">
                  {step.title}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[var(--foreground)]/10 text-[var(--foreground)]/60">
                  {TYPE_LABELS[step.type] || step.type}
                </span>
              </div>
              <p className="text-xs text-[var(--foreground)]/50 mt-0.5">
                {step.subtitle}
              </p>
            </div>

            {/* 소요 시간 */}
            <div className="w-24 flex-shrink-0 p-3 text-center hidden sm:block">
              <span className="text-xs text-[var(--foreground)]/50">
                {step.estimatedMinutes[0]}~{step.estimatedMinutes[1]}분
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
