"use client";

/**
 * 내면 아이 유료 리포트 뷰 — 생성/로딩/에러 상태 + 전체 본문 렌더.
 *
 * 최초 진입(캐시 없음)이면 마운트 시 생성 라우트(/api/inner-child/report)를 호출하고(~30초)
 * 진행 화면을 보여준다. 캐시가 있으면(server 에서 initialReport 주입) 즉시 본문을 렌더한다.
 *
 * 디자인은 판매 페이지(InnerChildSalesPage)와 같은 잉크 오렌지(다크) 스크롤 언어를 따른다.
 * (장 넘김 카드 덱 → 한 페이지 스크롤로 전환 — 전체를 한 번에 읽는다.)
 *
 * ★ 이 리포트가 유형 이름을 처음 공개하는 자리다. 앞단(InnerChildSalesPage)은 "분석이
 *   끝났다"까지만 알리고 유형·해설·측정 지표를 전부 잠가둔 판매 페이지이므로, 결제한
 *   사람이 가장 먼저 확인하고 싶은 건 "그래서 내 아이가 누구냐"다 — 그래서 유형 공개
 *   (TypeRevealCard)가 맨 앞이다.
 *
 * 섹션(현재 순서) — 앞의 다섯 섹션은 개편 때 무료에서 옮겨온 것이다("이 아이가 누구인지 →
 * 왜 그러는지 → 어떤 장면으로 나오는지 → 어떻게 측정됐는지 → 일상 전반" 흐름):
 *   읽기 전에 · 당신의 아이는(유형 공개 + 고정 traits·strength·voice) · 왜 자꾸 이럴까(생성
 *   insight) · 이런 순간 있지 않나요(고정 typical_scenes) · Signal Index(고정 metrics) ·
 *   이 아이의 전체 구조(고정 origin_hypothesis + 생성 daily_domains·daily_prediction) ·
 *   같은 상처가 반복되는 구조(단계별 loop_stages) · 방어 시스템: 지킴이 · 이 아이가 만들어내는
 *   갈등과 문제 · 자주 하는 생각 · 스트레스 신호 · 두 번째 아이의 신호 · 정말 원했던 것 ·
 *   이 아이와 잘 지내는 법 · 지금의 당신이 줄 수 있는 것 (+ 상담 연계 CTA)
 * 텍스트는 박스 없이 열린 스크롤(Panel = 헤어라인 구분선)로 쭉 읽힌다.
 */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { KAKAO_CHANNEL_URL } from "@/app/programs/counseling/content";
import { DISCLAIMER } from "@/lib/minds/inner-child/questions";
import { READ_BEFORE, guardianDefinitionBlock, reparentingSteps } from "@/lib/minds/inner-child/fixed-texts";
import { getTypeCard } from "@/lib/minds/inner-child/type-cards";
import { MindsResultLinkBar } from "@/components/minds/MindsResultLinkBar";
import { TypeAvatar } from "@/components/minds/inner-child/report/TypeAvatar";
import type { DailyDomains, LoopStages, PaidReportGenerated, ReparentingPlan, TypeCard } from "@/lib/minds/inner-child/report-types";
import type { ScoreResult } from "@/lib/minds/inner-child/types";

/* ─── 잉크 오렌지 토큰 (InnerChildSalesPage 와 동일) ─── */
const INK = {
  shell: "var(--icp-shell)",
  surface: "var(--icp-shell)",
  border: "var(--icp-border)",
  accent: "var(--icp-accent)",
  accent2: "var(--icp-accent2)",
  grad: "linear-gradient(135deg,var(--icp-accent) 0%,var(--icp-accent2) 50%,var(--icp-accent3) 100%)",
  mute: "var(--icp-mute)",
  white: "rgb(var(--icp-ink))",
  t82: "rgb(var(--icp-ink) / .82)",
  t72: "rgb(var(--icp-ink) / .72)",
  t68: "rgb(var(--icp-ink) / .68)",
  t62: "rgb(var(--icp-ink) / .62)",
  t6: "rgb(var(--icp-ink) / .6)",
  t4: "rgb(var(--icp-ink) / .4)",
  t38: "rgb(var(--icp-ink) / .38)",
  t25: "rgb(var(--icp-ink) / .25)",
  line: "rgb(var(--icp-ink) / .08)",
  line14: "rgb(var(--icp-ink) / .14)",
  font: "'Pretendard',-apple-system,BlinkMacSystemFont,system-ui,sans-serif",
  display: "'Inter','Pretendard',-apple-system,system-ui,sans-serif",
  mono: "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace",
};

/** 다크 고정 팔레트 — 판매 페이지와 동일하게 항상 다크(라이트/OS 자동 대응 없음, 파운더 지시). */
const ICP_ROOT_CSS =
  ".icp-root{--icp-page:#15120D;--icp-shell:#211D18;--icp-border:#3A3228;--icp-mute:#9A9082;--icp-accent:#A6A2E0;--icp-accent2:#8B89C4;--icp-accent3:#9A97C8;--icp-ink:237 228 211;--icp-accent-rgb:166 162 224;}";

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
}: {
  purchaseId: string;
  status: string | null;
  initialReport: PaidReportGenerated | null;
  score: ScoreResult | null;
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

  if (report) return <ReportBody report={report} score={score} purchaseId={purchaseId} />;
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
      className="icp-root"
      style={{
        background: "var(--icp-page)",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: INK.font,
      }}
    >
      <style>{ICP_ROOT_CSS}</style>
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

/* 본문 읽기용 공통 사이즈 — 쭉쭉 읽히도록 키운 값(무료 리포트와 동일). */
const READ = { size: 17, line: 1.9, noteSize: 16, noteLine: 1.85 };

/** 열린 섹션 — 박스(테두리/배경) 대신 헤어라인 구분선 + 여백으로 '쭉 읽히게'.
 *  (파운더 요청: 유료도 박스 안에 텍스트 넣지 말고 스크롤로 쭉 읽히게.) */
function Panel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <section style={{ borderTop: `1px solid rgb(var(--icp-ink) / .07)`, padding: "26px 4px 0", position: "relative", ...style }}>
      {children}
    </section>
  );
}

function SecTitle({ n, children }: { n: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
      <span style={{ fontFamily: INK.mono, fontSize: 12, fontWeight: 600, color: INK.accent2 }}>{n}</span>
      <span style={{ fontFamily: INK.display, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", color: INK.white, lineHeight: 1.3 }}>
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
        fontSize: 16.5,
        lineHeight: 1.9,
        letterSpacing: "-0.005em",
        color: INK.t82,
        margin: 0,
        whiteSpace: "pre-line",
        ...style,
      }}
    >
      {text}
    </p>
  );
}


function LogoMark() {
  return (
    <span style={{ position: "relative", display: "inline-block", width: 16, height: 16, borderRadius: 999, background: "linear-gradient(135deg,var(--icp-accent),var(--icp-accent2),var(--icp-accent3))" }}>
      <span style={{ position: "absolute", inset: 4, borderRadius: 999, background: INK.shell }} />
    </span>
  );
}

/* ───────────────── 6섹션 본문 ───────────────── */

/** 서사 브릿지 — 밤하늘 배경 + 중앙 텍스트. 판매 페이지 시네마틱 서사와 같은 결(챕터 전환). */
function PaidScene({ lines }: { lines: ReactNode[] }) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 18,
        padding: "46px 28px",
        background: "radial-gradient(60% 42% at 50% 16%, rgba(92,88,142,.34), transparent 72%), #1C1813",
        textAlign: "center",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(1.3px 1.3px at 16% 22%,#fff,transparent),radial-gradient(1px 1px at 60% 28%,rgba(255,255,255,.7),transparent),radial-gradient(1.3px 1.3px at 82% 20%,#fff,transparent),radial-gradient(1px 1px at 38% 76%,rgba(255,255,255,.6),transparent),radial-gradient(1px 1px at 88% 64%,rgba(255,255,255,.5),transparent),radial-gradient(1px 1px at 26% 54%,rgba(255,255,255,.5),transparent)",
        }}
      />
      <div style={{ position: "relative" }}>
        {lines.map((l, i) => (
          <p
            key={i}
            style={{
              fontFamily: INK.font,
              fontSize: 20,
              fontWeight: 700,
              lineHeight: 1.75,
              color: "#F1E9DA",
              margin: i ? "10px 0 0" : 0,
            }}
          >
            {l}
          </p>
        ))}
      </div>
    </div>
  );
}

/** 유료 히어로 — 밤하늘 위 캐릭터 공개(결제 첫 화면). 청월당 제1장 히어로 결. 항상 다크. */
function PaidHero({ card, childName }: { card: TypeCard; childName: string }) {
  const journey = [
    "이 아이가 누구이고, 어떻게 만들어졌는지",
    "왜 자꾸 같은 자리로 돌아오는지",
    "오늘부터 이 아이와 잘 지내는 법",
  ];
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 20,
        background: "radial-gradient(72% 52% at 50% 16%, rgba(92,88,142,.44), transparent 72%), #1C1813",
        padding: "40px 26px 32px",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(1.4px 1.4px at 14% 20%,#fff,transparent),radial-gradient(1px 1px at 60% 16%,rgba(255,255,255,.7),transparent),radial-gradient(1.4px 1.4px at 84% 24%,#fff,transparent),radial-gradient(1px 1px at 30% 40%,rgba(255,255,255,.6),transparent),radial-gradient(1px 1px at 88% 52%,rgba(255,255,255,.5),transparent),radial-gradient(1px 1px at 20% 64%,rgba(255,255,255,.5),transparent)",
        }}
      />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <TypeAvatar schemaId={card.schema_id} alt={childName} size={132} />
        <span style={{ fontFamily: INK.mono, fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600, color: "#B5B1E4", marginTop: 20 }}>
          Inner Child Report · 심층 리포트
        </span>
        <h1 style={{ fontFamily: INK.display, fontSize: 29, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.2, color: "#fff", margin: "13px 0 0" }}>
          {childName}
        </h1>
        <p style={{ fontFamily: INK.font, fontSize: 15, lineHeight: 1.65, color: "rgba(255,255,255,.64)", margin: "12px 0 0", maxWidth: 320 }}>
          {card.one_liner}
        </p>
        <div style={{ height: 1, background: "rgba(255,255,255,.13)", width: "100%", margin: "24px 0 18px" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12, alignSelf: "stretch", textAlign: "left" }}>
          {journey.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
              <span style={{ color: "#B5B1E4", marginTop: 1, fontWeight: 800 }}>•</span>
              <span style={{ fontFamily: INK.font, fontSize: 14.5, lineHeight: 1.5, color: "rgba(255,255,255,.82)" }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportBody({
  report,
  score,
  purchaseId,
}: {
  report: PaidReportGenerated;
  score: ScoreResult | null;
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

  // [서사] 오프닝 — 판매 페이지에서 가려뒀던 이야기를 편다.
  cards.push({
    key: "scene-open",
    kicker: "",
    node: <PaidScene lines={[<>이제, 가려뒀던 이야기를</>, <>전부 펼쳐볼게요.</>]} />,
  });

  // ── 유형 공개 + 무료에서 옮겨온 도입 해설 ──
  // 앞단(판매 페이지)은 유형을 흐릿한 실루엣으로 잠가뒀다. 결제하고 처음 확인하고 싶은 게
  // "그래서 내 아이가 누구냐"이므로, 유형 공개가 리포트의 첫 장면이다.
  if (primaryCard) {
    cards.push({
      key: "type-reveal",
      kicker: "당신의 아이는",
      node: <TypeRevealCard n={nextN()} card={primaryCard} childName={score?.primary_child.child_name ?? primaryCard.child_name} />,
    });
  }

  // 왜 자꾸 이럴까 (생성) — 결제 직후 첫 개인화 문단. "결제하길 잘했다"가 나와야 하는 자리.
  cards.push({
    key: "insight",
    kicker: "왜 자꾸 이럴까",
    node: <InsightCard n={nextN()} text={report.insight} />,
  });

  if (primaryCard) {
    cards.push({
      key: "scenes",
      kicker: "이런 순간, 있지 않나요",
      node: <ScenesCard n={nextN()} card={primaryCard} />,
    });
    // Signal Index — 판매 페이지에서 뺀 측정 지표(파운더 지시 2026-07-14). 진단 근거이자
    // "진짜로 측정했구나"의 증거라 결제 뒤로 옮겼다.
    cards.push({
      key: "metrics",
      kicker: "Signal Index",
      node: <MetricsCard n={nextN()} card={primaryCard} />,
    });
  }

  // 1. 이 아이의 전체 구조 (고정 배경 + 생성 영역별 해설 + 생성 일상 예측)
  if (primaryCard) {
    cards.push({
      key: "structure",
      kicker: "이 아이의 전체 구조",
      node: <StructureCard n={nextN()} card={primaryCard} domains={report.daily_domains} prediction={report.daily_prediction} />,
    });
  }

  // [서사] 반복 고리로.
  cards.push({
    key: "scene-loop",
    kicker: "",
    node: <PaidScene lines={[<>이 아이가 왜 자꾸</>, <>같은 자리로 돌아오는지,</>, <>그 길을 따라가 볼게요.</>]} />,
  });

  // 2. 같은 상처가 반복되는 구조 (앞으로 이동 — 생성 + 5스텝 다이어그램)
  cards.push({
    key: "loop",
    kicker: "같은 상처가 반복되는 구조",
    node: <LoopCard n={nextN()} stages={report.loop_stages} />,
  });

  // 3. 방어 시스템: 지킴이 (앞으로 이동 — 고정 정의 블록 + 생성)
  if (score) {
    cards.push({
      key: "scene-guardian",
      kicker: "",
      node: <PaidScene lines={[<>그런데 이 아이는 사실,</>, <>당신을 <b style={{ color: "#fff" }}>지키려고</b></>, <>그래온 거예요.</>]} />,
    });
    cards.push({
      key: "guardian",
      kicker: "방어 시스템: 지킴이",
      node: <GuardianCard n={nextN()} definition={guardianDefinitionBlock(score.guardian.type)} anatomy={report.guardian_anatomy} />,
    });
  }

  // 4. 이 아이가 만들어내는 갈등과 문제 (신규 생성)
  cards.push({
    key: "conflict",
    kicker: "갈등과 문제",
    node: <ConflictCard n={nextN()} text={report.conflict_problems} />,
  });

  // ── 무료 리포트에서 옮겨온 해설 카드 (자주 하는 생각 · 스트레스 신호) ──
  // primaryCard(TypeCard) 고정 필드로 렌더된다. (겉과 속/관계 패턴 카드는 제거됨.)
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
  }

  // [서사] 두 번째 아이로.
  cards.push({
    key: "scene-second",
    kicker: "",
    node: <PaidScene lines={[<>여기까지가 첫 번째 아이예요.</>, <>아직 얼굴을 다 안 보여준</>, <>두 번째 아이가 있어요.</>]} />,
  });

  // 5. 두 번째 아이의 신호 (고정 요약 + 생성)
  cards.push({
    key: "second-child",
    kicker: "두 번째 아이의 신호",
    node: <SecondChildCard n={nextN()} card={secondCard} relation={report.second_child_relation} />,
  });

  // 6. 이 아이가 정말 원했던 것 (생성 + 고정 core_need)
  cards.push({
    key: "core-need",
    kicker: "정말 원했던 것",
    node: <CoreNeedCard n={nextN()} bridge={report.core_need_bridge} coreNeed={primaryCard?.core_need ?? null} />,
  });

  // 7. 이 아이와 잘 지내는 법 (신규 생성 — 실용 해결책)
  cards.push({
    key: "getting-along",
    kicker: "이 아이와 잘 지내는 법",
    node: <SolutionCard n={nextN()} text={report.getting_along} />,
  });

  // [서사] 마무리로.
  cards.push({
    key: "scene-reparenting",
    kicker: "",
    node: <PaidScene lines={[<>이제, 오늘의 당신이</>, <>그 아이에게 건넬 말을</>, <>준비했어요.</>]} />,
  });

  // 8. 지금의 당신이 줄 수 있는 것 (SCT 기반 생성 실행계획 + 생성 closing + 상담 CTA)
  cards.push({
    key: "reparenting",
    kicker: "지금의 당신이 줄 수 있는 것",
    node: <ReparentingCard n={nextN()} reparenting={report.reparenting} card={primaryCard} closing={report.closing} />,
  });

  // 스크롤형 — 장 넘김(CardDeck) 대신 6섹션을 한 페이지에서 쭉 읽는다(무료 리포트와 동일 언어).
  return (
    <div
      className="icp-root"
      style={{
        minHeight: "100dvh",
        background: "var(--icp-page)",
        fontFamily: INK.font,
        paddingBottom: "calc(28px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      <style>{`${ICP_ROOT_CSS}@keyframes icRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>
      <div style={{ maxWidth: 440, margin: "0 auto", padding: "16px 14px 0", display: "flex", flexDirection: "column", gap: 18 }}>
        {/* 브랜드 헤더 */}
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "2px 2px 2px" }}>
          <LogoMark />
          <span style={{ fontFamily: INK.display, fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em", color: INK.white }}>
            내면 아이 심층 리포트
          </span>
        </div>

        {/* 히어로 — 결제 첫 화면에서 캐릭터 공개(밤하늘). */}
        {primaryCard && (
          <PaidHero card={primaryCard} childName={score?.primary_child.child_name ?? primaryCard.child_name} />
        )}

        {cards.map((c) => (
          <div key={c.key} style={{ animation: "icRise .4s ease both" }}>
            {c.node}
          </div>
        ))}

        {/* 재열람 링크 복사 바 — 이 유료 리포트(구매 UUID) 링크를 스스로 저장하게 한다.
            비로그인 구매자가 알림톡/브라우저 기록에만 의존하지 않도록 하는 안전망. */}
        <div>
          <MindsResultLinkBar leadId={purchaseId} base="/inner-child/full" />
        </div>
        <p style={{ fontFamily: INK.mono, fontSize: 10, color: INK.t38, lineHeight: 1.7, textAlign: "center", marginTop: 6 }}>
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
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(60% 44% at 50% 0%, rgb(var(--icp-accent-rgb) / .28), transparent 70%)" }} />
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

/* ─── 섹션 1 ───
 * 캐릭터 프로필(TypeAvatar)은 앞선 TypeExplainCard 로 옮겼다 — 무료에서 유형 해설이 넘어오며
 * 그쪽이 '이 아이를 처음 만나는' 자리가 됐기 때문. */
function StructureCard({ n, card, domains, prediction }: { n: string; card: TypeCard; domains: DailyDomains; prediction: string }) {
  const areas: [string, string][] = [
    ["관계", domains.relationship],
    ["일", domains.work],
    ["자기관리", domains.self_care],
  ];
  return (
    <Panel>
      <SecTitle n={n}>이 아이의 전체 구조</SecTitle>

      {/* 이 아이가 만들어진 배경 (열림) */}
      <div style={{ ...clbStyle, marginTop: 18 }}>이 아이가 만들어진 배경</div>
      <Prose text={card.origin_hypothesis} />

      {/* 일상에서의 발현 — 관계·일·자기관리 영역별 풍성 해설(생성, 소제목별) */}
      <div style={{ ...clbStyle, marginTop: 28 }}>일상에서의 발현</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {areas.map(([label, body]) => (
          <div key={label}>
            <h4 style={{ fontFamily: INK.font, fontSize: 17, fontWeight: 800, color: INK.accent2, margin: "0 0 8px" }}>{label}</h4>
            <Prose text={body} />
          </div>
        ))}
      </div>

      {/* 예측형 개인화(생성) — 영역별 해설에 쐐기를 박는 구체 장면 예측. 무료에서 이관. */}
      <div style={{ marginTop: 24, padding: "18px 18px", background: "rgb(var(--icp-ink) / .035)", border: `1px solid ${INK.line}`, borderRadius: 14 }}>
        <div style={{ ...clbStyle, marginBottom: 10 }}>아마 당신은 —</div>
        <Prose text={prediction} />
      </div>
    </Panel>
  );
}

/* ─── 무료에서 옮겨온 도입 해설 (유형 설명 · 아하 모먼트 · 닮은 장면) ───
 *
 * 개편 전에는 이 셋이 무료 리포트에 있었다. 무료가 해설을 다 보여준 뒤 결제를 물어 전환이
 * 나지 않아, 무료를 '유형 진단 + 훅'까지로 좁히면서 결제 뒤로 옮겼다. 유형 설명·닮은 장면은
 * 유형카드 고정 필드라 콘텐츠 그대로 위치만 옮겼고, 왜 자꾸 이럴까(insight)는 무료 생성에서
 * 유료 생성으로 이관했다(결제하지 않는 리드에 나가던 LLM 비용 제거).
 */

/**
 * 당신의 아이는 — 유형 공개 + 기본 성향 + 강점 + 내면의 목소리.
 * 판매 페이지가 흐릿한 실루엣으로 잠가둔 캐릭터가 여기서 처음 얼굴을 드러낸다. 그래서
 * 프로필을 크게(112px) 가운데 세워 '공개' 순간의 무게를 준다.
 */
function TypeRevealCard({ n, card, childName }: { n: string; card: TypeCard; childName: string }) {
  const words = childName.trim().split(" ");
  const last = words.pop() ?? "";
  const head = words.join(" ");
  return (
    <Panel>
      <SecTitle n={n}>당신의 아이는</SecTitle>

      {/* 공개 — 16가지 중 확정된 그 아이. */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", margin: "22px 0 26px" }}>
        <TypeAvatar schemaId={card.schema_id} alt={childName} size={112} />
        <h3 style={{ fontFamily: INK.display, fontSize: 28, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.035em", color: INK.white, margin: "18px 0 0" }}>
          {head}
          {head ? " " : ""}
          <span style={{ background: INK.grad, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{last}</span>
        </h3>
        <p style={{ fontFamily: INK.font, fontSize: 15.5, lineHeight: 1.6, color: INK.t6, margin: "12px 0 0", maxWidth: 340 }}>{card.one_liner}</p>
        <span style={{ display: "inline-flex", marginTop: 18, padding: "9px 16px", borderRadius: 999, background: "rgb(var(--icp-ink) / .06)", border: `1px solid ${INK.line14}`, fontFamily: INK.font, fontSize: 13.5, fontWeight: 600, color: INK.white }}>
          {card.core_belief}
        </span>
      </div>

      <Prose text={card.traits} />

      {/* 강점 — 결함이 아니라 과발달된 능력으로 프레이밍(서술 원칙 2: 강점 선행). */}
      <div style={{ marginTop: 22, padding: "17px 18px", background: "rgb(var(--icp-accent-rgb) / .06)", border: `1px solid rgb(var(--icp-accent-rgb) / .22)`, borderRadius: 14 }}>
        <div style={clbStyle}>이 유형의 강점</div>
        <p style={{ fontFamily: INK.font, fontSize: 16.5, lineHeight: 1.8, color: "rgb(var(--icp-ink) / .9)", margin: 0 }}>{card.strength}</p>
        <p style={{ fontFamily: INK.font, fontSize: READ.noteSize, lineHeight: READ.noteLine, color: INK.t62, marginTop: 10 }}>
          없애야 할 약점이 아니라, 상황에 따라 크게 쓰이는 능력이에요. 다만 이 감각이 필요
          이상으로 오래 켜져 있을 때, 강점이 나를 소모시키곤 합니다.
        </p>
      </div>

      {/* 내면의 목소리 */}
      <div style={{ ...clbStyle, marginTop: 28 }}>Inner Voice · 내면의 목소리</div>
      <p style={{ fontFamily: INK.font, fontStyle: "italic", fontWeight: 600, fontSize: 22, lineHeight: 1.5, letterSpacing: "-0.01em", color: INK.white, margin: 0 }}>
        “{card.voice}”
      </p>
      <p style={{ fontFamily: INK.font, fontSize: READ.noteSize, lineHeight: READ.noteLine, color: INK.t62, margin: "14px 0 0" }}>
        이 아이가 마음속에서 반복하는 한마디예요. 평소엔 잘 들리지 않다가, 힘든 순간이 오면 이
        목소리가 마치 내 생각처럼 또렷하게 들립니다.
      </p>
    </Panel>
  );
}

/** 왜 자꾸 이럴까 — 아하 모먼트(생성). 강조 박스로 눈에 걸리게. */
function InsightCard({ n, text }: { n: string; text: string }) {
  return (
    <Panel>
      <SecTitle n={n}>왜 자꾸 이럴까</SecTitle>
      <div
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: 16,
          padding: "22px 20px",
          marginTop: 16,
          background: "rgb(var(--icp-accent-rgb) / .06)",
          border: `1px solid rgb(var(--icp-accent-rgb) / .28)`,
        }}
      >
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(70% 60% at 0% 0%, rgb(var(--icp-accent-rgb) / .14), transparent 62%)" }} />
        <div style={{ position: "relative" }}>
          <Prose text={text} />
        </div>
      </div>
    </Panel>
  );
}

/**
 * Signal Index — 측정 지표(유형카드 고정). 판매 페이지에서 뺀 뒤 이리로 옮겼다.
 * 도입 문구가 트레이드오프 프레임을 먼저 깐다 — 이 한 줄이 없으면 낮은 막대가 "내가 부족한
 * 것"으로 읽힌다(결핍 프레임 금지, 파운더 지시 2026-07-14).
 */
function MetricsCard({ n, card }: { n: string; card: TypeCard }) {
  const metrics = card.metrics ?? [];
  if (metrics.length === 0) return null;
  return (
    <Panel>
      <SecTitle n={n}>당신의 응답은 이렇게 측정됐어요</SecTitle>
      <p style={{ fontFamily: INK.font, fontSize: 15, lineHeight: 1.7, color: INK.t62, margin: "14px 0 22px" }}>
        높은 쪽도 낮은 쪽도 우열이 아니라, 이 아이가 어디에 힘을 몰아줬는지를 보여주는 눈금이에요.
        한쪽이 높으면 다른 쪽은 그 대가로 낮아집니다.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {metrics.map((m, i) => {
          const cool = m.tone === "cool";
          return (
            <div key={i}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontFamily: INK.font, fontSize: 16.5, fontWeight: 600, color: "rgb(var(--icp-ink) / .92)" }}>{m.name}</span>
                <span style={{ fontFamily: INK.mono, fontWeight: 600, fontSize: 12.5, fontVariantNumeric: "tabular-nums", color: cool ? "rgb(var(--icp-ink) / .55)" : INK.accent2 }}>{m.value}</span>
              </div>
              <div style={{ height: 6, background: "rgb(var(--icp-ink) / .09)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${m.value}%`, background: cool ? "rgb(var(--icp-ink) / .4)" : INK.grad, borderRadius: 3 }} />
              </div>
              {m.desc && <p style={{ fontFamily: INK.font, fontSize: READ.noteSize, lineHeight: READ.noteLine, color: INK.t62, margin: "9px 0 0" }}>{m.desc}</p>}
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/** 이런 순간, 있지 않나요 — 닮은 장면(유형카드 고정). */
function ScenesCard({ n, card }: { n: string; card: TypeCard }) {
  const scenes = card.typical_scenes ?? [];
  const notes = card.typical_scene_notes ?? [];
  if (scenes.length === 0) return null;
  return (
    <Panel>
      <SecTitle n={n}>이런 순간, 있지 않나요?</SecTitle>
      <p style={{ fontFamily: INK.font, fontSize: 15, lineHeight: 1.7, color: INK.t62, marginTop: 14 }}>
        이 아이가 사는 사람에게서 자주 되풀이되는 장면이에요. 하나쯤, 낯설지 않을 거예요.
      </p>
      <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 22 }}>
        {scenes.map((s, i) => (
          <div key={i}>
            <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
              <span style={{ fontFamily: INK.mono, fontSize: 12, fontWeight: 600, color: INK.accent2 }}>{pad(i + 1)}</span>
              <span style={{ fontFamily: INK.font, fontWeight: 700, fontSize: 17, lineHeight: 1.5, color: INK.white }}>{s}</span>
            </div>
            {notes[i] && (
              <p style={{ fontFamily: INK.font, fontSize: READ.noteSize, lineHeight: READ.noteLine, color: INK.t72, margin: "8px 0 0", paddingLeft: 22 }}>{notes[i]}</p>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ─── 섹션 2 ─── */
const LOOP_STEPS: { key: keyof LoopStages; label: string }[] = [
  { key: "trigger", label: "촉발" },
  { key: "interpretation", label: "해석" },
  { key: "action", label: "행동" },
  { key: "result", label: "결과" },
  { key: "reinforcement", label: "강화" },
];
function LoopCard({ n, stages }: { n: string; stages: LoopStages }) {
  return (
    <Panel>
      <SecTitle n={n}>같은 상처가 반복되는 구조</SecTitle>
      {/* 반복 루프 요약 다이어그램 — 촉발 → 해석 → 행동 → 결과 → 강화 */}
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, margin: "18px 0 24px" }}>
        {LOOP_STEPS.map(({ key, label }, i) => (
          <span key={key} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontFamily: INK.font,
                fontSize: 13,
                fontWeight: 700,
                color: INK.white,
                padding: "6px 11px",
                borderRadius: 999,
                background: "rgb(var(--icp-accent-rgb) / .1)",
                border: `1px solid rgb(var(--icp-accent-rgb) / .3)`,
              }}
            >
              {label}
            </span>
            {i < LOOP_STEPS.length - 1 && (
              <span style={{ fontFamily: INK.mono, fontSize: 12, color: INK.accent2 }}>→</span>
            )}
          </span>
        ))}
        <span style={{ fontFamily: INK.mono, fontSize: 11, color: INK.t38, marginLeft: 2 }}>↻</span>
      </div>

      {/* 단계별 소제목 + 본문 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {LOOP_STEPS.map(({ key, label }, i) => (
          <div key={key}>
            <h4 style={{ display: "flex", alignItems: "baseline", gap: 9, margin: "0 0 8px" }}>
              <span style={{ fontFamily: INK.mono, fontSize: 12, fontWeight: 600, color: INK.accent2 }}>{pad(i + 1)}</span>
              <span style={{ fontFamily: INK.display, fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", color: INK.white }}>{label}</span>
            </h4>
            <Prose text={stages[key]} />
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* ─── 섹션 3 ─── */
function SecondChildCard({ n, card, relation }: { n: string; card: TypeCard | null; relation: string }) {
  return (
    <Panel>
      <SecTitle n={n}>두 번째 아이의 신호</SecTitle>
      {card ? (
        <div style={{ marginTop: 16, padding: "16px 18px", background: "rgb(var(--icp-ink) / .03)", border: `1px solid ${INK.line}`, borderRadius: 12 }}>
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
    <Panel>
      <SecTitle n={n}>방어 시스템: 지킴이</SecTitle>
      <div style={{ ...clbStyle, marginTop: 16 }}>이 지킴이는</div>
      <Prose text={definition} style={{ color: INK.t72 }} />
      <div style={{ ...clbStyle, marginTop: 26 }}>당신의 지킴이는 이렇게 작동해요</div>
      <Prose text={anatomy} />
    </Panel>
  );
}

/* ─── 섹션 5 ─── */
function CoreNeedCard({ n, bridge, coreNeed }: { n: string; bridge: string; coreNeed: string | null }) {
  return (
    <Panel>
      <SecTitle n={n}>이 아이가 정말 원했던 것</SecTitle>
      <Prose text={bridge} style={{ marginTop: 16 }} />
      {coreNeed ? (
        <div
          style={{
            marginTop: 18,
            padding: "18px 20px",
            background: "rgb(var(--icp-accent-rgb) / .06)",
            border: `1px solid rgb(var(--icp-accent-rgb) / .25)`,
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

/* ─── 무료에서 옮겨온 해설 카드 (자주 하는 생각 · 스트레스 신호) ───
 *
 * 둘 다 primaryCard(TypeCard) 고정 필드로 렌더된다. 원래 무료 리포트(현 InnerChildSalesPage)
 * 에 있던 카드를 결제 뒤로 옮긴 것 — 콘텐츠는 그대로, 공개 위치만 유료로.
 */

/** 자주 하는 생각 — 대사 + 해석 + 믿음의 기원. */
function ThoughtsCard({ n, card }: { n: string; card: TypeCard }) {
  const notes = card.auto_thought_notes ?? [];
  return (
    <Panel>
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
      <div style={{ marginTop: 18, padding: "16px 18px", background: "rgb(var(--icp-ink) / .03)", border: `1px solid ${INK.line}`, borderRadius: 12 }}>
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
    <Panel>
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
      <p style={{ fontFamily: INK.font, fontSize: 14.5, lineHeight: 1.7, color: INK.t62, marginTop: 20, padding: "13px 15px", background: "rgb(var(--icp-ink) / .03)", border: `1px solid ${INK.line}`, borderRadius: 10 }}>
        이런 순간, 이 아이는 ‘{card.surface_reaction}’ 반응으로 먼저 나섭니다. 왜 그런지는 뒤의
        ‘지킴이’ 장에서 이어집니다.
      </p>
    </Panel>
  );
}

/** 이 아이가 만들어내는 갈등과 문제 — 생성 문단. (겉과 속 카드는 제거됨.) */
function ConflictCard({ n, text }: { n: string; text: string }) {
  return (
    <Panel>
      <SecTitle n={n}>이 아이가 만들어내는 갈등과 문제</SecTitle>
      <p style={{ fontFamily: INK.font, fontSize: 15, lineHeight: 1.7, color: INK.t62, marginTop: 14 }}>
        이 아이가 관계와 일에서 실제로 어떤 마찰을 만들어내는지예요. 내 탓이 아니라, 이 아이가
        스스로를 지키려다 남긴 자국이에요.
      </p>
      <Prose text={text} style={{ marginTop: 16 }} />
    </Panel>
  );
}

/** 이 아이와 잘 지내는 법 — 실용 해결책(생성 문단). 박스 없이 열린 섹션. */
function SolutionCard({ n, text }: { n: string; text: string }) {
  return (
    <Panel>
      <SecTitle n={n}>이 아이와 잘 지내는 법</SecTitle>
      <p style={{ fontFamily: INK.font, fontSize: READ.noteSize, lineHeight: 1.75, color: INK.t62, marginTop: 14 }}>
        이 아이를 없애는 게 아니라, 데리고 잘 살아가는 법이에요. 오늘부터 바로 써볼 수 있는
        방법들이에요.
      </p>
      <Prose text={text} style={{ marginTop: 16 }} />
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
      <Panel>
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
                    border: `1.5px solid rgb(var(--icp-accent-rgb) / .5)`,
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
          background: "rgb(var(--icp-accent-rgb) / .08)",
          border: `1px solid rgb(var(--icp-accent-rgb) / .32)`,
        }}
      >
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "radial-gradient(74% 60% at 100% 0%, rgb(var(--icp-accent-rgb) / .14), transparent 60%)" }} />
        <div style={{ position: "relative" }}>
          <div style={clbStyle}>다음 한 걸음</div>
          <h3 style={{ fontFamily: INK.display, fontSize: 19, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.5, color: INK.white, margin: "0 0 10px" }}>
            이 아이, 혼자 마주하기 벅차다면
            <br />
            1급 심리상담사와 함께 이야기해봐요.
          </h3>
          <p style={{ fontFamily: INK.font, fontSize: 13.5, color: INK.t62, lineHeight: 1.7, margin: "0 0 20px" }}>
            리포트에서 만난 내면 아이의 패턴을, 상담심리사 1급(한국상담심리학회)과 1:1로 더 깊이 들여다볼 수 있어요. 카카오톡으로 편하게 문의해주세요.
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
            💬 카카오톡으로 상담 문의하기
          </a>
        </div>
      </div>
    </div>
  );
}
