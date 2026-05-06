"use client";

import { useEffect, useState } from "react";

/* ============================================================
 * IntroSection — WHAT IT IS · 4가지 차별점
 * ============================================================ */
const FEATURES = [
  {
    num: "01",
    title: "유형 진단 + 문장 완성 검사로 내 상태를 측정합니다",
    desc:
      "리커트 5점 척도 20문항으로 자기 가치의 조건화 · 과잉 추동 · 실패 공포 · 정서적 회피 4개 축을 점수화하고, 문장 완성 검사(SCT) 14문항으로 그 아래 숨은 신념까지 함께 들여다봅니다.",
  },
  {
    num: "02",
    title: "진단에서 절대 끝나지 않습니다",
    desc:
      "기질 분석이나 자가 진단처럼 결과 화면 하나로 멈추지 않아요. 5영역 모델로 내 패턴을 직접 추적하고, 인지 오류 13종을 짚어내고, 반복되는 핵심 믿음을 다시 보는 단계까지 이어집니다.",
  },
  {
    num: "03",
    title: "심리 상담사가 따라가는 단계, 그대로",
    desc:
      "CBT(인지행동치료) 기반의 5영역 모델 · 하향 화살표 · 인지 재구조화. 혼자서는 떠올리기도, 스스로에게 던지기도 어려운 질문들을 워크북이 순서대로 안내해 드립니다.",
  },
  {
    num: "04",
    title: "총 3개의 분석 리포트가 남습니다",
    desc:
      "진단 결과 리포트, 인지 패턴 통합 분석 리포트, 전문가 형식의 마무리 리포트까지. 워크북을 마치고 나면, 내 안의 패턴이 한 장씩 정리된 세 개의 기록이 손에 남아요.",
  },
];

export function IntroSection() {
  return (
    <section className="lr-section" id="features">
      <div className="lr-wrap-4">
        <div className="lr-s-header">
          <span className="lr-eyebrow lr-f-up">
            <span className="lr-dot" />
            WHAT IT IS
          </span>
          <h2 className="lr-f-up lr-d1">
            심리 상담은 부담스럽고,
            <br />
            혼자선 <em>엄두</em>가 나지 않는다면?
          </h2>
          <p className="lr-lede lr-f-up lr-d2">
            학습지 하듯 워크북을 따라가며
            <br />
            진단부터 분석, 솔루션까지 받아 보세요
          </p>
        </div>
        <div className="lr-feature-list lr-f-up">
          {FEATURES.map((f) => (
            <div className="lr-feature-row" key={f.num}>
              <div className="lr-num-col">
                <b>{f.num}</b>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--lr-mute)",
                    letterSpacing: "0.16em",
                    fontWeight: 600,
                  }}
                >
                  FEATURE
                </span>
              </div>
              <div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * CompareSection — 일반 상담 vs 마음 챙김 워크북
 * ============================================================ */
const COMPARE_ROWS = [
  { label: "비용", a: "회당 8~15만원", b: "한 번 구매 4만원대" },
  { label: "시간", a: "매주 예약·이동·50분", b: "내가 원할 때, 원하는 속도로" },
  { label: "커리큘럼", a: "같은 이야기 맴돌기 쉬움", b: "구조화된 커리큘럼" },
  { label: "진행 방식", a: "상담실 방문 필요", b: "비대면 온라인 진행" },
  { label: "검사", a: "검사 비용 별도", b: "분석 검사 포함" },
  { label: "결과물", a: "리포트 미제공", b: "분석 리포트 3종 제공" },
];

export function CompareSection() {
  return (
    <section className="lr-section">
      <div className="lr-wrap-5">
        <div className="lr-s-header">
          <span className="lr-eyebrow lr-f-up">
            <span className="lr-dot" />
            THERAPY VS WORKBOOK
          </span>
          <h2 className="lr-f-up lr-d1">
            상담의 장점은 그대로,
            <br />
            <em>단점만 덜어냈습니다</em>
          </h2>
          <p className="lr-lede lr-f-up lr-d2">
            1:1 심리 상담에서 오는 부담은 최소화, 효용은 극대화.
          </p>
        </div>
        <div className="lr-compare-table-wrap">
          <div className="lr-compare-card lr-dim lr-f-up">
            <div className="lr-ctag">지금까지</div>
            <h3>일반 상담</h3>
            {COMPARE_ROWS.map((r) => (
              <div className="lr-crow" key={r.label}>
                <span className="lr-marker lr-x">×</span>
                <span>{r.a}</span>
              </div>
            ))}
          </div>
          <div className="lr-compare-arrow lr-f-up lr-d1">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="2"
            >
              <path
                d="M5 12h14M13 5l7 7-7 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="lr-compare-card lr-dark lr-f-up lr-d2">
            <div className="lr-ctag">마음 챙김 워크북과 함께</div>
            <h3>마음 챙김 워크북</h3>
            {COMPARE_ROWS.map((r) => (
              <div className="lr-crow" key={r.label}>
                <span className="lr-marker lr-v">✓</span>
                <span>{r.b}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * MaySection — 5월의 워크북 (성취 중독 미리보기)
 * ============================================================ */
const DIAG_CHECKS = [
  "성과가 없는 하루는 낭비한 하루처럼 느껴진다.",
  "아무것도 안 하고 쉬는 것에 죄책감을 느낀다.",
  "결과가 좋아도, 더 잘할 수 있었을 거라는 아쉬움이 먼저 든다.",
  "조용히 혼자 있으면 불편한 생각이 올라와서, 바쁘게 지내는 게 편하다.",
];

export function MaySection() {
  return (
    <section className="lr-section lr-may-section" id="workbooks">
      <div className="lr-wrap-4">
        <div className="lr-s-header">
          <span className="lr-eyebrow lr-f-up">
            <span className="lr-dot" />
            WORKBOOKS · MAY 2026
          </span>
          <h2 className="lr-may-h lr-f-up lr-d1">
            이번 달 워크북의 주제는
            <br />
            &lsquo;<em>성취 중독</em>&rsquo;입니다
          </h2>
          <p className="lr-lede lr-f-up lr-d2">
            성취해도 불안하고, 멈추면 더 불안한 당신을 위한 10단계 커리큘럼
          </p>
        </div>
        <div className="lr-diag-preview lr-f-up">
          <div className="lr-dp-head">
            <span className="lr-ll">성취 중독 자가 진단 — 미리보기</span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="lr-dot" />
              SCT-20
            </span>
          </div>
          <div className="lr-dp-body">
            <h3>
              이런 생각, <em>자주</em> 드시나요?
            </h3>
            <div className="lr-checks">
              {DIAG_CHECKS.map((c, i) => (
                <div className="lr-check-row" key={i}>
                  <div className="lr-check-mark">✓</div>
                  <div>{c}</div>
                </div>
              ))}
            </div>
            <div className="lr-dp-foot">
              이 외 <b>16문항으로 4개 영역</b>
              (자기 가치 조건화 · 과잉 추동 · 실패 공포 · 정서적 회피)을 정확히
              측정하고, <b>문장 완성 검사 14문항</b>으로 그 아래 숨은 신념까지
              들여다봅니다.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * CycleSection — 6단계 성취 중독 순환
 * ============================================================ */
const CYCLE_NODES = [
  { n: "01", title: "성취 압박", desc: "더 잘해야 한다는 불안" },
  { n: "02", title: "과잉 몰입", desc: "일에 과도하게 집중" },
  { n: "03", title: "일시적 안도", desc: "성과 달성 순간의 만족" },
  { n: "04", title: "공허감", desc: "금세 찾아오는 허무함" },
  { n: "05", title: "자기 의심", desc: "아직 부족하다는 생각" },
  { n: "06", title: "더 큰 목표", desc: "다시 시작되는 압박감" },
];

const CYCLE_POSITIONS = [
  { top: "12%", left: "50%" },
  { top: "28%", left: "85%" },
  { top: "70%", left: "85%" },
  { top: "88%", left: "50%" },
  { top: "70%", left: "15%" },
  { top: "28%", left: "15%" },
];

function CycleDiagram() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setActive((a) => (a + 1) % 6), 1800);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="lr-cycle-diagram lr-f-up">
      <div className="lr-cycle-ring-2" />
      <div className="lr-cycle-ring" />
      <div className="lr-cycle-center">
        <div className="lr-core">
          <div className="lr-core-inner">
            <div className="lr-label">성취 중독</div>
            <div className="lr-label-2">CYCLE</div>
          </div>
        </div>
      </div>
      {CYCLE_NODES.map((node, i) => (
        <div
          key={node.n}
          className={`lr-cycle-node ${active === i ? "lr-active" : ""}`}
          style={{
            top: CYCLE_POSITIONS[i].top,
            left: CYCLE_POSITIONS[i].left,
          }}
        >
          <div className="lr-ndot">{node.n}</div>
          <div className="lr-ntitle">{node.title}</div>
          <div className="lr-ndesc">{node.desc}</div>
        </div>
      ))}
    </div>
  );
}

function CycleList() {
  return (
    <div className="lr-cycle-list">
      {CYCLE_NODES.map((node) => (
        <div className="lr-cycle-list-item" key={node.n}>
          <div className="lr-lnum">{node.n}</div>
          <div>
            <div className="lr-ltitle">{node.title}</div>
            <div className="lr-ldesc">{node.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function CycleSection() {
  return (
    <section className="lr-cycle-section">
      <div className="lr-ambient" />
      <div className="lr-wrap-5">
        <div className="lr-s-header">
          <span className="lr-eyebrow lr-f-up">
            <span className="lr-dot" />
            THE CYCLE
          </span>
          <h2 className="lr-f-up lr-d1">
            열심히 사는 것과
            <br />
            <em>멈추지 못하는 것</em>은 다릅니다
          </h2>
        </div>
        <p className="lr-empathy lr-f-up">
          <b>프로젝트를 성공시켜도</b> 기쁨은 하루를 넘기지 못합니다.
          <br />
          <b>칭찬을 들어도</b> &lsquo;운이 좋았을 뿐&rsquo;이라는 생각이 먼저
          듭니다.
          <br />
          <b>쉬려고 하면</b> 뒤처질 것 같은 불안이 밀려옵니다.
        </p>
        <CycleDiagram />
        <CycleList />
        <div className="lr-cycle-conclusion lr-f-up">
          심리학에서는 성과로 자기 가치를 증명하려는 강박적 패턴을{" "}
          <b>&lsquo;성취 중독(Achievement Addiction)&rsquo;</b>이라 부릅니다.
        </div>
        <div className="lr-cycle-cta-headline lr-f-up lr-d1">
          성취해도 불안하고, 멈추면 더 불안한 당신을 위한
          <em>10단계 커리큘럼</em>
        </div>
      </div>
    </section>
  );
}
