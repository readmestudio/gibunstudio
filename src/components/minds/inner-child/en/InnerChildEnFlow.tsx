"use client";

/**
 * English "Find your inner child" (/inner-child/en) state machine.
 *
 *   landing → test → analyzing → report
 *
 * 한국어 InnerChildFlow 의 영어·비로그인판. 큰 차이:
 *  - 로그인 관문 없음(카카오 게이트 제거). 랜딩 CTA → 익명 리드 생성 + 픽셀 → 바로 테스트.
 *  - 분석 엔드포인트 /api/inner-child/en/free-report, 저장키 inner_child_en_lead_id,
 *    결과 경로 /inner-child/en/r/[id].
 *  - 리드 attribution 에 landing_path:"/inner-child/en" 를 강제로 실어, 어드민에서 영어
 *    리드를 KR inner_child 와 구분할 수 있게 한다(조직 유입도 태깅).
 *
 * 결제가 없으므로 결제 실패 복귀(?error)·로그인 복귀(?started) 분기도 없다.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAttribution } from "@/lib/attribution";
import { trackMetaEvent, trackMetaCustom } from "@/lib/meta-pixel";
import { InnerChildEnTest, CrisisScreen } from "./InnerChildEnTest";
import { InnerChildEnFreeReport } from "./report/InnerChildEnFreeReport";
import { computeScore, type ScoreInput } from "@/lib/minds/inner-child/scoring";
import { getEnTypeCard } from "@/lib/minds/inner-child/en/type-cards";
import { detectCrisisEn } from "@/lib/minds/inner-child/en/crisis-words";
import { trackEnFunnel } from "@/lib/minds/inner-child/en/track";
import { SCREENING_ITEMS, SCALE_LABELS, SCALE_MAX, TIME_FRAME_NOTICE } from "@/lib/minds/inner-child/en/questions";
import type { ScaleValue } from "@/lib/minds/inner-child/types";

type Phase = "landing" | "test" | "analyzing" | "report";

const KEY = "inner_child_en_lead_id";
const FREE_BASE = "/inner-child/en/r";

const INK = {
  backdrop: "#050506",
  shell: "#0A0A0B",
  surface: "#141519",
  border: "#26272c",
  accent: "#FF5A1F",
  accent2: "#FF8A4C",
  grad: "linear-gradient(135deg,#FF5A1F 0%,#FF8A4C 50%,#FFB68A 100%)",
  white: "#fff",
  t82: "rgba(255,255,255,.82)",
  t62: "rgba(255,255,255,.62)",
  t5: "rgba(255,255,255,.5)",
  t4: "rgba(255,255,255,.4)",
  line: "rgba(255,255,255,.09)",
  font: "'Pretendard',-apple-system,BlinkMacSystemFont,system-ui,sans-serif",
  display: "'Inter','Pretendard',-apple-system,system-ui,sans-serif",
  mono: "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace",
};

export function InnerChildEnFlow() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [fallbackInput, setFallbackInput] = useState<ScoreInput | null>(null);
  // 랜딩 Q1 에서 받아온 답 — 테스트 컴포넌트가 이 문항을 건너뛰고 시작하는 데 쓴다.
  const [seedScreening, setSeedScreening] = useState<Record<string, ScaleValue> | undefined>(undefined);
  const router = useRouter();

  // 재방문 자동 복원 — 이전에 분석을 마친 브라우저면 저장된 결과 페이지로 보낸다.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(KEY);
    if (saved) router.replace(`${FREE_BASE}/${saved}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 익명 리드 생성(fire-and-forget). channel:"inner_child" + landing_path 강제 태깅.
  const createAnonLead = async () => {
    try {
      const res = await fetch("/api/minds/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "inner_child",
          // 어드민에서 영어 리드를 구분할 수 있게 landing_path 를 강제로 실어 보낸다.
          attribution: { ...getAttribution(), landing_path: "/inner-child/en" },
        }),
      });
      const json = await res.json().catch(() => null);
      if (json?.id) setLeadId(json.id);
    } catch {
      // 네트워크 실패 — 결과 보기는 계속 진행(leadId 없으면 인라인 폴백).
    }
  };

  // 테스트 시작 — 전환 픽셀 + 운영자 슬랙(⓪) + 익명 리드 확보 + 테스트 진입(로그인 없음).
  // seed: 랜딩 Q1 미리보기에서 이미 받은 답. 있으면 그 문항은 건너뛴 채 다음 문항부터 시작한다.
  const beginTest = (seed?: { id: string; value: ScaleValue }) => {
    trackMetaCustom("StartTest", { content_name: "inner_child_en" });
    trackMetaEvent("Lead", { content_name: "inner_child_en" });
    // 이 시점엔 아직 리드 생성 전이라 익명으로 뜬다(KR 과 동일).
    trackEnFunnel("test_start");
    void createAnonLead();
    if (seed) setSeedScreening({ [seed.id]: seed.value });
    setPhase("test");
  };

  // 테스트 완료 → 서버 무료 리포트 생성 → 저장본 페이지로 이동.
  const runAnalysis = async (input: ScoreInput) => {
    setPhase("analyzing");
    try {
      const res = await fetch("/api/inner-child/en/free-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, leadId }),
      });
      const json = await res.json().catch(() => null);
      if (json?.ok && leadId) {
        localStorage.setItem(KEY, leadId);
        trackMetaEvent("ViewContent", { content_name: "inner_child_en_report" });
        router.replace(`${FREE_BASE}/${leadId}`);
        return;
      }
    } catch {
      // fall through to inline fallback.
    }
    setFallbackInput(input);
    trackMetaEvent("ViewContent", { content_name: "inner_child_en_report" });
    setPhase("report");
  };

  if (phase === "test") {
    return <InnerChildEnTest skipIntro seedScreening={seedScreening} onComplete={(input) => void runAnalysis(input)} />;
  }
  if (phase === "report" && fallbackInput) {
    return <InlineFallbackReport input={fallbackInput} />;
  }
  if (phase === "analyzing") {
    return <EnAnalyzing />;
  }

  return <EnLanding onStart={beginTest} />;
}

/* ─────────────── inline final fallback ─────────────── */

function InlineFallbackReport({ input }: { input: ScoreInput }) {
  const score = computeScore(input);
  const crisis =
    score.crisis_flag ||
    detectCrisisEn([
      input.sct?.childhood_self,
      input.sct?.inner_voice,
      input.sct?.family_rule,
      input.sct?.regression_trigger,
      input.sct?.escape_behavior,
    ]);
  if (crisis) return <CrisisScreen />;
  const card = getEnTypeCard(score.primary_child.schema_id);
  if (!card) {
    return (
      <div style={{ minHeight: "100dvh", background: INK.backdrop, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
        <h1 style={{ fontFamily: INK.display, fontSize: 26, fontWeight: 800, color: INK.white, letterSpacing: "-0.03em" }}>
          {score.primary_child.child_name}
        </h1>
        <p style={{ fontFamily: INK.font, fontSize: 14, color: INK.t62, marginTop: 12, lineHeight: 1.7 }}>
          The detailed report for this child is on its way. You&rsquo;ll be able to meet it soon.
        </p>
      </div>
    );
  }
  return <InnerChildEnFreeReport card={card} />;
}

/* ─────────────── landing (ink-orange, inner-child themed) ─────────────── */

/** 히어로 배경 모자이크 타일 — KR /inner-child(MindsLanding)와 동일 처리. 어두운 캐릭터
 *  일러스트를 3열로 깔고 스크림을 얹어 그 위에 훅 카피를 올린다. 3열 × 3행 = 9칸. */
const CAST_TILES = ["leader", "villain", "rake", "manager", "exile"].map((n) => `/minds/cast/${n}.png`);
const HERO_TILES = [0, 1, 2, 3, 4, 2, 0, 4, 1].map((i) => CAST_TILES[i]);

function EnLanding({ onStart }: { onStart: (seed?: { id: string; value: ScaleValue }) => void }) {
  // 첫 화면에 그대로 노출하는 1번 문항 — 여기서 답하면 그 답을 들고 테스트로 들어간다.
  const q1 = SCREENING_ITEMS[0];
  const CARDS = [
    { t: "Who reacts the loudest", d: "Of 16 inner children, the one most awake in you right now." },
    { t: "Why the same things sting", d: "The old belief underneath your strongest reactions." },
    { t: "How it plays out", d: "The way this child shows up in love, work, and quiet moments." },
  ];
  return (
    <main style={{ minHeight: "100dvh", background: INK.backdrop, fontFamily: INK.font, paddingBottom: 132 }}>
      <style>{`
        @keyframes enRise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
        .en-cta{transition:transform .12s ease}
        .en-cta:active{transform:scale(.99)}
        .en-circ{transition:transform .12s ease,border-color .12s ease,color .12s ease,background .12s ease}
        .en-circ:hover{border-color:${INK.accent2};color:#fff;background:rgba(255,90,31,.14)}
        .en-circ:active{transform:scale(.93)}
      `}</style>
      <div style={{ maxWidth: 448, margin: "0 auto", padding: "16px 20px 0" }}>
        {/* hero — dark character mosaic + scrim + hook copy (KR 첫 화면과 동일 이미지 처리) */}
        {/* paddingTop 은 상단 라벨(absolute)의 자리를 비워두는 용도 — 카피가 길어져도 겹치지 않는다. */}
        <div style={{ position: "relative", overflow: "hidden", borderRadius: 22, background: INK.shell, border: `1px solid ${INK.border}`, minHeight: 296, paddingTop: 56, display: "flex", flexDirection: "column", justifyContent: "flex-end", animation: "enRise .4s ease both" }}>
          {/* 배경: 어두운 캐릭터 일러스트 타일 모자이크 */}
          <div aria-hidden style={{ position: "absolute", inset: 0, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", opacity: 0.55 }}>
            {HERO_TILES.map((src, i) => (
              <div key={i} style={{ aspectRatio: "1 / 1", overflow: "hidden" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
          {/* 가독성 스크림 — 위는 옅게, 아래로 갈수록 진하게(하단 글자 보호) */}
          <div aria-hidden style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(5,5,6,0.35) 0%, rgba(5,5,6,0.72) 58%, rgba(10,10,11,0.96) 100%)" }} />
          <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 40% at 50% 0%, rgba(255,90,31,.22), transparent 70%)" }} />
          {/* 상단 라벨 */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px" }}>
            <span style={{ fontFamily: INK.mono, fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,.9)" }}>GIBUN Studio</span>
            <span style={{ fontFamily: INK.mono, fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: INK.accent2 }}>Free · 3 min</span>
          </div>
          {/* 하단 훅 카피 */}
          <div style={{ position: "relative", padding: "0 22px 26px" }}>
            {/* 27px — 390px 폭에서 "You're not overreacting." 이 한 줄에 들어가는 상한. 더 키우면 3줄로 깨진다. */}
            <h1 style={{ fontFamily: INK.display, fontSize: 27, fontWeight: 800, lineHeight: 1.24, letterSpacing: "-0.035em", color: INK.white, margin: 0 }}>
              You&rsquo;re not overreacting.
              <br />
              You&rsquo;re remembering.
            </h1>
            <p style={{ fontFamily: INK.font, fontSize: 15.5, lineHeight: 1.7, color: "rgba(255,255,255,.78)", margin: "14px 0 0", maxWidth: 360 }}>
              Going cold. Over-apologizing. Needing the last word. Each one is a part of you that learned to survive
              something — meet the one that&rsquo;s loudest in you right now.
            </p>
          </div>
        </div>

        {/* Q1 — 첫 화면에서 바로 답하게 한다. 시작을 '결심'에서 '반사'로 내리는 자리라
            버튼(아래 sticky CTA)과 별개로 여기서 답하면 그 답을 들고 테스트로 진입한다. */}
        <div style={{ marginTop: 14, padding: "18px 20px 20px", background: INK.surface, border: `1px solid ${INK.border}`, borderRadius: 18, animation: "enRise .4s ease .06s both" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontFamily: INK.mono, fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: INK.accent2, whiteSpace: "nowrap" }}>Question 1</span>
            <span style={{ fontFamily: INK.font, fontSize: 11.5, color: INK.t4, textAlign: "right" }}>{TIME_FRAME_NOTICE}</span>
          </div>
          <p style={{ fontFamily: INK.font, fontSize: 17.5, fontWeight: 700, lineHeight: 1.45, letterSpacing: "-0.02em", color: INK.white, margin: "13px 0 0" }}>
            {q1.text}
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 20 }}>
            {Array.from({ length: SCALE_MAX }, (_, i) => (i + 1) as ScaleValue).map((v) => (
              <button
                key={v}
                type="button"
                className="en-circ"
                onClick={() => onStart({ id: q1.id, value: v })}
                aria-label={v === 1 ? SCALE_LABELS.min : v === SCALE_MAX ? SCALE_LABELS.max : `${v}`}
                style={{ flex: 1, aspectRatio: "1", maxWidth: 54, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,.2)", background: "transparent", color: INK.t5, fontFamily: INK.mono, fontSize: 15, fontWeight: 600, cursor: "pointer" }}
              >
                {v}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 13 }}>
            <span style={{ fontFamily: INK.font, fontSize: 12, color: INK.t4 }}>{SCALE_LABELS.min}</span>
            <span style={{ fontFamily: INK.font, fontSize: 12, color: INK.t62, fontWeight: 700 }}>{SCALE_LABELS.max}</span>
          </div>
        </div>

        {/* reframe */}
        <div style={{ marginTop: 28 }}>
          <div style={{ fontFamily: INK.mono, fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: INK.accent2, marginBottom: 12 }}>What this is</div>
          <p style={{ fontFamily: INK.font, fontSize: 16, lineHeight: 1.8, color: INK.t82, margin: 0 }}>
            The reactions you can&rsquo;t quite explain — going cold, over-preparing, keeping one layer back — aren&rsquo;t
            random. They&rsquo;re an <b style={{ color: INK.white, fontWeight: 700 }}>inner child</b> stepping in to keep you
            safe, the way it once had to. Knowing which child, and why, is where it stops running you.
          </p>
        </div>

        {/* what you'll get */}
        <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 12 }}>
          {CARDS.map((c) => (
            <div key={c.t} style={{ padding: "16px 18px", background: INK.surface, border: `1px solid ${INK.border}`, borderRadius: 14 }}>
              <div style={{ fontFamily: INK.font, fontSize: 15.5, fontWeight: 700, color: INK.white, letterSpacing: "-0.01em" }}>{c.t}</div>
              <div style={{ fontFamily: INK.font, fontSize: 14, lineHeight: 1.6, color: INK.t62, marginTop: 5 }}>{c.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* sticky CTA */}
      {/* 스크림은 안내 문구가 시작되기 전에 이미 불투명해야 한다 — 옅은 구간에 글자가 걸리면
          뒤 본문과 겹쳐 읽힌다(기존 40% 지점 시작이라 겹쳤음). */}
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 40, display: "flex", justifyContent: "center", padding: "22px 20px calc(env(safe-area-inset-bottom, 0px) + 16px)", background: "linear-gradient(180deg, rgba(5,5,6,0) 0%, rgba(5,5,6,.94) 26%, #050506 52%)", pointerEvents: "none" }}>
        <div style={{ width: "100%", maxWidth: 408, pointerEvents: "auto" }}>
          <p style={{ textAlign: "center", margin: "0 0 10px", fontSize: 12, color: INK.t5, fontFamily: INK.font }}>
            Not a diagnosis — a mirror for who you are right now.
          </p>
          <button
            type="button"
            className="en-cta"
            /* onStart 는 seed 를 선택 인자로 받는다 — onClick 을 그대로 넘기면 MouseEvent 가 seed 로 들어간다. */
            onClick={() => onStart()}
            style={{ width: "100%", padding: 17, borderRadius: 14, background: INK.grad, color: INK.shell, border: "none", fontFamily: INK.font, fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: "0 16px 40px -16px rgba(255,90,31,.7)" }}
          >
            Meet your inner child — free, 3 min →
          </button>
        </div>
      </div>
    </main>
  );
}

/* ─────────────── analyzing ─────────────── */

function EnAnalyzing() {
  const STEPS = [
    "Gathering the scattered pieces of your heart",
    "Listening for each child's voice",
    "Seeing which one is standing at the front",
  ];
  return (
    <main style={{ minHeight: "100dvh", background: INK.backdrop, fontFamily: INK.font, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{`
        @keyframes enPulse{0%,100%{opacity:.2;transform:scale(.85)}50%{opacity:1;transform:scale(1)}}
        .en-pulse{animation:enPulse 1.4s ease-in-out infinite}
      `}</style>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ fontFamily: INK.mono, fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: INK.accent2 }}>Reading</div>
        <h2 style={{ fontFamily: INK.display, fontSize: 27, fontWeight: 800, letterSpacing: "-0.03em", color: INK.white, margin: "16px 0 0", lineHeight: 1.25 }}>
          Calling your inner children,
          <br />
          one at a time
        </h2>
        <p style={{ fontFamily: INK.font, fontSize: 15, lineHeight: 1.75, color: INK.t62, margin: "16px 0 0", maxWidth: 320 }}>
          Reading slowly through your answers and drawing out the child living inside them. One moment.
        </p>
        <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 14 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="en-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: INK.accent, animationDelay: `${i * 0.4}s` }} />
              <span style={{ fontFamily: INK.font, fontSize: 14.5, color: INK.t82 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
