import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { getAllEssays, formatEssayDate } from "@/lib/essays/data";
import { createAdminClient } from "@/lib/supabase/admin";
import { DeleteEssayButton } from "./DeleteEssayButton";

export const metadata: Metadata = {
  title: "에세이 관리 | 기분 스튜디오",
  robots: { index: false },
};

// admin 페이지는 매 요청마다 최신 상태로
export const dynamic = "force-dynamic";

function formatShortDate(iso: string): string {
  // YYYY-MM-DD → MM.DD
  return iso.slice(5).replaceAll("-", ".");
}

export default async function AdminEssaysPage() {
  await requireAdmin();
  const essays = await getAllEssays({ includeScheduled: true });

  // 발송 완료된 slug 집합 조회 (N+1 회피용 일괄 SELECT)
  const sentSlugs = new Set<string>();
  if (essays.length > 0) {
    const admin = createAdminClient();
    const { data: sends } = await admin
      .from("newsletter_sends")
      .select("essay_slug")
      .in(
        "essay_slug",
        essays.map((e) => e.slug)
      );
    for (const row of sends ?? []) {
      if (row.essay_slug) sentSlugs.add(row.essay_slug);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="bg-[var(--surface)] min-h-screen">
      <div className="container max-w-5xl mx-auto px-5 py-16">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/50 mb-2">
              CMS
            </p>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">
              에세이 관리
            </h1>
            <p className="mt-2 text-sm text-[var(--foreground)]/60">
              마음 구독 에세이를 이곳에서 직접 쓰고 수정하실 수 있어요.
            </p>
          </div>
          <Link
            href="/admin/essays/new"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[var(--foreground)] text-white text-sm font-semibold transition-opacity hover:opacity-90"
          >
            + 새 에세이 작성
          </Link>
        </div>

        {essays.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-[var(--foreground)]/20 bg-white p-16 text-center">
            <p className="text-sm text-[var(--foreground)]/60">
              아직 작성된 에세이가 없어요. 위 "새 에세이 작성" 버튼을 눌러주세요.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-[var(--foreground)]/10 bg-white overflow-hidden">
            <table className="w-full">
              <thead className="bg-[var(--surface)] border-b border-[var(--foreground)]/10">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/50">
                    제목
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/50 hidden md:table-cell">
                    slug
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/50">
                    발행일
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/50">
                    상태
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/50">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody>
                {essays.map((essay) => (
                  <tr
                    key={essay.slug}
                    className="border-t border-[var(--foreground)]/10 hover:bg-[var(--surface)]/40 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        {essay.title}
                      </p>
                      <p className="text-xs text-[var(--foreground)]/50 mt-0.5 line-clamp-1">
                        {essay.preview}
                      </p>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <code className="text-xs text-[var(--foreground)]/60 font-mono">
                        {essay.slug}
                      </code>
                    </td>
                    <td className="px-5 py-4 text-sm text-[var(--foreground)]/70 whitespace-nowrap">
                      {formatEssayDate(essay.publishedAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {essay.body ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                            작성 완료
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                            초안
                          </span>
                        )}
                        {essay.publishedAt > today && (
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 text-xs font-medium whitespace-nowrap">
                            예약 공개 · {formatShortDate(essay.publishedAt)}
                          </span>
                        )}
                        {sentSlugs.has(essay.slug) ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 text-xs font-medium whitespace-nowrap">
                            발송 완료
                          </span>
                        ) : essay.newsletterSendAt ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-medium whitespace-nowrap">
                            발송 예정 · {formatShortDate(essay.newsletterSendAt)}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-3">
                        <Link
                          href={`/essays/${essay.slug}`}
                          target="_blank"
                          className="text-xs font-medium text-[var(--foreground)]/60 hover:text-[var(--foreground)]"
                        >
                          미리보기 ↗
                        </Link>
                        <Link
                          href={`/admin/essays/${essay.slug}/edit`}
                          className="text-xs font-semibold text-[var(--foreground)] underline underline-offset-2"
                        >
                          수정
                        </Link>
                        <DeleteEssayButton slug={essay.slug} title={essay.title} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Link
            href="/essays"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]/60 hover:text-[var(--foreground)]"
          >
            ← 공개 에세이 목록으로
          </Link>
        </div>
      </div>
    </main>
  );
}
