import { TESTIMONIALS } from "../content";

/**
 * [9] VOICES — 후기. 3열 카드(트리거 문장 + 본문 + 작성자/메타/플랜 배지).
 * ⚠️ 실제 후기 확보 전, 예시 페르소나.
 */
export function Reviews() {
  return (
    <section className="section" style={{ background: "var(--surface)" }}>
      <div className="wrap-6">
        <div className="s-header">
          <span className="eyebrow plain f-up">
            <span className="dot" />
            VOICES
          </span>
          <h2 className="f-up delay-1">
            같은 고민을 <em>지나온</em> 사람들
          </h2>
          <p className="lede f-up delay-2">
            나이도, 하는 일도 다르지만 — 멈추지 못해 찾아온 사람들의 이야기입니다.
          </p>
        </div>
        <div className="review-grid">
          {TESTIMONIALS.map((r, i) => (
            <div
              className="review-card f-up"
              key={r.who}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="review-trigger">{r.trigger}</div>
              <div className="review-body">{r.body}</div>
              <div className="review-foot">
                <div className="who">{r.who}</div>
                <div className="meta">{r.meta}</div>
                <span className="plan">{r.plan}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="faq-foot f-up">
          * 실제 후기 확보 전, 예시 페르소나로 구성된 화면입니다.
        </div>
      </div>
    </section>
  );
}
