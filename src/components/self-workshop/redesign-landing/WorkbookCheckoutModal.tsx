"use client";

import { useEffect } from "react";
import { WORKSHOP_PRICE } from "@/lib/self-workshop/landing-data";
import { useWorkshopCheckoutCtx } from "./WorkshopCheckoutContext";

const won = (n: number) => `₩${n.toLocaleString("ko-KR")}`;

/**
 * 결제 수단 선택 모달.
 *
 * CTA(`WorkbookBuyButton`)를 누르면 곧바로 결제창이 뜨는 대신 이 모달이 열리고,
 * 사용자가 카카오페이 / 네이버페이 / 카드 중 하나를 고르면 해당 NicePay 결제창을 띄운다.
 * 결제 동작은 모두 `WorkshopCheckoutContext`에 모여 있으므로 여기서는 호출만 한다.
 *
 * Provider가 `.lr` 네임스페이스 바깥에서 렌더되므로, 스코프된 CSS가 먹도록
 * 모달 마크업 전체를 `<div className="lr">`로 감싼다.
 */
export function WorkbookCheckoutModal() {
  const {
    isModalOpen,
    closeModal,
    payKakao,
    payNpay,
    buy,
    isSubmitting,
    sdkPending,
  } = useWorkshopCheckoutCtx();

  // 열렸을 때: ESC 닫기 + 배경 스크롤 잠금.
  useEffect(() => {
    if (!isModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isModalOpen, closeModal]);

  if (!isModalOpen) return null;

  const blocked = isSubmitting || sdkPending;

  // 결제 수단 선택 → 결제창 호출 후 모달 닫기.
  const choose = (run: () => void) => () => {
    run();
    closeModal();
  };

  return (
    <div className="lr">
      <div
        className="lr-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="결제 수단 선택"
        onClick={closeModal}
      >
        <div className="lr-modal" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="lr-modal-close"
            onClick={closeModal}
            aria-label="닫기"
          >
            ✕
          </button>

          <p className="lr-modal-kicker">결제 수단 선택</p>
          <p className="lr-modal-amount">{won(WORKSHOP_PRICE)}</p>
          <p className="lr-modal-desc">
            원하시는 결제 수단을 선택하면 안전한 NicePay 결제창이 열려요.
          </p>

          <div className="lr-modal-methods">
            <button
              type="button"
              onClick={choose(payKakao)}
              disabled={blocked}
              className="lr-modal-method lr-modal-kakao"
            >
              <span className="lr-modal-method-dot" aria-hidden />
              카카오페이
            </button>
            <button
              type="button"
              onClick={choose(payNpay)}
              disabled={blocked}
              className="lr-modal-method lr-modal-naver"
            >
              <span className="lr-modal-method-dot" aria-hidden />
              네이버페이
            </button>
            <button
              type="button"
              onClick={choose(buy)}
              disabled={blocked}
              className="lr-modal-method lr-modal-card"
            >
              <span className="lr-modal-method-dot" aria-hidden />
              신용·체크카드
            </button>
          </div>

          {sdkPending && (
            <p className="lr-modal-note">결제 모듈을 불러오는 중입니다…</p>
          )}
        </div>
      </div>
    </div>
  );
}
