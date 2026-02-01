"use client";

import { useState } from "react";
import { ChildhoodSentenceMission } from "@/components/missions/ChildhoodSentenceMission";
import { ThoughtFeelingMission } from "@/components/missions/ThoughtFeelingMission";
import { CoreBeliefMission } from "@/components/missions/CoreBeliefMission";
import { HabitMapperMission } from "@/components/missions/HabitMapperMission";
import { CognitiveErrorMission } from "@/components/missions/CognitiveErrorMission";
import { EmotionDiaryMission } from "@/components/missions/EmotionDiaryMission";

type Mission = { title: string; type: string };

type Props = {
  day: number;
  missions: Mission[];
  emotionDiaryMaxStep?: number;
};

export function DayMissionContent({ day, missions, emotionDiaryMaxStep = 15 }: Props) {
  const [submittedMissions, setSubmittedMissions] = useState<Set<string>>(new Set());
  const [activeMission, setActiveMission] = useState<string | null>(null);

  const handleSubmit = (type: string, data: unknown) => {
    console.log("Mission submit:", day, type, data);
    setSubmittedMissions((prev) => new Set(prev).add(type));
  };

  const renderMission = (mission: Mission) => {
    const submitted = submittedMissions.has(mission.type);

    if (mission.type === "emotion-diary") {
      return (
        <EmotionDiaryMission
          key={mission.type}
          day={day}
          maxStep={emotionDiaryMaxStep ?? 15}
          onSubmit={(data) => handleSubmit(mission.type, data)}
          submitted={submitted}
        />
      );
    }

    if (mission.type === "tci") {
      return (
        <div key={mission.type} className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <p className="text-[var(--foreground)]/80">
            상담사님이 카카오톡 알림톡과 메일로 검사 링크를 보내드릴 예정입니다.
            검사는 5일차까지 제출해주셔야 하며 링크는 발송 후 14일까지 유효합니다.
          </p>
          <p className="mt-4 text-sm text-[var(--foreground)]/60">
            TCI 검사 결과는 PDF로 제출해 주시며, 코치가 직접 로우데이터에 업로드합니다.
          </p>
        </div>
      );
    }

    if (mission.type === "childhood") {
      return (
        <ChildhoodSentenceMission
          key={mission.type}
          onSubmit={(data) => handleSubmit(mission.type, data)}
          submitted={submitted}
        />
      );
    }

    if (mission.type === "thought-feeling") {
      return (
        <ThoughtFeelingMission
          key={mission.type}
          onSubmit={(data) => handleSubmit(mission.type, data)}
          submitted={submitted}
        />
      );
    }

    if (mission.type === "core-belief") {
      return (
        <CoreBeliefMission
          key={mission.type}
          onSubmit={(data) => handleSubmit(mission.type, data)}
          submitted={submitted}
        />
      );
    }

    if (mission.type === "habit-mapper") {
      return (
        <HabitMapperMission
          key={mission.type}
          onSubmit={(data) => handleSubmit(mission.type, data)}
          submitted={submitted}
        />
      );
    }

    if (mission.type === "cognitive-error") {
      return (
        <CognitiveErrorMission
          key={mission.type}
          onSubmit={(data) => handleSubmit(mission.type, data)}
          submitted={submitted}
        />
      );
    }

    if (mission.type === "report") {
      return (
        <div key={mission.type} className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <p className="text-[var(--foreground)]/80">
            리포트는 1일~6일차 미션을 모두 완료했을 때 작성됩니다. 1~6일차 미션을 모두 완료하면
            리포트 요청 버튼이 활성화됩니다. 감정일기는 작성하지 않아도 리포트 요청이 가능합니다.
          </p>
          <p className="mt-4 text-sm text-[var(--foreground)]/60">
            리포트 생성 기능은 추후 구현 예정입니다.
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="mt-8 space-y-12">
      {missions.map((mission) => (
        <section key={mission.type} className="rounded-xl border border-[var(--border)] bg-white p-6">
          <h2 className="mb-6 text-lg font-semibold text-[var(--foreground)]">
            {mission.title}
          </h2>
          {renderMission(mission)}
        </section>
      ))}
    </div>
  );
}
