import { createClient } from "@/lib/supabase/server";
import { isCoachEmail } from "@/lib/auth/coach";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CoachPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login/coach");
  }

  if (!isCoachEmail(user.email)) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">코치 모드</h1>
      <p className="mt-2 text-[var(--foreground)]/70">
        입금 확인, 미션 관리, 리포트 작성, 예약 관리를 수행합니다.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <Link
          href="/coach/7day"
          className="block rounded-xl border border-[var(--border)] bg-white p-6 transition-colors hover:bg-[var(--surface)] hover:border-[var(--accent)]"
        >
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            7일 내면 아이 찾기
          </h2>
          <p className="mt-2 text-sm text-[var(--foreground)]/70">
            입금 확인, 미션 현황, TCI 업로드, 리포트 작성
          </p>
        </Link>
        <Link
          href="/coach/counseling"
          className="block rounded-xl border border-[var(--border)] bg-white p-6 transition-colors hover:bg-[var(--surface)] hover:border-[var(--accent)]"
        >
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            1:1 상담
          </h2>
          <p className="mt-2 text-sm text-[var(--foreground)]/70">
            입금 확인, 예약 요청, 확정, 줌 링크 설정
          </p>
        </Link>
        <Link
          href="/coach/husband-match"
          className="block rounded-xl border border-[var(--border)] bg-white p-6 transition-colors hover:bg-[var(--surface)] hover:border-[var(--accent)]"
        >
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            남편상 Phase 2
          </h2>
          <p className="mt-2 text-sm text-[var(--foreground)]/70">
            최종 리포트 검토 대기 목록, 퍼블리시
          </p>
        </Link>
      </div>
    </div>
  );
}
