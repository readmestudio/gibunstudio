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
import { claimMindsLeadsByEmail } from "@/lib/minds/claim";

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

  // 조회 전 자동 귀속 — 직접 방문/북마크로 와도 같은 이메일 익명 리드를 계정에 붙인다.
  await claimMindsLeadsByEmail(user.id, user.email);

  const admin = createAdminClient();

  const { data: leads } = await admin
    .from("minds_leads")
    .select("id, created_at, parts_map, channel")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const freeReports = (leads ?? [])
    .filter((l) => !!l.parts_map)
    .map((l) => {
      // /minds 와 /inner-child 가 같은 테이블을 공유한다 — channel 로 퍼널을 가른다.
      // 내면 아이 리드는 전용 무료 리포트 경로(/inner-child/r)로 보낸다.
      const isInnerChild = (l.channel as string | null) === "inner_child";
      return {
        leadId: l.id as string,
        createdAt: l.created_at as string,
        title: isInnerChild ? "내면 아이 결과" : "내 마음 배역 결과",
        href: isInnerChild
          ? `/inner-child/r/${l.id as string}`
          : `/minds/r/${l.id as string}`,
      };
    });

  const { data: purchases } = await admin
    .from("minds_relationship_purchases")
    .select("id, created_at, paid_at, report_json, order_id")
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false });

  const paidReports = (purchases ?? []).map((p) => {
    // 같은 결제 테이블을 두 퍼널이 공유한다 — order_id prefix 로 상품을 가른다.
    // IC- 는 내면 아이(리포트 /inner-child/full), 그 외(MR-)는 다섯 배역(/minds/relationship).
    const isInnerChild = ((p.order_id as string | null) ?? "").startsWith("IC-");
    return {
      purchaseId: p.id as string,
      paidAt: (p.paid_at ?? p.created_at) as string,
      // 결제 승인(confirmed)과 리포트 생성(~50초 LLM)이 분리돼 있어, 결제 직후
      // 이탈하면 report_json 이 아직 비어 있다 → "제작 중"으로 안내.
      ready: !!p.report_json,
      title: isInnerChild ? "내면 아이 심층 리포트" : "다섯 배역 + 관계 해설 리포트",
      href: isInnerChild
        ? `/inner-child/full/${p.id as string}`
        : `/minds/relationship/${p.id as string}`,
    };
  });

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
            유료 리포트
          </h2>
          <ul className="mt-4 space-y-3">
            {paidReports.map((r) => (
              <li key={r.purchaseId}>
                <Link
                  href={r.href}
                  className="flex items-center justify-between rounded-lg border-2 border-[var(--foreground)] px-5 py-4 transition-transform active:scale-[0.99]"
                >
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    {r.title}
                  </span>
                  {r.ready ? (
                    <span className="text-xs text-neutral-400">{fmtDate(r.paidAt)}</span>
                  ) : (
                    // 제작 중 — 결제는 됐지만 아직 리포트 생성 전. 눌러서 이어보기 가능.
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--foreground)]">
                      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--foreground)]" />
                      제작 중
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          {paidReports.some((r) => !r.ready) && (
            <p className="mt-3 text-xs leading-relaxed text-neutral-500">
              결제가 확인됐어요. 리포트를 만드는 데 20~50초쯤 걸려요. 제작이 끝나면 이
              대시보드에서 언제든 다시 확인할 수 있어요.
            </p>
          )}
        </section>
      )}

      {freeReports.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-400">
            무료 리포트
          </h2>
          <ul className="mt-4 space-y-3">
            {freeReports.map((r) => (
              <li key={r.leadId}>
                <Link
                  href={r.href}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] px-5 py-4 transition-transform active:scale-[0.99]"
                >
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {r.title}
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
