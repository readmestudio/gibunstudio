import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  WAITLIST_WORKBOOKS,
  PURCHASE_TYPE_OPTIONS,
  CONCERN_OPTIONS,
  JOB_OPTIONS,
  YEARS_OPTIONS,
  COUNSELING_EXPERIENCE_OPTIONS,
  COUNSELING_REASON_OPTIONS,
  DESIRED_START_OPTIONS,
  GOAL_OPTIONS,
  WAITLIST_LABELS,
  type ChoiceOption,
} from "@/lib/waitlist/constants";

export const metadata: Metadata = {
  title: "워크북 대기신청 관리 | 기분 스튜디오",
  robots: { index: false },
};

// admin 페이지는 매 요청마다 최신 상태로
export const dynamic = "force-dynamic";

// DB(workbook_waitlist) 한 행의 형태. 저장값은 모두 영문 id 이므로 라벨 변환이 필요하다.
interface WaitlistRow {
  id: string;
  created_at: string;
  name: string | null;
  email: string;
  phone: string | null;
  workbooks: string[] | null;
  purchase_type: string | null;
  concern: string[] | null;
  job: string | null;
  years_experience: string | null;
  counseling_experience: string | null;
  counseling_reason: string[] | null;
  desired_start: string | null;
  goals: string[] | null;
  etc_details: Record<string, string> | null;
  inquiry: string | null;
}

// 신청 시각을 한국 시간 기준 "2026.06.14 14:30" 형태로(테이블용 짧은 포맷).
function formatKst(iso: string): string {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(d)
    .replace(/\. /g, ".")
    .replace(/\.$/, "");
}

// 단일 id → 라벨(없으면 빈 문자열).
function one(map: Record<string, string>, id: string | null): string {
  if (!id) return "";
  return map[id] ?? id;
}

// 복수 id[] → "라벨, 라벨" 문자열. "기타" 직접입력값이 있으면 괄호로 덧붙인다.
function many(
  map: Record<string, string>,
  ids: string[] | null,
  etcText?: string
): string {
  if (!ids || ids.length === 0) return "";
  const labels = ids.map((id) => {
    if (id === "etc" && etcText) return `기타(${etcText})`;
    return map[id] ?? id;
  });
  return labels.join(", ");
}

// ── 자동 통계 ──
// 각 질문의 선택지별 응답 수를 센다. 단일/복수 모두 "선택된 id 배열"로 통일해서 처리.
function distribution(
  rows: WaitlistRow[],
  options: ChoiceOption[],
  pick: (r: WaitlistRow) => string[]
): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    for (const id of pick(r)) counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  // 옵션 정의 순서를 유지하되, 응답 많은 순으로 정렬.
  return options
    .map((o) => ({ label: o.label, count: counts.get(o.id) ?? 0 }))
    .sort((a, b) => b.count - a.count);
}

// 통계 블록 하나(질문 제목 + 선택지별 막대).
function StatBlock({
  title,
  data,
  total,
}: {
  title: string;
  data: { label: string; count: number }[];
  total: number;
}) {
  return (
    <div className="rounded-xl border-2 border-[var(--foreground)]/10 bg-white p-5">
      <p className="text-sm font-bold text-[var(--foreground)] mb-3">{title}</p>
      <div className="space-y-2">
        {data.map((d) => {
          const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
          return (
            <div key={d.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[var(--foreground)]/70">{d.label}</span>
                <span className="text-[var(--foreground)]/50 tabular-nums">
                  {d.count}명 · {pct}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--surface)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--foreground)]/70"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 로우데이터 테이블의 열 정의(헤더 + 각 행의 셀 값 추출).
const COLUMNS: { header: string; cell: (r: WaitlistRow) => string }[] = [
  { header: "신청일시(KST)", cell: (r) => formatKst(r.created_at) },
  { header: "이름", cell: (r) => r.name ?? "" },
  { header: "이메일", cell: (r) => r.email },
  { header: "전화번호", cell: (r) => r.phone ?? "" },
  {
    header: "관심 워크북",
    cell: (r) =>
      many(WAITLIST_LABELS.workbooks, r.workbooks, r.etc_details?.workbooks),
  },
  {
    header: "구매 의향",
    cell: (r) => one(WAITLIST_LABELS.purchaseType, r.purchase_type),
  },
  {
    header: "고민",
    cell: (r) => many(WAITLIST_LABELS.concern, r.concern, r.etc_details?.concern),
  },
  {
    header: "직업",
    cell: (r) => {
      const v = one(WAITLIST_LABELS.job, r.job);
      return r.job === "etc" && r.etc_details?.job
        ? `기타(${r.etc_details.job})`
        : v;
    },
  },
  {
    header: "연차",
    cell: (r) => one(WAITLIST_LABELS.yearsExperience, r.years_experience),
  },
  {
    header: "상담 경험",
    cell: (r) =>
      one(WAITLIST_LABELS.counselingExperience, r.counseling_experience),
  },
  {
    header: "상담 관련 이유",
    cell: (r) =>
      many(
        WAITLIST_LABELS.counselingReason,
        r.counseling_reason,
        r.etc_details?.counseling_reason
      ),
  },
  {
    header: "희망 시작 시기",
    cell: (r) => one(WAITLIST_LABELS.desiredStart, r.desired_start),
  },
  {
    header: "알고 싶은 내용",
    cell: (r) => many(WAITLIST_LABELS.goals, r.goals, r.etc_details?.goals),
  },
  { header: "추가 문의", cell: (r) => r.inquiry ?? "" },
];

export default async function AdminWaitlistPage() {
  await requireAdmin("/admin/waitlist");

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("workbook_waitlist")
    .select("*")
    .order("created_at", { ascending: false });

  // 간단 "알림 신청 버튼"(NotifyButton → open_notifications) 누적 건수.
  // 이 버튼은 Slack 알림을 보내지 않으므로 여기 숫자로만 확인한다.
  const { count: notifyCount } = await admin
    .from("open_notifications")
    .select("*", { count: "exact", head: true });

  const rows = (data ?? []) as WaitlistRow[];

  // 상단 요약: 전체 / "워크북+상담" 희망(상담 리드) 건수.
  const total = rows.length;
  const counselingLeads = rows.filter(
    (r) => r.purchase_type === "workbook_counseling"
  ).length;
  const notifyTotal = notifyCount ?? 0;

  // 질문별 자동 통계 정의.
  const statBlocks = [
    {
      title: "관심 워크북",
      data: distribution(rows, WAITLIST_WORKBOOKS, (r) => r.workbooks ?? []),
    },
    {
      title: "구매 의향",
      data: distribution(rows, PURCHASE_TYPE_OPTIONS, (r) =>
        r.purchase_type ? [r.purchase_type] : []
      ),
    },
    {
      title: "고민",
      data: distribution(rows, CONCERN_OPTIONS, (r) => r.concern ?? []),
    },
    {
      title: "직업",
      data: distribution(rows, JOB_OPTIONS, (r) => (r.job ? [r.job] : [])),
    },
    {
      title: "연차",
      data: distribution(rows, YEARS_OPTIONS, (r) =>
        r.years_experience ? [r.years_experience] : []
      ),
    },
    {
      title: "상담 경험",
      data: distribution(rows, COUNSELING_EXPERIENCE_OPTIONS, (r) =>
        r.counseling_experience ? [r.counseling_experience] : []
      ),
    },
    {
      title: "상담 관련 이유",
      data: distribution(
        rows,
        COUNSELING_REASON_OPTIONS,
        (r) => r.counseling_reason ?? []
      ),
    },
    {
      title: "희망 시작 시기",
      data: distribution(rows, DESIRED_START_OPTIONS, (r) =>
        r.desired_start ? [r.desired_start] : []
      ),
    },
    {
      title: "알고 싶은 내용",
      data: distribution(rows, GOAL_OPTIONS, (r) => r.goals ?? []),
    },
  ];

  return (
    <main className="bg-[var(--surface)] min-h-screen">
      <div className="container max-w-6xl mx-auto px-5 py-16">
        <div className="flex items-start justify-between mb-8 gap-4">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/50 mb-2">
              WAITLIST
            </p>
            <h1 className="text-3xl font-bold text-[var(--foreground)]">
              워크북 대기신청
            </h1>
            <p className="mt-2 text-sm text-[var(--foreground)]/60">
              마음챙김 워크북 대기신청 내역을 최신순으로 확인하실 수 있어요.
            </p>
          </div>
          <Link
            href="/admin/essays"
            className="shrink-0 text-xs font-medium text-[var(--foreground)]/60 hover:text-[var(--foreground)] whitespace-nowrap"
          >
            에세이 관리 →
          </Link>
        </div>

        {/* 요약 통계 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div className="rounded-xl border-2 border-[var(--foreground)]/10 bg-white px-5 py-4">
            <p className="text-xs text-[var(--foreground)]/50 mb-1">전체 신청</p>
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {total}
              <span className="text-base font-medium text-[var(--foreground)]/50 ml-1">
                명
              </span>
            </p>
          </div>
          <div className="rounded-xl border-2 border-[var(--foreground)]/10 bg-white px-5 py-4">
            <p className="text-xs text-[var(--foreground)]/50 mb-1">
              워크북 + 상담 희망
            </p>
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {counselingLeads}
              <span className="text-base font-medium text-[var(--foreground)]/50 ml-1">
                명
              </span>
              {total > 0 && (
                <span className="text-sm font-medium text-[var(--foreground)]/40 ml-2">
                  ({Math.round((counselingLeads / total) * 100)}%)
                </span>
              )}
            </p>
          </div>
          <div className="rounded-xl border-2 border-[var(--foreground)]/10 bg-white px-5 py-4">
            <p className="text-xs text-[var(--foreground)]/50 mb-1">
              알림 신청 버튼
            </p>
            <p className="text-2xl font-bold text-[var(--foreground)]">
              {notifyTotal}
              <span className="text-base font-medium text-[var(--foreground)]/50 ml-1">
                건
              </span>
            </p>
            <p className="mt-1 text-[11px] text-[var(--foreground)]/40">
              간단 알림 신청 (Slack 알림 없음)
            </p>
          </div>
        </div>

        {/* 자동 응답 분포 통계 */}
        {total > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-12">
            {statBlocks.map((b) => (
              <StatBlock
                key={b.title}
                title={b.title}
                data={b.data}
                total={total}
              />
            ))}
          </div>
        )}

        {/* 로우데이터 테이블 */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-[var(--foreground)]">
            신청자 원자료
          </h2>
          <p className="text-xs text-[var(--foreground)]/40">
            가로로 스크롤하면 전체 답변을 볼 수 있어요
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border-2 border-dashed border-red-200 bg-red-50 p-8 text-center">
            <p className="text-sm text-red-600">
              대기신청 내역을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
            </p>
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-[var(--foreground)]/20 bg-white p-16 text-center">
            <p className="text-sm text-[var(--foreground)]/60">
              아직 대기신청이 없어요.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border-2 border-[var(--foreground)]/10 bg-white overflow-x-auto">
            <table className="text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--surface)] border-b-2 border-[var(--foreground)]/10">
                  <th className="px-3 py-2.5 text-left font-semibold text-[var(--foreground)]/50 whitespace-nowrap">
                    #
                  </th>
                  {COLUMNS.map((c) => (
                    <th
                      key={c.header}
                      className="px-3 py-2.5 text-left font-semibold text-[var(--foreground)]/50 whitespace-nowrap"
                    >
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={r.id}
                    className="border-t border-[var(--foreground)]/10 hover:bg-[var(--surface)]/40 align-top"
                  >
                    <td className="px-3 py-2.5 text-[var(--foreground)]/40 tabular-nums whitespace-nowrap">
                      {total - i}
                    </td>
                    {COLUMNS.map((c) => {
                      const value = c.cell(r);
                      const isContact =
                        c.header === "이메일" || c.header === "전화번호";
                      return (
                        <td
                          key={c.header}
                          className="px-3 py-2.5 text-[var(--foreground)]/80 max-w-[18rem] min-w-[6rem]"
                        >
                          {isContact && value ? (
                            <a
                              href={
                                c.header === "이메일"
                                  ? `mailto:${value}`
                                  : `tel:${value}`
                              }
                              className="underline underline-offset-2 hover:text-[var(--foreground)] whitespace-nowrap"
                            >
                              {value}
                            </a>
                          ) : (
                            <span className="whitespace-pre-wrap break-words">
                              {value || "—"}
                            </span>
                          )}
                        </td>
                      );
                    })}
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
