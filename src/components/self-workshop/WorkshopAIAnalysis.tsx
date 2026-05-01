"use client";

import { WorkshopCognitiveReport } from "./WorkshopCognitiveReport";
import { WorkshopProfessionalReport } from "./WorkshopProfessionalReport";

interface Props {
  workshopId: string;
  step: 5 | 9;
  /** SUMMARY 1(step 9): summary_cards 컬럼에 저장된 ProfessionalReport (또는 옛 배열 형식) */
  savedCards?: unknown;
  /** FIND_OUT 3(step 5): mechanism_insights */
  savedReport?: unknown;
  mechanismAnalysis?: unknown;
  /** Step 9 BeliefShiftCards 가 사용 — mechanism_insights 원본 (cognitive_errors 포함) */
  mechanismInsights?: unknown;
  /** FIND_OUT 3(step 5) / SUMMARY(step 9): core_belief_excavation */
  coreBeliefExcavation?: unknown;
  /** Step 9 BeliefShiftCards 가 사용 — belief_destroy(검증 데이터) */
  beliefDestroy?: unknown;
  /** Step 9 BeliefShiftCards 가 사용 — new_belief(새 핵심 신념) */
  newBelief?: unknown;
  /** Step 9 BeliefShiftCards 가 사용 — coping_plan(대체 사고/실천) */
  copingPlan?: unknown;
  userName?: string | null;
}

export function WorkshopAIAnalysis({
  workshopId,
  step,
  savedCards,
  savedReport,
  mechanismAnalysis,
  mechanismInsights,
  coreBeliefExcavation,
  beliefDestroy,
  newBelief,
  copingPlan,
  userName,
}: Props) {
  if (step === 5) {
    return (
      <WorkshopCognitiveReport
        workshopId={workshopId}
        savedReport={savedReport ?? null}
        mechanismAnalysis={mechanismAnalysis ?? null}
        coreBeliefExcavation={coreBeliefExcavation ?? null}
        userName={userName}
      />
    );
  }

  // step === 9 — SUMMARY 1: 전문 상담사 리포트
  return (
    <WorkshopProfessionalReport
      workshopId={workshopId}
      savedReport={savedCards ?? null}
      mechanismAnalysis={mechanismAnalysis ?? null}
      mechanismInsights={mechanismInsights ?? null}
      coreBeliefExcavation={coreBeliefExcavation ?? null}
      beliefDestroy={beliefDestroy ?? null}
      newBelief={newBelief ?? null}
      copingPlan={copingPlan ?? null}
      userName={userName}
    />
  );
}
