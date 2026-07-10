"use client";

/**
 * 워크샵 결제완료 Meta 픽셀 Purchase 발화 — 유료광고 전환 신호.
 *
 * 완료 페이지는 서버 컴포넌트라, 픽셀 발화만 이 클라이언트 자식으로 분리했다.
 * 마운트 시 1회만 발화한다(React StrictMode 이중 이펙트·리렌더 중복 발화 방지).
 */

import { useEffect, useRef } from "react";
import { trackMetaEvent } from "@/lib/meta-pixel";

export function WorkshopPurchasePixel({ amount }: { amount: number }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackMetaEvent("Purchase", {
      content_name: "inner_child_workshop",
      value: amount,
      currency: "KRW",
    });
  }, [amount]);

  return null;
}
