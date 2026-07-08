import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import RefundButton from "./RefundButton";

export const metadata: Metadata = {
  title: "결제 · 환불 관리 | 기분 스튜디오",
  robots: { index: false },
};

// 매 조회마다 최신 결제 상태를 보여준다.
export const dynamic = "force-dynamic";

// 환불 가능한 4개 결제 테이블 → 환불 API의 type 과 1:1 매핑.
// (route.ts 의 REFUNDABLE_TYPES 와 짝을 맞춰야 한다.)
type SourceKey =
  | "husband_match"
  | "counseling"
  | "workshop"
  | "minds_relationship";

interface Source {
  type: SourceKey;
  table: string;
  label: string;
  // 이메일→행 매칭에 쓰는 컬럼. user 는 auth user_id, lead 는 minds 리드 id.
  userCol: string | null;
  leadCol: string | null;
  // 추가로 가져올 상품 설명용 컬럼 (공통 컬럼 외).
  extraCols: string[];
  describe: (r: Record<string, unknown>) => string;
}

const SOURCES: Source[] = [
  {
    type: "husband_match",
    table: "husband_match_payments",
    label: "남편상 분석",
    userCol: "user_id",
    leadCol: null,
    extraCols: ["payment_method"],
    describe: (r) =>
      r.payment_method === "bank_transfer" ? "무통장입금" : "카드 결제",
  },
  {
    type: "counseling",
    table: "counseling_purchases",
    label: "상담",
    userCol: "user_id",
    leadCol: null,
    extraCols: ["title", "counseling_type"],
    describe: (r) =>
      (r.title as string) || (r.counseling_type as string) || "상담",
  },
  {
    type: "workshop",
    table: "workshop_purchases",
    label: "워크북",
    userCol: "user_id",
    leadCol: "minds_lead_id",
    extraCols: ["workshop_type"],
    describe: (r) => (r.workshop_type as string) || "워크북",
  },
  {
    type: "minds_relationship",
    table: "minds_relationship_purchases",
    label: "관계 해설 리포트",
    userCol: "user_id",
    leadCol: "lead_id",
    extraCols: [],
    describe: () => "관계 해설 리포트",
  },
];

// 모든 테이블이 공유하는 공통 컬럼 (route.ts 주석 기준).
const COMMON_COLS = ["id", "order_id", "amount", "status", "payment_key", "paid_at"];

interface PaymentRow {
  source: Source;
  id: string;
  orderId: string | null;
  amount: number;
  status: string;
  paymentKey: string | null;
  paidAt: string | null;
  desc: string;
  // 전체 목록에서 결제자를 식별하기 위한 이메일 (검색 결과에서는 검색한 이메일).
  email: string | null;
}

function fmtDate(iso: string | null): string {
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

const STATUS_STYLE: Record<string, string> = {
  confirmed: "border-emerald-500/40 text-emerald-600",
  refunded: "border-[var(--foreground)]/20 text-[var(--foreground)]/40",
  pending: "border-amber-400/50 text-amber-600",
  cancelled: "border-[var(--foreground)]/20 text-[var(--foreground)]/40",
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: "결제완료",
  refunded: "환불됨",
  pending: "미승인",
  cancelled: "취소됨",
};

/**
 * 이메일로 해당 유저의 결제 건을 4개 테이블에서 모아온다.
 * - auth.users 에서 user_id, minds_leads 에서 lead_id 를 먼저 해석한 뒤
 *   각 테이블을 user_id / lead 컬럼으로 조회해 병합(id 기준 dedupe)한다.
 */
async function lookupPayments(
  email: string
): Promise<{ rows: PaymentRow[]; userId: string | null; leadCount: number }> {
  const admin = createAdminClient();
  const target = email.trim().toLowerCase();

  // 1) auth.users → user_id (페이지네이션으로 전수 탐색)
  let userId: string | null = null;
  for (let page = 1; page <= 30; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) break;
    const hit = data.users.find(
      (u) => (u.email ?? "").toLowerCase() === target
    );
    if (hit) {
      userId = hit.id;
      break;
    }
    if (data.users.length < 1000) break;
  }

  // 2) minds_leads → lead_id[] (익명 리드젠 결제 매칭용)
  const { data: leads } = await admin
    .from("minds_leads")
    .select("id")
    .eq("email", target);
  const leadIds = (leads ?? []).map((l) => l.id as string);

  // 3) 각 소스별로 조회 → 병합
  const all: PaymentRow[] = [];
  for (const src of SOURCES) {
    const cols = [...COMMON_COLS, ...src.extraCols].join(", ");
    const seen = new Set<string>();

    const pushRows = (data: Record<string, unknown>[] | null) => {
      for (const r of data ?? []) {
        const id = r.id as string;
        if (seen.has(id)) continue;
        seen.add(id);
        all.push({
          source: src,
          id,
          orderId: (r.order_id as string) ?? null,
          amount: (r.amount as number) ?? 0,
          status: (r.status as string) ?? "unknown",
          paymentKey: (r.payment_key as string) ?? null,
          paidAt: (r.paid_at as string) ?? null,
          desc: src.describe(r),
          email: target,
        });
      }
    };

    if (userId && src.userCol) {
      const { data } = await admin
        .from(src.table)
        .select(cols)
        .eq(src.userCol, userId);
      pushRows(data as Record<string, unknown>[] | null);
    }
    if (leadIds.length && src.leadCol) {
      const { data } = await admin
        .from(src.table)
        .select(cols)
        .in(src.leadCol, leadIds);
      pushRows(data as Record<string, unknown>[] | null);
    }
  }

  // 결제완료 → 나머지, 그 안에서 최신 결제일 순으로.
  all.sort(sortRows);

  return { rows: all, userId, leadCount: leadIds.length };
}

/**
 * 검색 없이 4개 테이블의 모든 결제 건을 모아온다 (전체 결제자 표).
 * - 각 행의 user_id / lead_id 를 모아 auth.users · minds_leads 에서
 *   이메일을 한 번에 해석해 붙인다.
 */
async function loadAllPayments(): Promise<PaymentRow[]> {
  const admin = createAdminClient();

  const rows: PaymentRow[] = [];
  const userIds = new Set<string>();
  const leadIds = new Set<string>();
  // 이메일 해석 전, 각 행이 참조하는 user/lead id 를 잠시 기억해 둔다.
  const refs: { row: PaymentRow; userId: string | null; leadId: string | null }[] =
    [];

  for (const src of SOURCES) {
    const cols = [
      ...COMMON_COLS,
      ...src.extraCols,
      ...(src.userCol ? [src.userCol] : []),
      ...(src.leadCol ? [src.leadCol] : []),
    ].join(", ");

    const { data } = await admin.from(src.table).select(cols);
    for (const r of (data ?? []) as unknown as Record<string, unknown>[]) {
      const userId = src.userCol ? ((r[src.userCol] as string) ?? null) : null;
      const leadId = src.leadCol ? ((r[src.leadCol] as string) ?? null) : null;
      if (userId) userIds.add(userId);
      if (leadId) leadIds.add(leadId);

      const row: PaymentRow = {
        source: src,
        id: r.id as string,
        orderId: (r.order_id as string) ?? null,
        amount: (r.amount as number) ?? 0,
        status: (r.status as string) ?? "unknown",
        paymentKey: (r.payment_key as string) ?? null,
        paidAt: (r.paid_at as string) ?? null,
        desc: src.describe(r),
        email: null,
      };
      refs.push({ row, userId, leadId });
    }
  }

  // user_id → 이메일 (개별 조회, 결제 건 수만큼이라 소량)
  const userEmail = new Map<string, string>();
  await Promise.all(
    [...userIds].map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      if (data?.user?.email) userEmail.set(id, data.user.email);
    })
  );

  // lead_id → 이메일 (한 번에 IN 조회)
  const leadEmail = new Map<string, string>();
  if (leadIds.size) {
    const { data } = await admin
      .from("minds_leads")
      .select("id, email")
      .in("id", [...leadIds]);
    for (const l of (data ?? []) as { id: string; email: string | null }[]) {
      if (l.email) leadEmail.set(l.id, l.email);
    }
  }

  for (const { row, userId, leadId } of refs) {
    row.email =
      (userId && userEmail.get(userId)) ||
      (leadId && leadEmail.get(leadId)) ||
      null;
    rows.push(row);
  }

  rows.sort(sortRows);
  return rows;
}

// 결제완료 먼저 → 그 안에서 최신 결제일 순.
function sortRows(a: PaymentRow, b: PaymentRow): number {
  if (a.status !== b.status) {
    if (a.status === "confirmed") return -1;
    if (b.status === "confirmed") return 1;
  }
  return (b.paidAt ?? "").localeCompare(a.paidAt ?? "");
}

// 결제 내역 표 — 검색 결과와 전체 목록이 같은 렌더를 공유한다.
// showEmail=true 일 때만 결제자(이메일) 컬럼을 노출한다.
function PaymentsTable({
  rows,
  showEmail,
}: {
  rows: PaymentRow[];
  showEmail: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border-2 border-[var(--foreground)]/10 bg-white">
      <table className={`w-full ${showEmail ? "min-w-[860px]" : "min-w-[720px]"} text-sm`}>
        <thead>
          <tr className="border-b border-[var(--foreground)]/10 text-left text-[11px] uppercase tracking-wider text-[var(--foreground)]/40">
            <th className="px-4 py-3 font-semibold">결제일</th>
            {showEmail && <th className="px-4 py-3 font-semibold">결제자</th>}
            <th className="px-4 py-3 font-semibold">상품</th>
            <th className="px-4 py-3 font-semibold">금액</th>
            <th className="px-4 py-3 font-semibold">상태</th>
            <th className="px-4 py-3 font-semibold">주문번호</th>
            <th className="px-4 py-3 text-right font-semibold">환불</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={`${r.source.table}-${r.id}`}
              className="border-b border-[var(--foreground)]/5 align-middle last:border-0"
            >
              <td className="whitespace-nowrap px-4 py-3 tabular-nums text-[var(--foreground)]/60">
                {fmtDate(r.paidAt)}
              </td>
              {showEmail && (
                <td className="whitespace-nowrap px-4 py-3">
                  {r.email ? (
                    <Link
                      href={`/admin/payments?email=${encodeURIComponent(r.email)}`}
                      className="text-[var(--foreground)] underline decoration-[var(--foreground)]/20 underline-offset-2 hover:decoration-[var(--foreground)]"
                    >
                      {r.email}
                    </Link>
                  ) : (
                    <span className="text-[var(--foreground)]/30">
                      비로그인/미상
                    </span>
                  )}
                </td>
              )}
              <td className="px-4 py-3">
                <span className="font-semibold text-[var(--foreground)]">
                  {r.source.label}
                </span>
                <span className="block text-xs text-[var(--foreground)]/50">
                  {r.desc}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-semibold tabular-nums text-[var(--foreground)]">
                ₩{r.amount.toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <span
                  className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                    STATUS_STYLE[r.status] ??
                    "border-[var(--foreground)]/20 text-[var(--foreground)]/50"
                  }`}
                >
                  {STATUS_LABEL[r.status] ?? r.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-mono text-[11px] text-[var(--foreground)]/50">
                {r.orderId ?? "–"}
              </td>
              <td className="px-4 py-3 text-right">
                {r.status === "confirmed" && r.paymentKey ? (
                  <RefundButton
                    type={r.source.type}
                    paymentId={r.id}
                    label={r.source.label}
                    amount={r.amount}
                  />
                ) : (
                  <span className="text-xs text-[var(--foreground)]/30">
                    {r.status === "refunded" ? "환불 완료" : "환불 불가"}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  await requireAdmin("/admin/payments");

  const sp = await searchParams;
  const email = (sp.email ?? "").trim();

  // 검색 결과(있을 때)와 전체 결제자 목록을 함께 준비한다.
  const [result, allRows] = await Promise.all([
    email ? lookupPayments(email) : Promise.resolve(null),
    loadAllPayments(),
  ]);
  const rows = result?.rows ?? [];
  const confirmedTotal = rows
    .filter((r) => r.status === "confirmed")
    .reduce((s, r) => s + r.amount, 0);

  // 전체 목록 요약 — 대시보드 카드의 "결제완료 합계" 와 같은 값.
  const allConfirmed = allRows.filter((r) => r.status === "confirmed");
  const allConfirmedTotal = allConfirmed.reduce((s, r) => s + r.amount, 0);

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
            결제 · 환불 관리
          </h1>
          <p className="mt-2 text-sm text-[var(--foreground)]/60">
            이메일로 유저의 결제 내역을 조회하고, 결제완료 건을 바로 환불할 수
            있어요. 환불은 실제 카드 취소이며 되돌릴 수 없습니다.
          </p>
        </div>

        {/* 조회 폼 (GET) */}
        <form
          method="GET"
          className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-[var(--foreground)]/10 bg-white px-5 py-4"
        >
          <label className="text-sm font-semibold text-[var(--foreground)]">
            이메일
          </label>
          <input
            type="email"
            name="email"
            defaultValue={email}
            placeholder="user@example.com"
            required
            className="min-w-[240px] flex-1 rounded-lg border-2 border-[var(--foreground)]/15 px-3 py-2 text-sm focus:border-[var(--foreground)] focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-full border-2 border-[var(--foreground)] bg-[var(--foreground)] px-5 py-2 text-sm font-semibold text-white transition-colors hover:opacity-80"
          >
            조회
          </button>
        </form>

        {/* 검색 결과 */}
        {result && (
          <div className="mb-12">
            {/* 요약 */}
            <div className="mb-5 flex flex-wrap gap-8 rounded-2xl border-2 border-[var(--foreground)]/10 bg-white px-6 py-4 text-sm">
              <div>
                <p className="text-[11px] text-[var(--foreground)]/50">계정</p>
                <p className="font-semibold text-[var(--foreground)]">
                  {result.userId ? (
                    <span className="tabular-nums">
                      {result.userId.slice(0, 8)}…
                    </span>
                  ) : (
                    <span className="text-[var(--foreground)]/40">
                      가입 계정 없음(비로그인)
                    </span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[var(--foreground)]/50">
                  전체 건수
                </p>
                <p className="text-xl font-bold tabular-nums text-[var(--foreground)]">
                  {rows.length}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[var(--foreground)]/50">
                  결제완료 합계
                </p>
                <p className="text-xl font-bold tabular-nums text-[var(--foreground)]">
                  ₩{confirmedTotal.toLocaleString()}
                </p>
              </div>
            </div>

            {rows.length === 0 ? (
              <p className="rounded-xl border-2 border-[var(--foreground)]/10 bg-white px-4 py-10 text-center text-sm text-[var(--foreground)]/50">
                <span className="font-semibold text-[var(--foreground)]/70">
                  {email}
                </span>
                {" 로 조회된 결제 내역이 없어요."}
              </p>
            ) : (
              <PaymentsTable rows={rows} showEmail={false} />
            )}

            <p className="mt-4 text-xs text-[var(--foreground)]/40">
              ※ 미승인(pending)·무통장입금 건은 카드 취소 대상이 아니에요.
              무통장입금 환불은 수동 처리해 주세요.
            </p>
          </div>
        )}

        {/* 전체 결제자 목록 — 검색과 무관하게 항상 노출 */}
        <div>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                전체 결제자
              </h2>
              <p className="mt-1 text-sm text-[var(--foreground)]/60">
                4개 결제 테이블(남편상·상담·워크북·관계 리포트)의 모든 결제
                건이에요. 결제완료가 먼저, 그 안에서 최신순으로 보여요.
              </p>
            </div>
            <div className="flex gap-8 text-sm">
              <div>
                <p className="text-[11px] text-[var(--foreground)]/50">
                  전체 건수
                </p>
                <p className="text-xl font-bold tabular-nums text-[var(--foreground)]">
                  {allRows.length}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[var(--foreground)]/50">
                  결제완료 합계
                </p>
                <p className="text-xl font-bold tabular-nums text-[var(--foreground)]">
                  ₩{allConfirmedTotal.toLocaleString()}
                  <span className="ml-2 text-xs font-medium text-[var(--foreground)]/40">
                    ({allConfirmed.length}건)
                  </span>
                </p>
              </div>
            </div>
          </div>

          {allRows.length === 0 ? (
            <p className="rounded-xl border-2 border-[var(--foreground)]/10 bg-white px-4 py-10 text-center text-sm text-[var(--foreground)]/50">
              아직 결제 내역이 없어요.
            </p>
          ) : (
            <PaymentsTable rows={allRows} showEmail={true} />
          )}

          <p className="mt-4 text-xs text-[var(--foreground)]/40">
            ※ 결제자 이메일을 클릭하면 해당 유저만 조회할 수 있어요. 비로그인
            결제(익명 리드)는 리드에 이메일이 없으면 “비로그인/미상”으로 표시돼요.
          </p>
        </div>
      </div>
    </main>
  );
}
