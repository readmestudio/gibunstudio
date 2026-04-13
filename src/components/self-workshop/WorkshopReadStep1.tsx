"use client";

import Link from "next/link";

export function WorkshopReadStep1() {
  return (
    <div className="mx-auto max-w-lg space-y-8">
      {/* 제목 */}
      <div>
        <h2 className="text-2xl font-bold text-[var(--foreground)]">
          성취 중독이란 무엇인가
        </h2>
        <p className="mt-2 text-sm text-[var(--foreground)]/60">
          읽기 | 약 3~5분
        </p>
      </div>

      {/* 정의 */}
      <div className="space-y-4 text-sm leading-relaxed text-[var(--foreground)]/80">
        <p>
          성취 중독(Achievement Addiction)이란, <strong>자기 가치를 오직 성취와 성과에서만
          확인하려는 반복적 패턴</strong>을 말합니다.
        </p>
        <p>
          단순히 &quot;열심히 사는 것&quot;과는 다릅니다. 성취 중독자는 목표를 달성해도
          만족감이 오래 가지 않고, 곧바로 다음 목표로 달려갑니다. 쉬는 것에 죄책감을
          느끼고, 성과가 없는 자신을 가치 없다고 느낍니다.
        </p>
        <p>
          이것은 의지의 문제가 아닙니다. 어린 시절부터 형성된 <strong>핵심 신념</strong>과
          그에 따른 <strong>자동적 사고 패턴</strong>이 만들어낸 심리적 순환입니다.
        </p>
      </div>

      {/* 비교표 */}
      <div className="rounded-xl border-2 border-[var(--foreground)]/20 overflow-hidden">
        <div className="grid grid-cols-2">
          <div className="border-b-2 border-r-2 border-[var(--foreground)]/20 bg-[var(--surface)] p-4">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              건강한 성취 동기
            </p>
          </div>
          <div className="border-b-2 border-[var(--foreground)]/20 bg-[var(--surface)] p-4">
            <p className="text-sm font-semibold text-[var(--foreground)]">
              성취 중독
            </p>
          </div>
          {COMPARISONS.map((c, i) => (
            <div key={i} className="contents">
              <div className="border-b border-r-2 border-[var(--foreground)]/10 p-4">
                <p className="text-xs text-[var(--foreground)]/70">{c.healthy}</p>
              </div>
              <div className="border-b border-[var(--foreground)]/10 p-4">
                <p className="text-xs text-[var(--foreground)]/70">{c.addicted}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 핵심 키워드 카드 */}
      <div>
        <h3 className="mb-3 text-base font-semibold text-[var(--foreground)]">
          성취 중독의 핵심 키워드
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {KEYWORDS.map((kw) => (
            <div
              key={kw.title}
              className="rounded-xl border-2 border-[var(--foreground)]/20 p-4"
            >
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {kw.title}
              </p>
              <p className="mt-1 text-xs text-[var(--foreground)]/60">
                {kw.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 안내 */}
      <div className="rounded-xl border-2 border-[var(--foreground)]/10 bg-[var(--surface)] p-4">
        <p className="text-sm text-[var(--foreground)]/60">
          다음 단계에서 간단한 자가 진단 테스트를 통해
          나의 성취 패턴이 어느 수준인지 확인해 볼 거예요.
        </p>
      </div>

      {/* 다음 */}
      <div className="text-center">
        <Link
          href="/dashboard/self-workshop/step/2"
          className="inline-flex rounded-xl border-2 border-[var(--foreground)] px-8 py-4 text-base font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
        >
          진단 시작하기 →
        </Link>
      </div>
    </div>
  );
}

const COMPARISONS = [
  { healthy: "목표 달성 후 만족감을 느낀다", addicted: "달성해도 금방 공허해진다" },
  { healthy: "쉬는 것이 자연스럽다", addicted: "쉬면 죄책감이 든다" },
  { healthy: "실패를 배움으로 받아들인다", addicted: "실패 = 나의 가치 하락" },
  { healthy: "성과와 무관하게 나를 좋아한다", addicted: "성과 없으면 존재 가치가 없다" },
  { healthy: "과정 자체를 즐길 수 있다", addicted: "결과만이 의미 있다" },
];

const KEYWORDS = [
  { title: "자기 가치의 외부 의존", description: "내 가치를 성적, 연봉, 타인의 평가에서 확인하려 한다" },
  { title: "끝나지 않는 목표 이동", description: "하나를 이루면 바로 다음 목표로, 만족의 순간이 없다" },
  { title: "휴식에 대한 죄책감", description: "쉬는 것이 곧 게으름이라는 믿음" },
  { title: "실패 공포", description: "실패하면 모든 것을 잃을 것 같은 두려움" },
];
