"use client";

import Link from "next/link";
import {
  DIMENSIONS,
  DIAGNOSIS_LEVELS,
  type DiagnosisScores,
} from "@/lib/self-workshop/diagnosis";

interface Props {
  scores: DiagnosisScores;
}

export function WorkshopResultContent({ scores }: Props) {
  const level = DIAGNOSIS_LEVELS.find((l) => l.level === scores.level)!;

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
          const maxScore = 25; // 5문항 × 5점
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
        <Link
          href="/dashboard/self-workshop/step/4"
          className="inline-flex rounded-xl border-2 border-[var(--foreground)] px-8 py-4 text-base font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
        >
          나의 순환 패턴 작성하기 →
        </Link>
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
