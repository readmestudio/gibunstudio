import type { CSSProperties, ReactNode } from "react";

/**
 * JetBrains Mono 텍스트 한 조각.
 * 코드/ID/숫자처럼 고정폭이 자연스러운 텍스트에 사용.
 */
export function Mono({
  children,
  size = 11,
  weight = 500,
  color = "var(--ink)",
  tracked = 0,
  className = "",
  style,
}: {
  children: ReactNode;
  size?: number;
  weight?: 400 | 500 | 600 | 700;
  color?: string;
  tracked?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={className}
      style={{
        fontFamily: "var(--font-clinical-mono)",
        fontSize: size,
        fontWeight: weight,
        color,
        letterSpacing: tracked,
        lineHeight: 1.2,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
