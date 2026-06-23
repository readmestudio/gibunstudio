"use client";

/**
 * /minds 무료 컨텐츠 "콰이엇 에디토리얼(Quiet Editorial)" 디자인 모듈.
 *
 * 따뜻한 종이 톤 + 헤어라인 룰 + 거의 각진 CTA + JetBrains Mono 키커의
 * 에디토리얼 미감. 기분 체크인 시스템과 정렬된 토큰을 한 곳에서 정의해,
 * 랜딩·인트로·캐릭터·페이월 네 화면 계열이 동일한 자(ruler)를 쓰도록 한다.
 *
 * 토큰 출처: design_handoff_quiet_editorial 의 `.A { … }` 블록.
 */

import type { CSSProperties, ReactNode } from "react";

// ───────── DESIGN TOKENS ───────── //
export const M = {
  paper: "#F7F4EE", // 페이지 배경
  paper2: "#FBF8F2", // 콜아웃·보조 블록 배경
  ink: "#100F0E", // 1차 텍스트, 다크 CTA 배경
  ink2: "#2A2926", // 본문/보조 텍스트
  mute: "#95938B", // 키커 라벨, 각주
  mute2: "#C7C4BB", // 약화 텍스트 ("/ 04", 잠금 "???")
  line: "rgba(16,15,14,0.10)", // 헤어라인 룰 / 필 테두리
  line2: "rgba(16,15,14,0.05)", // 리스트 항목 구분선
  accent: "#F0501E", // 주황 — 인덱스, 키커, 강조 바, 셀렉션
  accentSoft: "rgba(240,80,30,0.08)",
  font: "'Pretendard',-apple-system,BlinkMacSystemFont,system-ui,sans-serif",
  mono: "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace",
} as const;

/** 에디토리얼 모바일 컬럼 폭. 데스크탑에서도 중앙 정렬된 한 컬럼. */
export const COLUMN = 448;

// ───────── TEXT STYLE PRESETS ───────── //
/** 헤드라인 — Pretendard 700, 타이트 트래킹. fontSize는 화면별로 지정. */
export const dispStyle: CSSProperties = {
  fontFamily: M.font,
  fontWeight: 700,
  letterSpacing: "-0.028em",
  lineHeight: 1.18,
  color: M.ink,
  margin: 0,
};

/** 인트로/본문 리드 — Pretendard 400, 넉넉한 행간. */
export const leadStyle: CSSProperties = {
  fontFamily: M.font,
  fontWeight: 400,
  fontSize: 15,
  lineHeight: 1.8,
  color: M.ink2,
  margin: 0,
};

/** 풀-와이드 다크 CTA — 거의 각진(radius 2px) 에디토리얼 버튼. */
export const ctaStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  width: "100%",
  padding: "21px 20px",
  borderRadius: 2,
  background: M.ink,
  color: M.paper,
  fontFamily: M.font,
  fontWeight: 700,
  fontSize: 16,
  letterSpacing: "-0.01em",
  border: "none",
  cursor: "pointer",
  textAlign: "center",
};

// ───────── ATOMS ───────── //

/** 상단 마스트헤드 — 좌: 기분 리포트 / 우: 마음 극장 · 심리 테스트. */
export function Masthead() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "20px 0 16px",
        borderBottom: `1px solid ${M.line}`,
      }}
    >
      <span style={{ fontFamily: M.mono, fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: M.ink }}>
        기분 리포트
      </span>
      <span style={{ fontFamily: M.mono, fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: M.mute }}>
        마음 극장 · 심리 테스트
      </span>
    </div>
  );
}

/** 아이브로 키커 — Mono 600 UPPERCASE, 주황. */
export function Kicker({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        fontFamily: M.mono,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.24em",
        textTransform: "uppercase",
        color: M.accent,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** 필드 라벨 — Mono UPPERCASE, mute. */
export function LabelS({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        fontFamily: M.mono,
        fontSize: 10.5,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: M.mute,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** 헤어라인 룰. */
export function Hr({ style }: { style?: CSSProperties }) {
  return <hr style={{ border: "none", height: 1, background: M.line, margin: 0, ...style }} />;
}

/** 라운드 필 — 1px line 테두리. */
export function Pill({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "8px 14px",
        border: `1px solid ${M.line}`,
        borderRadius: 999,
        fontSize: 13,
        color: M.ink2,
        fontFamily: M.font,
      }}
    >
      {children}
    </span>
  );
}

/** 잠금 아이콘(페이월 ??? 마커용). */
export function IcLock({ s = 13, sw = 1.6 }: { s?: number; sw?: number }) {
  return (
    <svg width={s} height={s} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round">
      <rect x="4" y="9" width="12" height="8" rx="1.6" />
      <path d="M6.5 9 V6.5 a3.5 3.5 0 0 1 7 0 V9" />
    </svg>
  );
}
