import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { Phase2ReportClient } from './Phase2ReportClient';

export default async function Phase2ReportPage({
  params,
}: {
  params: { phase2_id: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/husband-match/onboarding');
  }

  const { data: result, error } = await supabase
    .from('phase2_results')
    .select('*, phase1_results(*)')
    .eq('id', params.phase2_id)
    .single();

  if (error || !result) {
    notFound();
  }

  if (result.user_id !== user.id) {
    notFound();
  }

  // 퍼블리시된 경우에만 리포트 노출
  if (!result.published_at) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[var(--surface)] to-white px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">
            리포트 검토 중입니다
          </h1>
          <p className="text-[var(--foreground)]/70 mb-6">
            관리자 검토 후 마이페이지에서 보실 수 있습니다.
          </p>
          <Link
            href="/dashboard"
            className="inline-block rounded-lg bg-[var(--accent)] px-4 py-2.5 font-medium text-[var(--foreground)] hover:bg-[var(--accent-hover)]"
          >
            마이페이지로 가기
          </Link>
        </div>
      </div>
    );
  }

  return <Phase2ReportClient result={result} />;
}
