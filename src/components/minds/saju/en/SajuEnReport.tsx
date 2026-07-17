import { SAJU_SECTIONS, type SajuBlob } from "@/lib/saju/report-types";
import type { Element } from "@/lib/saju/types";

/**
 * /saju/en/r/[id] — 발송된 유료 사주 리포트 뷰 (서버 렌더, 로그인 없음).
 * 디자인은 SajuEnFlow 와 동일한 "밤하늘 서사 ↔ 크림 카드" 시스템(inner-child 얼라인).
 */

const ELEMENT_ORDER: readonly Element[] = ["Wood", "Fire", "Earth", "Metal", "Water"];

export function SajuEnReport({ blob }: { blob: SajuBlob | null }) {
  if (!blob) {
    return (
      <Shell>
        <section className="sr-scene">
          <span className="sr-stars" aria-hidden />
          <div className="sr-inner">
            <p className="sr-voice">We couldn’t find this reading.</p>
            <p className="sr-note">The link may be mistyped, or the reading was removed.</p>
          </div>
        </section>
      </Shell>
    );
  }

  const { chart, report } = blob;
  const { four, ziwei, persona } = chart;

  if (!report) {
    return (
      <Shell>
        <section className="sr-scene">
          <span className="sr-stars" aria-hidden />
          <div className="sr-inner">
            <p className="sr-voice">Your reading is still being written.</p>
            <p className="sr-note">
              We’ll email you the moment it’s ready — usually within a few minutes.
            </p>
          </div>
        </section>
      </Shell>
    );
  }

  return (
    <Shell>
      {/* HERO — night sky, day master reveal */}
      <section className="sr-scene tall">
        <span className="sr-stars" aria-hidden />
        <div className="sr-inner">
          <span className="sr-eyebrow">Korean Saju · Four Pillars × Purple Star</span>
          <p className="sr-dm">Your Day Master</p>
          <h1 className="sr-star">
            {persona.polarity} —<br />
            {persona.name}
          </h1>
          <div className="sr-tags">
            {persona.tags.map((t) => (
              <span className="sr-tag" key={t}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      <div className="sr-wrap">
        {/* chart card */}
        <div className="sr-card">
          <div className="sr-kick">Your chart</div>
          <div className="sr-pillars">
            {four.pillars.map((p) => (
              <div className={`sr-pil${p.label === "Day" ? " self" : ""}`} key={p.label}>
                <div className="pl">{p.label === "Day" ? "Day · You" : p.label}</div>
                <div className="ps">{p.stem}</div>
                <div className="pb">{p.branch}</div>
              </div>
            ))}
          </div>
          <div className="sr-elems">
            {ELEMENT_ORDER.map((el) => (
              <span key={el}>{el} <b>{four.elements[el]}</b></span>
            ))}
          </div>
          {ziwei ? (
            <div className="sr-palace">
              {ziwei.palaces.map((p) => (
                <div className={`sr-gung${p.name === "Self" ? " ming" : ""}`} key={p.name}>
                  <div className="gn">{p.name}</div>
                  <div className="gs">{p.stars.length ? p.stars.join(" · ") : "—"}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="sr-note" style={{ marginTop: 14, textAlign: "center" }}>
              Read without a birth time — the year, month and day pillars are exact.
            </p>
          )}
        </div>

        {/* portrait */}
        <div className="sr-card">
          <div className="sr-kick">Who this chart says you are</div>
          <p className="sr-prose">{report.portrait}</p>
        </div>
      </div>

      {/* sections */}
      {SAJU_SECTIONS.map((s) => (
        <div className="sr-wrap" key={s.key}>
          <div className="sr-card">
            <div className="sr-secno">{s.no}</div>
            <h2 className="sr-h2">{s.title}</h2>
            {s.sub ? <p className="sr-sub">{s.sub}</p> : null}
            <p className="sr-prose">{report[s.key]}</p>
          </div>
        </div>
      ))}

      {/* closing — night sky letter */}
      <section className="sr-scene">
        <span className="sr-stars" aria-hidden />
        <div className="sr-inner">
          <span className="sr-eyebrow">One last thing</span>
          <p className="sr-letter">{report.closing}</p>
        </div>
      </section>

      <div className="sr-wrap">
        <p className="sr-disc">
          Korean Saju is a reading for self-reflection and entertainment, grounded in traditional
          Korean fortune systems. It is not medical, legal, or financial advice. Every chart here was
          computed from the birth details you entered.
        </p>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="sr-root">
      <style>{CSS}</style>
      {children}
    </div>
  );
}

const CSS = `
.sr-root{
  --paper:#FBF7EE;--paper-2:#F3ECDD;--ink:#2B2622;--pencil:#8A8073;
  --edge:#DFD5C1;--sage:#6C6AA8;--sage-soft:#E6E4F1;--shadow:20 16 8;
  --night:#1C1813;--glow:rgba(92,88,142,.30);--cream:#F1E9DA;--voice:#B5B1E4;--neye:#9A9DB8;--nmute:#8E93AD;
  background:var(--paper);color:var(--ink);
  font-family:'Inter','Pretendard',-apple-system,BlinkMacSystemFont,sans-serif;
  line-height:1.7;-webkit-font-smoothing:antialiased;
  max-width:440px;margin:0 auto;position:relative;overflow-x:hidden;min-height:100vh;
}
@media (prefers-color-scheme:dark){.sr-root{
  --paper:#211D18;--paper-2:#29241D;--ink:#EDE4D3;--pencil:#9A9082;
  --edge:#3A3228;--sage:#A6A2E0;--sage-soft:#322F47;
}}
.sr-root *{box-sizing:border-box;}
.sr-root h1,.sr-root h2,.sr-root p{margin:0;}

.sr-scene{position:relative;display:flex;align-items:center;justify-content:center;text-align:center;
  padding:64px 30px;color:var(--cream);overflow:hidden;
  background:radial-gradient(62% 42% at 50% 20%,var(--glow),transparent 72%),var(--night);
  box-shadow:inset 0 -90px 110px -30px rgba(0,0,0,.72),inset 0 70px 90px -40px rgba(0,0,0,.5);}
.sr-scene.tall{min-height:78vh;}
.sr-stars{position:absolute;inset:-16% 0;z-index:0;pointer-events:none;}
.sr-stars::before,.sr-stars::after{content:"";position:absolute;inset:0;}
.sr-stars::before{background:radial-gradient(1.5px 1.5px at 12% 18%,#fff,transparent),radial-gradient(1px 1px at 28% 42%,rgba(255,255,255,.8),transparent),radial-gradient(1.5px 1.5px at 45% 12%,rgba(255,255,255,.9),transparent),radial-gradient(1px 1px at 62% 30%,rgba(255,255,255,.65),transparent),radial-gradient(1.5px 1.5px at 78% 22%,#fff,transparent);animation:srTw1 4.5s ease-in-out infinite;}
.sr-stars::after{background:radial-gradient(1px 1px at 88% 48%,rgba(255,255,255,.75),transparent),radial-gradient(1px 1px at 18% 68%,rgba(255,255,255,.6),transparent),radial-gradient(1.5px 1.5px at 52% 78%,rgba(255,255,255,.8),transparent),radial-gradient(1px 1px at 8% 40%,rgba(255,255,255,.5),transparent);animation:srTw2 6s ease-in-out infinite;}
@keyframes srTw1{0%,100%{opacity:.95}50%{opacity:.5}}
@keyframes srTw2{0%,100%{opacity:.5}50%{opacity:.95}}
.sr-inner{position:relative;z-index:1;max-width:340px;display:flex;flex-direction:column;align-items:center;gap:16px;}
.sr-eyebrow{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10.5px;letter-spacing:.2em;
  text-transform:uppercase;color:var(--neye);font-weight:700;}
.sr-dm{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.18em;
  text-transform:uppercase;color:var(--voice);}
.sr-star{font-size:34px;font-weight:800;line-height:1.15;color:#fff;letter-spacing:-.02em;}
.sr-tags{display:flex;flex-wrap:wrap;gap:7px;justify-content:center;}
.sr-tag{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;color:var(--cream);
  border:1px solid rgba(241,233,218,.28);border-radius:999px;padding:4px 11px;}
.sr-voice{font-style:italic;color:var(--voice);font-size:21px;font-weight:500;line-height:1.6;}
.sr-letter{font-size:18px;line-height:1.9;color:var(--cream);font-weight:500;white-space:pre-line;}
.sr-note{font-size:13px;color:var(--nmute);line-height:1.6;}

.sr-wrap{padding:30px 26px 0;}
.sr-wrap:last-of-type{padding-bottom:60px;}
.sr-card{background:var(--paper-2);border:1.5px solid var(--edge);border-radius:18px;padding:26px 22px;
  box-shadow:0 12px 30px -20px rgb(var(--shadow)/.5);}
.sr-card + .sr-card{margin-top:14px;}
.sr-kick{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10.5px;letter-spacing:.16em;
  text-transform:uppercase;color:var(--sage);font-weight:700;margin-bottom:12px;}
.sr-secno{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;color:var(--sage);font-weight:700;}
.sr-h2{font-size:22px;font-weight:800;letter-spacing:-.01em;margin-top:6px;line-height:1.25;}
.sr-sub{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;color:var(--pencil);margin-top:5px;}
.sr-prose{font-size:16px;line-height:1.95;color:var(--ink);margin-top:14px;white-space:pre-line;}

.sr-pillars{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--edge);border-radius:10px;overflow:hidden;}
.sr-pil{border-left:1px solid var(--edge);padding:14px 6px;text-align:center;}
.sr-pil:first-child{border-left:0;}
.sr-pil .pl{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:9.5px;letter-spacing:.06em;color:var(--pencil);text-transform:uppercase;}
.sr-pil .ps{font-size:28px;font-weight:700;margin-top:8px;line-height:1;}
.sr-pil .pb{font-size:28px;margin-top:3px;line-height:1;color:var(--pencil);}
.sr-pil.self{background:var(--sage-soft);}
.sr-pil.self .ps{color:var(--sage);}
.sr-elems{margin-top:14px;display:flex;gap:14px;justify-content:center;flex-wrap:wrap;
  font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12.5px;color:var(--pencil);}
.sr-elems b{color:var(--sage);}
.sr-palace{margin-top:14px;display:grid;grid-template-columns:repeat(4,1fr);gap:7px;}
.sr-gung{border:1px solid var(--edge);border-radius:9px;padding:9px 5px;text-align:center;}
.sr-gung .gn{font-size:13px;font-weight:700;}
.sr-gung .gs{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:9px;color:var(--pencil);margin-top:3px;}
.sr-gung.ming{border-color:var(--sage);background:var(--sage-soft);}
.sr-gung.ming .gn{color:var(--sage);}

.sr-disc{font-size:11.5px;color:var(--pencil);line-height:1.7;text-align:center;padding:26px 4px 40px;}
@media (prefers-reduced-motion:reduce){.sr-stars::before,.sr-stars::after{animation:none;}}
`;
