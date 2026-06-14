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

        {/* Part B — 1급 심리 상담사 신뢰 배너 */}
        <div className="lr-trust-band lr-f-up lr-d1">
          <div className="lr-trust-grid-bg" />
          <div className="lr-trust-head">
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
                검증된 이론을 <b>상담 현장의 순서</b> 그대로
                <br />
                워크북 한 권에 옮겼습니다
              </h3>
            </div>
          </div>
          <div className="lr-trust-profiles">
            {CREATORS.map((c) => (
              <div className="lr-trust-profile" key={c.name}>
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
 * JourneySection — 워크북 공통 5단계 여정 (CycleSection 자리)
 * 순환 사이클(성취중독)이 아닌, "지금→다음 한 달"로 향하는 5단계 흐름
 * ============================================================ */
const JOURNEY_NODES = [
  {
    n: "01",
    title: "지금의 나 진단",
    desc: "자가 보고식 척도로 현재 상태 측정",
  },
  {
    n: "02",
    title: "안의 부분 만나기",
    desc: "내 안의 여러 마음을 하나씩 알아보기",
  },
  {
    n: "03",
    title: "반복되는 신념 찾기",
    desc: "행동 뒤에서 작동하는 핵심 믿음 추적",
  },
  {
    n: "04",
    title: "다른 가능성 그리기",
    desc: "지금까지와 다른 반응·해석·선택의 시뮬레이션",
  },
  {
    n: "05",
    title: "다음 한 달 행동 계획",
    desc: "구체적 DO & DON'T로 일상에 옮기기",
  },
];

const JOURNEY_POSITIONS = [
  { top: "12%", left: "50%" },
  { top: "32%", left: "88%" },
  { top: "75%", left: "75%" },
  { top: "75%", left: "25%" },
  { top: "32%", left: "12%" },
];

function JourneyDiagram() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timer = setInterval(
      () => setActive((a) => (a + 1) % JOURNEY_NODES.length),
      1800,
    );
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="lr-cycle-diagram lr-f-up">
      <div className="lr-cycle-ring-2" />
      <div className="lr-cycle-ring" />
      <div className="lr-cycle-center">
        <div className="lr-core">
          <div className="lr-core-inner">
            <div className="lr-label">5단계</div>
            <div className="lr-label-2">JOURNEY</div>
          </div>
        </div>
      </div>
      {JOURNEY_NODES.map((node, i) => (
        <div
          key={node.n}
          className={`lr-cycle-node ${active === i ? "lr-active" : ""}`}
          style={{
            top: JOURNEY_POSITIONS[i].top,
            left: JOURNEY_POSITIONS[i].left,
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

function JourneyList() {
  return (
    <div className="lr-cycle-list">
      {JOURNEY_NODES.map((node) => (
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
            <em>같은 5단계 여정</em>을 따라갑니다
          </h2>
        </div>
        <p className="lr-empathy lr-f-up">
          <b>진단</b>에서 시작해 나의 퍼포먼스를 가로막는 <b>부분들</b>을 분석하고,
          <br />
          실제 상담처럼 <b>문답</b>을 통해 개선점과 행동 지침을 도출한
          <br />
          <b>최종 리포트</b>가 제공됩니다.
        </p>
        <JourneyDiagram />
        <JourneyList />
        <div className="lr-cycle-conclusion lr-f-up">
          상담사가 따라가는 흐름을 워크북이 <b>한 단계씩 안내</b>합니다.
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
