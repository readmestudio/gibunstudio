"use client";

import { useWorkshopCheckoutCtx } from "./WorkshopCheckoutContext";

/**
 * 워크북 결제 CTA 아래에 붙는 간편결제 버튼 행.
 *
 * 메인 "결제하기"(카드) 버튼과 동일한 결제 파이프라인을 쓰되,
 * NicePay `method`만 카카오페이 / 네이버페이로 지정해 각 전용 결제창을 연다.
 * (NicePay JS SDK는 method를 빼면 P007 오류 → 수단별로 따로 호출해야 함)
 */
export function WorkbookEasyPayButtons() {
  const { payKakao, payNpay, isSubmitting, sdkPending } =
    useWorkshopCheckoutCtx();
  const blocked = isSubmitting || sdkPending;

  return (
    <div className="lr-easypay-row" role="group" aria-label="간편결제로 구매">
      <button
        type="button"
        onClick={payKakao}
        disabled={blocked}
        className="lr-easypay-btn lr-easypay-kakao"
        aria-label="카카오페이로 구매하기"
      >
        <span className="lr-easypay-dot" aria-hidden />
        카카오페이
      </button>
      <button
        type="button"
        onClick={payNpay}
        disabled={blocked}
        className="lr-easypay-btn lr-easypay-naver"
        aria-label="네이버페이로 구매하기"
      >
        <span className="lr-easypay-dot" aria-hidden />
        네이버페이
      </button>
    </div>
  );
}
