"use client";

/**
 * 내면 아이 찾기 워크샵(₩99,000) 결제 모달 — MindsCheckoutModal 미러(워크샵 전용).
 *
 * 리포트 모달과 달리 로그인 필수 상품이라(훅이 401 → /login 게이트) 이름을 함께 받는다 —
 * name 은 intake 표시 이름 + 알림톡 고객명으로 쓰인다. phone 은 진단 링크 알림톡 수신번호(필수).
 * 결제 훅: useWorkshopIntakeCheckout — 이미 결제한 계정이면 /intake/{token} 으로 보낸다.
 *
 * ⚠️ 지금은 기능 검증용 모노톤 최소 UI — 디자인 핸드오프 문서 도착 후 리스킨 예정.
 */

import { useEffect, useState } from "react";
import Script from "next/script";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { createClient } from "@/lib/supabase/client";
import { useWorkshopIntakeCheckout } from "@/lib/payment/useWorkshopIntakeCheckout";
import {
  WORKSHOP_PRICE,
  WORKSHOP_ORIGINAL_PRICE,
} from "@/lib/minds/relationship-constants";
import { isValidKrMobile } from "@/lib/solapi/client";

const NICEPAY_CLIENT_ID = process.env.NEXT_PUBLIC_NICEPAY_MERCHANT_ID || "";
const NICEPAY_SDK_URL = process.env.NEXT_PUBLIC_NICEPAY_SDK_URL || "";

const won = (n: number) => `₩${n.toLocaleString("ko-KR")}`;

// 포함 내용 — 플레이스홀더 카피(디자인 핸드오프 문서로 교체 예정).
const INCLUDES = [
  "결제 후 상담사용 사전 진단(약 10~15분)",
  "1:1 상담사와 함께하는 내면 아이 워크샵",
  "나를 지켜온 방어 패턴과 재양육 방향",
  "워크샵 이후 일상에서 쓰는 자기 돌봄 가이드",
];

export function WorkshopCheckoutModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  // 이름 — intake display_name + 알림톡 고객명(필수). 로그인 프로필로 프리필.
  const [name, setName] = useState("");
  // 진단 링크 알림톡 수신번호(필수). profiles.phone 으로 프리필하고 수정 가능.
  const [phone, setPhone] = useState("");

  const { handleKakao, handleNpay, handleBuyNow, isSubmitting } =
    useWorkshopIntakeCheckout();

  // 모달 오픈 시 InitiateCheckout — 워크샵 퍼널 전용 content_name 으로 분리.
  useEffect(() => {
    if (!open) return;
    trackMetaEvent("InitiateCheckout", {
      content_name: "inner_child_workshop",
      value: WORKSHOP_PRICE,
      currency: "KRW",
    });
  }, [open]);

  // 로그인 상태면 저장된 이름·전화번호를 프리필해 재입력 부담을 줄인다(프리필 전용 —
  // 여기서 로그인을 막지 않는다. 로그인 게이트는 결제 훅의 401 처리가 담당).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void (async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const meta = user.user_metadata as Record<string, unknown> | null;
        const metaName =
          (typeof meta?.name === "string" && meta.name) ||
          (typeof meta?.full_name === "string" && meta.full_name) ||
          "";
        if (metaName) setName((prev) => prev || metaName);
        const { data: prof } = await supabase
          .from("profiles")
          .select("phone")
          .eq("id", user.id)
          .maybeSingle();
        const profPhone = typeof prof?.phone === "string" ? prof.phone : "";
        if (!cancelled && profPhone) setPhone((prev) => prev || profPhone);
      } catch {
        /* 프리필 실패는 무시 — 직접 입력하면 된다. */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  if (!open) return null;

  const sdkPending = !!NICEPAY_CLIENT_ID && !sdkLoaded;
  const payDisabled = isSubmitting || sdkPending;
  const payLabel = (base: string) =>
    isSubmitting ? "결제 진행 중…" : sdkPending ? "결제 모듈 로딩 중…" : base;

  // 결제 수단별 공유 진입 — 이름·번호 검증 후 훅에 { phone, name } 을 넘긴다.
  const payWith = (
    run: (opts: { phone: string; name?: string }) => void
  ) => {
    if (!name.trim()) {
      alert("이름을 입력해주세요. (진단·안내에 사용돼요)");
      return;
    }
    if (!isValidKrMobile(phone)) {
      alert("알림톡을 받을 휴대폰 번호를 정확히 입력해주세요. (예: 010-1234-5678)");
      return;
    }
    run({ phone, name: name.trim() });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/55"
    >
      {/* NicePay SDK 로드 */}
      {NICEPAY_CLIENT_ID && NICEPAY_SDK_URL && (
        <Script
          src={NICEPAY_SDK_URL}
          strategy="afterInteractive"
          onLoad={() => setSdkLoaded(true)}
        />
      )}

      {/* 시트 — 모바일 바텀시트. 내부 클릭은 닫힘 전파 차단 */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[448px] max-h-[92vh] overflow-y-auto bg-white border-2 border-[var(--foreground)] rounded-t-2xl px-6 pt-5 pb-7"
      >
        {/* 헤더 + 닫기 */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-[11px] tracking-[0.2em] uppercase text-neutral-500">
            워크샵 결제
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="p-1 text-xl leading-none text-neutral-500"
          >
            ×
          </button>
        </div>

        {/* 상품 설명 — 플레이스홀더 카피(디자인 핸드오프 문서로 교체 예정) */}
        <h2 className="text-[22px] font-bold leading-snug text-[var(--foreground)]">
          심리 상담사와 함께하는
          <br />
          내면 아이 찾기 워크샵
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-neutral-600">
          혼자 하는 테스트가 아니라, 상담사가 직접 나의 내면 아이를 함께
          찾아가는 1:1 워크샵이에요.
        </p>

        {/* 포함 내용 */}
        <ul className="mt-5 border-t-2 border-[var(--foreground)]">
          {INCLUDES.map((t, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 border-b border-neutral-200 py-3"
            >
              <span className="shrink-0 text-sm font-bold text-[var(--foreground)]">
                ✓
              </span>
              <span className="text-[13.5px] leading-relaxed text-neutral-700">
                {t}
              </span>
            </li>
          ))}
        </ul>

        {/* 가격 — 런칭 할인 앵커링(정가 취소선 → 판매가) */}
        <div className="mt-5 text-center">
          <span className="inline-block rounded-full border border-[var(--foreground)] px-3 py-1 text-[11px] tracking-[0.12em] uppercase text-[var(--foreground)]">
            런칭 할인
          </span>
          <div className="mt-3 flex items-baseline justify-center gap-2.5">
            <span className="text-[17px] text-neutral-400 line-through">
              {won(WORKSHOP_ORIGINAL_PRICE)}
            </span>
            <span className="text-[28px] font-extrabold text-[var(--foreground)]">
              {won(WORKSHOP_PRICE)}
            </span>
          </div>
        </div>

        {/* 이름 — intake 표시 이름 + 알림톡 고객명 */}
        <div className="mt-5">
          <label
            htmlFor="workshop-buyer-name"
            className="text-[11px] tracking-[0.14em] uppercase text-neutral-500"
          >
            이름 <span className="font-bold text-[var(--foreground)]">· 필수</span>
          </label>
          <input
            id="workshop-buyer-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="홍길동"
            className="mt-1.5 w-full rounded-sm border-2 border-[var(--foreground)] bg-white px-3.5 py-3 text-[15px] text-[var(--foreground)] outline-none"
          />
        </div>

        {/* 알림톡 수신번호 — 결제 완료·진단 링크 안내를 이 번호로 보낸다(필수) */}
        <div className="mt-4">
          <label
            htmlFor="workshop-alimtalk-phone"
            className="text-[11px] tracking-[0.14em] uppercase text-neutral-500"
          >
            알림톡 받을 휴대폰{" "}
            <span className="font-bold text-[var(--foreground)]">· 필수</span>
          </label>
          <input
            id="workshop-alimtalk-phone"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-1234-5678"
            className="mt-1.5 w-full rounded-sm border-2 border-[var(--foreground)] bg-white px-3.5 py-3 text-[15px] text-[var(--foreground)] outline-none"
          />
          <p className="mt-1.5 text-[11.5px] leading-relaxed text-neutral-500">
            결제 완료와 사전 진단 링크를 카카오 알림톡으로 보내드려요.
          </p>
        </div>

        {/* 결제 수단 CTA — 카카오페이 · 네이버페이 (브랜드 컬러는 모노톤 예외) */}
        <button
          type="button"
          onClick={() => payWith(handleKakao)}
          disabled={payDisabled}
          className="mt-5 w-full rounded-sm py-4 text-[15.5px] font-extrabold transition-transform active:scale-[0.99] disabled:opacity-50"
          style={{ background: "#FEE500", color: "#191919" }}
        >
          {payLabel("카카오페이로 결제하기")}
        </button>
        <button
          type="button"
          onClick={() => payWith(handleNpay)}
          disabled={payDisabled}
          className="mt-2.5 w-full rounded-sm py-4 text-[15.5px] font-extrabold text-white transition-transform active:scale-[0.99] disabled:opacity-50"
          style={{ background: "#03C75A" }}
        >
          {payLabel("네이버페이로 결제하기")}
        </button>
        {/* 카드결제 — 간편결제를 안 쓰는 이용자용(모노톤: 검정 버튼). 훅의 handleBuyNow
            는 method="card" 로 진입해 NicePay 카드 결제창을 띄운다. */}
        <button
          type="button"
          onClick={() => payWith(handleBuyNow)}
          disabled={payDisabled}
          className="mt-2.5 w-full rounded-sm border-2 border-[var(--foreground)] bg-[var(--foreground)] py-4 text-[15.5px] font-extrabold text-white transition-transform active:scale-[0.99] disabled:opacity-50"
        >
          {payLabel("카드로 결제하기")}
        </button>

        {/* 결제 전 고지 — 환불 제한 + 문의 채널(법적 고지라 결제 버튼 바로 아래 배치) */}
        <div className="mt-3.5 rounded-md border-2 border-[var(--foreground)] px-3.5 py-3">
          <p className="m-0 text-[13px] leading-relaxed text-neutral-700">
            결제 즉시 <strong className="font-extrabold">사전 진단이 시작</strong>
            되는 워크샵 상품이에요. 진단 제출 전에는 전액 환불이 가능하지만,{" "}
            <strong className="font-extrabold">
              진단 제출 후에는 환불이 어려운
            </strong>{" "}
            점 꼭 확인 후 진행해 주세요. 문의는 카카오톡{" "}
            <strong className="font-extrabold">gibunstudio</strong> 로 부탁드려요.
          </p>
        </div>
      </div>
    </div>
  );
}
