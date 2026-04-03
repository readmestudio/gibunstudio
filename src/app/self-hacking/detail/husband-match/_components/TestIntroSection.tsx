const KEYWORDS = [
  {
    num: "①",
    title: "나의 기질 · 성격 분석",
    desc: "YouTube 구독 데이터 + TCI 기질 이론",
  },
  {
    num: "②",
    title: "관계 패턴 · 스트레스 반응",
    desc: "갈등 스타일, 딜브레이커, 행복 공식",
  },
  {
    num: "③",
    title: "배우자 타입 매칭",
    desc: "48개 유형 중 나에게 맞는 사람",
  },
];

export default function TestIntroSection() {
  return (
    <section className="py-16">
      <p className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-4">
        이 검사는 이런 검사예요
      </p>
      <h2
        className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] leading-snug mb-4 whitespace-pre-line"
        style={{ wordBreak: "keep-all" }}
      >
        {"나를 깊이 알아야\n나에게 맞는 사람도 보입니다"}
      </h2>
      <p
        className="text-base leading-relaxed text-[var(--foreground)]/60 mb-10"
        style={{ wordBreak: "keep-all" }}
      >
        유튜브 구독 리스트로 먼저 나의 기질, 성격, 관계 패턴을 분석합니다.
        그 결과를 바탕으로 48개 유형 중 나에게 진짜 맞는 배우자 타입까지 찾아드려요.
      </p>

      {/* 3개 키워드 카드 */}
      <div className="grid gap-3 sm:grid-cols-3 mb-10">
        {KEYWORDS.map((kw) => (
          <div
            key={kw.num}
            className="rounded-xl border-2 border-[var(--foreground)] p-5"
          >
            <span className="text-sm font-bold text-[var(--foreground)] mb-2 block">
              {kw.num}
            </span>
            <h3
              className="text-sm font-bold text-[var(--foreground)] mb-1"
              style={{ wordBreak: "keep-all" }}
            >
              {kw.title}
            </h3>
            <p className="text-xs text-[var(--foreground)]/50 leading-relaxed">
              {kw.desc}
            </p>
          </div>
        ))}
      </div>

      {/* 안심 문구 */}
      <p className="text-sm text-[var(--foreground)]/40 text-center">
        약 3분 · 9장 카드 리포트 · 완전 무료
      </p>
    </section>
  );
}
