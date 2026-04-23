"use client";

import {
  ProductBuyButtons,
  type ProductBuyButtonsProps,
} from "@/components/commerce/ProductBuyButtons";

interface StickyCtaButtonProps
  extends Pick<
    ProductBuyButtonsProps,
    | "productId"
    | "productName"
    | "onBuyNow"
    | "onAddToCart"
    | "onNpayBuy"
    | "disabled"
    | "disabledLabel"
    | "isSubmitting"
    | "submittingAction"
    | "hideAddToCart"
  > {
  originalPrice: number;
  price: number;
  discountPercent: number;
}

export function StickyCtaButton({
  productId,
  productName,
  originalPrice,
  price,
  discountPercent,
  onBuyNow,
  onAddToCart,
  onNpayBuy,
  hideAddToCart,
  disabled,
  disabledLabel,
  isSubmitting,
  submittingAction,
}: StickyCtaButtonProps) {
  return (
    <ProductBuyButtons
      variant="sticky"
      productId={productId}
      productName={productName}
      price={price}
      originalPrice={originalPrice}
      discountPercent={discountPercent}
      onBuyNow={onBuyNow}
      onAddToCart={onAddToCart}
      onNpayBuy={onNpayBuy}
      hideAddToCart={hideAddToCart}
      isSubmitting={isSubmitting}
      submittingAction={submittingAction}
      disabled={disabled}
      disabledLabel={disabledLabel}
    />
  );
}
