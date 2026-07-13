"use client";

/**
 * 내면 아이 무료 리포트 — 잉크 오렌지(다크 프리미엄) *스크롤* 리포트.
 *
 * 디자인 원천: ~/Downloads/design_handoff_report_ink_orange (Concept B).
 * 레이아웃: 파운더 요청으로 "카드 덱(장 넘김)" → "한 페이지 스크롤"로 전환.
 * 사람들은 16유형 중 자기 유형을 알고 싶어 하므로, 무료는 "당신은 누구인가(WHO)"를
 * 몰입감 있게 읽히도록 재구성했다. 아래로 내려가면 콘텐츠가 잠기고 유료 CTA 가 나온다.
 *
 * 읽는 순서(위→아래):
 *   1 히어로 — "16가지 내면 아이 중, 당신은 ○○입니다"
 *   2 개인화 도입부(portrait) — 내가 쓴 SCT 문장을 인용해 "이거 내 얘기" 몰입 (LLM/폴백)
 *   3 이 유형은 어떤 아이인가 — 기본 성향 + 강점
 *   4 내면의 목소리
 *   5 이런 순간, 있지 않나요 — 닮은 장면(typical_scenes)
 *   6 일상에서의 발현 — 관계·일·자기관리
 *   7 측정 지표(Signal Index) — 응답을 이렇게 읽었어요(근거)
 *   8 잠금 + 페이월 — 왜·어떻게는 전체 리포트에서 (유료 CTA)
 *
 * 데이터: 유형카드 고정필드 + free(생성 portrait·insight·daily_prediction, 있을 때).
 * 결제 배선: 페이월/스티키 CTA → 공용 MindsCheckoutModal(funnel=INNER_CHILD_FUNNEL).
 * 카카오 로그인 복귀 시 ?checkout=1 표식으로 결제 모달이 자동 재개된다(/minds 패턴 이식).
 */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { DISCLAIMER } from "@/lib/minds/inner-child/questions";
import { reportPricing } from "@/lib/minds/price-experiment";
import { MindsCheckoutModal } from "@/components/minds/MindsCheckoutModal";
import { INNER_CHILD_FUNNEL } from "@/lib/minds/funnel-config";
import { TypeAvatar } from "@/components/minds/inner-child/report/TypeAvatar";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { trackMindsFunnel } from "@/lib/minds/track";
import type { FreeReportGenerated, TypeCard } from "@/lib/minds/inner-child/report-types";

/* ─── 잉크 오렌지 토큰 ─── */
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

const won = (n: number) => `₩${n.toLocaleString("ko-KR")}`;

/**
 * portrait 정적 폴백 — 생성 도입부가 없을 때(구버전 블롭·인라인 프리뷰 등) 유형카드로
 * 도입부를 조립한다. 유저 응답을 되풀이하지 않는 게 원칙(고정 리포트 인상 방지)이라
 * SCT 를 인용하지 않는다. 서버 buildFallbackFreeReport 과 같은 결.
 */
function staticPortrait(card: TypeCard): string {
  return `${card.one_liner}. ${card.traits}\n\n마음 깊은 곳에는 '${card.core_belief}'는 믿음이 자리 잡고 있어요. 그래서 남들에겐 사소해 보이는 순간에도, 당신은 먼저 반응하게 됩니다. 이 아이가 어떤 아이인지, 지금부터 하나씩 만나볼게요.`;
}

/** insight 정적 폴백 — 페이월 직전 통찰. 유형카드 필드만으로, 응답 인용 없이 조립. */
function staticInsight(card: TypeCard): string {
  return `평소엔 조용하던 이 아이는 특정한 순간에 유독 크게 깨어나요. 그때 당신은 ‘${card.surface_reaction}’ 모습으로 먼저 나서곤 합니다. 겉으로는 ${card.key_emotion}처럼 보여도, 그 밑에는 스스로를 지키려는 오래된 마음이 있어요. 그건 나약함이 아니라, 예전엔 실제로 당신을 지켜주던 방식이었습니다. 그런데 ‘왜’ 하필 그 순간이고, 여기서 어떻게 벗어날 수 있는지는 아직 남아 있어요.`;
}

/** daily_prediction 정적 폴백 — 일상 예측. 유형카드 domains 를 예측형으로, 응답 인용 없이. */
function staticDaily(card: TypeCard): string {
  return `아마 이런 순간, 꽤 있지 않나요. 관계에서는 ${card.domains["관계"]} 일에서는 ${card.domains["일"]} 그리고 혼자 있을 때조차 ${card.domains["자기관리"]} 매번 상황은 달라 보여도, 그 밑에서 움직이는 건 같은 아이예요.`;
}

export function InnerChildFreeReport({
  card,
  free,
  footerExtra,
  leadId,
}: {
  card: TypeCard;
  /** 무료 생성필드. portrait·insight·daily_prediction 을 여기서 읽는다. 없으면 정적 폴백. */
  free?: FreeReportGenerated | null;
  footerExtra?: ReactNode;
  /** 결제·픽셀에 쓰는 leadId(무료 테스트 리드). 표시가는 단일가(₩9,900). */
  leadId?: string;
}) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  // 유료 리포트 단일가(₩9,900) — 표시·픽셀 전용이며 실제 결제 금액은 서버가 재확정한다(단일 출처).
  const pricing = reportPricing(leadId);
  const portrait = free?.portrait?.trim() || staticPortrait(card);
  const insight = free?.insight?.trim() || staticInsight(card);
  const dailyPrediction = free?.daily_prediction?.trim() || staticDaily(card);

  // 결제 모달 오픈 — InitiateCheckout(퍼널 분리 content_name) + 운영자 슬랙 checkout_click.
  const openCheckout = () => {
    trackMetaEvent("InitiateCheckout", {
      content_name: "inner_child_full",
      value: pricing.price,
      currency: "KRW",
    });
    trackMindsFunnel("checkout_click", INNER_CHILD_FUNNEL);
    setCheckoutOpen(true);
  };

  // 카카오 로그인 복귀 자동 재개 — 인증 관문에서 카카오로 로그인하면 /auth/callback 이
  // /inner-child/r/[leadId]?checkout=1 로 되돌려보낸다. 그 표식을 보면 결제 모달을 자동으로
  // 다시 연다(이제 로그인 상태). 표식은 URL 에서 즉시 지운다(재트리거 방지).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "1") return;
    const url = window.location.pathname + window.location.hash;
    window.history.replaceState(null, "", url);
    const id = window.setTimeout(() => setCheckoutOpen(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#050506",
        fontFamily: INK.font,
        // 하단 스티키 CTA 바(고정)에 가리지 않도록 여백 확보.
        paddingBottom: "calc(96px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <style>{`
        @keyframes icRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .ic-cta{transition:transform .12s ease,box-shadow .2s ease}
        .ic-cta:active{transform:scale(.99)}
      `}</style>

      <div style={{ maxWidth: 440, margin: "0 auto", padding: "14px 14px 0", display: "flex", flexDirection: "column", gap: 22 }}>
        {/* 1 · 히어로 */}
        <Hero card={card} />

        {/* 2 · 개인화 도입부 */}
        <PortraitSection portrait={portrait} />

        {/* 3 · 이 유형은 어떤 아이인가 */}
        <TypeExplainSection card={card} n="01" />

        {/* 4 · 내면의 목소리 */}
        <VoiceSection card={card} />

        {/* 5 · 이런 순간, 있지 않나요 */}
        <ScenesSection card={card} n="02" />

        {/* 6 · 일상에서의 발현 (+ 예측) */}
        <DomainsSection card={card} n="03" prediction={dailyPrediction} />

        {/* 7 · 측정 지표 */}
        <MetricsSection card={card} />

        {/* 7.5 · 개인화 통찰 (아하 모먼트) — 페이월 직전 */}
        <InsightSection insight={insight} />

        {/* 8 · 잠금 + 페이월 */}
        <PaywallSection
          price={pricing.price}
          originalPrice={pricing.originalPrice}
          onCheckout={openCheckout}
        />

        <p style={{ fontFamily: INK.mono, fontSize: 10, color: INK.t38, lineHeight: 1.7, textAlign: "center", marginTop: 4 }}>
          기분 리포트 · INNER CHILD REPORT · {DISCLAIMER}
        </p>
        {footerExtra ? <div style={{ marginTop: 4 }}>{footerExtra}</div> : null}
      </div>

      {/* 스티키 CTA — 스크롤 내내 항상 노출. 결제 모달을 연다. */}
      <StickyCta onCheckout={openCheckout} price={pricing.price} originalPrice={pricing.originalPrice} />

      {/* 페이월/스티키 CTA → 그 자리에서 공용 결제 모달(내면 아이 카피). 표시가는 단일가(₩9,900). */}
      <MindsCheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        funnel={INNER_CHILD_FUNNEL}
        priceOverride={{ price: pricing.price, originalPrice: pricing.originalPrice }}
      />
    </div>
  );
}

/* ─────────────── 공통 조각 ─────────────── */

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

/** 흐르는 본문 섹션 — 박스(테두리) 대신 헤어라인 구분선 + 넉넉한 여백으로 '쭉 읽히게'. */
function OpenSection({ children }: { children: ReactNode }) {
  return (
    <section style={{ padding: "26px 4px 0", borderTop: `1px solid rgba(255,255,255,.07)`, animation: "icRise .4s ease both" }}>
      {children}
    </section>
  );
}

/* 본문 읽기용 공통 사이즈 — 쭉쭉 읽히도록 키운 값. */
const READ = { size: 17, line: 1.9, noteSize: 16, noteLine: 1.85 };

/* ─────────────── 1 · 히어로 ─────────────── */

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
            16가지 내면 아이 중, 당신은
          </span>
        </div>

        {/* 캐릭터 프로필(가운데) + 유형명 */}
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

/* ─────────────── 2 · 개인화 도입부 ─────────────── */

function PortraitSection({ portrait }: { portrait: string }) {
  return (
    <div style={{ padding: "2px 4px 0", animation: "icRise .4s ease both" }}>
      <div style={clbStyle}>Your Story · 당신의 이야기</div>
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

/* ─────────────── 3 · 이 유형은 어떤 아이인가 ─────────────── */

function TypeExplainSection({ card, n }: { card: TypeCard; n: string }) {
  return (
    <OpenSection>
      <SecTitle n={n}>이 유형은 어떤 아이인가</SecTitle>
      <p style={{ fontFamily: INK.font, fontSize: READ.size, lineHeight: READ.line, letterSpacing: "-0.005em", color: INK.t82, marginTop: 16 }}>
        {card.traits}
      </p>
      <div style={{ marginTop: 20, padding: "17px 18px", background: "rgba(255,90,31,.06)", border: `1px solid rgba(255,138,76,.22)`, borderRadius: 14 }}>
        <div style={clbStyle}>이 유형의 강점</div>
        <p style={{ fontFamily: INK.font, fontSize: 16.5, lineHeight: 1.8, color: "rgba(255,255,255,.9)", margin: 0 }}>{card.strength}</p>
        <p style={{ fontFamily: INK.font, fontSize: READ.noteSize, lineHeight: READ.noteLine, color: INK.t62, marginTop: 10 }}>
          없애야 할 약점이 아니라, 상황에 따라 크게 쓰이는 능력이에요. 다만 이 감각이 필요
          이상으로 오래 켜져 있을 때, 강점이 나를 소모시키곤 합니다.
        </p>
      </div>
    </OpenSection>
  );
}

/* ─────────────── 4 · 내면의 목소리 ─────────────── */

function VoiceSection({ card }: { card: TypeCard }) {
  return (
    <OpenSection>
      <div style={clbStyle}>Inner Voice · 내면의 목소리</div>
      <p style={{ fontFamily: INK.font, fontStyle: "italic", fontWeight: 600, fontSize: 22, lineHeight: 1.5, letterSpacing: "-0.01em", color: INK.white, margin: 0 }}>
        “{card.voice}”
      </p>
      <p style={{ fontFamily: INK.font, fontSize: READ.noteSize, lineHeight: READ.noteLine, color: INK.t62, margin: "14px 0 0" }}>
        이 아이가 마음속에서 반복하는 한마디예요. 평소엔 잘 들리지 않다가, 힘든 순간이 오면 이
        목소리가 마치 내 생각처럼 또렷하게 들립니다.
      </p>
    </OpenSection>
  );
}

/* ─────────────── 5 · 이런 순간, 있지 않나요 ─────────────── */

function ScenesSection({ card, n }: { card: TypeCard; n: string }) {
  const scenes = card.typical_scenes ?? [];
  const notes = card.typical_scene_notes ?? [];
  if (scenes.length === 0) return null;
  return (
    <OpenSection>
      <SecTitle n={n}>이런 순간, 있지 않나요?</SecTitle>
      <p style={{ fontFamily: INK.font, fontSize: 16, lineHeight: 1.75, color: INK.t62, marginTop: 14 }}>
        이 아이가 사는 사람에게서 자주 되풀이되는 장면이에요. 하나쯤, 낯설지 않을 거예요.
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

/* ─────────────── 6 · 일상에서의 발현 ─────────────── */

function DomainsSection({ card, n, prediction }: { card: TypeCard; n: string; prediction: string }) {
  const domains: [string, string][] = [
    ["관계", card.domains["관계"]],
    ["일", card.domains["일"]],
    ["자기관리", card.domains["자기관리"]],
  ];
  return (
    <OpenSection>
      <SecTitle n={n}>일상에서의 발현</SecTitle>
      <p style={{ fontFamily: INK.font, fontSize: 16, lineHeight: 1.75, color: INK.t62, marginTop: 14 }}>
        같은 아이라도 상황마다 다른 얼굴로 나와요. 세 영역에서 이렇게 드러납니다.
      </p>
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 18 }}>
        {domains.map(([k, v]) => (
          <div key={k}>
            <p style={{ fontFamily: INK.font, fontSize: 16, fontWeight: 700, color: INK.accent2, margin: 0 }}>{k}</p>
            <p style={{ fontFamily: INK.font, fontSize: READ.size, lineHeight: 1.78, color: INK.t82, margin: "5px 0 0" }}>{v}</p>
          </div>
        ))}
      </div>

      {/* 예측형 개인화 — "오 이거 내 얘기" 를 노린 구체 장면 예측(응답+유형 근거). */}
      <div style={{ marginTop: 22, padding: "18px 18px", background: "rgba(255,255,255,.035)", border: `1px solid ${INK.line}`, borderRadius: 14 }}>
        <div style={{ ...clbStyle, marginBottom: 10 }}>아마 당신은 —</div>
        <p style={{ fontFamily: INK.font, fontSize: READ.size, lineHeight: READ.line, letterSpacing: "-0.005em", color: INK.t82, margin: 0, whiteSpace: "pre-line" }}>
          {prediction}
        </p>
      </div>
    </OpenSection>
  );
}

/* ─────────────── 7 · 측정 지표 ─────────────── */

function MetricsSection({ card }: { card: TypeCard }) {
  const metrics = card.metrics ?? [];
  if (metrics.length === 0) return null;
  return (
    <OpenSection>
      <div style={clbStyle}>Signal Index · 측정 지표</div>
      <p style={{ fontFamily: INK.font, fontSize: 16, lineHeight: 1.75, color: INK.t62, margin: "0 0 20px" }}>
        당신의 응답을 이렇게 읽었어요. 이 유형에서 유독 세게, 혹은 약하게 켜져 있는 감각들이에요.
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

/* ─────────────── 7.5 · 개인화 통찰(아하 모먼트) ─────────────── */

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
            왜 자꾸 이럴까
          </span>
        </div>
        <p style={{ fontFamily: INK.font, fontSize: READ.size, lineHeight: READ.line, letterSpacing: "-0.005em", color: INK.t82, margin: 0, whiteSpace: "pre-line" }}>
          {insight}
        </p>
      </div>
    </div>
  );
}

/* ─────────────── 8 · 잠금 + 페이월 ─────────────── */

/** 유료 CTA 항목 — 전체(유료) 리포트에 실제로 담기는 섹션들의 예고. 유료 본문 순서와 맞춘다. */
const PAY_TEASERS: { title: string; body: string }[] = [
  {
    title: "같은 상처가 반복되는 구조",
    body: "촉발 → 해석 → 행동 → 결과가 어떻게 맞물려 같은 상처를 되풀이하는지, 당신의 응답만으로 그 고리를 재구성했어요. 리포트에서는 왜 그 행동이 결국 가장 두려워하던 결과를 불러오는지, 다섯 단계 반복 구조를 한 장의 그림으로 보여드려요. 반복은 의지의 문제가 아니라 구조의 문제예요 — 구조를 바깥에서 볼 수 있어야, 그 안에서 빠져나올 지점이 보입니다.",
  },
  {
    title: "방어기제(지킴이)의 정체",
    body: "당신이 힘든 순간에 스스로를 어떻게 지켜왔는지, 그 반응 패턴을 세 가지 지킴이 유형으로 분석했어요. 전체 리포트에서는 이 지킴이가 언제·어떻게 작동하는지, 무엇을 지켜주는 대신 무엇을 대가로 가져가는지 낱낱이 풀어드려요. 지킴이의 정체를 알아보기 전까지는 그 반응이 '원래 내 성격'처럼 느껴져 바꿀 수 없다고 여기게 됩니다 — 정체를 알아야 비로소 그 반응과 나 사이에 거리가 생깁니다.",
  },
  {
    title: "이 아이가 만들어내는 갈등과 문제",
    body: "이 아이가 관계와 일에서 실제로 어떤 갈등·문제를 만들어내는지, 당신의 응답을 근거로 구체적인 장면까지 짚어드려요. ‘왜 나는 늘 비슷한 지점에서 관계가 틀어질까’ — 그 반복되는 마찰의 정체를 밖에서 보게 되면, 비로소 그게 내 탓이 아니라 이 아이의 작동 방식이었음이 보입니다.",
  },
  {
    title: "이 아이가 반복하는 생각과 그 뿌리",
    body: "당신 안의 내면 아이가 자꾸 되뇌는 생각들을 뽑아, 그 밑에 깔린 하나의 믿음 — 이 아이가 아주 어릴 때 갖게 된 믿음 — 과 그 믿음이 어디서 생겨났는지까지 이어드려요. 생각은 매번 달라 보여도, 실은 이 아이가 오래전부터 품어 온 하나의 믿음이 지금도 당신에게 말을 거는 거예요. 그 뿌리를 봐야, 왜 같은 생각이 어른이 된 지금까지 반복되는지 비로소 이해됩니다.",
  },
  {
    title: "이 아이가 깨어나는 순간",
    body: "평소엔 조용히 숨어 있던 내면 아이가 유독 크게 깨어나는 순간(트리거)과, 왜 하필 그 순간이 이 아이에게 견디기 힘든지를 분석했어요. 그 신호를 미리 알아두면, 감정에 휩쓸리기 전에 ‘아, 지금 그 아이가 깨어났구나’ 하고 한 발 먼저 알아차려 스스로를 다독일 수 있게 됩니다.",
  },
  {
    title: "두 번째 아이의 신호",
    body: "대표 아이 외에, 특정 상황에서 먼저 튀어나오는 또 다른 내면 아이의 신호를 잡아냈어요. 리포트에서는 두 아이가 어떤 상황에서 교대하는지, 한 아이가 다른 아이를 어떻게 가리고 있는지 짚어드려요. 대표 아이만 봐서는 '왜 어떤 날은 전혀 다른 내가 되는지' 설명되지 않아요 — 두 번째 아이까지 봐야 당신의 반응이 온전히 이해됩니다.",
  },
  {
    title: "이 아이가 정말 원했던 것",
    body: "이 아이가 자란 환경에서 채워지지 못한 것, 그리고 그 결핍이 지금의 반응으로 어떻게 이어지는지 분석했어요. 리포트에서는 아이가 진짜로 원했던 것의 정체와, 그것을 지금의 당신이 스스로에게 줄 수 있는 구체적인 방법(재양육 3단계)까지 담겨요. 원인을 아는 데서 끝나지 않고, 지금 당장 자신에게 건넬 수 있는 한 문장까지 — 이해를 넘어 회복의 출발점을 드립니다.",
  },
  {
    title: "이 아이와 잘 지내는 법",
    body: "이 아이를 없애는 게 아니라 함께 잘 지내는 게 목표예요. 이 아이가 갈등을 일으키려 할 때 관계를 지키면서 다독이는 실용적인 방법을, 당신의 상황에 맞춰 알려드려요. 정체를 아는 데서 끝나지 않고 ‘그래서 내일부터 뭘 어떻게’까지 — 오늘의 당신이 바로 쓸 수 있게.",
  },
];

function PaywallSection({
  price,
  originalPrice,
  onCheckout,
}: {
  price: number;
  originalPrice: number;
  onCheckout: () => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  // 페이월이 화면에 들어오는 순간 = 유저가 무료 콘텐츠를 다 읽고 잠금에 도달한 순간.
  // 세션당 1회만 발화(trackMindsFunnel 내부 dedupe). 스크롤 레이아웃이라 mount 가 아니라
  // IntersectionObserver 로 "실제로 보였을 때"를 잡는다.
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      trackMindsFunnel("reached_paywall", INNER_CHILD_FUNNEL);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          trackMindsFunnel("reached_paywall", INNER_CHILD_FUNNEL);
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* 잠금 전환 — 블러 처리된 가짜 리포트 미리보기 + 자물쇠. "여기부터 잠김"을 체감시킨다. */}
      <LockedPreview />

      {/* 페이월 본체 */}
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
              Analyzed with IFS · 분석 완료
            </span>
          </div>

          <h3 style={{ fontFamily: INK.display, fontSize: 24, fontWeight: 800, lineHeight: 1.32, letterSpacing: "-0.03em", color: INK.white, margin: "13px 0 12px" }}>
            여기까지가 ‘당신은 누구인가’였어요.
            <br />
            이제 ‘왜 그런가’를 열어볼까요?
          </h3>
          <p style={{ fontFamily: INK.font, fontSize: 15, lineHeight: 1.8, color: INK.t62, margin: "0 0 4px" }}>
            무료 리포트는 당신 안의 아이가 <b style={{ color: INK.t82, fontWeight: 700 }}>누구인지</b>까지예요. 그 아이가
            <b style={{ color: INK.t82, fontWeight: 700 }}> 왜 그렇게 반응하는지</b>, 이 아이가
            <b style={{ color: INK.t82, fontWeight: 700 }}> 어떤 갈등과 문제를 만들어내는지</b>, 그리고
            <b style={{ color: INK.t82, fontWeight: 700 }}> 이 아이와 어떻게 잘 지내는지</b>는 전체 리포트에 담겨 있어요.
          </p>

          <h4 style={{ fontFamily: INK.font, fontSize: 16.5, fontWeight: 800, letterSpacing: "-0.02em", color: INK.accent2, margin: "22px 0 0", lineHeight: 1.5, wordBreak: "keep-all" }}>
            전체 리포트에서 열리는 {PAY_TEASERS.length}가지
          </h4>

          {/* 항목별 긴 설명 */}
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

          {/* 가격 */}
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 11, margin: "24px 0 14px" }}>
            <span style={{ fontFamily: INK.display, fontSize: 15, color: INK.t4, textDecoration: "line-through" }}>{won(originalPrice)}</span>
            <span style={{ fontFamily: INK.display, fontSize: 38, fontWeight: 800, letterSpacing: "-0.035em", fontVariantNumeric: "tabular-nums", background: INK.grad, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
              {won(price)}
            </span>
          </div>

          {/* 인라인 CTA — 감정의 정점(가격 직후)에서 한 번 더. */}
          <button
            type="button"
            className="ic-cta"
            onClick={onCheckout}
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
            전체 리포트 잠금 해제하기 →
          </button>
          <p style={{ fontFamily: INK.mono, fontSize: 10, color: INK.t4, textAlign: "center", marginTop: 13 }}>
            3초 발급 · 링크로 언제든 다시 열람
          </p>
        </div>
      </div>
    </div>
  );
}

/** 잠금 전환 — 블러 처리된 가짜 리포트 본문 + 자물쇠 오버레이. */
function LockedPreview() {
  const fauxLines = [
    "이 아이가 자꾸 되뇌는 생각의 뿌리에는",
    "아주 어릴 때 갖게 된 하나의 믿음이 있어요.",
    "촉발 → 해석 → 행동 → 결과가 맞물려 같은 상처가",
    "반복되는 구조를 당신의 응답만으로 재구성했어요.",
    "지킴이는 당신을 지키려 앞장서지만, 그 대신",
  ];
  return (
    <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: `1px solid ${INK.border}`, background: INK.surface }}>
      {/* 블러된 가짜 본문 — 잠겨 있어 읽을 수 없는 '전체 리포트'를 암시. */}
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
      {/* 오버레이 — 하단 페이드 + 자물쇠 배지 */}
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
          여기서부터는 잠겨 있어요
        </span>
      </div>
    </div>
  );
}

/* ─────────────── 스티키 CTA ─────────────── */

function StickyCta({ onCheckout, price, originalPrice }: { onCheckout: () => void; price: number; originalPrice: number }) {
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
        onClick={onCheckout}
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
          <span style={{ fontWeight: 800, fontSize: 15.5 }}>전체 리포트 잠금 해제 →</span>
          <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span style={{ fontSize: 11.5, opacity: 0.55, textDecoration: "line-through" }}>{won(originalPrice)}</span>
            <span style={{ fontSize: 13, fontWeight: 800 }}>{won(price)}</span>
          </span>
        </span>
        <span style={{ fontFamily: INK.mono, fontSize: 10.5, fontWeight: 600, opacity: 0.7, whiteSpace: "nowrap" }}>3초 발급</span>
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
