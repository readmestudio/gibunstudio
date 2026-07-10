"use client";

/**
 * 유료 리포트 결제완료 Meta 픽셀 Purchase 발화 — 유료광고 구매 최적화 신호.
 *
 * minds 관계 리포트·inner-child 심층 리포트가 공유한다. 두 리포트는 결제 직후
 * **리포트 페이지 자체로** 리다이렉트되며, 이 페이지는 유저가 1년간 몇 번이고 다시
 * 열어보는 곳이다. 따라서 마운트할 때마다 발화하면 재방문이 전부 구매로 중복 집계된다.
 *
 * 그래서 "결제 직후 최초 1회"만 발화한다:
 *  - NicePay return 라우트가 **결제 확정(pending→confirmed) 시점에만** `?purchased=1`을
 *    붙여 리다이렉트한다(멱등 재방문 경로엔 안 붙음).
 *  - 이 컴포넌트는 그 쿼리가 있을 때만 Purchase 를 쏘고, 곧바로 쿼리에서 제거한다
 *    (새로고침·링크 공유 시 재발화 방지). `fired` ref 로 StrictMode 이중 이펙트도 막는다.
 *
 * value 는 결제 레코드의 실제 금액을 넘겨받는다 — minds 는 가격 A/B(₩9,900/₩19,900)라
 * 상수로는 정확한 매출을 잡을 수 없기 때문이다.
 */

import { useEffect, useRef } from "react";
import { trackMetaEvent } from "@/lib/meta-pixel";

export function ReportPurchasePixel({
  amount,
  contentName,
}: {
  amount: number;
  contentName: string;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("purchased") !== "1") return;

    fired.current = true;
    trackMetaEvent("Purchase", {
      content_name: contentName,
      value: amount,
      currency: "KRW",
    });

    // 새로고침·공유 시 재발화 방지 — 쿼리에서 purchased 만 제거하고 나머지는 보존한다.
    params.delete("purchased");
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      window.location.pathname + (qs ? `?${qs}` : "")
    );
  }, [amount, contentName]);

  return null;
}
