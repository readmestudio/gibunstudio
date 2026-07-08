import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { readFreeReportBlob } from "@/lib/minds/inner-child/free-report-store";
import type { AreaId } from "@/lib/minds/inner-child/types";

export const metadata: Metadata = {
  title: "내면 아이 리드 | 기분 스튜디오",
  robots: { index: false },
};

// 진입할 때마다 최신 리드를 보여준다.
export const dynamic = "force-dynamic";

// 영역 식별자 → 한국어 라벨(요약 표시용).
const AREA_LABEL: Record<AreaId, string> = {
  disconnection: "단절·거절",
  impaired_autonomy: "손상된 자율성",
  other_directedness: "타인 중심성",
  overvigilance: "과잉경계·억제",
};

// answers 컬럼 원소 형태(평탄화 저장본).
interface AnswerItem {
  id: string;
  question: string;
  answer: string;
}

interface LeadRow {
  id: string;
  created_at: string;
  user_id: string | null;
  answers: AnswerItem[] | null;
  parts_map: unknown;
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

export default async function AdminInnerChildPage() {
  await requireAdmin("/admin/inner-child");

  const admin = createAdminClient();

  // channel='inner_child' 리드 전체를 최신순으로(최대 500건) 한 번에 가져와
  // 완주/미완주·유형 분포를 메모리에서 계산한다. answers/parts_map 이 커봐야
  // 리드 규모가 작아 부담 없다.
  const { data, error } = await admin
    .from("minds_leads")
    .select("id, created_at, user_id, answers, parts_map")
    .eq("channel", "inner_child")
    .order("created_at", { ascending: false })
    .limit(500);

  const rows: LeadRow[] = (data as LeadRow[]) ?? [];

  // 완주 = 유효한 v2.0 채점 블롭이 있는 리드. readFreeReportBlob 로 형태 검증.
  const completed = rows
    .map((r) => ({ row: r, blob: readFreeReportBlob(r.parts_map) }))
    .filter((x): x is { row: LeadRow; blob: NonNullable<ReturnType<typeof readFreeReportBlob>> } => x.blob !== null);

  const totalCount = rows.length;
  const completedCount = completed.length;
  const boundCount = rows.filter((r) => r.user_id).length;
  const crisisCount = completed.filter((x) => x.blob.score_result.crisis_flag).length;
  const completionRate =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // 유형(primary_child) 분포 — 많은 순.
  const typeDist = new Map<string, number>();
  for (const { blob } of completed) {
    const name = blob.score_result.primary_child.child_name;
    typeDist.set(name, (typeDist.get(name) ?? 0) + 1);
  }
  const typeRanking = [...typeDist.entries()].sort((a, b) => b[1] - a[1]);

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
            내면 아이 리드
          </h1>
          <p className="mt-2 text-sm text-[var(--foreground)]/60">
            내면 아이 찾기 테스트를 시작·완료한 방문자와, 각자가 고른 답변·채점
            결과를 확인해요. &lsquo;시작&rsquo;만 누르고 완료하지 않은 빈 리드는
            완주율에만 반영됩니다.
          </p>
        </div>

        {error ? (
          <p className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            리드를 불러오지 못했어요. (minds_leads 테이블 접근 권한/마이그레이션을
            확인해 주세요)
          </p>
        ) : (
          <>
            {/* 요약 */}
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: "전체 시작", value: totalCount, unit: "명" },
                { label: "완주", value: completedCount, unit: "명" },
                { label: "완주율", value: completionRate, unit: "%" },
                { label: "회원 귀속", value: boundCount, unit: "명" },
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

            {/* 위기 플래그 경고 배너 — 있을 때만 */}
            {crisisCount > 0 && (
              <div className="mb-6 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                ⚠️ 위기(crisis) 응답으로 분류된 리드가 {crisisCount}건 있어요.
                아래 목록에서 <span className="font-semibold">위기</span> 뱃지를
                확인하세요.
              </div>
            )}

            {/* 유형 분포 */}
            {typeRanking.length > 0 && (
              <div className="mb-8 rounded-2xl border-2 border-[var(--foreground)]/10 bg-white px-6 py-5">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--foreground)]/40">
                  주요 내면 아이 분포
                </p>
                <div className="flex flex-col gap-2">
                  {typeRanking.map(([name, count]) => {
                    const pct = Math.round((count / completedCount) * 100);
                    return (
                      <div key={name} className="flex items-center gap-3">
                        <span className="w-40 shrink-0 truncate text-sm text-[var(--foreground)]">
                          {name}
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--foreground)]/5">
                          <div
                            className="h-full rounded-full bg-[var(--foreground)]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-16 shrink-0 text-right text-sm tabular-nums text-[var(--foreground)]/60">
                          {count}명 ({pct}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 완주 리드 목록 */}
            {completed.length === 0 ? (
              <p className="rounded-xl border-2 border-[var(--foreground)]/10 bg-white px-4 py-10 text-center text-sm text-[var(--foreground)]/50">
                아직 완료한 리드가 없어요.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border-2 border-[var(--foreground)]/10 bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--foreground)]/10 text-left text-[11px] uppercase tracking-wider text-[var(--foreground)]/40">
                      <th className="px-4 py-3 font-semibold">완료일</th>
                      <th className="px-4 py-3 font-semibold">내면 아이</th>
                      <th className="px-4 py-3 font-semibold">지킴이</th>
                      <th className="px-4 py-3 font-semibold">1순위 영역</th>
                      <th className="px-4 py-3 font-semibold">회원</th>
                      <th className="px-4 py-3 font-semibold">보기</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completed.map(({ row, blob }) => {
                      const sr = blob.score_result;
                      const topArea = (
                        Object.entries(sr.areas) as [AreaId, { rank: number }][]
                      ).find(([, a]) => a.rank === 1)?.[0];
                      return (
                        <tr
                          key={row.id}
                          className="border-b border-[var(--foreground)]/5 align-top last:border-0"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-[var(--foreground)]/60 tabular-nums">
                            {fmtDate(row.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-[var(--foreground)]">
                              {sr.primary_child.child_name}
                            </span>
                            {sr.crisis_flag && (
                              <span className="ml-2 rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                                위기
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[var(--foreground)]/70">
                            {sr.guardian.label}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-[var(--foreground)]/70">
                            {topArea ? AREA_LABEL[topArea] : "–"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {row.user_id ? (
                              <span className="text-[var(--foreground)]/70">
                                가입
                              </span>
                            ) : (
                              <span className="text-[var(--foreground)]/30">
                                익명
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <Link
                              href={`/admin/inner-child/${row.id}`}
                              className="font-semibold text-[var(--foreground)] underline underline-offset-2 hover:opacity-70"
                            >
                              상세
                            </Link>
                            <span className="mx-2 text-[var(--foreground)]/20">
                              ·
                            </span>
                            <Link
                              href={`/inner-child/r/${row.id}`}
                              target="_blank"
                              className="text-[var(--foreground)]/60 underline underline-offset-2 hover:text-[var(--foreground)]"
                            >
                              리포트 ↗
                            </Link>
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
