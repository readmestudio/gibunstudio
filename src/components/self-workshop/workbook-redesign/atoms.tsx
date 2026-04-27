/**
 * 워크북 리뱀프 atoms
 *
 * 디자인 핸드오프(design_handoff_workbook_redesign)의 EDITORIAL/METRIC
 * 안에서 공통으로 쓰이는 작은 부품들을 모아두는 파일.
 * 토큰은 globals.css 의 --wb-* 변수를 사용한다.
 */

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

/* ───────── MonoTag ─────────
 * UPPERCASE + JetBrains Mono + 트래킹.
 * 모든 메타 라벨(CH.02, EST. TIME, SECTION 01...)에 사용. */

interface MonoTagProps {
  children: ReactNode;
  size?: number;
  weight?: number;
  tracking?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
}

export function MonoTag({
  children,
  size = 11,
  weight = 600,
  tracking = 0.12,
  color = "var(--wb-text2)",
  className,
  style,
}: MonoTagProps) {
  return (
    <span
      className={className}
      style={{
        fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
        fontWeight: weight,
        fontSize: size,
        letterSpacing: `${tracking}em`,
        color,
        textTransform: "uppercase",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/* ───────── Glyphs ───────── */

export function CheckGlyph({ size = 14, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.5 8.5 L6.8 11.8 L12.5 5.2"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LockGlyph({ size = 12, color = "var(--wb-text3)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="3.5" y="7.5" width="9" height="6" rx="1.2" stroke={color} strokeWidth="1.2" />
      <path
        d="M5.5 7.5 V5.2 a2.5 2.5 0 0 1 5 0 V7.5"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ArrowGlyph({
  dir = "right",
  size = 14,
  color = "var(--wb-text)",
}: {
  dir?: "left" | "right";
  size?: number;
  color?: string;
}) {
  const d =
    dir === "right"
      ? "M3 8 H13 M9 4 L13 8 L9 12"
      : "M13 8 H3 M7 4 L3 8 L7 12";
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d={d}
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ───────── State Disc (28px 원: done / active / locked) ───────── */

export function StateDisc({ state }: { state: "done" | "active" | "locked" }) {
  if (state === "done") {
    return (
      <div
        className="flex h-7 w-7 items-center justify-center rounded-full"
        style={{ background: "var(--wb-ink)" }}
      >
        <CheckGlyph size={14} color="#fff" />
      </div>
    );
  }
  if (state === "active") {
    return (
      <div
        className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white"
        style={{ boxShadow: "inset 0 0 0 1.5px var(--wb-ink)" }}
      >
        <div
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: "var(--wb-accent)" }}
        />
      </div>
    );
  }
  return (
    <div
      className="flex h-7 w-7 items-center justify-center rounded-full"
      style={{ border: "1px dashed var(--wb-hair)" }}
    >
      <LockGlyph color="var(--wb-text3)" />
    </div>
  );
}

/* ───────── Buttons (Ghost · Solid) ─────────
 * Link 로 렌더되도록 href 받음. type="button" 형태가 필요하면 BtnSolidButton 변형 추가 가능. */

interface BtnProps {
  href: string;
  children: ReactNode;
}

export function BtnGhost({ href, children }: BtnProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-full transition-colors"
      style={{
        fontFamily: "Pretendard, system-ui, sans-serif",
        fontWeight: 500,
        fontSize: 13,
        color: "var(--wb-text)",
        background: "transparent",
        border: "1px solid var(--wb-hair)",
        padding: "8px 14px",
        letterSpacing: "-0.005em",
      }}
    >
      <span>{children}</span>
      <span className="ml-1" style={{ color: "var(--wb-text3)" }}>→</span>
    </Link>
  );
}

export function BtnSolid({ href, children }: BtnProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-full transition-opacity hover:opacity-90"
      style={{
        fontFamily: "Pretendard, system-ui, sans-serif",
        fontWeight: 600,
        fontSize: 13,
        color: "#fff",
        background: "var(--wb-ink)",
        padding: "9px 16px",
        letterSpacing: "-0.005em",
      }}
    >
      <span>{children}</span>
      <ArrowGlyph color="#fff" size={12} />
    </Link>
  );
}

/* ───────── Progress Ring ─────────
 * 12시 방향에서 시작. dasharray/offset 으로 채움 표현.
 * size 변경 시 자동으로 반지름·둘레 재계산. */

export function ProgressRing({
  pct,
  done,
  total,
  size = 160,
}: {
  pct: number;
  done: number;
  total: number;
  size?: number;
}) {
  const r = size / 2 - 6;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--wb-hair)"
          strokeWidth="2"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="var(--wb-ink)"
          strokeWidth="2"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 200ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            fontWeight: 600,
            fontSize: 36,
            letterSpacing: "-0.025em",
            color: "var(--wb-ink)",
            lineHeight: 1,
          }}
        >
          {done}
          <span style={{ color: "var(--wb-text3)", fontWeight: 400 }}>/{total}</span>
        </div>
        <MonoTag size={10} color="var(--wb-text3)">
          COMPLETE
        </MonoTag>
      </div>
    </div>
  );
}
