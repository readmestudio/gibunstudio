import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getSessionById } from "@/lib/intake/store";
import IntakeReport from "./IntakeReport";

export const metadata: Metadata = {
  title: "상담 진단 리포트 | 기분 스튜디오",
  robots: { index: false },
};

// 항상 최신 세션 데이터로 리포트를 렌더한다.
export const dynamic = "force-dynamic";

export default async function AdminIntakeReportPage({
  params,
}: {
  // Next.js 16: 동적 라우트 params 는 Promise → await 해서 푼다.
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin(`/admin/intake/${id}`);

  const session = await getSessionById(id);
  if (!session) notFound();

  return (
    <main className="bg-[var(--surface)] min-h-screen print:bg-white">
      <div className="container max-w-4xl mx-auto px-5 py-12 print:max-w-none print:px-0 print:py-0">
        {/* 관리자 내비게이션 — 인쇄 시 숨김 */}
        <div className="mb-6 flex items-center justify-between print:hidden">
          <Link
            href="/admin/intake"
            className="text-xs font-semibold text-[var(--foreground)]/50 hover:text-[var(--foreground)]"
          >
            ← 세션 목록
          </Link>
          <div className="flex gap-2">
            <a
              href={`/api/intake/export/${session.id}?format=json`}
              className="rounded-xl border-2 border-[var(--foreground)]/15 px-4 py-2 text-xs font-semibold text-[var(--foreground)]/70 hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
            >
              JSON 다운로드
            </a>
            <a
              href={`/api/intake/export/${session.id}?format=csv`}
              className="rounded-xl border-2 border-[var(--foreground)]/15 px-4 py-2 text-xs font-semibold text-[var(--foreground)]/70 hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
            >
              CSV 다운로드
            </a>
          </div>
        </div>

        <IntakeReport session={session} />
      </div>
    </main>
  );
}
