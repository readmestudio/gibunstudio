/**
 * 기분 스튜디오 커리큘럼 플로우 — 4단계 여정 + 도달점 도식
 * 나에 대한 이해 → 관계 속의 나 → 실전 적용 → 완전한 얼라인 → [기분 좋은 상태]
 */

import { Fragment } from "react";

const CURRICULUM = [
  {
    number: 1,
    title: "나에 대한 이해",
    description:
      "핵심 신념, 감정 패턴, 애착 유형을 데이터로 확인해요",
    tag: "셀프 해킹 리포트",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
      </svg>
    ),
  },
  {
    number: 2,
    title: "관계 속의 나",
    description:
      "내가 사람과 사회에서 어떻게 작용하는지 탐색해요",
    tag: "셀프 워크샵",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0z" />
      </svg>
    ),
  },
  {
    number: 3,
    title: "실전 적용",
    description:
      "상담사와 함께 원인을 찾고, 실제 삶에 적용해요",
    tag: "1:1 Zoom 상담",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
  },
  {
    number: 4,
    title: "완전한 얼라인",
    description:
      "인식하는 나와 살아가는 내가 일치하는 순간",
    tag: null,
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
];

function ChevronRight() {
  return (
    <svg
      className="hidden lg:block w-6 h-6 text-[var(--foreground)]/30 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg
      className="block lg:hidden w-6 h-6 text-[var(--foreground)]/30 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
    </svg>
  );
}

export function SelfHackingElements() {
  return (
    <section>
      <div className="container px-5 py-24 mx-auto lg:px-24">
        <div className="flex flex-col w-full mb-12 text-center">
          <h2
            className="mb-6 text-4xl font-bold text-[var(--foreground)] md:text-8xl lg:text-6xl"
            style={{ wordBreak: "keep-all" }}
          >
            패턴을 깨고 나로 살아가는 여정
          </h2>
          <p
            className="mx-auto text-lg leading-snug text-[var(--foreground)]/70 lg:w-1/2"
            style={{ wordBreak: "keep-all" }}
          >
            나를 이해하고, 관계를 해독하고, 삶에 적용하는 전체 여정이에요.
          </p>
        </div>

        {/* 커리큘럼 플로우: 4단계 카드 */}
        <div className="flex flex-col lg:flex-row items-stretch justify-center gap-3 lg:gap-2 max-w-5xl mx-auto">
          {CURRICULUM.map((step, i) => {
            const isLast = i === CURRICULUM.length - 1;
            return (
              <Fragment key={step.number}>
                <div
                  className="flex flex-col items-center p-6 text-center rounded-2xl border border-[var(--border)] w-full lg:flex-1 min-h-[200px] justify-center"
                >
                  <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-full bg-[var(--surface)] text-[var(--foreground)]">
                    {step.icon}
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-[var(--foreground)]">
                    {step.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed text-[var(--foreground)]/70"
                    style={{ wordBreak: "keep-all" }}
                  >
                    {step.description}
                  </p>
                  {step.tag && (
                    <span className="mt-3 inline-block text-xs text-[var(--foreground)]/50 border border-[var(--foreground)]/20 rounded-full px-3 py-0.5">
                      {step.tag}
                    </span>
                  )}
                </div>

                {!isLast && (
                  <>
                    <ChevronRight />
                    <ChevronDown />
                  </>
                )}
              </Fragment>
            );
          })}
        </div>

        {/* 도달점: 기분 좋은 상태 */}
        <div className="flex flex-col items-center mt-8 max-w-5xl mx-auto">
          {/* 아래 화살표 */}
          <svg
            className="w-6 h-6 text-[var(--foreground)]/30 mb-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
          </svg>

          {/* 도달점 배지 */}
          <div className="flex flex-col items-center justify-center w-full max-w-xs p-8 text-center rounded-2xl bg-[var(--accent-muted)] border-2 border-[var(--foreground)]">
            <div className="flex items-center justify-center w-14 h-14 mb-4 rounded-full bg-white text-[var(--foreground)]">
              <svg fill="none" stroke="currentColor" strokeWidth={1.5} className="w-8 h-8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-[var(--foreground)]">
              기분 좋은 상태
            </h3>
            <p
              className="text-sm leading-relaxed text-[var(--foreground)]/70"
              style={{ wordBreak: "keep-all" }}
            >
              선택이 달라지고, 기분 좋은 날이 많아져요
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
