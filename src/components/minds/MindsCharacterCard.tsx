"use client";

/**
 * 마음 캐릭터 카드 (무료) — 드라마 인물 소개 한 장 (콰이엇 에디토리얼).
 *
 * 헤더(대형 주황 인덱스 + 초상) → 이름/태그라인/내가 부른 이름 → 풀-쿼트 →
 * 본문 단락 → 라벨 데이터 그리드[원하는 것 · 자주 하는 말 · 두려워하는 것 ·
 * 발동되는 순간 · 내 답에서]. 각 영역 안은 단답이 아니라 풀어쓴 분석 문장.
 */

import type { ReactNode } from "react";
import { CharacterPortrait } from "./CharacterPortrait";
import { M, LabelS } from "./quiet-editorial";
import type { CharacterView } from "@/lib/minds/characters";

interface Props {
  view: CharacterView;
  index: number; // 0-based
  total: number;
}

/** 라벨이 달린 데이터 행. 모노 라벨 + 본문 + 헤어라인 구분선. */
function ARow({ label, children, last }: { label: string; children: ReactNode; last?: boolean }) {
  return (
    <div style={{ padding: "18px 0", borderBottom: last ? "none" : `1px solid ${M.line2}` }}>
      <LabelS style={{ marginBottom: 10 }}>{label}</LabelS>
      {children}
    </div>
  );
}

const bodyText = {
  fontSize: 15,
  lineHeight: 1.8,
  color: M.ink2,
  fontFamily: M.font,
  margin: 0,
} as const;

export function MindsCharacterCard({ view, index, total }: Props) {
  const { archetype, evidenceQuote, userGivenName } = view;

  return (
    <div
      className="mx-auto w-full max-w-[448px] px-6 py-8 sm:px-8"
      style={{ minHeight: 540, borderRadius: 3, border: `1px solid ${M.line}`, background: M.paper }}
    >
      {/* 헤더 — 키커 + 대형 인덱스 / 초상 */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          paddingBottom: 22,
          borderBottom: `1px solid ${M.line}`,
        }}
      >
        <div>
          <div style={{ fontFamily: M.mono, fontSize: 11, fontWeight: 600, letterSpacing: "0.24em", textTransform: "uppercase", color: M.accent }}>
            The Cast
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 10, whiteSpace: "nowrap" }}>
            <span style={{ fontFamily: M.font, fontWeight: 600, fontSize: 44, color: M.accent, lineHeight: 1, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
              {String(index + 1).padStart(2, "0")}
            </span>
            <span style={{ fontFamily: M.font, fontWeight: 600, fontSize: 21, color: M.mute2, fontVariantNumeric: "tabular-nums" }}>
              / {String(total).padStart(2, "0")}
            </span>
          </div>
        </div>
        <CharacterPortrait src={archetype.portrait} alt={archetype.name} size={76} />
      </div>

      {/* 이름 블록 */}
      <div style={{ paddingTop: 24 }}>
        <h2 style={{ fontFamily: M.font, fontWeight: 700, fontSize: 32, letterSpacing: "-0.028em", lineHeight: 1.18, color: M.ink, margin: 0 }}>
          {archetype.name}
        </h2>
        <p style={{ marginTop: 10, fontSize: 15, color: M.ink2, fontFamily: M.font }}>{archetype.tagline}</p>
        {userGivenName && (
          <p style={{ marginTop: 12, fontSize: 11.5, color: M.mute, fontFamily: M.mono, letterSpacing: "0.02em" }}>
            내가 부른 이름 · “{userGivenName}”
          </p>
        )}

        {/* 풀-쿼트 */}
        <p style={{ marginTop: 24, fontFamily: M.font, fontWeight: 800, fontSize: 26, letterSpacing: "-0.02em", lineHeight: 1.3, color: M.ink }}>
          “{archetype.catchphrase}”
        </p>

        {/* 본문 도입 단락 */}
        <p style={{ ...bodyText, marginTop: 18 }}>{archetype.description}</p>
      </div>

      {/* 데이터 그리드 */}
      <div style={{ marginTop: 14 }}>
        <ARow label="이 마음이 원하는 것">
          <p style={bodyText}>{archetype.wants}</p>
        </ARow>

        <ARow label="자주 하는 말">
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {archetype.sayings.map((s, i) => (
              <div key={i} style={{ paddingLeft: 14, borderLeft: `2px solid ${M.line}`, fontSize: 15, lineHeight: 1.6, color: M.ink2, fontFamily: M.font }}>
                “{s}”
              </div>
            ))}
          </div>
        </ARow>

        <ARow label="두려워하는 것">
          <p style={bodyText}>{archetype.fears}</p>
        </ARow>

        <ARow label="이 마음이 발동되는 순간" last={!evidenceQuote}>
          <p style={bodyText}>{archetype.triggers}</p>
        </ARow>

        {evidenceQuote && (
          <ARow label="내 답에서" last>
            <div style={{ paddingLeft: 14, borderLeft: `3px solid ${M.accent}`, fontSize: 16, fontWeight: 500, lineHeight: 1.6, color: M.ink, fontFamily: M.font }}>
              “{evidenceQuote}”
            </div>
          </ARow>
        )}
      </div>
    </div>
  );
}
