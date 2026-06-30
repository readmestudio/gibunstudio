/**
 * /minds/my — "내 마음 리포트" 모아보기 (로그인 필요).
 *
 * 계정(user_id)에 귀속된 무료/유료 리포트를 한 곳에서 보여준다. 기기/브라우저가 달라도
 * 로그인만 하면 여기서 과거 리포트를 다시 열 수 있다(localStorage 의존 제거).
 *
 *  · 무료 리포트 — parts_map 이 채워진 리드. /minds/r/[leadId]
 *  · 유료 리포트 — status=confirmed 결제. /minds/relationship/[purchaseId]
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "내 마음 리포트 · 기분",
  robots: { index: false, follow: false },
};

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  // 서버 로케일 의존 없이 YYYY.MM.DD 로 고정 표기.
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

export default async function MindsMyReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/minds/my");

  const admin = createAdminClient();

  const { data: leads } = await admin
    .from("minds_leads")
    .select("id, created_at, parts_map")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const freeReports = (leads ?? [])
    .filter((l) => !!l.parts_map)
    .map((l) => ({ leadId: l.id as string, createdAt: l.created_at as string }));

  const { data: purchases } = await admin
    .from("minds_relationship_purchases")
    .select("id, created_at, paid_at")
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false });

  const paidReports = (purchases ?? []).map((p) => ({
    purchaseId: p.id as string,
    paidAt: (p.paid_at ?? p.created_at) as string,
  }));

  const empty = freeReports.length === 0 && paidReports.length === 0;

  return (
    <div className="mx-auto w-full max-w-[448px] px-6 py-12">
      <h1 className="text-2xl font-extrabold tracking-tight text-[var(--foreground)]">
        내 마음 리포트
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">
        계정에 보관된 리포트예요. 어느 기기에서든 로그인하면 여기서 다시 볼 수 있어요.
      </p>

      {empty && (
        <div className="mt-10 rounded-lg border-2 border-[var(--foreground)] p-6 text-center">
          <p className="text-sm text-neutral-600">아직 저장된 리포트가 없어요.</p>
          <Link
            href="/minds"
            className="mt-5 inline-block rounded-full border border-[var(--foreground)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] transition-transform active:scale-[0.99]"
          >
            마음 진단 시작하기
          </Link>
        </div>
      )}

      {paidReports.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">
            유료 · 다섯 배역과 그 관계 해설
          </h2>
          <ul className="mt-4 space-y-3">
            {paidReports.map((r) => (
              <li key={r.purchaseId}>
                <Link
                  href={`/minds/relationship/${r.purchaseId}`}
                  className="flex items-center justify-between rounded-lg border-2 border-[var(--foreground)] px-5 py-4 transition-transform active:scale-[0.99]"
                >
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    다섯 배역 + 관계 해설 리포트
                  </span>
                  <span className="text-xs text-neutral-400">{fmtDate(r.paidAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {freeReports.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">
            무료 · 내 마음 배역
          </h2>
          <ul className="mt-4 space-y-3">
            {freeReports.map((r) => (
              <li key={r.leadId}>
                <Link
                  href={`/minds/r/${r.leadId}`}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] px-5 py-4 transition-transform active:scale-[0.99]"
                >
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    내 마음 배역 결과
                  </span>
                  <span className="text-xs text-neutral-400">{fmtDate(r.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
