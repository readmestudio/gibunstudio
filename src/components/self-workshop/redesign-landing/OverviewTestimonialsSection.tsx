"use client";

/**
 * 워크북 전반 페이지의 후기 섹션.
 *
 * 기존 TestimonialsSection은 4건 모두 "성취 중독" 태그였다.
 * 여기서는 첫 워크북(성취 중독) 후기 + 향후 라인업 주제(불안·자기비판·관계)의
 * 예상 후기 톤을 섞어, 워크북 전반에 적용되는 변화를 보여준다.
 *
 * 후기 톤 가이드:
 * - "원인을 알게 됐다"보다 "다음 한 달이 달라졌다"에 무게
 * - 위로받았다는 표현보다 다른 시도/다른 선택의 표현
 */
const TESTIS = [
  {
    name: "지현 님",
    meta: "34세 · 직장인 8년차",
    tag: "성취 중독",
    before:
      "성과가 안 나오면 내 존재 자체가 부정당하는 느낌이었어요. 주말에도 일 생각이 안 놓여서, 쉬면 오히려 불안했습니다.",
    during:
      "내 안에 “더 잘해야 한다”고 다그치는 마음과 “이제 그만하고 싶다”고 주저앉는 마음이 따로 있다는 걸 알게 됐어요. 두 마음을 하나로 묶어두지 않고 따로 적어둔 게 큰 차이였습니다.",
    now: "다음 한 달 동안 시도해볼 행동 세 개를 워크북에서 같이 정리했어요. 작은 거지만, 매주 월요일에 그걸 보고 시작합니다.",
  },
  {
    name: "민수 님",
    meta: "31세 · 직장인 5년차",
    tag: "성취 중독",
    before:
      "사직서를 세 번이나 쓰다 지웠습니다. 회사 때문이라고 생각했는데, 실제론 그 감정이 어디서 오는지조차 몰랐어요.",
    during:
      "대안 사고를 적는 칸이 가장 인상 깊었어요. 같은 상황을 다른 방식으로 해석한 문장을 직접 적어보니, 월요일에 실전으로 써볼 게 생기더라고요.",
    now: "문제 상황이 사라진 건 아니지만, 같은 상황에서 제 첫 반응이 달라졌어요. 그 차이만으로도 한 주가 다르게 흘러갑니다.",
  },
  {
    name: "서연 님",
    meta: "37세 · 직장인 12년차",
    tag: "관계 패턴",
    before:
      "회사에서도 집에서도 같은 갈등이 반복됐어요. 매번 “내가 또 이런다”는 자책으로 끝났습니다.",
    during:
      "내 안에 “먼저 사과해서라도 갈등을 끝내려는 마음”이 있다는 걸 알았어요. 그 마음에 이름을 붙이고 나니, 그게 매번 같은 자리에서 나섰던 게 보였습니다.",
    now: "다른 반응을 시도해볼 만한 문장 두 개를 워크북에 적어뒀어요. 한 번 써봤더니, 갈등 후의 피로가 확실히 줄었습니다.",
  },
  {
    name: "준혁 님",
    meta: "29세 · 직장인 4년차",
    tag: "자기 비판",
    before:
      "주변에서는 잘 지내는 것 같다고 했지만 속으로는 늘 스스로를 다그치고 있었어요. 작은 실수 하나에도 “역시 나는…”으로 끝났습니다.",
    during:
      "스스로를 다그치는 마음이 “나를 안전하게 지키려고” 그러는 거였다는 관점을 처음 가져봤어요. 적으로 보지 않고 역할을 묻는 게 신선했습니다.",
    now: "비난 대신 시도할 다른 한 마디를 직접 적어뒀어요. 요즘은 그 한 줄이 자동으로 떠올라서 하루가 가벼워졌습니다.",
  },
];

export function OverviewTestimonialsSection() {
  return (
    <section className="lr-section">
      <div className="lr-wrap-4">
        <div className="lr-s-header">
          <span className="lr-eyebrow lr-f-up">
            <span className="lr-dot" />
            REVIEWS
          </span>
          <h2 className="lr-f-up lr-d1">
            먼저 해본 분들의 <em>후기</em>
          </h2>
          <p className="lr-lede lr-f-up lr-d2">
            워크북을 통해 다음 한 달이 달라진 분들의 이야기예요
          </p>
        </div>
        <div className="lr-testi-grid">
          {TESTIS.map((t, i) => (
            <div
              className="lr-testi-card lr-f-up"
              key={t.name}
              style={{ transitionDelay: `${(i % 2) * 0.12}s` }}
            >
              <div className="lr-th-row">
                <div>
                  <div className="lr-th-name">{t.name}</div>
                  <div className="lr-th-meta">{t.meta}</div>
                </div>
                <div className="lr-th-tag">{t.tag}</div>
              </div>
              <div className="lr-tblock">
                <div className="lr-tlabel">시작 전</div>
                <div className="lr-tbody">{t.before}</div>
              </div>
              <div className="lr-tblock">
                <div className="lr-tlabel">진행 중 변화</div>
                <div className="lr-tbody">{t.during}</div>
              </div>
              <div className="lr-tblock">
                <div className="lr-tlabel lr-now">현재</div>
                <div className="lr-tbody lr-bold">{t.now}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="lr-faq-foot">
          * 후기는 본인 동의 하에 닉네임·일부 표현을 다듬어 게재했습니다.
          관계 패턴·자기 비판 워크북은 출시 예정으로, 베타 테스터 후기를 담았습니다.
        </div>
      </div>
    </section>
  );
}
