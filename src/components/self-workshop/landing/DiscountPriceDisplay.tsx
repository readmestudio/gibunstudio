interface DiscountPriceDisplayProps {
  originalPrice: number;
  price: number;
  discountPercent: number;
  size?: "sm" | "md" | "lg";
  align?: "start" | "center";
}

const SIZE = {
  sm: {
    original: "text-xs",
    price: "text-base",
    unit: "text-xs",
    badge: "text-[10px] px-1.5 py-0.5",
    gap: "gap-1.5",
  },
  md: {
    original: "text-sm",
    price: "text-2xl",
    unit: "text-sm",
    badge: "text-xs px-2 py-0.5",
    gap: "gap-2",
  },
  lg: {
    original: "text-base",
    price: "text-3xl",
    unit: "text-base",
    badge: "text-xs px-2.5 py-0.5",
    gap: "gap-2",
  },
} as const;

export function DiscountPriceDisplay({
  originalPrice,
  price,
  discountPercent,
  size = "md",
  align = "start",
}: DiscountPriceDisplayProps) {
  const s = SIZE[size];
  const alignCls =
    align === "center" ? "items-center" : "items-start";

  return (
    <div className={`flex flex-col ${alignCls} ${s.gap}`}>
      <div className="flex items-center gap-2">
        <span
          className={`${s.original} font-medium text-[var(--foreground)]/40 line-through`}
        >
          {originalPrice.toLocaleString()}원
        </span>
        <span
          className={`${s.badge} inline-flex items-center rounded-full border-2 border-[var(--foreground)] font-bold text-[var(--foreground)]`}
        >
          {discountPercent}% OFF
        </span>
      </div>
      <div className="flex items-baseline gap-0.5">
        <span className={`${s.price} font-bold text-[var(--foreground)]`}>
          {price.toLocaleString()}
        </span>
        <span className={`${s.unit} text-[var(--foreground)]/60`}>원</span>
      </div>
    </div>
  );
}
