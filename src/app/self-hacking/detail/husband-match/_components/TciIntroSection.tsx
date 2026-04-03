"use client";

import Link from "next/link";

const PHONE_CARDS = [
  {
    label: "TCI 6축 기질 분석",
    subtitle: "구독 데이터 개요",
    title: "당신의 구독 목록에는 취향 말고도 적혀 있는 게 있어요",
    body: `37개 채널 분석 완료

교육/자기계발 41%
브이로그/일상 19%
뷰티/패션 11%

자기초월 ████████████ 100
자율성 ██████████ 77
인내력 ████████ 61
연대감 ██████ 49
자극추구 █████ 44
위험회피 ██ 17

상위 3%의 희소한 구독 패턴`,
  },
  {
    label: "나의 성격 유형",
    subtitle: "Type",
    title: "당신은 고독한 지적 방랑자 타입이에요",
    body: `#내면의탐험가 #자유로운영혼 #의미추구자

당신의 근본 성격
→ 겉으로는 독립적이지만, 내면 깊숙이 세상과의 연결을 갈구하는 사람

남들이 가지 않는 길을 택하고, 자신만의 방식으로 삶을 꾸려갑니다.

아무도 모르는 당신의 습관
→ 예측 불가능한 매력 뒤에 숨겨진 섬세한 관찰자의 면모

내면의 모순
→ 자유롭게 탐험하고 싶지만, 동시에 깊은 뿌리를 내리고자 하는 이중성`,
  },
  {
    label: "관계 패턴",
    subtitle: "스트레스 반응",
    title: "당신은 스트레스를 받으면 이렇게 행동해요",
    body: `당신이 화가 나면
→ 감정을 억누르다 결국 예상치 못한 방식으로 터뜨리는 사람

사소한 불만이 쌓여도, 겉으로는 아무렇지 않은 척 행동해요.

이런 상황에서 한계가 온다
→ 자율성이 침해되거나, 노력이 무시될 때

당신만의 회복법
✓ 새로운 지식을 탐구하며 몰입
✓ 익숙한 곳을 벗어나 새로운 환경 탐색
✓ 글을 쓰거나, 생각을 정리하는 시간`,
  },
  {
    label: "딜브레이커 + 행복",
    subtitle: "관계 인사이트",
    title: "견디기 힘든 상대방의 단점",
    body: `도저히 참기 힘든 것
매일 쏟아지는 감정.

왜 이게 힘든지
→ 감정적 공간이 필요한 사람. 빼앗기면 자기를 잃어버리는 느낌.

이 패턴이 관계에서 나타나는 방식
→ 돌봄을 주고도 돌봄을 못 받는 관계의 불균형

하지만 이것이 강점이에요
→ 경계를 지키는 사람은, 관계를 오래 유지하는 사람`,
  },
  {
    label: "나에게 맞는 배우자",
    subtitle: "매칭 결과",
    title: "당신의 완벽한 파트너",
    body: `→ 미지의 대륙을 함께 탐험하며 당신의 세계를 넓혀줄 사람

모험가형 — 탐험가 (외향)
매칭 점수: 77%

이 사람이 옆에 있으면
→ 당신의 망설임을 깨고 세상 밖으로 이끌어 줄 사람

왜 하필 이 사람인가
→ 당신의 미완의 지도를 완성해 줄 탐험가`,
  },
];

export default function TciIntroSection() {
  return (
    <section className="py-20">
      {/* 제목 영역 */}
      <h2
        className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] text-center mb-3 leading-snug"
        style={{ wordBreak: "keep-all" }}
      >
        무료 리포트만으로 알게 되는 것
      </h2>
      <p
        className="text-base text-[var(--foreground)]/50 text-center mb-4"
        style={{ wordBreak: "keep-all" }}
      >
        너무 적나라해서 충격적일 수 있으니 주의하세요
      </p>
      <div className="border-y-2 border-[var(--foreground)]/10 py-5 mb-12 text-center">
        <p className="text-lg sm:text-xl font-semibold text-[var(--foreground)]">
          9장 카드, 즉시 발급, 완전 무료.
        </p>
      </div>

      {/* 폰 목업 가로 스크롤 */}
      <div className="-mx-4 overflow-x-auto scrollbar-hide pb-4">
        <div className="flex gap-6 px-4" style={{ width: "max-content" }}>
          {PHONE_CARDS.map((card) => (
            <div key={card.label} className="flex flex-col items-center">
              {/* 라벨 */}
              <p
                className="text-sm font-semibold text-[var(--foreground)] mb-3 text-center"
                style={{ wordBreak: "keep-all" }}
              >
                {card.label}
              </p>
              {/* 폰 프레임 */}
              <div className="w-[220px] rounded-[2rem] border-2 border-[var(--foreground)] bg-white p-3 shadow-[4px_4px_0_var(--foreground)]/5">
                {/* 노치 */}
                <div className="mx-auto w-20 h-4 rounded-b-lg bg-[var(--foreground)] mb-3" />
                {/* 카드 콘텐츠 */}
                <div className="px-2 overflow-hidden relative" style={{ height: 340 }}>
                  <p className="text-[9px] text-[var(--foreground)]/40 mb-1">
                    {card.subtitle}
                  </p>
                  <h4
                    className="text-xs font-bold text-[var(--foreground)] mb-2 leading-snug"
                    style={{ wordBreak: "keep-all" }}
                  >
                    {card.title}
                  </h4>
                  <p
                    className="text-[10px] leading-[1.7] text-[var(--foreground)]/60 whitespace-pre-line"
                    style={{ wordBreak: "keep-all" }}
                  >
                    {card.body}
                  </p>
                  {/* 하단 페이드 */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                </div>
                {/* 하단 바 */}
                <div className="mt-2 mx-auto w-20 h-1 rounded-full bg-[var(--foreground)]/15" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center mt-10">
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
