"use client";

import { Mono } from "@/components/self-workshop/clinical-report/shared/Mono";

/**
 * IMPL 박스 — 블랙 배경 화이트 텍스트로 강조하는 인사이트 카드.
 * 핸드오프 §01: "강조는 *반전(블랙 배경 화이트 텍스트)*으로 처리".
 *
 * - body: 핵심 인사이트 (P0/P1/P2 키워드별 카피)
 * - closing: 본문 아래 자연스럽게 이어지는 안내·다음 흐름 brief.
 *   같은 카드 안에서 살짝 옅은 톤 + 얇은 구분선으로 시각적 구분.
 */
export function InvertedInsightCard({
  label = "IMPL",
  body,
  closing,
}: {
  label?: string;
  body: string;
  closing?: string;
}) {
  return (
    <div
      style={{
        background: "var(--v2-ink)",
        color: "#fff",
        padding: "22px 24px",
        borderRadius: 14,
        printColorAdjust: "exact",
        WebkitPrintColorAdjust: "exact",
      }}
    >
      <Mono size={10} weight={700} color="rgba(255,255,255,0.55)" tracked={0.18}>
        {label}
      </Mono>
      <p
        style={{
          marginTop: 10,
          fontSize: 14,
          lineHeight: 1.75,
          color: "rgba(255,255,255,0.92)",
          letterSpacing: "-0.005em",
          fontFamily: "var(--font-clinical-body)",
          whiteSpace: "pre-wrap",
        }}
      >
        {body}
      </p>
      {closing && (
        <>
          <hr
            style={{
              margin: "16px 0 14px",
              border: 0,
              borderTop: "1px solid rgba(255,255,255,0.12)",
            }}
          />
          <p
            style={{
              fontSize: 13.5,
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.78)",
              letterSpacing: "-0.005em",
              fontFamily: "var(--font-clinical-body)",
              whiteSpace: "pre-wrap",
            }}
          >
            {closing}
          </p>
        </>
      )}
    </div>
  );
}
