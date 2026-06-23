import { CURRICULUM, type CurriculumStep } from "../content";

/**
 * [6] CURRICULUM — 8회차 구조화 커리큘럼(페이지의 심장).
 * PHASE 1/2 두 단계, 각 단계는 세로 타임라인(번호 노드 + 카드).
 */
function StepRow({ s }: { s: CurriculumStep }) {
  const num = String(s.step).padStart(2, "0");
  return (
    <div className="step-row f-up">
      <div className="step-node">{num}</div>
      <div className="step-card">
        <h4>{s.title}</h4>
        <p>{s.desc}</p>
      </div>
    </div>
  );
}

export function Curriculum() {
  return (
    <section className="section" id="curriculum" style={{ background: "var(--surface)" }}>
      <div className="wrap-4">
        <div className="s-header">
          <span className="eyebrow plain f-up">
            <span className="dot" />
            CURRICULUM
          </span>
          <h2 className="f-up delay-1">
            기분 스튜디오의 상담은
            <br />
            <em>이렇게 진행됩니다</em>
          </h2>
          <p className="lede f-up delay-2">
            진단부터 리포트 솔루션까지 한 번에 꿰뚫는 커리큘럼.
            <br />
            매회마다 “오늘은 무슨 얘기하지?” 고민할 필요 없습니다.
          </p>
        </div>

        <div className="curr-badge-wrap f-up">
          <span className="curr-badge">
            <span className="n">총 8회차</span> 구조화 커리큘럼
          </span>
        </div>

        {CURRICULUM.map((phase, pi) => (
          <div key={phase.phase}>
            {pi > 0 ? (
              <div className="phase-band f-up">
                <span className="dot" />
                <span className="line" />
              </div>
            ) : null}
            <div className="phase">
              <div className="phase-head f-up">
                <span className="pno">{phase.phase}</span>
                <div>
                  <div className="pttl">{phase.label}</div>
                  <div className="psub">{phase.caption}</div>
                </div>
              </div>
              <div className="steps">
                {phase.steps.map((s) => (
                  <StepRow s={s} key={s.step} />
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
