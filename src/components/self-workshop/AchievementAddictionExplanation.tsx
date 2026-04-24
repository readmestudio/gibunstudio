const PRACTICE_STEPS = [
  {
    label: "나의 성취 중독 패턴 찾기",
    description:
      "당신 안에서 성취 중독이 어떻게 반복되는지, 나만의 순환 구조를 먼저 발견합니다.",
  },
  {
    label: "자동적 사고 찾기",
    description:
      "그 패턴을 만드는 '자동으로 튀어나오는 생각'을 하나씩 붙잡아 봅니다.",
  },
  {
    label: "핵심 믿음 찾기",
    description:
      "자동적 사고 뒤에 깔린 뿌리 — '성취하지 않으면 가치 없다' 같은 핵심 믿음을 만납니다.",
  },
  {
    label: "나만의 대처법 찾기",
    description:
      "알아차린 것을 실전에 적용할 수 있도록, 일상에서 쓸 대처 전략을 직접 설계합니다.",
  },
];

/** 실습 총 소요 시간 — 운영자가 확정 후 수정 */
const PRACTICE_DURATION = "약 60분";

export function AchievementAddictionExplanation() {
  return (
    <div className="space-y-6">
      {/* 성취 중독 정의 */}
      <div className="space-y-4">
        <h3 className="text-base font-semibold text-[var(--foreground)]">
          그래서, 성취 중독이란
        </h3>
        <div className="space-y-3 text-sm leading-relaxed text-[var(--foreground)]/80">
          <p>
            위의 진단 결과에서 공감이 가는 부분이 있었나요? 이런 패턴이 반복된다면,
            그것을 <strong>성취 중독(Achievement Addiction)</strong>이라고 합니다.
          </p>
          <p>
            성취 중독이란, <strong>자기 가치를 오직 성취와 성과에서만
            확인하려는 반복적 패턴</strong>입니다. 단순히 &quot;열심히 사는 것&quot;과는
            다릅니다. 목표를 달성해도 만족감이 오래 가지 않고, 곧바로 다음 목표로
            달려갑니다. 쉬는 것에 죄책감을 느끼고, 성과가 없는 자신을 가치 없다고
            느낍니다.
          </p>
          <p>
            이것은 의지의 문제가 아닙니다. 어린 시절부터 형성된{" "}
            <strong>핵심 신념</strong>과 그에 따른{" "}
            <strong>자동적 사고 패턴</strong>이 만들어낸 심리적 순환이에요.
            이제부터 아래 4단계를 차근차근 따라가면서, 당신의 순환을 직접
            풀어볼 거예요.
          </p>
        </div>
      </div>

      {/* 실습 4단계 로드맵 */}
      <div className="rounded-xl border-2 border-[var(--foreground)]/20 bg-white p-6">
        <h3 className="mb-2 text-base font-semibold text-[var(--foreground)]">
          실습은 이렇게 진행됩니다
        </h3>
        <p className="mb-5 text-sm text-[var(--foreground)]/60 break-keep">
          당신 안에서 성취 중독이 어떻게 일어나는지, 4단계로 하나씩 풀어가 볼 거예요.
        </p>

        <div className="space-y-0">
          {PRACTICE_STEPS.map((step, i) => (
            <div key={step.label} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[var(--foreground)] text-xs font-bold">
                  {i + 1}
                </div>
                {i < PRACTICE_STEPS.length - 1 && (
                  <div className="h-10 w-0.5 bg-[var(--foreground)]/20" />
                )}
              </div>
              <div className="pb-5 flex-1">
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {step.label}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--foreground)]/60 break-keep">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 실습 전 안내 */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
        <p className="mb-3 text-sm font-semibold text-[var(--foreground)]">
          실습 전 꼭 확인해 주세요
        </p>
        <ul className="space-y-2 text-sm leading-relaxed text-[var(--foreground)]/75">
          <li className="flex items-start gap-2">
            <span aria-hidden className="mt-0.5">💻</span>
            <span>원활한 작성을 위해 <strong>PC 환경</strong>에서 진행하시길 권장드려요.</span>
          </li>
          <li className="flex items-start gap-2">
            <span aria-hidden className="mt-0.5">⏱</span>
            <span>총 소요 시간은 <strong>{PRACTICE_DURATION}</strong>입니다.</span>
          </li>
          <li className="flex items-start gap-2">
            <span aria-hidden className="mt-0.5">💾</span>
            <span>작성 내용은 <strong>자동 저장</strong>되어, 중간에 멈추셔도 언제든 이어서 하실 수 있어요.</span>
          </li>
          <li className="flex items-start gap-2">
            <span aria-hidden className="mt-0.5">🔒</span>
            <span>한 단계를 완료하셔야 <strong>다음 단계가 열립니다.</strong> 순서대로 차근차근 진행해 주세요.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
