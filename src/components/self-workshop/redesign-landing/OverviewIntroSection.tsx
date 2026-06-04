"use client";

/**
 * 워크북 전반 페이지의 "WHAT IT IS" 섹션.
 *
 * 기존 IntroSection은 성취 중독 한정 카피(자기 가치 조건화·과잉 추동 등)였다.
 * 여기서는 워크북 *전반*에 적용되는 4가지 차별점을 정리한다.
 */
const FEATURES = [
  {
    num: "01",
    title: "내 안의 부분들을 따로따로 만나봅니다",
    desc:
      "쉬고 싶은 마음, 더 잘해야 하는 마음, 다 그만두고 싶은 마음. 내면가족체계(IFS) 관점으로 한 사람 안의 여러 부분을 하나씩 알아보고, 그 부분이 나에게 어떤 역할을 하고 있었는지 정리합니다.",
  },
  {
    num: "02",
    title: "진단에서 절대 끝나지 않습니다",
    desc:
      "기질 분석이나 자가 진단처럼 결과 화면 하나로 멈추지 않아요. CBT 5영역 모델로 내 패턴을 직접 추적하고, 인지 오류를 짚어내고, 반복되는 핵심 믿음을 다시 보는 단계까지 이어집니다.",
  },
  {
    num: "03",
    title: "과거 원인보다 다음 행동에 무게를 둡니다",
    desc:
      "어디서부터 이렇게 됐는지 거슬러 올라가기 전에, 지금 어떤 부분이 작동하고 있고 다음 한 달에 무엇을 다르게 해볼지부터 적어봅니다. 워크북은 위로보다 다른 시도에 시간을 씁니다.",
  },
  {
    num: "04",
    title: "총 3개의 분석 리포트가 남습니다",
    desc:
      "진단 결과 리포트, 인지 패턴 통합 분석 리포트, 전문가 형식의 마무리 리포트까지. 워크북을 마치고 나면, 내 안의 패턴이 한 장씩 정리된 세 개의 기록이 손에 남아요.",
  },
];

export function OverviewIntroSection() {
  return (
    <section className="lr-section" id="features">
      <div className="lr-wrap-4">
        <div className="lr-s-header">
          <span className="lr-eyebrow lr-f-up">
            <span className="lr-dot" />
            WHAT IT IS
          </span>
          <h2 className="lr-f-up lr-d1">
            심리 상담은 부담스럽고,
            <br />
            혼자선 <em>엄두</em>가 나지 않는다면?
          </h2>
          <p className="lr-lede lr-f-up lr-d2">
            학습지 하듯 워크북을 따라가며
            <br />
            진단부터 분석, 다음 한 달의 다른 행동까지 받아 보세요
          </p>
        </div>
        <div className="lr-feature-list lr-f-up">
          {FEATURES.map((f) => (
            <div className="lr-feature-row" key={f.num}>
              <div className="lr-num-col">
                <b>{f.num}</b>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--lr-mute)",
                    letterSpacing: "0.16em",
                    fontWeight: 600,
                  }}
                >
                  FEATURE
                </span>
              </div>
              <div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
