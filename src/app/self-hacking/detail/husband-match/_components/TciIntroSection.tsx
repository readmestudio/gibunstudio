import Link from "next/link";

const PHASE1_CARDS = [
  {
    num: 2,
    title: "구독 데이터 개요",
    desc: "TCI 6축 기질 분석 그래프로 나의 성격 구조를 한눈에",
  },
  {
    num: 3,
    title: "기본 성격 + 기질",
    desc: "성격, 세계관, 내면의 모순, 관계에서의 패턴",
  },
  {
    num: 4,
    title: "관계 패턴 + 갈등",
    desc: "관계 행동 방식, 갈등 해결법, 반복되는 사이클",
  },
  {
    num: 5,
    title: "스트레스 반응",
    desc: "분노 패턴, 트리거, 회복 방법",
  },
  {
    num: 6,
    title: "딜브레이커 + 행복",
    desc: "절대 참을 수 없는 것과 나만의 행복 공식",
  },
  {
    num: "7-8",
    title: "남편 타입 매칭",
    desc: "48개 유형 중 나에게 맞는 배우자 타입 + 상세 프로필",
  },
];

export default function TciIntroSection() {
  return (
    <section className="py-20">
      {/* TCI 소개 */}
      <p className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-3 text-center">
        분석 프레임워크
      </p>
      <h2
        className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] text-center mb-4 leading-snug"
        style={{ wordBreak: "keep-all" }}
      >
        TCI — 타고난 기질과 발전하는 성격을 함께 봅니다
      </h2>
      <p
        className="text-base text-[var(--foreground)]/60 text-center max-w-lg mx-auto mb-6 leading-relaxed"
        style={{ wordBreak: "keep-all" }}
      >
        MBTI는 성격 유형만 봅니다. TCI는 유전적으로 타고난 기질(4가지)과
        경험으로 발전하는 성격(3가지)을 함께 분석합니다. 유튜브 구독 채널을
        분석해 당신의 성격 구조를 파악합니다.
      </p>

      {/* 핵심 메시지 */}
      <div className="border-y-2 border-[var(--foreground)]/10 py-6 mb-12 text-center">
        <p
          className="text-lg sm:text-xl font-semibold text-[var(--foreground)]"
          style={{ wordBreak: "keep-all" }}
        >
          9장 카드, 즉시 발급, 완전 무료.
        </p>
      </div>

      {/* Phase 1 카드 미리보기 */}
      <h3 className="text-lg font-bold text-[var(--foreground)] mb-6">
        무료 리포트에서 받게 되는 카드
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-10">
        {PHASE1_CARDS.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border-2 border-[var(--foreground)] p-4 transition-shadow hover:shadow-[4px_4px_0_var(--foreground)]"
          >
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[var(--foreground)] text-white text-[10px] font-bold mb-2">
              {card.num}
            </span>
            <h4 className="text-sm font-bold text-[var(--foreground)] mb-1">
              {card.title}
            </h4>
            <p className="text-xs text-[var(--foreground)]/50 leading-relaxed">
              {card.desc}
            </p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center">
        <Link
          href="/husband-match/birth-info"
          className="inline-flex items-center gap-2 px-8 py-3 text-base font-medium text-[var(--foreground)] bg-[var(--accent)] border-2 border-[var(--accent)] rounded-lg transition-all hover:bg-[var(--accent-hover)]"
        >
          무료 분석 시작하기 →
        </Link>
      </div>
    </section>
  );
}
