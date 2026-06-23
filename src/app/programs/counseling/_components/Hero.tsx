import { KAKAO_CHANNEL_URL } from "../content";
import { ChatIcon } from "./Icons";

/**
 * [1] HERO — 다크. 텍스트만 중앙 정렬, 격자 + 글로우 배경.
 * CTA 1개(카카오톡 문의하기).
 */
export function Hero() {
  return (
    <section className="c-hero dark">
      <div className="grid-bg" />
      <div className="hero-glow" />
      <div className="wrap-4 c-hero-inner">
        <div className="f-up">
          <span className="eyebrow on-dark">
            <span className="dot" />
            1:1 PSYCHOLOGICAL COUNSELING
          </span>
        </div>
        <h1 className="f-blur">
          아무도 시키지 않았는데,
          <br />
          나를 <em>몰아붙이기만</em> 해요
        </h1>
        <p className="sub f-up delay-1">
          쉬라는 말이 와닿지 않는,
          <br />
          성취중독 불안이들을 위한 심리상담
        </p>
        <div className="f-up delay-3">
          <a href={KAKAO_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="cta-pill accent">
            <ChatIcon /> 카카오톡 문의하기 <span className="arrow">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}
