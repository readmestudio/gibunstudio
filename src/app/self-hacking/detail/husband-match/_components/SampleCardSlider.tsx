"use client";

const SAMPLE_CARDS = [
  {
    subtitle: "구독 데이터 개요",
    title: "당신의 구독 목록에는 취향 말고도 적혀 있는 게 있어요",
    body: "37개 채널 분석 완료. 교육/자기계발 41%, 브이로그 19%, 뷰티/패션 11%. 자기초월 100점, 자율성 77점, 위험회피 17점. 상위 3%의 희소한 구독 패턴.",
  },
  {
    subtitle: "Type",
    title: "당신은 고독한 지적 방랑자 타입이에요",
    tags: ["#내면의탐험가", "#자유로운영혼", "#의미추구자"],
    body: "겉으로는 독립적이지만, 내면 깊숙이 세상과의 연결을 갈구하는 사람. 남들이 가지 않는 길을 택하고, 자신만의 방식으로 삶을 꾸려갑니다.",
  },
  {
    subtitle: "스트레스 반응",
    title: "당신은 스트레스를 받으면 이렇게 행동해요",
    body: "감정을 억누르다 결국 예상치 못한 방식으로 터뜨리는 사람. 자율성이 침해되거나 노력이 무시될 때 가장 큰 스트레스를 받아요.",
  },
  {
    subtitle: "관계 인사이트",
    title: "견디기 힘든 상대방의 단점",
    body: "매일 쏟아지는 감정. 감정적 공간이 필요한 사람. 빼앗기면 자기를 잃어버리는 느낌. 경계를 지키는 사람은, 관계를 오래 유지하는 사람이에요.",
  },
  {
    subtitle: "매칭 결과",
    title: "당신의 완벽한 파트너",
    body: "미지의 대륙을 함께 탐험하며 당신의 세계를 넓혀줄 사람. 모험가형 — 탐험가 (외향). 매칭 점수 77%.",
  },
  {
    subtitle: "파트너 프로필",
    title: "파트너와의 일상",
    body: "굳이 애쓰지 않아도 서로의 존재만으로 충만함을 느끼는 시간. 서로의 리듬을 존중하되, 필요할 때 자연스럽게 개입하는 관계.",
  },
];

export default function SampleCardSlider() {
  const cards = [...SAMPLE_CARDS, ...SAMPLE_CARDS];

  return (
    <section className="py-12 -mx-4 overflow-hidden">
      <div
        className="flex gap-4 hover:[animation-play-state:paused]"
        style={{
          animation: "slideCards 35s linear infinite",
          width: "max-content",
        }}
      >
        {cards.map((card, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-[280px] rounded-2xl border-2 border-[var(--foreground)] bg-white p-5 flex flex-col"
            style={{ minHeight: 220 }}
          >
            {/* subtitle */}
            <p className="text-xs font-medium text-[var(--foreground)]/50 mb-1">
              {card.subtitle}
            </p>
            {/* title */}
            <h3
              className="text-base font-bold text-[var(--foreground)] mb-3 leading-snug"
              style={{ wordBreak: "keep-all" }}
            >
              {card.title}
            </h3>
            {/* tags */}
            {card.tags && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-[10px] font-medium bg-[var(--surface)] text-[var(--foreground)]/70 rounded-full border border-[var(--border)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {/* body */}
            <p
              className="text-sm leading-relaxed text-[var(--foreground)]/60 line-clamp-4"
              style={{ wordBreak: "keep-all" }}
            >
              {card.body}
            </p>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes slideCards {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </section>
  );
}
