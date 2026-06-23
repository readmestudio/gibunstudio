"use client";

import { useEffect, useState } from "react";
import { ROLLING_CHECKS } from "../content";
import { CheckIcon } from "./Icons";

/**
 * [2] NEED — 라이트. 대형 헤드라인 + 자동 롤링 체크 박스 + 서브 카피.
 * 롤링 문구는 2.8초 간격으로 순환, 진행 도트 클릭으로 수동 점프.
 */
function RollingChecks() {
  const [i, setI] = useState(0);
  const n = ROLLING_CHECKS.length;

  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % n), 2800);
    return () => clearInterval(t);
  }, [n]);

  return (
    <div className="roll-box">
      <span className="roll-mark">
        <CheckIcon size={14} strokeWidth={3} />
      </span>
      <div className="roll-stage">
        <span key={i} className="roll-text">
          {ROLLING_CHECKS[i]}
        </span>
      </div>
      <div className="roll-dots">
        {ROLLING_CHECKS.map((_, idx) => (
          <button
            key={idx}
            type="button"
            className={`roll-d ${idx === i ? "on" : ""}`}
            onClick={() => setI(idx)}
            aria-label={`${idx + 1}번 항목 보기`}
          />
        ))}
      </div>
    </div>
  );
}

export function NeedSection() {
  return (
    <section className="section need-sec">
      <div className="wrap-4">
        <h2 className="need-head f-up">
          이게 모두 내 이야기라면,
          <br />
          <em>심리 상담이 필요한 때예요</em>
        </h2>
        <div className="f-up delay-1" style={{ width: "100%" }}>
          <RollingChecks />
        </div>
        <p className="need-sub f-up delay-2">
          일은 더 잘하고 싶은데 마음이 따라주지 않을 때,
          <br />
          1급 심리상담사와 함께하는 상담 프로그램입니다.
        </p>
      </div>
    </section>
  );
}
