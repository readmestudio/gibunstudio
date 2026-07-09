import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { readFreeReportBlob } from "@/lib/minds/inner-child/free-report-store";
import { readPartsMap } from "@/lib/self-workshop/core-belief-excavation";

export const metadata: Metadata = {
  title: "전체 리드 | 기분 스튜디오",
  robots: { index: false },
};

// 진입할 때마다 최신 리드를 보여준다.
export const dynamic = "force-dynamic";

// ── 테스트(퍼널) 레지스트리 ──────────────────────────────────────
// 새 무료 테스트가 생기면 여기 한 줄만 추가하면 통합 리스트/필터가 자동으로 잡는다.
// test_type(minds_leads 컬럼) → 표시 라벨·리포트/상세 링크.
interface TestMeta {
  label: string; // 필터 탭·뱃지에 쓰는 짧은 이름
  reportPath: (id: string) => string; // 공개 리포트 경로
  detailPath?: (id: string) => string; // 어드민 상세(있을 때만)
}
const TEST_META: Record<string, TestMeta> = {
  inner_child: {
    label: "내면 아이",
    reportPath: (id) => `/inner-child/r/${id}`,
    detailPath: (id) => `/admin/inner-child/${id}`,
  },
  minds: {
    label: "마음 배역",
    reportPath: (id) => `/minds/r/${id}`,
  },
};
// 필터 탭에 노출할 순서(등록된 것만). 알 수 없는 test_type 은 라벨 없이 값 그대로 표시.
const TEST_ORDER = ["inner_child", "minds"];

function testLabel(testType: string): string {
  return TEST_META[testType]?.label ?? testType;
}

interface LeadRow {
  id: string;
  created_at: string;
  user_id: string | null;
  phone: string | null;
  test_type: string;
  parts_map: unknown;
}

// 리드의 채점 결과에서 "유형" 라벨과 완주 여부를 뽑는다. 테스트마다 parts_map 구조가
// 다르므로 test_type 으로 파서를 고른다(내면 아이 = 유형 블롭, 그 외 = 마음 배역).
function describeRow(row: LeadRow): {
  done: boolean;
  typeLabel: string;
  crisis: boolean;
} {
  if (row.test_type === "inner_child") {
    const blob = readFreeReportBlob(row.parts_map);
    if (!blob) return { done: false, typeLabel: "–", crisis: false };
    return {
      done: true,
      typeLabel: blob.score_result.primary_child.child_name,
      crisis: blob.score_result.crisis_flag,
    };
  }
  // minds(및 미등록 테스트 기본) — 마음 배역 지도. 대표 배역(leader) 이름을 유형으로.
  const pm = readPartsMap({ parts_map: row.parts_map });
  if (!pm) return { done: false, typeLabel: "–", crisis: false };
  const leader = pm.parts.find((p) => p.id === pm.leader_id) ?? pm.parts[0];
  return {
    done: true,
    typeLabel: leader?.tagline || leader?.name || "마음 배역",
    crisis: false,
  };
}

// 전화번호 비교용 — 숫자만 남긴다.
function digits(s: string | null | undefined): string {
  return (s ?? "").replace(/\D/g, "");
}

function fmtDate(iso: string): string {
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

export default async function AdminLeadsPage({
  searchParams,
}: {
  // Next.js 16: searchParams 는 Promise → await 해서 푼다.
  searchParams: Promise<{ test?: string; q?: string }>;
}) {
  await requireAdmin("/admin/leads");

  const sp = await searchParams;
  const test = (sp.test ?? "").trim(); // "" = 전체
  const q = (sp.q ?? "").trim();
  const qDigits = digits(q);
  const qLower = q.toLowerCase();

  const admin = createAdminClient();

  // 테스트별 카운트(필터 탭 숫자용) — 등록된 테스트 각각 head count.
  const [{ count: totalCount }, ...typeCounts] = await Promise.all([
    admin.from("minds_leads").select("*", { count: "exact", head: true }),
    ...TEST_ORDER.map((t) =>
      admin
        .from("minds_leads")
        .select("*", { count: "exact", head: true })
        .eq("test_type", t)
    ),
  ]);
  const countByTest = new Map<string, number>();
  TEST_ORDER.forEach((t, i) => countByTest.set(t, typeCounts[i]?.count ?? 0));

  // 목록 — 선택 탭이 있으면 test_type 으로 좁혀서(없으면 전체) 최신순 최대 500건.
  let query = admin
    .from("minds_leads")
    .select("id, created_at, user_id, phone, test_type, parts_map")
    .order("created_at", { ascending: false })
    .limit(500);
  if (test) query = query.eq("test_type", test);

  const { data, error } = await query;
  const rows: LeadRow[] = (data as LeadRow[]) ?? [];

  // 각 행의 유형·완주 여부를 미리 계산(정렬·검색·표시에 재사용).
  const described = rows.map((row) => ({ row, ...describeRow(row) }));
  const completedCount = described.filter((d) => d.done).length;

  // 검색 — 연락처(숫자 부분일치)·leadId·유형명으로 좁힌다.
  const visible = q
    ? described.filter(({ row, typeLabel }) => {
        const phoneHit =
          qDigits.length >= 2 && digits(row.phone).includes(qDigits);
        const idHit = row.id.toLowerCase().includes(qLower);
        const typeHit = typeLabel.includes(q);
        return phoneHit || idHit || typeHit;
      })
    : described;

  // 필터 탭 정의 — 전체 + 등록된 테스트들.
  const tabs = [
    { key: "", label: "전체", count: totalCount ?? 0 },
    ...TEST_ORDER.map((t) => ({
      key: t,
      label: testLabel(t),
      count: countByTest.get(t) ?? 0,
    })),
  ];
  const tabHref = (key: string) => (key ? `/admin/leads?test=${key}` : "/admin/leads");

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
            전체 리드
          </h1>
          <p className="mt-2 text-sm text-[var(--foreground)]/60">
            무료 테스트(내면 아이·마음 배역 등)를 시작·완료한 방문자를 한 곳에서
            보고, 어느 테스트에서 온 리드인지 구분해요. 위 탭으로 테스트별로 좁힐 수
            있어요.
          </p>
        </div>

        {error ? (
          <p className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            리드를 불러오지 못했어요. (minds_leads 테이블 접근 권한/마이그레이션을
            확인해 주세요 — test_type 컬럼은 20260710 마이그레이션 필요)
          </p>
        ) : (
          <>
            {/* 테스트 필터 탭 */}
            <div className="mb-6 flex flex-wrap gap-2">
              {tabs.map((t) => {
                const active = t.key === test;
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
                        active
                          ? "text-white/70"
                          : "text-[var(--foreground)]/40"
                      }`}
                    >
                      {t.count}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* 요약 — 현재 탭 기준 시작/완주 */}
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[
                { label: "표시 중(시작)", value: rows.length, unit: "명" },
                { label: "완주", value: completedCount, unit: "명" },
                {
                  label: "완주율",
                  value:
                    rows.length > 0
                      ? Math.round((completedCount / rows.length) * 100)
                      : 0,
                  unit: "%",
                },
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

            {/* 검색 */}
            <form method="get" className="mb-4 flex gap-2">
              {/* 현재 탭을 유지한 채 검색되도록 test 를 hidden 으로 실어 보낸다. */}
              {test && <input type="hidden" name="test" value={test} />}
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="연락처·leadId·유형으로 검색"
                className="flex-1 rounded-xl border-2 border-[var(--foreground)]/15 bg-white px-4 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--foreground)]"
              />
              <button
                type="submit"
                className="rounded-xl border-2 border-[var(--foreground)] bg-[var(--foreground)] px-5 py-2.5 text-sm font-semibold text-white"
              >
                검색
              </button>
              {q && (
                <Link
                  href={tabHref(test)}
                  className="flex items-center rounded-xl border-2 border-[var(--foreground)]/15 px-4 py-2.5 text-sm font-semibold text-[var(--foreground)]/60 hover:border-[var(--foreground)]"
                >
                  초기화
                </Link>
              )}
            </form>

            {q && (
              <p className="mb-3 text-sm text-[var(--foreground)]/60">
                &lsquo;<span className="font-semibold text-[var(--foreground)]">{q}</span>&rsquo;
                검색 결과 {visible.length}건
              </p>
            )}

            {/* 리드 목록 */}
            {rows.length === 0 ? (
              <p className="rounded-xl border-2 border-[var(--foreground)]/10 bg-white px-4 py-10 text-center text-sm text-[var(--foreground)]/50">
                아직 리드가 없어요.
              </p>
            ) : visible.length === 0 ? (
              <p className="rounded-xl border-2 border-[var(--foreground)]/10 bg-white px-4 py-10 text-center text-sm text-[var(--foreground)]/50">
                검색 결과가 없어요.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border-2 border-[var(--foreground)]/10 bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--foreground)]/10 text-left text-[11px] uppercase tracking-wider text-[var(--foreground)]/40">
                      <th className="px-4 py-3 font-semibold">시작일</th>
                      <th className="px-4 py-3 font-semibold">테스트</th>
                      <th className="px-4 py-3 font-semibold">유형</th>
                      <th className="px-4 py-3 font-semibold">연락처</th>
                      <th className="px-4 py-3 font-semibold">회원</th>
                      <th className="px-4 py-3 font-semibold">보기</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map(({ row, done, typeLabel, crisis }) => {
                      const meta = TEST_META[row.test_type];
                      return (
                        <tr
                          key={row.id}
                          className="border-b border-[var(--foreground)]/5 align-top last:border-0"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-[var(--foreground)]/60 tabular-nums">
                            {fmtDate(row.created_at)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className="rounded-full border-2 border-[var(--foreground)]/15 px-2.5 py-0.5 text-[12px] font-semibold text-[var(--foreground)]/70">
                              {testLabel(row.test_type)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {done ? (
                              <span className="font-semibold text-[var(--foreground)]">
                                {typeLabel}
                              </span>
                            ) : (
                              <span className="text-[var(--foreground)]/30">
                                미완주
                              </span>
                            )}
                            {crisis && (
                              <span className="ml-2 rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                                위기
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 tabular-nums text-[var(--foreground)]/80">
                            {row.phone || (
                              <span className="text-[var(--foreground)]/25">–</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {row.user_id ? (
                              <span className="text-[var(--foreground)]/70">가입</span>
                            ) : (
                              <span className="text-[var(--foreground)]/30">익명</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {meta?.detailPath && (
                              <>
                                <Link
                                  href={meta.detailPath(row.id)}
                                  className="font-semibold text-[var(--foreground)] underline underline-offset-2 hover:opacity-70"
                                >
                                  상세
                                </Link>
                                <span className="mx-2 text-[var(--foreground)]/20">
                                  ·
                                </span>
                              </>
                            )}
                            {done && meta ? (
                              <Link
                                href={meta.reportPath(row.id)}
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
