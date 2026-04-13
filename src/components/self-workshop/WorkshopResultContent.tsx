"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DIMENSIONS,
  DIAGNOSIS_LEVELS,
  type DiagnosisScores,
  type DimensionKey,
} from "@/lib/self-workshop/diagnosis";

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

  // 최고 점수 차원 찾기
  const maxDimKey = Object.entries(scores.dimensions).reduce((a, b) =>
    b[1] > a[1] ? b : a
  )[0];

  function getSignalLevel(score: number) {
    if (score >= 18) {
      return {
        emoji: "\u{1F6A8}",
        label: "위험",
        className: "bg-red-100 text-red-700",
      };
    }
    if (score >= 13) {
      return {
        emoji: "\u{26A0}\u{FE0F}",
        label: "주의 필요",
        className: "bg-orange-100 text-orange-700",
      };
    }
    if (score >= 8) {
      return {
        emoji: "\u{1F7E1}",
        label: "주의",
        className: "bg-yellow-100 text-yellow-700",
      };
    }
    return {
      emoji: "\u{1F7E2}",
      label: "안전",
      className: "bg-green-100 text-green-700",
    };
  }

  async function handleAdvanceToNextStep() {
    setIsAdvancing(true);
    try {
      const res = await fetch("/api/self-workshop/save-progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshopId,
          field: "result_read",
          data: true,
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
    <div className="mx-auto max-w-lg space-y-8">
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

      {/* ── 성취 중독 정의 ── */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-[var(--foreground)]">
          그래서, 성취 중독이란
        </h3>
        <div className="space-y-3 text-sm leading-relaxed text-[var(--foreground)]/80">
          <p>
            위의 장면 중 공감이 가는 것이 있었나요?
            이런 패턴이 반복된다면, 그것을 <strong>성취 중독(Achievement Addiction)</strong>이라고 합니다.
          </p>
          <p>
            성취 중독이란, <strong>자기 가치를 오직 성취와 성과에서만
            확인하려는 반복적 패턴</strong>입니다.
            단순히 &quot;열심히 사는 것&quot;과는 다릅니다.
            목표를 달성해도 만족감이 오래 가지 않고, 곧바로 다음 목표로 달려갑니다.
            쉬는 것에 죄책감을 느끼고, 성과가 없는 자신을 가치 없다고 느낍니다.
          </p>
          <p>
            이것은 의지의 문제가 아닙니다. 어린 시절부터 형성된 <strong>핵심 신념</strong>과
            그에 따른 <strong>자동적 사고 패턴</strong>이 만들어낸 심리적 순환이에요.
            다음 단계에서 이 순환을 당신의 경험에 직접 대입해 볼 거예요.
          </p>
        </div>
      </div>

      {/* 성취 중독 5단계 순환 모델 도식 */}
      <div className="rounded-xl border-2 border-[var(--foreground)]/20 bg-white p-6">
        <h3 className="mb-4 text-base font-semibold text-[var(--foreground)]">
          성취 중독의 순환 메커니즘
        </h3>
        <p className="mb-4 text-sm text-[var(--foreground)]/60">
          성취 중독은 아래 5단계가 반복되며 점점 강화됩니다.
          다음 단계에서 이 순환을 당신의 경험에 대입해 볼 거예요.
        </p>

        <div className="space-y-0">
          {CYCLE_STEPS.map((cs, i) => (
            <div key={cs.label} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[var(--foreground)] text-xs font-bold">
                  {i + 1}
                </div>
                {i < CYCLE_STEPS.length - 1 && (
                  <div className="h-8 w-0.5 bg-[var(--foreground)]/20" />
                )}
                {i === CYCLE_STEPS.length - 1 && (
                  <div className="mt-1 text-xs text-[var(--foreground)]/40">↻</div>
                )}
              </div>
              <div className="pb-4">
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {cs.label}
                </p>
                <p className="text-xs text-[var(--foreground)]/60">
                  {cs.example}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 다음 단계 */}
      <div className="text-center">
        <button
          onClick={handleAdvanceToNextStep}
          disabled={isAdvancing}
          className="inline-flex rounded-xl border-2 border-[var(--foreground)] px-8 py-4 text-base font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAdvancing ? "이동 중..." : "나의 순환 패턴 작성하기 →"}
        </button>
      </div>
    </div>
  );
}

const CYCLE_STEPS = [
  {
    label: "핵심 신념",
    example: '"성취하지 않으면 나는 가치 없다"',
  },
  {
    label: "촉발 상황",
    example: "실패, 비교, 휴식, 빈 시간",
  },
  {
    label: "자동적 사고",
    example: '"더 해야 해" "나만 뒤처져" "쉬면 안 돼"',
  },
  {
    label: "정서/신체 반응",
    example: "불안, 초조, 죄책감 / 가슴 답답, 불면",
  },
  {
    label: "행동",
    example: "과잉 몰두, 새 목표 설정, 감정 회피 → (일시적 안도) → 1로 복귀",
  },
];
