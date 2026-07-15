/**
 * 영어 퍼널 — 손으로 쓴 유료 리포트 뷰(`/inner-child/en/full/[id]`).
 *
 * 무료 리포트(InnerChildEnFreeReport)와 같은 ink-orange 스크롤 리포트 룩을 쓴다. 다른 점:
 *  - 본문이 LLM 생성이 아니라 manual-reports.ts 의 손원고(블록 배열)
 *  - 페이월/요청 CTA 없음 — 이미 받은 사람만 여는 페이지다
 *  - 서버 컴포넌트로 충분(인터랙션 없음) → "use client" 를 쓰지 않는다
 */

import type { CSSProperties, ReactNode } from "react";
import { DISCLAIMER } from "@/lib/minds/inner-child/en/questions";
import { TypeAvatar } from "@/components/minds/inner-child/report/TypeAvatar";
import type {
  ManualBlock,
  ManualReport,
  ManualSection,
} from "@/lib/minds/inner-child/en/manual-reports";

/* ─── ink-orange tokens (무료 리포트와 동일) ─── */
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
  t6: "rgba(255,255,255,.6)",
  t4: "rgba(255,255,255,.4)",
  t38: "rgba(255,255,255,.38)",
  font: "'Pretendard',-apple-system,BlinkMacSystemFont,system-ui,sans-serif",
  display: "'Inter','Pretendard',-apple-system,system-ui,sans-serif",
  mono: "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace",
};

const clbStyle: CSSProperties = {
  fontFamily: INK.mono,
  fontWeight: 600,
  fontSize: 9.5,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: INK.mute,
  marginBottom: 12,
};

const bodyStyle: CSSProperties = {
  fontFamily: INK.font,
  fontSize: 17,
  lineHeight: 1.9,
  letterSpacing: "-0.006em",
  color: INK.t82,
  margin: 0,
};

export function InnerChildEnFullReport({ report }: { report: ManualReport }) {
  return (
    <div style={{ background: INK.shell, minHeight: "100dvh", paddingBottom: 56 }}>
      <style>{`
        @keyframes icRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
      `}</style>

      <div
        style={{
          maxWidth: 440,
          margin: "0 auto",
          padding: "14px 14px 0",
          display: "flex",
          flexDirection: "column",
          gap: 22,
        }}
      >
        <Hero report={report} />

        <div style={{ padding: "2px 4px 0", animation: "icRise .4s ease both", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={clbStyle}>Your Full Report</div>
          {report.intro.map((t, i) => (
            <p key={i} style={bodyStyle}>
              {t}
            </p>
          ))}
        </div>

        {report.sections.map((s) => (
          <Section key={s.n} section={s} />
        ))}

        <ClosingSection lines={report.closing} />

        <p
          style={{
            fontFamily: INK.mono,
            fontSize: 10,
            color: INK.t38,
            lineHeight: 1.7,
            textAlign: "center",
            marginTop: 4,
          }}
        >
          GIBUN Report · INNER CHILD FULL REPORT · {DISCLAIMER}
        </p>
      </div>
    </div>
  );
}

/* ─────────────── hero ─────────────── */

function Hero({ report }: { report: ManualReport }) {
  const words = report.child_name.trim().split(" ");
  const last = words.pop() ?? "";
  const head = words.join(" ");

  return (
    <header style={{ padding: "26px 4px 0", animation: "icRise .4s ease both" }}>
      <div style={{ ...clbStyle, color: INK.accent2 }}>Beta reader edition</div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <TypeAvatar schemaId={report.schema_id} alt={report.child_name} size={112} />
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontFamily: INK.display,
              fontSize: 27,
              fontWeight: 800,
              letterSpacing: "-0.035em",
              lineHeight: 1.15,
              color: INK.white,
              margin: 0,
            }}
          >
            {head}{" "}
            <span
              style={{
                background: INK.grad,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {last}
            </span>
          </h1>
        </div>
      </div>
      <p
        style={{
          fontFamily: INK.font,
          fontSize: 15,
          lineHeight: 1.65,
          letterSpacing: "-0.01em",
          color: INK.t6,
          margin: "14px 0 0",
        }}
      >
        {report.hook}
      </p>
    </header>
  );
}

/* ─────────────── section ─────────────── */

function Section({ section }: { section: ManualSection }) {
  return (
    <section
      style={{
        padding: "26px 4px 0",
        borderTop: "1px solid rgba(255,255,255,.07)",
        animation: "icRise .4s ease both",
      }}
    >
      <SecTitle n={section.n}>{section.title}</SecTitle>
      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 16 }}>
        {section.blocks.map((b, i) => (
          <Block key={i} block={b} />
        ))}
      </div>
    </section>
  );
}

function SecTitle({ n, children }: { n: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
      <span style={{ fontFamily: INK.mono, fontSize: 12, fontWeight: 600, color: INK.accent2 }}>{n}</span>
      <span
        style={{
          fontFamily: INK.display,
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: INK.white,
          lineHeight: 1.25,
        }}
      >
        {children}
      </span>
    </div>
  );
}

/* ─────────────── blocks ─────────────── */

function Block({ block }: { block: ManualBlock }) {
  switch (block.kind) {
    case "p":
      return <p style={bodyStyle}>{block.text}</p>;

    // 본인이 직접 쓴 문장 — 리포트의 근거라서 시각적으로 가장 강하게 둔다.
    case "quote":
      return (
        <blockquote
          style={{
            margin: 0,
            padding: "16px 18px",
            borderLeft: `2px solid ${INK.accent}`,
            background: INK.surface,
            borderRadius: "0 12px 12px 0",
          }}
        >
          <p
            style={{
              fontFamily: INK.font,
              fontSize: 17,
              lineHeight: 1.7,
              letterSpacing: "-0.01em",
              color: INK.white,
              fontWeight: 600,
              margin: 0,
            }}
          >
            “{block.text}”
          </p>
          <p style={{ fontFamily: INK.mono, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: INK.t4, margin: "10px 0 0" }}>
            your words
          </p>
        </blockquote>
      );

    case "callout":
      return (
        <div
          style={{
            padding: "18px 18px",
            background: INK.surface,
            border: `1px solid ${INK.border}`,
            borderRadius: 14,
          }}
        >
          <div style={{ ...clbStyle, color: INK.accent2, marginBottom: 8 }}>{block.label}</div>
          <p style={{ ...bodyStyle, fontSize: 16, lineHeight: 1.85 }}>{block.text}</p>
        </div>
      );

    case "steps":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {block.items.map((it, i) => (
            <div key={i} style={{ display: "flex", gap: 12 }}>
              <span
                aria-hidden
                style={{ width: 5, borderRadius: 999, background: INK.grad, flex: "0 0 auto", opacity: 0.55 }}
              />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: INK.display,
                    fontSize: 15.5,
                    fontWeight: 800,
                    letterSpacing: "-0.015em",
                    color: INK.white,
                    marginBottom: 6,
                  }}
                >
                  {it.title}
                </div>
                <p style={{ ...bodyStyle, fontSize: 16, lineHeight: 1.85, color: INK.t72 }}>{it.text}</p>
              </div>
            </div>
          ))}
        </div>
      );

    // 리포트의 못 — 한 문장만 크게.
    case "line":
      return (
        <p
          style={{
            fontFamily: INK.display,
            fontSize: 21,
            fontWeight: 800,
            letterSpacing: "-0.025em",
            lineHeight: 1.45,
            margin: "4px 0",
            background: INK.grad,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {block.text}
        </p>
      );
  }
}

/* ─────────────── closing ─────────────── */

function ClosingSection({ lines }: { lines: string[] }) {
  return (
    <section
      style={{
        padding: "26px 4px 0",
        borderTop: "1px solid rgba(255,255,255,.07)",
        animation: "icRise .4s ease both",
      }}
    >
      <div style={{ ...clbStyle, color: INK.accent2 }}>Last thing</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {lines.map((t, i) => (
          <p key={i} style={bodyStyle}>
            {t}
          </p>
        ))}
      </div>
    </section>
  );
}
