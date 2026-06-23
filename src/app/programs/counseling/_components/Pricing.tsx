import { KAKAO_CHANNEL_URL, OFFER_PLANS } from "../content";

/**
 * [5] PRICING — 1회 체험 / 8회 패키지(추천) 2열.
 * 추천 카드는 다크 + 오프셋 블록 + 상단 배지. CTA는 카카오톡 채널로 연결.
 */
export function Pricing() {
  return (
    <section className="section" id="price">
      <div className="wrap-5">
        <div className="s-header">
          <span className="eyebrow f-up">
            <span className="dot" />
            PRICING
          </span>
          <h2 className="f-up delay-1">
            기분 스튜디오 <em>상담 플랜</em>
          </h2>
          <p className="lede f-up delay-2">
            유료 검사부터 진단, 분석, 상담, 종합 리포트까지 모두 포함된 가격입니다.
          </p>
        </div>

        <div className="price2-grid">
          {OFFER_PLANS.map((plan) => (
            <div
              className={`prod f-up${plan.recommended ? " feature delay-1" : ""}`}
              key={plan.id}
            >
              {plan.recBadge ? <div className="rec-badge">{plan.recBadge}</div> : null}
              <div className="ptag">{plan.tag}</div>
              <div className="plan-sessions">
                <span className="ps-count">
                  {plan.sessions}
                  <span className="ps-unit">회</span>
                </span>
                <span className="ps-name">{plan.sessionKo}</span>
              </div>
              <div className="pmeta">{plan.meta}</div>
              <div className="price-line">
                <span className="price-num">{plan.price.toLocaleString("ko-KR")}</span>
                <span className="price-won">원</span>
              </div>
              <div className="price-note">{plan.priceNote}</div>
              <div className="incl">
                {plan.includes.map((c) => (
                  <div className="incl-row" key={c}>
                    <span className="incl-mark">✓</span>
                    {c}
                  </div>
                ))}
              </div>
              <a
                href={KAKAO_CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="cta-pill"
              >
                {plan.cta} <span className="arrow">→</span>
              </a>
            </div>
          ))}
        </div>

        <div className="price2-foot f-up">
          유료 검사·해석 비용이 모두 포함된 가격입니다. 검사 따로, 상담 따로 결제하지 않아도 됩니다.
        </div>
      </div>
    </section>
  );
}
