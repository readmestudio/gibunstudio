"use client";

import { WorkshopNotifyButton } from "./WorkshopNotifyButton";

/**
 * 워크북 전반 상세 페이지(`/payment/self-workshop`) 전용 Hero.
 *
 * 톤 가이드:
 * - IFS(내면가족체계) 관점 — "마음 안의 여러 부분"
 * - 과거 원인 분석보다 다음 한 달의 행동에 무게
 * - 힐링/위로보다 다음 시도할 수 있는 대안에 무게
 */
export function OverviewHero() {
  return (
    <section className="lr-hero">
      <div className="lr-grid-bg" />
      <div className="lr-wrap-6 lr-hero-inner">
        <div className="lr-f-up">
          <span className="lr-eyebrow">
            <span className="lr-dot" />
            SELF · MINDFULNESS · WORKBOOK
          </span>
        </div>
        <h1 className="lr-f-blur">
          직장인을 위한
          <br />
          <span className="lr-accent-word">마음 챙김</span> 워크북
        </h1>
        <p className="lr-sub lr-f-up lr-d1">
          마음 안의 여러 부분을 알아보고,
          <br />
          다음 한 달을 다르게 살아보는 라이팅 테라피
        </p>
        <div className="lr-hero-chips lr-f-up lr-d1">
          <span className="lr-chip">#내면가족체계</span>
          <span className="lr-chip">#셀프심리상담</span>
          <span className="lr-chip">#소프트런칭특가</span>
        </div>
        <div className="lr-hero-cta-row lr-f-up lr-d2">
          <WorkshopNotifyButton className="lr-cta-pill lr-accent">
            출시 알림신청하고 할인받기
            <span className="lr-arrow">→</span>
          </WorkshopNotifyButton>
        </div>
        <div className="lr-scroll-cue">
          <span>SCROLL</span>
          <span className="lr-line" />
        </div>
      </div>
    </section>
  );
}

/* ── 워크북의 출발점 인용 박스 (overview 톤) ── */
export function OverviewBigQuestion() {
  return (
    <section className="lr-section-sm">
      <div className="lr-wrap-5">
        <div className="lr-big-q lr-f-up">
          <div className="lr-qmark">&ldquo;</div>
          <h3>
            과거의 원인을 캐묻기보다,
            <br />
            지금 내 안의 부분들과 대화하고
            <br />
            다음 한 걸음을 그려볼 수는 없을까?
          </h3>
          <div className="lr-footnote">
            마음 챙김 워크북은 이 질문으로부터 시작되었습니다.
          </div>
        </div>
      </div>
    </section>
  );
}
