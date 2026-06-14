"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/* ============================================================
 * ApproachSection — IFS 기반 접근법 소개 (MaySection 자리)
 * "성취 중독" 단일 주제 안내 대신, 워크북 전반의 접근법(IFS) 소개
 * ============================================================ */
const APPROACH_PILLARS = [
  {
    n: "01",
    title: "마음을 한 덩어리로 보지 않습니다",
    desc:
      "쉬고 싶은 마음, 더 잘해야 하는 마음, 다 그만두고 싶은 마음. 같은 사람 안에서 부딪히는 여러 마음을 따로따로 만나봅니다.",
  },
  {
    n: "02",
    title: "과거를 캐묻기보다 지금을 정리합니다",
    desc:
      "어린 시절을 거슬러 올라가 원인을 찾기 전에, 지금 내 안에서 어떤 부분이 어떤 일을 맡고 있는지부터 짚어봅니다.",
  },
  {
    n: "03",
    title: "힐링이 아니라 다음 행동을 그립니다",
    desc:
      "감정을 다독이고 끝나지 않아요. 한 달 동안 시도해 볼 수 있는 다른 반응, 다른 한 마디, 다른 선택을 함께 적어둡니다.",
  },
];

export function OverviewApproachSection() {
  return (
    <section className="lr-section lr-may-section" id="approach">
      <div className="lr-wrap-4">
        <div className="lr-s-header">
          <span className="lr-eyebrow lr-f-up">
            <span className="lr-dot" />
            OUR APPROACH
          </span>
          <h2 className="lr-may-h lr-f-up lr-d1">
            심리 상담 워크북은
            <br />
            이렇게 <em>다릅니다</em>
          </h2>
          <p className="lr-lede lr-f-up lr-d2">
            내면가족체계(IFS)와 인지행동치료(CBT)를 기반으로 자연스럽게
            탐색과 통찰이 일어날 수 있도록 설계했습니다.
          </p>
        </div>
        <div className="lr-feature-list lr-f-up">
          {APPROACH_PILLARS.map((p) => (
            <div className="lr-feature-row" key={p.n}>
              <div className="lr-num-col">
                <b>{p.n}</b>
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--lr-mute)",
                    letterSpacing: "0.16em",
                    fontWeight: 600,
                  }}
                >
                  PILLAR
                </span>
              </div>
              <div>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * MethodSection — IFS·CBT 이론 설명 + 1급 상담사 신뢰 영역
 * "5단계 여정"(JourneySection)과 "이렇게 다릅니다"(ApproachSection) 사이에 배치.
 *  - Part A: 두 가지 검증된 심리치료 이론(IFS·CBT)이 실제로 무엇인지 설명
 *  - Part B: 제작자 2인(상담심리사·명상 디렉터)의 이름·자격 이력 신뢰 배너
 * 톤: 공격적 단어(반박/부수기) 대신 "다시 보기/업데이트" 등 비판단적 표현 사용
 * ============================================================ */
const METHODS = [
  {
    tag: "내면가족체계 · IFS",
    title: "마음을 ‘여러 부분’으로 만납니다",
    body:
      "우리 마음은 하나가 아니에요. 더 잘하라고 다그치는 부분, 다 그만두고 싶은 부분, 불안해하는 부분이 한 사람 안에서 부딪힙니다. IFS는 이 부분들을 없애야 할 문제가 아니라, 저마다 나를 지키려던 역할로 보고 하나씩 만나 대화하는 접근이에요.",
    chips: ["Richard Schwartz 박사 정립", "전 세계 상담 현장에서 활용"],
  },
  {
    tag: "인지행동치료 · CBT",
    title: "생각의 흐름을 다시 살펴봅니다",
    body:
      "같은 상황인데 유독 나를 흔드는 생각이 있어요. CBT는 ‘상황 → 자동적 사고 → 감정 → 행동’으로 이어지는 연결고리를 펼쳐 보고, 사실이 아닌 생각을 알아차려 다른 해석으로 업데이트하는 방법입니다. 우울·불안 개선 효과가 가장 많이 검증된 심리치료예요.",
    chips: ["수십 년간 효과 검증", "전 세계 임상 표준"],
  },
];

const CREATORS = [
  {
    role: "심리 상담사",
    name: "김연지",
    image: "/images/creators/kim-yeonji.png",
    credentials: [
      "상담심리사 1급 (한국상담심리학회)",
      "임상심리사 1급 (한국산업인력공단)",
      "청소년상담사 2급 (여성가족부)",
      "트라우마전문상담사 (한국트라우마연구교육원)",
    ],
  },
  {
    role: "명상 디렉터",
    name: "김지안",
    image: "/images/creators/kim-jian.png",
    credentials: [
      "(전) Growth Lead, Speak (Silicon Valley AI Language Learning Company)",
      "MBCT Certified, Brown University",
      "Meditation Instructor (LV.1, 110 Hours), 숨쉬는고래",
      "Certified Singing Bowl Meditation Instructor (Level 1)",
      "인지행동심리상담사 1급 (한국심리교육협회)",
      "긍정심리상담사 1급 (한국심리교육협회)",
    ],
  },
];

export function OverviewMethodSection() {
  return (
    <section className="lr-section" id="method">
      <div className="lr-wrap-5">
        <div className="lr-s-header">
          <span className="lr-eyebrow lr-f-up">
            <span className="lr-dot" />
            METHOD & EXPERTISE
          </span>
          <h2 className="lr-f-up lr-d1">
            <em>1급 심리상담사</em>와 <em>명상 디렉터</em>가
            <br />
            만들면 다릅니다
          </h2>
          <p className="lr-lede lr-f-up lr-d2">
            한국상담심리학회 1급 심리 상담사와 실리콘밸리 기업 출신 명상
            디렉터가 만나 실제 현장에서 쓰이는 이론을 한 권의 워크북에
            담았습니다.
          </p>
        </div>

        {/* Part A — 두 이론(IFS·CBT)이 무엇인지 설명 */}
        <div className="lr-method-grid">
          {METHODS.map((m, i) => (
            <div
              className="lr-method-card lr-f-up"
              key={m.tag}
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <span className="lr-mc-tag">{m.tag}</span>
              <h3 className="lr-mc-title">{m.title}</h3>
              <p className="lr-mc-body">{m.body}</p>
              <div className="lr-mc-chips">
                {m.chips.map((c) => (
                  <span className="lr-mc-chip" key={c}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Part B — 1급 심리 상담사 신뢰 배너
            주의: 배너 전체를 lr-f-up으로 묶으면 요소가 뷰포트보다 길어
            IntersectionObserver의 threshold(0.18)에 도달하지 못해 영영 등장하지
            않는다. 배너는 항상 보이게 두고 내부 요소만 개별 fade-in 처리. */}
        <div className="lr-trust-band">
          <div className="lr-trust-grid-bg" />
          <div className="lr-trust-head lr-f-up">
            <span className="lr-trust-badge">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L3.2 7.7l5.4-.8z"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div>
              <div className="lr-trust-eyebrow">CLINICALLY DESIGNED</div>
              <h3 className="lr-trust-h">
                회사 생활을 치열하게 해본 사람이
                <br />
                제대로 <b>이해하고 상담</b>할 수 있을까요?
              </h3>
              <p className="lr-trust-sub">
                11년간 비즈니스를 성장시킨 명상 디렉터와
                <br />
                12년간 임상을 경험한 상담가가 만났습니다.
              </p>
            </div>
          </div>
          <div className="lr-trust-profiles">
            {CREATORS.map((c, i) => (
              <div
                className="lr-trust-profile lr-f-up"
                key={c.name}
                style={{ transitionDelay: `${0.1 + i * 0.1}s` }}
              >
                <div className="lr-tp-head">
                  <div className="lr-tp-photo">
                    <Image
                      src={c.image}
                      alt={`${c.role} ${c.name}`}
                      width={148}
                      height={148}
                    />
                  </div>
                  <div className="lr-tp-headtext">
                    <span className="lr-tp-role">{c.role}</span>
                    <div className="lr-tp-name">{c.name}</div>
                  </div>
                </div>
                <ul className="lr-tp-creds">
                  {c.credentials.map((cr) => (
                    <li key={cr}>
                      <span className="lr-tp-dot" />
                      <span>{cr}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * JourneySection — 워크북 공통 여정 (CycleSection 자리)
 * 두 개의 축으로 구성: ①진단과 분석 ②탐색과 통찰
 * 각 축 안에 3단계씩, 강조 하이라이트가 6단계를 순회하는 모션
 * ============================================================ */
const JOURNEY_PHASES = [
  {
    key: "A",
    axis: "AXIS 01",
    label: "진단과 분석",
    en: "DIAGNOSE & ANALYZE",
    tone: "ink" as const,
    nodes: [
      { n: "01", title: "진단 테스트", desc: "자가 보고식 척도로 현재 상태 측정" },
      { n: "02", title: "내면 가족 시스템(IFS)", desc: "내 안의 여러 부분을 하나씩 만나기" },
      { n: "03", title: "핵심 신념 발견", desc: "행동 뒤에서 작동하는 핵심 믿음 추적" },
    ],
  },
  {
    key: "B",
    axis: "AXIS 02",
    label: "탐색과 통찰",
    en: "EXPLORE & INSIGHT",
    tone: "warm" as const,
    nodes: [
      { n: "04", title: "긍정 의도 도출", desc: "그 반응이 지키려 했던 진짜 의도 찾기" },
      { n: "05", title: "강점 발견", desc: "패턴 속에 숨어 있던 나의 자원 확인" },
      { n: "06", title: "실전 전략 · 전체 리포트", desc: "구체적 행동 지침과 통합 리포트 제공" },
    ],
  },
];

const JOURNEY_TOTAL = JOURNEY_PHASES.reduce((s, p) => s + p.nodes.length, 0);

function JourneyPhaseColumn({
  phase,
  phaseIndex,
  active,
}: {
  phase: (typeof JOURNEY_PHASES)[number];
  phaseIndex: number;
  active: number;
}) {
  const activePhase = active < phase.nodes.length ? 0 : 1;
  return (
    <div
      className={`lr-track-col lr-track-${phase.tone} ${
        activePhase === phaseIndex ? "lr-track-on" : ""
      }`}
    >
      <div className="lr-track-head">
        <span className="lr-track-axis">{phase.axis}</span>
        <span className="lr-track-label">{phase.label}</span>
        <span className="lr-track-en">{phase.en}</span>
      </div>
      <div className="lr-track-rail">
        {phase.nodes.map((node, ni) => {
          const flatIdx = phaseIndex * phase.nodes.length + ni;
          return (
            <div
              key={node.n}
              className={`lr-track-node ${active === flatIdx ? "lr-active" : ""}`}
            >
              <span className="lr-tnum">{node.n}</span>
              <span className="lr-tbody">
                <span className="lr-ttitle">{node.title}</span>
                <span className="lr-tdesc">{node.desc}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function JourneyDiagram() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = setInterval(
      () => setActive((a) => (a + 1) % JOURNEY_TOTAL),
      1600,
    );
    return () => clearInterval(timer);
  }, []);
  const onSecondAxis = active >= JOURNEY_PHASES[0].nodes.length;
  return (
    <div className="lr-track-diagram lr-f-up">
      <JourneyPhaseColumn phase={JOURNEY_PHASES[0]} phaseIndex={0} active={active} />
      <div className={`lr-track-bridge ${onSecondAxis ? "lr-bridge-on" : ""}`}>
        <span className="lr-bridge-line" />
        <span className="lr-bridge-arrow">→</span>
        <span className="lr-bridge-caption">분석을 통찰로</span>
      </div>
      <JourneyPhaseColumn phase={JOURNEY_PHASES[1]} phaseIndex={1} active={active} />
    </div>
  );
}

function JourneyList() {
  return (
    <div className="lr-track-list">
      {JOURNEY_PHASES.map((phase) => (
        <div className={`lr-track-list-group lr-track-${phase.tone}`} key={phase.key}>
          <div className="lr-track-list-head">
            <span className="lr-track-axis">{phase.axis}</span>
            <span className="lr-track-label">{phase.label}</span>
          </div>
          {phase.nodes.map((node) => (
            <div className="lr-cycle-list-item" key={node.n}>
              <div className="lr-lnum">{node.n}</div>
              <div>
                <div className="lr-ltitle">{node.title}</div>
                <div className="lr-ldesc">{node.desc}</div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function OverviewJourneySection() {
  return (
    <section className="lr-cycle-section">
      <div className="lr-ambient" />
      <div className="lr-wrap-5">
        <div className="lr-s-header">
          <span className="lr-eyebrow lr-f-up">
            <span className="lr-dot" />
            THE JOURNEY
          </span>
          <h2 className="lr-f-up lr-d1">
            어떤 주제의 워크북이든
            <br />
            <em>두 개의 축</em>을 따라갑니다
          </h2>
        </div>
        <p className="lr-empathy lr-f-up">
          먼저 <b>진단과 분석</b>으로 지금의 나와 그 뒤의 신념을 들여다보고,
          <br />
          이어 <b>탐색과 통찰</b>로 긍정적 의도와 강점을 찾아
          <br />
          <b>실전 전략과 전체 리포트</b>까지 이어집니다.
        </p>
        <JourneyDiagram />
        <JourneyList />
        <div className="lr-journey-outcome lr-f-up">
          <span className="lr-outcome-connector" />
          <span className="lr-outcome-chev">↓</span>
          <div className="lr-outcome-card">
            <span className="lr-outcome-eyebrow">
              <span className="lr-dot" />
              워크북을 마치고 나면
            </span>
            <p className="lr-outcome-text">
              퍼포먼스를 망치는 <b>요인을 덜어내고</b>,
              <br />
              더 높은 <em>몰입과 퍼포먼스</em>를 낼 수 있습니다.
            </p>
          </div>
        </div>
        <div className="lr-cycle-conclusion lr-f-up">
          상담사가 따라가는 흐름을 워크북이 <b>두 축으로 안내</b>합니다.
          매번 같은 자리에 머무르지 않도록.
        </div>
      </div>
    </section>
  );
}

/* ============================================================
 * LineupSection — 주제별 워크북 라인업
 * 워크북이 단일 주제가 아니라 시리즈임을 보여주는 섹션
 * ============================================================ */
type LineupItem = {
  badge: string;
  title: string;
  desc: string;
  status: "live" | "coming";
  href?: string;
};

const LINEUP: LineupItem[] = [
  {
    badge: "WORKBOOK 01",
    title: "성취 중독",
    desc:
      "성과가 없으면 불안하고, 쉬려고 하면 더 불안한 마음을 풀어내는 워크북. 자가 진단부터 다음 한 달의 다른 행동까지 10단계.",
    status: "coming",
  },
  {
    badge: "WORKBOOK 02",
    title: "불안",
    desc:
      "같은 걱정이 끝없이 반복되는 패턴을 풀어내는 워크북. 걱정 사이클을 끊고 일상으로 돌아오는 길을 함께 그려봅니다.",
    status: "coming",
  },
  {
    badge: "WORKBOOK 03",
    title: "자기 비판",
    desc:
      "스스로를 다그치는 마음의 정체를 만나보고, 비난 대신 시도할 수 있는 다른 말을 적어보는 워크북.",
    status: "coming",
  },
  {
    badge: "WORKBOOK 04",
    title: "관계 패턴",
    desc:
      "연애·가족·직장에서 비슷한 갈등이 반복된다면, 그 패턴 뒤에 있는 신념과 다음에 시도해 볼 다른 반응을 정리합니다.",
    status: "coming",
  },
];

export function OverviewLineupSection() {
  return (
    <section className="lr-section" id="workbooks">
      <div className="lr-wrap-5">
        <div className="lr-s-header">
          <span className="lr-eyebrow lr-f-up">
            <span className="lr-dot" />
            WORKBOOK LINEUP
          </span>
          <h2 className="lr-f-up lr-d1">
            마음의 주제별로
            <br />
            <em>다른 워크북</em>이 준비됩니다
          </h2>
          <p className="lr-lede lr-f-up lr-d2">
            지금은 첫 워크북부터 만나보실 수 있어요.
          </p>
        </div>
        <div className="lr-lineup-grid">
          {LINEUP.map((item, i) => {
            // live → 상세 페이지(item.href) / coming → 대기자 등록(/waitlist)
            const isLive = item.status === "live";
            const link = isLive ? item.href : "/waitlist";
            const inner = (
              <>
                <div className="lr-lu-head">
                  <span className="lr-lu-badge">{item.badge}</span>
                  {isLive ? (
                    <span className="lr-lu-status lr-lu-live">
                      <span className="lr-dot" />
                      판매중
                    </span>
                  ) : (
                    <span className="lr-lu-status lr-lu-coming">
                      COMING SOON
                    </span>
                  )}
                </div>
                <h3 className="lr-lu-title">{item.title}</h3>
                <p className="lr-lu-desc">{item.desc}</p>
                <div className="lr-lu-cta">
                  {isLive ? "상세보기" : "대기자 등록"}
                  <span className="lr-arrow">→</span>
                </div>
              </>
            );
            return link ? (
              <a
                href={link}
                className={`lr-lu-card ${
                  isLive ? "lr-lu-live-card" : ""
                } lr-f-up`}
                style={{ transitionDelay: `${i * 0.08}s` }}
                key={item.badge}
              >
                {inner}
              </a>
            ) : (
              <div
                className="lr-lu-card lr-f-up"
                style={{ transitionDelay: `${i * 0.08}s` }}
                key={item.badge}
              >
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
