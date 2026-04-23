"use client";

import {
  PaymentMethodSelector,
  type PaymentMethod,
} from "@/components/payment/PaymentMethodSelector";

interface StickyCtaButtonProps {
  productName: string;
  originalPrice: number;
  price: number;
  discountPercent: number;
  onCheckout: (method: PaymentMethod) => void;
  disabled?: boolean;
  disabledLabel?: string;
}

export function StickyCtaButton({
  productName,
  originalPrice,
  price,
  discountPercent,
  onCheckout,
  disabled,
  disabledLabel = "결제 준비 중...",
}: StickyCtaButtonProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t-2 border-[var(--foreground)] bg-white">
      <div className="mx-auto max-w-2xl px-4 py-3">
        {/* 상품 + 가격 */}
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <p
            className="flex-1 truncate text-xs font-medium text-[var(--foreground)]/60"
            title={productName}
          >
            {productName}
          </p>
          <div className="flex flex-shrink-0 items-baseline gap-1.5">
            <span className="text-xs text-[var(--foreground)]/40 line-through">
              {originalPrice.toLocaleString()}원
            </span>
            <span className="text-base font-bold text-[var(--foreground)]">
              {price.toLocaleString()}원
            </span>
            <span className="inline-flex items-center rounded-full border-2 border-[var(--foreground)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--foreground)]">
              {discountPercent}%
            </span>
          </div>
        </div>

        {/* 결제 수단 3개 (가로 분할) */}
        <PaymentMethodSelector
          onSelect={onCheckout}
          disabled={disabled}
          disabledLabel={disabledLabel}
          compact
        />
      </div>
    </div>
  );
}
