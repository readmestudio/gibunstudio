import Link from "next/link";
import { COUNSELING_TYPES } from "@/lib/counseling/types";

export default function ProgramCounselingPage() {
  return (
    <div>
      {/* 히어로 배경 */}
      <section
        className="relative bg-center bg-no-repeat bg-cover py-16"
        style={{ backgroundImage: "url('/patterns/patternTop.svg')" }}
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            1:1 심리 상담
          </h1>
          <p className="mt-4 text-lg text-[var(--foreground)]/80">
            1급 심리 상담사와의 Zoom 상담. 예약하기를 누르면 캘린더에서
            가능한 시간을 확인하고, 최대 3개의 희망 시간을 선택할 수 있습니다.
          </p>
        </div>
      </section>

      {/* 상담 카드 섹션 */}
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16">
        <h2 className="text-xl font-bold text-[var(--foreground)]">
          상담 종류
        </h2>
        <div className="mt-6 space-y-8">
          {COUNSELING_TYPES.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-[var(--border)] bg-white p-6"
            >
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                {item.title}
              </h3>
              <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">
                {item.priceLabel}
                <span className="text-sm font-normal text-[var(--foreground)]/60">
                  원 / {item.duration}
                </span>
              </p>
              <p className="mt-3 text-[var(--foreground)]/80">
                {item.description}
              </p>
              {item.requirement && (
                <p className="mt-2 text-sm text-[var(--foreground)]/60">
                  * {item.requirement}
                </p>
              )}
              <p className="mt-2 text-sm text-[var(--foreground)]/70">
                추천: {item.recommended}
              </p>
              <Link
                href={`/booking/${item.id}`}
                className="mt-4 inline-flex items-center px-6 py-2.5 text-sm font-medium text-white bg-[var(--foreground)] border-2 border-[var(--foreground)] rounded-lg hover:bg-[var(--gray-500)] transition-colors"
              >
                예약하기
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
