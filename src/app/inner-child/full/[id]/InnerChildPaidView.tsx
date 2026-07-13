"use client";

/**
 * 내면 아이 유료 리포트 뷰 — 생성/로딩/에러 상태 + 6섹션 본문 렌더.
 *
 * 최초 진입(캐시 없음)이면 마운트 시 생성 라우트(/api/inner-child/report)를 호출하고(~30초)
 * 진행 화면을 보여준다. 캐시가 있으면(server 에서 initialReport 주입) 즉시 본문을 렌더한다.
 *
 * 디자인은 무료 리포트(InnerChildFreeReport)와 같은 잉크 오렌지(다크) 카드 덱 언어를 따른다.
 * 섹션(HANDOFF 6-2):
 *   0 읽기 전에 · 1 이 아이의 전체 구조 · 2 같은 상처가 반복되는 구조 ·
 *   3 두 번째 아이의 신호 · 4 방어 시스템: 지킴이 · 5 정말 원했던 것 ·
 *   6 지금의 당신이 줄 수 있는 것 (+ 상담 연계 CTA)
 */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { KAKAO_CHANNEL_URL } from "@/app/programs/counseling/content";
import { DISCLAIMER } from "@/lib/minds/inner-child/questions";
import { READ_BEFORE, guardianDefinitionBlock, reparentingSteps } from "@/lib/minds/inner-child/fixed-texts";
import { getTypeCard } from "@/lib/minds/inner-child/type-cards";
import { MindsResultLinkBar } from "@/components/minds/MindsResultLinkBar";
import { TypeAvatar } from "@/components/minds/inner-child/report/TypeAvatar";
import type { FreeReportGenerated, PaidReportGenerated, ReparentingPlan, TypeCard } from "@/lib/minds/inner-child/report-types";
import type { ScoreResult } from "@/lib/minds/inner-child/types";

/* ─── 잉크 오렌지 토큰 (InnerChildFreeReport 와 동일) ─── */
const INK = {
  shell: "#0A0A0B",
  surface: "#141519",
  border: "#26272c",
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
  t25: "rgba(255,255,255,.25)",
  line: "rgba(255,255,255,.08)",
  line14: "rgba(255,255,255,.14)",
  font: "'Pretendard',-apple-system,BlinkMacSystemFont,system-ui,sans-serif",
  display: "'Inter','Pretendard',-apple-system,system-ui,sans-serif",
  mono: "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace",
};

const LOADING_STEPS = [
  "응답을 다시 읽고 있어요",
  "반복되는 구조를 그리는 중",
  "지킴이의 작동 방식을 분석하는 중",
  "이 아이가 원했던 것을 짚는 중",
  "거의 다 됐어요",
];

export function InnerChildPaidView({
  purchaseId,
  status,
  initialReport,
  score,
  free,
}: {
  purchaseId: string;
  status: string | null;
  initialReport: PaidReportGenerated | null;
  score: ScoreResult | null;
  // 무료 리포트에서 옮겨온 "겉과 속·관계 패턴" 카드의 LLM 생성 문장(무료 때 만들어 블롭에
  // 저장해 둔 값). 페이지가 minds_leads.parts_map 에서 읽어 넘긴다. 없으면 고정 필드만 렌더.
  free: FreeReportGenerated | null;
}) {
  const [report, setReport] = useState<PaidReportGenerated | null>(initialReport);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const running = useRef(false);

  useEffect(() => {
    if (report || status !== "confirmed" || running.current) return;
    running.current = true;
    setError(null);
    (async () => {
      try {
        const res = await fetch("/api/inner-child/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ purchaseId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.report) {
          setError(data?.error || "리포트를 불러오지 못했어요.");
        } else {
          setReport(data.report as PaidReportGenerated);
        }
      } catch {
        setError("네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
      } finally {
        running.current = false;
      }
    })();
  }, [purchaseId, status, report, attempt]);

  const retry = () => {
    setError(null);
    setAttempt((a) => a + 1);
  };

  if (report) return <ReportBody report={report} score={score} free={free} purchaseId={purchaseId} />;
  if (status === null) {
    return (
      <Centered
        title="리포트를 찾을 수 없어요"
        body="링크가 정확한지 다시 확인해주세요. 문제가 계속되면 카카오톡 채널로 문의해주세요."
      />
    );
  }
  if (status !== "confirmed") {
    return (
      <Centered
        title="아직 결제가 확인되지 않았어요"
        body="결제가 완료되면 이 화면에서 바로 리포트를 볼 수 있어요."
      />
    );
  }
  if (error) return <ErrorView error={error} onRetry={retry} />;
  return <LoadingView />;
}

/* ───────────────── 상태 화면 (다크) ───────────────── */

function Shell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: "#050506",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: INK.font,
      }}
    >
      <div style={{ width: "100%", maxWidth: 440, textAlign: "center" }}>{children}</div>
    </div>
  );
}

function Centered({ title, body }: { title: string; body: string }) {
  return (
    <Shell>
      <div style={{ fontFamily: INK.display, fontWeight: 800, fontSize: 20, color: INK.white, marginBottom: 12 }}>
        {title}
      </div>
      <p style={{ fontFamily: INK.font, fontSize: 14, color: INK.t62, lineHeight: 1.7, margin: 0 }}>{body}</p>
    </Shell>
  );
}

function LoadingView() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 6500);
    return () => clearInterval(t);
  }, []);
  return (
    <Shell>
      <div
        style={{
          width: 30,
          height: 30,
          border: `2px solid ${INK.line14}`,
          borderTopColor: INK.accent,
          borderRadius: "50%",
          animation: "ic-spin 0.9s linear infinite",
          margin: "0 auto 20px",
        }}
      />
      <div style={{ fontFamily: INK.display, fontWeight: 800, fontSize: 18, color: INK.white, marginBottom: 12 }}>
        {LOADING_STEPS[step]}
      </div>
      <p style={{ fontFamily: INK.font, fontSize: 13.5, color: INK.mute, lineHeight: 1.7, margin: 0 }}>
        당신의 응답을 다시 읽고 내면 아이의 심층 리포트를 쓰고 있어요.
        <br />
        30초쯤 걸려요. 이 화면을 닫아도 괜찮아요 — 제작이 끝나면 이 링크로 다시 열람할 수 있어요.
      </p>
      <style>{`@keyframes ic-spin{to{transform:rotate(360deg)}}`}</style>
    </Shell>
  );
}

function ErrorView({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <Shell>
      <div style={{ fontFamily: INK.display, fontWeight: 800, fontSize: 19, color: INK.white, marginBottom: 14 }}>
        리포트를 만드는 데 문제가 생겼어요
      </div>
      <p style={{ fontFamily: INK.font, fontSize: 14, color: INK.t62, lineHeight: 1.7, margin: "0 0 20px" }}>{error}</p>
      <button
        type="button"
        onClick={onRetry}
        style={{
          padding: "14px 28px",
          borderRadius: 12,
          background: INK.grad,
          color: INK.shell,
          fontFamily: INK.font,
          fontWeight: 800,
          fontSize: 15,
          border: "none",
          cursor: "pointer",
        }}
      >
        다시 시도하기
      </button>
      <p style={{ fontFamily: INK.font, fontSize: 12.5, color: INK.t4, margin: "18px 0 0" }}>
        이미 결제는 완료됐어요. 계속 안 되면{" "}
        <a href={KAKAO_CHANNEL_URL} target="_blank" rel="noopener noreferrer" style={{ color: INK.accent2, fontWeight: 700 }}>
          카카오톡 채널
        </a>
        로 문의해주세요.
      </p>
    </Shell>
  );
}

/* ───────────────── 공통 조각 ───────────────── */

const clbStyle: CSSProperties = {
  fontFamily: INK.mono,
  fontWeight: 600,
  fontSize: 9.5,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: INK.mute,
  marginBottom: 12,
};

function pad(x: number) {
  return String(x).padStart(2, "0");
}

function Panel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        background: INK.surface,
        border: `1px solid ${INK.border}`,
        borderRadius: 16,
        padding: 22,
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SecTitle({ n, children }: { n: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
      <span style={{ fontFamily: INK.mono, fontSize: 11, fontWeight: 600, color: INK.accent2 }}>{n}</span>
      <span style={{ fontFamily: INK.display, fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: INK.white, lineHeight: 1.3 }}>
        {children}
      </span>
    </div>
  );
}

/** 본문 문단 — 생성 텍스트를 줄바꿈 보존해 렌더. */
function Prose({ text, style }: { text: string; style?: CSSProperties }) {
  return (
    <p
      style={{
        fontFamily: INK.font,
        fontSize: 15.5,
        lineHeight: 1.8,
        letterSpacing: "-0.005em",
        color: INK.t72,
        margin: 0,
        whiteSpace: "pre-line",
        ...style,
      }}
    >
      {text}
    </p>
  );
}

/* ───────────────── 카드 덱 ───────────────── */

function CardDeck({ cards }: { cards: { key: string; kicker: string; node: ReactNode }[] }) {
  const [i, setI] = useState(0);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const total = cards.length;
  const go = (d: number) => setI((c) => Math.min(total - 1, Math.max(0, c + d)));

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [i]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") setI((c) => Math.min(total - 1, c + 1));
      else if (e.key === "ArrowLeft") setI((c) => Math.max(0, c - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  const atFirst = i === 0;
  const atLast = i === total - 1;

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
      `}</style>

      {/* 상단바 — 브랜드 + 진행 */}
      <div style={{ flex: "0 0 auto", padding: "18px 18px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <LogoMark />
            <span style={{ fontFamily: INK.display, fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em", color: INK.white }}>
              내면 아이 심층 리포트
            </span>
          </div>
          <span style={{ fontFamily: INK.mono, fontSize: 10, letterSpacing: "0.1em", color: INK.t4 }}>
            {pad(i + 1)} / {pad(total)}
          </span>
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          {cards.map((c, idx) => (
            <span
              key={c.key}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 999,
                background: idx <= i ? INK.accent : "rgba(255,255,255,.14)",
                transition: "background .25s ease",
              }}
            />
          ))}
        </div>
        <div style={{ fontFamily: INK.mono, fontSize: 9.5, letterSpacing: "0.16em", textTransform: "uppercase", color: INK.t38, marginTop: 9 }}>
          {cards[i].kicker}
        </div>
      </div>

      {/* 카드 본체 */}
      <div
        ref={scrollRef}
        className="ic-scroll"
        onTouchStart={(e) => setStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })}
        onTouchEnd={(e) => {
          if (!start) return;
          const dx = e.changedTouches[0].clientX - start.x;
          const dy = e.changedTouches[0].clientY - start.y;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
          setStart(null);
        }}
        style={{ flex: 1, minHeight: 0, overflowY: "auto", WebkitOverflowScrolling: "touch", padding: "4px 12px 12px" }}
      >
        <div key={cards[i].key} style={{ animation: "icRise .28s ease" }}>
          {cards[i].node}
        </div>
      </div>

      {/* 네비게이션 */}
      <div style={{ flex: "0 0 auto", display: "flex", gap: 10, padding: "14px 16px 16px", borderTop: `1px solid ${INK.line}` }}>
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={atFirst}
          style={{
            flex: "0 0 auto",
            padding: "14px 18px",
            borderRadius: 12,
            border: `1px solid ${INK.line14}`,
            background: "transparent",
            color: atFirst ? INK.t25 : INK.t6,
            fontFamily: INK.font,
            fontWeight: 700,
            fontSize: 15,
            cursor: atFirst ? "default" : "pointer",
          }}
        >
          ‹ 이전
        </button>
        {atLast ? (
          <button
            type="button"
            onClick={() => setI(0)}
            style={{
              flex: 1,
              padding: "14px 18px",
              borderRadius: 12,
              border: `1px solid ${INK.line14}`,
              background: "transparent",
              color: INK.t72,
              fontFamily: INK.font,
              fontWeight: 700,
              fontSize: 15,
              cursor: "pointer",
            }}
          >
            처음으로 ↑
          </button>
        ) : (
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
        )}
      </div>
    </div>
  );
}

function LogoMark() {
  return (
    <span style={{ position: "relative", display: "inline-block", width: 16, height: 16, borderRadius: 999, background: "linear-gradient(135deg,#FF5A1F,#FF8A4C,#FFB68A)" }}>
      <span style={{ position: "absolute", inset: 4, borderRadius: 999, background: INK.shell }} />
    </span>
  );
}

/* ───────────────── 6섹션 본문 ───────────────── */

function ReportBody({
  report,
  score,
  free,
  purchaseId,
}: {
  report: PaidReportGenerated;
  score: ScoreResult | null;
  free: FreeReportGenerated | null;
  purchaseId: string;
}) {
  const primaryCard: TypeCard | null = score ? getTypeCard(score.primary_child.schema_id) : null;
  const secondSchemaId = score?.secondary_children[0]?.schema_id;
  const secondCard: TypeCard | null = secondSchemaId ? getTypeCard(secondSchemaId) : null;

  const cards: { key: string; kicker: string; node: ReactNode }[] = [];
  // 섹션 번호를 데이터 순서대로 자동 부여한다(무료→유료로 카드가 이동해도 번호가 안 꼬이게).
  let sec = 0;
  const nextN = () => pad(++sec);

  // 0. 읽기 전에 (번호 없음)
  cards.push({
    key: "read-before",
    kicker: "읽기 전에",
    node: <ReadBeforeCard />,
  });

  // 1. 이 아이의 전체 구조 (고정)
  if (primaryCard) {
    cards.push({
      key: "structure",
      kicker: "이 아이의 전체 구조",
      node: <StructureCard n={nextN()} card={primaryCard} childName={score?.primary_child.child_name ?? primaryCard.child_name} />,
    });
  }

  // ── 무료 리포트에서 옮겨온 해설 카드 3종 (자주 하는 생각 · 스트레스 신호 · 겉과 속/관계 패턴) ──
  // 전부 primaryCard(TypeCard) 고정 필드에서 렌더된다. 관계 패턴 카드만 무료 때 생성해 둔
  // LLM 문장(free.gap/relation_pattern)을 함께 쓰되, 없어도 고정 필드로 성립한다.
  if (primaryCard) {
    cards.push({
      key: "thoughts",
      kicker: "자주 하는 생각",
      node: <ThoughtsCard n={nextN()} card={primaryCard} />,
    });
    cards.push({
      key: "stress",
      kicker: "스트레스 신호",
      node: <StressCard n={nextN()} card={primaryCard} />,
    });
    cards.push({
      key: "gap-relation",
      kicker: "겉과 속 · 관계 패턴",
      node: <GapRelationCard n={nextN()} card={primaryCard} gap={free?.gap ?? null} relation={free?.relation_pattern ?? null} />,
    });
  }

  // 2. 같은 상처가 반복되는 구조 (생성 + 5스텝 다이어그램)
  cards.push({
    key: "loop",
    kicker: "같은 상처가 반복되는 구조",
    node: <LoopCard n={nextN()} loop={report.loop_narrative} />,
  });

  // 3. 두 번째 아이의 신호 (고정 요약 + 생성)
  cards.push({
    key: "second-child",
    kicker: "두 번째 아이의 신호",
    node: <SecondChildCard n={nextN()} card={secondCard} relation={report.second_child_relation} />,
  });

  // 4. 방어 시스템: 지킴이 (고정 정의 블록 + 생성)
  if (score) {
    cards.push({
      key: "guardian",
      kicker: "방어 시스템: 지킴이",
      node: <GuardianCard n={nextN()} definition={guardianDefinitionBlock(score.guardian.type)} anatomy={report.guardian_anatomy} />,
    });
  }

  // 5. 이 아이가 정말 원했던 것 (생성 + 고정 core_need)
  cards.push({
    key: "core-need",
    kicker: "정말 원했던 것",
    node: <CoreNeedCard n={nextN()} bridge={report.core_need_bridge} coreNeed={primaryCard?.core_need ?? null} />,
  });

  // 6. 지금의 당신이 줄 수 있는 것 (SCT 기반 생성 실행계획 + 생성 closing + 상담 CTA)
  cards.push({
    key: "reparenting",
    kicker: "지금의 당신이 줄 수 있는 것",
    node: <ReparentingCard n={nextN()} reparenting={report.reparenting} card={primaryCard} closing={report.closing} />,
  });

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
        <CardDeck cards={cards} />
        {/* 재열람 링크 복사 바 — 이 유료 리포트(구매 UUID) 링크를 스스로 저장하게 한다.
            비로그인 구매자가 알림톡/브라우저 기록에만 의존하지 않도록 하는 안전망. */}
        <div style={{ flex: "0 0 auto" }}>
          <MindsResultLinkBar leadId={purchaseId} base="/inner-child/full" />
        </div>
        <p style={{ flex: "0 0 auto", fontFamily: INK.mono, fontSize: 10, color: INK.t38, lineHeight: 1.7, textAlign: "center", marginTop: 12 }}>
          기분 리포트 · INNER CHILD REPORT · {DISCLAIMER}
        </p>
      </div>
    </div>
  );
}

/* ─── 섹션 0 ─── */
function ReadBeforeCard() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ position: "relative", overflow: "hidden", borderRadius: 18, background: INK.shell, padding: "30px 22px 28px" }}>
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 44% at 50% 0%, rgba(255,90,31,.28), transparent 70%)" }} />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: INK.accent, display: "inline-block" }} />
            <span style={{ fontFamily: INK.mono, fontWeight: 600, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: INK.accent2 }}>
              Read First · 읽기 전에
            </span>
          </div>
          <Prose text={READ_BEFORE} style={{ fontSize: 16, color: INK.t82 }} />
        </div>
      </div>
    </div>
  );
}

/* ─── 섹션 1 ─── */
function StructureCard({ n, card, childName }: { n: string; card: TypeCard; childName: string }) {
  const domains: [string, string][] = [
    ["관계", card.domains["관계"]],
    ["일", card.domains["일"]],
    ["자기관리", card.domains["자기관리"]],
  ];
  return (
    <Panel style={{ padding: "24px 22px" }}>
      <SecTitle n={n}>이 아이의 전체 구조</SecTitle>
      {/* 캐릭터 프로필 + 유형명 */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "16px 0 6px" }}>
        <TypeAvatar schemaId={card.schema_id} alt={childName} size={64} />
        <p style={{ fontFamily: INK.font, fontSize: 16, fontWeight: 700, color: INK.white, margin: 0 }}>{childName}</p>
      </div>
      <div style={{ padding: "16px 18px", background: "rgba(255,255,255,.03)", border: `1px solid ${INK.line}`, borderRadius: 12, marginBottom: 20 }}>
        <div style={clbStyle}>이 아이가 만들어진 배경</div>
        <Prose text={card.origin_hypothesis} style={{ fontSize: 15 }} />
      </div>
      <div style={clbStyle}>일상에서의 발현</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
        {domains.map(([k, v]) => (
          <div key={k}>
            <p style={{ fontFamily: INK.font, fontSize: 15, fontWeight: 700, color: INK.accent2, margin: 0 }}>{k}</p>
            <p style={{ fontFamily: INK.font, fontSize: 15, lineHeight: 1.72, color: INK.t72, margin: "4px 0 0" }}>{v}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ─── 섹션 2 ─── */
const LOOP_STEPS = ["촉발", "해석", "행동", "결과", "강화"];
function LoopCard({ n, loop }: { n: string; loop: string }) {
  return (
    <Panel style={{ padding: "24px 22px" }}>
      <SecTitle n={n}>같은 상처가 반복되는 구조</SecTitle>
      {/* 반복 루프 요약 다이어그램 — 촉발 → 해석 → 행동 → 결과 → 강화 */}
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, margin: "18px 0 20px" }}>
        {LOOP_STEPS.map((s, i) => (
          <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontFamily: INK.font,
                fontSize: 13,
                fontWeight: 700,
                color: INK.white,
                padding: "6px 11px",
                borderRadius: 999,
                background: "rgba(255,90,31,.1)",
                border: `1px solid rgba(255,138,76,.3)`,
              }}
            >
              {s}
            </span>
            {i < LOOP_STEPS.length - 1 && (
              <span style={{ fontFamily: INK.mono, fontSize: 12, color: INK.accent2 }}>→</span>
            )}
          </span>
        ))}
        <span style={{ fontFamily: INK.mono, fontSize: 11, color: INK.t38, marginLeft: 2 }}>↻</span>
      </div>
      <Prose text={loop} />
    </Panel>
  );
}

/* ─── 섹션 3 ─── */
function SecondChildCard({ n, card, relation }: { n: string; card: TypeCard | null; relation: string }) {
  return (
    <Panel style={{ padding: "24px 22px" }}>
      <SecTitle n={n}>두 번째 아이의 신호</SecTitle>
      {card ? (
        <div style={{ marginTop: 16, padding: "16px 18px", background: "rgba(255,255,255,.03)", border: `1px solid ${INK.line}`, borderRadius: 12 }}>
          <p style={{ fontFamily: INK.font, fontSize: 16, fontWeight: 800, color: INK.white, margin: 0 }}>{card.child_name}</p>
          <p style={{ fontFamily: INK.font, fontSize: 14.5, lineHeight: 1.6, color: INK.t62, margin: "6px 0 0" }}>{card.one_liner}</p>
        </div>
      ) : null}
      <Prose text={relation} style={{ marginTop: card ? 18 : 16 }} />
    </Panel>
  );
}

/* ─── 섹션 4 ─── */
function GuardianCard({ n, definition, anatomy }: { n: string; definition: string; anatomy: string }) {
  return (
    <Panel style={{ padding: "24px 22px" }}>
      <SecTitle n={n}>방어 시스템: 지킴이</SecTitle>
      <div style={{ marginTop: 16, padding: "16px 18px", background: "rgba(255,255,255,.03)", border: `1px solid ${INK.line}`, borderRadius: 12 }}>
        <Prose text={definition} style={{ fontSize: 14.5, color: INK.t68 }} />
      </div>
      <div style={{ ...clbStyle, marginTop: 22 }}>당신의 지킴이는 이렇게 작동해요</div>
      <Prose text={anatomy} />
    </Panel>
  );
}

/* ─── 섹션 5 ─── */
function CoreNeedCard({ n, bridge, coreNeed }: { n: string; bridge: string; coreNeed: string | null }) {
  return (
    <Panel style={{ padding: "24px 22px" }}>
      <SecTitle n={n}>이 아이가 정말 원했던 것</SecTitle>
      <Prose text={bridge} style={{ marginTop: 16 }} />
      {coreNeed ? (
        <div
          style={{
            marginTop: 18,
            padding: "18px 20px",
            background: "rgba(255,90,31,.06)",
            border: `1px solid rgba(255,138,76,.25)`,
            borderRadius: 12,
          }}
        >
          <div style={clbStyle}>정말 원했던 것</div>
          <Prose text={coreNeed} style={{ fontSize: 16, color: INK.t82, fontWeight: 500 }} />
        </div>
      ) : null}
    </Panel>
  );
}

/* ─── 무료에서 옮겨온 해설 카드 (자주 하는 생각 · 스트레스 신호 · 겉과 속/관계 패턴) ───
 *
 * 셋 다 primaryCard(TypeCard) 고정 필드로 렌더된다. 원래 무료 리포트(InnerChildFreeReport)
 * 에 있던 카드를 결제 뒤로 옮긴 것 — 콘텐츠는 그대로, 공개 위치만 유료로. 관계 패턴 카드만
 * 무료 때 생성해 둔 LLM 문장(free.gap/relation_pattern)을 함께 쓰되, 없어도 성립한다.
 */

/** 자주 하는 생각 — 대사 + 해석 + 믿음의 기원. */
function ThoughtsCard({ n, card }: { n: string; card: TypeCard }) {
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

/** 스트레스 신호 — 상황 + 왜 힘든지. */
function StressCard({ n, card }: { n: string; card: TypeCard }) {
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
        이런 순간, 이 아이는 ‘{card.surface_reaction}’ 반응으로 먼저 나섭니다. 왜 그런지는 뒤의
        ‘지킴이’ 장에서 이어집니다.
      </p>
    </Panel>
  );
}

/** gap_hint "외부: X / 내부: Y" → [겉, 속] 파싱. */
function parseGapHint(h: string): [string, string] {
  const parts = h.split("/").map((s) => s.trim());
  const strip = (s: string) => s.replace(/^외부\s*[:：]\s*/, "").replace(/^내부\s*[:：]\s*/, "").trim();
  return [strip(parts[0] ?? ""), strip(parts[1] ?? "")];
}

/** 겉과 속 + 관계에서의 패턴 — 한 섹션에. 고정 필드가 뼈대, LLM 문장은 있으면 덧붙인다. */
function GapRelationCard({ n, card, gap, relation }: { n: string; card: TypeCard; gap: string | null; relation: string | null }) {
  const [outer, inner] = parseGapHint(card.gap_hint);
  const scenes = card.typical_scenes ?? [];
  const notes = card.typical_scene_notes ?? [];
  return (
    <Panel style={{ padding: "24px 22px" }}>
      {/* 겉과 속 */}
      <SecTitle n={n}>겉과 속</SecTitle>
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
      {gap && <p style={{ fontFamily: INK.font, fontSize: 15.5, lineHeight: 1.8, color: INK.t72, marginTop: 18 }}>{gap}</p>}

      {/* 관계에서의 패턴 */}
      {(relation || scenes.length > 0) && (
        <div style={{ marginTop: 28, paddingTop: 24, borderTop: `1px solid ${INK.line}` }}>
          <div style={{ fontFamily: INK.display, fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em", color: INK.white }}>관계에서의 패턴</div>
          {relation && <p style={{ fontFamily: INK.font, fontSize: 15.5, lineHeight: 1.78, color: INK.t72, marginTop: 14 }}>{relation}</p>}
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

/* ─── 섹션 6 ─── */
function ReparentingCard({
  n,
  reparenting,
  card,
  closing,
}: {
  n: string;
  reparenting: ReparentingPlan | null;
  card: TypeCard | null;
  closing: string;
}) {
  // 본체는 SCT 기반 생성 실행계획. 혹시 비면(검증을 통과 못 한 구버전 등) 고정 3단계로 방어.
  const steps =
    reparenting?.steps?.length
      ? reparenting.steps.map((s, i) => ({ step: String(i + 1), title: s.title, body: s.body }))
      : card
        ? reparentingSteps(card)
        : [];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Panel style={{ padding: "24px 22px" }}>
        <SecTitle n={n}>지금의 당신이 줄 수 있는 것</SecTitle>
        {reparenting?.scene ? (
          <div style={{ marginTop: 14 }}>
            <Prose text={reparenting.scene} style={{ color: INK.t82 }} />
          </div>
        ) : null}
        {steps.length ? (
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 16 }}>
            {steps.map((s) => (
              <div key={s.step} style={{ display: "flex", gap: 14 }}>
                <span
                  style={{
                    flex: "0 0 auto",
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    border: `1.5px solid rgba(255,138,76,.5)`,
                    color: INK.accent2,
                    fontFamily: INK.mono,
                    fontWeight: 700,
                    fontSize: 13,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {s.step}
                </span>
                <div>
                  <p style={{ fontFamily: INK.font, fontSize: 15.5, fontWeight: 800, color: INK.white, margin: 0 }}>{s.title}</p>
                  <p style={{ fontFamily: INK.font, fontSize: 15, lineHeight: 1.72, color: INK.t68, margin: "5px 0 0" }}>{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        ) : null}
        <div style={{ marginTop: 22, paddingTop: 20, borderTop: `1px solid ${INK.line}` }}>
          <Prose text={closing} style={{ color: INK.t82 }} />
        </div>
      </Panel>

      {/* 상담 연계 CTA — 리포트를 다 읽어 마음이 가장 열린 지금이 전환의 순간. */}
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 18,
          padding: "26px 22px",
          background: "linear-gradient(180deg,#181920,#131318)",
          border: `1px solid #34302b`,
        }}
      >
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(74% 60% at 100% 0%, rgba(255,90,31,.2), transparent 60%)" }} />
        <div style={{ position: "relative" }}>
          <div style={clbStyle}>다음 한 걸음</div>
          <h3 style={{ fontFamily: INK.display, fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.5, color: INK.white, margin: "0 0 10px" }}>
            이 아이, 혼자 마주하기 벅차다면
            <br />
            1:1 세션으로 더 깊이 들여다봐요.
          </h3>
          <p style={{ fontFamily: INK.font, fontSize: 13.5, color: INK.t62, lineHeight: 1.7, margin: "0 0 20px" }}>
            리포트에서 만난 내면 아이의 패턴을, 1:1 세션에서 더 깊이 들여다볼 수 있어요. 카카오톡으로 편하게 문의해주세요.
          </p>
          <a
            href={KAKAO_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              textAlign: "center",
              background: INK.white,
              color: INK.shell,
              fontFamily: INK.font,
              fontWeight: 800,
              fontSize: 15.5,
              letterSpacing: "-0.01em",
              padding: "15px 20px",
              borderRadius: 12,
              textDecoration: "none",
            }}
          >
            💬 카카오톡으로 1:1 세션 문의하기
          </a>
        </div>
      </div>
    </div>
  );
}
