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
  /** FIND_OUT 3(step 5): core_belief_excavation (SCT 응답 + 기존 belief_analysis) */
  coreBeliefExcavation?: unknown;
  userName?: string | null;
}

export function WorkshopAIAnalysis({
  workshopId,
  step,
  savedCards,
  savedReport,
  mechanismAnalysis,
  coreBeliefExcavation,
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
      userName={userName}
    />
  );
}
