import Link from "next/link";
import { COUNSELING_TYPES } from "@/lib/counseling/types";

/**
 * 프라이싱 섹션 (Monotone 스타일)
 * 4가지 상담 유형 가격표 + 예약하기 CTA
 */

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5 mr-3 flex-shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5 mr-3 flex-shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

// 가장 인기 있는 상담 (강조 표시)
const POPULAR_ID = "test-package";

export function PricingTable() {
  return (
    <section id="pricing">
      <div className="container px-5 pt-24 pb-32 mx-auto lg:px-24">
        <div className="flex flex-col w-full mb-12 text-left lg:text-center">
          <h2 className="mb-6 text-4xl font-bold text-[var(--foreground)] md:text-8xl lg:text-6xl">
            1:1 심리 상담
          </h2>
          <p className="mx-auto text-base leading-snug text-[var(--foreground)]/70 lg:w-1/2">
            1급 심리 상담사와 Zoom으로 진행하는 전문 상담
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {COUNSELING_TYPES.map((plan) => {
            const isPopular = plan.id === POPULAR_ID;
            return (
              <div
                key={plan.id}
                className={`relative flex flex-col h-full p-6 bg-white border rounded-2xl ${
                  isPopular
                    ? "border-[var(--foreground)] border-2 shadow-lg"
                    : "border-[var(--border)] shadow-sm"
                }`}
              >
                {isPopular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--foreground)] text-white text-xs font-semibold px-3 py-1 rounded-full">
                    BEST
                  </span>
                )}

                <strong className="mb-2 text-sm font-semibold tracking-tight text-[var(--foreground)]/60 uppercase">
                  {plan.title}
                </strong>

                <div className="flex items-baseline pb-4 mb-4 border-b border-[var(--border)]">
                  <span className="text-4xl font-bold text-[var(--foreground)]">
                    {plan.priceLabel}
                  </span>
                  <span className="ml-1 text-sm text-[var(--foreground)]/60">
                    원 / {plan.duration}
                  </span>
                </div>

                <p className="mb-4 text-sm text-[var(--foreground)]/70 leading-relaxed">
                  {plan.description}
                </p>

                {plan.requirement && (
                  <p className="mb-4 text-xs text-[var(--foreground)]/50">
                    * {plan.requirement}
                  </p>
                )}

                <ul className="flex-1 space-y-2 mb-6">
                  {plan.features.map((f, i) => (
                    <li
                      key={i}
                      className={`flex items-center text-sm ${
                        f.included
                          ? "text-[var(--foreground)]/70"
                          : "text-[var(--foreground)]/30 line-through"
                      }`}
                    >
                      {f.included ? <CheckIcon /> : <CrossIcon />}
                      {f.text}
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/booking/${plan.id}`}
                  className={`inline-flex items-center justify-center px-6 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isPopular
                      ? "bg-[var(--foreground)] text-white hover:bg-[var(--foreground)]/80"
                      : "border-2 border-[var(--foreground)] text-[var(--foreground)] hover:bg-[var(--surface)]"
                  }`}
                >
                  예약하기
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
