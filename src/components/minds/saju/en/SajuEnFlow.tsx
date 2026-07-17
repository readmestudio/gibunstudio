"use client";

import { useEffect, useRef, useState } from "react";
import { getAttribution } from "@/lib/attribution";
import type { Element, SajuChart } from "@/lib/saju/types";

/**
 * /saju/en — English "Korean Saju" funnel (no login, no overseas payment yet).
 *
 * inner-child 후속 병렬 퍼널. 사주팔자 × 자미두수 이중 엔진 컨셉을 영어권에 판매.
 * 디자인은 한국어 inner-child(InnerChildSalesPage)의 "밤하늘 서사 ↔ 크림 카드" 2층
 * 시스템에 얼라인(라벤더 --sage 포인트). 결제 대신 이메일 요청(inner-child en 방식) 예정.
 *
 * ⚠️ 현재 슬라이스: 프론트 퍼널만. 명반은 더미 값이며, 실제 엔진(lunar-typescript + iztro)과
 * 이메일 백엔드(/api/saju/en/request + Resend)는 후속에서 배선한다.
 */

type ConcernKey =
  | "love"
  | "money"
  | "decision"
  | "family"
  | "burnout"
  | "direction";

const CHIPS: ReadonlyArray<readonly [ConcernKey, string]> = [
  ["love", "Love & relationships"],
  ["money", "Money & career"],
  ["decision", "A big decision"],
  ["family", "Family"],
  ["burnout", "Burnout"],
  ["direction", "My direction"],
];

/** UI 시간 선택 → iztro/사주 시지 index (子=0 … null=모름) */
const TIME_INDEX: Record<string, number | null> = {
  "I don’t know my time": null,
  "05–07 AM": 3,
  "07–09 AM": 4,
  "Around midnight": 0,
  "Around noon": 6,
};

const ELEMENT_ORDER: readonly Element[] = ["Wood", "Fire", "Earth", "Metal", "Water"];

/**
 * leadId 는 localStorage 에 보관한다(inner-child en 과 동일 패턴).
 * React state 만 쓰면 새로고침·HMR 리마운트에서 날아가고, 그러면 이메일 요청이 leadId 없이
 * 나가 리포트 링크가 /saju/en/r/ 로 깨진다(실측된 증상).
 */
const LEAD_KEY = "saju_en_lead_id";

function readStoredLeadId(): string | null {
  try {
    return window.localStorage.getItem(LEAD_KEY);
  } catch {
    return null;
  }
}

function storeLeadId(id: string) {
  try {
    window.localStorage.setItem(LEAD_KEY, id);
  } catch {
    /* 프라이빗 모드 등 — 서버가 리드를 만들어 주므로 치명적이지 않다 */
  }
}

type ConcernContent = {
  echo: string;
  bridge: string;
  kick: string;
  title: string;
  locks: readonly string[];
};

const CONCERNS: Record<ConcernKey, ConcernContent> = {
  money: {
    echo: "You said money's been on your mind.",
    bridge: "The larger shape of your life begins to surface — how much you'll come to have.",
    kick: "Wealth · over time",
    title: "Your wealth over time",
    locks: [
      "The years your assets grow the most",
      "The years to guard against loss",
      "How to double the capacity you were born with",
    ],
  },
  love: {
    echo: "You said love's felt hard lately.",
    bridge: "The larger shape of your life begins to surface — when, and who.",
    kick: "Relationships · over time",
    title: "Your relationships over time",
    locks: [
      "The season a real bond arrives",
      "The years a relationship tends to wobble",
      "The shape you keep repeating in love",
    ],
  },
  decision: {
    echo: "You said a big decision's ahead.",
    bridge: "The larger shape of your life begins to surface — whether now is the time.",
    kick: "Timing · over time",
    title: "Your timing",
    locks: [
      "The exact window it's safe to move",
      "The years worth waiting for",
      "The trap years to sit out",
    ],
  },
  family: {
    echo: "You said family's been on your mind.",
    bridge: "The larger shape of your life begins to surface — how these ties loosen and hold.",
    kick: "Family · over time",
    title: "Your family ties over time",
    locks: [
      "When you grow closer, and drift",
      "The invisible role you've carried",
      "The year a knot finally loosens",
    ],
  },
  burnout: {
    echo: "You said you've been running on empty.",
    bridge: "The larger shape of your life begins to surface — when you fill back up.",
    kick: "Energy · over time",
    title: "Your energy over time",
    locks: [
      "The signs your energy is draining",
      "The season you recover",
      "The way you're built to last",
    ],
  },
  direction: {
    echo: "You said your direction feels unclear.",
    bridge: "The larger shape of your life begins to surface — where you're actually headed.",
    kick: "Path · over time",
    title: "Your path over time",
    locks: [
      "The season your path comes into focus",
      "The place you return to no matter what",
      "The center to hold when you waver",
    ],
  },
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDob(iso: string): string {
  const parts = iso.split("-");
  if (parts.length !== 3) return "";
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (!y || !m || !d) return "";
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

const CHECK_MASK =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M20 6 9 17l-5-5' fill='none' stroke='%23000' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\") center/13px no-repeat";

export function SajuEnFlow() {
  const [phase, setPhase] = useState<"intro" | "reading">("intro");
  const [concern, setConcern] = useState<ConcernKey>("money");
  const [dob, setDob] = useState("1994-03-12");
  const [tob, setTob] = useState("07–09 AM");
  const [sex, setSex] = useState("Female");
  const [loc, setLoc] = useState("Seoul");
  const [modalOpen, setModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [chart, setChart] = useState<SajuChart | null>(null);
  const [casting, setCasting] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // 저장된 leadId 복구 — 새로고침/리마운트로 리드를 잃지 않게
  useEffect(() => {
    const stored = readStoredLeadId();
    if (stored) setLeadId(stored);
  }, []);

  // scroll reveal (fade-up on scene + card)
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.14 },
    );
    root.querySelectorAll(".sj-anim, .sj-scene").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [phase]);

  /** 출생 입력 → 서버 payload (엔진·리포트 요청 공용) */
  function birthPayload() {
    return {
      date: dob,
      timeIndex: tob in TIME_INDEX ? TIME_INDEX[tob] : null,
      gender: sex.toLowerCase() === "male" ? "male" : "female",
    };
  }

  /** 익명 리드 생성 — 이후 이메일 요청이 이 행을 채운다(fire-and-forget) */
  function ensureLead() {
    if (leadId || readStoredLeadId()) return;
    fetch("/api/minds/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: "saju",
        // utm_*·fbclid 를 함께 실어야 어떤 광고가 이 리드를 데려왔는지 알 수 있다.
        // (전역 AttributionCapture 가 sessionStorage 에 담아둔 값)
        attribution: { ...getAttribution(), landing_path: "/saju/en" },
      }),
    })
      .then((r) => r.json())
      .then((d: { id?: string | null }) => {
        if (d?.id) {
          setLeadId(d.id);
          storeLeadId(d.id);
        }
      })
      .catch(() => {
        /* 리드 실패가 결과 보기를 막지 않는다 — 서버가 요청 시점에 다시 만든다 */
      });
  }

  async function goReading() {
    setCasting(true);
    ensureLead();
    const payload = birthPayload();
    try {
      const res = await fetch("/api/saju/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: { chart?: SajuChart } = await res.json();
      if (data.chart) setChart(data.chart);
    } catch {
      // 실패해도 리딩으로 진입 — 아래 렌더가 방어적 폴백을 쓴다
    } finally {
      setCasting(false);
      setPhase("reading");
      window.scrollTo(0, 0);
    }
  }

  function scrollToBegin() {
    document.getElementById("sj-begin")?.scrollIntoView({ behavior: "smooth" });
  }

  async function submitEmail() {
    const v = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) {
      setEmailError(true);
      return;
    }
    setSending(true);
    try {
      await fetch("/api/saju/en/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // state 가 비어도 저장본을 쓴다 — 둘 다 없으면 서버가 리드를 만든다(3중 안전망)
          leadId: leadId ?? readStoredLeadId(),
          email: v,
          concern,
          ...birthPayload(),
        }),
      });
    } catch {
      // 네트워크 실패해도 확인 화면은 보여준다 — 재시도 안내는 메일 미도착으로 갈음
    } finally {
      setSending(false);
      setSentTo(v);
    }
  }

  function closeModal() {
    setModalOpen(false);
    setSentTo(null);
    setEmailError(false);
  }

  const c = CONCERNS[concern];

  // 진짜 명반(있으면) / 방어적 폴백
  const pillars = chart?.four.pillars ?? [
    { label: "Year", stem: "甲", branch: "戌" },
    { label: "Month", stem: "丁", branch: "卯" },
    { label: "Day", stem: "丁", branch: "酉" },
  ];
  const elements = chart?.four.elements ?? { Wood: 3, Fire: 2, Earth: 2, Metal: 0, Water: 1 };
  const dm = chart?.persona ?? {
    stem: "丁",
    pinyin: "Dīng",
    element: "Fire" as Element,
    yin: true,
    polarity: "Yin Fire",
    name: "The Lantern",
    tags: ["intimate warmth", "steady glow", "guides in the dark"],
  };
  const ziwei = chart?.ziwei ?? null;
  const mingStar = ziwei?.mingStar ?? null;

  const echoLine =
    `${formatDob(dob)}` +
    `${tob && tob !== "I don’t know my time" ? `, ${tob}` : ""}` +
    `${loc ? `, in ${loc}` : ""}. Let me lay out the sky as it stood.`;

  return (
    <div className="sj-root" ref={rootRef}>
      <style>{CSS}</style>

      {phase === "intro" ? (
        <>
          {/* HERO — night sky */}
          <section className="sj-scene tall">
            <span className="sj-stars" aria-hidden />
            <div className="sj-sinner">
              <span className="sj-label sj-eyebrow sj-line">
                A 1,000-year-old reading of a life
              </span>
              <h1 className="sj-h1 sj-line d1">
                Your birth chart,
                <br />
                read the Korean way.
              </h1>
              <p className="sj-sub sj-line d2">
                Two ancient systems read the same moment you were born. Where they
                agree is where you are, most certainly, yourself.
              </p>
              <div className="sj-entry sj-line d2">
                <div className="sj-daterow">
                  <input
                    className="sj-date"
                    type="date"
                    value={dob}
                    aria-label="Date of birth"
                    onChange={(e) => setDob(e.target.value)}
                  />
                  <button className="sj-btn" type="button" onClick={scrollToBegin}>
                    See my chart
                  </button>
                </div>
                <span className="sj-note">No quiz — just the date you were born.</span>
              </div>
            </div>
          </section>

          {/* CELEB — cream */}
          <section className="sj-cardwrap sj-anim">
            <p className="sj-label sj-sec-eyebrow">Three Koreans · One pattern</p>
            <h2 className="sj-h2">
              They work in different worlds. Their charts say the same thing.
            </h2>
            <div className="sj-celebs">
              {[
                ["RM", "BTS · Leader", "b. 1994", "A chart built to lead with words — a life spent speaking on the world's stage."],
                ["Son Heung-min", "Tottenham · Footballer", "b. 1992", "A chart that pushes until it arrives — the endurance that carries a whole season."],
                ["Bong Joon-ho", "Filmmaker · Academy Award", "b. 1969", "A chart that reads what others miss — a life spent turning the world into story."],
              ].map(([nm, role, yr, read]) => (
                <article className="sj-celeb" key={nm}>
                  <div className="sj-who">
                    <span className="sj-cnm">{nm}</span>
                    <span className="sj-cyr">{yr}</span>
                  </div>
                  <div className="sj-crole">{role}</div>
                  <p className="sj-cread">{read}</p>
                </article>
              ))}
            </div>
            <p className="sj-illus">
              Illustrative readings based on public birth years. Your report computes
              your own chart directly.
            </p>
          </section>

          {/* WHAT IS SAJU — night sky */}
          <section className="sj-scene mid">
            <span className="sj-stars" aria-hidden />
            <div className="sj-sinner">
              <span className="sj-label sj-eyebrow sj-line">What is Saju</span>
              <p className="sj-line d1">
                The moment you were born, written in <b>eight characters</b> — and
                mapped across <b>twelve houses</b>.
              </p>
              <p className="sj-voice sj-line d2">
                Two systems read the same sky. Where they agree is the part of you
                that’s most certainly true.
              </p>
            </div>
          </section>

          {/* ONBOARDING — cream */}
          <section className="sj-cardwrap sj-anim" id="sj-begin">
            <p className="sj-label sj-sec-eyebrow">Begin</p>
            <h2 className="sj-h2">Almost there.</h2>
            <p className="sj-sub-c">
              The time and place sharpen your chart — then tell us what’s on your mind.
            </p>
            <div className="sj-card sj-form">
              <label className="sj-flabel">Time of birth · Sex · Birthplace</label>
              <div className="sj-row3">
                <select className="sj-sel" value={tob} onChange={(e) => setTob(e.target.value)}>
                  <option>I don’t know my time</option>
                  <option>07–09 AM</option>
                  <option>05–07 AM</option>
                  <option>Around midnight</option>
                  <option>Around noon</option>
                </select>
                <select className="sj-sel" value={sex} onChange={(e) => setSex(e.target.value)}>
                  <option>Female</option>
                  <option>Male</option>
                </select>
                <select className="sj-sel" value={loc} onChange={(e) => setLoc(e.target.value)}>
                  <option>Seoul</option>
                  <option>London</option>
                  <option>New York</option>
                  <option>Los Angeles</option>
                </select>
              </div>
              <label className="sj-flabel sj-mt">
                What’s been on your mind — pick one, or none
              </label>
              <div className="sj-chips">
                {CHIPS.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className="sj-chip"
                    aria-pressed={concern === key}
                    onClick={() => setConcern(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button className="sj-btn sj-open" type="button" onClick={goReading}>
                Open my chart
              </button>
              <p className="sj-hint">Your reading adapts to what you pick.</p>
            </div>
          </section>
        </>
      ) : (
        <>
          {/* READING — reader voice (night) ↔ cards (cream) */}
          <section className="sj-scene short">
            <span className="sj-stars" aria-hidden />
            <div className="sj-sinner">
              <p className="sj-voice sj-line">{echoLine}</p>
            </div>
          </section>

          <div className="sj-cardwrap">
            {/* Chart — free */}
            <div className="sj-card sj-anim">
              <div className="sj-kick">The Chart · Four Pillars</div>
              <h3>Eight characters from your birth moment</h3>
              <span className="sj-free">Free · shown in full</span>
              <div className="sj-pillars">
                {pillars.map((p) => (
                  <div className={`sj-pil${p.label === "Day" ? " self" : ""}`} key={p.label}>
                    <div className="pl">{p.label === "Day" ? "Day · You" : p.label}</div>
                    <div className="ps">{p.stem}</div>
                    <div className="pb">{p.branch}</div>
                  </div>
                ))}
              </div>
              <div className="sj-elems">
                {ELEMENT_ORDER.map((el) => (
                  <span key={el}>{el} <b>{elements[el]}</b></span>
                ))}
              </div>
              {ziwei ? (
                <div className="sj-palace">
                  {ziwei.palaces.map((p) => (
                    <div className={`sj-gung${p.name === "Self" ? " ming" : ""}`} key={p.name}>
                      <div className="gn">{p.name}</div>
                      <div className="gs">{p.stars.length ? p.stars.join(" · ") : "—"}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="sj-illus" style={{ marginTop: 14 }}>
                  Add your birth time to map the twelve houses.
                </p>
              )}
            </div>
          </div>

          <section className="sj-scene short">
            <span className="sj-stars" aria-hidden />
            <div className="sj-sinner">
              <p className="sj-voice sj-line">
                Among these eight, one star leads you. Here is its name.
              </p>
            </div>
          </section>

          <div className="sj-cardwrap">
            {/* Type reveal + cut lock */}
            <div className="sj-card sj-anim">
              <div className="sj-reveal">
                <div className="sj-dm">Your Day Master</div>
                <div className="sj-star">{dm.polarity} —<br />{dm.name}</div>
                <div className="sj-tags">
                  {dm.tags.map((t) => (
                    <span className="sj-tag" key={t}>{t}</span>
                  ))}
                </div>
              </div>
              <div className="sj-cut">
                <p>There’s a way your energy has always moved. It settled early —</p>
                <p className="fade">
                  in the years that shaped you, before you had words for it. What that
                  pattern gives you, and what it quietly costs, is where the reading
                  turns…
                </p>
              </div>
              <Lock title="What the full reading adds" items={[
                "The exact season this steadiness first formed",
                "What this root gave you — and quietly took",
                "The shape your chart keeps repeating in love",
                "The one thing the two systems read differently in you",
              ]} />
            </div>
          </div>

          {/* Cross-validation — night beat */}
          <section className="sj-scene mid">
            <span className="sj-stars" aria-hidden />
            <div className="sj-sinner">
              <div className="sj-pair sj-line">
                <span className="sj-seal a">{dm.stem}</span>
                <span className="sj-eq">+</span>
                {mingStar ? (
                  <span
                    className="sj-seal b"
                    style={{ fontSize: mingStar.length > 3 ? 13 : 22, fontWeight: 700 }}
                  >
                    {mingStar}
                  </span>
                ) : (
                  <span className="sj-seal b" style={{ fontSize: 22 }}>時</span>
                )}
              </div>
              <span className="sj-label sj-eyebrow sj-line d1">Two systems, one moment</span>
              <p className="sj-line d1">
                Four Pillars names your core. Purple Star maps where it lives.
              </p>
              <p className="sj-voice sj-line d2">
                {mingStar
                  ? `Your ${dm.polarity} core, read through “${mingStar}” — the two sharpen each other.`
                  : "Add your birth time and the stars fall into place — the two readings sharpen each other."}
              </p>
            </div>
          </section>

          <section className="sj-scene short">
            <span className="sj-stars" aria-hidden />
            <div className="sj-sinner">
              <p className="sj-voice sj-line">Now, where your strength actually runs.</p>
            </div>
          </section>

          <div className="sj-cardwrap">
            {/* Nature — gauges */}
            <div className="sj-card sj-anim">
              <div className="sj-kick">Purple Star · reading your nature</div>
              <h3>Your nature</h3>
              <Axis name="Energy" pct={55} on="Outward" onV={55} off="Inward" offV={45} />
              <Axis name="Judgment" pct={70} on="Rational" onV={70} off="Intuitive" offV={30} />
              <Axis name="Direction" pct={80} on="Steady" onV={80} off="Changing" offV={20} />
              <Axis name="Drive" pct={65} on="Leading" onV={65} off="Yielding" offV={35} />
              <div className="sj-tags sj-mt">
                <span className="sj-tag">the sturdy one</span>
                <span className="sj-tag">hard to move</span>
                <span className="sj-tag">the beam that holds</span>
                <span className="sj-tag">grows alone</span>
              </div>
              <Lock title="What the full reading adds" items={[
                "What your highest trait is really for — not “too much”",
                "Where your lowest trait poured its strength instead",
                "Why two people with the same star still turn out different",
              ]} />
            </div>
          </div>

          {/* concern echo — night */}
          <section className="sj-scene short">
            <span className="sj-stars" aria-hidden />
            <div className="sj-sinner">
              <p className="sj-voice sj-line">{c.echo}</p>
              <p className="sj-line d1">{c.bridge}</p>
            </div>
          </section>

          <div className="sj-cardwrap">
            {/* flow graph */}
            <div className="sj-card sj-anim">
              <div className="sj-kick">{c.kick}</div>
              <h3>{c.title}</h3>
              <div className="sj-flow">
                <svg viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden>
                  <path
                    d="M0,90 C90,86 120,48 180,58 C250,70 270,100 330,84 C400,64 430,20 500,28 C550,33 580,24 600,20"
                    fill="none"
                    stroke="var(--sage)"
                    strokeWidth="2"
                  />
                  <circle cx="180" cy="58" r="3.5" fill="var(--ink)" />
                  <circle cx="500" cy="28" r="3.5" fill="var(--ink)" />
                </svg>
                <div className="sj-xl">
                  <span>now</span><span>+10 yrs</span><span>+20 yrs</span><span>+30 yrs</span>
                </div>
              </div>
              <Lock title="What the full reading adds" items={c.locks} />
            </div>
          </div>

          <section className="sj-scene short">
            <span className="sj-stars" aria-hidden />
            <div className="sj-sinner">
              <p className="sj-voice sj-line">And this — is only the beginning.</p>
            </div>
          </section>

          <div className="sj-cardwrap">
            {/* destiny match */}
            <div className="sj-card sj-anim sj-match">
              <div className="sj-kick">Destiny · the one who matches you</div>
              <h3>The star that locks with yours</h3>
              <div className="sj-blurbox"><span>緣</span></div>
              <p className="sj-mcap">Their Day Master</p>
              <div><span className="sj-redact">Yang Fire · The Sun</span></div>
              <Lock title="What the full reading adds" items={[
                "Their star and their pillar",
                "Where the two of you pull against each other",
                "Why some years it's this person, other years that",
              ]} />
            </div>
          </div>

          <section className="sj-scene short">
            <span className="sj-stars" aria-hidden />
            <div className="sj-sinner">
              <p className="sj-voice sj-line">Who is that person? Your chart points to a type.</p>
            </div>
          </section>

          <div className="sj-cardwrap">
            {/* partner type */}
            <div className="sj-card sj-anim sj-match">
              <div className="sj-kick">Ideal type · the one who completes you</div>
              <h3 className="sj-htype">
                Someone warm who <span className="sj-redact">□□□</span>
                <br />
                leads without <span className="sj-redact">□□</span>
              </h3>
              <div className="sj-hmeta">
                <span className="mi"><b>Nature</b>Yang Fire · bright</span>
                <span className="mi"><b>Line of work</b><span className="sj-redact">□□□ · □□□</span></span>
                <span className="mi"><b>When you meet</b><span className="sj-redact">early □0s</span></span>
              </div>
              <Lock title="What the full reading adds" items={[
                "The partner type that puts you most at ease, and why",
                "The type you're drawn to but rarely last with",
                "How to recognize them — and the moment you'd miss it",
                "The one thing both systems name about your match",
              ]} />
            </div>
          </div>

          {/* WHY + PRICING — cream */}
          <section className="sj-cardwrap sj-anim">
            <p className="sj-label sj-sec-eyebrow">Why Korean Saju</p>
            <h2 className="sj-h2">Not a horoscope for everyone. A chart for you.</h2>
            <div className="sj-compare">
              <div className="sj-col dim">
                <h4>A typical horoscope app</h4>
                <ul>
                  <li>Lines that could describe anyone</li>
                  <li>One method, one guess</li>
                  <li>Results with nothing behind them</li>
                </ul>
              </div>
              <div className="sj-col win">
                <h4>Korean Saju</h4>
                <ul>
                  <li>Two systems — Four Pillars &amp; Purple Star — computed</li>
                  <li>The high-confidence signal where they agree</li>
                  <li>A reading built around what’s on your mind</li>
                </ul>
              </div>
            </div>

            <div className="sj-menu">
              <div className="sj-menu-h">
                <span className="k">The full reading · book-length · 1:1 questions</span>
                <h3 style={{ marginTop: 10 }}>Your complete Saju</h3>
              </div>
              <ol className="sj-toc">
                {[
                  ["01", "Reading your chart", "Four Pillars and Purple Star, side by side"],
                  ["02", "People & relationships", "siblings, travel, friends, parents"],
                  ["03", "Work & calling", "career and creativity houses"],
                  ["04", "Money & wealth", "wealth & property houses + luck pillars"],
                  ["05", "Love", "partner house + compatibility"],
                  ["06", "Your ten-year cycles", "both systems, cross-checked"],
                  ["07", "Times to move · times to wait", ""],
                  ["08", "Answers to what's on your mind", "the concern you chose"],
                ].map(([n, t, s]) => (
                  <li key={n}>
                    <span className="n">{n}</span>
                    <div>
                      {t}
                      {s ? <small>{s}</small> : null}
                    </div>
                  </li>
                ))}
              </ol>
              <div className="sj-price">
                <div className="sj-now">$12.90</div>
                <div className="sj-social">one-time · yours to keep</div>
                <button
                  className="sj-btn sj-open"
                  type="button"
                  onClick={() => setModalOpen(true)}
                >
                  Buy my full reading
                </button>
              </div>
            </div>
          </section>

          <section className="sj-cardwrap" style={{ paddingTop: 0 }}>
            <p className="sj-disc">
              Korean Saju is a reading for self-reflection and entertainment, grounded in
              traditional Korean fortune systems. It is not medical, legal, or financial
              advice. Every chart in your report is computed from the birth details you
              enter. The figures above are illustrative interpretations based on public
              birth years.
            </p>
          </section>
        </>
      )}

      <div className="sj-footspace" />

      {/* CASTING (엔진 계산 중) */}
      {casting && (
        <div className="sj-casting" aria-live="polite">
          <span className="sj-stars" aria-hidden />
          <p>Reading the sky…</p>
        </div>
      )}

      {/* STICKY */}
      <div className="sj-sticky">
        {phase === "reading" ? (
          <>
            <p className="sj-cap">The full reading · book-length · yours to keep</p>
            <button className="sj-cta" type="button" onClick={() => setModalOpen(true)}>
              Buy the full reading · $12.90
            </button>
          </>
        ) : (
          <>
            <p className="sj-cap">Free · chart preview</p>
            <button className="sj-cta" type="button" onClick={scrollToBegin}>
              See my chart
            </button>
          </>
        )}
      </div>

      {/* EMAIL MODAL (no payment yet — inner-child style) */}
      {modalOpen && (
        <div
          className="sj-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="sj-sheet">
            <button className="sj-x" type="button" aria-label="Close" onClick={closeModal}>
              ×
            </button>
            {sentTo ? (
              <div className="sj-success">
                <span className="ok">✓</span>
                <h3 style={{ marginTop: 12 }}>On its way.</h3>
                <p className="sj-mcap" style={{ marginTop: 10 }}>
                  We’re writing your full Korean Saju reading now. It lands in <b>{sentTo}</b> in a
                  few minutes.
                </p>
                <button className="sj-msend" type="button" onClick={closeModal}>
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="sj-won">
                  <div className="sj-won-emoji">🎉</div>
                  <div className="sj-won-h">Good news — this one’s on us.</div>
                  <div className="sj-won-price">
                    <span className="was">$12.90</span>
                    <span className="free">FREE</span>
                  </div>
                  <p className="sj-won-sub">
                    We’re in beta, so the full reading we sell for $12.90 is yours at no charge.
                    No card, nothing to pay — we’ll just email it to you.
                  </p>
                </div>
                <label className="sj-mlabel" htmlFor="sj-email">
                  Where should we send your reading?
                </label>
                <input
                  id="sj-email"
                  className="sj-input"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  style={emailError ? { borderColor: "#C46A4E" } : undefined}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(false);
                  }}
                />
                <button className="sj-msend" type="button" onClick={submitEmail} disabled={sending}>
                  {sending ? "Sending…" : "Send my free reading"}
                </button>
                <p className="sj-fine">
                  Your complete reading lands in your inbox in a few minutes.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Lock({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div className="sj-lock">
      <div className="sj-lh">{title}</div>
      <ul className="sj-checks">
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  );
}

function Axis({
  name, pct, on, onV, off, offV,
}: {
  name: string; pct: number; on: string; onV: number; off: string; offV: number;
}) {
  return (
    <div className="sj-axis">
      <div className="sj-an">{name}</div>
      <div className="sj-track">
        <span className="sj-fillbar" style={{ width: `${pct}%` }} />
      </div>
      <div className="sj-ends">
        <span className="on">{on}<span className="v">{onV}</span></span>
        <span className="off">{off}<span className="v">{offV}</span></span>
      </div>
    </div>
  );
}

/* ─────────────── CSS — 밤하늘 서사 ↔ 크림 카드 (inner-child 얼라인) ─────────────── */

const CSS = `
.sj-root{
  --paper:#FBF7EE;--paper-2:#F3ECDD;--ink:#2B2622;--pencil:#8A8073;
  --rule:#E7DFCE;--edge:#DFD5C1;--sage:#6C6AA8;--sage-soft:#E6E4F1;
  --shadow:20 16 8;--lock-veil:251 247 238;
  --night:#1C1813;--glow:rgba(92,88,142,.30);--cream:#F1E9DA;--voice:#B5B1E4;--nmute:#8E93AD;--neye:#9A9DB8;
  background:var(--paper);color:var(--ink);
  font-family:'Inter','Pretendard',-apple-system,BlinkMacSystemFont,sans-serif;
  line-height:1.7;-webkit-font-smoothing:antialiased;
  max-width:440px;margin:0 auto;position:relative;overflow-x:hidden;min-height:100vh;
}
@media (prefers-color-scheme:dark){.sj-root{
  --paper:#211D18;--paper-2:#29241D;--ink:#EDE4D3;--pencil:#9A9082;
  --rule:#342D24;--edge:#3A3228;--sage:#A6A2E0;--sage-soft:#322F47;--lock-veil:33 29 24;
}}
.sj-root *{box-sizing:border-box;}
.sj-root h1,.sj-root h2,.sj-root h3,.sj-root p,.sj-root ul,.sj-root ol{margin:0;}
.sj-label{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.2em;text-transform:uppercase;font-weight:700;}

/* NIGHT SCENE */
.sj-scene{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:64px 30px;color:var(--cream);overflow:hidden;background:radial-gradient(62% 42% at 50% 20%,var(--glow),transparent 72%),var(--night);box-shadow:inset 0 -90px 110px -30px rgba(0,0,0,.72),inset 0 70px 90px -40px rgba(0,0,0,.5);}
.sj-scene.tall{min-height:92vh;}
.sj-scene.mid{min-height:58vh;}
.sj-scene.short{padding:52px 30px;}
.sj-stars{position:absolute;inset:-16% 0;z-index:0;pointer-events:none;}
.sj-stars::before,.sj-stars::after{content:"";position:absolute;inset:0;}
.sj-stars::before{background:radial-gradient(1.5px 1.5px at 12% 18%,#fff,transparent),radial-gradient(1px 1px at 28% 42%,rgba(255,255,255,.8),transparent),radial-gradient(1.5px 1.5px at 45% 12%,rgba(255,255,255,.9),transparent),radial-gradient(1px 1px at 62% 30%,rgba(255,255,255,.65),transparent),radial-gradient(1.5px 1.5px at 78% 22%,#fff,transparent),radial-gradient(1px 1px at 35% 90%,rgba(255,255,255,.6),transparent);animation:sjTw1 4.5s ease-in-out infinite;}
.sj-stars::after{background:radial-gradient(1px 1px at 88% 48%,rgba(255,255,255,.75),transparent),radial-gradient(1px 1px at 18% 68%,rgba(255,255,255,.6),transparent),radial-gradient(1.5px 1.5px at 52% 78%,rgba(255,255,255,.8),transparent),radial-gradient(1px 1px at 72% 88%,rgba(255,255,255,.55),transparent),radial-gradient(1px 1px at 8% 40%,rgba(255,255,255,.5),transparent),radial-gradient(1.5px 1.5px at 92% 14%,#fff,transparent);animation:sjTw2 6s ease-in-out infinite;}
@keyframes sjTw1{0%,100%{opacity:.95}50%{opacity:.5}}
@keyframes sjTw2{0%,100%{opacity:.5}50%{opacity:.95}}
.sj-sinner{position:relative;z-index:1;max-width:340px;width:100%;display:flex;flex-direction:column;align-items:center;gap:20px;}
.sj-scene p{font-size:21px;line-height:1.8;font-weight:600;color:var(--cream);text-wrap:balance;}
.sj-scene p b{color:#fff;font-weight:800;}
.sj-eyebrow{color:var(--neye);}
.sj-voice{font-style:italic;color:var(--voice)!important;font-size:22px;font-weight:500;line-height:1.6;}
.sj-h1{font-size:40px;line-height:1.08;font-weight:800;letter-spacing:-.02em;color:#fff;text-wrap:balance;}
.sj-sub{font-size:16px;line-height:1.6;color:#D8D2E4;font-weight:500;}

/* hero entry on night */
.sj-entry{display:flex;flex-direction:column;gap:12px;align-items:center;width:100%;}
.sj-daterow{display:flex;gap:10px;width:100%;max-width:330px;}
.sj-date{flex:1;min-width:0;background:rgba(255,255,255,.08);border:1px solid rgba(181,177,228,.42);border-radius:10px;color:#fff;font-family:inherit;font-size:15px;padding:13px 14px;}
.sj-date:focus{outline:2px solid var(--voice);outline-offset:1px;}
.sj-note{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;color:var(--nmute);letter-spacing:.03em;}

/* buttons */
.sj-btn{cursor:pointer;border:none;font-family:inherit;font-weight:800;font-size:15px;border-radius:12px;padding:13px 22px;background:var(--sage);color:#fff;transition:filter .15s;flex:0 0 auto;}
.sj-btn:hover{filter:brightness(1.07);}
.sj-open{display:block;width:100%;margin-top:18px;padding:15px;}

/* cream sections */
.sj-cardwrap{padding:44px 26px;position:relative;}
.sj-sec-eyebrow{color:var(--pencil);text-align:center;margin-bottom:10px;}
.sj-h2{font-size:24px;line-height:1.32;letter-spacing:-.01em;font-weight:800;text-align:center;text-wrap:balance;}
.sj-sub-c{font-size:15.5px;color:var(--pencil);text-align:center;margin-top:12px;line-height:1.6;}
.sj-card{background:var(--paper-2);border:1.5px solid var(--edge);border-radius:18px;padding:26px 22px;box-shadow:0 12px 30px -20px rgb(var(--shadow)/.5);}
.sj-kick{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--sage);font-weight:700;}
.sj-card h3{font-size:20px;font-weight:800;margin-top:8px;letter-spacing:-.01em;line-height:1.25;}
.sj-free{display:inline-flex;align-items:center;gap:6px;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;font-weight:800;color:var(--sage);border:1.5px solid var(--sage);border-radius:999px;padding:3px 10px;margin-top:12px;}
.sj-mt{margin-top:22px;}

/* celeb */
.sj-celebs{margin-top:30px;display:flex;flex-direction:column;}
.sj-celeb{padding:22px 0;border-top:1px solid var(--edge);}
.sj-celeb:last-child{border-bottom:1px solid var(--edge);}
.sj-who{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;}
.sj-cnm{font-size:20px;font-weight:800;letter-spacing:-.01em;}
.sj-cyr{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;color:var(--pencil);}
.sj-crole{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--sage);margin-top:3px;}
.sj-cread{margin-top:9px;color:var(--pencil);font-size:15px;line-height:1.55;}
.sj-illus{margin-top:20px;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;color:var(--pencil);text-align:center;line-height:1.6;}

/* form */
.sj-form{margin-top:18px;}
.sj-flabel{display:block;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--sage);margin-bottom:9px;}
.sj-row3{display:grid;gap:10px;grid-template-columns:1fr;}
@media(min-width:400px){.sj-row3{grid-template-columns:1.1fr 1fr .9fr;}}
.sj-sel{width:100%;background:var(--paper);border:1.5px solid var(--edge);border-radius:10px;color:var(--ink);font-family:inherit;font-size:15px;padding:12px 12px;}
.sj-sel:focus{outline:2px solid var(--sage);outline-offset:1px;border-color:var(--sage);}
.sj-chips{display:flex;flex-wrap:wrap;gap:8px;}
.sj-chip{cursor:pointer;border:1.5px solid var(--edge);background:transparent;color:var(--pencil);border-radius:999px;padding:9px 14px;font-size:14px;font-family:inherit;transition:.14s;}
.sj-chip[aria-pressed="true"]{border-color:var(--sage);color:var(--sage);background:var(--sage-soft);font-weight:700;}
.sj-hint{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11.5px;color:var(--pencil);margin-top:10px;text-align:center;}

/* pillars */
.sj-pillars{margin-top:18px;display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--edge);border-radius:10px;overflow:hidden;}
.sj-pil{border-left:1px solid var(--edge);padding:14px 6px;text-align:center;}
.sj-pil:first-child{border-left:0;}
.sj-pil .pl{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:9.5px;letter-spacing:.06em;color:var(--pencil);text-transform:uppercase;}
.sj-pil .ps{font-size:28px;font-weight:700;margin-top:8px;line-height:1;}
.sj-pil .pb{font-size:28px;margin-top:3px;line-height:1;color:var(--pencil);}
.sj-pil.self{background:var(--sage-soft);}
.sj-pil.self .ps{color:var(--sage);}
.sj-elems{margin-top:14px;display:flex;gap:14px;justify-content:center;flex-wrap:wrap;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12.5px;color:var(--pencil);}
.sj-elems b{color:var(--sage);}
.sj-palace{margin-top:14px;display:grid;grid-template-columns:repeat(4,1fr);gap:7px;}
.sj-gung{border:1px solid var(--edge);border-radius:9px;padding:9px 5px;text-align:center;}
.sj-gung .gn{font-size:13px;font-weight:700;}
.sj-gung .gs{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:9px;color:var(--pencil);margin-top:3px;}
.sj-gung.ming{border-color:var(--sage);background:var(--sage-soft);}
.sj-gung.ming .gn{color:var(--sage);}

/* reveal */
.sj-reveal{text-align:center;}
.sj-dm{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--sage);}
.sj-star{font-size:32px;font-weight:800;line-height:1.15;margin-top:8px;letter-spacing:-.01em;}
.sj-tags{margin-top:14px;display:flex;flex-wrap:wrap;gap:7px;justify-content:center;}
.sj-tag{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11.5px;color:var(--pencil);border:1px solid var(--edge);border-radius:999px;padding:4px 11px;}
.sj-cut{margin-top:20px;font-size:15.5px;color:var(--ink);line-height:1.7;text-align:left;}
.sj-cut p+p{margin-top:8px;}
.sj-cut .fade{-webkit-mask-image:linear-gradient(180deg,#000 0 22%,transparent 84%);mask-image:linear-gradient(180deg,#000 0 22%,transparent 84%);}

/* lockbox */
.sj-lock{border:1.6px dashed var(--sage);border-radius:16px;padding:22px 18px 18px;margin-top:20px;background:rgb(var(--lock-veil)/.5);}
.sj-lh{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--sage);font-weight:700;text-align:center;}
.sj-checks{list-style:none;margin:16px 0 0;padding:0;display:grid;gap:12px;text-align:left;}
.sj-checks li{position:relative;padding-left:28px;font-size:14.5px;line-height:1.5;}
.sj-checks li::before{content:"";position:absolute;left:0;top:1px;width:18px;height:18px;border-radius:50%;background:var(--sage);-webkit-mask:${CHECK_MASK};mask:${CHECK_MASK};}
.sj-checks b{font-weight:700;}

/* gauges */
.sj-axis{margin-top:18px;}
.sj-an{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--pencil);margin-bottom:7px;}
.sj-track{height:10px;background:var(--rule);border-radius:999px;overflow:hidden;}
.sj-fillbar{display:block;height:100%;background:var(--sage);border-radius:999px;}
.sj-ends{display:flex;justify-content:space-between;margin-top:7px;font-size:13.5px;}
.sj-ends .on{font-weight:700;}
.sj-ends .off{color:var(--pencil);}
.sj-ends .v{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;margin-left:4px;}

/* cross-validation seals */
.sj-pair{display:flex;align-items:center;justify-content:center;gap:12px;}
.sj-seal{width:54px;height:54px;border-radius:50%;border:1px solid rgba(181,177,228,.5);display:grid;place-items:center;font-size:24px;background:rgba(255,255,255,.05);}
.sj-seal.a{color:var(--voice);}
.sj-seal.b{color:var(--cream);}
.sj-eq{font-size:20px;color:var(--voice);}

/* flow graph */
.sj-flow{margin-top:16px;}
.sj-flow svg{width:100%;height:120px;display:block;overflow:visible;}
.sj-xl{display:flex;justify-content:space-between;margin-top:9px;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10.5px;color:var(--pencil);}

/* match / husband */
.sj-match{text-align:center;}
.sj-blurbox{width:140px;height:140px;margin:6px auto 0;border-radius:16px;border:1px solid var(--edge);background:var(--sage-soft);display:grid;place-items:center;filter:blur(7px);}
.sj-blurbox span{font-size:48px;color:var(--sage);}
.sj-mcap{color:var(--pencil);font-size:14px;margin-top:14px;}
.sj-redact{filter:blur(6px);color:var(--sage);font-weight:700;}
.sj-hmeta{display:flex;justify-content:center;gap:20px;flex-wrap:wrap;margin-top:16px;}
.sj-hmeta .mi{font-size:14px;}
.sj-hmeta .mi b{display:block;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--pencil);margin-bottom:4px;font-weight:600;}
.sj-htype{font-size:26px;font-weight:800;line-height:1.2;margin-top:6px;}

/* why compare */
.sj-compare{display:grid;gap:10px;margin-top:20px;}
.sj-col{border:1.5px solid var(--edge);border-radius:14px;padding:18px;background:var(--paper-2);}
.sj-col.win{border-color:var(--sage);background:var(--sage-soft);}
.sj-col h4{margin:0 0 12px;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--pencil);}
.sj-col.win h4{color:var(--sage);}
.sj-col ul{list-style:none;margin:0;padding:0;display:grid;gap:9px;}
.sj-col li{font-size:14px;line-height:1.45;}
.sj-col.dim li{color:var(--pencil);}

/* pricing */
.sj-menu{border:1.5px solid var(--sage);border-radius:18px;overflow:hidden;margin-top:22px;}
.sj-menu-h{padding:24px 22px;border-bottom:1.5px solid var(--edge);background:var(--paper-2);}
.sj-menu-h .k{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--sage);}
.sj-toc{list-style:none;margin:0;padding:22px;display:grid;gap:12px;}
.sj-toc li{display:grid;grid-template-columns:24px 1fr;gap:10px;font-size:15px;}
.sj-toc .n{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;color:var(--sage);}
.sj-toc small{display:block;color:var(--pencil);font-size:12.5px;margin-top:2px;}
.sj-price{padding:22px;border-top:1.5px solid var(--edge);text-align:center;background:var(--paper-2);}
.sj-was{color:var(--pencil);text-decoration:line-through;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:14px;}
.sj-now{font-size:34px;font-weight:800;margin-top:3px;font-variant-numeric:tabular-nums;}
.sj-social{margin-top:10px;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;color:var(--pencil);}
.sj-social b{color:var(--sage);}

/* disclaimer + sticky */
.sj-disc{font-size:11.5px;color:var(--pencil);line-height:1.7;padding:26px 4px 12px;text-align:center;}
.sj-footspace{height:104px;}
.sj-sticky{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:440px;z-index:60;background:linear-gradient(180deg,transparent,var(--paper) 34%);padding:30px 22px calc(16px + env(safe-area-inset-bottom,0px));}
.sj-cap{text-align:center;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11.5px;color:var(--pencil);margin-bottom:9px;}
.sj-cap b{color:var(--ink);font-weight:800;}
.sj-cta{display:block;width:100%;text-align:center;cursor:pointer;background:var(--ink);color:var(--paper);border:none;border-radius:14px;font-size:16px;font-weight:800;padding:16px;font-family:inherit;}

/* casting overlay */
.sj-casting{position:fixed;inset:0;z-index:90;background:radial-gradient(62% 42% at 50% 30%,var(--glow),transparent 72%),var(--night);display:grid;place-items:center;overflow:hidden;}
.sj-casting p{position:relative;z-index:1;color:var(--voice);font-style:italic;font-size:20px;font-weight:500;}

/* modal */
.sj-modal{position:fixed;inset:0;z-index:100;display:grid;place-items:center;padding:20px;background:rgba(20,16,12,.66);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);}
.sj-sheet{width:100%;max-width:380px;background:var(--paper-2);border:1.5px solid var(--sage);border-radius:16px;padding:28px 24px;position:relative;}
.sj-x{position:absolute;top:8px;right:12px;background:none;border:0;font-size:24px;color:var(--pencil);cursor:pointer;line-height:1;padding:4px;}
/* 축하 배너 — 결제처럼 보이는 CTA → 즉시 "베타라 무료" 공개(참인 이유를 밝힌다) */
.sj-won{text-align:center;border:1.6px dashed var(--sage);border-radius:16px;background:var(--sage-soft);
  padding:22px 16px 18px;margin-bottom:4px;}
.sj-won-emoji{font-size:30px;line-height:1;}
.sj-won-h{font-size:19px;font-weight:800;margin-top:10px;letter-spacing:-.01em;line-height:1.3;}
.sj-won-price{display:flex;align-items:baseline;justify-content:center;gap:11px;margin-top:12px;}
.sj-won-price .was{font-family:'JetBrains Mono',ui-monospace,monospace;color:var(--pencil);
  text-decoration:line-through;font-size:17px;}
.sj-won-price .free{font-size:27px;font-weight:800;color:var(--sage);letter-spacing:.03em;}
.sj-won-sub{font-size:13.5px;color:var(--pencil);margin-top:11px;line-height:1.6;}

.sj-pricebar{display:flex;align-items:baseline;gap:10px;margin:18px 0 6px;}
.sj-pricebar .was{font-family:'JetBrains Mono',ui-monospace,monospace;color:var(--pencil);text-decoration:line-through;font-size:14px;}
.sj-pricebar .now{font-size:30px;font-weight:800;}
.sj-mlabel{display:block;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--sage);margin:14px 0 8px;}
.sj-input{width:100%;background:var(--paper);border:1.5px solid var(--edge);border-radius:10px;color:var(--ink);font-family:inherit;font-size:15px;padding:13px 14px;}
.sj-input:focus{outline:2px solid var(--sage);outline-offset:1px;border-color:var(--sage);}
.sj-msend{width:100%;margin-top:14px;background:var(--ink);color:var(--paper);border:none;border-radius:12px;font-weight:800;font-size:15px;padding:15px;cursor:pointer;font-family:inherit;}
.sj-fine{margin-top:12px;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;color:var(--pencil);text-align:center;}
.sj-success{text-align:center;}
.sj-success .ok{width:50px;height:50px;margin:0 auto;border-radius:50%;border:1.5px solid var(--sage);display:grid;place-items:center;color:var(--sage);font-size:22px;}

/* reveal anim */
.sj-anim{opacity:0;transform:translateY(20px);transition:opacity .7s ease,transform .7s cubic-bezier(.2,.7,.2,1);}
.sj-anim.in{opacity:1;transform:none;}
.sj-line{opacity:0;transform:translateY(14px);filter:blur(6px);transition:opacity .9s ease,transform 1s cubic-bezier(.2,.7,.2,1),filter 1s ease;}
.sj-scene.in .sj-line{opacity:1;transform:none;filter:none;}
.sj-scene.in .d1{transition-delay:.25s;}
.sj-scene.in .d2{transition-delay:.6s;}
@media (prefers-reduced-motion:reduce){
  .sj-anim,.sj-line{opacity:1;transform:none;filter:none;transition:none;}
  .sj-stars::before,.sj-stars::after{animation:none;}
  .sj-fillbar{transition:none;}
}
`;
