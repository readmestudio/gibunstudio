"use client";

/**
 * /minds 리포트 카드 공통 셸 (콰이엇 에디토리얼).
 *
 * 캐러셀 한 장의 외곽(헤어라인 프레임·패딩·최소 높이)을 통일한다. 무거운 테두리
 * 대신 종이톤 위 얇은 헤어라인으로만 카드를 구분하고, 모서리는 거의 각진
 * 에디토리얼 톤(radius 3px). 내용이 길면 자연스럽게 늘어난다.
 */

import type { ReactNode } from "react";
import { M, Kicker } from "./quiet-editorial";

export function CardShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="mx-auto w-full max-w-[448px] px-6 py-9 sm:px-8"
      style={{
        minHeight: 540,
        borderRadius: 3,
        border: `1px solid ${M.line}`,
        background: M.paper,
      }}
    >
      {children}
    </div>
  );
}

/** 카드 상단 키커 — 가운데 정렬 주황 라벨. */
export function CardKicker({ children }: { children: ReactNode }) {
  return <Kicker style={{ textAlign: "center", letterSpacing: "0.2em" }}>{children}</Kicker>;
}
