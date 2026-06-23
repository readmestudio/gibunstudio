"use client";

/**
 * /minds 1단계 — 후킹 랜딩 (콰이엇 에디토리얼).
 *
 * "내 안엔 몇 명이 살고 있을까?" — 일·성취 앞에서 여러 마음이 동시에 말을 거는
 * 경험을 짚어주고, 무료로 그 마음들을 만나보도록 시작 CTA를 제시한다.
 * 마스트헤드 → 키커 → 헤드라인 → 리드 → "이런 분께" 헤어라인 리스트 → CTA → 각주.
 */

import { M, Masthead, Kicker, LabelS, dispStyle, leadStyle, ctaStyle } from "./quiet-editorial";

const WHO = [
  "열심히 하는데도 늘 부족하게 느껴지는 분",
  "쉬고 싶은데 죄책감이 먼저 드는 분",
  "내 감정이 왜 이렇게 복잡한지 모르겠는 분",
];

export function MindsLanding({ onStart }: { onStart: () => void }) {
  return (
    <section>
      <Masthead />

      <div style={{ paddingTop: 36 }}>
        <Kicker>3분 무료 · 가입 없이 바로 시작</Kicker>
        <h1 style={{ ...dispStyle, fontSize: 38, marginTop: 20 }}>
          내 안엔 몇 명이
          <br />
          살고 있을까?
        </h1>
        <p style={{ ...leadStyle, marginTop: 22, maxWidth: 330 }}>
          일·성취 앞에서 마음이 흔들릴 때, 내 안에선 사실 여러 마음이 동시에 말을
          건넵니다. 더 하라고 다그치는 마음, 그만 쉬고 싶은 마음처럼요.
        </p>
      </div>

      <div style={{ marginTop: 38 }}>
        <LabelS style={{ marginBottom: 4 }}>이런 분께</LabelS>
        <div>
          {WHO.map((t, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 16,
                alignItems: "baseline",
                padding: "17px 0",
                borderBottom: `1px solid ${M.line2}`,
              }}
            >
              <span
                style={{
                  fontFamily: M.mono,
                  fontSize: 12,
                  color: M.accent,
                  letterSpacing: "0.05em",
                  flex: "0 0 auto",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span style={{ fontSize: 15.5, color: M.ink2, lineHeight: 1.5, fontFamily: M.font }}>
                {t}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 40 }}>
        <button type="button" onClick={onStart} style={{ ...ctaStyle }} className="transition-transform active:scale-[0.99]">
          내 안의 마음들 만나보기
        </button>
        <p style={{ textAlign: "center", marginTop: 18, fontSize: 12.5, color: M.mute, fontFamily: M.font }}>
          진단이 아니라, 지금의 나를 비춰보는 거울이에요.
        </p>
      </div>
    </section>
  );
}
