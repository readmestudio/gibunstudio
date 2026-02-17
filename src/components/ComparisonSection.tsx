/**
 * 비교 섹션: 기존 심리 상담 vs 셀프 해킹
 * 프로그램 카드 ↔ 브랜드 스토리 사이에 삽입
 */

const OLD_WAY = [
  "매번 처음부터 내 이야기를 설명해야 한다",
  "상담사의 주관에 의존한다",
  "대화 중심, 구조화되지 않은 진행",
  "뚜렷한 답 없이 상담이 종료된다",
  "수동적으로 참여한다",
];

const NEW_WAY = [
  "리포트가 먼저, 대화는 그 다음",
  "데이터 기반 객관적 분석",
  "구조화된 셀프 해킹 시스템",
  "패턴의 근본 원인까지 도달",
  "능동적으로 나를 해킹한다",
];

export function ComparisonSection() {
  return (
    <section
      className="relative bg-center bg-no-repeat bg-cover"
      style={{ backgroundImage: "url('/patterns/patternBottom.svg')" }}
    >
      {/* 배경 패턴 위 반투명 오버레이 — doodle이 텍스트를 가리지 않도록 */}
      <div className="absolute inset-0 bg-white/80" />

      <div className="container relative z-10 px-5 py-24 mx-auto lg:px-24">
        <div className="flex flex-col w-full mb-12 text-center">
          <h2
            className="mb-6 text-4xl font-bold text-[var(--foreground)] md:text-8xl lg:text-6xl"
            style={{ wordBreak: "keep-all" }}
          >
            상담을 받아봤는데,
            <br className="hidden lg:block" />
            달라진 게 없다면
          </h2>
          <p className="mx-auto text-lg leading-snug text-[var(--foreground)]/70 lg:w-1/2">
            기존 상담과 셀프 해킹은 출발점이 다릅니다.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {/* 왼쪽: 기존 상담 (뮤트 톤) */}
          <div className="p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <h3 className="mb-6 text-lg font-semibold text-[var(--foreground)]/50">
              기존 심리 상담
            </h3>
            <ul className="space-y-4">
              {OLD_WAY.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-[var(--foreground)]/50">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                  </svg>
                  <span className="text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 오른쪽: 셀프 해킹 (강조 톤) */}
          <div className="p-8 rounded-2xl border-2 border-[var(--foreground)] bg-white">
            <h3 className="mb-6 text-lg font-semibold text-[var(--foreground)]">
              기분 스튜디오 셀프 해킹
            </h3>
            <ul className="space-y-4">
              {NEW_WAY.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-[var(--foreground)]">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
