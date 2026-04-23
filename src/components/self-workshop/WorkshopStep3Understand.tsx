"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DiagnosisScores } from "@/lib/self-workshop/diagnosis";
import type { DiagnosisProfile } from "@/lib/self-workshop/diagnosis-profile";
import { DiagnosisProfileCard } from "./DiagnosisProfileCard";
import { AchievementAddictionExplanation } from "./AchievementAddictionExplanation";

interface Props {
  workshopId: string;
  scores: DiagnosisScores;
  cachedProfile: DiagnosisProfile | null;
  mechanismAlreadySaved: boolean;
}

const EMPTY_MECHANISM = {
  recent_situation: "",
  automatic_thought: "",
  common_thoughts_checked: [] as string[],
  trigger_context: "",
  emotions_body: { emotions: [] as string[], body_text: "" },
  core_beliefs: { about_self: "", about_others: "", about_world: "" },
};

export function WorkshopStep3Understand({
  workshopId,
  scores,
  cachedProfile,
  mechanismAlreadySaved,
}: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleStartExercise() {
    setSubmitting(true);
    try {
      if (!mechanismAlreadySaved) {
        await fetch("/api/self-workshop/save-progress", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workshopId,
            field: "mechanism_analysis",
            data: EMPTY_MECHANISM,
          }),
        });
      }
      router.push("/dashboard/self-workshop/step/3?phase=exercise");
    } catch {
      setSubmitting(false);
      alert("이동 중 문제가 발생했습니다. 다시 시도해주세요.");
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-10 pb-32">
      <DiagnosisProfileCard
        workshopId={workshopId}
        scores={scores}
        cachedProfile={cachedProfile}
      />

      <AchievementAddictionExplanation />

      {/* 하단 고정 CTA — 실습 시작하기 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-[var(--foreground)] bg-white px-4 py-4">
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={handleStartExercise}
            disabled={submitting}
            className="block w-full rounded-xl bg-[var(--foreground)] py-4 text-center text-base font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "이동 중..." : "실습 시작하기 →"}
          </button>
        </div>
      </div>
    </div>
  );
}
