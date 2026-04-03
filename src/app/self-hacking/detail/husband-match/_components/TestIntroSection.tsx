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
        className="text-base leading-relaxed text-[var(--foreground)]/60"
        style={{ wordBreak: "keep-all" }}
      >
        유튜브 구독 리스트로 먼저 나의 기질, 성격, 관계 패턴을 분석합니다.
        그 결과를 바탕으로 48개 유형 중 나에게 진짜 맞는 배우자 타입까지 찾아드려요.
      </p>
    </section>
  );
}
