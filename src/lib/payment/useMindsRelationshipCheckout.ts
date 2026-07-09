"use client";

/**
 * /minds 유료 "다섯 배역 + 관계 해설" 리포트(₩19,900) 결제 훅 — 비로그인.
 *
 * 워크북 결제(useWorkshopCheckout)와 달리 로그인이 필요 없다. localStorage 의 leadId 로
 * 결제 레코드를 만들고(/api/payment/minds-relationship/create), NicePay 결제창을 띄운다.
 * 이미 결제한 리드면 새 결제 대신 리포트 페이지로 보낸다(1인 1회).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MINDS_FUNNEL, type MindsFunnelConfig } from "@/lib/minds/funnel-config";

const NICEPAY_CLIENT_ID = process.env.NEXT_PUBLIC_NICEPAY_MERCHANT_ID || "";
const BUYNOW_METHOD = process.env.NEXT_PUBLIC_NICEPAY_BUYNOW_METHOD || "";

/**
 * funnel 인자로 저장키·상품구분·리다이렉트 베이스·상품명이 갈라진다(기본값 = /minds).
 * 무인자 호출은 현행 /minds 동작과 바이트 단위로 동일하다(무회귀).
 */
export function useMindsRelationshipCheckout(
  funnel: MindsFunnelConfig = MINDS_FUNNEL
) {
  const router = useRouter();
  const [isSubmitting, setSubmitting] = useState(false);

  async function startPayment(method?: string, phone?: string) {
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
        ? localStorage.getItem(funnel.leadStorageKey)
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
        // phone: 결제완료 알림톡 수신번호(결제 모달에서 입력받아 결제 레코드에 저장).
        // product: 서버가 orderId prefix(MR-/IC-)를 결정한다(기본 relationship).
        body: JSON.stringify({ leadId, phone: phone ?? "", product: funnel.product }),
      });
      const data = await res.json().catch(() => ({}));

      // 이미 결제한 리드 → 새 결제 없이 리포트로.
      if (data.already_purchased && data.purchase_id) {
        router.push(`${funnel.paidReportBase}/${data.purchase_id}`);
        return;
      }

      if (!res.ok || !data.order_id) {
        throw new Error(data.error || "결제 레코드 생성에 실패했습니다.");
      }

      window.AUTHNICE.requestPay({
        clientId: NICEPAY_CLIENT_ID,
        ...(method ? { method } : {}),
        orderId: data.order_id,
        // 결제창 금액은 서버가 create 때 확정해 돌려준 amount 를 그대로 쓴다 — inner-child
        // 가격 A/B(variant) 금액이 여기에 반영돼, pending·return 검증 금액과 자동 일치한다.
        // (구 응답 호환: amount 누락 시에만 퍼널 표시가로 폴백.)
        amount: typeof data.amount === "number" ? data.amount : funnel.price,
        goodsName: funnel.goodsName,
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
    // phone 은 결제완료 알림톡 수신번호로 함께 전달한다.
    handleBuyNow: (phone?: string) => startPayment(BUYNOW_METHOD || "card", phone),
    handleKakao: (phone?: string) => startPayment("kakaopay", phone),
    handleNpay: (phone?: string) => startPayment("naverpayCard", phone),
  };
}
