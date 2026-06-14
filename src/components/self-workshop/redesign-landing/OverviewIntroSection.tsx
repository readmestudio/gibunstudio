"use client";

/**
 * 워크북 전반 페이지의 "WHAT IT IS" 섹션.
 *
 * 기존 IntroSection은 성취 중독 한정 카피(자기 가치 조건화·과잉 추동 등)였다.
 * 여기서는 워크북 *전반*에 적용되는 4가지 차별점을 정리한다.
 */
const FEATURES: {
  num: string;
  title: string;
  desc: string;
  /** 데스크탑에서만 보여주는 앞부분 (모바일에서는 desc만 노출해 간결하게) */
  descLead?: string;
}[] = [
  {
    num: "01",
    title: "마음을 하나로 보지 않습니다",
    descLead:
      "쉬고 싶은 마음, 더 잘해야 하는 마음, 다 그만두고 싶은 마음. 내면가족체계(IFS) 관점으로 한 사람 안의 여러 부분을 하나씩 알아보고, 그 부분이 나에게 어떤 역할을 해왔는지 정리합니다. ",
    desc:
      "퍼포먼스를 가로막는 마음을 없애야 할 원인으로 보지 않아요. 대신 우리 마음속에 존재하는 다양한 부분과 자동적인 사고를 테스트로 진단하고 분석합니다.",
  },
  {
    num: "02",
    title: "진단 화면에서 멈추지 않습니다",
    desc:
      "기질 분석이나 자가 진단처럼 결과 화면 하나로 멈추지 않아요. CBT 5영역 모델로 내 패턴을 직접 추적하고, 인지 오류를 짚어내고, 반복되는 핵심 믿음을 다시 보는 단계까지 이어집니다.",
  },
  {
    num: "03",
    title: "과거의 원인보다 다음 행동을 봅니다",
    desc:
      "어디서부터 이렇게 됐는지 거슬러 올라가기 전에, 지금 어떤 부분이 작동하고 있고 다음 한 달에 무엇을 다르게 해볼지부터 적어봅니다. 워크북은 위로보다 다른 시도에 시간을 씁니다.",
  },
  {
    num: "04",
    title: "끝나면 3개의 리포트가 남습니다",
    desc:
      "증상을 짚어주는 진단 결과 리포트, 내 안에 살고 있는 마음 체계 리포트, 그리고 상담 종결 리포트까지. 워크북을 마치고 나면 내 증상의 원인과 결과, 앞으로 해야 할 일이 한 장씩 또렷하게 정리되어 손에 남아요.",
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
            진단부터 분석, 솔루션까지 받아보세요
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
                <p>
                  {f.descLead && (
                    <span className="lr-only-desktop">{f.descLead}</span>
                  )}
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
