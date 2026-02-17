import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

export default async function PaymentWaitingPage({
  params,
}: {
  params: Promise<{ payment_id: string }>;
}) {
  const { payment_id } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/husband-match/birth-info');
  }

  // Fetch payment record
  const { data: payment, error } = await supabase
    .from('husband_match_payments')
    .select('*, phase1_results(id)')
    .eq('id', payment_id)
    .single();

  if (error || !payment) {
    notFound();
  }

  if (payment.user_id !== user.id) {
    notFound();
  }

  // If payment confirmed, redirect to survey
  if (payment.status === 'confirmed') {
    redirect(`/husband-match/survey/${payment.phase1_id}`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--surface)] to-white px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
          입금 확인 대기 중
        </h1>

        {/* Message */}
        <div className="bg-white rounded-xl border border-[var(--border)] p-6 mb-6">
          <p className="text-[var(--foreground)]/70 mb-4">
            입금 신청이 완료되었습니다.
          </p>
          <div className="text-sm text-[var(--foreground)]/60 space-y-2">
            <p>주문번호: <span className="font-mono font-medium">{payment.order_id}</span></p>
            <p>입금자명: <span className="font-medium">{payment.payment_key}</span></p>
            <p>금액: <span className="font-medium text-[var(--accent)]">₩{payment.amount.toLocaleString()}</span></p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-left">
              <p className="text-sm font-medium text-blue-900 mb-1">
                다음 단계
              </p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• 관리자가 입금을 확인합니다 (영업일 기준 1일 이내)</li>
                <li>• 확인 완료 시 이메일로 안내드립니다</li>
                <li>• 이메일 확인 후 로그인하여 서베이를 진행하세요</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full py-3 bg-[var(--accent)] text-white font-semibold rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
          >
            홈으로 돌아가기
          </Link>
          <Link
            href={`/husband-match/report/${payment.phase1_id}`}
            className="block w-full py-3 bg-white text-[var(--foreground)] font-medium rounded-lg border-2 border-[var(--border)] hover:border-[var(--accent)] transition-colors"
          >
            Phase 1 리포트 다시 보기
          </Link>
        </div>

        {/* Help Text */}
        <p className="mt-6 text-xs text-[var(--foreground)]/60">
          입금 관련 문의사항이 있으시면 고객센터로 연락주세요
        </p>
      </div>
    </div>
  );
}
