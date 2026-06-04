"use client";

import { useEffect, useState } from "react";

/**
 * 워크북 전반 페이지의 "HOW IT WORKS" 섹션.
 *
 * 기존 PointsSection은 모든 미리보기 카드(Likert · 진단 결과 · Cascade · 라이팅 ·
 * 근거 카드)가 성취 중독 한정 카피였다. 여기서는 동일한 카드 구조를 유지하면서
 * 데이터만 워크북 전반(IFS + CBT) 톤으로 교체한다.
 */

/* ============================================================
 * POINT 1 — Likert 자가 진단 무한 루프
 * ============================================================ */
const LIKERT_QS = [
  { n: 1, q: "내 안에 서로 다투는 마음들이 있다고 느낀다.", ans: 4 },
  { n: 2, q: "최근 한 달, 비슷한 갈등이 다른 상황에서도 반복됐다.", ans: 5 },
  { n: 3, q: "쉬려고 하면 죄책감, 일하면 압박감이 동시에 든다.", ans: 4 },
];

function PointOneCard() {
  const [idx, setIdx] = useState(0);
  const [showAns, setShowAns] = useState(false);
  useEffect(() => {
    setShowAns(false);
    const t1 = setTimeout(() => setShowAns(true), 1200);
    const t2 = setTimeout(() => setIdx((i) => (i + 1) % 3), 3600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [idx]);
  const q = LIKERT_QS[idx];
  return (
    <div className="lr-point-card">
      <div className="lr-pc-head">
        <b>STEP 01 · 자가 진단</b>
        <span>{q.n} / 3</span>
      </div>
      <div className="lr-pc-body">
        <div className="lr-likert-progress">
          <div className="lr-fill" style={{ width: `${(q.n / 3) * 100}%` }} />
        </div>
        <div className="lr-likert-q">
          Q{q.n}. {q.q}
        </div>
        <div className="lr-likert-scale">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`lr-likert-dot ${showAns && i === q.ans ? "lr-on" : ""}`}
            />
          ))}
        </div>
        <div className="lr-likert-foot">
          <span>전혀 아니다</span>
          <span>매우 그렇다</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * POINT 2 — 3슬라이드 캐러셀 (진단 / Cascade / Daily)
 * ============================================================ */
const SCORES = [
  { l: "통제·계획하는 마음", v: 19, max: 25 },
  { l: "고통에서 벗어나려는 마음", v: 18, max: 25 },
  { l: "안에 숨은 어린 마음", v: 21, max: 25 },
  { l: "스스로를 다그치는 마음", v: 14, max: 25 },
];

function DiagSlide({ active }: { active: boolean }) {
  const [score, setScore] = useState(0);
  const [chip, setChip] = useState(false);
  const [bars, setBars] = useState(false);
  useEffect(() => {
    if (!active) {
      setScore(0);
      setChip(false);
      setBars(false);
      return;
    }
    let v = 0;
    const t = setInterval(() => {
      v += 4;
      setScore(Math.min(72, v));
      if (v >= 72) clearInterval(t);
    }, 40);
    const c = setTimeout(() => setChip(true), 1100);
    const b = setTimeout(() => setBars(true), 1300);
    return () => {
      clearInterval(t);
      clearTimeout(c);
      clearTimeout(b);
    };
  }, [active]);
  return (
    <div
      className="lr-diag-r"
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <div
        className="lr-pc-head"
        style={{ margin: "-28px -26px 18px", padding: "16px 24px" }}
      >
        <b>STEP 02 · 진단 결과</b>
        <span>DIAGNOSIS REPORT</span>
      </div>
      <div className="lr-score-line">
        <span className="lr-score-num">{score}</span>
        <span className="lr-score-out">/ 100</span>
      </div>
      <div className={`lr-level-pill ${chip ? "lr-in" : ""}`}>
        LV.3 · 균형 조정이 필요한 단계
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 12,
        }}
      >
        {SCORES.map((s, i) => (
          <div className="lr-bar-row" key={s.l}>
            <div className="lr-bl">
              <span>{s.l}</span>
              <b>
                {s.v}/{s.max}
              </b>
            </div>
            <div className="lr-bar-track">
              <div
                className="lr-bar-fill"
                style={{
                  width: bars ? `${(s.v / s.max) * 100}%` : 0,
                  transitionDelay: `${i * 0.16}s`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const CASCADE = [
  {
    tag: "트리거",
    title: "기대한 만큼 일이 풀리지 않은 상황",
    desc: "이 상황이 '나는 부족하다'는 증거로 즉시 해석됩니다.",
  },
  {
    tag: "자동 사고",
    title: "이번에도 비슷하게 끝날 것 같다",
    desc: "과거 경험을 투사해 최악의 시나리오로 확장됩니다.",
  },
  {
    tag: "자기 정의",
    title: "원래 나는 이런 사람이야",
    desc: "행동 패턴을 영구적이고 본질적인 정체성으로 낙인 찍습니다.",
  },
];

function CascadeSlide({ active }: { active: boolean }) {
  const [step, setStep] = useState(-1);
  useEffect(() => {
    if (!active) {
      setStep(-1);
      return;
    }
    const t1 = setTimeout(() => setStep(0), 500);
    const t2 = setTimeout(() => setStep(1), 1900);
    const t3 = setTimeout(() => setStep(2), 3300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [active]);
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        className="lr-pc-head"
        style={{ margin: "-28px -26px 18px", padding: "16px 24px" }}
      >
        <b>STEP 05 · 통합 패턴 분석</b>
        <span>COGNITIVE CASCADE</span>
      </div>
      <div className="lr-cascade-list">
        {CASCADE.map((c, i) => (
          <div
            key={c.tag}
            className={`lr-cascade-node ${step >= i ? "lr-in" : ""} ${step === i ? "lr-active" : ""}`}
          >
            <div className="lr-cn">{String(i + 1).padStart(2, "0")}</div>
            <div className="lr-ct">
              <b>
                <span className="lr-cascade-tag">{c.tag}</span>
                {c.title}
              </b>
              <span>{c.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const DAILY = [
  { n: "01", t: "다른 첫 반응 시도", s: "같은 자극, 다른 한 마디" },
  { n: "02", t: "다그치지 않는 시간", s: "내 안의 비판자에게 휴식 주기" },
  { n: "03", t: "한 번의 대안 행동", s: "이번 주 한 번, 다른 선택해보기" },
];

function DailySlide({ active }: { active: boolean }) {
  const [step, setStep] = useState(-1);
  const [done, setDone] = useState<[boolean, boolean, boolean]>([
    false,
    false,
    false,
  ]);
  useEffect(() => {
    if (!active) {
      setStep(-1);
      setDone([false, false, false]);
      return;
    }
    const t1 = setTimeout(() => setStep(0), 500);
    const t2 = setTimeout(() => setStep(1), 1500);
    const t3 = setTimeout(() => setStep(2), 2500);
    const d1 = setTimeout(() => setDone((s) => [true, s[1], s[2]]), 3300);
    const d2 = setTimeout(() => setDone((s) => [s[0], true, s[2]]), 3800);
    const d3 = setTimeout(() => setDone((s) => [s[0], s[1], true]), 4300);
    return () => {
      [t1, t2, t3, d1, d2, d3].forEach(clearTimeout);
    };
  }, [active]);
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        className="lr-pc-head"
        style={{ margin: "-28px -26px 18px", padding: "16px 24px" }}
      >
        <b>STEP 09 · 종합 가이드</b>
        <span>DAILY ACTION</span>
      </div>
      <div className="lr-daily-head">다음 한 달, 이렇게 살아보세요.</div>
      <div className="lr-daily-do">✓ DO · 새 신념을 지키는 행동</div>
      <div className="lr-daily-act">
        {DAILY.map((d, i) => (
          <div
            key={d.n}
            className={`lr-daily-row ${step >= i ? "lr-in" : ""} ${done[i] ? "lr-done" : ""}`}
          >
            <div className="lr-dn">{d.n}</div>
            <div className="lr-dt">
              <b>{d.t}</b>
              <span>{d.s}</span>
            </div>
            <div className="lr-dc">✓</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PointTwoCard() {
  const [s, setS] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setS((x) => (x + 1) % 3), 6000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="lr-point-card" style={{ padding: "28px 26px" }}>
      {s === 0 && <DiagSlide active />}
      {s === 1 && <CascadeSlide active />}
      {s === 2 && <DailySlide active />}
      <div className="lr-carousel-dots">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`lr-cd ${s === i ? "lr-on" : ""}`} />
        ))}
      </div>
    </div>
  );
}

/* ============================================================
 * POINT 3 — 라이팅 테라피 타이핑 효과 (IFS 톤)
 * ============================================================ */
const TYPING_SEQ = [
  {
    p: "3 / 10",
    prev: "",
    q: "그 상황에서 내 안의 어떤 마음이 나섰을까요?",
    stem: "그때 나선 마음은…",
    text: "“이번에는 제대로 해야 한다.”",
  },
  {
    p: "5 / 10",
    prev: "“이번에는 제대로 해야 한다.”",
    q: "그 마음 아래엔 어떤 믿음이 있을까요?",
    stem: "그 마음이 지키려는 건…",
    text: "“실수하면 안전하지 않다”는 생각.",
  },
  {
    p: "7 / 10",
    prev: "“실수하면 안전하지 않다”",
    q: "그렇다면 다음에는 어떻게 다르게 해볼까요?",
    stem: "다음에 시도해볼 한 가지는…",
    text: "한 번의 실수는 그냥 한 번으로 넘어가기.",
  },
];

function PointThreeCard() {
  const [idx, setIdx] = useState(0);
  const [typed, setTyped] = useState("");
  useEffect(() => {
    const cur = TYPING_SEQ[idx];
    setTyped("");
    let i = 0;
    const t = setInterval(() => {
      i++;
      setTyped(cur.text.slice(0, i));
      if (i >= cur.text.length) clearInterval(t);
    }, 60);
    const next = setTimeout(
      () => setIdx((x) => (x + 1) % 3),
      60 * cur.text.length + 1800,
    );
    return () => {
      clearInterval(t);
      clearTimeout(next);
    };
  }, [idx]);
  const cur = TYPING_SEQ[idx];
  return (
    <div className="lr-point-card">
      <div className="lr-pc-head">
        <b>STEP 04 · 라이팅 테라피</b>
        <span>{cur.p}</span>
      </div>
      <div className="lr-pc-body lr-typing-box">
        <div className={`lr-ans-quote ${cur.prev ? "" : "lr-empty"}`}>
          {cur.prev || "—"}
        </div>
        <div className="lr-new-q">{cur.q}</div>
        <div className="lr-input-area">
          <div className="lr-stem">{cur.stem}</div>
          <span className="lr-typed">{typed}</span>
          <span className="lr-caret" />
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * POINT 4 — 근거 모으기 + 자기 확언 (워크북 전반)
 * ============================================================ */
const EVI = [
  "지난주 한 번 다르게 반응했더니 갈등이 짧아졌다",
  "스스로 다그치지 않은 날, 집중이 더 잘 됐다",
  "쉬어준 다음날 회의 발언이 더 또렷했다",
];
const AFFIRM = [
  { n: "01", t: "내 안의 부분들은 모두 나를 지키려 한다." },
  { n: "02", t: "한 번의 다른 선택이 다음 한 달을 바꿀 수 있다." },
];

function PointFourCard() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const seq = [500, 1500, 2500, 3500, 4400];
    const timers = seq.map((d, i) =>
      setTimeout(() => setStage(i + 1), d),
    );
    const reset = setTimeout(() => setStage(0), 7500);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(reset);
    };
  }, [stage === 0 ? "start" : "run"]);
  useEffect(() => {
    if (stage === 5) {
      const r = setTimeout(() => setStage(0), 2500);
      return () => clearTimeout(r);
    }
  }, [stage]);
  const filledStars = Math.min(5, Math.floor(stage) + 2);
  return (
    <div className="lr-point-card">
      <div className="lr-pc-body" style={{ padding: "20px 22px" }}>
        <div className="lr-evi-head">
          <span>STEP 08 · 근거 모으기</span>
          <span className="lr-stars">
            {"★".repeat(filledStars)}
            {"☆".repeat(5 - filledStars)}
          </span>
        </div>
        <div className="lr-evi-belief">
          <span>&ldquo;다른 반응을 시도해도 안전하다&rdquo;</span>
        </div>
        <div className="lr-evi-cards">
          {EVI.map((e, i) => (
            <div
              key={e}
              className={`lr-evi-card ${stage >= i + 1 ? "lr-in" : ""}`}
            >
              <div className="lr-em">✓</div>
              <div>{e}</div>
            </div>
          ))}
        </div>
        <div className="lr-affirm-section">
          <div className="lr-ah">
            <span>STEP 09 · 자기 확언</span>
            <span>AFFIRMATION CARDS</span>
          </div>
          <div className="lr-affirm-grid">
            {AFFIRM.map((a, i) => (
              <div
                key={a.n}
                className={`lr-affirm-card ${stage >= i + 4 ? "lr-in" : ""}`}
              >
                <div className="lr-at-num">AFFIRMATION · {a.n}</div>
                {a.t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
 * 4 POINT 메인 섹션
 * ============================================================ */
type PointDef = {
  n: string;
  title: [string, string];
  desc: string;
  checks: string[];
  Card: React.FC;
  accent?: boolean;
};

const POINTS: PointDef[] = [
  {
    n: "POINT 01",
    title: ["복잡한 마음을", "진단으로 정리부터"],
    desc:
      "Likert 5점 척도로 내 안의 어떤 부분이 지금 가장 큰 목소리를 내고 있는지 객관적인 점수로 보여드려요. 막연한 “요즘 좀 그래”에서 출발하는 게 아니라, 어느 축이 과활성화되어 있는지부터 정확히 짚습니다.",
    checks: [
      "표준화된 자기 보고식 척도",
      "총점 기반 4단계 수준 분석",
      "내면의 4가지 부분 점수 시각화",
    ],
    Card: PointOneCard,
    accent: true,
  },
  {
    n: "POINT 02",
    title: ["워크북을 마치면", "3가지 리포트가 남아요"],
    desc:
      "한 번의 워크북에서 서로 다른 시점의 리포트가 누적됩니다. 진단 결과 / 인지 패턴 분석 / 종합 가이드 — 다음 한 달을 어떻게 살아볼지가 한 장씩 손에 남아요.",
    checks: [
      "자가 진단 리포트 · 부분별 분석",
      "자동사고 / 핵심 신념 분석 리포트",
      "종합 상담 리포트 + 다음 한 달 가이드",
    ],
    Card: PointTwoCard,
  },
  {
    n: "POINT 03",
    title: ["상담사가 대화를", "이끌듯 글로 따라가요"],
    desc:
      "전 단계의 답변이 다음 질문의 단서가 되는 라이팅 테라피. 실습지를 한 칸씩 채우는 동안 내 안의 부분과 신념, 그리고 다음에 시도해볼 다른 행동이 한 줄씩 모습을 드러냅니다.",
    checks: [
      "내면의 부분 대화 워크시트",
      "하향 화살표 기법 (Downward Arrow)",
      "대안 사고 시뮬레이션 (Alternative Thought)",
    ],
    Card: PointThreeCard,
    accent: true,
  },
  {
    n: "POINT 04",
    title: ["답을 찾는 것에서", "끝나지 않아요"],
    desc:
      "찾은 답이 진짜 다음 행동이 될 때까지 근거로 강화하고, 일상의 행동 가이드와 자기 확언 카드로 단단히 굳혀갑니다. 위로가 아니라 다음 시도가 남도록.",
    checks: [
      "근거 카드로 새 신념 강화 (★★★ → ★★★★★)",
      "DO & DON'T 일상 행동 가이드",
      "자기 확언 카드 (Affirmation Cards)",
    ],
    Card: PointFourCard,
  },
];

export function OverviewPointsSection() {
  return (
    <section className="lr-section" id="points">
      <div className="lr-wrap-6">
        <div className="lr-s-header">
          <span className="lr-eyebrow lr-f-up">
            <span className="lr-dot" />
            HOW IT WORKS
          </span>
          <h2 className="lr-f-up lr-d1">
            마음 챙김 워크북은
            <br />
            <em>이렇게 작동</em>합니다
          </h2>
          <p className="lr-lede lr-f-up lr-d2">
            실제 워크북 화면 그대로의 4가지 핵심 흐름을 보여드릴게요.
          </p>
        </div>
        {POINTS.map((p, i) => {
          const Card = p.Card;
          const reverse = i % 2 === 1;
          const accentText = p.accent ? <em>{p.title[1]}</em> : p.title[1];
          return (
            <div
              className={`lr-point-block ${reverse ? "lr-reverse" : ""}`}
              key={p.n}
            >
              <div className="lr-point-copy lr-f-up">
                <div className="lr-point-num">
                  {p.n}{" "}
                  <span
                    style={{
                      fontFamily: "Inter",
                      letterSpacing: "0.18em",
                      color: "var(--lr-mute)",
                    }}
                  >
                    0{i + 1} / 04
                  </span>
                </div>
                <h3>
                  {p.title[0]}
                  <br />
                  {accentText}
                </h3>
                <p className="lr-pdesc">{p.desc}</p>
                <div className="lr-pchecks">
                  {p.checks.map((c) => (
                    <div className="lr-pcheck" key={c}>
                      <span className="lr-pcm">✓</span>
                      {c}
                    </div>
                  ))}
                </div>
              </div>
              <div className="lr-point-card-wrap lr-f-up lr-d1">
                <Card />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
