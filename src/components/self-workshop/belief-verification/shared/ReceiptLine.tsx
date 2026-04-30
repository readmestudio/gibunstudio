"use client";

import type { ReactNode } from "react";
import { Mono } from "@/components/self-workshop/clinical-report/shared/Mono";

/**
 * Image #2 영역의 "RECEIPT — OK. 이 문장을 잠시 '가설(hypothesis)'이라고 불러볼게요." 패턴.
 *
 * 라벨은 모노 + 회색, 본문은 일반 sans + 약한 회색.
 * 위 보더로 영역을 구분.
 */
export function ReceiptLine({
  label = "RECEIPT",
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        marginTop: 28,
        paddingTop: 18,
        borderTop: "1px solid var(--v2-line)",
        display: "grid",
        gridTemplateColumns: "minmax(70px, max-content) 1fr",
        columnGap: 18,
        rowGap: 6,
        alignItems: "start",
      }}
    >
      <div style={{ paddingTop: 2 }}>
        <Mono size={10} weight={600} color="var(--v2-mute)" tracked={0.16}>
          {label}
        </Mono>
      </div>
      <div
        style={{
          fontSize: 13.5,
          lineHeight: 1.7,
          color: "var(--v2-body)",
          letterSpacing: "-0.005em",
          fontFamily: "var(--font-clinical-body)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
