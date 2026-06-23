import { GPT_REASONS } from "../content";

/**
 * [7] GPT VS COUNSELOR — 왜 GPT에게 마음을 물으면 공허해지는가. 세로 리스트 카드.
 */
export function GptSection() {
  return (
    <section className="section">
      <div className="wrap-4">
        <div className="s-header">
          <span className="eyebrow f-up">
            <span className="dot" />
            GPT VS COUNSELOR
          </span>
          <h2 className="f-up delay-1">
            왜 <em>GPT</em>에게 마음을 물어보면 공허해질까요?
          </h2>
          <p className="lede f-up delay-2">
            답을 만들어내는 것과, 당신을 이해하는 것은 다릅니다.
          </p>
        </div>
        <div className="gpt-list f-up">
          {GPT_REASONS.map((r) => (
            <div className="gpt-row" key={r.title}>
              <span className="xm">✕</span>
              <div>
                <h3>{r.title}</h3>
                <p>{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
