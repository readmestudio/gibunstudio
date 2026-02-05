import { createClient } from '@/lib/supabase/server';
import { isCoachEmail } from '@/lib/auth/coach';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CoachHusbandMatchClient } from './CoachHusbandMatchClient';

export default async function CoachHusbandMatchPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login/coach');
  }

  if (!isCoachEmail(user.email)) {
    redirect('/dashboard');
  }

  const { data: rows, error } = await supabase
    .from('phase2_results')
    .select('id, user_id, phase1_id, created_at, published_at, published_by')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-red-600">목록을 불러오지 못했습니다.</p>
      </div>
    );
  }

  const pending = (rows ?? []).filter((r) => !r.published_at);
  const published = (rows ?? []).filter((r) => !!r.published_at);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/coach"
          className="text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:underline"
        >
          ← 코치 모드
        </Link>
      </div>
      <h1 className="text-2xl font-bold text-[var(--foreground)]">남편상 Phase 2</h1>
      <p className="mt-2 text-[var(--foreground)]/70">
        검토 대기 항목을 퍼블리시하면 유저가 마이페이지에서 최종 리포트를 볼 수 있습니다.
      </p>

      <div className="mt-8">
        <CoachHusbandMatchClient pending={pending} published={published} />
      </div>
    </div>
  );
}
