"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useWorkshopCheckout } from "@/lib/payment/useWorkshopCheckout";
import { WORKSHOP_PRICE } from "@/lib/self-workshop/landing-data";

const NICEPAY_CLIENT_ID = process.env.NEXT_PUBLIC_NICEPAY_MERCHANT_ID || "";
const NICEPAY_SDK_URL =
  process.env.NEXT_PUBLIC_NICEPAY_SDK_URL || "https://pay.nicepay.co.kr/v1/js/";

const PRODUCT_ID = "achievement-addiction";
const GOODS_NAME = "심리 상담 워크북 - 성취 중독";

interface WorkshopCheckoutContextValue {
  /** 클릭 즉시 NicePay 결제창을 띄운다 (미로그인 → 로그인 페이지로). */
  buy: () => void;
  /** 결제 진행중 — 버튼 disable / 라벨 전환용 */
  isSubmitting: boolean;
  /** SDK 아직 로딩중(머천트 ID가 있을 때만) — 버튼 disable용 */
  sdkPending: boolean;
}

const WorkshopCheckoutContext =
  createContext<WorkshopCheckoutContextValue | null>(null);

export function useWorkshopCheckoutCtx() {
  const ctx = useContext(WorkshopCheckoutContext);
  if (!ctx) {
    throw new Error(
      "useWorkshopCheckoutCtx must be used inside <WorkshopCheckoutProvider>"
    );
  }
  return ctx;
}

/**
 * 워크북 랜딩(`/payment/self-workshop`, `/achievement-addiction`)의 모든
 * "결제하기" CTA가 공유하는 결제 컨텍스트.
 *
 * - NicePay SDK를 페이지당 한 번만 로드(여러 버튼이 같은 SDK·훅 인스턴스 공유).
 * - 무료 자가 진단을 거치지 않고, 클릭 즉시 결제창(`requestPay`)을 띄운다.
 * - 미로그인/이미구매/SDK 미로드는 `useWorkshopCheckout`가 일괄 처리.
 */
export function WorkshopCheckoutProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [sdkLoaded, setSdkLoaded] = useState(false);

  const { isSubmitting, handleBuyNow } = useWorkshopCheckout({
    productId: PRODUCT_ID,
    workshopType: PRODUCT_ID,
    amount: WORKSHOP_PRICE,
    goodsName: GOODS_NAME,
    // 이미 구매한 사용자 → 워크북 제작 현황(생성 중) 안내로.
    onAlreadyPurchased: () =>
      router.push("/dashboard/self-workshop/generating"),
  });

  // 머천트 ID가 설정된 경우에만 SDK 로드를 기다린다. 미설정이면 버튼은
  // 활성 상태로 두고, 클릭 시 훅이 "결제 모듈 미설정" 안내를 띄운다.
  const sdkPending = !!NICEPAY_CLIENT_ID && !sdkLoaded;

  return (
    <WorkshopCheckoutContext.Provider
      value={{ buy: handleBuyNow, isSubmitting, sdkPending }}
    >
      {NICEPAY_CLIENT_ID && (
        <Script
          src={NICEPAY_SDK_URL}
          strategy="afterInteractive"
          onLoad={() => setSdkLoaded(true)}
          onReady={() => setSdkLoaded(true)}
        />
      )}
      {children}
    </WorkshopCheckoutContext.Provider>
  );
}
