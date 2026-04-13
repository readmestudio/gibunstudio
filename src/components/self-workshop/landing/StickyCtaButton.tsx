"use client";

interface StickyCtaButtonProps {
  label: string;
  price: number;
  onClick: () => void;
  disabled?: boolean;
}

export function StickyCtaButton({
  label,
  price,
  onClick,
  disabled,
}: StickyCtaButtonProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-[var(--foreground)] px-4 py-4">
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className="block w-full rounded-xl bg-[var(--foreground)] py-4 text-center text-base font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {disabled ? "결제 준비 중..." : `${label} · ${price.toLocaleString()}원`}
        </button>
      </div>
    </div>
  );
}
