import { KAKAO_CHANNEL_URL } from "../content";
import { ChatIcon } from "./Icons";

/**
 * [11] FINAL CTA — 다크 라운드 박스. 8회 패키지(primary) + 1회 체험(ghost).
 */
export function FinalCta() {
  return (
    <section className="section-sm" id="final">
      <div className="wrap-5">
        <div className="final-cta f-up">
          <div className="grid-bg" />
          <span className="eyebrow dark">
            <span className="dot" />
            START HERE
          </span>
          <h2>
            쉬는 법을 배우려는 게 아닙니다.
            <br />
            <em>멈추지 않고 나아갈 힘</em>을 얻으려는 겁니다
          </h2>
          <p className="sub">
            지금 마음이 따라주지 않는다면, 1급 심리상담사와 함께 시작해 보세요.
          </p>
          <div className="cta-row">
            <a href={KAKAO_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="cta-pill invert">
              <ChatIcon /> 8회 패키지 시작하기 <span className="arrow">→</span>
            </a>
            <a
              href={KAKAO_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="cta-ghost"
              style={{ color: "#fff", borderColor: "rgba(255,255,255,0.6)" }}
            >
              1회 체험 신청하기 →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
