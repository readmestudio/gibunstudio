import Link from "next/link";

export default function CheckoutCompletePage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* 체크 아이콘 */}
        <div className="mx-auto w-16 h-16 rounded-full bg-[var(--foreground)] flex items-center justify-center mb-6">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          결제 신청이 완료되었습니다
        </h1>
        <p className="mt-4 text-[var(--foreground)]/70 leading-relaxed">
          입금이 확인되면 상담사가 희망 시간 중 하나를 확정합니다.
          <br />
          확정되면 대시보드에서 Zoom 링크를 확인할 수 있습니다.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/dashboard/counseling"
            className="inline-flex items-center justify-center px-6 py-3 font-semibold text-white bg-[var(--foreground)] rounded-lg hover:bg-[var(--foreground)]/80 transition-colors"
          >
            대시보드에서 확인하기
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 font-medium text-[var(--foreground)]/80 border border-[var(--border)] rounded-lg hover:bg-[var(--surface)] transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
