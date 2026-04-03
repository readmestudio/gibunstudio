const PHASE2_CARDS = [
  {
    num: 1,
    title: "교차 검증",
    desc: "YouTube 데이터 vs 설문 응답, 일치도를 수치로 확인",
  },
  {
    num: 2,
    title: "인생 가치관",
    desc: "삶에서 진짜 추구하는 것, 숨겨진 욕망",
  },
  {
    num: 3,
    title: "무의식 욕구",
    desc: "의식이 모르는 욕구와 위안의 원천",
  },
  {
    num: 4,
    title: "감정 도미노",
    desc: "CBT 기반 자동적 사고와 인지 왜곡 분석",
  },
  {
    num: 5,
    title: "핵심 신념",
    desc: "관계를 지배하는 보이지 않는 규칙",
  },
  {
    num: 6,
    title: "관계 영향",
    desc: "핵심 신념이 만드는 반복되는 관계 패턴",
  },
  {
    num: 7,
    title: "두려움",
    desc: "가장 깊은 곳에 있는 관계의 두려움",
  },
  {
    num: 8,
    title: "성장 포인트",
    desc: "관계·혼자·마음습관 3가지 실천 과제",
  },
];

export default function Phase2Detail() {
  return (
    <section className="py-20 -mx-4 px-4 bg-[var(--foreground)] text-white">
      <div className="max-w-2xl mx-auto">
        {/* 배지 */}
        <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-white/20 text-white mb-6">
          Phase 2 · ₩9,900
        </span>

        <h2
          className="text-2xl sm:text-3xl font-bold leading-snug mb-4"
          style={{ wordBreak: "keep-all" }}
        >
          심층 리포트에서 알 수 있는 것
        </h2>
        <p
          className="text-base text-white/60 leading-relaxed mb-4"
          style={{ wordBreak: "keep-all" }}
        >
          심층 리포트는 &lsquo;나의 핵심 신념을 발굴하고, 내가 왜 결혼이라는
          환경에서 어떤 반응을 일으킬 수밖에 없는가&rsquo;를 파고듭니다.
        </p>
        <p
          className="text-base text-white/60 leading-relaxed mb-12"
          style={{ wordBreak: "keep-all" }}
        >
          심층 리포트 결제 시 18문항 심층 검사가 진행됩니다. 구독 리스트와
          18문항 심층 문항을 교차 분석해, 당신이 왜 그런 반응을 일으킬 수밖에
          없는지 — 그 뿌리까지 파고듭니다.
        </p>

        {/* Phase 2 카드 그리드 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PHASE2_CARDS.map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-white/20 p-4 transition-colors hover:bg-white/5"
            >
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-white text-[var(--foreground)] text-[10px] font-bold mb-2">
                {card.num}
              </span>
              <h4 className="text-sm font-bold text-white mb-1">
                {card.title}
              </h4>
              <p className="text-xs text-white/50 leading-relaxed">
                {card.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
