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
import { MINDS_LEAD_STORAGE_KEY } from "@/lib/minds/storage";
import {
  trackWorkshopBuyAttempt,
  type WorkshopFunnelSource,
} from "@/lib/workshop/track";

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
  /**
   * 이 결제 훅이 특정 무료 퍼널(예: 성취중독 테스트)에 붙어 있을 때의 출처 키.
   * 지정되면 결제수단 버튼 클릭 즉시(로그인 전에도) 운영자 슬랙에 "구매 시도"를
   * 알린다. 미지정이면 알림을 보내지 않는다(일반 판매 화면 영향 없음).
   */
  funnelSource?: WorkshopFunnelSource;
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

    // 무료 퍼널(성취중독 테스트 등)에 붙어 있으면, 결제수단 버튼을 누른 "구매 시도"를
    // 클릭 즉시 운영자 슬랙에 알린다(로그인 전에도). 결제 생성 라우트의 알림(④)은
    // 로그인 인증 후에만 떠서 비로그인 시도를 놓치므로, 그 빈틈을 여기서 메운다.
    if (params.funnelSource) {
      trackWorkshopBuyAttempt(params.funnelSource, method ?? null);
    }

    // 무료 /minds 를 거쳐온 사용자라면, 그때 저장해 둔 리드 id 를 결제에 실어
    // 보낸다(없으면 null). 결제 승인 시 워크북 진행에 복사돼, 워크북 단계에서
    // minds 배역(parts_map)을 이어서 보여줄 연결 키가 된다.
    const mindsLeadId =
      typeof window !== "undefined"
        ? localStorage.getItem(MINDS_LEAD_STORAGE_KEY)
        : null;

    try {
      const res = await fetch("/api/payment/workshop/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshopType: params.workshopType,
          amount: params.amount,
          mindsLeadId,
          // 운영자 슬랙 알림에서 결제수단(카카오페이/네이버페이/카드)을 구분하기 위해
          // NicePay method 코드를 함께 보낸다. 결제 로직엔 영향 없음.
          method: method ?? null,
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
    // method는 NicePay 필수 파라미터(P007). env(NEXT_PUBLIC_NICEPAY_BUYNOW_METHOD)가
    // 비어 있으면 카드 결제("card")로 폴백한다.
    handleBuyNow: () => startPayment("buyNow", BUYNOW_METHOD || "card"),
    handleNpay: () => startPayment("npay", "naverpayCard"),
    // 카카오페이: NicePay 간편결제 method. 카드/네이버와 동일 파이프라인,
    // method만 "kakaopay"로 지정 → 카카오페이 전용 결제창이 열린다.
    handleKakao: () => startPayment("buyNow", "kakaopay"),
    handleAddToCart,
  };
}
