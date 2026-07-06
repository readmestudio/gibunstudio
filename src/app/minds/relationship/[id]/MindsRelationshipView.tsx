"use client";

/**
 * 유료 리포트 뷰 — 생성/로딩/에러 상태 + 본문 렌더.
 *
 * 최초 진입(캐시 없음)이면 마운트 시 생성 라우트를 호출하고(~50초) 진행 화면을 보여준다.
 * 캐시가 있으면(server 에서 initialReport 주입) 즉시 본문을 렌더한다. 디자인은 무료
 * /minds 와 같은 '콰이엇 에디토리얼' 토큰(M)을 따른다(모노톤·헤어라인·각진 블록).
 */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { M } from "@/components/minds/quiet-editorial";
import type {
  RelationshipReport,
  RolePresence,
  RoleSlotKey,
} from "@/lib/minds/relationship-report";

const PRESENCE_KO: Record<RolePresence, string> = {
  dominant: "지금 무대 중심",
  active: "작동 중",
  dormant: "이번엔 잠잠",
};

const LOADING_STEPS = [
  "답변을 다시 읽고 있어요",
  "다섯 배역을 캐스팅하는 중",
  "배역들의 관계를 잇는 중",
  "당신만의 처방을 쓰는 중",
  "거의 다 됐어요",
];

export function MindsRelationshipView({
  purchaseId,
  status,
  initialReport,
}: {
  purchaseId: string;
  status: string | null;
  initialReport: RelationshipReport | null;
}) {
  const [report, setReport] = useState<RelationshipReport | null>(initialReport);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const running = useRef(false);

  useEffect(() => {
    if (report || status !== "confirmed" || running.current) return;
    running.current = true;
    setError(null);
    (async () => {
      try {
        const res = await fetch("/api/minds/relationship", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ purchaseId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.report) {
          setError(data?.error || "리포트를 불러오지 못했어요.");
        } else {
          setReport(data.report as RelationshipReport);
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

  if (report) return <ReportBody report={report} />;
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

/* ───────────────── 상태 화면 ───────────────── */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: M.paper, minHeight: "100vh" }}>
      <div style={{ maxWidth: 448, margin: "0 auto", padding: "0 24px" }}>
        {children}
      </div>
    </div>
  );
}

function Centered({ title, body }: { title: string; body: string }) {
  return (
    <Shell>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 12,
        }}
      >
        <div style={{ fontFamily: M.font, fontWeight: 800, fontSize: 20, color: M.ink }}>
          {title}
        </div>
        <p style={{ fontFamily: M.font, fontSize: 14, color: M.ink2, lineHeight: 1.7, margin: 0 }}>
          {body}
        </p>
      </div>
    </Shell>
  );
}

function LoadingView() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () => setStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)),
      9000
    );
    return () => clearInterval(t);
  }, []);
  return (
    <Shell>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 18,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            border: `2px solid ${M.line}`,
            borderTopColor: M.ink,
            borderRadius: "50%",
            animation: "mr-spin 0.9s linear infinite",
          }}
        />
        <div style={{ fontFamily: M.font, fontWeight: 700, fontSize: 17, color: M.ink }}>
          {LOADING_STEPS[step]}
        </div>
        <p style={{ fontFamily: M.font, fontSize: 13, color: M.mute, lineHeight: 1.7, margin: 0 }}>
          내 답변을 다시 읽고 다섯 배역과 그 관계를 분석하고 있어요.
          <br />
          20~50초쯤 걸려요. 이 화면을 닫아도 괜찮아요 — 제작이 끝나면
          <br />
          <a
            href="/minds/my"
            style={{ color: M.ink, fontWeight: 700, textDecoration: "underline" }}
          >
            내 리포트 대시보드
          </a>
          에서 언제든 다시 확인할 수 있어요.
        </p>
        <style>{`@keyframes mr-spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </Shell>
  );
}

function ErrorView({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <Shell>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 16,
        }}
      >
        <div style={{ fontFamily: M.font, fontWeight: 800, fontSize: 19, color: M.ink }}>
          리포트를 만드는 데 문제가 생겼어요
        </div>
        <p style={{ fontFamily: M.font, fontSize: 14, color: M.ink2, lineHeight: 1.7, margin: 0 }}>
          {error}
        </p>
        <button
          type="button"
          onClick={onRetry}
          style={{
            marginTop: 4,
            padding: "14px 28px",
            borderRadius: 2,
            background: M.ink,
            color: M.paper,
            fontFamily: M.font,
            fontWeight: 700,
            fontSize: 15,
            border: "none",
            cursor: "pointer",
          }}
        >
          다시 시도하기
        </button>
        <p style={{ fontFamily: M.font, fontSize: 12.5, color: M.mute, margin: 0 }}>
          이미 결제는 완료됐어요. 계속 안 되면 카카오톡 채널로 문의해주세요.
        </p>
      </div>
    </Shell>
  );
}

/* ───────────────── 리포트 본문 ───────────────── */

const monoLabel: CSSProperties = {
  fontFamily: M.mono,
  fontSize: 10.5,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: M.mute,
};

function SecLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: M.font,
        fontSize: 23,
        fontWeight: 800,
        letterSpacing: "-0.02em",
        color: M.ink,
        lineHeight: 1.3,
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  );
}

function SecIntro({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: M.font, fontSize: 13.5, color: M.mute, lineHeight: 1.6, margin: "0 0 24px" }}>
      {children}
    </p>
  );
}

function Section({
  label,
  intro,
  children,
  last,
}: {
  label: string;
  intro?: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <section
      style={{
        padding: "40px 0",
        borderBottom: last ? "none" : `1px solid ${M.line}`,
      }}
    >
      <SecLabel>{label}</SecLabel>
      {intro ? <SecIntro>{intro}</SecIntro> : null}
      {children}
    </section>
  );
}

function ReportBody({ report }: { report: RelationshipReport }) {
  const labelOf = (slot: RoleSlotKey) =>
    report.roles.find((r) => r.slot === slot)?.label ?? slot;
  const hc = report.headlineConflict;

  return (
    <div style={{ background: M.paper, minHeight: "100vh" }}>
      <div style={{ maxWidth: 448, margin: "0 auto", padding: "0 24px 64px" }}>
        {/* 표지 */}
        <header style={{ padding: "56px 0 36px", borderBottom: `2px solid ${M.ink}` }}>
          <div style={{ ...monoLabel, marginBottom: 18 }}>MINDS · 내 마음 배역표</div>
          <h1
            style={{
              fontFamily: M.font,
              fontSize: 31,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              lineHeight: 1.25,
              color: M.ink,
              margin: 0,
            }}
          >
            내 마음 속<br />다섯 가지 배역과 그 관계
          </h1>
          {report.metaphor ? (
            <div style={{ marginTop: 22, paddingTop: 18, borderTop: `2px solid ${M.ink}` }}>
              <div style={{ ...monoLabel, fontSize: 10, marginBottom: 10 }}>한 줄로 말하면</div>
              <p
                style={{
                  fontFamily: M.font,
                  fontSize: 17,
                  fontWeight: 600,
                  lineHeight: 1.7,
                  color: M.ink,
                  margin: 0,
                }}
              >
                {report.metaphor}
              </p>
            </div>
          ) : null}
        </header>

        {/* 01 다섯 배역 */}
        <Section label="01 · 다섯 배역">
          {report.roles.map((r, i) => {
            const dim = r.presence === "dormant";
            return (
              <article
                key={r.slot}
                style={{
                  padding: "26px 0",
                  borderBottom:
                    i === report.roles.length - 1 ? "none" : `1px solid ${M.line}`,
                  opacity: dim ? 0.5 : 1,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontFamily: M.mono, fontSize: 12, color: M.mute }}>
                    0{i + 1}
                  </span>
                  <span style={{ fontFamily: M.font, fontSize: 19, fontWeight: 800, letterSpacing: "-0.01em" }}>
                    {r.label}
                  </span>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontFamily: M.mono,
                      fontSize: 9.5,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      padding: "3px 8px",
                      border: `1px solid ${r.presence === "dormant" ? M.line : M.ink}`,
                      background: r.presence === "dominant" ? M.ink : "transparent",
                      color: r.presence === "dominant" ? M.paper : r.presence === "dormant" ? M.mute : M.ink,
                    }}
                  >
                    {PRESENCE_KO[r.presence]}
                  </span>
                </div>
                {r.innerVoice ? (
                  <h3 style={{ fontFamily: M.font, fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", margin: "0 0 10px" }}>
                    {r.innerVoice}
                  </h3>
                ) : null}
                <p style={{ fontFamily: M.font, fontSize: 14.5, color: M.ink2, lineHeight: 1.7, margin: "0 0 10px" }}>
                  {r.howItWorks}
                </p>
                {r.protects ? (
                  <p style={{ fontFamily: M.font, fontSize: 14.5, color: M.ink, lineHeight: 1.7, margin: "0 0 12px" }}>
                    {r.protects}
                  </p>
                ) : null}
                {r.evidenceQuote ? (
                  <blockquote
                    style={{
                      margin: "12px 0 0",
                      padding: "10px 0 10px 16px",
                      borderLeft: `2px solid ${M.ink}`,
                      color: M.ink2,
                      fontSize: 13.5,
                      fontStyle: "italic",
                      fontFamily: M.font,
                    }}
                  >
                    “{r.evidenceQuote}”
                  </blockquote>
                ) : null}
              </article>
            );
          })}
        </Section>

        {/* 02 방어기제 */}
        {report.defenseMechanisms.length ? (
          <Section
            label="02 · 자주 쓰는 방어기제"
            intro="다섯 배역이 힘을 합쳐 만들어낸, 당신이 자주 꺼내 드는 마음의 방어 전략이에요."
          >
            {report.defenseMechanisms.map((d, i) => (
              <article
                key={i}
                style={{
                  padding: "26px 0",
                  borderBottom:
                    i === report.defenseMechanisms.length - 1 ? "none" : `1px solid ${M.line}`,
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                  <span style={{ fontFamily: M.mono, fontSize: 13, color: M.accent, fontWeight: 700 }}>
                    D{i + 1}
                  </span>
                  <h3 style={{ fontFamily: M.font, fontSize: 18, fontWeight: 800, letterSpacing: "-0.01em", margin: 0, lineHeight: 1.35 }}>
                    {d.name}
                  </h3>
                </div>
                {d.fromRoles.length ? (
                  <div style={{ margin: "8px 0 0", display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {d.fromRoles.map((s) => (
                      <span
                        key={s}
                        style={{
                          fontFamily: M.font,
                          fontSize: 11,
                          color: M.ink2,
                          border: `1px solid ${M.line}`,
                          padding: "2px 8px",
                          borderRadius: 2,
                        }}
                      >
                        {labelOf(s)}
                      </span>
                    ))}
                  </div>
                ) : null}
                <p style={{ fontFamily: M.font, fontSize: 14.5, color: M.ink2, lineHeight: 1.7, margin: "10px 0 0" }}>
                  {d.howYouUseIt}
                </p>
              </article>
            ))}
          </Section>
        ) : null}

        {/* 03 마음의 목소리 TOP 5 */}
        {report.innerVoices.length ? (
          <Section
            label="03 · 마음의 목소리 TOP 5"
            intro="이런 당신이 머릿속에서 자주 되뇌었을 법한 말들이에요."
          >
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {report.innerVoices.map((v, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                    padding: "15px 0",
                    borderBottom:
                      i === report.innerVoices.length - 1 ? "none" : `1px solid ${M.line}`,
                  }}
                >
                  <span style={{ fontFamily: M.mono, fontSize: 18, fontWeight: 800, color: M.ink, minWidth: 22, lineHeight: 1.4 }}>
                    {i + 1}
                  </span>
                  <span style={{ fontFamily: M.font, fontSize: 15.5, fontWeight: 600, color: M.ink, lineHeight: 1.55 }}>
                    “{v}”
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {/* 04 가장 센 갈등 */}
        <Section label="04 · 가장 센 갈등">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14, margin: "6px 0 22px" }}>
            <span style={{ fontFamily: M.font, fontSize: 20, fontWeight: 800, border: `2px solid ${M.ink}`, padding: "10px 16px" }}>
              {labelOf(hc.a)}
            </span>
            <span style={{ fontFamily: M.mono, fontSize: 16, color: M.accent, fontWeight: 700 }}>⇄</span>
            <span style={{ fontFamily: M.font, fontSize: 20, fontWeight: 800, border: `2px solid ${M.ink}`, padding: "10px 16px" }}>
              {labelOf(hc.b)}
            </span>
          </div>
          <div style={{ fontFamily: M.font, fontWeight: 800, fontSize: 13, margin: "18px 0 6px" }}>반복되는 악순환</div>
          <p style={{ fontFamily: M.font, fontSize: 14.5, color: M.ink2, lineHeight: 1.7, margin: 0 }}>{hc.loop}</p>
          <div style={{ fontFamily: M.font, fontWeight: 800, fontSize: 13, margin: "18px 0 6px" }}>고리를 푸는 법</div>
          <p style={{ fontFamily: M.font, fontSize: 14.5, color: M.ink2, lineHeight: 1.7, margin: 0 }}>{hc.mediation}</p>
        </Section>

        {/* 05 나머지 관계도 */}
        {report.relationships.length ? (
          <Section label="05 · 나머지 관계도">
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {report.relationships.map((e, i) => (
                <li
                  key={i}
                  style={{
                    padding: "14px 0",
                    borderBottom:
                      i === report.relationships.length - 1 ? "none" : `1px solid ${M.line}`,
                  }}
                >
                  <span style={{ display: "block", fontFamily: M.font, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                    {labelOf(e.a)} <span style={{ color: M.accent }}>×</span> {labelOf(e.b)}
                  </span>
                  <span style={{ fontFamily: M.font, fontSize: 13.5, color: M.ink2, lineHeight: 1.65 }}>
                    {e.dynamic}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {/* 06 이럴 땐, 이렇게 */}
        {report.actions.length ? (
          <Section
            label="06 · 이럴 땐, 이렇게"
            intro="영혼 없는 조언 말고, 당신의 패턴에 진짜 듣는 처방이에요."
          >
            {report.actions.map((a, i) => (
              <article
                key={i}
                style={{ border: `2px solid ${M.ink}`, padding: "20px 22px", marginBottom: i === report.actions.length - 1 ? 0 : 14 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <span
                    style={{
                      fontFamily: M.mono,
                      width: 26,
                      height: 26,
                      border: `1.5px solid ${M.ink}`,
                      borderRadius: "50%",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 800,
                      flex: "0 0 auto",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ ...monoLabel, fontSize: 10 }}>이런 생각이 들 때</span>
                </div>
                <p style={{ fontFamily: M.font, fontSize: 16.5, fontWeight: 800, letterSpacing: "-0.01em", lineHeight: 1.45, margin: "0 0 14px" }}>
                  “{a.trigger}”
                </p>
                <div style={{ padding: "1px 0 1px 14px", borderLeft: `3px solid ${M.ink}`, marginBottom: a.why ? 12 : 0 }}>
                  <span style={{ display: "block", fontFamily: M.mono, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: M.accent, fontWeight: 700, marginBottom: 6 }}>
                    이렇게 해보세요
                  </span>
                  <p style={{ fontFamily: M.font, fontSize: 14.5, color: M.ink, fontWeight: 600, lineHeight: 1.6, margin: 0 }}>
                    {a.action}
                  </p>
                </div>
                {a.why ? (
                  <p style={{ fontFamily: M.font, fontSize: 13.5, color: M.ink2, lineHeight: 1.65, margin: 0 }}>
                    <span style={{ fontWeight: 800, color: M.ink }}>왜 도움이 되냐면 — </span>
                    {a.why}
                  </p>
                ) : null}
              </article>
            ))}
          </Section>
        ) : null}

        {/* 07 마무리 편지 */}
        <Section label="07 · 마무리 편지" last>
          <p style={{ fontFamily: M.font, fontSize: 15, color: M.ink, lineHeight: 1.85, whiteSpace: "pre-line", margin: 0 }}>
            {report.closing}
          </p>
        </Section>

        <footer style={{ padding: "30px 0 0", textAlign: "center" }}>
          <span style={monoLabel}>GIBUN STUDIO</span>
        </footer>
      </div>
    </div>
  );
}
