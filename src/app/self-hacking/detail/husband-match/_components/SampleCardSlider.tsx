"use client";

const SAMPLE_CARDS = [
  {
    subtitle: "Type",
    title: "당신은 고독한 지적 방랑자 타입이에요",
    tags: ["#내면의탐험가", "#자유로운영혼", "#의미추구자"],
    body: `당신은 스스로의 길을 닦는 사람입니다. 남들이 가지 않는 길을 택하고, 자신만의 방식으로 삶을 꾸려갑니다. 흔들리지 않는 뿌리처럼 단단해 보이죠.

하지만 그 독립성 안에는 보이지 않는 갈증이 있습니다. 이 길이 정말 의미 있는 것인지, 세상과 어떻게 연결될 수 있는지 끊임없이 질문합니다.

→ 겉으로는 독립적이지만, 내면 깊숙이 세상과의 연결을 갈구하는 사람

새로운 지식이나 경험을 접할 때, 당신은 그것을 그저 받아들이지 않습니다. 곧바로 자신의 삶에 어떻게 적용하고 확장시킬 수 있을지 고민해요.

→ 예측 불가능한 매력 뒤에 숨겨진 섬세한 관찰자의 면모

관계의 시작에 주저함이 없습니다. 하지만 관계가 깊어지려고 할 때, 당신은 문득 한 발짝 물러서는 패턴을 보입니다.`,
  },
  {
    subtitle: "스트레스 반응",
    title: "당신은 스트레스를 받으면 이렇게 행동해요",
    body: `당신은 평온한 수면 아래에서 거대한 에너지를 응축하는 사람입니다. 겉으로는 고요해 보이지만, 내면에서는 한계에 대한 명확한 기준을 가지고 있어요.

당신이 화가 나면
→ 감정을 억누르다 결국 예상치 못한 방식으로 터뜨리는 사람

사소한 불만이 쌓여도, 겉으로는 아무렇지 않은 척 행동해요. 말없이 주변을 정리하기 시작하거나, 해야 할 일에 더 깊이 몰두하죠.

이런 상황에서 한계가 온다
→ 스스로의 자율성이 침해되거나, 노력이 무시될 때

✓ 새로운 지식을 탐구하며 몰입해요
✓ 익숙한 곳을 벗어나 새로운 환경을 찾아 나서요
✓ 글을 쓰거나, 생각들을 정리하는 시간을 가져요`,
  },
  {
    subtitle: "관계 인사이트",
    title: "견디기 힘든 상대방의 단점",
    body: `도저히 참기 힘든 것
매일 쏟아지는 감정.

왜 이게 힘든지
→ 감정적 공간이 필요한 사람. 빼앗기면 자기를 잃어버리는 느낌.

상대가 매일 감정을 쏟아내면, 슬쩍 뒷걸음질 치게 돼요. 냉정한 게 아니에요. 각자의 공간이 있어야 관계가 숨 쉴 수 있다는 걸 아는 거예요.

이 패턴이 관계에서 나타나는 방식
→ 돌봄을 주고도 돌봄을 못 받는 관계의 불균형

하지만 이것이 강점이에요
→ 경계를 지키는 사람은, 관계를 오래 유지하는 사람

자기를 잃지 않으면서 사랑하는 법을 아는 거예요.`,
  },
  {
    subtitle: "매칭 결과",
    title: "당신의 완벽한 파트너",
    body: `→ 미지의 대륙을 함께 탐험하며 당신의 세계를 넓혀줄 사람

당신 앞에 나타난 이 사람은 미지의 대륙을 함께 탐험하는 모험가와 같아요. 낯선 길을 두려워하지 않는 사람.

당신의 내면 깊숙한 곳에서 샘솟는 자기초월의 욕구, 그리고 삶의 방향을 스스로 주도하려는 자율성. 이 모든 것을 이 사람은 이해하고, 심지어 함께 나아갈 준비가 되어 있어요.

이 사람이 옆에 있으면
→ 당신의 망설임을 깨고 세상 밖으로 이끌어 줄 사람

생각이 너무 많아 행동으로 옮기기 망설여질 때, 이 사람은 이미 당신의 손을 잡고 문 밖으로 나서고 있어요.

모험가형 — 탐험가 (외향)
매칭 점수: 77%`,
  },
];

export default function SampleCardSlider() {
  const cards = [...SAMPLE_CARDS, ...SAMPLE_CARDS];

  return (
    <div className="py-12 -mx-4 overflow-hidden">
      <div
        className="flex gap-5 hover:[animation-play-state:paused]"
        style={{
          animation: "slideCards 45s linear infinite",
          width: "max-content",
        }}
      >
        {cards.map((card, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-[300px] rounded-2xl border-2 border-[var(--foreground)] bg-white p-6 flex flex-col overflow-hidden"
            style={{ height: 480 }}
          >
            {/* subtitle */}
            <p className="text-[11px] font-medium text-[var(--foreground)]/40 mb-2 tracking-wider">
              {card.subtitle}
            </p>
            {/* title */}
            <h3
              className="text-lg font-bold text-[var(--foreground)] mb-4 leading-snug"
              style={{ wordBreak: "keep-all" }}
            >
              {card.title}
            </h3>
            {/* tags */}
            {card.tags && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 text-[11px] font-medium bg-[var(--surface)] text-[var(--foreground)]/70 rounded-full border border-[var(--border)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {/* body */}
            <div className="flex-1 overflow-hidden relative">
              <p
                className="text-sm leading-[1.8] text-[var(--foreground)]/70 whitespace-pre-line"
                style={{ wordBreak: "keep-all" }}
              >
                {card.body}
              </p>
              {/* 하단 페이드아웃 */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            </div>
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
    </div>
  );
}
