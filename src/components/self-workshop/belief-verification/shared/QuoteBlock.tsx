"use client";

/**
 * 큰 따옴표 신념 인용 블록.
 * 좌측에 얇은 세로 보더 (옵션) — 핸드오프 §01.
 */
export function QuoteBlock({
  text,
  size = "lg",
  caption,
  withBorder = true,
}: {
  text: string;
  size?: "md" | "lg";
  /** 인용 아래 작은 부연 (예: "─ 친한 친구가 당신에게 와서 이렇게 말했어요.") */
  caption?: string;
  withBorder?: boolean;
}) {
  const fontSize = size === "lg" ? 22 : 17;
  return (
    <div
      style={{
        paddingLeft: withBorder ? 18 : 0,
        borderLeft: withBorder ? "2px solid var(--v2-ink)" : "none",
      }}
    >
      <p
        style={{
          fontSize,
          fontWeight: 700,
          lineHeight: 1.5,
          color: "var(--v2-ink)",
          letterSpacing: "-0.02em",
          fontFamily: "var(--font-clinical-body)",
          textWrap: "balance",
        }}
      >
        “{text}”
      </p>
      {caption && (
        <p
          style={{
            marginTop: 14,
            fontSize: 12.5,
            lineHeight: 1.6,
            color: "var(--v2-mute)",
            fontFamily: "var(--font-clinical-body)",
          }}
        >
          {caption}
        </p>
      )}
    </div>
  );
}
