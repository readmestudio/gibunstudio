const EVERYDAY_EXAMPLES = [
  "프로젝트가 끝나면 축하할 틈도 없이 “다음엔 뭘 해야 하지”부터 떠오른다",
  "동기의 승진 소식에 “축하해”라고 답장하면서도 속은 조용히 무너진다",
  "주말에 계획이 없으면 “이 시간에 자격증이라도…” 하며 불안해진다",
  "상사의 “수고했어”조차 “진심일까, 다음엔 더 잘해야지”로 번역된다",
  "몸이 아파 누운 날에도 머릿속으론 메일함과 할 일 목록을 스크롤한다",
  "취미·운동·여가마저 “성과가 나오는지”로 자기도 모르게 판단하게 된다",
  "결과가 좋아도 “운이었다” “더 잘할 수 있었다”고 먼저 깎아내린다",
];

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
        </div>

        {/* 공감 사례 불렛 */}
        <div className="rounded-xl border-2 border-[var(--foreground)]/15 bg-[var(--surface)] p-5">
          <p className="mb-3 text-sm font-semibold text-[var(--foreground)]">
            이런 순간, 어딘가 익숙하지 않으세요?
          </p>
          <ul className="space-y-2.5">
            {EVERYDAY_EXAMPLES.map((example) => (
              <li
                key={example}
                className="flex items-start gap-2.5 text-sm leading-relaxed text-[var(--foreground)]/80"
              >
                <span
                  aria-hidden
                  className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--foreground)]"
                />
                <span>{example}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-relaxed text-[var(--foreground)]/55">
            하나라도 고개가 끄덕여졌다면, 당신만 겪는 일이 아닙니다.
            직장인 대다수가 한두 번쯤은 지나가는 풍경이고, 다만 그 빈도와
            강도가 어디쯤인지가 다를 뿐이에요.
          </p>
        </div>

        <div className="space-y-3 text-sm leading-relaxed text-[var(--foreground)]/80">
          <p>
            이것은 의지의 문제가 아닙니다. 어린 시절부터 형성된{" "}
            <strong>핵심 신념</strong>과 그에 따른{" "}
            <strong>자동적 사고 패턴</strong>이 만들어낸 심리적 순환이에요.
            바로 아래에서 이 순환의 구조를 먼저 짚고, 다음 실습에서 당신의 경험에
            대입해 볼 거예요.
          </p>
        </div>
      </div>

      {/* 5단계 순환 모델 도식 */}
      <div className="rounded-xl border-2 border-[var(--foreground)]/20 bg-white p-6">
        <h3 className="mb-4 text-base font-semibold text-[var(--foreground)]">
          성취 중독의 순환 메커니즘
        </h3>
        <p className="mb-4 text-sm text-[var(--foreground)]/60">
          성취 중독은 아래 5단계가 반복되며 점점 강화됩니다. 아래 실습에서 이 순환을
          당신의 경험에 직접 대입해 볼 거예요.
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
    </div>
  );
}
