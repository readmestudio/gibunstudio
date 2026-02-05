import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: publishedPhase2 } = await supabase
    .from("phase2_results")
    .select("id, created_at, published_at")
    .eq("user_id", user.id)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });

  const phase2List = publishedPhase2 ?? [];

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

        {/* 남편상 분석: 퍼블리시된 Phase 2 최종 리포트 */}
        <div className="sm:col-span-2 rounded-xl border border-[var(--border)] bg-white p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            남편상 분석
          </h2>
          {phase2List.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {phase2List.map((row) => (
                <li key={row.id}>
                  <Link
                    href={`/husband-match/deep-report/${row.id}`}
                    className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)] hover:border-[var(--accent)]"
                  >
                    최종 리포트 보기
                    {row.published_at && (
                      <span className="text-xs text-[var(--foreground)]/50">
                        ({new Date(row.published_at).toLocaleDateString("ko-KR")} 공개)
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-[var(--foreground)]/70">
              아직 공개된 최종 리포트가 없습니다. Phase 2 결제 후 서베이를 완료하면 관리자 검토 후 여기에서 보실 수 있습니다.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
