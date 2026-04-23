"use client";

/**
 * 워크북 결제 + 장바구니 공용 훅
 *
 * - 구매하기 (method 생략 → NICE PAY 통합 결제창)
 * - Npay 구매 (method: 'naverpayCard')
 * - 장바구니 담기 (/api/cart/add) + 비로그인 시 /login 리다이렉트
 *
 * 여러 워크북 판매 화면에서 공통으로 사용.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BuyAction } from "@/types/payment";

const NICEPAY_CLIENT_ID = process.env.NEXT_PUBLIC_NICEPAY_MERCHANT_ID || "";
const BUYNOW_METHOD = process.env.NEXT_PUBLIC_NICEPAY_BUYNOW_METHOD || "";

export interface UseWorkshopCheckoutParams {
  /** products 테이블 id (예: 'achievement-addiction') */
  productId: string;
  /** /api/payment/workshop/create에 전달할 워크샵 타입 */
  workshopType: string;
  amount: number;
  goodsName: string;
  /** 이미 구매한 워크북일 때의 처리 (기본: alert 후 대시보드 이동 시도) */
  onAlreadyPurchased?: () => void;
}

function redirectToLogin(router: ReturnType<typeof useRouter>) {
  const redirect = encodeURIComponent(
    typeof window !== "undefined" ? window.location.pathname : "/"
  );
  router.push(`/login?redirect=${redirect}`);
}

export function useWorkshopCheckout(params: UseWorkshopCheckoutParams) {
  const router = useRouter();
  const [submittingAction, setSubmittingAction] = useState<BuyAction | null>(
    null
  );

  async function startPayment(
    action: "buyNow" | "npay",
    method?: string
  ) {
    if (!NICEPAY_CLIENT_ID) {
      alert("결제 모듈이 아직 설정되지 않았어요. 잠시 후 다시 시도해주세요.");
      return;
    }
    if (!window.AUTHNICE) {
      alert("결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setSubmittingAction(action);

    try {
      const res = await fetch("/api/payment/workshop/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshopType: params.workshopType,
          amount: params.amount,
        }),
      });

      if (res.status === 401) {
        alert("로그인 후 결제를 진행해주세요.");
        redirectToLogin(router);
        return;
      }

      const data = await res.json();

      if (data.already_purchased) {
        if (params.onAlreadyPurchased) {
          params.onAlreadyPurchased();
        } else {
          alert("이미 구매한 워크북입니다.");
        }
        setSubmittingAction(null);
        return;
      }

      if (!data.order_id) {
        throw new Error(data.error || "결제 레코드 생성에 실패했습니다");
      }

      window.AUTHNICE.requestPay({
        clientId: NICEPAY_CLIENT_ID,
        ...(method ? { method } : {}),
        orderId: data.order_id,
        amount: params.amount,
        goodsName: params.goodsName,
        returnUrl: `${window.location.origin}/api/payment/nicepay/return`,
        fnError: (result: { errorMsg: string }) => {
          console.error("NicePay 에러:", result);
          alert(`결제 오류: ${result.errorMsg}`);
          setSubmittingAction(null);
        },
      });
    } catch (err) {
      console.error("결제 시작 오류:", err);
      alert("결제를 시작할 수 없습니다. 잠시 후 다시 시도해주세요.");
      setSubmittingAction(null);
    }
  }

  async function handleAddToCart() {
    setSubmittingAction("addToCart");
    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: params.productId, quantity: 1 }),
      });

      if (res.status === 401) {
        alert("로그인이 필요합니다. 로그인 페이지로 이동할게요.");
        redirectToLogin(router);
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "장바구니에 담지 못했어요.");
      }

      if (data.already_purchased) {
        alert("이미 구매한 워크북입니다.");
        return;
      }

      if (confirm("장바구니에 담았어요. 장바구니로 이동할까요?")) {
        router.push("/cart");
      }
    } catch (err) {
      console.error("장바구니 담기 오류:", err);
      alert(
        err instanceof Error ? err.message : "장바구니에 담지 못했어요."
      );
    } finally {
      setSubmittingAction(null);
    }
  }

  return {
    submittingAction,
    isSubmitting: submittingAction !== null,
    handleBuyNow: () => startPayment("buyNow", BUYNOW_METHOD || undefined),
    handleNpay: () => startPayment("npay", "naverpayCard"),
    handleAddToCart,
  };
}
