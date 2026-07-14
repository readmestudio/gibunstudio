"use client";

/**
 * 내면 아이 — 결제 전환 랜딩(판매 페이지). 잉크 오렌지(다크 프리미엄) 스크롤.
 *
 * ★ 이 화면은 '무료 리포트'가 아니다. 설문을 마친 사람에게 **분석이 끝났다는 사실만** 알리고
 *   바로 결제로 보내는 **마케팅 랜딩**이다(파운더 지시 2026-07-14). 리포트 내용은 유형
 *   이름까지 포함해 전부 유료 뒤에 있다.
 *
 * 왜 이렇게까지 갔나 — 개편 이력:
 *   1차: 무료가 8섹션(유형 해설·목소리·장면·일상 발현·통찰)을 다 보여준 뒤 결제를 물었다.
 *        → 전환이 나지 않았다. 다 보여주고 파는 구조였다.
 *   2차: 무료를 '유형 진단 + 훅'까지로 좁혔다(히어로·portrait·Signal Index·페이월).
 *   3차(현재): 유형 이름과 측정 지표마저 유료로. 무료 화면 = 순수 판매 페이지.
 *
 * 소구 구조(위→아래) — "당신이 겪는 이 문제, 우리가 풉니다" 앵글:
 *   1 분석 완료 — ✓ 배지 + 잠긴 캐릭터 실루엣("이 아이는 리포트에서 만나요")
 *   2 portrait  — 유일한 개인화. 이 사람 응답을 읽고 쓴 글이라는 **증거**이자 훅 (LLM/폴백)
 *   3 통증      — "당신의 응답에서 이게 반복되고 있어요"(typical_scenes) + "특히 이런
 *                순간에"(triggers). 문제를 이름 붙여 부르되 **답은 주지 않는다**.
 *   4 해결      — "그래서 리포트가 풀어드려요"(PAY_TEASERS)
 *   5 추천      — "이런 분께 추천해요"
 *   6 가격 + CTA
 *
 * ⚠️ 유형 이름(child_name)·해설(traits/voice)·측정 지표(metrics)를 이 화면에 절대 노출하지
 *    말 것. 전부 유료 리포트(InnerChildPaidView)의 소구 대상이다. typical_scenes 는 **제목만**
 *    쓰고 해설(typical_scene_notes)은 유료에 남긴다 — 통증은 짚되 답은 안 준다.
 *
 * 결제 배선: 가격/스티키 CTA → 공용 MindsCheckoutModal(funnel=INNER_CHILD_FUNNEL).
 * 카카오 로그인 복귀 시 ?checkout=1 표식으로 결제 모달이 자동 재개된다(/minds 패턴 이식).
 */

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { DISCLAIMER } from "@/lib/minds/inner-child/questions";
import { reportPricing } from "@/lib/minds/price-experiment";
import { MindsCheckoutModal } from "@/components/minds/MindsCheckoutModal";
import { INNER_CHILD_FUNNEL } from "@/lib/minds/funnel-config";
import { innerChildIllustration } from "@/lib/minds/inner-child/type-cards";
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
 * portrait 정적 폴백 — 생성 훅이 없을 때(LLM 실패·구버전 블롭·인라인 프리뷰) 유형카드로
 * 조립한다. 유저 응답을 되풀이하지 않는 게 원칙(고정 리포트 인상 방지)이라 SCT 를 인용하지
 * 않는다. 서버 buildFallbackFreeReport 과 같은 문장.
 *
 * ⚠️ one_liner·child_name·traits 절대 금지 — 전부 유형을 특정하거나 유료 소구 대상이다
 * (one_liner 예: "늘 문 쪽을 바라보는 아이" = 유형명 그 자체). core_belief 만 쓴다:
 * 통증의 뿌리라 훅으로 강하면서도 유형을 특정하지 않는다.
 */
function staticPortrait(card: TypeCard): string {
  return `남들에겐 사소해 보이는 순간에, 유독 당신만 먼저 반응하게 되는 때가 있죠. 마음 깊은 곳에 '${card.core_belief}'는 믿음이 자리 잡고 있어서, 이 아이는 그 순간을 그냥 지나치지 못하거든요.\n\n그건 예민해서가 아니라, 그렇게 먼저 알아차리는 일이 오래 당신을 지켜줬기 때문이에요. 다만 왜 하필 그 순간에 이 아이가 깨어나는지는, 아직 설명되지 않은 채 남아 있어요.`;
}

export function InnerChildSalesPage({
  card,
  free,
  footerExtra,
  leadId,
}: {
  card: TypeCard;
  /** 생성 훅. portrait 만 읽는다. 없으면 정적 폴백. */
  free?: FreeReportGenerated | null;
  footerExtra?: ReactNode;
  /** 결제·픽셀에 쓰는 leadId(무료 테스트 리드). 표시가는 단일가(₩9,900). */
  leadId?: string;
}) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  // 유료 리포트 단일가(₩9,900) — 표시·픽셀 전용이며 실제 결제 금액은 서버가 재확정한다(단일 출처).
  const pricing = reportPricing(leadId);
  const portrait = free?.portrait?.trim() || staticPortrait(card);

  // 이제 이 화면 자체가 페이월이다(무료 본문이 없다). 그래서 스크롤 도달이 아니라 진입 시점에
  // 발화한다 — 지표 의미가 "무료를 다 읽고 잠금에 닿음" → "분석 완료 후 판매 페이지 도달"로
  // 바뀐 것이며, 개편 전후 수치를 직접 비교하면 안 된다.
  useEffect(() => {
    trackMindsFunnel("reached_paywall", INNER_CHILD_FUNNEL);
  }, []);

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
        {/* 1 · 분석 완료 (유형은 잠금) */}
        <DoneHero card={card} />

        {/* 2 · 개인화 훅 — "내 답을 읽고 썼다"는 유일한 증거 */}
        <PortraitHook portrait={portrait} />

        {/* 3 · 통증 — 문제를 이름 붙여 부른다. 답은 주지 않는다. */}
        <PainSection card={card} />

        {/* 4 · 해결 — 그래서 리포트가 이걸 풀어준다 */}
        <BenefitSection />

        {/* 5 · 추천 대상 */}
        <RecommendSection />

        {/* 6 · 가격 + CTA */}
        <PriceCta price={pricing.price} originalPrice={pricing.originalPrice} onCheckout={openCheckout} />

        <p style={{ fontFamily: INK.mono, fontSize: 10, color: INK.t38, lineHeight: 1.7, textAlign: "center", marginTop: 4 }}>
          기분 리포트 · INNER CHILD REPORT · {DISCLAIMER}
        </p>
        {footerExtra ? <div style={{ marginTop: 4 }}>{footerExtra}</div> : null}
      </div>

      {/* 스티키 CTA — 스크롤 내내 항상 노출. 결제 모달을 연다. */}
      <StickyCta onCheckout={openCheckout} price={pricing.price} originalPrice={pricing.originalPrice} />

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

function SecTitle({ children }: { children: ReactNode }) {
  return (
    <h2 style={{ fontFamily: INK.display, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.35, color: INK.white, margin: 0 }}>
      {children}
    </h2>
  );
}

/** 흐르는 섹션 — 박스 대신 헤어라인 구분선 + 넉넉한 여백. */
function OpenSection({ children }: { children: ReactNode }) {
  return (
    <section style={{ padding: "26px 4px 0", borderTop: `1px solid rgba(255,255,255,.07)`, animation: "icRise .4s ease both" }}>
      {children}
    </section>
  );
}

const READ = { size: 17, line: 1.9, noteSize: 16, noteLine: 1.85 };

/* ─────────────── 1 · 분석 완료 ─────────────── */

/** 잠긴 캐릭터 — 실루엣만 보이게 블러 + 자물쇠. 유형 공개는 결제 뒤. */
function LockedAvatar({ schemaId, size = 116 }: { schemaId: string; size?: number }) {
  const src = innerChildIllustration(schemaId);
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "0 0 auto" }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 999,
          overflow: "hidden",
          background: "#FBF7EE",
          border: "1px solid rgba(255,255,255,.16)",
          boxShadow: "0 10px 26px -10px rgba(255,90,31,.55)",
        }}
      >
        {src ? (
          // 강한 블러 + 낮은 대비 — 뭔가 있다는 건 보이되 무엇인지는 알 수 없게.
          <img
            src={src}
            alt=""
            aria-hidden
            draggable={false}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: "scale(1.3)",
              display: "block",
              filter: "blur(13px) saturate(.7)",
              userSelect: "none",
            }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#2a2a2e" }} />
        )}
      </div>
      {/* 자물쇠 배지 */}
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(20,21,25,.72)",
        }}
      >
        <LockIcon size={30} />
      </span>
    </div>
  );
}

function DoneHero({ card }: { card: TypeCard }) {
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
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        {/* 완료 배지 */}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 999, background: "rgba(255,90,31,.12)", border: `1px solid rgba(255,138,76,.45)` }}>
          <CheckIcon />
          <span style={{ fontFamily: INK.mono, fontWeight: 600, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: INK.accent2 }}>
            Analysis Complete · 분석 완료
          </span>
        </span>

        <h1 style={{ fontFamily: INK.display, fontSize: 29, fontWeight: 800, lineHeight: 1.28, letterSpacing: "-0.035em", color: INK.white, margin: "20px 0 0" }}>
          16가지 내면 아이 중
          <br />
          <span style={{ background: INK.grad, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>당신의 아이가 확정됐어요</span>
        </h1>
        <p style={{ fontFamily: INK.font, fontSize: 15.5, lineHeight: 1.7, letterSpacing: "-0.01em", color: INK.t6, margin: "13px 0 0", maxWidth: 340 }}>
          당신이 쓴 문장들을 하나씩 읽고, 그 안에서 반복되는 결을 찾아냈어요.
        </p>

        <div style={{ marginTop: 26 }}>
          <LockedAvatar schemaId={card.schema_id} />
        </div>
        <p style={{ fontFamily: INK.font, fontSize: 14.5, fontWeight: 700, color: INK.white, margin: "16px 0 0" }}>
          이 아이가 누구인지는 리포트에서 만나요
        </p>
        <p style={{ fontFamily: INK.font, fontSize: 13.5, lineHeight: 1.7, color: INK.t4, margin: "7px 0 0" }}>
          이름 · 얼굴 · 성향 · 반복 구조 전부
        </p>
      </div>
    </div>
  );
}

/* ─────────────── 2 · 개인화 훅 ─────────────── */

function PortraitHook({ portrait }: { portrait: string }) {
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

/* ─────────────── 3 · 통증 ─────────────── */

/**
 * 문제를 이름 붙여 부르는 섹션. typical_scenes 는 **제목만** 쓴다 — 해설
 * (typical_scene_notes)과 그 장면이 왜 벌어지는지는 유료 리포트 몫이다.
 */
function PainSection({ card }: { card: TypeCard }) {
  const scenes = card.typical_scenes ?? [];
  const triggers = card.triggers ?? [];
  return (
    <OpenSection>
      <SecTitle>당신의 응답에서 이게 반복되고 있어요</SecTitle>
      <p style={{ fontFamily: INK.font, fontSize: 16, lineHeight: 1.75, color: INK.t62, marginTop: 14 }}>
        상황은 매번 달라 보여도, 그 밑에서 움직이는 건 늘 같은 아이예요.
      </p>

      {scenes.length > 0 && (
        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 14 }}>
          {scenes.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "16px 18px", background: "rgba(255,255,255,.035)", border: `1px solid ${INK.line}`, borderRadius: 14 }}>
              <span aria-hidden style={{ fontFamily: INK.mono, fontSize: 12, fontWeight: 600, color: INK.accent2, lineHeight: 1.6, flex: "0 0 auto" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span style={{ fontFamily: INK.font, fontWeight: 600, fontSize: 16.5, lineHeight: 1.65, color: INK.t82 }}>{s}</span>
            </div>
          ))}
        </div>
      )}

      {triggers.length > 0 && (
        <>
          <div style={{ ...clbStyle, marginTop: 28 }}>특히 이런 순간에</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {triggers.map((t, i) => (
              <span
                key={i}
                style={{
                  fontFamily: INK.font,
                  fontSize: 14,
                  fontWeight: 600,
                  color: INK.white,
                  padding: "9px 14px",
                  borderRadius: 999,
                  background: "rgba(255,90,31,.1)",
                  border: `1px solid rgba(255,138,76,.3)`,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </>
      )}

      <p style={{ fontFamily: INK.font, fontSize: READ.noteSize, lineHeight: READ.noteLine, color: INK.t68, marginTop: 22 }}>
        여기까지는 <b style={{ color: INK.t82, fontWeight: 700 }}>무슨 일이 벌어지는지</b>예요. 정작 답답한 건 그다음이죠 —
        <b style={{ color: INK.t82, fontWeight: 700 }}> 왜 하필 그 순간이고, 어떻게 여기서 벗어나는지.</b> 그게 리포트에 있어요.
      </p>
    </OpenSection>
  );
}

/* ─────────────── 4 · 해결 ─────────────── */

/** 유료 리포트에 실제로 담기는 것들. 유료 본문 순서와 맞춘다. */
const PAY_TEASERS: { title: string; body: string }[] = [
  {
    title: "당신의 아이가 누구인지",
    body: "16가지 중 당신의 아이가 무엇인지, 이름과 얼굴부터 공개해요. 그 아이가 어떤 성향으로 살아왔는지, 어떤 강점이 과하게 발달했는지, 마음속에서 반복하는 한마디가 무엇인지까지. 유형을 아는 것만으로 지금까지 이해되지 않던 내 반응들이 하나로 꿰어집니다.",
  },
  {
    title: "왜 자꾸 이럴까",
    body: "평소엔 조용하던 이 아이가 유독 크게 깨어나는 순간이 언제인지, 그리고 겉으로 보이는 반응 밑에 사실은 무엇이 있었는지를 당신의 응답만으로 짚어드려요. ‘아, 내가 이래서 그랬구나’ — 자책하던 자리를 이해로 바꾸는, 리포트에서 가장 많이 멈춰 서게 되는 대목이에요.",
  },
  {
    title: "당신의 응답이 어떻게 측정됐는지",
    body: "당신의 감각 중 무엇이 유독 세게, 무엇이 낮게 켜져 있는지를 수치로 보여드려요. 중요한 건 우열이 아니라 트레이드오프예요 — 한쪽이 높으면 다른 쪽은 그 대가로 낮아집니다. 낮게 나온 자리가 사실은 결함이 아니라 대가였다는 걸 알게 되면, 스스로를 탓하던 시선이 바뀝니다.",
  },
  {
    title: "같은 상처가 반복되는 구조",
    body: "촉발 → 해석 → 행동 → 결과가 어떻게 맞물려 같은 상처를 되풀이하는지, 당신의 응답만으로 그 고리를 재구성했어요. 왜 그 행동이 결국 가장 두려워하던 결과를 불러오는지, 다섯 단계 반복 구조를 한 장의 그림으로 보여드려요. 반복은 의지의 문제가 아니라 구조의 문제예요 — 구조를 바깥에서 볼 수 있어야, 그 안에서 빠져나올 지점이 보입니다.",
  },
  {
    title: "방어기제(지킴이)의 정체",
    body: "당신이 힘든 순간에 스스로를 어떻게 지켜왔는지, 그 반응 패턴을 세 가지 지킴이 유형으로 분석했어요. 이 지킴이가 언제·어떻게 작동하는지, 무엇을 지켜주는 대신 무엇을 대가로 가져가는지 낱낱이 풀어드려요. 정체를 알아보기 전까지는 그 반응이 '원래 내 성격'처럼 느껴져 바꿀 수 없다고 여기게 됩니다.",
  },
  {
    title: "이 아이가 만들어내는 갈등과 문제",
    body: "이 아이가 관계와 일에서 실제로 어떤 갈등·문제를 만들어내는지, 당신의 응답을 근거로 구체적인 장면까지 짚어드려요. ‘왜 나는 늘 비슷한 지점에서 관계가 틀어질까’ — 그 반복되는 마찰의 정체를 밖에서 보게 되면, 비로소 그게 내 탓이 아니라 이 아이의 작동 방식이었음이 보입니다.",
  },
  {
    title: "이 아이가 반복하는 생각과 그 뿌리",
    body: "당신 안의 내면 아이가 자꾸 되뇌는 생각들을 뽑아, 그 밑에 깔린 하나의 믿음 — 이 아이가 아주 어릴 때 갖게 된 믿음 — 과 그 믿음이 어디서 생겨났는지까지 이어드려요. 그 뿌리를 봐야, 왜 같은 생각이 어른이 된 지금까지 반복되는지 비로소 이해됩니다.",
  },
  {
    title: "두 번째 아이의 신호",
    body: "대표 아이 외에, 특정 상황에서 먼저 튀어나오는 또 다른 내면 아이의 신호를 잡아냈어요. 두 아이가 어떤 상황에서 교대하는지, 한 아이가 다른 아이를 어떻게 가리고 있는지 짚어드려요. 대표 아이만 봐서는 '왜 어떤 날은 전혀 다른 내가 되는지' 설명되지 않아요.",
  },
  {
    title: "이 아이가 정말 원했던 것",
    body: "이 아이가 자란 환경에서 채워지지 못한 것, 그리고 그 결핍이 지금의 반응으로 어떻게 이어지는지 분석했어요. 아이가 진짜로 원했던 것의 정체와, 그것을 지금의 당신이 스스로에게 줄 수 있는 구체적인 방법(재양육 3단계)까지 담겨요. 이해를 넘어 회복의 출발점을 드립니다.",
  },
  {
    title: "이 아이와 잘 지내는 법",
    body: "이 아이를 없애는 게 아니라 함께 잘 지내는 게 목표예요. 이 아이가 갈등을 일으키려 할 때 관계를 지키면서 다독이는 실용적인 방법을, 당신의 상황에 맞춰 알려드려요. 정체를 아는 데서 끝나지 않고 ‘그래서 내일부터 뭘 어떻게’까지 — 오늘의 당신이 바로 쓸 수 있게.",
  },
];

function BenefitSection() {
  return (
    <OpenSection>
      <SecTitle>그래서 리포트가 풀어드려요</SecTitle>
      <p style={{ fontFamily: INK.font, fontSize: 16, lineHeight: 1.75, color: INK.t62, marginTop: 14 }}>
        당신이 쓴 답을 근거로, 오직 당신 한 사람을 위해 쓰입니다. {PAY_TEASERS.length}가지가 열려요.
      </p>
      <div style={{ margin: "22px 0 4px" }}>
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
    </OpenSection>
  );
}

/* ─────────────── 5 · 추천 대상 ─────────────── */

const RECOMMEND: string[] = [
  "같은 지점에서 관계가 자꾸 틀어지는데, 이유를 모르겠는 분",
  "내가 왜 이러는지 스스로도 설명이 안 되는 분",
  "머리로는 아는데 그 순간이 오면 늘 똑같이 반응하게 되는 분",
  "성격 탓이라고 넘겨왔지만, 사실은 바꾸고 싶은 분",
  "상담까지는 부담스럽지만, 나를 제대로 한번 들여다보고 싶은 분",
];

function RecommendSection() {
  return (
    <OpenSection>
      <SecTitle>이런 분께 추천해요</SecTitle>
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 13 }}>
        {RECOMMEND.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
            <span style={{ flex: "0 0 auto", marginTop: 3, color: INK.accent2 }}>
              <CheckIcon size={13} />
            </span>
            <span style={{ fontFamily: INK.font, fontSize: 16, lineHeight: 1.7, color: INK.t82 }}>{r}</span>
          </div>
        ))}
      </div>
      <p style={{ fontFamily: INK.font, fontSize: 14, lineHeight: 1.7, color: INK.t4, marginTop: 20 }}>
        내면 아이 리포트는 의료 행위가 아니며 진단을 대신하지 않아요. 나를 이해하는 지도로 써주세요.
      </p>
    </OpenSection>
  );
}

/* ─────────────── 6 · 가격 + CTA ─────────────── */

function PriceCta({ price, originalPrice, onCheckout }: { price: number; originalPrice: number; onCheckout: () => void }) {
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
        animation: "icRise .4s ease both",
      }}
    >
      <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(74% 60% at 100% 0%, rgba(255,90,31,.22), transparent 60%)" }} />
      <div style={{ position: "relative" }}>
        <h3 style={{ fontFamily: INK.display, fontSize: 23, fontWeight: 800, lineHeight: 1.34, letterSpacing: "-0.03em", color: INK.white, margin: "0 0 12px", textAlign: "center" }}>
          당신의 아이는 이미
          <br />
          당신을 기다리고 있어요
        </h3>
        <p style={{ fontFamily: INK.font, fontSize: 15, lineHeight: 1.8, color: INK.t62, margin: "0 0 4px", textAlign: "center" }}>
          분석은 끝났어요. 이제 열어보기만 하면 됩니다.
        </p>

        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 11, margin: "24px 0 14px" }}>
          <span style={{ fontFamily: INK.display, fontSize: 15, color: INK.t4, textDecoration: "line-through" }}>{won(originalPrice)}</span>
          <span style={{ fontFamily: INK.display, fontSize: 38, fontWeight: 800, letterSpacing: "-0.035em", fontVariantNumeric: "tabular-nums", background: INK.grad, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
            {won(price)}
          </span>
        </div>

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
          내 리포트 확인하기 →
        </button>
        <p style={{ fontFamily: INK.mono, fontSize: 10, color: INK.t4, textAlign: "center", marginTop: 13 }}>
          3초 발급 · 링크로 언제든 다시 열람
        </p>
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
          <span style={{ fontWeight: 800, fontSize: 15.5 }}>내 리포트 확인하기 →</span>
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

/* ─────────────── 아이콘 ─────────────── */

function LockIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x={4} y={11} width={16} height={9} rx={2} />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function CheckIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden style={{ color: "currentColor" }}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
