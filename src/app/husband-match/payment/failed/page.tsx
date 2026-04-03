import Link from 'next/link';
import { GoBackButton } from './GoBackButton';

export default async function PaymentFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; message?: string }>;
}) {
  const params = await searchParams;
  const message = params.message || '결제 처리 중 오류가 발생했습니다';
  const orderId = params.orderId;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--surface)] to-white px-4">
      <div className="max-w-md w-full text-center">
        {/* 실패 아이콘 */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
          결제에 실패했습니다
        </h1>

        <div className="bg-white rounded-xl border border-[var(--border)] p-6 mb-6">
          <p className="text-[var(--foreground)]/70 mb-2">{message}</p>
          {orderId && (
            <p className="text-sm text-[var(--foreground)]/50">
              주문번호: <span className="font-mono">{orderId}</span>
            </p>
          )}
        </div>

        <div className="space-y-3">
          <GoBackButton />
          <Link
            href="/"
            className="block w-full py-3 bg-white text-[var(--foreground)] font-medium rounded-lg border-2 border-[var(--border)] hover:border-[var(--accent)] transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>

        <p className="mt-6 text-xs text-[var(--foreground)]/60">
          문제가 계속되면 카카오톡 <span className="font-medium">gibun_studio</span>로 문의해주세요
        </p>
      </div>
    </div>
  );
}
