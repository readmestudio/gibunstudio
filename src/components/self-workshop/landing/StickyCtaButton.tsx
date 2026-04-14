"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DiscountPriceDisplay } from "./DiscountPriceDisplay";

interface StickyCtaButtonProps {
  productName: string;
  originalPrice: number;
  price: number;
  discountPercent: number;
  features?: string[];
  onCheckout: () => void;
  disabled?: boolean;
  disabledLabel?: string;
  toggleLabel?: string;
  checkoutLabel?: string;
}

export function StickyCtaButton({
  productName,
  originalPrice,
  price,
  discountPercent,
  features,
  onCheckout,
  disabled,
  disabledLabel = "결제 준비 중...",
  toggleLabel = "구매하기",
  checkoutLabel = "결제하기",
}: StickyCtaButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  function handleCheckout() {
    setIsOpen(false);
    onCheckout();
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.button
            key="sticky-backdrop"
            type="button"
            aria-label="드롭다운 닫기"
            onClick={() => setIsOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[var(--foreground)]/20"
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-0 left-0 right-0 z-50">
        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              key="sticky-dropdown"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden border-t-2 border-[var(--foreground)] bg-white"
            >
              <div className="mx-auto max-w-2xl px-4 py-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-[var(--foreground)]/40">
                      선택한 상품
                    </p>
                    <p
                      className="mt-1 text-base font-semibold text-[var(--foreground)]"
                      style={{ wordBreak: "keep-all" }}
                    >
                      {productName}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-lg text-[var(--foreground)]/50 hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                    aria-label="닫기"
                  >
                    ✕
                  </button>
                </div>

                <div className="mt-4">
                  <DiscountPriceDisplay
                    originalPrice={originalPrice}
                    price={price}
                    discountPercent={discountPercent}
                    size="lg"
                  />
                </div>

                {features && features.length > 0 && (
                  <ul className="mt-4 space-y-1.5 border-t border-[var(--border)] pt-4">
                    {features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm text-[var(--foreground)]/80"
                      >
                        <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--foreground)]" />
                        <span style={{ wordBreak: "keep-all" }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={disabled}
                  className="mt-5 block w-full rounded-xl bg-[var(--foreground)] py-4 text-center text-base font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {disabled ? disabledLabel : checkoutLabel}
                </button>
                <p className="mt-2 text-center text-[11px] text-[var(--foreground)]/50">
                  결제는 NicePay를 통해 안전하게 처리됩니다.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="border-t-2 border-[var(--foreground)] bg-white px-4 py-4">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <div className="flex flex-1 items-baseline gap-2">
              <span className="text-xs font-medium text-[var(--foreground)]/40 line-through">
                {originalPrice.toLocaleString()}원
              </span>
              <span className="text-lg font-bold text-[var(--foreground)]">
                {price.toLocaleString()}원
              </span>
              <span className="inline-flex items-center rounded-full border-2 border-[var(--foreground)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--foreground)]">
                {discountPercent}%
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen((v) => !v)}
              disabled={disabled}
              aria-expanded={isOpen}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--foreground)] px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>{disabled ? disabledLabel : toggleLabel}</span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-xs"
                aria-hidden
              >
                ▲
              </motion.span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
