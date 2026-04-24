"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DiagnosisScores } from "@/lib/self-workshop/diagnosis";
import type { DiagnosisProfile } from "@/lib/self-workshop/diagnosis-profile";
import { DiagnosisProfileCard } from "./DiagnosisProfileCard";
import { AchievementAddictionExplanation } from "./AchievementAddictionExplanation";

interface Props {
  scores: DiagnosisScores;
  workshopId: string;
  cachedProfile: DiagnosisProfile | null;
  mechanismAlreadySaved: boolean;
}

const EMPTY_MECHANISM = {
  recent_situation: "",
  primary_emotion: "",
  emotion_intensity: 0,
  candidate_thoughts: [] as string[],
  automatic_thought: "",
  common_thoughts_checked: [] as string[],
  trigger_context: "",
  emotions_body: { emotions: [] as string[], body_text: "" },
  worst_case_result: "",
  thought_image: "",
  social_perception: "",
  core_beliefs: { about_self: "" },
};

export function WorkshopResultContent({
  scores,
  workshopId,
  cachedProfile,
  mechanismAlreadySaved,
}: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleStartExercise() {
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        workshopId,
        advanceStep: 3,
      };
      if (!mechanismAlreadySaved) {
        body.field = "mechanism_analysis";
        body.data = EMPTY_MECHANISM;
      }
      const res = await fetch("/api/self-workshop/save-progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("진행 저장 실패");
      router.push("/dashboard/self-workshop/step/3");
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
