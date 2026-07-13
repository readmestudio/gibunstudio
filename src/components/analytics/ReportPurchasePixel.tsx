"use client";

/**
 * 유료 리포트 결제완료 Meta 픽셀 Purchase 발화 — 유료광고 구매 최적화 신호.
 *
 * minds 관계 리포트·inner-child 심층 리포트가 공유한다. 두 리포트는 결제 직후 리포트
 * 페이지로 이동하지만, 그 페이지는 유저가 1년간 몇 번이고 다시 열어보는 곳이라 마운트마다
 * 발화하면 재방문이 전부 구매로 중복 집계된다.
 *
 * 그래서 **발화 여부는 서버가 결정**한다(이 컴포넌트는 렌더될 때만 발화):
 *  - 페이지 서버 컴포넌트가 status=confirmed + paid_at 이 최근(24h 내)일 때만 렌더한다.
 *    → 결제 직후 조회에서만 켜지고, 며칠 뒤 재방문엔 아예 렌더 안 됨.
 *    → 과거 `?purchased=1` 쿼리 마커 방식은 로그인/소유권 리다이렉트에서 유실돼 폐기했다.
 *  - `eventID`(결제 레코드 id)로 발화하므로, 최근 창 안에서 몇 번 새로고침해도 메타가
 *    1건으로 합쳐 "결제 1건 = 전환 1건"을 보장한다.
 *
 * fbq 는 afterInteractive 로드라 마운트 즉시엔 아직 없을 수 있어, 준비될 때까지 기다렸다
 * 발화한다(`trackMetaEventWhenReady`). value 는 결제 레코드의 실제 금액을 넘겨받는다
 * — 리포트는 단일가(₩9,900)지만 가격 A/B 실험 중 생성된 legacy(₩19,900) 결제도 있어,
 *   상수 대신 레코드의 실제 금액으로 매출을 잡는다.
 */

import { useEffect, useRef } from "react";
import { trackMetaEventWhenReady } from "@/lib/meta-pixel";

export function ReportPurchasePixel({
  amount,
  contentName,
  eventId,
}: {
  amount: number;
  contentName: string;
  eventId: string;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    // fbq 준비될 때까지 기다렸다 발화. eventID 로 재방문·새로고침 중복은 메타가 제거.
    return trackMetaEventWhenReady(
      "Purchase",
      { content_name: contentName, value: amount, currency: "KRW" },
      { eventID: eventId }
    );
  }, [amount, contentName, eventId]);

  return null;
}
