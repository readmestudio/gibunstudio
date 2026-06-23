import {
  CMP_AFTER,
  CMP_AFTER_HEAD,
  CMP_BEFORE,
  CMP_BEFORE_HEAD,
} from "../content";
import { ArrowRightIcon, CheckIcon, CloseIcon } from "./Icons";

/**
 * [3] WHY GIBUN — 기존 상담(Before) vs 기분(After) 비교.
 * 우측 다크 강조 카드가 더 크고, 오렌지 보더 + 오프셋 블록으로 무게를 준다.
 */
export function FixSection() {
  return (
    <section className="section">
      <div className="wrap-5">
        <div className="s-header">
          <span className="eyebrow f-up">
            <span className="dot" />
            WHY GIBUN
          </span>
          <h2 className="f-up delay-1">
            심리 상담의 이런 문제를
            <br />
            <em>해결하고 싶었습니다</em>
          </h2>
        </div>

        <div className="cmp f-up">
          {/* Before */}
          <div className="cmp-card before">
            <div className="cmp-label">지금까지</div>
            <div className="cmp-head">{CMP_BEFORE_HEAD}</div>
            <div className="cmp-list">
              {CMP_BEFORE.map((c) => (
                <div className="cmp-row" key={c}>
                  <span className="cmp-x">
                    <CloseIcon size={11} />
                  </span>
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <div className="cmp-arrow">
            <ArrowRightIcon size={18} />
          </div>

          {/* After (강조) */}
          <div className="cmp-card after">
            <div className="cmp-label on-dark">
              <em>기분 스튜디오</em>
            </div>
            <div className="cmp-head on-dark">{CMP_AFTER_HEAD}</div>
            <div className="cmp-list">
              {CMP_AFTER.map((c) => (
                <div className="cmp-row" key={c.a}>
                  <span className="cmp-v">
                    <CheckIcon size={12} strokeWidth={3} />
                  </span>
                  <span>
                    <strong>{c.a}</strong>
                    {c.b}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
