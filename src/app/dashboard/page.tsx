import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">대시보드</h1>
      <p className="mt-2 text-[var(--foreground)]/70">
        환영합니다, {user.email}
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <Link
          href="/dashboard/7day"
          className="block rounded-xl border border-[var(--border)] bg-white p-6 transition-colors hover:bg-[var(--surface)] hover:border-[var(--accent)]"
        >
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            7일 내면 아이 찾기
          </h2>
          <p className="mt-2 text-sm text-[var(--foreground)]/70">
            일자별 미션, 감정일기, 리포트
          </p>
        </Link>
        <Link
          href="/dashboard/counseling"
          className="block rounded-xl border border-[var(--border)] bg-white p-6 transition-colors hover:bg-[var(--surface)] hover:border-[var(--accent)]"
        >
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            1:1 상담
          </h2>
          <p className="mt-2 text-sm text-[var(--foreground)]/70">
            예약 현황, 상담 일정
          </p>
        </Link>
      </div>
    </div>
  );
}
