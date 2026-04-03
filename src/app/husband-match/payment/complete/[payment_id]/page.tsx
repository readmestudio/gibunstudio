import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';

export default async function PaymentCompletePage({
  params,
}: {
  params: Promise<{ payment_id: string }>;
}) {
  const { payment_id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/husband-match/birth-info');
  }

  const { data: payment, error } = await supabase
    .from('husband_match_payments')
    .select('id, phase1_id, amount, order_id, status, paid_at')
    .eq('id', payment_id)
    .single();

  if (error || !payment) {
    notFound();
  }

  if (payment.status !== 'confirmed') {
    notFound();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--surface)] to-white px-4">
      <div className="max-w-md w-full text-center">
        {/* 성공 아이콘 */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
          결제가 완료되었습니다!
        </h1>

        <div className="bg-white rounded-xl border border-[var(--border)] p-6 mb-6">
          <p className="text-[var(--foreground)]/70 mb-4">
            심층 분석을 위한 서베이를 진행해주세요.
          </p>
          <div className="text-sm text-[var(--foreground)]/60 space-y-2">
            <p>주문번호: <span className="font-mono font-medium">{payment.order_id}</span></p>
            <p>결제 금액: <span className="font-medium text-[var(--accent)]">₩{payment.amount.toLocaleString()}</span></p>
          </div>
        </div>

        <div className="space-y-3">
          <Link
            href={`/husband-match/survey/${payment.phase1_id}`}
            className="block w-full py-4 bg-[var(--accent)] text-white font-semibold rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
          >
            서베이 시작하기
          </Link>
          <Link
            href="/"
            className="block w-full py-3 bg-white text-[var(--foreground)] font-medium rounded-lg border-2 border-[var(--border)] hover:border-[var(--accent)] transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
