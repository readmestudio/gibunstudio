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
import { INNER_CHILD_PRICE, INNER_CHILD_ORIGINAL_PRICE } from "@/lib/minds/relationship-constants";
import { MindsCheckoutModal } from "@/components/minds/MindsCheckoutModal";
import { INNER_CHILD_FUNNEL } from "@/lib/minds/funnel-config";
import { TypeAvatar } from "@/components/minds/inner-child/report/TypeAvatar";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { trackMindsFunnel } from "@/lib/minds/track";
import type { TypeCard } from "@/lib/minds/inner-child/report-types";
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
  footerExtra,
}: {
  card: TypeCard;
  score: ScoreResult;
  footerExtra?: ReactNode;
}) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // 결제 모달 오픈 — InitiateCheckout(퍼널 분리 content_name) + 운영자 슬랙 checkout_click 을 함께 쏜다(/minds 미러).
  const openCheckout = () => {
    trackMetaEvent("InitiateCheckout", {
      content_name: "inner_child_full",
      value: INNER_CHILD_PRICE,
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

  // 무료 덱은 "판정 + 맛보기 1장"으로 좁혔다 — 유형 판정(정체)과 기본 성향(맛보기)만
  // 무료로 두고, 자주 하는 생각·겉과 속/관계 패턴·스트레스 신호 등 해설 카드는 전체
  // 리포트(유료)로 옮겼다(InnerChildPaidView). 페이월(PaywallCard)이 그 목록을 예고한다.
  const cards: { key: string; node: ReactNode }[] = [
    // 1장: 유형 판정 + 내면의 목소리 + 측정 지표 (설명과 함께 한 장에)
    { key: "identity", node: <IdentityCard card={card} /> },
    // 2장: 기본 성향 — 무료로 남기는 유일한 해설 "맛보기"
    { key: "traits", node: <TraitsCard card={card} n="01" /> },
    { key: "lock", node: <PaywallCard card={card} score={score} /> },
  ];

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

      {/* 페이월 CTA → 그 자리에서 공용 결제 모달(내면 아이 카피·₩19,900). */}
      <MindsCheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        funnel={INNER_CHILD_FUNNEL}
      />
    </div>
  );
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
        .ic-cta:hover .ic-cta-accent{color:#fff!important}
      `}</style>

      {/* 카드 본체 — 고정 높이 안에서 스크롤 + 좌우 스와이프
          (상단 브랜드/진행 바는 요청에 따라 제거 — 히어로의 프로필·타이틀이 그 역할을 대신한다) */}
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

      {/* 네비게이션 — 카드 맨 아래 고정. 결제 전환이 핵심이라 '이전'은 아이콘만 남겨
          최소 폭으로 좁히고, 다음/CTA 버튼이 남은 폭(flex:1)을 지배하게 한다. */}
      <div style={{ flex: "0 0 auto", display: "flex", gap: 8, padding: "14px 16px 16px", borderTop: `1px solid ${INK.line}` }}>
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={i === 0}
          aria-label="이전"
          style={{
            flex: "0 0 auto",
            padding: "14px 12px",
            borderRadius: 12,
            border: `1px solid ${INK.line14}`,
            background: "transparent",
            color: i === 0 ? "rgba(255,255,255,.25)" : INK.t6,
            fontFamily: INK.font,
            fontWeight: 700,
            fontSize: 17,
            lineHeight: 1,
            cursor: i === 0 ? "default" : "pointer",
          }}
        >
          ‹
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
          {/* 킥커 + 제목(좌) · 캐릭터 프로필(우) — 가로 배치로 히어로 높이를 줄인다. */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ width: 5, height: 5, borderRadius: 999, background: INK.accent, display: "inline-block" }} />
                <span style={{ fontFamily: INK.mono, fontWeight: 600, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: INK.accent2 }}>
                  Your Inner Child
                </span>
              </div>
              <h1 style={{ fontFamily: INK.display, fontSize: 30, fontWeight: 800, lineHeight: 1.16, letterSpacing: "-0.04em", color: INK.white, margin: "12px 0 0" }}>
                {head}{head ? " " : ""}
                <span style={{ background: INK.grad, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{last}</span>
              </h1>
            </div>
            <TypeAvatar schemaId={card.schema_id} alt={card.child_name} size={84} />
          </div>
          <p style={{ fontFamily: INK.font, fontSize: 15.5, lineHeight: 1.6, letterSpacing: "-0.01em", color: INK.t6, margin: "14px 0 0" }}>{card.one_liner}</p>
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

/**
 * 자주 하는 생각 / 겉과 속·관계 패턴 / 스트레스 신호 카드는 전체(유료) 리포트로
 * 옮겨졌다 — InnerChildPaidView 의 ThoughtsCard·GapRelationCard·StressCard 참조.
 * (무료에서 삭제한 게 아니라, 공개 위치를 결제 뒤로 이동시킨 것.)
 */

/** 지킴이 유형별 짧은 뜻(요약 박스에서 이름 옆에 붙임). */
const GUARDIAN_DESC: Record<string, string> = {
  surrender: "아이의 믿음을 사실로 받아들여, 그 믿음대로 살게 하는 방식이에요.",
  avoidance: "고통이 올라오면 다른 데로 주의를 돌려, 느끼지 않게 하는 방식이에요.",
  overcompensation: "아이의 믿음과 정반대로 행동해, 약점을 덮어버리는 방식이에요.",
};

/** 유료 CTA 항목 — 무엇을 분석했고 / 리포트에서 뭘 보고 / 왜 알아야 하는지.
 *  앞 3개는 무료에서 '맛보기'로 소개한 결을 전체 리포트에서 훨씬 깊게 이어받는 항목,
 *  뒤 4개는 유료에서만 열리는 심층 분석이다. */
const PAY_TEASERS: { title: string; body: string }[] = [
  {
    title: "이 아이가 반복하는 생각과 그 뿌리",
    body: "당신 안의 내면 아이가 자꾸 되뇌는 생각들을 뽑아, 그 밑에 깔린 하나의 믿음 — 이 아이가 아주 어릴 때 갖게 된 믿음 — 과 그 믿음이 어디서 생겨났는지까지 이어드려요. 생각은 매번 달라 보여도, 실은 이 아이가 오래전부터 품어 온 하나의 믿음이 지금도 당신에게 말을 거는 거예요. 그 뿌리를 봐야, 왜 같은 생각이 어른이 된 지금까지 반복되는지 비로소 이해됩니다.",
  },
  {
    title: "겉의 어른, 속의 아이 — 그 간극",
    body: "남들에게 보이는 어른스러운 겉모습과, 그 안에서 여전히 웅크리고 있는 내면 아이 사이엔 생각보다 큰 간극이 있어요. 이 간극이 가까운 관계에서 어떤 장면으로 되풀이되는지 — 언제 이 아이가 튀어나와 관계를 흔드는지 — 구체적으로 그려드려요. 겉만 봐서는 ‘왜 늘 이런 관계가 반복되지’의 답이 안 보여요. 속에 있는 이 아이를 봐야 비로소 보입니다.",
  },
  {
    title: "이 아이가 깨어나는 순간",
    body: "평소엔 조용히 숨어 있던 내면 아이가 유독 크게 깨어나는 순간(트리거)과, 왜 하필 그 순간이 이 아이에게 견디기 힘든지를 분석했어요. 그 신호를 미리 알아두면, 감정에 휩쓸리기 전에 ‘아, 지금 그 아이가 깨어났구나’ 하고 한 발 먼저 알아차려 스스로를 다독일 수 있게 됩니다.",
  },
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
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        padding: "11px 18px",
        borderRadius: 12,
        background: INK.white,
        color: INK.shell,
        border: `1px solid ${INK.white}`,
        fontFamily: INK.font,
        cursor: "pointer",
      }}
    >
      <span style={{ fontWeight: 800, fontSize: 15 }}>
        지금 바로 <span className="ic-cta-accent" style={{ color: INK.accent }}>내면 아이</span> 분석 보기 →
      </span>
      {/* CTA 바로 아래 가격 노출 — 정가(취소선) → 판매가. 색은 버튼색을 상속해 호버 반전에도 보인다. */}
      <span style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontSize: 12, opacity: 0.5, textDecoration: "line-through" }}>{won(INNER_CHILD_ORIGINAL_PRICE)}</span>
        <span style={{ fontSize: 13.5, fontWeight: 800 }}>{won(INNER_CHILD_PRICE)}</span>
      </span>
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
          당신의 추방당한 내면 아이를
          <br />
          7가지 축으로 분석했어요
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
          내면 아이를 만나고 이해해야만
          <br />
          반복되는 패턴에서 벗어날 수 있습니다
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
          <span style={{ fontFamily: INK.display, fontSize: 15, color: INK.t4, textDecoration: "line-through" }}>{won(INNER_CHILD_ORIGINAL_PRICE)}</span>
          <span style={{ fontFamily: INK.display, fontSize: 36, fontWeight: 800, letterSpacing: "-0.035em", fontVariantNumeric: "tabular-nums", background: INK.grad, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
            {won(INNER_CHILD_PRICE)}
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
