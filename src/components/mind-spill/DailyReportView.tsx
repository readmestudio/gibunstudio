import Link from "next/link";
import type { PeriodReport } from "@/lib/mind-spill/types";

type Props = {
  periodReport: PeriodReport;
  dateRangeLabel: string;
};

/**
 * Period 종합 리포트 (결제 + LLM 완료 후) 표시.
 * Coach Note + Mirror Patterns + Strengths + Prescriptions 4섹션.
 */
export function DailyReportView({ periodReport, dateRangeLabel }: Props) {
  const coach = periodReport.coach_note;
  const strengths = periodReport.strengths_report;
  const prescriptions = periodReport.prescriptions ?? [];

  return (
    <div className="mind-spill">
      <main className="ms-container" style={{ paddingTop: 48, paddingBottom: 96 }}>
        <Link
          href="/dashboard/mind-spill"
          style={{
            display: "inline-block",
            fontFamily: "var(--ms-font-mono)",
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--ms-ink-3)",
            textDecoration: "none",
            marginBottom: 32,
            fontWeight: 500,
          }}
        >
          ← 캘린더로 돌아가기
        </Link>

        <header style={{ marginBottom: 48 }}>
          <div className="ms-eyebrow" style={{ marginBottom: 14 }}>
            PERIOD REPORT · {dateRangeLabel} · {periodReport.entry_ids.length}일치
          </div>
          <h1
            style={{
              fontFamily: "var(--ms-font-display)",
              fontWeight: 700,
              fontSize: "clamp(32px, 5vw, 50px)",
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              color: "var(--ms-ink)",
              margin: 0,
              wordBreak: "keep-all",
            }}
          >
            {coach?.title ?? `${dateRangeLabel}의 발견`}
          </h1>
          {coach?.lede && (
            <p
              style={{
                marginTop: 20,
                fontSize: 17,
                color: "var(--ms-ink-2, var(--ms-ink))",
                lineHeight: 1.7,
                wordBreak: "keep-all",
                maxWidth: 600,
                fontWeight: 500,
              }}
            >
              {coach.lede}
            </p>
          )}
        </header>

        {/* i. Coach Note */}
        {coach && (
          <Section eyebrow="i. Coach's Note" title="옆에서 본 사람의 노트">
            {coach.intro && <p style={prose}>{coach.intro}</p>}
            {coach.findings && coach.findings.length > 0 && (
              <div
                style={{
                  marginTop: 24,
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                }}
              >
                {coach.findings.map((f, i) => (
                  <Finding key={i} num={f.num} text={f.text} />
                ))}
              </div>
            )}
            {coach.closing && (
              <div
                style={{
                  marginTop: 32,
                  padding: "20px 22px",
                  background: "var(--ms-surface)",
                  borderLeft: "3px solid var(--ms-accent)",
                  borderRadius: "4px 12px 12px 4px",
                }}
              >
                <p style={{ ...prose, margin: 0 }}>{coach.closing}</p>
              </div>
            )}
          </Section>
        )}

        {/* ii. Patterns (3일간 반복) */}
        {periodReport.patterns && periodReport.patterns.length > 0 && (
          <Section eyebrow="ii. Patterns" title="반복되는 패턴">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {periodReport.patterns.map((p, i) => (
                <div
                  key={i}
                  style={{
                    padding: 18,
                    border: "1px solid var(--ms-line)",
                    borderRadius: 12,
                    background: "var(--ms-surface)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--ms-font-display)",
                      fontWeight: 600,
                      fontSize: 16,
                      color: "var(--ms-ink)",
                      marginBottom: 6,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {p.title}
                  </div>
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--ms-ink-3)",
                      lineHeight: 1.7,
                      margin: 0,
                    }}
                  >
                    {p.description}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* iii. Strengths */}
        {strengths && (
          <Section eyebrow="iii. Strengths" title="당신에게서 발견한 강점">
            {strengths.narrative && <p style={prose}>{strengths.narrative}</p>}
            {strengths.top_strengths && strengths.top_strengths.length > 0 && (
              <div
                style={{
                  marginTop: 24,
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: 12,
                }}
              >
                {strengths.top_strengths.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      padding: 18,
                      background: "var(--ms-surface)",
                      border: "1px solid var(--ms-line)",
                      borderRadius: 12,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--ms-font-display)",
                        fontWeight: 600,
                        fontSize: 17,
                        color: "var(--ms-ink)",
                        marginBottom: 6,
                        letterSpacing: "-0.015em",
                      }}
                    >
                      {s.name}
                    </div>
                    <p
                      style={{
                        fontSize: 14,
                        color: "var(--ms-ink-3)",
                        lineHeight: 1.7,
                        margin: 0,
                      }}
                    >
                      {s.reason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* iv. Prescriptions */}
        {prescriptions.length > 0 && (
          <Section eyebrow="iv. Prescription" title="다음에 해볼 수 있는 것">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {prescriptions.map((p) => (
                <PrescriptionCard key={p.num} prescription={p} />
              ))}
            </div>
          </Section>
        )}

        {/* Counseling 제안 */}
        {coach?.counseling && (
          <section
            style={{
              marginTop: 56,
              padding: "28px 24px",
              border: "2px solid var(--ms-ink)",
              borderRadius: 16,
              background: "var(--ms-surface)",
            }}
          >
            <div className="ms-eyebrow" style={{ marginBottom: 10 }}>
              1:1 상담 제안
            </div>
            <h3
              style={{
                fontFamily: "var(--ms-font-display)",
                fontWeight: 600,
                fontSize: 19,
                color: "var(--ms-ink)",
                margin: "0 0 10px",
                letterSpacing: "-0.02em",
              }}
            >
              {coach.counseling.topic}
            </h3>
            <p style={{ ...prose, margin: "0 0 14px" }}>{coach.counseling.issue}</p>
            {coach.counseling.outcomes &&
              coach.counseling.outcomes.length > 0 && (
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 18,
                    fontSize: 14,
                    color: "var(--ms-ink-3)",
                    lineHeight: 1.7,
                  }}
                >
                  {coach.counseling.outcomes.map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              )}
          </section>
        )}
      </main>
    </div>
  );
}

/* ─── Sub-components ─── */

const prose: React.CSSProperties = {
  fontSize: 15,
  color: "var(--ms-ink-2, var(--ms-ink))",
  lineHeight: 1.8,
  wordBreak: "keep-all",
  marginBottom: 14,
};

function Section({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        marginTop: 56,
        paddingTop: 32,
        borderTop: "1px solid var(--ms-line)",
      }}
    >
      <div className="ms-eyebrow" style={{ marginBottom: 10 }}>
        {eyebrow}
      </div>
      <h2
        style={{
          fontFamily: "var(--ms-font-display)",
          fontWeight: 600,
          fontSize: "clamp(22px, 3.5vw, 28px)",
          color: "var(--ms-ink)",
          margin: "0 0 20px",
          letterSpacing: "-0.025em",
          lineHeight: 1.2,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Finding({ num, text }: { num: string; text: string }) {
  return (
    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
      <span
        style={{
          fontFamily: "var(--ms-font-mono)",
          fontSize: 11,
          letterSpacing: "0.08em",
          color: "var(--ms-ink-3)",
          fontWeight: 600,
          paddingTop: 4,
          flexShrink: 0,
          width: 24,
        }}
      >
        {num}.
      </span>
      <p style={{ ...prose, margin: 0, flex: 1 }}>{text}</p>
    </div>
  );
}

function PrescriptionCard({
  prescription,
}: {
  prescription: {
    num: string;
    title: string;
    body: string;
    meta: Array<{ key: string; val: string }>;
  };
}) {
  return (
    <div
      style={{
        padding: 20,
        border: "1px solid var(--ms-line)",
        borderRadius: 12,
        background: "var(--ms-surface)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--ms-font-mono)",
          fontSize: 11,
          color: "var(--ms-ink-3)",
          letterSpacing: "0.08em",
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        Rx. {prescription.num}
      </div>
      <div
        style={{
          fontFamily: "var(--ms-font-display)",
          fontWeight: 600,
          fontSize: 17,
          color: "var(--ms-ink)",
          marginBottom: 10,
          letterSpacing: "-0.015em",
        }}
      >
        {prescription.title}
      </div>
      <p
        style={{
          fontSize: 14,
          color: "var(--ms-ink-2, var(--ms-ink))",
          lineHeight: 1.75,
          margin: 0,
        }}
      >
        {prescription.body}
      </p>
      {prescription.meta && prescription.meta.length > 0 && (
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px dashed var(--ms-line)",
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            fontSize: 12,
            color: "var(--ms-ink-3)",
          }}
        >
          {prescription.meta.map((m, i) => (
            <span key={i}>
              <b style={{ color: "var(--ms-ink)", fontWeight: 600 }}>
                {m.key}:
              </b>{" "}
              {m.val}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
