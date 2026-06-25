"use client";

/**
 * /minds 결제 모달 — 그 자리에서 카드 결제를 시작하는 오버레이.
 *
 * 기존엔 페이월 CTA가 워크북 랜딩(/payment/self-workshop/...)으로 *이동*했지만,
 * 이제 리포트 위에 이 모달이 떠서 바로 NicePay 결제창을 띄운다. 결제 로직은
 * 워크북 판매 화면들과 동일한 useWorkshopCheckout 훅을 재사용한다.
 *
 * [로그인 제약] 워크북 결제는 로그인 유저에 묶여 있다(workshop_purchases.user_id).
 * /minds 는 비로그인 리드젠 흐름이므로, 결제 버튼을 누르면 훅이 401을 받고 자동으로
 * /login?redirect=... 로 보낸 뒤, 로그인 후 결제를 잇는다. (제품 결정: 로그인 우선)
 */

import { useState } from "react";
import Script from "next/script";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { useWorkshopCheckout } from "@/lib/payment/useWorkshopCheckout";
import { M, dispStyle, leadStyle, ctaStyle, Hr } from "./quiet-editorial";
import {
  WORKSHOP_PRICE,
  WORKSHOP_ORIGINAL_PRICE,
  WORKSHOP_DISCOUNT_PERCENT,
} from "@/lib/self-workshop/landing-data";

const NICEPAY_CLIENT_ID = process.env.NEXT_PUBLIC_NICEPAY_MERCHANT_ID || "";
const NICEPAY_SDK_URL = process.env.NEXT_PUBLIC_NICEPAY_SDK_URL || "";

const won = (n: number) => `₩${n.toLocaleString("ko-KR")}`;

/** 결제 시 워크북에 포함되는 것 — 페이월에서 잠갔던 배역표·관계가 핵심. */
const INCLUDES = [
  "누가 내 정서를 끌고 가는 리더·빌런·추방자인지 배역표 공개",
  "자꾸 부딪치는 두 마음의 갈등 구도 분석",
  "지금 만난 마음들을 그대로 이어받는 풀 워크북",
];

export function MindsCheckoutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [sdkLoaded, setSdkLoaded] = useState(false);

  const { handleBuyNow, isSubmitting } = useWorkshopCheckout({
    productId: "achievement-addiction",
    workshopType: "achievement-addiction",
    amount: WORKSHOP_PRICE,
    goodsName: "심리 상담 워크북 - 성취 중독",
  });

  if (!open) return null;

  const sdkPending = !!NICEPAY_CLIENT_ID && !sdkLoaded;

  const onPay = () => {
    trackMetaEvent("InitiateCheckout", {
      content_name: "minds_to_workbook",
      value: WORKSHOP_PRICE,
      currency: "KRW",
    });
    handleBuyNow();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(16,15,14,0.55)",
        padding: "0 0 max(0px, env(safe-area-inset-bottom))",
      }}
    >
      {/* NicePay SDK 로드 */}
      {NICEPAY_CLIENT_ID && NICEPAY_SDK_URL && (
        <Script src={NICEPAY_SDK_URL} strategy="afterInteractive" onLoad={() => setSdkLoaded(true)} />
      )}

      {/* 시트 — 모바일 바텀시트 느낌. 내부 클릭은 닫힘 전파 차단 */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[448px]"
        style={{
          background: M.paper,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          padding: "22px 24px 28px",
          maxHeight: "92vh",
          overflowY: "auto",
          boxShadow: "0 -8px 40px rgba(16,15,14,0.18)",
        }}
      >
        {/* 핸들 + 닫기 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontFamily: M.mono, fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: M.mute }}>
            워크북 결제
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            style={{ border: "none", background: "none", cursor: "pointer", color: M.mute, fontSize: 20, lineHeight: 1, padding: 4 }}
          >
            ×
          </button>
        </div>

        <h2 style={{ ...dispStyle, fontSize: 23 }}>
          워크북으로
          <br />
          내 배역표 열기
        </h2>
        <p style={{ ...leadStyle, fontSize: 14, marginTop: 12 }}>
          지금 만난 마음들을 그대로 이어받아, 누가 리더이고 빌런인지·어떤 두 마음이
          부딪치는지를 워크북에서 풀어가요.
        </p>

        {/* 포함 내용 */}
        <div style={{ marginTop: 20 }}>
          <Hr />
          {INCLUDES.map((t, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 0", borderBottom: `1px solid ${M.line2}` }}>
              <span style={{ color: M.accent, fontWeight: 700, fontSize: 14, lineHeight: 1.5, flex: "0 0 auto" }}>✓</span>
              <span style={{ fontSize: 13.5, color: M.ink2, lineHeight: 1.55, fontFamily: M.font }}>{t}</span>
            </div>
          ))}
        </div>

        {/* 가격 */}
        <div style={{ marginTop: 20, display: "flex", alignItems: "baseline", justifyContent: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: M.mute, textDecoration: "line-through", fontFamily: M.font }}>
            {won(WORKSHOP_ORIGINAL_PRICE)}
          </span>
          <span style={{ ...dispStyle, fontSize: 26 }}>{won(WORKSHOP_PRICE)}</span>
          <span style={{ fontSize: 12.5, color: M.accent, fontWeight: 700, fontFamily: M.mono }}>
            -{WORKSHOP_DISCOUNT_PERCENT}%
          </span>
        </div>

        {/* 카드 결제 CTA */}
        <button
          type="button"
          onClick={onPay}
          disabled={isSubmitting || sdkPending}
          style={{ ...ctaStyle, marginTop: 18, opacity: isSubmitting || sdkPending ? 0.5 : 1 }}
          className="transition-transform active:scale-[0.99]"
        >
          {isSubmitting ? "결제 진행 중…" : sdkPending ? "결제 모듈 로딩 중…" : "카드로 결제하기"}
        </button>
        <p style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: M.mute, fontFamily: M.font }}>
          결제는 NicePay 안전결제로 진행돼요.
        </p>
      </div>
    </div>
  );
}
