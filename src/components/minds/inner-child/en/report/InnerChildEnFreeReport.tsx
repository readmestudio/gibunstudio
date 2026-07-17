"use client";

/**
 * Inner Child result scroll — ENGLISH (cinematic narrative + locked cards).
 *
 * 한국어 판매 페이지(InnerChildSalesPage)의 영어판. 구조·CSS·시네마틱 서사를 1:1로 이식하고,
 * 카피만 미국 시장 therapy-speak 로 다시 썼다(feedback_us_market_copy — 한국어 정중한 결을
 * 직역하면 추상적이라 안 먹힘, 구체 장면 + therapy-speak 로).
 *
 * 한국어와 다른 점(퍼널 차이):
 *  - 결제 없음 → RequestReportModal(이메일 수집). 가격은 $12.90 표기(베타는 무료 발송).
 *  - trackMindsFunnel(운영자 슬랙) 대신 trackEnFunnel. Meta 픽셀은 InitiateCheckout(USD).
 *  - 카카오 로그인 복귀(?checkout=1) 자동 재개 분기 없음(영어는 로그인 게이트가 없다).
 *
 * 무료로 공개(정적 데이터 — LLM 불필요):
 *   - 마음의 지형: score.areas · 유형 이름/얼굴 · auto_thoughts 3개 · 지킴이 정체 · 두 번째 아이 블러
 *   - portrait(유일한 LLM 생성 / 폴백 staticPortrait)
 * 잠금 뒤(유료 소구): 원인·해석·성장법. 편익으로 번역해 카피(feedback_benefit_translation_copy).
 *   ⚠️ 유료 실값(guardian cost 해석 등)은 DOM 텍스트로 넣지 않는다(빈칸=더미).
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { DISCLAIMER } from "@/lib/minds/inner-child/en/questions";
import { RequestReportModal } from "@/components/minds/inner-child/en/RequestReportModal";
import { innerChildIllustration } from "@/lib/minds/inner-child/type-cards";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { trackEnFunnel } from "@/lib/minds/inner-child/en/track";
import type { FreeReportGenerated, TypeCard } from "@/lib/minds/inner-child/report-types";
import type { ScoreResult, AreaId, AreaScore, GuardianType } from "@/lib/minds/inner-child/types";

const PRICE_LABEL = "$12.90";

const AREA_LABEL: Record<AreaId, string> = {
  disconnection: "Disconnection",
  impaired_autonomy: "Autonomy",
  other_directedness: "Other-focus",
  overvigilance: "Over-vigilance",
};

/** Guardian identity, in US therapy-speak (fawn / flight / fight coping styles). */
const GUARDIAN_LABEL: Record<GuardianType, string> = {
  surrender: "Gives in",
  avoidance: "Slips away",
  overcompensation: "Pushes back",
};

/**
 * portrait static fallback — used when no generated hook exists (LLM failed, old blob, preview).
 * Doesn't quote answers (keeps it from reading like a canned report). Uses core_belief only.
 */
function staticPortrait(card: TypeCard): string {
  return `In moments that look small to everyone else, you're somehow the first to feel it. Deep down sits the belief that '${card.core_belief}' — so this child can't just let the moment pass.`;
}

export function InnerChildEnFreeReport({
  card,
  score,
  free,
  footerExtra,
  leadId,
  concern,
}: {
  card: TypeCard;
  /** Score result — powers the terrain (areas), second child, and guardian cards. Omit to skip those. */
  score?: ScoreResult | null;
  /** Generated hook. Only portrait is read. Falls back to staticPortrait. */
  free?: FreeReportGenerated | null;
  footerExtra?: ReactNode;
  /** leadId for the request modal + pixel. */
  leadId?: string;
  /** Optional free-text concern — echoed back verbatim as personalization evidence. */
  concern?: string;
}) {
  const [requestOpen, setRequestOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const paywallRef = useRef<HTMLDivElement | null>(null);
  const portrait = free?.portrait?.trim() || staticPortrait(card);
  const secondChild = score?.secondary_children?.[0] ?? null;
  const concernText = concern?.trim() || null;

  const openRequest = () => {
    trackMetaEvent("InitiateCheckout", {
      content_name: "inner_child_en_full",
      value: 12.9,
      currency: "USD",
    });
    trackEnFunnel("request_click", leadId);
    setRequestOpen(true);
  };

  // reached_paywall — fire once when the price/CTA block actually scrolls into view
  // (scroll layout, so IntersectionObserver, not mount). trackEnFunnel dedupes per session.
  useEffect(() => {
    const el = paywallRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      trackEnFunnel("reached_paywall", leadId);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          trackEnFunnel("reached_paywall", leadId);
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [leadId]);

  // Motion: inject star layer per scene + scroll-in fade + star parallax. Stops on reduced-motion.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scenes = Array.from(root.querySelectorAll<HTMLElement>(".ic-scene"));
    const starEls: HTMLElement[] = [];
    scenes.forEach((s) => {
      const d = document.createElement("div");
      d.className = "ic-stars";
      s.insertBefore(d, s.firstChild);
      starEls.push(d);
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("in");
          e.target.querySelectorAll<HTMLElement>(".ic-fill").forEach((f) => {
            f.style.width = (f.getAttribute("data-w") || "0") + "%";
          });
          io.unobserve(e.target);
        });
      },
      { threshold: 0.16 },
    );
    root.querySelectorAll(".ic-anim").forEach((el) => io.observe(el));

    let onScroll: (() => void) | null = null;
    if (!reduce && scenes.length) {
      let ticking = false;
      const run = () => {
        const vh = window.innerHeight;
        scenes.forEach((el, i) => {
          const r = el.getBoundingClientRect();
          if (r.bottom < -60 || r.top > vh + 60) return;
          const progress = (r.top + r.height / 2 - vh / 2) / vh;
          starEls[i].style.transform = `translateY(${(progress * 46).toFixed(1)}px)`;
        });
        ticking = false;
      };
      onScroll = () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(run);
        }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      run();
    }

    return () => {
      io.disconnect();
      if (onScroll) window.removeEventListener("scroll", onScroll);
      starEls.forEach((d) => d.remove());
    };
  }, []);

  const src = innerChildIllustration(card.schema_id);
  const secondSrc = secondChild ? innerChildIllustration(secondChild.schema_id) : null;
  const areaRows = score
    ? (Object.entries(score.areas) as [AreaId, AreaScore][]).sort(
        (a, b) => a[1].rank - b[1].rank,
      )
    : [];
  const areaMax = Math.max(1, ...areaRows.map(([, v]) => v.score));

  return (
    <div className="ic-root" ref={rootRef}>
      <style>{CSS}</style>

      {/* ── opening cinematic (one line at a time) ── */}
      <section className="ic-scene ic-tall ic-anim">
        <div className="ic-inner">
          <p className="ic-eyebrow ic-line">Analysis complete</p>
          <p className="ic-big ic-line ic-d1">
            Every answer you just gave —
          </p>
          <p className="ic-big ic-line ic-d2">we didn&rsquo;t let a single one slip.</p>
        </div>
        <span className="ic-scrollhint"><ArrowDown /></span>
      </section>

      <section className="ic-scene ic-anim">
        <div className="ic-inner">
          <p className="ic-line">Following your answers, one by one,</p>
          <p className="ic-line ic-d1">we found a <b>child</b> sitting inside you.</p>
        </div>
        <span className="ic-scrollhint"><ArrowDown /></span>
      </section>

      <section className="ic-scene ic-anim">
        <div className="ic-inner">
          <p className="ic-line">It&rsquo;s been there a long time —</p>
          <p className="ic-line ic-d1">and no one has called it by name.</p>
        </div>
      </section>

      {/* ── personalization hook (portrait) ── */}
      <div className="ic-cardwrap ic-anim">
        <div className="ic-card">
          <p className="ic-eyebrow2">Your story</p>
          <p className="ic-portrait">{portrait}</p>
        </div>
      </div>

      {/* ── the terrain of your heart (free · fully shown) ── */}
      {areaRows.length > 0 && (
        <>
          <section className="ic-scene ic-short ic-anim">
            <div className="ic-inner">
              <p className="ic-line">First, let&rsquo;s look at where your heart<br />quietly leans.</p>
            </div>
          </section>
          <div className="ic-cardwrap ic-anim">
            <div className="ic-card">
              <div className="ic-center"><span className="ic-free">Free · fully shown</span></div>
              <h2 className="ic-h2">The lay of your heart</h2>
              <p className="ic-muted ic-center ic-small" style={{ marginBottom: 20 }}>
                Which of four directions you lean toward — straight from your own answers.
              </p>
              <div className="ic-map">
                {areaRows.map(([area, v], i) => (
                  <div className="ic-row" key={area}>
                    <span className="ic-rl">{AREA_LABEL[area]}</span>
                    <span className="ic-track">
                      <span
                        className={"ic-fill" + (i > 1 ? " ic-dim" : "")}
                        data-w={String(Math.max(14, Math.round((v.score / areaMax) * 100)))}
                      />
                    </span>
                    <span className="ic-rv">{v.score}</span>
                  </div>
                ))}
              </div>
              <p className="ic-small ic-muted ic-center" style={{ marginTop: 20 }}>
                You answered loudest toward <b className="ic-ink">{AREA_LABEL[areaRows[0][0]]}</b>.
              </p>
            </div>
          </div>
        </>
      )}

      {/* ── type reveal (name & face free + lock) ── */}
      <section className="ic-scene ic-short ic-anim">
        <div className="ic-inner">
          <p className="ic-line">And within that direction,</p>
          <p className="ic-line ic-d1">one child answered louder than the rest.</p>
        </div>
      </section>
      <section className="ic-scene ic-short ic-anim">
        <div className="ic-inner">
          <p className="ic-big ic-line">And this child<br />already has a <b>name</b>.</p>
        </div>
        <span className="ic-scrollhint"><ArrowDown /></span>
      </section>

      <div className="ic-cardwrap ic-anim">
        <div className="ic-card ic-reveal">
          <span className="ic-free">Name &amp; face — free</span>
          {src ? (
            <img className="ic-avatar" src={src} alt={card.child_name} draggable={false} />
          ) : (
            <div className="ic-avatar" style={{ background: "#2a2a2e" }} />
          )}
          <p className="ic-name">{card.child_name}</p>
          <p className="ic-muted" style={{ margin: "0 4px" }}>{card.one_liner}</p>
          <Lockbox
            checks={[
              <>Why <b>you</b> react when others don&rsquo;t</>,
              <>What this heart has <b>protected</b> — and the strength to keep</>,
              <>How to stay <b>steadier</b> in your relationships</>,
              <>The moments this child finally <b>settles</b></>,
            ]}
          />
        </div>
      </div>

      {/* ── concern card (echoes their free-text, static personalization) ── */}
      {concernText && (
        <>
          <section className="ic-scene ic-anim">
            <div className="ic-inner">
              <p className="ic-line">And the worry you left at the end —</p>
              <p className="ic-big ic-line ic-d1"><b>that one</b><br />we can&rsquo;t just skip past.</p>
              <p className="ic-hint ic-line ic-d2">Let&rsquo;s trace how it connects to this child</p>
            </div>
            <span className="ic-scrollhint"><ArrowDown /></span>
          </section>
          <div className="ic-cardwrap ic-anim">
            <div className="ic-card">
              <div className="ic-center"><span className="ic-worry">The worry you left</span></div>
              <blockquote className="ic-concern-quote">&ldquo;{concernText}&rdquo;</blockquote>
              <p className="ic-muted ic-center" style={{ margin: "16px 0 0", fontSize: 15.5, lineHeight: 1.8 }}>
                That you can&rsquo;t let this one go isn&rsquo;t random — it&rsquo;s likely <b className="ic-ink">this child</b>.
              </p>
              <p className="ic-fillsent ic-center">
                What&rsquo;s really catching underneath is<br />
                <span className="ic-blank"><span>●●●●●●</span></span>.
              </p>
              <Lockbox
                checks={[
                  <>How this worry <b>connects to this child</b></>,
                  <>How to stay <b>less pulled around</b> in that moment</>,
                  <>When this very sensitivity becomes a <b>strength</b></>,
                ]}
              />
            </div>
          </div>
        </>
      )}

      {/* ── automatic thoughts (3 shown + blank + lock) ── */}
      {card.auto_thoughts?.length > 0 && (
        <>
          <section className="ic-scene ic-short ic-anim">
            <div className="ic-inner">
              <p className="ic-line">When this child wakes up, your mind</p>
              <p className="ic-big ic-line ic-d1">flips on almost the<br /><b>same thought</b>, automatically.</p>
            </div>
          </section>
          <div className="ic-cardwrap ic-anim">
            <div className="ic-card">
              <div className="ic-center"><span className="ic-free">The thoughts, shown as-is</span></div>
              <h2 className="ic-h2">The thoughts you keep having</h2>
              <div className="ic-thoughts">
                {card.auto_thoughts.slice(0, 3).map((t, i) => (
                  <div className="ic-thought" key={i}>{t}</div>
                ))}
              </div>
              <p className="ic-fillsent ic-center">
                Three lines that look different, but one<br />
                <span className="ic-blank"><span>●●●●●●●</span></span> underneath them all.
              </p>
              <Lockbox
                checks={[
                  <>Why you keep <b>falling into the same thought</b></>,
                  <>Why you <b>don&rsquo;t have to believe it</b></>,
                  <>How to <b>step out</b> when it pulls you under</>,
                ]}
              />
            </div>
          </div>
        </>
      )}

      {/* ── the loop (3 steps free, 4-5 locked) ── */}
      <section className="ic-scene ic-short ic-anim">
        <div className="ic-inner">
          <p className="ic-line">These thoughts don&rsquo;t fire at random.</p>
          <p className="ic-big ic-line ic-d1">They run the <b>same track</b><br />every single time.</p>
        </div>
      </section>
      <div className="ic-cardwrap ic-anim">
        <div className="ic-card">
          <div className="ic-center"><span className="ic-free">First three steps — free</span></div>
          <h2 className="ic-h2">The track the same wound runs</h2>
          <div className="ic-loop">
            <LoopStep n="1" t="Signal" d="a moment catches on something" />
            <LoopStep n="2" t="Reading" d="you assume the worst first" />
            <LoopStep n="3" t="Action" d="you check for reassurance, or pull back first" />
            <LoopStep n="4" t="What comes back" d="what that action leaves behind, and what it returns to you" locked />
            <LoopStep n="5" t="The belief that hardens" d="the line this child gets confirmed, every time the loop closes" locked />
          </div>
          <Lockbox
            checks={[
              <>How this loop <b>ends</b></>,
              <>How to <b>stop landing</b> in the same place</>,
              <>How to break it and <b>take one step forward</b></>,
            ]}
          />
        </div>
      </div>

      {/* ── guardian (identity shown + blank + lock) ── */}
      {score?.guardian && (
        <>
          <section className="ic-scene ic-anim">
            <div className="ic-inner">
              <p className="ic-line">But here&rsquo;s the thing — this child</p>
              <p className="ic-big ic-line ic-d1">did all of it<br />to <b>protect you</b>.</p>
            </div>
          </section>
          <div className="ic-cardwrap ic-anim">
            <div className="ic-card">
              <div className="ic-center"><span className="ic-free">The guardian, named</span></div>
              <h2 className="ic-h2">What&rsquo;s been guarding this child</h2>
              <div className="ic-gname"><span className="ic-badge">{GUARDIAN_LABEL[score.guardian.type]}</span></div>
              {card.surface_reaction && (
                <p className="ic-muted ic-center ic-small" style={{ margin: "10px 0 0" }}>
                  On the surface, it shows up as <b className="ic-ink">{card.surface_reaction}</b>.
                </p>
              )}
              <p className="ic-fillsent ic-center" style={{ marginTop: 14 }}>
                What this guardian quietly paid on your behalf is<br />
                <span className="ic-blank"><span>●●●●●●</span></span>.
              </p>
              <Lockbox
                checks={[
                  <>What this defense <b>gave up</b> in return</>,
                  <>How to feel <b>safe without bracing</b></>,
                  <>A gentler way to <b>keep yourself safe</b></>,
                ]}
              />
            </div>
          </div>
        </>
      )}

      {/* ── only the beginning (strong) ── */}
      <section className="ic-scene ic-tall ic-anim">
        <div className="ic-inner">
          <p className="ic-big ic-line">And all of this…</p>
          <p className="ic-big ic-line ic-d1">is only the <b>beginning</b>.</p>
          <p className="ic-line ic-d2" style={{ marginTop: 22 }}>
            There&rsquo;s more inside you that<br />hasn&rsquo;t shown its face yet.
          </p>
        </div>
        <span className="ic-scrollhint"><ArrowDown /></span>
      </section>

      {/* ── teaser rail ── */}
      <div className="ic-teaser ic-anim">
        <div className="ic-th"><p>What continues in the report</p><p className="ic-sub">→ swipe across</p></div>
        <div className="ic-rail">
          <TeaserCard t={<>This child&rsquo;s<br />full structure</>} d="The story behind the name, and how it shows across three areas" />
          <TeaserCard t={<>The second<br />child</>} d="The other child behind the veil, and how the two trade places" />
          <TeaserCard t={<>How to live<br />alongside it</>} d="In relationships, on your own, and inside your own mind" />
          <TeaserCard t={<>A closing<br />letter</>} d="What the you of today says to that child" />
        </div>
      </div>

      {/* ── second child (blurred + lock) ── */}
      {secondChild && (
        <div className="ic-cardwrap ic-anim">
          <div className="ic-card ic-second">
            <div className="ic-swrap">
              {secondSrc ? (
                <img src={secondSrc} alt="" aria-hidden draggable={false} />
              ) : (
                <div style={{ width: "100%", height: "100%", borderRadius: 999, background: "#2a2a2e" }} />
              )}
              <span className="ic-lk"><LockIcon size={40} /></span>
            </div>
            <h2 className="ic-h2">The second child is<br />still keeping its face hidden</h2>
            <Lockbox
              center
              checks={[
                <>The second child&rsquo;s <b>name and face</b></>,
                <>How to <b>handle yourself</b> when the two collide</>,
                <>Why some days you become a <b>completely different you</b></>,
              ]}
            />
          </div>
        </div>
      )}

      {/* ── closing narrative ── */}
      <section className="ic-scene ic-tall ic-anim">
        <div className="ic-inner">
          <p className="ic-line">This child has guarded you for a long time.</p>
          <p className="ic-line ic-d1">Not one to erase —<br />one to finally <b>call by name</b>.</p>
          {card.reparenting_line && (
            <p className="ic-voice ic-line ic-d2" style={{ marginTop: 28 }}>&ldquo;{card.reparenting_line}&rdquo;</p>
          )}
        </div>
      </section>

      {/* ── price ── */}
      <div className="ic-cardwrap ic-anim" ref={paywallRef}>
        <h2 className="ic-center" style={{ fontSize: 27, fontWeight: 800, lineHeight: 1.34, letterSpacing: "-0.02em" }}>
          Ready to meet the parts<br />still kept hidden?
        </h2>
        <p className="ic-muted ic-center" style={{ margin: "10px 0 18px" }}>
          Everything you&rsquo;ve been wondering — down to <b className="ic-ink">how it actually gets better</b> — opens up.
        </p>
        <div className="ic-card">
          <p className="ic-prod-title">Inner Child Deep Report<span className="ic-prod-sub">14 chapters</span></p>
          <ul className="ic-toc" style={{ margin: "16px 0 0" }}>
            <li>Why <b>you</b>, specifically — the root of this reaction</li>
            <li>Where this child <b>first formed</b>, and its full structure</li>
            <li>How to get <b>free of the thought</b> that keeps circling</li>
            <li>How to <b>break the loop</b> and move forward</li>
            <li>A <b>gentler way to protect yourself</b> in relationships</li>
            <li>Meeting the second child, and <b>a letter to the you of today</b></li>
          </ul>
        </div>
        <div className="ic-pricebox">
          <div className="ic-pline ic-total"><span className="ic-tlabel">Full report</span><span className="ic-final">{PRICE_LABEL}</span></div>
        </div>
      </div>

      <p className="ic-disc">GIBUN Report · INNER CHILD REPORT · {DISCLAIMER}</p>
      {footerExtra ? <div className="ic-foot-extra">{footerExtra}</div> : null}
      <div className="ic-foot-space" />

      {/* ── sticky CTA ── */}
      <div className="ic-sticky">
        <p className="ic-cap">Opens in seconds · reopen anytime by link</p>
        <button type="button" className="ic-cta" onClick={openRequest}>Get the full report · {PRICE_LABEL} →</button>
      </div>

      <RequestReportModal open={requestOpen} onClose={() => setRequestOpen(false)} leadId={leadId} />
    </div>
  );
}

/* ─────────────── pieces ─────────────── */

function Lockbox({ checks, center = false }: { checks: ReactNode[]; center?: boolean }) {
  return (
    <div className="ic-lockbox" style={center ? { textAlign: "center" } : undefined}>
      <span className="ic-lock-ico"><LockIcon size={34} /></span>
      <p className="ic-lh">+ Here&rsquo;s what the full report opens up</p>
      <div className="ic-hr" />
      <ul className="ic-checks" style={center ? { maxWidth: 300, margin: "0 auto" } : undefined}>
        {checks.map((c, i) => <li key={i}>{c}</li>)}
      </ul>
    </div>
  );
}

function LoopStep({ n, t, d, locked = false }: { n: string; t: string; d: string; locked?: boolean }) {
  return (
    <div className={"ic-st" + (locked ? " ic-locked" : "")}>
      <span className="ic-dot">{n}</span>
      <div>
        <p className="ic-st-t">{t}</p>
        <p className="ic-st-d">{d}</p>
      </div>
    </div>
  );
}

function TeaserCard({ t, d }: { t: ReactNode; d: string }) {
  return (
    <div className="ic-tcard">
      <span className="ic-tlock"><LockIcon size={18} /></span>
      <p className="ic-tt">{t}</p>
      <p className="ic-td">{d}</p>
    </div>
  );
}

function ArrowDown() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 5v14M6 13l6 6 6-6" />
    </svg>
  );
}

function LockIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x={4} y={10} width={16} height={11} rx={2.5} />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/* ─────────────── CSS (night-sky narrative + cream cards, lavender accent) ─────────────── */

const CSS = `
/* Always dark — sales page is dark-fixed (no light/OS auto). */
.ic-root{
  --paper:#211D18;--paper-2:#29241D;--ink:#EDE4D3;--pencil:#9A9082;
  --rule:#342D24;--edge:#3A3228;--sage:#A6A2E0;--sage-soft:#322F47;
  --shadow:0 0 0;--lock-veil:33 29 24;
  background:var(--paper);color:var(--ink);
  font-family:'Inter','Pretendard',-apple-system,BlinkMacSystemFont,system-ui,sans-serif;
  line-height:1.7;-webkit-font-smoothing:antialiased;
  max-width:440px;margin:0 auto;position:relative;overflow-x:hidden;
}
.ic-root *{box-sizing:border-box;}
.ic-root h2,.ic-root p,.ic-root ul{margin:0;}
.ic-ink{color:var(--ink);}
.ic-muted{color:var(--pencil);}
.ic-small{font-size:13px;}
.ic-center{text-align:center;}
.ic-h2{font-size:24px;line-height:1.34;letter-spacing:-.01em;font-weight:800;text-align:center;text-wrap:balance;}

/* narrative (night sky, theme-fixed) */
.ic-scene{position:relative;min-height:78vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:60px 34px;color:#F1E9DA;overflow:hidden;background:radial-gradient(62% 42% at 50% 20%,rgba(92,88,142,.30),transparent 72%),#1C1813;box-shadow:inset 0 -90px 110px -30px rgba(0,0,0,.72),inset 0 70px 90px -40px rgba(0,0,0,.5);}
.ic-scene.ic-short{min-height:60vh;}
.ic-scene.ic-tall{min-height:92vh;}
.ic-stars{position:absolute;inset:-16% 0;z-index:0;pointer-events:none;will-change:transform;}
.ic-stars::before,.ic-stars::after{content:"";position:absolute;inset:0;}
.ic-stars::before{background:radial-gradient(1.5px 1.5px at 12% 18%,#fff,transparent),radial-gradient(1px 1px at 28% 42%,rgba(255,255,255,.8),transparent),radial-gradient(1.5px 1.5px at 45% 12%,rgba(255,255,255,.9),transparent),radial-gradient(1px 1px at 62% 30%,rgba(255,255,255,.65),transparent),radial-gradient(1.5px 1.5px at 78% 22%,#fff,transparent),radial-gradient(1px 1px at 35% 90%,rgba(255,255,255,.6),transparent);animation:icTw1 4.5s ease-in-out infinite;}
.ic-stars::after{background:radial-gradient(1px 1px at 88% 48%,rgba(255,255,255,.75),transparent),radial-gradient(1px 1px at 18% 68%,rgba(255,255,255,.6),transparent),radial-gradient(1.5px 1.5px at 52% 78%,rgba(255,255,255,.8),transparent),radial-gradient(1px 1px at 72% 88%,rgba(255,255,255,.55),transparent),radial-gradient(1px 1px at 8% 40%,rgba(255,255,255,.5),transparent),radial-gradient(1.5px 1.5px at 92% 14%,#fff,transparent);animation:icTw2 6s ease-in-out infinite;}
@keyframes icTw1{0%,100%{opacity:.95}50%{opacity:.5}}
@keyframes icTw2{0%,100%{opacity:.5}50%{opacity:.95}}
.ic-inner{position:relative;z-index:1;max-width:340px;}
.ic-scene p{font-size:21px;line-height:1.85;font-weight:600;color:#F1E9DA;text-wrap:balance;}
.ic-scene p+p{margin-top:18px;}
.ic-scene p b{color:#fff;font-weight:800;}
.ic-scene .ic-big{font-size:25px;}
.ic-scene .ic-eyebrow{font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#9A9DB8;font-weight:700;margin-bottom:22px;}
.ic-scene .ic-hint{margin-top:22px;font-size:12.5px;letter-spacing:.06em;color:#8E93AD;font-weight:700;}
.ic-scene .ic-voice{font-style:italic;color:#B5B1E4;font-size:23px;font-weight:500;line-height:1.7;}
.ic-scrollhint{position:absolute;bottom:26px;left:50%;transform:translateX(-50%);z-index:1;color:#8E93AD;opacity:.8;}
.ic-scrollhint svg{animation:icBob 1.8s ease-in-out infinite;}
@keyframes icBob{0%,100%{transform:translateY(0)}50%{transform:translateY(7px)}}
.ic-line{opacity:0;transform:translateY(16px);filter:blur(7px);transition:opacity 1s ease,transform 1.1s cubic-bezier(.2,.7,.2,1),filter 1.1s ease;}
.ic-scene.in .ic-line{opacity:1;transform:none;filter:none;}
.ic-scene.in .ic-d1{transition-delay:.3s;}
.ic-scene.in .ic-d2{transition-delay:.75s;}

/* cards */
.ic-cardwrap{padding:42px 26px;position:relative;}
.ic-card{background:var(--paper-2);border:1.5px solid var(--edge);border-radius:18px;padding:26px 22px;box-shadow:0 12px 30px -20px rgb(var(--shadow)/.5);}
.ic-eyebrow2{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--pencil);font-weight:700;margin-bottom:12px;text-align:center;}
.ic-portrait{font-size:17px;line-height:1.9;color:var(--ink);white-space:pre-line;}
.ic-free{display:inline-flex;align-items:center;gap:6px;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;font-weight:800;color:var(--sage);border:1.5px solid var(--sage);border-radius:999px;padding:3px 10px 3px 8px;margin-bottom:8px;}
.ic-free::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--sage);}
.ic-worry{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:700;color:var(--sage);background:var(--sage-soft);border-radius:999px;padding:5px 13px 5px 10px;margin-bottom:12px;}
.ic-concern-quote{margin:16px 0 0;padding:16px 18px;background:var(--paper);border:1px solid var(--edge);border-left:3px solid var(--sage);border-radius:4px 12px 12px 4px;font-size:16px;line-height:1.75;font-weight:600;color:var(--ink);white-space:pre-wrap;}
.ic-worry::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--sage);}

.ic-lockbox{border:1.6px dashed var(--sage);border-radius:16px;padding:24px 20px 20px;margin-top:22px;text-align:center;background:rgb(var(--lock-veil)/.5);}
.ic-lock-ico{color:var(--sage);display:block;margin:0 auto 10px;height:34px;}
.ic-lh{font-weight:800;font-size:15.5px;margin-bottom:4px;}
.ic-hr{height:1px;background:var(--edge);margin:15px 2px 17px;}
.ic-checks{list-style:none;text-align:left;display:grid;gap:13px;}
.ic-checks li{position:relative;padding-left:30px;font-size:14.5px;line-height:1.5;}
.ic-checks li::before{content:"";position:absolute;left:0;top:1px;width:19px;height:19px;border-radius:50%;background:var(--sage);-webkit-mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M20 6 9 17l-5-5' fill='none' stroke='%23000' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/13px no-repeat;mask:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M20 6 9 17l-5-5' fill='none' stroke='%23000' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/13px no-repeat;}
.ic-checks b{font-weight:700;}

.ic-fillsent{font-size:15.5px;line-height:1.95;margin-top:4px;}
.ic-blank{display:inline-block;border:1.5px solid var(--sage);border-radius:999px;padding:1px 18px;vertical-align:middle;background:var(--sage-soft);}
.ic-blank span{filter:blur(6px);user-select:none;font-weight:700;color:var(--ink);}

.ic-map{display:grid;gap:13px;margin-top:6px;}
.ic-row{display:grid;grid-template-columns:92px 1fr 32px;align-items:center;gap:10px;}
.ic-rl{font-size:13px;font-weight:600;}
.ic-track{height:12px;background:var(--rule);border-radius:999px;overflow:hidden;}
.ic-fill{display:block;height:100%;background:var(--sage);border-radius:999px;width:0;transition:width 1.1s cubic-bezier(.2,.7,.2,1);}
.ic-fill.ic-dim{background:var(--edge);}
.ic-rv{font-size:12.5px;font-weight:700;text-align:right;color:var(--pencil);font-variant-numeric:tabular-nums;}

.ic-reveal{text-align:center;}
.ic-avatar{width:168px;height:168px;border-radius:50%;object-fit:cover;border:3px solid var(--paper);box-shadow:0 0 0 2px var(--sage),0 14px 30px -12px rgb(var(--shadow)/.5);margin:6px 0 18px;background:#FBF7EE;}
.ic-name{font-size:27px;font-weight:800;letter-spacing:-.01em;margin-bottom:8px;}

.ic-thoughts{display:grid;gap:11px;margin:16px 0 4px;}
.ic-thought{background:var(--paper);border:1.5px solid var(--edge);border-radius:16px 16px 16px 4px;padding:12px 15px;font-size:15px;font-weight:600;position:relative;}
.ic-thought::after{content:"\\201D";position:absolute;right:12px;bottom:2px;color:var(--edge);font-size:22px;}

.ic-loop{display:grid;gap:0;margin:16px 0 4px;}
.ic-st{display:grid;grid-template-columns:30px 1fr;gap:12px;padding:0 0 18px;position:relative;}
.ic-st:not(:last-child)::before{content:"";position:absolute;left:14px;top:28px;bottom:-2px;width:2px;background:var(--edge);}
.ic-dot{width:28px;height:28px;border-radius:50%;background:var(--sage);color:#fff;font-weight:800;font-size:12px;display:grid;place-items:center;z-index:1;}
.ic-st-t{font-weight:700;font-size:14.5px;margin:3px 0 3px;}
.ic-st-d{font-size:13px;color:var(--pencil);}
.ic-st.ic-locked .ic-dot{background:var(--edge);color:var(--pencil);}
.ic-st.ic-locked .ic-st-t,.ic-st.ic-locked .ic-st-d{filter:blur(5px);user-select:none;}

.ic-gname{display:flex;align-items:center;gap:10px;margin:6px 0 4px;justify-content:center;}
.ic-badge{font-size:12.5px;font-weight:800;color:var(--paper);background:var(--ink);border-radius:8px;padding:5px 12px;}

.ic-second{text-align:center;}
.ic-swrap{position:relative;width:150px;height:150px;margin:6px auto 16px;}
.ic-swrap img{width:100%;height:100%;border-radius:50%;object-fit:cover;filter:blur(11px) saturate(.7);transform:scale(1.15);}
.ic-lk{position:absolute;inset:0;display:grid;place-items:center;color:var(--sage);}

.ic-teaser{padding:40px 0 44px;background:#1C1813;position:relative;overflow:hidden;}
.ic-teaser::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(1px 1px at 20% 30%,rgba(255,255,255,.6),transparent),radial-gradient(1.5px 1.5px at 70% 20%,#fff,transparent),radial-gradient(1px 1px at 85% 60%,rgba(255,255,255,.5),transparent),radial-gradient(1px 1px at 40% 75%,rgba(255,255,255,.5),transparent);}
.ic-th{text-align:center;padding:0 26px 18px;position:relative;z-index:1;}
.ic-th p{font-size:20px;font-weight:800;color:#F1E9DA;}
.ic-th .ic-sub{font-size:13px;color:#9096B0;font-weight:600;margin-top:6px;}
.ic-rail{display:flex;gap:14px;overflow-x:auto;padding:6px 26px 14px;scroll-snap-type:x mandatory;scrollbar-width:none;position:relative;z-index:1;}
.ic-rail::-webkit-scrollbar{display:none;}
.ic-tcard{flex:0 0 150px;scroll-snap-align:center;background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.14);border-radius:14px;padding:18px 15px;min-height:148px;position:relative;color:#F1E9DA;}
.ic-tlock{position:absolute;top:12px;right:12px;color:var(--sage);opacity:.9;}
.ic-tt{font-weight:800;font-size:15px;margin:26px 0 8px;}
.ic-td{font-size:12.5px;color:#A79E8E;filter:blur(2.5px);}

.ic-prod-title{font-weight:800;font-size:16px;text-align:center;}
.ic-prod-sub{color:var(--pencil);font-weight:600;font-size:13px;margin-left:8px;}
.ic-toc{list-style:none;display:grid;gap:10px;}
.ic-toc li{display:flex;gap:10px;align-items:flex-start;font-size:14.5px;line-height:1.5;}
.ic-toc li::before{content:"";margin-top:7px;width:5px;height:5px;border-radius:50%;background:var(--sage);flex:none;}
.ic-toc b{font-weight:700;}
.ic-pricebox{margin-top:20px;padding:4px 4px 0;}
.ic-pline{display:flex;justify-content:space-between;align-items:center;font-size:15px;padding:8px 2px;}
.ic-total{padding-top:12px;}
.ic-tlabel{font-weight:800;font-size:16px;}
.ic-final{font-size:30px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums;}

.ic-disc{font-size:11.5px;color:var(--pencil);line-height:1.6;padding:26px 26px 10px;text-align:center;}
.ic-foot-extra{padding:0 26px;}
.ic-foot-space{height:104px;}

.ic-sticky{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:440px;z-index:60;background:linear-gradient(180deg,transparent,var(--paper) 30%);padding:30px 26px calc(18px + env(safe-area-inset-bottom,0px));}
.ic-cap{text-align:center;font-size:12px;color:var(--pencil);margin-bottom:10px;}
.ic-cta{display:block;width:100%;text-align:center;cursor:pointer;background:var(--ink);color:var(--paper);border:none;border-radius:14px;font-size:16.5px;font-weight:800;padding:17px;font-family:inherit;}

.ic-anim{opacity:0;transform:translateY(22px) scale(.985);transition:opacity .8s ease,transform .8s cubic-bezier(.2,.7,.2,1);}
.ic-anim.in{opacity:1;transform:none;}
@media (prefers-reduced-motion:reduce){
  .ic-anim,.ic-line{opacity:1;transform:none;filter:none;transition:none;}
  .ic-fill{transition:none;}
  .ic-scrollhint svg,.ic-stars::before,.ic-stars::after{animation:none;}
  .ic-stars{transform:none!important;}
}
`;
