import { Eyebrow } from "./Eyebrow";
import { Mono } from "./Mono";

/**
 * V2 타이틀 블록 — 60px FIG gutter + orange eyebrow + 한글 h1 + 영문 sub + 본문.
 */
export function V2TitleBlock({
  idx,
  total = 6,
  eyebrowEn,
  headlineKr,
  headlineEn,
  sub,
}: {
  idx: number;
  total?: number;
  eyebrowEn: string;
  headlineKr: string;
  headlineEn?: string;
  sub?: string;
}) {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: "60px 1fr",
        gap: 24,
        padding: "36px 20px 28px 20px",
        borderBottom: "1px solid var(--v2-line)",
      }}
    >
      <div style={{ paddingTop: 4 }}>
        <Mono size={10} weight={600} color="var(--v2-mute)">
          FIG
        </Mono>
        <div
          style={{
            fontFamily: "var(--font-clinical-mono)",
            fontSize: 30,
            fontWeight: 500,
            letterSpacing: "-0.04em",
            color: "var(--v2-ink)",
            lineHeight: 1,
            marginTop: 4,
          }}
        >
          {String(idx).padStart(2, "0")}
        </div>
        <Mono size={10} weight={500} color="var(--v2-mute)" style={{ marginTop: 4, display: "block" }}>
          / {String(total).padStart(2, "0")}
        </Mono>
      </div>
      <div>
        <Eyebrow size={10} weight={700} color="var(--v2-accent)" tracked="0.18em">
          {eyebrowEn}
        </Eyebrow>
        <h1
          style={{
            fontFamily: "var(--font-clinical-body)",
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.25,
            color: "var(--v2-ink)",
            margin: "14px 0 6px",
            textWrap: "balance",
          }}
        >
          {headlineKr}
        </h1>
        {headlineEn && (
          <div
            style={{
              fontFamily: "var(--font-clinical-eyebrow)",
              fontSize: 14,
              fontWeight: 500,
              color: "var(--v2-mute)",
              letterSpacing: "-0.01em",
              marginBottom: sub ? 14 : 0,
            }}
          >
            {headlineEn}
          </div>
        )}
        {sub && (
          <div
            style={{
              fontFamily: "var(--font-clinical-body)",
              fontSize: 14,
              lineHeight: 1.7,
              color: "var(--v2-body)",
              letterSpacing: "-0.015em",
              maxWidth: 580,
              textWrap: "pretty",
            }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}
