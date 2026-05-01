/**
 * [04] 5월의 워크북 — '성취 중독자' 단독 큐레이션
 *
 * 스티키 CTA "워크북 시작하기"의 스크롤 타겟. id="workbooks".
 * 진단 4문항 체크리스트 미리보기로 공감을 유도.
 */

const PREVIEW_QUESTIONS: string[] = [
  "성과가 없는 하루는 낭비한 하루처럼 느껴진다.",
  "아무것도 안 하고 쉬는 것에 죄책감을 느낀다.",
  "결과가 좋아도, 더 잘할 수 있었을 거라는 아쉬움이 먼저 든다.",
  "조용히 혼자 있으면 불편한 생각이 올라와서, 바쁘게 지내는 게 편하다.",
];

export function StoreWorkbookGridSection() {
  return (
    <section
      id="workbooks"
      className="scroll-mt-24 mx-auto max-w-3xl px-4 py-20"
    >
      <p className="text-center text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-3">
        WORKBOOKS
      </p>

      {/* 월간 큐레이션 헤드라인 */}
      <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold leading-[1.35] text-[var(--foreground)] break-keep">
        5월의 마음 챙김 워크북은
        <br />
        &lsquo;성취 중독자&rsquo;들을 위한 워크북입니다
      </h2>
      <p className="mt-5 text-center text-sm sm:text-base text-[var(--foreground)]/65 max-w-xl mx-auto break-keep leading-relaxed">
        계속 일해도 불안하고, 쉬면 더 불안해지는 마음을 들여다 봅니다.
      </p>

      {/* 진단 미리보기 — 체크리스트 */}
      <div className="mt-12 rounded-2xl border-2 border-[var(--foreground)] bg-white p-7 sm:p-10">
        <p className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/45">
          성취 중독 자가 진단 — 미리보기
        </p>
        <h3 className="mt-3 text-xl sm:text-2xl font-bold text-[var(--foreground)] break-keep">
          이런 생각, 자주 드시나요?
        </h3>

        <ul className="mt-7 sm:mt-8 space-y-4 sm:space-y-5">
          {PREVIEW_QUESTIONS.map((q, idx) => (
            <li
              key={idx}
              className="flex items-start gap-3 sm:gap-4"
            >
              <span
                aria-hidden
                className="mt-0.5 inline-flex h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0 items-center justify-center rounded-full bg-[var(--foreground)] text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <p className="text-base sm:text-[17px] leading-relaxed text-[var(--foreground)] break-keep">
                {q}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-8 pt-7 border-t border-[var(--foreground)]/10">
          <p className="text-sm leading-relaxed text-[var(--foreground)]/65 break-keep">
            이 외{" "}
            <strong className="font-semibold text-[var(--foreground)]">
              16문항으로 4개 영역
            </strong>
            (자기 가치 조건화 · 과잉 추동 · 실패 공포 · 정서적 회피)을 정확히 측정하고,{" "}
            <strong className="font-semibold text-[var(--foreground)]">
              문장 완성 검사 14문항
            </strong>
            으로 그 아래 숨은 신념까지 들여다봅니다.
          </p>
        </div>
      </div>
    </section>
  );
}
