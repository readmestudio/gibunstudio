/**
 * 비교 섹션: 기존 심리 상담 vs 셀프 해킹
 * 프로그램 카드 ↔ 브랜드 스토리 사이에 삽입
 */

const OLD_WAY = [
  "막연하게 '나를 알아야 한다'고 느끼기만 해요",
  "자기계발 콘텐츠를 봐도 와닿지 않아요",
  "혼자 생각만 하다가 같은 자리로 돌아와요",
  "뭘 원하는지 몰라서 결정을 못 내려요",
  "관계에서 같은 패턴이 반복돼요",
];

const NEW_WAY = [
  "리포트가 먼저. 내 패턴을 데이터로 봐요",
  "가치관, 핵심 신념, 감정 패턴을 구조적으로 분석해요",
  "단계가 있어요. 어디까지 왔는지 보여요",
  "반복되는 패턴의 원인까지 도달해요",
  "진짜 내가 원하는 걸 알게 돼요",
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
            나를 알고 싶은데,
            <br className="hidden lg:block" />
            어디서부터 시작해야 할지 모르겠다면
          </h2>
          <p className="mx-auto text-lg leading-snug text-[var(--foreground)]/70 lg:w-1/2">
            출발점이 달라요.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {/* 왼쪽: 기존 상담 (뮤트 톤) */}
          <div className="p-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <h3 className="mb-6 text-lg font-semibold text-[var(--foreground)]/50">
              혼자서 고민할 때
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
