"use client";

/**
 * 한국 이커머스 표준 3-action 구매 버튼 컴포넌트
 *
 * - 상단 행: 구매하기(primary) / 장바구니(secondary)
 * - 하단 행: Npay 구매(네이버페이 브랜드 pill)
 *
 * 결제 API 호출은 호출자 페이지가 담당하고, 이 컴포넌트는 액션 트리거만 책임진다.
 */

import { NpayLogo } from "./icons/NpayLogo";
import type { BuyAction } from "@/types/payment";

export interface ProductBuyButtonsProps {
  productId: string;
  productName: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  onBuyNow: () => void | Promise<void>;
  onAddToCart?: () => void | Promise<void>;
  onNpayBuy: () => void | Promise<void>;
  /** sticky 모드: fixed bottom fixed bar. inline 모드: 호출자가 감싼 컨테이너 내부 배치 */
  variant?: "inline" | "sticky";
  /** Phase 2 리포트처럼 장바구니에 담기가 어색한 상품의 경우 true */
  hideAddToCart?: boolean;
  isSubmitting?: boolean;
  /** 어느 버튼이 로딩 중인지 표시 */
  submittingAction?: BuyAction | null;
  disabled?: boolean;
  disabledLabel?: string;
}

export function ProductBuyButtons({
  productId,
  productName,
  price,
  originalPrice,
  discountPercent,
  onBuyNow,
  onAddToCart,
  onNpayBuy,
  variant = "inline",
  hideAddToCart = false,
  isSubmitting = false,
  submittingAction = null,
  disabled = false,
  disabledLabel = "결제 준비 중...",
}: ProductBuyButtonsProps) {
  const blockAll = disabled || isSubmitting;
  const showAddToCart = !hideAddToCart && !!onAddToCart;

  const buyLabel = submittingAction === "buyNow" ? "처리 중..." : "구매하기";
  const cartLabel = submittingAction === "addToCart" ? "담는 중..." : "장바구니";
  const npayLabel = submittingAction === "npay" ? "처리 중..." : "구매";

  const topRow = (
    <div
      className={`grid gap-2 ${showAddToCart ? "grid-cols-2" : "grid-cols-1"}`}
    >
      <button
        type="button"
        onClick={onBuyNow}
        disabled={blockAll}
        aria-busy={submittingAction === "buyNow"}
        aria-label={`${productName} 구매하기`}
        data-product-id={productId}
        className="rounded-lg border-2 border-[var(--foreground)] bg-[var(--foreground)] py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {buyLabel}
      </button>

      {showAddToCart && (
        <button
          type="button"
          onClick={onAddToCart}
          disabled={blockAll}
          aria-busy={submittingAction === "addToCart"}
          aria-label={`${productName} 장바구니에 담기`}
          data-product-id={productId}
          className="rounded-lg border-2 border-[var(--foreground)] bg-white py-3.5 text-sm font-bold text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cartLabel}
        </button>
      )}
    </div>
  );

  const npayButton = (
    <button
      type="button"
      onClick={onNpayBuy}
      disabled={blockAll}
      aria-busy={submittingAction === "npay"}
      aria-label={`${productName} 네이버페이로 구매`}
      data-product-id={productId}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-[#03C75A] py-3.5 text-sm font-bold text-black transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <NpayLogo className="h-4" />
      <span>{npayLabel}</span>
    </button>
  );

  const disabledHint =
    disabled && !isSubmitting ? (
      <p className="mt-2 text-center text-[11px] text-[var(--foreground)]/50">
        {disabledLabel}
      </p>
    ) : null;

  if (variant === "sticky") {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-[var(--foreground)] bg-white">
        <div className="mx-auto max-w-2xl px-4 py-3">
          {/* 상품명 + 가격 */}
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <p
              className="flex-1 truncate text-xs font-medium text-[var(--foreground)]/60"
              title={productName}
            >
              {productName}
            </p>
            <div className="flex flex-shrink-0 items-baseline gap-1.5">
              {originalPrice && originalPrice > price && (
                <span className="text-xs text-[var(--foreground)]/40 line-through">
                  {originalPrice.toLocaleString()}원
                </span>
              )}
              <span className="text-base font-bold text-[var(--foreground)]">
                {price.toLocaleString()}원
              </span>
              {typeof discountPercent === "number" && discountPercent > 0 && (
                <span className="inline-flex items-center rounded-full border-2 border-[var(--foreground)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--foreground)]">
                  {discountPercent}%
                </span>
              )}
            </div>
          </div>

          {topRow}
          <div className="mt-2">{npayButton}</div>
          {disabledHint}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {topRow}
      {npayButton}
      {disabledHint}
    </div>
  );
}
