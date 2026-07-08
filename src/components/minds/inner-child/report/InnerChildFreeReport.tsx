"use client";

/**
 * 내면 아이 무료 리포트 — 잉크 오렌지(다크 프리미엄) 카드 덱.
 *
 * 디자인 원천: ~/Downloads/design_handoff_report_ink_orange (Concept B).
 * 레이아웃은 파운더 요청대로 "카드 덱(장 넘김)" 유지, 비주얼만 핸드오프의 잉크+오렌지로.
 * 랜딩·테스트 UI(라이트)는 그대로 두고 결과 리포트만 다크로 전환된다.
 *
 * 데이터: 유형카드 고정필드 + metrics(측정 지표) + 생성필드(gap·relation, free 있을 때).
 * 결제 배선(Step 3): 페이월 CTA → 공용 MindsCheckoutModal(funnel=INNER_CHILD_FUNNEL) 오픈.
 * 카카오 로그인 복귀 시 ?checkout=1 표식으로 모달이 자동 재개된다(/minds 패턴 이식).
 */

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { DISCLAIMER } from "@/lib/minds/inner-child/questions";
import { MINDS_RELATIONSHIP_PRICE, MINDS_RELATIONSHIP_ORIGINAL_PRICE } from "@/lib/minds/relationship-constants";
import { MindsCheckoutModal } from "@/components/minds/MindsCheckoutModal";
import { INNER_CHILD_FUNNEL } from "@/lib/minds/funnel-config";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { trackMindsFunnel } from "@/lib/minds/track";
import type { TypeCard, FreeReportGenerated } from "@/lib/minds/inner-child/report-types";
import type { ScoreResult } from "@/lib/minds/inner-child/types";

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

export function InnerChildFreeReport({
  card,
  score,
  free,
  footerExtra,
}: {
  card: TypeCard;
  score: ScoreResult;
  free: FreeReportGenerated | null;
  footerExtra?: ReactNode;
}) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // 결제 모달 오픈 — InitiateCheckout(퍼널 분리 content_name) + 운영자 슬랙 checkout_click 을 함께 쏜다(/minds 미러).
  const openCheckout = () => {
    trackMetaEvent("InitiateCheckout", {
      content_name: "inner_child_full",
      value: MINDS_RELATIONSHIP_PRICE,
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

  const cards: { key: string; node: ReactNode }[] = [
    // 1장: 유형 판정 + 내면의 목소리 + 측정 지표 (설명과 함께 한 장에)
    { key: "identity", node: <IdentityCard card={card} /> },
    { key: "traits", node: <TraitsCard card={card} n="01" /> },
    { key: "thoughts", node: <ThoughtsCard card={card} n="02" /> },
  ];
  let n = 3;
  const gapN = free?.gap ? pad(n++) : "";
  const relN = free?.relation_pattern ? pad(n++) : "";
  if (free?.gap || free?.relation_pattern) {
    cards.push({
      key: "gap-relation",
      node: <GapRelationCard gapN={gapN} relN={relN} gap={free?.gap ?? null} relation={free?.relation_pattern ?? null} card={card} />,
    });
  }
  cards.push({ key: "stress", node: <StressCard card={card} n={pad(n++)} /> });
  cards.push({ key: "lock", node: <PaywallCard card={card} score={score} /> });

  // 카드 한 장이 모바일 화면을 꽉 채운다(고정 높이). 내용이 길면 카드 안에서 스크롤.
  return (
    <div
      style={{
        height: "100dvh",
        boxSizing: "border-box",
        background: "#050506",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "10px 12px",
        fontFamily: INK.font,
      }}
    >
      <div style={{ width: "100%", maxWidth: 440, flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <CardDeck cards={cards} lastCta={<PaywallCta onCheckout={openCheckout} />} />
        <p style={{ flex: "0 0 auto", fontFamily: INK.mono, fontSize: 10, color: INK.t38, lineHeight: 1.7, textAlign: "center", marginTop: 12 }}>
          기분 리포트 · INNER CHILD REPORT · {DISCLAIMER}
        </p>
        {footerExtra ? <div style={{ flex: "0 0 auto", marginTop: 8 }}>{footerExtra}</div> : null}
      </div>

      {/* 페이월 CTA → 그 자리에서 공용 결제 모달(내면 아이 카피·₩9,900). */}
      <MindsCheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        funnel={INNER_CHILD_FUNNEL}
      />
    </div>
  );
}

function pad(x: number) {
  return String(x).padStart(2, "0");
}

/* ─────────────── 덱 ─────────────── */

function CardDeck({ cards, lastCta }: { cards: { key: string; node: ReactNode }[]; lastCta?: ReactNode }) {
  const [i, setI] = useState(0);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const total = cards.length;
  const go = (d: number) => setI((c) => Math.min(total - 1, Math.max(0, c + d)));

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        background: INK.shell,
        border: `1px solid ${INK.border}`,
        borderRadius: 26,
        boxShadow: "0 40px 100px -40px rgba(255,90,31,.4)",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes icRise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        .ic-scroll::-webkit-scrollbar{width:0;height:0}
        .ic-cta{transition:background .2s ease,color .2s ease,border-color .2s ease}
        .ic-cta:hover{background:#FF5A1F!important;color:#fff!important;border-color:#FF5A1F!important}
      `}</style>

      {/* 상단바 — 브랜드 + 진행 (고정) */}
      <div style={{ flex: "0 0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 18px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <LogoMark />
          <span style={{ fontFamily: INK.display, fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em", color: INK.white }}>
            기분 리포트
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {cards.map((c, idx) => (
              <span
                key={c.key}
                style={{
                  width: idx === i ? 16 : 5,
                  height: 5,
                  borderRadius: 999,
                  background: idx === i ? INK.accent : "rgba(255,255,255,.18)",
                  transition: "width .25s ease, background .25s ease",
                }}
              />
            ))}
          </div>
          <span style={{ fontFamily: INK.mono, fontSize: 10, letterSpacing: "0.1em", color: INK.t4 }}>
            {pad(i + 1)} / {pad(total)}
          </span>
        </div>
      </div>

      {/* 카드 본체 — 고정 높이 안에서 스크롤 + 좌우 스와이프 */}
      <div
        className="ic-scroll"
        onTouchStart={(e) => setStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })}
        onTouchEnd={(e) => {
          if (!start) return;
          const dx = e.changedTouches[0].clientX - start.x;
          const dy = e.changedTouches[0].clientY - start.y;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
          setStart(null);
        }}
        style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "4px 5px 10px" }}
      >
        <div key={cards[i].key} style={{ animation: "icRise .28s ease" }}>
          {cards[i].node}
        </div>
      </div>

      {/* 네비게이션 — 카드 맨 아래 고정 */}
      <div style={{ flex: "0 0 auto", display: "flex", gap: 10, padding: "14px 16px 16px", borderTop: `1px solid ${INK.line}` }}>
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={i === 0}
          style={{
            flex: "0 0 auto",
            padding: "14px 18px",
            borderRadius: 12,
            border: `1px solid ${INK.line14}`,
            background: "transparent",
            color: i === 0 ? "rgba(255,255,255,.25)" : INK.t6,
            fontFamily: INK.font,
            fontWeight: 700,
            fontSize: 15,
            cursor: i === 0 ? "default" : "pointer",
          }}
        >
          ‹ 이전
        </button>
        {i < total - 1 ? (
          <button
            type="button"
            onClick={() => go(1)}
            style={{
              flex: 1,
              padding: "14px 18px",
              borderRadius: 12,
              border: "none",
              background: INK.grad,
              color: INK.shell,
              fontFamily: INK.font,
              fontWeight: 800,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            다음 장 →
          </button>
        ) : lastCta ? (
          <div style={{ flex: 1 }}>{lastCta}</div>
        ) : (
          <div style={{ flex: 1 }} />
        )}
      </div>
    </div>
  );
}

function LogoMark() {
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        width: 16,
        height: 16,
        borderRadius: 999,
        background: "linear-gradient(135deg,#FF5A1F,#FF8A4C,#FFB68A)",
      }}
    >
      <span style={{ position: "absolute", inset: 4, borderRadius: 999, background: INK.shell }} />
    </span>
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

/** #141519 다크 패널. */
function Panel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ background: INK.surface, border: `1px solid ${INK.border}`, borderRadius: 16, padding: 22, position: "relative", overflow: "hidden", ...style }}>
      {children}
    </div>
  );
}

/** 번호 붙은 섹션 타이틀. */
function SecTitle({ n, children }: { n: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
      <span style={{ fontFamily: INK.mono, fontSize: 11, fontWeight: 600, color: INK.accent2 }}>{n}</span>
      <span style={{ fontFamily: INK.display, fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: INK.white }}>{children}</span>
    </div>
  );
}

/* ─────────────── 장별 카드 ─────────────── */

/** 1장 — 유형 판정 + 내면의 목소리 + 측정 지표 (설명과 함께 한 장에). */
function IdentityCard({ card }: { card: TypeCard }) {
  const words = card.child_name.trim().split(" ");
  const last = words.pop() ?? "";
  const head = words.join(" ");
  const metrics = card.metrics ?? [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* 히어로 (그리드 + 글로우) */}
      <div style={{ position: "relative", overflow: "hidden", borderRadius: 18, background: INK.shell, padding: "28px 22px 26px" }}>
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            WebkitMaskImage: "radial-gradient(ellipse at 50% 12%, #000, transparent 72%)",
            maskImage: "radial-gradient(ellipse at 50% 12%, #000, transparent 72%)",
          }}
        />
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 44% at 50% 0%, rgba(255,90,31,.28), transparent 70%)" }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: INK.accent, display: "inline-block" }} />
            <span style={{ fontFamily: INK.mono, fontWeight: 600, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: INK.accent2 }}>
              Your Inner Child
            </span>
          </div>
          <h1 style={{ fontFamily: INK.display, fontSize: 32, fontWeight: 800, lineHeight: 1.16, letterSpacing: "-0.04em", color: INK.white, margin: "14px 0" }}>
            {head}{head ? " " : ""}
            <span style={{ background: INK.grad, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{last}</span>
          </h1>
          <p style={{ fontFamily: INK.font, fontSize: 15.5, lineHeight: 1.6, letterSpacing: "-0.01em", color: INK.t6, margin: 0 }}>{card.one_liner}</p>
          <span style={{ display: "inline-flex", marginTop: 20, padding: "9px 16px", borderRadius: 999, background: "rgba(255,255,255,.06)", border: `1px solid ${INK.line14}`, fontFamily: INK.font, fontSize: 14, fontWeight: 600, color: INK.white }}>
            {card.core_belief}
          </span>
        </div>
      </div>

      {/* 내면의 목소리 */}
      <div style={{ padding: "0 4px" }}>
        <div style={clbStyle}>Inner Voice · 내면의 목소리</div>
        <p style={{ fontFamily: INK.font, fontStyle: "italic", fontWeight: 600, fontSize: 18, lineHeight: 1.5, letterSpacing: "-0.01em", color: INK.white, margin: 0 }}>
          “{card.voice}”
        </p>
        <p style={{ fontFamily: INK.font, fontSize: 14.5, lineHeight: 1.7, color: INK.t62, margin: "10px 0 0" }}>
          이 아이가 마음속에서 반복하는 한마디예요. 평소엔 잘 들리지 않다가, 힘든 순간이 오면 이
          목소리가 마치 내 생각처럼 또렷하게 들립니다.
        </p>
      </div>

      {/* 측정 지표 */}
      <div style={{ padding: "0 4px" }}>
        <div style={clbStyle}>Signal Index · 측정 지표</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {metrics.map((m, i) => {
            const cool = m.tone === "cool";
            return (
              <div key={i}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 7 }}>
                  <span style={{ fontFamily: INK.font, fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,.9)" }}>{m.name}</span>
                  <span style={{ fontFamily: INK.mono, fontWeight: 600, fontSize: 12, fontVariantNumeric: "tabular-nums", color: cool ? "rgba(255,255,255,.55)" : INK.accent2 }}>{m.value}</span>
                </div>
                <div style={{ height: 5, background: "rgba(255,255,255,.09)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${m.value}%`, background: cool ? "rgba(255,255,255,.4)" : INK.grad, borderRadius: 3 }} />
                </div>
                {m.desc && (
                  <p style={{ fontFamily: INK.font, fontSize: 14, lineHeight: 1.6, color: INK.t62, margin: "8px 0 0" }}>{m.desc}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** 기본 성향 — 작동 방식 + 강점 + 일상에서의 발현(관계·일·자기관리). */
function TraitsCard({ card, n }: { card: TypeCard; n: string }) {
  const domains: [string, string][] = [
    ["관계", card.domains["관계"]],
    ["일", card.domains["일"]],
    ["자기관리", card.domains["자기관리"]],
  ];
  return (
    <Panel style={{ padding: "24px 22px" }}>
      <SecTitle n={n}>기본 성향</SecTitle>
      <p style={{ fontFamily: INK.font, fontSize: 15.5, lineHeight: 1.78, letterSpacing: "-0.005em", color: INK.t72, marginTop: 16 }}>
        {card.traits}
      </p>

      <div style={{ marginTop: 20, padding: "15px 16px", background: "rgba(255,255,255,.03)", border: `1px solid ${INK.line}`, borderRadius: 12 }}>
        <div style={clbStyle}>이 유형의 강점</div>
        <p style={{ fontFamily: INK.font, fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,.82)", margin: 0 }}>{card.strength}</p>
        <p style={{ fontFamily: INK.font, fontSize: 14.5, lineHeight: 1.65, color: INK.t62, marginTop: 9 }}>
          없애야 할 약점이 아니라, 상황에 따라 크게 쓰이는 능력입니다. 다만 이 감각이 필요
          이상으로 오래 켜져 있을 때, 강점이 소모가 되곤 합니다.
        </p>
      </div>

      {/* 일상에서의 발현 — 관계 · 일 · 자기관리 */}
      <div style={{ marginTop: 22 }}>
        <div style={clbStyle}>일상에서의 발현</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          {domains.map(([k, v]) => (
            <div key={k}>
              <p style={{ fontFamily: INK.font, fontSize: 15, fontWeight: 700, color: INK.accent2, margin: 0 }}>{k}</p>
              <p style={{ fontFamily: INK.font, fontSize: 15, lineHeight: 1.72, color: INK.t72, margin: "4px 0 0" }}>{v}</p>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

/** 자주 하는 생각 — 대사 + 해석. */
function ThoughtsCard({ card, n }: { card: TypeCard; n: string }) {
  const notes = card.auto_thought_notes ?? [];
  return (
    <Panel style={{ padding: "24px 22px" }}>
      <SecTitle n={n}>자주 하는 생각</SecTitle>
      <div style={{ marginTop: 6 }}>
        {card.auto_thoughts.map((t, i) => (
          <div key={i} style={{ padding: "15px 0", borderTop: i === 0 ? "none" : `1px solid ${INK.line}` }}>
            <p style={{ fontFamily: INK.font, fontStyle: "italic", fontWeight: 600, fontSize: 15, letterSpacing: "-0.01em", color: INK.white, margin: "0 0 6px" }}>
              “{t}”
            </p>
            {notes[i] && <p style={{ fontFamily: INK.font, fontSize: 14.5, lineHeight: 1.65, color: INK.t62, margin: 0 }}>{notes[i]}</p>}
          </div>
        ))}
      </div>

      {/* 이런 생각을 자주 하게 되는 이유 + 믿음의 기원 유추 */}
      <div style={{ marginTop: 18, padding: "16px 18px", background: "rgba(255,255,255,.03)", border: `1px solid ${INK.line}`, borderRadius: 12 }}>
        <div style={clbStyle}>이런 생각을 자주 하게 되는 이유</div>
        <p style={{ fontFamily: INK.font, fontSize: 15, lineHeight: 1.75, color: INK.t72, margin: 0 }}>
          이 생각들은 서로 다른 말 같지만 뿌리는 하나예요 — ‘{card.core_belief}’. 이 믿음이 마음
          깊이 깔려 있으면, 작은 신호도 그 믿음을 확인하는 쪽으로 해석하게 됩니다. 그래서 상황만
          바뀔 뿐, 같은 결의 생각이 계속 떠오르는 거예요.
        </p>
        <p style={{ fontFamily: INK.font, fontSize: 15, lineHeight: 1.75, color: INK.t68, margin: "12px 0 0" }}>
          <span style={{ color: INK.accent2, fontWeight: 700 }}>그 믿음은 어디서 왔을까요.</span> {card.origin_hypothesis}
        </p>
      </div>
    </Panel>
  );
}

/** gap_hint "외부: X / 내부: Y" → [겉, 속] 파싱. */
function parseGapHint(h: string): [string, string] {
  const parts = h.split("/").map((s) => s.trim());
  const strip = (s: string) => s.replace(/^외부\s*[:：]\s*/, "").replace(/^내부\s*[:：]\s*/, "").trim();
  return [strip(parts[0] ?? ""), strip(parts[1] ?? "")];
}

/** 겉과 속 + 관계에서의 패턴 — 한 장에. */
function GapRelationCard({
  gapN,
  relN,
  gap,
  relation,
  card,
}: {
  gapN: string;
  relN: string;
  gap: string | null;
  relation: string | null;
  card: TypeCard;
}) {
  const [outer, inner] = parseGapHint(card.gap_hint);
  const scenes = card.typical_scenes ?? [];
  const notes = card.typical_scene_notes ?? [];
  return (
    <Panel style={{ padding: "24px 22px" }}>
      {/* 겉과 속 */}
      {gap && (
        <div>
          <SecTitle n={gapN}>겉과 속</SecTitle>
          <p style={{ fontFamily: INK.font, fontSize: 15, lineHeight: 1.7, color: INK.t62, marginTop: 14 }}>
            겉으로 보이는 모습과, 속에서 실제로 일어나는 일 사이엔 생각보다 큰 간극이 있어요.
          </p>
          <div style={{ marginTop: 16, padding: "15px 16px", background: "rgba(255,255,255,.03)", border: `1px solid ${INK.line}`, borderRadius: 12 }}>
            <p style={{ fontFamily: INK.font, fontSize: 15, fontWeight: 700, color: INK.accent2, margin: 0 }}>겉 — 남들이 보는 나</p>
            <p style={{ fontFamily: INK.font, fontSize: 15, lineHeight: 1.72, color: INK.t72, margin: "5px 0 0" }}>{outer}</p>
          </div>
          <div style={{ marginTop: 12, padding: "15px 16px", background: "rgba(255,90,31,.06)", border: `1px solid rgba(255,138,76,.25)`, borderRadius: 12 }}>
            <p style={{ fontFamily: INK.font, fontSize: 15, fontWeight: 700, color: INK.accent2, margin: 0 }}>속 — 실제로 일어나는 일</p>
            <p style={{ fontFamily: INK.font, fontSize: 15, lineHeight: 1.72, color: INK.t72, margin: "5px 0 0" }}>{inner}</p>
          </div>
          <p style={{ fontFamily: INK.font, fontSize: 15.5, lineHeight: 1.8, color: INK.t72, marginTop: 18 }}>{gap}</p>
        </div>
      )}

      {/* 관계에서의 패턴 */}
      {relation && (
        <div style={{ marginTop: gap ? 28 : 0, paddingTop: gap ? 24 : 0, borderTop: gap ? `1px solid ${INK.line}` : "none" }}>
          <SecTitle n={relN}>관계에서의 패턴</SecTitle>
          <p style={{ fontFamily: INK.font, fontSize: 15.5, lineHeight: 1.78, color: INK.t72, marginTop: 14 }}>{relation}</p>
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 20 }}>
            {scenes.map((s, i) => (
              <div key={i}>
                <div style={{ display: "flex", gap: 9, alignItems: "baseline" }}>
                  <span style={{ fontFamily: INK.mono, fontSize: 11, fontWeight: 600, color: INK.accent2 }}>{pad(i + 1)}</span>
                  <span style={{ fontFamily: INK.font, fontWeight: 700, fontSize: 15.5, color: INK.white }}>{s}</span>
                </div>
                {notes[i] && <p style={{ fontFamily: INK.font, fontSize: 15, lineHeight: 1.75, color: INK.t68, margin: "7px 0 0", paddingLeft: 20 }}>{notes[i]}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}

/** 스트레스 신호 — 상황 + 왜 힘든지. */
function StressCard({ card, n }: { card: TypeCard; n: string }) {
  const notes = card.trigger_notes ?? [];
  return (
    <Panel style={{ padding: "24px 22px" }}>
      <SecTitle n={n}>스트레스 신호</SecTitle>
      <p style={{ fontFamily: INK.font, fontSize: 15, lineHeight: 1.7, color: INK.t62, marginTop: 14 }}>
        이 아이가 특히 크게 반응하는 순간들, 그리고 왜 그 순간이 유독 힘든지예요.
      </p>
      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 20 }}>
        {card.triggers.map((t, i) => (
          <div key={i}>
            <div style={{ display: "flex", gap: 9, alignItems: "baseline" }}>
              <span style={{ fontFamily: INK.mono, fontSize: 11, fontWeight: 600, color: INK.accent2 }}>{pad(i + 1)}</span>
              <span style={{ fontFamily: INK.font, fontWeight: 700, fontSize: 15.5, color: INK.white }}>{t}</span>
            </div>
            {notes[i] && <p style={{ fontFamily: INK.font, fontSize: 15, lineHeight: 1.75, color: INK.t68, margin: "7px 0 0", paddingLeft: 20 }}>{notes[i]}</p>}
          </div>
        ))}
      </div>
      <p style={{ fontFamily: INK.font, fontSize: 14.5, lineHeight: 1.7, color: INK.t62, marginTop: 20, padding: "13px 15px", background: "rgba(255,255,255,.03)", border: `1px solid ${INK.line}`, borderRadius: 10 }}>
        이런 순간, 이 아이는 ‘{card.surface_reaction}’ 반응으로 먼저 나섭니다. 왜 그런지는 전체
        리포트의 ‘지킴이’ 장에서 이어집니다.
      </p>
    </Panel>
  );
}

/** 지킴이 유형별 짧은 뜻(요약 박스에서 이름 옆에 붙임). */
const GUARDIAN_DESC: Record<string, string> = {
  surrender: "아이의 믿음을 사실로 받아들여, 그 믿음대로 살게 하는 방식이에요.",
  avoidance: "고통이 올라오면 다른 데로 주의를 돌려, 느끼지 않게 하는 방식이에요.",
  overcompensation: "아이의 믿음과 정반대로 행동해, 약점을 덮어버리는 방식이에요.",
};

/** 유료 CTA 항목 — 무엇을 분석했고 / 리포트에서 뭘 보고 / 왜 알아야 하는지. */
const PAY_TEASERS: { title: string; body: string }[] = [
  {
    title: "방어기제(지킴이)의 정체",
    body: "당신이 힘든 순간에 스스로를 어떻게 지켜왔는지, 그 반응 패턴을 세 가지 지킴이 유형으로 분석했어요. 전체 리포트에서는 이 지킴이가 언제·어떻게 작동하는지, 무엇을 지켜주는 대신 무엇을 대가로 가져가는지 낱낱이 풀어드려요. 지킴이의 정체를 알아보기 전까지는 그 반응이 '원래 내 성격'처럼 느껴져 바꿀 수 없다고 여기게 됩니다 — 정체를 알아야 비로소 그 반응과 나 사이에 거리가 생깁니다.",
  },
  {
    title: "같은 상처가 반복되는 구조",
    body: "촉발 → 해석 → 행동 → 결과가 어떻게 맞물려 같은 상처를 되풀이하는지, 당신의 응답만으로 그 고리를 재구성했어요. 리포트에서는 왜 그 행동이 결국 가장 두려워하던 결과를 불러오는지, 다섯 단계 반복 구조를 한 장의 그림으로 보여드려요. 반복은 의지의 문제가 아니라 구조의 문제예요 — 구조를 바깥에서 볼 수 있어야, 그 안에서 빠져나올 지점이 보입니다.",
  },
  {
    title: "두 번째 아이의 신호",
    body: `대표 아이 외에, 특정 상황에서 먼저 튀어나오는 또 다른 내면 아이의 신호를 잡아냈어요. 리포트에서는 두 아이가 어떤 상황에서 교대하는지, 한 아이가 다른 아이를 어떻게 가리고 있는지 짚어드려요. 대표 아이만 봐서는 '왜 어떤 날은 전혀 다른 내가 되는지' 설명되지 않아요 — 두 번째 아이까지 봐야 당신의 반응이 온전히 이해됩니다.`,
  },
  {
    title: "이 아이가 정말 원했던 것",
    body: "이 아이가 자란 환경에서 채워지지 못한 것, 그리고 그 결핍이 지금의 반응으로 어떻게 이어지는지 분석했어요. 리포트에서는 아이가 진짜로 원했던 것의 정체와, 그것을 지금의 당신이 스스로에게 줄 수 있는 구체적인 방법(재양육 3단계)까지 담겨요. 원인을 아는 데서 끝나지 않고, 지금 당장 자신에게 건넬 수 있는 한 문장까지 — 이해를 넘어 회복의 출발점을 드립니다.",
  },
];

/** 페이월 CTA — 덱 하단 네비에 스티키로 고정(스크롤 무관 항상 노출). 결제 모달을 연다. */
function PaywallCta({ onCheckout }: { onCheckout: () => void }) {
  return (
    <button
      type="button"
      className="ic-cta"
      onClick={onCheckout}
      style={{
        width: "100%",
        padding: "14px 18px",
        borderRadius: 12,
        background: INK.white,
        color: INK.shell,
        border: `1px solid ${INK.white}`,
        fontFamily: INK.font,
        fontWeight: 800,
        fontSize: 15,
        cursor: "pointer",
      }}
    >
      전체 리포트 받기 →
    </button>
  );
}

/** 마지막 장 — IFS 분석 리빌 + 유료 리포트 안내(프리미엄). */
function PaywallCard({ card, score }: { card: TypeCard; score: ScoreResult }) {
  // 덱은 현재 카드만 렌더하므로, 이 카드가 마운트되는 순간 = 유저가 페이월까지 도달한 순간.
  // 세션당 1회만 발화(trackMindsFunnel 내부 dedupe) → 앞뒤로 넘겨도 슬랙엔 한 번만 뜬다.
  useEffect(() => {
    trackMindsFunnel("reached_paywall", INNER_CHILD_FUNNEL);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 18,
        padding: "28px 22px",
        background: "linear-gradient(180deg,#181920,#131318)",
        border: `1px solid ${INK.payBorder}`,
        boxShadow: "0 26px 60px -30px rgba(255,90,31,.5)",
      }}
    >
      <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(74% 60% at 100% 0%, rgba(255,90,31,.22), transparent 60%)" }} />
      <div style={{ position: "relative" }}>
        {/* 리빌 */}
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 5, height: 5, borderRadius: 999, background: INK.accent, display: "inline-block" }} />
          <span style={{ fontFamily: INK.mono, fontWeight: 600, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: INK.accent2 }}>
            Analyzed with IFS · 분석 완료
          </span>
        </div>

        <h3 style={{ fontFamily: INK.display, fontSize: 23, fontWeight: 800, lineHeight: 1.3, letterSpacing: "-0.03em", color: INK.white, margin: "13px 0 12px" }}>
          당신의 대답을 모두
          <br />
          IFS로 분석했어요
        </h3>

        {/* 무료 리포트 2줄 요약 — 이름만으론 기억 안 나니 뜻까지 */}
        <div style={{ marginTop: 14, padding: "16px 18px", background: "rgba(0,0,0,.32)", border: `1px solid ${INK.line}`, borderRadius: 12 }}>
          <p style={{ fontFamily: INK.font, fontSize: 12, color: INK.t4, margin: "0 0 12px", textAlign: "center", lineHeight: 1.6 }}>
            당신의 모든 응답을 IFS(내면가족체계) 관점으로 읽었어요
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <p style={{ fontFamily: INK.font, fontSize: 15.5, fontWeight: 700, color: INK.white, margin: 0 }}>
                <span style={{ color: INK.accent2 }}>대표 아이</span> · {score.primary_child.child_name}
              </p>
              <p style={{ fontFamily: INK.font, fontSize: 14.5, lineHeight: 1.6, color: INK.t62, margin: "4px 0 0" }}>{card.one_liner}</p>
            </div>
            <div>
              <p style={{ fontFamily: INK.font, fontSize: 15.5, fontWeight: 700, color: INK.white, margin: 0 }}>
                <span style={{ color: INK.accent2 }}>지킴이</span> · {score.guardian.label}
              </p>
              <p style={{ fontFamily: INK.font, fontSize: 14.5, lineHeight: 1.6, color: INK.t62, margin: "4px 0 0" }}>
                {GUARDIAN_DESC[score.guardian.type] ?? ""}
              </p>
            </div>
          </div>
        </div>

        {/* 소제목 — 포인트 컬러 강조 (두 줄) */}
        <h4 style={{ fontFamily: INK.font, fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", color: INK.accent2, margin: "22px 0 0", lineHeight: 1.5, wordBreak: "keep-all" }}>
          지금부터, 이 아이가 생겨난 이유와
          <br />
          이 아이와 잘 살아가는 법을 알려드릴게요.
        </h4>

        {/* 항목별 긴 설명 */}
        <div style={{ margin: "22px 0" }}>
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
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 11, marginBottom: 16 }}>
          <span style={{ fontFamily: INK.display, fontSize: 15, color: INK.t4, textDecoration: "line-through" }}>{won(MINDS_RELATIONSHIP_ORIGINAL_PRICE)}</span>
          <span style={{ fontFamily: INK.display, fontSize: 36, fontWeight: 800, letterSpacing: "-0.035em", fontVariantNumeric: "tabular-nums", background: INK.grad, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
            {won(MINDS_RELATIONSHIP_PRICE)}
          </span>
        </div>

        {/* CTA 는 덱 하단 네비에 스티키로 고정(PaywallCta) — 스크롤과 무관하게 항상 노출. */}
        <p style={{ fontFamily: INK.mono, fontSize: 10, color: INK.t4, textAlign: "center", marginTop: 13 }}>
          3초 발급 · 링크로 언제든 다시 열람
        </p>
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x={4} y={11} width={16} height={9} rx={2} />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
