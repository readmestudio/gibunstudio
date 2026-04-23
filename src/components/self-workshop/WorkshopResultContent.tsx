"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DIMENSIONS,
  DIAGNOSIS_LEVELS,
  type DiagnosisScores,
  type DimensionKey,
} from "@/lib/self-workshop/diagnosis";
import { getSignalLevel } from "@/lib/self-workshop/signal";

interface Props {
  scores: DiagnosisScores;
  workshopId: string;
}

/* ── 시나리오 데이터 (직장인 3~15년차 페르소나) ── */

const SCENARIO_CARDS: {
  dimensionKey: DimensionKey;
  keyword: string;
  scenario: string;
}[] = [
  {
    dimensionKey: "conditional_self_worth",
    keyword: "자기 가치의 조건화",
    scenario:
      "연봉이 오르거나 좋은 평가를 받아야만 '나 괜찮은 사람이야'라고 느낄 확률이 높아요. 성과 없는 나는 불안하고, 동기들의 승진 소식에 괜히 마음이 무거워질 수 있어요.",
  },
  {
    dimensionKey: "compulsive_striving",
    keyword: "과잉 추동",
    scenario:
      "프로젝트가 끝나면 '다음엔 뭘 해야 하지' 하고 바로 다음 목표를 세우고 있을 확률이 높아요. 주말에 쉬면서도 '이 시간에 자격증이라도 따야 하나' 생각이 자주 들 수 있어요.",
  },
  {
    dimensionKey: "fear_of_failure",
    keyword: "실패 공포 / 완벽주의",
    scenario:
      "회의에서 발표를 잘 마쳤는데, 퇴근길에 '그때 그 말은 왜 했지' 되짚고 있을 확률이 높아요. 작은 실수도 오래 남고, '완벽하지 않으면 의미 없다'는 생각이 습관처럼 따라올 수 있어요.",
  },
  {
    dimensionKey: "emotional_avoidance",
    keyword: "정서적 회피",
    scenario:
      "힘든 일이 있으면 감정을 느끼기보다 야근을 선택할 확률이 높아요. 바쁘면 생각을 안 해도 되니까요. 감정이 올라올 때 '일단 할 일부터 하자'가 자동 반응일 수 있어요.",
  },
];

export function WorkshopResultContent({ scores, workshopId }: Props) {
  const router = useRouter();
  const [isAdvancing, setIsAdvancing] = useState(false);
  const level = DIAGNOSIS_LEVELS.find((l) => l.level === scores.level)!;

  async function handleAdvanceToNextStep() {
    setIsAdvancing(true);
    try {
      const res = await fetch("/api/self-workshop/save-progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshopId,
          advanceStep: 3,
        }),
      });
      if (res.ok) {
        router.push("/dashboard/self-workshop/step/3");
      } else {
        setIsAdvancing(false);
        alert("진행 저장에 실패했습니다. 다시 시도해주세요.");
      }
    } catch {
      setIsAdvancing(false);
      alert("네트워크 오류가 발생했습니다.");
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 pb-32">
      {/* 총점 + 레벨 */}
      <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-8 text-center">
        <p className="text-sm font-medium text-[var(--foreground)]/50 uppercase tracking-wider">
          나의 진단 결과
        </p>
        <p className="mt-4 text-6xl font-bold text-[var(--foreground)]">
          {scores.total}
          <span className="text-lg font-normal text-[var(--foreground)]/40">
            /100
          </span>
        </p>
        <div className="mt-3 inline-block rounded-full border-2 border-[var(--foreground)] px-4 py-1">
          <span className="text-sm font-semibold">
            Level {scores.level}: {level.name}
          </span>
        </div>
        <p className="mt-2 text-xs text-[var(--foreground)]/50">{level.keyword}</p>
      </div>

      {/* 레벨 설명 */}
      <div className="rounded-xl border-2 border-[var(--foreground)]/20 bg-white p-6">
        <p className="text-sm leading-relaxed text-[var(--foreground)]/80">
          {level.description}
        </p>
      </div>

      {/* 하위 영역 점수 바 차트 */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-[var(--foreground)]">
          영역별 점수
        </h3>
        {DIMENSIONS.map((dim) => {
          const score = scores.dimensions[dim.key];
          const maxScore = 25;
          const percent = (score / maxScore) * 100;
          return (
            <div key={dim.key}>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {dim.label}
                </span>
                <span className="text-sm font-bold text-[var(--foreground)]">
                  {score}/{maxScore}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[var(--foreground)]/10">
                <div
                  className="h-full rounded-full bg-[var(--foreground)] transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-0.5 text-xs text-[var(--foreground)]/50">
                {dim.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── 시나리오 카드: "님은 이런 생각을 자주 할 확률이 높아요" ── */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-[var(--foreground)]">
          이런 생각을 자주 할 확률이 높아요
        </h3>
        <div className="space-y-3">
          {SCENARIO_CARDS.map((card) => {
            const dimScore = scores.dimensions[card.dimensionKey] ?? 0;
            const signal = getSignalLevel(dimScore);
            return (
              <div
                key={card.dimensionKey}
                className="rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[var(--foreground)]/50">
                      {card.keyword}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${signal.className}`}
                  >
                    <span className="text-sm">{signal.emoji}</span>
                    {signal.label}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-[var(--foreground)]/80">
                  {card.scenario}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 하단 고정 CTA — 다음 단계로 넘어가기 */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-[var(--foreground)] bg-white px-4 py-4">
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={handleAdvanceToNextStep}
            disabled={isAdvancing}
            className="block w-full rounded-xl bg-[var(--foreground)] py-4 text-center text-base font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAdvancing ? "이동 중..." : "다음 단계로 넘어가기 →"}
          </button>
        </div>
      </div>
    </div>
  );
}
