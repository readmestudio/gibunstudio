"use client";

/**
 * /minds 결제 모달 — 그 자리에서 카드 결제를 시작하는 오버레이.
 *
 * 페이월 CTA 가 워크북 랜딩으로 이동하는 대신, 리포트 위에 이 모달이 떠서 바로 NicePay
 * 결제창을 띄운다. 판매 상품은 "다섯 배역 + 관계 해설" 리포트(₩9,900)이며, 비로그인
 * leadId 기반 결제 훅(useMindsRelationshipCheckout)을 쓴다 — 로그인 없이 결제 가능.
 * 결제 완료 시 /minds/relationship/[id] 리포트 페이지로 이동한다(return 라우트가 처리).
 */

import { useEffect, useState } from "react";
import Script from "next/script";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { createClient } from "@/lib/supabase/client";
import { useMindsRelationshipCheckout } from "@/lib/payment/useMindsRelationshipCheckout";
import { M, dispStyle, leadStyle, Hr } from "./quiet-editorial";
import { MindsAuthGate } from "./MindsAuthGate";
import { MINDS_RELATIONSHIP_PRICE, MINDS_RELATIONSHIP_ORIGINAL_PRICE } from "@/lib/minds/relationship-constants";

const NICEPAY_CLIENT_ID = process.env.NEXT_PUBLIC_NICEPAY_MERCHANT_ID || "";
const NICEPAY_SDK_URL = process.env.NEXT_PUBLIC_NICEPAY_SDK_URL || "";

const won = (n: number) => `₩${n.toLocaleString("ko-KR")}`;

/** 결제 시 받게 되는 것 — 페이월에서 잠갔던 배역표·관계가 핵심. */
const INCLUDES = [
  "누가 리더·빌런·난봉꾼·관리자·추방자인지 5배역 배역표",
  "자꾸 부딪치는 두 마음의 갈등 구도 + 화해법",
  "자주 쓰는 방어기제 · 마음의 목소리 TOP 5 · 맞춤 처방",
];

type AuthState = "checking" | "anon" | "authed";

export function MindsCheckoutModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [authState, setAuthState] = useState<AuthState>("checking");

  const { handleKakao, handleNpay, isSubmitting } = useMindsRelationshipCheckout();

  // 모달이 열릴 때 로그인 상태를 확인한다. 비로그인이면 결제 대신 로그인 관문을 먼저 보여준다.
  // ("무료 리포트 후 결제 직전 로그인" 정책 — 로그인 한 번이면 결제까지 추가 로그인 없음.)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      // "checking" 리셋도 async 콜백 안에서 — effect 동기 본문에서 setState 하지 않는다.
      setAuthState("checking");
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!cancelled) setAuthState(user ? "authed" : "anon");
      } catch {
        if (!cancelled) setAuthState("anon");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const sdkPending = !!NICEPAY_CLIENT_ID && !sdkLoaded;

  // 결제 수단별 버튼이 공유하는 진입 — 추적 이벤트를 한 번 쏘고 해당 결제를 시작한다.
  const payWith = (run: () => void) => {
    trackMetaEvent("InitiateCheckout", {
      content_name: "minds_to_relationship",
      value: MINDS_RELATIONSHIP_PRICE,
      currency: "KRW",
    });
    run();
  };
  const payDisabled = isSubmitting || sdkPending;
  // 진행/로딩 중이면 모든 버튼이 같은 상태 문구를 보인다.
  const payLabel = (base: string) =>
    isSubmitting ? "결제 진행 중…" : sdkPending ? "결제 모듈 로딩 중…" : base;

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
            리포트 결제
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

        {authState === "checking" && (
          <div style={{ padding: "44px 0", textAlign: "center", fontFamily: M.font, fontSize: 14, color: M.mute }}>
            불러오는 중…
          </div>
        )}

        {authState === "anon" && (
          <MindsAuthGate onAuthed={() => setAuthState("authed")} />
        )}

        {authState === "authed" && (
        <>
        <h2 style={{ ...dispStyle, fontSize: 23 }}>
          다섯 배역과
          <br />
          그 관계 해설 받기
        </h2>
        <p style={{ ...leadStyle, fontSize: 14, marginTop: 12 }}>
          지금 만난 마음들을 그대로 이어받아, 누가 리더·빌런인지 배역표와 두 마음이
          부딪치는 관계까지 한 편의 리포트로 풀어드려요.
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

        {/* 가격 — 런칭 할인 앵커링(정가 취소선 → 판매가) */}
        <div style={{ marginTop: 20, textAlign: "center" }}>
          <span
            style={{
              display: "inline-block",
              fontFamily: M.mono,
              fontSize: 10.5,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: M.accent,
              border: `1px solid ${M.accent}`,
              borderRadius: 999,
              padding: "4px 10px",
            }}
          >
            런칭 할인
          </span>
          <div style={{ marginTop: 12, display: "flex", alignItems: "baseline", justifyContent: "center", gap: 10 }}>
            <span style={{ fontFamily: M.font, fontSize: 17, color: M.mute2, textDecoration: "line-through" }}>
              {won(MINDS_RELATIONSHIP_ORIGINAL_PRICE)}
            </span>
            <span style={{ ...dispStyle, fontSize: 28 }}>{won(MINDS_RELATIONSHIP_PRICE)}</span>
          </div>
        </div>

        {/* 결제 수단 CTA — 카카오페이 · 네이버페이 (브랜드 컬러는 모노톤 예외) */}
        <button
          type="button"
          onClick={() => payWith(handleKakao)}
          disabled={payDisabled}
          style={{
            width: "100%",
            marginTop: 18,
            padding: "16px",
            borderRadius: 2,
            background: "#FEE500",
            color: "#191919",
            fontFamily: M.font,
            fontWeight: 800,
            fontSize: 15.5,
            border: "none",
            cursor: "pointer",
            opacity: payDisabled ? 0.5 : 1,
          }}
          className="transition-transform active:scale-[0.99]"
        >
          {payLabel("카카오페이로 결제하기")}
        </button>
        <button
          type="button"
          onClick={() => payWith(handleNpay)}
          disabled={payDisabled}
          style={{
            width: "100%",
            marginTop: 10,
            padding: "16px",
            borderRadius: 2,
            background: "#03C75A",
            color: "#FFFFFF",
            fontFamily: M.font,
            fontWeight: 800,
            fontSize: 15.5,
            border: "none",
            cursor: "pointer",
            opacity: payDisabled ? 0.5 : 1,
          }}
          className="transition-transform active:scale-[0.99]"
        >
          {payLabel("네이버페이로 결제하기")}
        </button>
        <p style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: M.mute, fontFamily: M.font }}>
          결제 후 바로 리포트를 만들어 드려요(20~50초). NicePay 안전결제.
        </p>
        </>
        )}
      </div>
    </div>
  );
}
