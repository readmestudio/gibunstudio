"use client";

import { WorkshopNotifyButton } from "./WorkshopNotifyButton";

/* ── Hero 본체 — 큰 타이틀 + 서브 + CTA + 스크롤 큐 ── */
export function HeroSection() {
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
          비즈니스 퍼포먼스를 위한
          <br />
          <span className="lr-accent-word">마음 챙김</span> 워크북
        </h1>
        <p className="lr-sub lr-f-up lr-d1">
          비즈니스 퍼포먼스를 위한 라이팅 테라피
        </p>
        <div className="lr-hero-chips lr-f-up lr-d1">
          <span className="lr-chip">#인지행동치료</span>
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

/* ── 1:1 상담의 4가지 한계 ── */
const PROBLEMS: Array<{
  num: string;
  title: string;
  desc: string;
  icon: "coin" | "loop" | "mismatch" | "empty";
}> = [
  {
    num: "01",
    title: "가격이 부담돼요",
    desc: "회당 8~15만원, 매주 가는 건 현실적으로 부담돼요.",
    icon: "coin",
  },
  {
    num: "02",
    title: "같은 얘기만 반복돼요",
    desc: "회차가 진행되면 어느 순간 같은 문제, 같은 이야기를 반복하고 있어요.",
    icon: "loop",
  },
  {
    num: "03",
    title: "상담사가 잘 맞지 않아요",
    desc: "상담사가 나와 잘 맞냐 안 맞냐에 따라 만족도가 달라지더라구요.",
    icon: "mismatch",
  },
  {
    num: "04",
    title: "끝나고 남는 게 없어요",
    desc: "이야기할 땐 신나게 떠들었는데, 끝나고 남는 게 없어요.",
    icon: "empty",
  },
];

function ProblemIcon({ kind }: { kind: "coin" | "loop" | "mismatch" | "empty" }) {
  const stroke = "currentColor";
  if (kind === "coin")
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6">
        <circle cx="12" cy="12" r="9" />
        <path
          d="M12 7v10M9 9.5h4a1.5 1.5 0 010 3h-2a1.5 1.5 0 010 3h4"
          strokeLinecap="round"
        />
      </svg>
    );
  if (kind === "loop")
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6">
        <path
          d="M3 12a9 9 0 0115.5-6.3L21 8M21 3v5h-5M21 12a9 9 0 01-15.5 6.3L3 16M3 21v-5h5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  if (kind === "mismatch")
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6">
        <circle cx="9" cy="9" r="3" />
        <circle cx="17" cy="9" r="3" />
        <path
          d="M3 20c0-2.5 2-5 6-5M21 20c0-2.5-2-5-6-5"
          strokeLinecap="round"
        />
        <path d="M14 14l4 4M18 14l-4 4" strokeLinecap="round" />
      </svg>
    );
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.6">
      <rect x="3" y="6" width="18" height="14" rx="2" />
      <path d="M3 10h18M8 14h2" strokeLinecap="round" />
    </svg>
  );
}

export function ProblemsSection() {
  return (
    <section className="lr-section">
      <div className="lr-wrap-5">
        <div className="lr-s-header">
          <span className="lr-eyebrow lr-plain lr-f-up">
            <span className="lr-dot" />
            THE PROBLEM
          </span>
          <h2 className="lr-f-up lr-d1">
            1:1 상담의 이런 문제,
            <br />
            <em>해결하고 싶었습니다</em>
          </h2>
        </div>
        <div className="lr-problems-grid">
          {PROBLEMS.map((p, i) => (
            <div className={`lr-problem-cell lr-f-up lr-d${i + 1}`} key={p.num}>
              <div className="lr-num">{p.num} / 04</div>
              <div className="lr-icon-box">
                <ProblemIcon kind={p.icon} />
              </div>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
            </div>
          ))}
        </div>
        <div className="lr-problem-conclusion lr-f-up">
          문제는 상담사가 아니라, <b>상담의 구조와 도구</b>에 있었습니다.
        </div>
      </div>
    </section>
  );
}

/* ── 워크북의 출발점 인용 박스 ── */
export function BigQuestionSection() {
  return (
    <section className="lr-section-sm">
      <div className="lr-wrap-5">
        <div className="lr-big-q lr-f-up">
          <div className="lr-qmark">&ldquo;</div>
          <h3>
            심리 상담사 없이도 인지 행동 치료에 기반하여
            <br />
            상담을 대신할 수 있는 워크북은 없을까?
          </h3>
          <div className="lr-footnote">
            마음 챙김 워크북은 이 질문으로부터 시작되었습니다.
          </div>
        </div>
      </div>
    </section>
  );
}
