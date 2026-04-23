"use client";

/**
 * 결제 수단 선택 UI
 * NicePay 결제창을 열기 전에 카드 / 카카오페이 / 네이버페이 중 하나를 고르는 공용 컴포넌트.
 */

export type PaymentMethod = "card" | "kakaopay" | "naverpayCard";

interface Props {
  onSelect: (method: PaymentMethod) => void;
  isSubmitting?: boolean;
  submittingMethod?: PaymentMethod | null;
  disabled?: boolean;
  disabledLabel?: string;
  /** 가로 3분할 컴팩트 모드 (하단 고정 바 등에 적합) */
  compact?: boolean;
}

const METHOD_LIST: {
  method: PaymentMethod;
  label: string;
  shortLabel: string;
  sub: string;
  dotColor: string;
}[] = [
  {
    method: "card",
    label: "신용/체크카드",
    shortLabel: "카드 결제",
    sub: "모든 카드사 · 무이자 할부 가능",
    dotColor: "#1f2937",
  },
  {
    method: "kakaopay",
    label: "카카오페이",
    shortLabel: "카카오페이",
    sub: "카카오 계정으로 빠르게",
    dotColor: "#FEE500",
  },
  {
    method: "naverpayCard",
    label: "네이버페이",
    shortLabel: "네이버페이",
    sub: "네이버 계정으로 빠르게",
    dotColor: "#03C75A",
  },
];

export function PaymentMethodSelector({
  onSelect,
  isSubmitting,
  submittingMethod,
  disabled,
  disabledLabel = "결제 모듈 로딩 중...",
  compact = false,
}: Props) {
  const blockAll = !!disabled || !!isSubmitting;

  if (compact) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {METHOD_LIST.map(({ method, shortLabel, dotColor }) => {
          const isThisSubmitting = submittingMethod === method;
          return (
            <button
              key={method}
              type="button"
              onClick={() => onSelect(method)}
              disabled={blockAll}
              aria-busy={isThisSubmitting}
              aria-label={shortLabel}
              className="flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-[var(--foreground)] bg-white py-3 transition-colors hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span
                className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{
                  backgroundColor: dotColor,
                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
                }}
                aria-hidden
              />
              <span className="text-[12px] font-semibold text-[var(--foreground)] sm:text-sm">
                {isThisSubmitting ? "..." : shortLabel}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {METHOD_LIST.map(({ method, label, sub, dotColor }) => {
        const isThisSubmitting = submittingMethod === method;
        return (
          <button
            key={method}
            type="button"
            onClick={() => onSelect(method)}
            disabled={blockAll}
            aria-busy={isThisSubmitting}
            className="group flex w-full items-center justify-between rounded-xl border-2 border-[var(--foreground)] bg-white px-5 py-4 text-left transition-colors hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <span
                className="inline-block h-3.5 w-3.5 flex-shrink-0 rounded-full"
                style={{
                  backgroundColor: dotColor,
                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)",
                }}
                aria-hidden
              />
              <div>
                <p className="text-sm font-semibold text-[var(--foreground)] sm:text-base">
                  {label}
                </p>
                <p className="text-[11px] text-[var(--foreground)]/50 sm:text-xs">
                  {sub}
                </p>
              </div>
            </div>
            <span className="text-sm text-[var(--foreground)]/40 group-hover:text-[var(--foreground)]">
              {isThisSubmitting ? "결제 진행 중..." : "→"}
            </span>
          </button>
        );
      })}

      {disabled && !isSubmitting && (
        <p className="text-center text-[11px] text-[var(--foreground)]/50">
          {disabledLabel}
        </p>
      )}
    </div>
  );
}
