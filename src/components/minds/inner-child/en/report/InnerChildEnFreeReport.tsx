"use client";

/**
 * Inner Child free report — ENGLISH (ink-orange dark scroll report).
 *
 * 한국어 InnerChildFreeReport.tsx 의 영어판. 구조·디자인 동일. 다른 점:
 *  - 모든 카피 영어
 *  - 결제(MindsCheckoutModal) → 요청(RequestReportModal, 이메일 수집)
 *  - 가격 표기 $9.90 단일가(해외 결제 미지원 — 실제로는 베타 무료 발송)
 *  - trackMindsFunnel(운영자 슬랙) 미사용 — KR 퍼널 신호와 섞지 않음. Meta 픽셀만 유지.
 */

import { useState, type CSSProperties, type ReactNode } from "react";
import { DISCLAIMER } from "@/lib/minds/inner-child/en/questions";
import { RequestReportModal } from "@/components/minds/inner-child/en/RequestReportModal";
import { TypeAvatar } from "@/components/minds/inner-child/report/TypeAvatar";
import { trackMetaEvent } from "@/lib/meta-pixel";
import type { FreeReportGenerated, TypeCard } from "@/lib/minds/inner-child/report-types";

/* ─── ink-orange tokens ─── */
const INK = {
  shell: "#0A0A0B",
  surface: "#141519",
  border: "#26272c",
  payBorder: "#34302b",
  accent: "#FF5A1F",
  accent2: "#FF8A4C",
  grad: "linear-gradient(135deg,#FF5A1F 0%,#FF8A4C 50%,#FFB68A 100%)",
  mute: "#8C8E95",
  white: "#fff",
  t82: "rgba(255,255,255,.82)",
  t72: "rgba(255,255,255,.72)",
  t68: "rgba(255,255,255,.68)",
  t62: "rgba(255,255,255,.62)",
  t6: "rgba(255,255,255,.6)",
  t4: "rgba(255,255,255,.4)",
  t38: "rgba(255,255,255,.38)",
  line: "rgba(255,255,255,.08)",
  line14: "rgba(255,255,255,.14)",
  font: "'Pretendard',-apple-system,BlinkMacSystemFont,system-ui,sans-serif",
  display: "'Inter','Pretendard',-apple-system,system-ui,sans-serif",
  mono: "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace",
};

const PRICE_LABEL = "$9.90";

/** portrait static fallback — assembled from the type card (no answer quoting). */
function staticPortrait(card: TypeCard): string {
  return `${card.one_liner}. ${card.traits}\n\nDeep down sits the belief that '${card.core_belief}'. So even in moments that look small to others, you're the first to react. Let's meet this child, one piece at a time.`;
}

/** insight static fallback — the pre-paywall realization, from card fields only. */
function staticInsight(card: TypeCard): string {
  return `Usually quiet, this child wakes up unusually strongly in certain moments. In those moments you tend to step forward looking '${card.surface_reaction}'. On the surface it can look like ${card.key_emotion}, but underneath is an old wish to protect yourself. That isn't weakness — it was once a way that genuinely kept you safe. But why it happens in that exact moment, and how to step out of it, is still ahead.`;
}

/** daily_prediction static fallback — from the card's domains, predictive tone. */
function staticDaily(card: TypeCard): string {
  return `Hasn't this happened to you more than once? In relationships, ${card.domains["관계"]} At work, ${card.domains["일"]} And even when you're alone, ${card.domains["자기관리"]} The situations look different each time, but the same child is moving underneath.`;
}

export function InnerChildEnFreeReport({
  card,
  free,
  footerExtra,
  leadId,
}: {
  card: TypeCard;
  free?: FreeReportGenerated | null;
  footerExtra?: ReactNode;
  leadId?: string;
}) {
  const [requestOpen, setRequestOpen] = useState(false);
  const portrait = free?.portrait?.trim() || staticPortrait(card);
  const insight = free?.insight?.trim() || staticInsight(card);
  const dailyPrediction = free?.daily_prediction?.trim() || staticDaily(card);

  // 요청 모달 오픈 — 구매 최적화 신호(InitiateCheckout, USD)로 발화. 결제창은 없다.
  const openRequest = () => {
    trackMetaEvent("InitiateCheckout", {
      content_name: "inner_child_en_full",
      value: 9.9,
      currency: "USD",
    });
    setRequestOpen(true);
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#050506",
        fontFamily: INK.font,
        paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <style>{`
        @keyframes icRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .ic-cta{transition:transform .12s ease,box-shadow .2s ease}
        .ic-cta:active{transform:scale(.99)}
      `}</style>

      <div style={{ maxWidth: 440, margin: "0 auto", padding: "14px 14px 0", display: "flex", flexDirection: "column", gap: 22 }}>
        <Hero card={card} />
        <PortraitSection portrait={portrait} />
        <TypeExplainSection card={card} n="01" />
        <VoiceSection card={card} />
        <ScenesSection card={card} n="02" />
        <DomainsSection card={card} n="03" prediction={dailyPrediction} />
        <MetricsSection card={card} />
        <InsightSection insight={insight} />
        <PaywallSection onRequest={openRequest} />

        <p style={{ fontFamily: INK.mono, fontSize: 10, color: INK.t38, lineHeight: 1.7, textAlign: "center", marginTop: 4 }}>
          GIBUN Report · INNER CHILD REPORT · {DISCLAIMER}
        </p>
        {footerExtra ? <div style={{ marginTop: 4 }}>{footerExtra}</div> : null}
      </div>

      <StickyCta onRequest={openRequest} />

      <RequestReportModal open={requestOpen} onClose={() => setRequestOpen(false)} leadId={leadId} />
    </div>
  );
}

/* ─────────────── shared pieces ─────────────── */

const clbStyle: CSSProperties = {
  fontFamily: INK.mono,
  fontWeight: 600,
  fontSize: 9.5,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: INK.mute,
  marginBottom: 12,
};

function SecTitle({ n, children }: { n: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
      <span style={{ fontFamily: INK.mono, fontSize: 12, fontWeight: 600, color: INK.accent2 }}>{n}</span>
      <span style={{ fontFamily: INK.display, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", color: INK.white }}>{children}</span>
    </div>
  );
}

function OpenSection({ children }: { children: ReactNode }) {
  return (
    <section style={{ padding: "26px 4px 0", borderTop: `1px solid rgba(255,255,255,.07)`, animation: "icRise .4s ease both" }}>
      {children}
    </section>
  );
}

const READ = { size: 17, line: 1.9, noteSize: 16, noteLine: 1.85 };

/* ─────────────── 1 · hero ─────────────── */

function Hero({ card }: { card: TypeCard }) {
  const words = card.child_name.trim().split(" ");
  const last = words.pop() ?? "";
  const head = words.join(" ");
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 20, background: INK.shell, border: `1px solid ${INK.border}`, padding: "30px 22px 28px", animation: "icRise .4s ease both" }}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 10%, #000, transparent 72%)",
          maskImage: "radial-gradient(ellipse at 50% 10%, #000, transparent 72%)",
        }}
      />
      <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 44% at 50% 0%, rgba(255,90,31,.3), transparent 70%)" }} />
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 5, height: 5, borderRadius: 999, background: INK.accent, display: "inline-block" }} />
          <span style={{ fontFamily: INK.mono, fontWeight: 600, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: INK.accent2 }}>
            Of the 16 inner children, you are
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginTop: 18 }}>
          <TypeAvatar schemaId={card.schema_id} alt={card.child_name} size={112} />
          <h1 style={{ fontFamily: INK.display, fontSize: 32, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.04em", color: INK.white, margin: "18px 0 0" }}>
            {head}
            {head ? " " : ""}
            <span style={{ background: INK.grad, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{last}</span>
          </h1>
          <p style={{ fontFamily: INK.font, fontSize: 15.5, lineHeight: 1.6, letterSpacing: "-0.01em", color: INK.t6, margin: "12px 0 0", maxWidth: 340 }}>
            {card.one_liner}
          </p>
          <span style={{ display: "inline-flex", marginTop: 18, padding: "9px 16px", borderRadius: 999, background: "rgba(255,255,255,.06)", border: `1px solid ${INK.line14}`, fontFamily: INK.font, fontSize: 13.5, fontWeight: 600, color: INK.white }}>
            {card.core_belief}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────── 2 · portrait ─────────────── */

function PortraitSection({ portrait }: { portrait: string }) {
  return (
    <div style={{ padding: "2px 4px 0", animation: "icRise .4s ease both" }}>
      <div style={clbStyle}>Your Story</div>
      <p
        style={{
          fontFamily: INK.font,
          fontSize: 17.5,
          lineHeight: 1.92,
          letterSpacing: "-0.006em",
          color: INK.t82,
          margin: 0,
          whiteSpace: "pre-line",
        }}
      >
        {portrait}
      </p>
    </div>
  );
}

/* ─────────────── 3 · what kind of child is this type ─────────────── */

function TypeExplainSection({ card, n }: { card: TypeCard; n: string }) {
  return (
    <OpenSection>
      <SecTitle n={n}>What kind of child is this?</SecTitle>
      <p style={{ fontFamily: INK.font, fontSize: READ.size, lineHeight: READ.line, letterSpacing: "-0.005em", color: INK.t82, marginTop: 16 }}>
        {card.traits}
      </p>
      <div style={{ marginTop: 20, padding: "17px 18px", background: "rgba(255,90,31,.06)", border: `1px solid rgba(255,138,76,.22)`, borderRadius: 14 }}>
        <div style={clbStyle}>This type&rsquo;s strength</div>
        <p style={{ fontFamily: INK.font, fontSize: 16.5, lineHeight: 1.8, color: "rgba(255,255,255,.9)", margin: 0 }}>{card.strength}</p>
        <p style={{ fontFamily: INK.font, fontSize: READ.noteSize, lineHeight: READ.noteLine, color: INK.t62, marginTop: 10 }}>
          This isn&rsquo;t a weakness to erase — it&rsquo;s an ability that serves you powerfully in the right moments.
          It only wears you down when it stays switched on far longer than the situation needs.
        </p>
      </div>
    </OpenSection>
  );
}

/* ─────────────── 4 · inner voice ─────────────── */

function VoiceSection({ card }: { card: TypeCard }) {
  return (
    <OpenSection>
      <div style={clbStyle}>Inner Voice</div>
      <p style={{ fontFamily: INK.font, fontStyle: "italic", fontWeight: 600, fontSize: 22, lineHeight: 1.5, letterSpacing: "-0.01em", color: INK.white, margin: 0 }}>
        &ldquo;{card.voice}&rdquo;
      </p>
      <p style={{ fontFamily: INK.font, fontSize: READ.noteSize, lineHeight: READ.noteLine, color: INK.t62, margin: "14px 0 0" }}>
        This is the one line this child repeats inside. Most of the time you barely hear it — but when a hard moment comes,
        it rings out as clearly as your own thought.
      </p>
    </OpenSection>
  );
}

/* ─────────────── 5 · moments like these ─────────────── */

function ScenesSection({ card, n }: { card: TypeCard; n: string }) {
  const scenes = card.typical_scenes ?? [];
  const notes = card.typical_scene_notes ?? [];
  if (scenes.length === 0) return null;
  return (
    <OpenSection>
      <SecTitle n={n}>Moments like these — sound familiar?</SecTitle>
      <p style={{ fontFamily: INK.font, fontSize: 16, lineHeight: 1.75, color: INK.t62, marginTop: 14 }}>
        These are scenes that repeat often for someone this child lives in. At least one probably won&rsquo;t feel unfamiliar.
      </p>
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 22 }}>
        {scenes.map((s, i) => (
          <div key={i}>
            <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
              <span style={{ fontFamily: INK.mono, fontSize: 12, fontWeight: 600, color: INK.accent2 }}>{String(i + 1).padStart(2, "0")}</span>
              <span style={{ fontFamily: INK.font, fontWeight: 700, fontSize: 17, lineHeight: 1.5, color: INK.white }}>{s}</span>
            </div>
            {notes[i] && (
              <p style={{ fontFamily: INK.font, fontSize: READ.noteSize, lineHeight: READ.noteLine, color: INK.t72, margin: "8px 0 0", paddingLeft: 22 }}>{notes[i]}</p>
            )}
          </div>
        ))}
      </div>
    </OpenSection>
  );
}

/* ─────────────── 6 · how it shows up day to day ─────────────── */

function DomainsSection({ card, n, prediction }: { card: TypeCard; n: string; prediction: string }) {
  const domains: [string, string][] = [
    ["In relationships", card.domains["관계"]],
    ["At work", card.domains["일"]],
    ["On your own", card.domains["자기관리"]],
  ];
  return (
    <OpenSection>
      <SecTitle n={n}>How it shows up day to day</SecTitle>
      <p style={{ fontFamily: INK.font, fontSize: 16, lineHeight: 1.75, color: INK.t62, marginTop: 14 }}>
        The same child wears a different face depending on the moment. Here&rsquo;s how it surfaces across three areas.
      </p>
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 18 }}>
        {domains.map(([k, v]) => (
          <div key={k}>
            <p style={{ fontFamily: INK.font, fontSize: 16, fontWeight: 700, color: INK.accent2, margin: 0 }}>{k}</p>
            <p style={{ fontFamily: INK.font, fontSize: READ.size, lineHeight: 1.78, color: INK.t82, margin: "5px 0 0" }}>{v}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 22, padding: "18px 18px", background: "rgba(255,255,255,.035)", border: `1px solid ${INK.line}`, borderRadius: 14 }}>
        <div style={{ ...clbStyle, marginBottom: 10 }}>You probably —</div>
        <p style={{ fontFamily: INK.font, fontSize: READ.size, lineHeight: READ.line, letterSpacing: "-0.005em", color: INK.t82, margin: 0, whiteSpace: "pre-line" }}>
          {prediction}
        </p>
      </div>
    </OpenSection>
  );
}

/* ─────────────── 7 · signal index ─────────────── */

function MetricsSection({ card }: { card: TypeCard }) {
  const metrics = card.metrics ?? [];
  if (metrics.length === 0) return null;
  return (
    <OpenSection>
      <div style={clbStyle}>Signal Index</div>
      <p style={{ fontFamily: INK.font, fontSize: 16, lineHeight: 1.75, color: INK.t62, margin: "0 0 20px" }}>
        Here&rsquo;s how we read your answers — the senses that run unusually strong, or unusually quiet, in this type.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {metrics.map((m, i) => {
          const cool = m.tone === "cool";
          return (
            <div key={i}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: INK.font, fontSize: 16.5, fontWeight: 600, color: "rgba(255,255,255,.92)" }}>{m.name}</span>
                <span style={{ fontFamily: INK.mono, fontWeight: 600, fontSize: 12.5, fontVariantNumeric: "tabular-nums", color: cool ? "rgba(255,255,255,.55)" : INK.accent2 }}>{m.value}</span>
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,.09)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${m.value}%`, background: cool ? "rgba(255,255,255,.4)" : INK.grad, borderRadius: 3 }} />
              </div>
              {m.desc && <p style={{ fontFamily: INK.font, fontSize: READ.noteSize, lineHeight: READ.noteLine, color: INK.t62, margin: "9px 0 0" }}>{m.desc}</p>}
            </div>
          );
        })}
      </div>
    </OpenSection>
  );
}

/* ─────────────── 7.5 · insight (aha) ─────────────── */

function InsightSection({ insight }: { insight: string }) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 16,
        padding: "24px 22px",
        background: "rgba(255,90,31,.06)",
        border: `1px solid rgba(255,138,76,.28)`,
        animation: "icRise .4s ease both",
      }}
    >
      <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(70% 60% at 0% 0%, rgba(255,90,31,.14), transparent 62%)" }} />
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span aria-hidden style={{ fontSize: 15 }}>💡</span>
          <span style={{ fontFamily: INK.display, fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", color: INK.white }}>
            Why this keeps happening
          </span>
        </div>
        <p style={{ fontFamily: INK.font, fontSize: READ.size, lineHeight: READ.line, letterSpacing: "-0.005em", color: INK.t82, margin: 0, whiteSpace: "pre-line" }}>
          {insight}
        </p>
      </div>
    </div>
  );
}

/* ─────────────── 8 · lock + paywall ─────────────── */

const PAY_TEASERS: { title: string; body: string }[] = [
  {
    title: "The structure that repeats the same wound",
    body: "Trigger → interpretation → action → outcome — how they interlock to repeat the same wound, reconstructed from your answers alone. The full report shows why that action ends up summoning the very outcome you feared most, as a five-step loop drawn on a single page. Repetition isn't a matter of willpower but of structure — you can only find the way out once you can see the structure from the outside.",
  },
  {
    title: "The true identity of your guardian (defense)",
    body: "How you've protected yourself in hard moments, analyzed into three guardian types. The full report lays out when and how this guardian activates — what it protects, and what it quietly takes in return. Until you see the guardian for what it is, the response feels like 'just my personality,' something unchangeable — naming it is what finally puts distance between you and the reaction.",
  },
  {
    title: "The conflicts and problems this child creates",
    body: "What conflicts and problems this child actually creates in your relationships and work, pinned to concrete scenes, grounded in your answers. 'Why do things always break at the same point with me?' — once you see that recurring friction from the outside, you finally see it wasn't your fault, but this child's way of operating.",
  },
  {
    title: "The thoughts this child repeats — and their root",
    body: "The thoughts your inner child keeps circling, traced down to the single belief beneath them — one this child formed very early — and where that belief came from. The thoughts look different each time, but it's really one old belief still speaking to you. Only by seeing its root do you understand why the same thought repeats into adulthood.",
  },
  {
    title: "The moment this child wakes up",
    body: "The moments (triggers) when a normally-hidden inner child wakes up unusually strongly, and why that exact moment is so hard for this child to bear. Knowing the signal in advance lets you catch it a step early — 'ah, that child just woke up' — and steady yourself before the feeling sweeps you off.",
  },
  {
    title: "The signal of a second child",
    body: "Besides your primary child, the signal of another inner child that jumps out first in certain situations. The report shows when the two children trade places, and how one keeps the other hidden. The primary child alone can't explain 'why some days I become a completely different me' — you need the second child to fully understand your reactions.",
  },
  {
    title: "What this child truly wanted",
    body: "What went unmet in the environment this child grew up in, and how that gap feeds today's reactions. The report names what the child really wanted — and concrete ways the present-day you can give it to yourself (a 3-step reparenting plan). It doesn't stop at knowing the cause; it hands you a single sentence you can say to yourself right now — the start of recovery, not just understanding.",
  },
  {
    title: "How to get along with this child",
    body: "The goal isn't to erase this child but to live well alongside it. When this child moves to stir up conflict, you get practical ways to soothe it while protecting the relationship, tailored to your situation. Not just knowing, but 'so, starting tomorrow, what exactly do I do' — usable by the you of today.",
  },
];

function PaywallSection({ onRequest }: { onRequest: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <LockedPreview />

      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 18,
          padding: "28px 22px",
          marginTop: 14,
          background: "linear-gradient(180deg,#181920,#131318)",
          border: `1px solid ${INK.payBorder}`,
          boxShadow: "0 26px 60px -30px rgba(255,90,31,.5)",
        }}
      >
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(74% 60% at 100% 0%, rgba(255,90,31,.22), transparent 60%)" }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: INK.accent, display: "inline-block" }} />
            <span style={{ fontFamily: INK.mono, fontWeight: 600, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: INK.accent2 }}>
              Analyzed with IFS · complete
            </span>
          </div>

          <h3 style={{ fontFamily: INK.display, fontSize: 24, fontWeight: 800, lineHeight: 1.32, letterSpacing: "-0.03em", color: INK.white, margin: "13px 0 12px" }}>
            That was &lsquo;who you are.&rsquo;
            <br />
            Ready to open &lsquo;why&rsquo;?
          </h3>
          <p style={{ fontFamily: INK.font, fontSize: 15, lineHeight: 1.8, color: INK.t62, margin: "0 0 4px" }}>
            The free report covers <b style={{ color: INK.t82, fontWeight: 700 }}>who</b> the child inside you is. <b style={{ color: INK.t82, fontWeight: 700 }}>Why it reacts the way it does</b>,
            <b style={{ color: INK.t82, fontWeight: 700 }}> what conflicts and problems it creates</b>, and
            <b style={{ color: INK.t82, fontWeight: 700 }}> how to get along with it</b> — all of that lives in the full report.
          </p>

          <h4 style={{ fontFamily: INK.font, fontSize: 16.5, fontWeight: 800, letterSpacing: "-0.02em", color: INK.accent2, margin: "22px 0 0", lineHeight: 1.5, wordBreak: "keep-all" }}>
            {PAY_TEASERS.length} things the full report opens up
          </h4>

          <div style={{ margin: "18px 0 4px" }}>
            {PAY_TEASERS.map((t, i) => (
              <div key={i} style={{ paddingTop: i === 0 ? 0 : 18, marginTop: i === 0 ? 0 : 18, borderTop: i === 0 ? "none" : `1px solid ${INK.line}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 20, height: 20, borderRadius: 6, border: `1px solid rgba(255,138,76,.6)`, color: INK.accent2, flex: "0 0 auto" }}>
                    <LockIcon />
                  </span>
                  <span style={{ fontFamily: INK.font, fontSize: 15.5, fontWeight: 700, color: INK.white }}>{t.title}</span>
                </div>
                <p style={{ fontFamily: INK.font, fontSize: 15, lineHeight: 1.78, color: INK.t68, margin: "9px 0 0", paddingLeft: 30 }}>{t.body}</p>
              </div>
            ))}
          </div>

          {/* price */}
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 11, margin: "24px 0 14px" }}>
            <span style={{ fontFamily: INK.display, fontSize: 38, fontWeight: 800, letterSpacing: "-0.035em", fontVariantNumeric: "tabular-nums", background: INK.grad, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              {PRICE_LABEL}
            </span>
          </div>

          <button
            type="button"
            className="ic-cta"
            onClick={onRequest}
            style={{
              width: "100%",
              padding: "16px 18px",
              borderRadius: 13,
              background: INK.grad,
              color: INK.shell,
              border: "none",
              fontFamily: INK.font,
              fontWeight: 800,
              fontSize: 16,
              cursor: "pointer",
              boxShadow: "0 16px 40px -16px rgba(255,90,31,.7)",
            }}
          >
            Request the full report · {PRICE_LABEL} →
          </button>
          <p style={{ fontFamily: INK.mono, fontSize: 10, color: INK.t4, textAlign: "center", marginTop: 13 }}>
            Delivered by email · reopen anytime by link
          </p>
        </div>
      </div>
    </div>
  );
}

/** Locked transition — blurred faux report body + lock overlay. */
function LockedPreview() {
  const fauxLines = [
    "Beneath the thoughts this child keeps circling",
    "sits a single belief formed very early on.",
    "Trigger → interpretation → action → outcome interlock,",
    "repeating the same wound — reconstructed from your answers.",
    "The guardian steps forward to protect you, but in return",
  ];
  return (
    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: `1px solid ${INK.border}`, background: INK.surface }}>
      <div
        aria-hidden
        style={{
          padding: "24px 22px 40px",
          filter: "blur(6px)",
          opacity: 0.5,
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        <div style={{ width: 120, height: 13, borderRadius: 4, background: "rgba(255,138,76,.5)", marginBottom: 16 }} />
        {fauxLines.map((l, i) => (
          <p key={i} style={{ fontFamily: INK.font, fontSize: 15, lineHeight: 1.9, color: INK.t72, margin: 0 }}>{l}</p>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          background: `linear-gradient(180deg, rgba(20,21,25,.35) 0%, rgba(20,21,25,.75) 55%, ${INK.surface} 100%)`,
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 999, background: "rgba(255,90,31,.14)", border: `1px solid rgba(255,138,76,.5)`, color: INK.accent2 }}>
          <LockIcon size={18} />
        </span>
        <span style={{ fontFamily: INK.font, fontSize: 14.5, fontWeight: 800, color: INK.white, letterSpacing: "-0.01em" }}>
          Locked from here on
        </span>
      </div>
    </div>
  );
}

/* ─────────────── sticky CTA ─────────────── */

function StickyCta({ onRequest }: { onRequest: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        display: "flex",
        justifyContent: "center",
        padding: "10px 12px calc(10px + env(safe-area-inset-bottom, 0px))",
        background: "linear-gradient(180deg, rgba(5,5,6,0) 0%, rgba(5,5,6,.85) 40%, #050506 100%)",
        pointerEvents: "none",
      }}
    >
      <button
        type="button"
        className="ic-cta"
        onClick={onRequest}
        style={{
          pointerEvents: "auto",
          width: "100%",
          maxWidth: 440,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "14px 18px",
          borderRadius: 14,
          background: INK.grad,
          color: INK.shell,
          border: "none",
          fontFamily: INK.font,
          cursor: "pointer",
          boxShadow: "0 18px 44px -14px rgba(255,90,31,.7)",
        }}
      >
        <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", lineHeight: 1.25 }}>
          <span style={{ fontWeight: 800, fontSize: 15.5 }}>Request the full report →</span>
          <span style={{ fontSize: 12.5, fontWeight: 800 }}>{PRICE_LABEL}</span>
        </span>
        <span style={{ fontFamily: INK.mono, fontSize: 10.5, fontWeight: 600, opacity: 0.7, whiteSpace: "nowrap" }}>instant</span>
      </button>
    </div>
  );
}

function LockIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x={4} y={11} width={16} height={9} rx={2} />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
