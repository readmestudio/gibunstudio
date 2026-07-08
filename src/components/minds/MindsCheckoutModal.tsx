"use client";

/**
 * /minds 결제 모달 — 그 자리에서 카드 결제를 시작하는 오버레이.
 *
 * 페이월 CTA 가 워크북 랜딩으로 이동하는 대신, 리포트 위에 이 모달이 떠서 바로 NicePay
 * 결제창을 띄운다. 판매 상품은 "다섯 배역 + 관계 해설" 리포트(₩9,900)이며, 비로그인
 * leadId 기반 결제 훅(useMindsRelationshipCheckout)을 쓴다 — 로그인 없이 결제 가능.
 * 결제 완료 시 /minds/relationship/[id] 리포트 페이지로 이동한다(return 라우트가 처리).
 */

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { createClient } from "@/lib/supabase/client";
import { useMindsRelationshipCheckout } from "@/lib/payment/useMindsRelationshipCheckout";
import { M, dispStyle, leadStyle, Hr } from "./quiet-editorial";
import { MindsAuthGate } from "./MindsAuthGate";
import { MINDS_FUNNEL, type MindsFunnelConfig } from "@/lib/minds/funnel-config";
import { isValidKrMobile } from "@/lib/solapi/client";

const NICEPAY_CLIENT_ID = process.env.NEXT_PUBLIC_NICEPAY_MERCHANT_ID || "";
const NICEPAY_SDK_URL = process.env.NEXT_PUBLIC_NICEPAY_SDK_URL || "";

const won = (n: number) => `₩${n.toLocaleString("ko-KR")}`;

type AuthState = "checking" | "anon" | "authed";

export function MindsCheckoutModal({
  open,
  onClose,
  funnel = MINDS_FUNNEL,
}: {
  open: boolean;
  onClose: () => void;
  funnel?: MindsFunnelConfig;
}) {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [authState, setAuthState] = useState<AuthState>("checking");
  // 결제완료 알림톡 수신번호 — profiles.phone 이 있으면 프리필하고, 사용자가 수정 가능.
  const [phone, setPhone] = useState("");
  // 로그인 관문을 "결제 버튼을 누른 순간"에만 연다(상품·가격은 비로그인도 먼저 본다).
  // gateOpen=true 면 관문을 띄우고, 로그인 성공 즉시 기억해 둔 결제를 이어간다.
  const [gateOpen, setGateOpen] = useState(false);
  const pendingRunRef = useRef<((phone: string) => void) | null>(null);

  // 상품 설명(제목·리드·포함목록)만 퍼널별로 갈라진다. 기본값 = 현행 /minds 카피.
  const copy = funnel.checkoutCopy;

  const { handleKakao, handleNpay, isSubmitting } = useMindsRelationshipCheckout(funnel);

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
        // 로그인 상태면 저장된 전화번호를 미리 채워 재입력 부담을 줄인다.
        if (user) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("phone")
            .eq("id", user.id)
            .maybeSingle();
          if (!cancelled && prof?.phone) setPhone(prof.phone);
        }
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

  // 결제 수단별 버튼이 공유하는 진입 — 번호 검증 후 추적 이벤트를 쏘고 결제를 시작한다.
  // phone 은 결제완료 알림톡 수신번호로 결제 훅에 함께 넘긴다(필수).
  // 로그인 전이면 결제를 바로 시작하지 않고, '결제 의사'를 기억한 뒤 로그인 관문을 연다.
  // (상품·가격·결제버튼을 먼저 보여주고, 결제를 누르는 순간에만 로그인 — 이탈 방지.)
  const payWith = (run: (phone: string) => void) => {
    if (!isValidKrMobile(phone)) {
      alert("알림톡을 받을 휴대폰 번호를 정확히 입력해주세요. (예: 010-1234-5678)");
      return;
    }
    trackMetaEvent("InitiateCheckout", {
      // 광고 최적화 신호가 퍼널별로 섞이지 않게 variant 로 분리(기본 minds_to_relationship).
      content_name:
        funnel.variant === "minds"
          ? "minds_to_relationship"
          : "inner_child_to_report",
      value: funnel.price,
      currency: "KRW",
    });
    if (authState !== "authed") {
      pendingRunRef.current = run;
      setGateOpen(true);
      return;
    }
    run(phone);
  };

  // 로그인/가입 성공 직후 호출 — 관문을 닫고, 눌러 뒀던 결제를 그대로 이어간다.
  // (이메일 로그인은 그 자리에서 이어지고, 카카오는 리다이렉트 복귀 후 결제버튼을 다시 누른다.)
  const resumeAfterAuth = () => {
    setAuthState("authed");
    setGateOpen(false);
    const run = pendingRunRef.current;
    pendingRunRef.current = null;
    if (run) run(phone);
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

        {/* 결제 버튼을 누른 뒤에만 뜨는 로그인 관문. 성공하면 눌러 뒀던 결제로 곧장 이어진다. */}
        {authState !== "checking" && gateOpen && authState !== "authed" && (
          <MindsAuthGate onAuthed={resumeAfterAuth} funnel={funnel} />
        )}

        {/* 상품·가격·결제버튼 — 비로그인도 먼저 본다(로그인은 결제 클릭 시점으로 미룸). */}
        {authState !== "checking" && !(gateOpen && authState !== "authed") && (
        <>
        <h2 style={{ ...dispStyle, fontSize: 23 }}>{copy.title}</h2>
        <p style={{ ...leadStyle, fontSize: 14, marginTop: 12 }}>{copy.lead}</p>

        {/* 포함 내용 */}
        <div style={{ marginTop: 20 }}>
          <Hr />
          {copy.includes.map((t, i) => (
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
              {won(funnel.originalPrice)}
            </span>
            <span style={{ ...dispStyle, fontSize: 28 }}>{won(funnel.price)}</span>
          </div>
        </div>

        {/* 알림톡 수신번호 — 결제·리포트 완료 안내를 이 번호로 보낸다(필수) */}
        <div style={{ marginTop: 20 }}>
          <label
            htmlFor="minds-alimtalk-phone"
            style={{ fontFamily: M.mono, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: M.mute }}
          >
            알림톡 받을 휴대폰
          </label>
          <input
            id="minds-alimtalk-phone"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-1234-5678"
            style={{
              width: "100%",
              marginTop: 6,
              padding: "13px 14px",
              borderRadius: 2,
              border: `1.5px solid ${M.line}`,
              background: M.paper2,
              fontFamily: M.font,
              fontSize: 15,
              color: M.ink,
              outline: "none",
            }}
          />
          <p style={{ margin: "6px 0 0", fontSize: 11.5, color: M.mute, fontFamily: M.font, lineHeight: 1.5 }}>
            결제·리포트 제작 완료 안내를 카카오 알림톡으로 보내드려요.
          </p>
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
        {/* 결제 전 고지 — 즉시 제작 · 환불 제한(주문 제작형 디지털 콘텐츠 청약철회 제한 사전고지).
            법적 효력을 위해 결제 버튼 바로 아래에 눈에 띄게 배치한다. */}
        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            border: `1.5px solid ${M.ink2}`,
            borderRadius: 6,
            background: M.paper,
          }}
        >
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: M.ink2, fontFamily: M.font }}>
            <strong style={{ fontWeight: 800 }}>결제 즉시 리포트 제작이 시작</strong>돼요(20~50초).
            주문과 동시에 만들어지는 디지털 콘텐츠라,{" "}
            <strong style={{ fontWeight: 800 }}>결제 후에는 환불이 어려운</strong> 점 꼭 확인 후 진행해 주세요.
          </p>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
