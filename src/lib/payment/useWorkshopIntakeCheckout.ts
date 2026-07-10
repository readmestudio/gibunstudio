"use client";

/**
 * "내면 아이 찾기 워크샵"(₩99,000) 결제 훅 — 로그인 필수.
 *
 * 리포트 결제(useMindsRelationshipCheckout)와 달리 leadId·무료 테스트가 없는 직접 구매다.
 * 비로그인이면 /login 으로 게이트하고(결제 페이지로 복귀), 이미 결제한 계정이면 새 결제
 * 대신 사전진단(/intake/{token})으로 보낸다(1인 1회). 승인되면 return 라우트가 intake
 * 토큰을 발급해 완료 페이지로 리다이렉트한다.
 *
 * ⚠️ 파일명 주의: useWorkshopCheckout.ts 는 기존 워크북(자기주도 워크샵) 결제 훅이라
 *   별도 파일로 분리했다(상품·테이블·정책이 전혀 다름).
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  WORKSHOP_PRICE,
  WORKSHOP_GOODS_NAME,
} from "@/lib/minds/relationship-constants";

const NICEPAY_CLIENT_ID = process.env.NEXT_PUBLIC_NICEPAY_MERCHANT_ID || "";
const BUYNOW_METHOD = process.env.NEXT_PUBLIC_NICEPAY_BUYNOW_METHOD || "";

/** 결제 모달에서 받는 구매자 정보 — phone 은 진단 링크 알림톡 발송에 필수. */
export interface WorkshopIntakeCheckoutOpts {
  phone: string;
  name?: string;
  email?: string;
}

export function useWorkshopIntakeCheckout() {
  const router = useRouter();
  const [isSubmitting, setSubmitting] = useState(false);

  async function startPayment(
    method: string | undefined,
    opts: WorkshopIntakeCheckoutOpts
  ) {
    if (!NICEPAY_CLIENT_ID) {
      alert("결제 모듈이 아직 설정되지 않았어요. 잠시 후 다시 시도해주세요.");
      return;
    }
    if (!window.AUTHNICE) {
      alert("결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/payment/workshop-intake/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: opts.phone,
          name: opts.name ?? "",
          email: opts.email ?? "",
        }),
      });
      const data = await res.json().catch(() => ({}));

      // 로그인 필수 — 비로그인이면 /login 으로 게이트하고, 로그인 후 결제 페이지로
      // 복귀시킨다(?checkout=1 로 결제 모달을 다시 열 수 있게 표시).
      if (res.status === 401) {
        router.push(
          `/login?next=${encodeURIComponent(window.location.pathname + "?checkout=1")}`
        );
        return;
      }

      // 이미 결제한 계정 → 새 결제 없이 사전진단으로(1인 1회).
      if (data.already_purchased && data.intake_token) {
        router.push(`/intake/${data.intake_token}`);
        return;
      }

      if (!res.ok || !data.order_id) {
        throw new Error(data.error || "결제 레코드 생성에 실패했습니다.");
      }

      window.AUTHNICE.requestPay({
        clientId: NICEPAY_CLIENT_ID,
        ...(method ? { method } : {}),
        orderId: data.order_id,
        // 결제창 금액은 서버가 create 때 확정해 돌려준 amount 를 그대로 쓴다 —
        // pending·return 검증 금액과 자동 일치한다. (누락 시에만 상수로 폴백.)
        amount: typeof data.amount === "number" ? data.amount : WORKSHOP_PRICE,
        goodsName: WORKSHOP_GOODS_NAME,
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
    handleBuyNow: (opts: WorkshopIntakeCheckoutOpts) =>
      startPayment(BUYNOW_METHOD || "card", opts),
    handleKakao: (opts: WorkshopIntakeCheckoutOpts) =>
      startPayment("kakaopay", opts),
    handleNpay: (opts: WorkshopIntakeCheckoutOpts) =>
      startPayment("naverpayCard", opts),
  };
}
