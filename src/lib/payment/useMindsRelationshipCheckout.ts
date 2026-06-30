"use client";

/**
 * /minds 유료 "다섯 배역 + 관계 해설" 리포트(₩9,900) 결제 훅 — 비로그인.
 *
 * 워크북 결제(useWorkshopCheckout)와 달리 로그인이 필요 없다. localStorage 의 leadId 로
 * 결제 레코드를 만들고(/api/payment/minds-relationship/create), NicePay 결제창을 띄운다.
 * 이미 결제한 리드면 새 결제 대신 리포트 페이지로 보낸다(1인 1회).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MINDS_LEAD_STORAGE_KEY } from "@/lib/minds/storage";
import {
  MINDS_RELATIONSHIP_PRICE,
  MINDS_RELATIONSHIP_GOODS_NAME,
} from "@/lib/minds/relationship-constants";

const NICEPAY_CLIENT_ID = process.env.NEXT_PUBLIC_NICEPAY_MERCHANT_ID || "";
const BUYNOW_METHOD = process.env.NEXT_PUBLIC_NICEPAY_BUYNOW_METHOD || "";

export function useMindsRelationshipCheckout() {
  const router = useRouter();
  const [isSubmitting, setSubmitting] = useState(false);

  async function startPayment(method?: string) {
    if (!NICEPAY_CLIENT_ID) {
      alert("결제 모듈이 아직 설정되지 않았어요. 잠시 후 다시 시도해주세요.");
      return;
    }
    if (!window.AUTHNICE) {
      alert("결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    const leadId =
      typeof window !== "undefined"
        ? localStorage.getItem(MINDS_LEAD_STORAGE_KEY)
        : null;
    if (!leadId) {
      alert("테스트 기록을 찾을 수 없어요. 무료 테스트를 먼저 완료해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/payment/minds-relationship/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      const data = await res.json().catch(() => ({}));

      // 이미 결제한 리드 → 새 결제 없이 리포트로.
      if (data.already_purchased && data.purchase_id) {
        router.push(`/minds/relationship/${data.purchase_id}`);
        return;
      }

      if (!res.ok || !data.order_id) {
        throw new Error(data.error || "결제 레코드 생성에 실패했습니다.");
      }

      window.AUTHNICE.requestPay({
        clientId: NICEPAY_CLIENT_ID,
        ...(method ? { method } : {}),
        orderId: data.order_id,
        amount: MINDS_RELATIONSHIP_PRICE,
        goodsName: MINDS_RELATIONSHIP_GOODS_NAME,
        returnUrl: `${window.location.origin}/api/payment/nicepay/return`,
        fnError: (result: { errorMsg: string }) => {
          console.error("NicePay 에러:", result);
          alert(`결제 오류: ${result.errorMsg}`);
          setSubmitting(false);
        },
      });
    } catch (err) {
      console.error("결제 시작 오류:", err);
      alert("결제를 시작할 수 없습니다. 잠시 후 다시 시도해주세요.");
      setSubmitting(false);
    }
  }

  return {
    isSubmitting,
    // method 는 NicePay 필수 파라미터(P007). env 가 비면 카드 결제로 폴백.
    handleBuyNow: () => startPayment(BUYNOW_METHOD || "card"),
    handleKakao: () => startPayment("kakaopay"),
    handleNpay: () => startPayment("naverpayCard"),
  };
}
