"use client";

import type { ReactNode } from "react";
import { useWorkshopCheckoutCtx } from "./WorkshopCheckoutContext";

interface Props {
  className?: string;
  children: ReactNode;
}

/**
 * 워크북 랜딩의 모든 "결제하기" CTA가 공유하는 버튼.
 *
 * 위치별로 디자인이 다르므로 className으로 스타일을 외부 주입한다 —
 * 동작(SDK 대기 / 결제창 호출 / 로그인 라우팅)은 컨텍스트에서 일괄 처리.
 * 클릭하면 무료 진단 없이 곧바로 NicePay 결제창이 뜬다.
 */
export function WorkbookBuyButton({ className, children }: Props) {
  const { buy, isSubmitting, sdkPending } = useWorkshopCheckoutCtx();

  return (
    <button
      type="button"
      onClick={buy}
      disabled={isSubmitting || sdkPending}
      className={className}
      aria-label="워크북 오픈 특가로 구매하기"
    >
      {isSubmitting ? "결제 진행 중…" : children}
    </button>
  );
}
