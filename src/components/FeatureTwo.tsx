"use client";

const STEPS = [
  {
    number: 1,
    text: "같은 감정, 같은 선택, 같은 결과. 반복되는 이유를 모르면, 바꿀 수가 없어요.",
  },
  {
    number: 2,
    text: "기분 스튜디오는 가치관, 핵심 신념, 감정 패턴, 애착 유형을 구조적으로 풀어요. 나에 대한 이해가 출발점이에요.",
  },
  {
    number: 3,
    text: "나를 알면 선택이 달라져요. 연애도, 일도, 관계도. 기분 좋은 날이 많아지는 건 거기서부터예요.",
  },
];

const REPORT_CARDS = [
  {
    subtitle: "Type",
    title: "당신은 고독한 지적 방랑자 타입이에요",
    tags: ["#내면의탐험가", "#자유로운영혼"],
    body: "남들이 가지 않는 길을 택하고, 자신만의 방식으로 삶을 꾸려갑니다. 그 독립성 안에는 보이지 않는 갈증이 있습니다.",
  },
  {
    subtitle: "스트레스 반응",
    title: "당신은 스트레스를 받으면 이렇게 행동해요",
    body: "감정을 억누르다 결국 예상치 못한 방식으로 터뜨리는 사람. 자율성이 침해되거나, 노력이 무시될 때 한계가 옵니다.",
  },
  {
    subtitle: "관계 인사이트",
    title: "견디기 힘든 상대방의 단점",
    body: "매일 쏟아지는 감정. 감정적 공간이 필요한 사람. 경계를 지키는 사람은, 관계를 오래 유지하는 사람이에요.",
  },
  {
    subtitle: "매칭 결과",
    title: "당신의 완벽한 파트너",
    body: "미지의 대륙을 함께 탐험하며 당신의 세계를 넓혀줄 사람. 모험가형 — 탐험가 (외향). 매칭 점수 77%.",
  },
];

export function FeatureTwo() {
  const cards = [...REPORT_CARDS, ...REPORT_CARDS];

  return (
    <section id="howitworks">
      <div className="container items-center px-5 py-24 mx-auto lg:px-24">
        {/* 헤딩 영역 */}
        <div className="flex flex-col w-full mb-6 text-center">
          <h2
            className="mb-6 text-4xl font-bold text-[var(--foreground)] md:text-8xl lg:text-6xl"
            style={{ wordBreak: "keep-all" }}
          >
            Hack yourself.
            <br />
            Freedom begins.
          </h2>
          <p
            className="mx-auto text-lg leading-snug text-[var(--foreground)]/70 lg:w-1/2"
            style={{ wordBreak: "keep-all" }}
          >
            나를 이해하는 순간, 선택할 수 있게 돼요.
          </p>
        </div>

        {/* 2컬럼 그리드 */}
        <div className="grid items-center w-full grid-cols-1 pt-20 mx-auto lg:grid-cols-2 gap-12">
          {/* 왼쪽: 3개 번호 항목 */}
          <div className="max-w-lg mx-auto lg:mx-0">
            <ol role="list" className="overflow-hidden">
              {STEPS.map((step) => (
                <li key={step.number} className="relative pb-10">
                  <div className="relative flex items-start group">
                    <div className="flex items-center h-9">
                      <span className="relative z-10 flex items-center justify-center w-8 h-8 text-sm text-white bg-[var(--foreground)] rounded-full">
                        {step.number}
                      </span>
                    </div>
                    <p
                      className="ml-4 text-lg text-[var(--foreground)]/70 leading-relaxed"
                      style={{ wordBreak: "keep-all" }}
                    >
                      {step.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* 오른쪽: 1개 폰 목업 + 리포트 카드 슬라이드 */}
          <div className="flex flex-col items-center">
            <div className="w-[240px] rounded-[2.5rem] border-[4px] border-[var(--foreground)] bg-white p-2 shadow-lg overflow-hidden">
              {/* 노치 */}
              <div className="mx-auto w-20 h-4 rounded-b-xl bg-[var(--foreground)] relative z-10" />
              {/* 슬라이드 영역 */}
              <div className="overflow-hidden relative" style={{ height: 380 }}>
                <div
                  className="flex flex-col gap-4"
                  style={{
                    animation: "slideReportCards 20s linear infinite",
                  }}
                >
                  {cards.map((card, i) => (
                    <div key={i} className="flex-shrink-0 px-3 py-4">
                      <p className="text-[9px] text-[var(--foreground)]/40 mb-1">
                        {card.subtitle}
                      </p>
                      <h4
                        className="text-[11px] font-bold text-[var(--foreground)] mb-2 leading-snug"
                        style={{ wordBreak: "keep-all" }}
                      >
                        {card.title}
                      </h4>
                      {card.tags && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {card.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 text-[8px] font-medium bg-[var(--surface)] text-[var(--foreground)]/60 rounded-full border border-[var(--border)]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <p
                        className="text-[10px] leading-[1.7] text-[var(--foreground)]/60"
                        style={{ wordBreak: "keep-all" }}
                      >
                        {card.body}
                      </p>
                    </div>
                  ))}
                </div>
                {/* 상하 페이드 */}
                <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white to-transparent pointer-events-none z-10" />
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />
              </div>
            </div>
            <p className="mt-4 text-sm font-medium text-[var(--foreground)]/70">
              배우자 기질 적합성 검사 리포트
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideReportCards {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-50%);
          }
        }
      `}</style>
    </section>
  );
}
