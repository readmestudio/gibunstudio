import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "테스트 후기 | 기분 스튜디오",
  robots: { index: false },
};

// 진입할 때마다 최신 후기를 보여준다.
export const dynamic = "force-dynamic";

// 후기를 받는 테스트 종류 정의 — 탭/라벨에 공통 사용.
const TEST_TABS = [
  { key: "all", label: "전체" },
  { key: "achievement", label: "성취중독" },
  { key: "minds", label: "minds 헬스체크" },
] as const;

type TabKey = (typeof TEST_TABS)[number]["key"];

const TYPE_LABEL: Record<string, string> = {
  achievement: "성취중독",
  minds: "minds",
};

interface ReviewRow {
  id: string;
  test_type: string;
  rating: number;
  content: string;
  contact: string | null;
  lead_id: string | null;
  created_at: string;
}

function fmtDate(iso: string): string {
  // 'YYYY.MM.DD HH:mm' (KST). 서버 타임존 의존을 줄이려 Intl 로 한국 시각 고정.
  try {
    return new Intl.DateTimeFormat("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function AdminReviewsPage({
  searchParams,
}: {
  // Next.js 16: searchParams 는 Promise → await 해서 푼다.
  searchParams: Promise<{ type?: string }>;
}) {
  await requireAdmin("/admin/reviews");

  const sp = await searchParams;
  const activeTab: TabKey = TEST_TABS.some((t) => t.key === sp.type)
    ? (sp.type as TabKey)
    : "all";

  const admin = createAdminClient();

  // 탭 카운트(전체/성취중독/minds)를 한 번에 — 헤더 요약용.
  const [
    { count: totalCount },
    { count: achievementCount },
    { count: mindsCount },
  ] = await Promise.all([
    admin.from("test_reviews").select("*", { count: "exact", head: true }),
    admin
      .from("test_reviews")
      .select("*", { count: "exact", head: true })
      .eq("test_type", "achievement"),
    admin
      .from("test_reviews")
      .select("*", { count: "exact", head: true })
      .eq("test_type", "minds"),
  ]);

  // 선택된 탭의 후기 목록(최신순, 최대 500건).
  let query = admin
    .from("test_reviews")
    .select("id, test_type, rating, content, contact, lead_id, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (activeTab !== "all") query = query.eq("test_type", activeTab);

  const { data, error } = await query;
  const rows: ReviewRow[] = (data as ReviewRow[]) ?? [];

  // 표시 중인 목록의 평균 별점.
  const avgRating =
    rows.length > 0
      ? (rows.reduce((s, r) => s + r.rating, 0) / rows.length).toFixed(1)
      : "–";

  const countByTab: Record<TabKey, number> = {
    all: totalCount ?? 0,
    achievement: achievementCount ?? 0,
    minds: mindsCount ?? 0,
  };

  return (
    <main className="bg-[var(--surface)] min-h-screen">
      <div className="container max-w-5xl mx-auto px-5 py-16">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-xs font-semibold text-[var(--foreground)]/50 hover:text-[var(--foreground)]"
          >
            ← 대시보드
          </Link>
          <h1 className="mt-3 text-3xl font-bold text-[var(--foreground)]">
            테스트 후기
          </h1>
          <p className="mt-2 text-sm text-[var(--foreground)]/60">
            테스트를 끝내고 페이월에서 이탈하려던 방문자가 남긴 후기예요. 매달
            추첨 대상은 연락처가 있는 후기입니다.
          </p>
        </div>

        {/* 탭 */}
        <div className="mb-6 flex flex-wrap gap-2">
          {TEST_TABS.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <Link
                key={tab.key}
                href={
                  tab.key === "all"
                    ? "/admin/reviews"
                    : `/admin/reviews?type=${tab.key}`
                }
                className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-colors ${
                  active
                    ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                    : "border-[var(--foreground)]/15 text-[var(--foreground)]/70 hover:border-[var(--foreground)]"
                }`}
              >
                {tab.label}
                <span className={active ? "ml-1.5 opacity-70" : "ml-1.5 opacity-50"}>
                  {countByTab[tab.key]}
                </span>
              </Link>
            );
          })}
        </div>

        {/* 요약 */}
        <div className="mb-6 flex gap-8 rounded-2xl border-2 border-[var(--foreground)]/10 bg-white px-6 py-4">
          <div>
            <p className="text-[11px] text-[var(--foreground)]/50">표시된 후기</p>
            <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">
              {rows.length}
              <span className="ml-1 text-sm font-medium text-[var(--foreground)]/50">
                건
              </span>
            </p>
          </div>
          <div>
            <p className="text-[11px] text-[var(--foreground)]/50">평균 별점</p>
            <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">
              {avgRating}
              <span className="ml-1 text-sm font-medium text-[var(--foreground)]/50">
                / 5
              </span>
            </p>
          </div>
        </div>

        {/* 목록 */}
        {error ? (
          <p className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            후기를 불러오지 못했어요. (test_reviews 테이블 마이그레이션이 적용됐는지 확인해 주세요)
          </p>
        ) : rows.length === 0 ? (
          <p className="rounded-xl border-2 border-[var(--foreground)]/10 bg-white px-4 py-10 text-center text-sm text-[var(--foreground)]/50">
            아직 후기가 없어요.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border-2 border-[var(--foreground)]/10 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--foreground)]/10 text-left text-[11px] uppercase tracking-wider text-[var(--foreground)]/40">
                  <th className="px-4 py-3 font-semibold">작성일</th>
                  {activeTab === "all" && (
                    <th className="px-4 py-3 font-semibold">테스트</th>
                  )}
                  <th className="px-4 py-3 font-semibold">별점</th>
                  <th className="px-4 py-3 font-semibold">후기</th>
                  <th className="px-4 py-3 font-semibold">추첨 연락처</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[var(--foreground)]/5 align-top last:border-0"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-[var(--foreground)]/60 tabular-nums">
                      {fmtDate(r.created_at)}
                    </td>
                    {activeTab === "all" && (
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="rounded-full border border-[var(--foreground)]/20 px-2 py-0.5 text-xs font-semibold text-[var(--foreground)]/70">
                          {TYPE_LABEL[r.test_type] ?? r.test_type}
                        </span>
                      </td>
                    )}
                    <td className="whitespace-nowrap px-4 py-3 font-semibold text-[var(--foreground)] tabular-nums">
                      {"★".repeat(r.rating)}
                      <span className="text-[var(--foreground)]/20">
                        {"★".repeat(5 - r.rating)}
                      </span>
                    </td>
                    <td className="max-w-md px-4 py-3 text-[var(--foreground)] whitespace-pre-wrap break-words">
                      {r.content?.trim() || (
                        <span className="text-[var(--foreground)]/30">
                          (별점만)
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-[var(--foreground)]/70">
                      {r.contact || (
                        <span className="text-[var(--foreground)]/30">없음</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
