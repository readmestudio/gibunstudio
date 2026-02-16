/**
 * 카드 하단 장식 패턴 컴포넌트
 * 홈 히어로 배너와 동일한 patternTop.svg를 카드 하단에 배치
 */
export function CardPatternDecoration() {
  return (
    <div
      className="flex-shrink-0 h-24 sm:h-32 bg-bottom bg-no-repeat bg-cover pointer-events-none"
      style={{
        backgroundImage: "url('/patterns/patternTop.svg')",
        opacity: 0.15,
      }}
      aria-hidden="true"
    />
  );
}
