"use client";

/**
 * 워크샵 결제완료 Meta 픽셀 Purchase 발화 — 유료광고 전환 신호.
 *
 * 완료 페이지는 서버 컴포넌트라, 픽셀 발화만 이 클라이언트 자식으로 분리했다.
 * 마운트 시 발화하되, `eventId`(결제 id)로 새로고침·재방문 중복은 메타가 1건 처리한다.
 */

import { useEffect, useRef } from "react";
import { trackMetaEventWhenReady } from "@/lib/meta-pixel";

export function WorkshopPurchasePixel({
  amount,
  eventId,
}: {
  amount: number;
  eventId: string;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    // fbq 가 아직 로드 전일 수 있으므로(afterInteractive 레이스) 준비될 때까지 기다렸다 발화.
    return trackMetaEventWhenReady(
      "Purchase",
      {
        content_name: "inner_child_workshop",
        value: amount,
        currency: "KRW",
      },
      { eventID: eventId }
    );
  }, [amount, eventId]);

  return null;
}
