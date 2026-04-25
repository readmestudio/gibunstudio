"use client";

import Link from "next/link";
import {
  WORKSHOP_STEPS,
  WORKSHOP_SECTIONS,
  type WorkshopSection,
  type WorkshopStep,
} from "@/lib/self-workshop/diagnosis";

interface Props {
  currentStep: number;
  completedSteps: number[]; // 완료된 step 번호 배열
}

export function WorkshopStepList({ currentStep, completedSteps }: Props) {
  const totalSteps = WORKSHOP_STEPS.length;
  const completedCount = completedSteps.length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  // 예상 소요 시간 동적 합산 (분 단위 min~max)
  const totalMin = WORKSHOP_STEPS.reduce((acc, s) => acc + s.estimatedMinutes[0], 0);
  const totalMax = WORKSHOP_STEPS.reduce((acc, s) => acc + s.estimatedMinutes[1], 0);

  // 섹션별 그룹핑
  const stepsBySection = new Map<WorkshopSection, WorkshopStep[]>();
  for (const s of WORKSHOP_STEPS) {
    const arr = stepsBySection.get(s.section) ?? [];
    arr.push(s);
    stepsBySection.set(s.section, arr);
  }

  return (
    <div className="space-y-6">
      {/* 전체 진행률 */}
      <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-[var(--foreground)]/70">
            전체 진행률
          </span>
          <span className="text-sm font-bold text-[var(--foreground)]">
            {completedCount} / {totalSteps}
          </span>
        </div>
        <div className="h-2 bg-[var(--foreground)]/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--foreground)] rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-[var(--foreground)]/50">
          예상 소요 시간: {totalMin}~{totalMax}분
        </p>
      </div>

      {/* 섹션별 그룹 */}
      <div className="space-y-8">
        {WORKSHOP_SECTIONS.map((sectionMeta, idx) => {
          const sectionSteps = stepsBySection.get(sectionMeta.section) ?? [];
          if (sectionSteps.length === 0) return null;

          return (
            <div key={sectionMeta.section} className="space-y-3">
              {/* 섹션 헤더 */}
              <div className="flex items-baseline gap-3 px-1">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--foreground)]/40">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <h2 className="text-lg font-bold text-[var(--foreground)]">
                  {sectionMeta.label}
                </h2>
                <p className="text-xs text-[var(--foreground)]/50">
                  {sectionMeta.description}
                </p>
              </div>

              {/* 섹션 내 step 카드 */}
              <div className="space-y-2">
                {sectionSteps.map((ws) => {
                  const isCompleted = completedSteps.includes(ws.step);
                  const isCurrent = ws.step === currentStep;
                  const isLocked = ws.step > currentStep && !isCompleted;

                  return (
                    <StepCard
                      key={ws.step}
                      step={ws}
                      isCompleted={isCompleted}
                      isCurrent={isCurrent}
                      isLocked={isLocked}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Step 카드 ──

interface StepCardProps {
  step: WorkshopStep;
  isCompleted: boolean;
  isCurrent: boolean;
  isLocked: boolean;
}

function StepCard({ step, isCompleted, isCurrent, isLocked }: StepCardProps) {
  const content = (
    <div
      className={`rounded-xl border-2 p-5 transition-colors ${
        isCurrent
          ? "border-[var(--foreground)] bg-white"
          : isCompleted
            ? "border-[var(--foreground)]/30 bg-[var(--surface)]"
            : "border-[var(--foreground)]/10 bg-white"
      } ${isLocked ? "opacity-50" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Step 번호 / 상태 아이콘 */}
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${
              isCompleted
                ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                : isCurrent
                  ? "border-[var(--foreground)] text-[var(--foreground)]"
                  : "border-[var(--foreground)]/20 text-[var(--foreground)]/40"
            }`}
          >
            {isCompleted ? "✓" : step.sectionStepNumber}
          </div>

          <div>
            <p className="text-xs font-medium text-[var(--foreground)]/50 uppercase tracking-wider">
              {step.subtitle}
            </p>
            <h3 className="text-base font-semibold text-[var(--foreground)]">
              {step.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--foreground)]/40">
            {step.estimatedMinutes[0]}~{step.estimatedMinutes[1]}분
          </span>
          {isCurrent && (
            <span className="rounded-lg border-2 border-[var(--foreground)] px-4 py-1.5 text-sm font-semibold text-[var(--foreground)]">
              이어하기
            </span>
          )}
          {isCompleted && !isCurrent && (
            <span className="rounded-lg border-2 border-[var(--foreground)]/30 px-4 py-1.5 text-sm font-medium text-[var(--foreground)]/60 hover:border-[var(--foreground)] hover:text-[var(--foreground)] transition-colors">
              다시 보기
            </span>
          )}
          {isLocked && (
            <svg
              className="h-5 w-5 text-[var(--foreground)]/30"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          )}
        </div>
      </div>
    </div>
  );

  if (isLocked) {
    return content;
  }

  return (
    <Link href={`/dashboard/self-workshop/step/${step.step}`}>{content}</Link>
  );
}
