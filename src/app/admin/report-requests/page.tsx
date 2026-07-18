import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { readReportEmailStatus } from "@/lib/minds/report-email-status";

export const metadata: Metadata = {
  title: "리포트 신청자 | 기분 스튜디오",
  robots: { index: false },
};

// 진입할 때마다 최신 상태를 보여준다.
export const dynamic = "force-dynamic";

/**
 * /admin/report-requests — 영어 퍼널(saju/en · inner-child/en) "리포트 신청자" 현황.
 *
 * 이 두 퍼널만 "이메일=리포트 요청" 모델이라 여기 모은다(한국어 inner_child·minds 는
 * 판매/구매/연락처 캡처라 제외 — 섞으면 요청 안 한 사람이 신청자로 잡힌다).
 *
 * 각 신청자마다 ① 리포트 생성됨? ② 실제 발송됨?(parts_map.email_sent 도장) 을 보여준다.
 * 발송 도장은 2026-07-18 이후 발송분부터 남는다 — 그 전 건은 "기록 없음"으로 표시한다.
 */

// ── 퍼널 레지스트리 ────────────────────────────────────────────────
interface FunnelMeta {
  key: string; // 필터 키(searchParams ?f=)
  label: string; // 뱃지·탭 라벨
  reportPath: (id: string) => string; // 공개 리포트 경로
  reportKey: string; // parts_map 에서 "리포트 생성됨"을 뜻하는 키
}
const FUNNELS: Record<string, FunnelMeta> = {
  saju: {
    key: "saju",
    label: "K-Saju EN",
    reportPath: (id) => `/saju/en/r/${id}`,
    reportKey: "report",
  },
  innerchild: {
    key: "innerchild",
    label: "Inner Child EN",
    reportPath: (id) => `/inner-child/en/full/${id}`,
    reportKey: "manual_report",
  },
};

interface RequestRow {
  id: string;
  email: string | null;
  created_at: string;
  parts_map: Record<string, unknown> | null;
  funnel: FunnelMeta;
}

function reportGenerated(row: RequestRow): boolean {
  const pm = row.parts_map;
  if (!pm || typeof pm !== "object") return false;
  return Boolean(pm[row.funnel.reportKey]);
}

function fmtDate(iso: string): string {
  if (!iso) return "–";
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

export default async function AdminReportRequestsPage({
  searchParams,
}: {
  // Next.js 16: searchParams 는 Promise → await 해서 푼다.
  searchParams: Promise<{ f?: string }>;
}) {
  await requireAdmin("/admin/report-requests");

  const sp = await searchParams;
  const filter = (sp.f ?? "").trim(); // "" = 전체

  const admin = createAdminClient();

  // 두 퍼널을 각각 조회(inner-child/en 은 test_type 이 한국어와 같아 landing_path 로만 구분).
  // 이메일이 있는 = 실제로 리포트를 신청한 리드만.
  const [sajuRes, icRes] = await Promise.all([
    admin
      .from("minds_leads")
      .select("id, email, created_at, parts_map")
      .eq("test_type", "saju")
      .not("email", "is", null)
      .order("created_at", { ascending: false })
      .limit(500),
    admin
      .from("minds_leads")
      .select("id, email, created_at, parts_map")
      .eq("landing_path", "/inner-child/en")
      .not("email", "is", null)
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  const loadError = sajuRes.error || icRes.error;

  const toRows = (
    data: unknown,
    funnel: FunnelMeta
  ): RequestRow[] =>
    ((data as RequestRow[]) ?? []).map((r) => ({
      id: r.id,
      email: r.email,
      created_at: r.created_at,
      parts_map:
        r.parts_map && typeof r.parts_map === "object" ? r.parts_map : null,
      funnel,
    }));

  const allRows: RequestRow[] = [
    ...toRows(sajuRes.data, FUNNELS.saju),
    ...toRows(icRes.data, FUNNELS.innerchild),
  ].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  // 필터 탭 카운트(전체 기준).
  const countByFunnel = new Map<string, number>();
  for (const r of allRows) {
    countByFunnel.set(r.funnel.key, (countByFunnel.get(r.funnel.key) ?? 0) + 1);
  }

  const rows = filter
    ? allRows.filter((r) => r.funnel.key === filter)
    : allRows;

  // 요약 — 현재 필터 기준.
  const generatedCount = rows.filter(reportGenerated).length;
  let sentOkCount = 0;
  let sentFailCount = 0;
  for (const r of rows) {
    const es = readReportEmailStatus(r.parts_map);
    if (es?.ok) sentOkCount++;
    else if (es && !es.ok) sentFailCount++;
  }

  const tabs = [
    { key: "", label: "전체", count: allRows.length },
    ...Object.values(FUNNELS).map((f) => ({
      key: f.key,
      label: f.label,
      count: countByFunnel.get(f.key) ?? 0,
    })),
  ];
  const tabHref = (key: string) =>
    key ? `/admin/report-requests?f=${key}` : "/admin/report-requests";

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
            리포트 신청자
          </h1>
          <p className="mt-2 text-sm text-[var(--foreground)]/60">
            영어 퍼널(K-Saju · Inner Child)에서 이메일로 리포트를 신청한 사람과, 각
            신청 건의 <b>리포트 생성</b>·<b>메일 발송</b> 여부를 한눈에 봐요. 발송
            기록은 2026-07-18 이후 발송분부터 남아, 그 전 건은 &lsquo;기록 없음&rsquo;으로 보여요.
          </p>
        </div>

        {loadError ? (
          <p className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            신청자를 불러오지 못했어요. (minds_leads 접근 권한을 확인해 주세요)
          </p>
        ) : (
          <>
            {/* 퍼널 필터 탭 */}
            <div className="mb-6 flex flex-wrap gap-2">
              {tabs.map((t) => {
                const active = t.key === filter;
                return (
                  <Link
                    key={t.key || "all"}
                    href={tabHref(t.key)}
                    className={`rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-colors ${
                      active
                        ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                        : "border-[var(--foreground)]/15 text-[var(--foreground)]/60 hover:border-[var(--foreground)]"
                    }`}
                  >
                    {t.label}
                    <span
                      className={`ml-2 tabular-nums ${
                        active ? "text-white/70" : "text-[var(--foreground)]/40"
                      }`}
                    >
                      {t.count}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* 요약 */}
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "신청", value: rows.length, unit: "명" },
                { label: "리포트 생성", value: generatedCount, unit: "건" },
                { label: "발송 완료", value: sentOkCount, unit: "건" },
                { label: "발송 실패", value: sentFailCount, unit: "건" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border-2 border-[var(--foreground)]/10 bg-white px-5 py-4"
                >
                  <p className="text-[11px] text-[var(--foreground)]/50">
                    {s.label}
                  </p>
                  <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">
                    {s.value}
                    <span className="ml-1 text-sm font-medium text-[var(--foreground)]/50">
                      {s.unit}
                    </span>
                  </p>
                </div>
              ))}
            </div>

            {/* 신청자 목록 */}
            {rows.length === 0 ? (
              <p className="rounded-xl border-2 border-[var(--foreground)]/10 bg-white px-4 py-10 text-center text-sm text-[var(--foreground)]/50">
                아직 신청자가 없어요.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border-2 border-[var(--foreground)]/10 bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--foreground)]/10 text-left text-[11px] uppercase tracking-wider text-[var(--foreground)]/40">
                      <th className="px-4 py-3 font-semibold">신청일</th>
                      <th className="px-4 py-3 font-semibold">퍼널</th>
                      <th className="px-4 py-3 font-semibold">이메일</th>
                      <th className="px-4 py-3 font-semibold">리포트 생성</th>
                      <th className="px-4 py-3 font-semibold">발송</th>
                      <th className="px-4 py-3 font-semibold">보기</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const generated = reportGenerated(row);
                      const es = readReportEmailStatus(row.parts_map);
                      return (
                        <tr
                          key={`${row.funnel.key}-${row.id}`}
                          className="border-b border-[var(--foreground)]/5 align-top last:border-0"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-[var(--foreground)]/60 tabular-nums">
                            {fmtDate(row.created_at)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className="rounded-full border-2 border-[var(--foreground)]/15 px-2.5 py-0.5 text-[12px] font-semibold text-[var(--foreground)]/70">
                              {row.funnel.label}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[var(--foreground)]/80">
                            {row.email || (
                              <span className="text-[var(--foreground)]/25">–</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {generated ? (
                              <span className="font-semibold text-emerald-600">
                                생성됨
                              </span>
                            ) : (
                              <span className="text-[var(--foreground)]/30">
                                미생성
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {es?.ok ? (
                              <span className="font-semibold text-emerald-600">
                                ✅ 완료
                                <span className="ml-1 text-[11px] font-normal text-[var(--foreground)]/40 tabular-nums">
                                  {fmtDate(es.at)}
                                </span>
                              </span>
                            ) : es && !es.ok ? (
                              <span
                                className="font-semibold text-red-600"
                                title={es.reason ?? ""}
                              >
                                ❌ 실패
                                {es.reason && (
                                  <span className="ml-1 text-[11px] font-normal text-red-400">
                                    {es.reason.slice(0, 24)}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-[var(--foreground)]/30">
                                기록 없음
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {generated ? (
                              <Link
                                href={row.funnel.reportPath(row.id)}
                                target="_blank"
                                className="text-[var(--foreground)]/60 underline underline-offset-2 hover:text-[var(--foreground)]"
                              >
                                리포트 ↗
                              </Link>
                            ) : (
                              <span className="text-[var(--foreground)]/25">–</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
