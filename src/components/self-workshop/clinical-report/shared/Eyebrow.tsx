import type { CSSProperties, ReactNode } from "react";

/**
 * Inter 영문 라벨 (uppercase, tracked).
 * 임상 리포트 디자인의 eyebrow / 라벨 영역에 사용.
 */
export function Eyebrow({
  children,
  size = 9,
  weight = 600,
  color = "var(--mute)",
  tracked = "0.18em",
  className = "",
  style,
}: {
  children: ReactNode;
  size?: number;
  weight?: 400 | 500 | 600 | 700 | 800;
  color?: string;
  tracked?: string | number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      className={className}
      style={{
        fontFamily: "var(--font-clinical-eyebrow)",
        fontSize: size,
        fontWeight: weight,
        color,
        letterSpacing: tracked,
        textTransform: "uppercase",
        lineHeight: 1.2,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
