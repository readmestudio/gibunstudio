"use client";

import Link from "next/link";
import { COGNITIVE_ERRORS } from "@/lib/self-workshop/diagnosis";

interface Props {
  highlightedErrors?: string[]; // Step 5 AI가 식별한 인지적 오류 id들
}

export function WorkshopReadStep6({ highlightedErrors }: Props) {
  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[var(--foreground)]">
          다르게 생각하는 법
        </h2>
        <p className="mt-2 text-sm text-[var(--foreground)]/60">
          읽기 | 약 5~7분
        </p>
      </div>

      <div className="text-sm leading-relaxed text-[var(--foreground)]/80 space-y-3">
        <p>
          앞 단계에서 당신의 성취 순환 패턴을 확인했습니다.
          이 순환의 핵심 고리는 <strong>자동적 사고</strong> — 특정 상황에서 자동으로 튀어나오는
          생각입니다.
        </p>
        <p>
          CBT(인지행동치료)에서는 이 자동적 사고에 포함된 <strong>인지적 오류</strong>를
          찾아내고, 더 균형 잡힌 사고로 대체하는 연습을 합니다.
        </p>
      </div>

      {/* 인지적 오류 카드 */}
      <div>
        <h3 className="mb-3 text-base font-semibold text-[var(--foreground)]">
          성취 중독에서 흔한 인지적 오류 6가지
        </h3>
        <div className="space-y-3">
          {COGNITIVE_ERRORS.map((ce) => {
            const isHighlighted = highlightedErrors?.includes(ce.id);
            return (
              <div
                key={ce.id}
                className={`rounded-xl border-2 p-4 ${
                  isHighlighted
                    ? "border-[var(--foreground)] bg-[var(--foreground)]/5"
                    : "border-[var(--foreground)]/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {ce.label}
                  </p>
                  {isHighlighted && (
                    <span className="rounded-full bg-[var(--foreground)] px-2 py-0.5 text-[10px] font-bold text-white">
                      나의 패턴
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-[var(--foreground)]/60">
                  &quot;{ce.example}&quot;
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 변환 예시 테이블 */}
      <div className="rounded-xl border-2 border-[var(--foreground)]/20 overflow-hidden">
        <div className="grid grid-cols-2">
          <div className="border-b-2 border-r-2 border-[var(--foreground)]/20 bg-[var(--surface)] p-3">
            <p className="text-xs font-semibold text-[var(--foreground)]">
              자동적 사고
            </p>
          </div>
          <div className="border-b-2 border-[var(--foreground)]/20 bg-[var(--surface)] p-3">
            <p className="text-xs font-semibold text-[var(--foreground)]">
              대안적 사고
            </p>
          </div>
          {THOUGHT_EXAMPLES.map((ex, i) => (
            <div key={i} className="contents">
              <div className="border-b border-r-2 border-[var(--foreground)]/10 p-3">
                <p className="text-xs text-[var(--foreground)]/70">{ex.auto}</p>
              </div>
              <div className="border-b border-[var(--foreground)]/10 p-3">
                <p className="text-xs text-[var(--foreground)]/70">{ex.alternative}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 행동적 대처 전략 */}
      <div>
        <h3 className="mb-3 text-base font-semibold text-[var(--foreground)]">
          행동적 대처 전략
        </h3>
        <div className="space-y-3">
          {COPING_STRATEGIES.map((cs) => (
            <div
              key={cs.title}
              className="rounded-xl border-2 border-[var(--foreground)]/20 p-4"
            >
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {cs.title}
              </p>
              <p className="mt-1 text-xs text-[var(--foreground)]/60">
                {cs.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border-2 border-[var(--foreground)]/10 bg-[var(--surface)] p-4">
        <p className="text-sm text-[var(--foreground)]/60">
          다음 단계에서는 이 기법들을 당신의 실제 상황에 적용해 볼 거예요.
          인지 재구조화, 행동 실험, 자기 돌봄 — 세 가지 워크시트를 작성합니다.
        </p>
      </div>

      <div className="text-center">
        <Link
          href="/dashboard/self-workshop/step/7"
          className="inline-flex rounded-xl border-2 border-[var(--foreground)] px-8 py-4 text-base font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
        >
          나만의 대처 계획 세우기 →
        </Link>
      </div>
    </div>
  );
}

const THOUGHT_EXAMPLES = [
  {
    auto: "완벽하지 않으면 의미 없다",
    alternative: "80%도 충분히 가치 있다. 완벽은 비현실적 기준이다",
  },
  {
    auto: "쉬면 뒤처진다",
    alternative: "쉬어야 더 좋은 퍼포먼스를 낼 수 있다",
  },
  {
    auto: "저 사람보다 못하면 나는 실패자다",
    alternative: "각자의 속도와 기준이 다르다. 비교는 내 성장을 반영하지 않는다",
  },
  {
    auto: "이번에 실패하면 다 끝이다",
    alternative: "하나의 실패가 전체를 결정하지 않는다. 다음 기회가 있다",
  },
];

const COPING_STRATEGIES = [
  {
    title: "행동 실험",
    description:
      "\"쉬면 큰일 난다\"는 예측을 직접 테스트합니다. 의도적으로 쉬는 시간을 만들고, 실제로 어떤 일이 일어나는지 관찰합니다.",
  },
  {
    title: "가치 기반 행동",
    description:
      "\"성취\"가 아닌 \"가치\"에 기반한 행동을 선택합니다. 나에게 진정으로 중요한 것이 무엇인지 돌아보고, 그에 맞는 행동을 합니다.",
  },
  {
    title: "자기 돌봄 허용",
    description:
      "쉬는 것, 실수하는 것, 완벽하지 않은 것에 대해 스스로에게 허락합니다. 자기 자비(self-compassion)는 게으름이 아닌 회복입니다.",
  },
];
