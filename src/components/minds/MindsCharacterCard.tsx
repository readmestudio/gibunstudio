"use client";

/**
 * 마음 캐릭터 카드 (무료) — 드라마 인물 소개 한 장 (콰이엇 에디토리얼).
 *
 * 헤더(대형 주황 인덱스 + 초상) → 이름/태그라인/내가 부른 이름 → 풀-쿼트 → 본문 단락.
 *
 * 두 가지 모드:
 * - full   : 리더(첫 캐릭터) 전용. 속마음(원하는 것·자주 하는 말·두려움·발동 순간·내 답)
 *            까지 전부 노출해 "제대로 된 분석"을 체감시킨다.
 * - teaser : 나머지 마음들. 메인 카피(이름·태그라인·캐치프레이즈)까지만 선명하게 두고,
 *            그 아래 속마음은 실제 텍스트를 블러로 가려 "지금 바로 잠금 해제하기" CTA 로
 *            결제(MindsCheckoutModal)를 유도한다.
 */

import type { ReactNode } from "react";
import { CharacterPortrait } from "./CharacterPortrait";
import { M, LabelS, IcLock, ctaStyle } from "./quiet-editorial";
import type { CharacterView } from "@/lib/minds/characters";

interface Props {
  view: CharacterView;
  index: number; // 0-based
  total: number;
  /**
   * "full" — 속마음(원하는 것·자주 하는 말·두려움·발동 순간·내 답)까지 전부 노출(리더 카드).
   * "teaser" — 메인 카피까지만 선명하게 두고, 그 아래 속마음은 블러 + 잠금 해제 CTA.
   */
  variant?: "full" | "teaser";
  /** teaser 카드의 "지금 바로 잠금 해제하기" CTA — 결제 모달을 연다. */
  onUnlock?: () => void;
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

export function MindsCharacterCard({ view, index, total, variant = "full", onUnlock }: Props) {
  const {
    archetype,
    derived,
    name,
    tagline,
    catchphrase,
    description,
    insight,
    wants,
    sayings,
    fears,
    triggers,
    evidenceQuote,
  } = view;
  const teaser = variant === "teaser";

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
          <div style={{ fontFamily: M.mono, fontSize: 11, fontWeight: 600, letterSpacing: "0.24em", textTransform: "uppercase", color: derived ? M.accent : M.mute }}>
            {derived ? "The Cast" : "Maybe · 가정"}
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
        <CharacterPortrait src={archetype.portrait} alt={name} size={76} />
      </div>

      {/* 이름 블록 — 표면 이름은 작은 꼬리표, '해석된 진짜 마음'(tagline)을 헤드라인으로.
          "내가 아는 마음은 X지만, 진짜는 이런 마음이에요"의 위계. */}
      <div style={{ paddingTop: 24 }}>
        <div style={{ fontSize: 12.5, fontWeight: 500, letterSpacing: "-0.01em", color: M.mute2, fontFamily: M.font }}>
          내가 아는 마음 · {name}
        </div>
        <h2 style={{ fontFamily: M.font, fontWeight: 700, fontSize: 29, letterSpacing: "-0.028em", lineHeight: 1.24, color: M.ink, margin: "8px 0 0" }}>
          {tagline}
        </h2>

        {/* 가정 배너 — 답변 근거 없이 채운 캐릭터는 확신 대신 가정으로 소개 */}
        {!derived && (
          <div style={{ marginTop: 16, padding: "12px 14px", border: `1px dashed ${M.line}`, borderRadius: 3, background: M.paper2 }}>
            <p style={{ fontSize: 13, lineHeight: 1.65, color: M.mute2, fontFamily: M.font, margin: 0 }}>
              이 마음은 당신 답변엔 또렷이 드러나진 않았어요. 다만 비슷한 결의 이야기에서 자주 함께 나타나는 마음이라,{" "}
              <strong style={{ color: M.ink2, fontWeight: 600 }}>“이런 마음도 곁에 있을 수 있어요”</strong> 하고 가정으로 살짝 소개해드려요.
            </p>
          </div>
        )}

        {/* 풀-쿼트 */}
        <p style={{ marginTop: 24, fontFamily: M.font, fontWeight: 800, fontSize: 26, letterSpacing: "-0.02em", lineHeight: 1.3, color: M.ink }}>
          “{catchphrase}”
        </p>

        {/* "아하 모먼트" — 왜 이 마음을 반복하는지의 인과 + 반전 재해석. 카드에서 가장
            먼저 눈에 띄어야 할 깨달음이라, 본문 위에 주황 콜아웃으로 강조한다(full 만). */}
        {!teaser && insight && (
          <div
            style={{
              marginTop: 22,
              padding: "16px 18px",
              borderLeft: `3px solid ${M.accent}`,
              background: M.accentSoft,
              borderRadius: "0 4px 4px 0",
            }}
          >
            <div style={{ fontFamily: M.mono, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.18em", color: M.accent, marginBottom: 9 }}>
              왜 자꾸 이럴까
            </div>
            <p style={{ fontFamily: M.font, fontSize: 15.5, fontWeight: 500, lineHeight: 1.8, color: M.ink, margin: 0 }}>
              {insight}
            </p>
          </div>
        )}

        {/* 본문 해설 — full(리더)만 선명하게. 긴 서술형이므로 문단으로 나눠 읽히게 한다.
            teaser 는 아래 블러 벽에서 흐리게 보여준다. */}
        {!teaser && (
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 13 }}>
            {description
              .split(/\n{2,}/)
              .map((p) => p.trim())
              .filter(Boolean)
              .map((p, i) => (
                <p key={i} style={bodyText}>
                  {p}
                </p>
              ))}
          </div>
        )}
      </div>

      {/* 데이터 그리드 (full) — 이 마음의 속마음을 전부 노출 */}
      {!teaser && (
        <div style={{ marginTop: 14 }}>
          <ARow label="이 마음이 원하는 것">
            <p style={bodyText}>{wants}</p>
          </ARow>

          <ARow label="자주 하는 말">
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {sayings.map((s, i) => (
                <div key={i} style={{ paddingLeft: 14, borderLeft: `2px solid ${M.line}`, fontSize: 15, lineHeight: 1.6, color: M.ink2, fontFamily: M.font }}>
                  “{s}”
                </div>
              ))}
            </div>
          </ARow>

          <ARow label="두려워하는 것">
            <p style={bodyText}>{fears}</p>
          </ARow>

          <ARow label="이 마음이 발동되는 순간" last={!evidenceQuote}>
            <p style={bodyText}>{triggers}</p>
          </ARow>

          {evidenceQuote && (
            <ARow label="내 답에서" last>
              <div style={{ paddingLeft: 14, borderLeft: `3px solid ${M.accent}`, fontSize: 16, fontWeight: 500, lineHeight: 1.6, color: M.ink, fontFamily: M.font }}>
                “{evidenceQuote}”
              </div>
            </ARow>
          )}
        </div>
      )}

      {/* 맛보기(teaser) — 메인 카피 아래 속마음을 실제 텍스트로 채우되 블러로 가리고,
          "지금 바로 잠금 해제하기" CTA(결제 모달)로 유도한다. 블러 벽은 pointerEvents 차단. */}
      {teaser && (
        <div style={{ marginTop: 18, position: "relative" }}>
          {/* 가려진 실제 속마음 — 흐릿하게 '내용이 있음'을 암시(복사·선택·클릭 불가) */}
          <div
            aria-hidden
            style={{
              filter: "blur(5.5px)",
              userSelect: "none",
              pointerEvents: "none",
              opacity: 0.85,
              minHeight: 288,
              maxHeight: 320,
              overflow: "hidden",
            }}
          >
            <p style={bodyText}>{description}</p>
            {insight && (
              <div style={{ marginTop: 14, padding: "14px 16px", borderLeft: `3px solid ${M.accent}`, background: M.accentSoft, borderRadius: "0 4px 4px 0" }}>
                <div style={{ fontFamily: M.mono, fontSize: 10.5, fontWeight: 600, letterSpacing: "0.18em", color: M.accent, marginBottom: 8 }}>왜 자꾸 이럴까</div>
                <p style={{ ...bodyText, color: M.ink, fontWeight: 500 }}>{insight}</p>
              </div>
            )}
            <div style={{ marginTop: 14 }}>
              <ARow label="이 마음이 원하는 것">
                <p style={bodyText}>{wants}</p>
              </ARow>
              <ARow label="자주 하는 말">
                <p style={bodyText}>{sayings.map((s) => `“${s}”`).join("  ")}</p>
              </ARow>
              <ARow label="두려워하는 것" last>
                <p style={bodyText}>{fears}</p>
              </ARow>
            </div>
          </div>

          {/* 잠금 오버레이 — 블러 위에 '자물쇠 배지'를 중앙에 얹어, 렌더 오류가 아니라
              '결제 전이라 가려진 상태'임을 직관적으로 알린다. 상단부터 은은한 베일을 깔아
              블러 텍스트가 '깨진 화면'이 아니라 '가려진 내용'으로 읽히게 한다. */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 15,
              padding: "20px 2px 2px",
              background: `linear-gradient(180deg, rgba(247,244,238,0.36) 0%, rgba(247,244,238,0.68) 46%, ${M.paper} 82%)`,
            }}
          >
            {/* 원형 자물쇠 배지 — '잠김'을 한눈에 */}
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 999,
                background: M.ink,
                color: M.paper,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 22px rgba(16,15,14,0.22)",
              }}
            >
              <IcLock s={24} sw={1.7} />
            </div>

            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontFamily: M.font, fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em", color: M.ink }}>
                이 마음의 속마음은 아직 잠겨 있어요
              </p>
              <p style={{ margin: "8px auto 0", maxWidth: 300, fontSize: 13.5, lineHeight: 1.7, color: M.mute, fontFamily: M.font }}>
                이 마음이 왜 자꾸 이러는지, 진짜 원하는 게 뭔지, 가장 두려워하는 것까지 —{" "}
                <strong style={{ color: M.ink2, fontWeight: 600 }}>전체 리포트</strong>에서 풀려요.
              </p>
            </div>

            <button
              type="button"
              onClick={onUnlock}
              style={{ ...ctaStyle, marginTop: 2, padding: "16px 20px", fontSize: 15.5, boxShadow: "0 8px 24px rgba(16,15,14,0.16)" }}
              className="transition-transform active:scale-[0.99]"
            >
              <IcLock s={15} /> 지금 바로 잠금 해제하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
