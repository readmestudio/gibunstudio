/**
 * 무료 상담 리포트 통합 페이지.
 *
 * 사용자가 받은 두 종류의 리포트를 한 곳에서 확인:
 *   1. 남편상 분석 리포트 (Phase 1 무료 / Phase 2 결제 완료된 경우)
 *   2. 데일리 체크인 리포트 (Mind Spill — 작성 무료, 일 단위 결제 완료된 것만 표시)
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Phase1Row = {
  id: string;
  matched_husband_type: string | null;
  created_at: string;
};

type Phase2Row = {
  id: string;
  published_at: string | null;
  updated_at: string;
};

type PeriodReportRow = {
  id: string;
  period_start: string;
  period_end: string;
  entry_ids: string[];
  generated_at: string | null;
};

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/reports");

  // 세 가지 리포트 데이터를 병렬로 조회.
  // Period 리포트는 결제 confirmed + 생성 완료된 것만 (서브쿼리로 결제 상태 join).
  const [phase1Res, phase2Res, periodRes] = await Promise.all([
    supabase
      .from("phase1_results")
      .select("id, matched_husband_type, created_at")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("phase2_results")
      .select("id, published_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("mind_spill_period_purchases")
      .select(
        "mind_spill_period_reports(id, period_start, period_end, entry_ids, generated_at)"
      )
      .eq("user_id", user.id)
      .eq("status", "confirmed"),
  ]);

  const phase1: Phase1Row | null = phase1Res.data;
  const phase2: Phase2Row | null = phase2Res.data;

  type PurchaseJoin = {
    mind_spill_period_reports: PeriodReportRow | PeriodReportRow[] | null;
  };
  const purchaseRows = (periodRes.data ?? []) as PurchaseJoin[];
  const reportedPeriods: PeriodReportRow[] = purchaseRows
    .flatMap((p) => {
      const rel = p.mind_spill_period_reports;
      return Array.isArray(rel) ? rel : rel ? [rel] : [];
    })
    .filter((r) => !!r.generated_at)
    .sort((a, b) => b.period_end.localeCompare(a.period_end));

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Link
        href="/dashboard"
        className="text-xs uppercase tracking-wider text-[var(--foreground)]/50 hover:text-[var(--foreground)]"
      >
        ← 대시보드
      </Link>

      <header className="mt-6 mb-12">
        <h1 className="text-3xl font-bold text-[var(--foreground)] md:text-4xl">
          무료 상담 리포트
        </h1>
        <p className="mt-3 text-[var(--foreground)]/60 leading-relaxed">
          마음 배역 진단, 남편상 분석, 데일리 체크인 리포트를 한 곳에서 확인할 수 있어요.
        </p>
      </header>

      {/* ── 섹션 0: 마음 배역 진단 (무료 · 가입 없이) ── */}
      <section className="mb-16">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            마음 배역 진단
          </h2>
          <Link
            href="/minds"
            className="text-xs text-[var(--foreground)]/60 underline hover:text-[var(--foreground)]"
          >
            진단 시작하기 →
          </Link>
        </div>
        <EmptyState
          title="내 안엔 몇 명이 살고 있을까?"
          description="최근 마음이 불편했던 한 순간으로, 내 안에서 동시에 목소리를 내는 마음 배역들을 만나봐요. 3분, 가입 없이 무료예요."
          ctaLabel="마음 진단 시작하기"
          ctaHref="/minds"
        />
      </section>

      {/* ── 섹션 1: 남편상 분석 ── */}
      <section className="mb-16">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            남편상 분석
          </h2>
          {!phase1 && (
            <Link
              href="/husband-match/birth-info"
              className="text-xs text-[var(--foreground)]/60 underline hover:text-[var(--foreground)]"
            >
              분석 시작하기 →
            </Link>
          )}
        </div>

        {phase1 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Phase 1 — 무료 */}
            <ReportCard
              href={`/husband-match/report/${phase1.id}`}
              eyebrow="PHASE 1 · 무료"
              title={phase1.matched_husband_type ?? "남편상 분석 리포트"}
              description="구독 데이터로 만든 9장의 셀프 분석 카드"
              meta={formatDate(phase1.created_at)}
            />

            {/* Phase 2 — 결제 + 검토 완료된 경우에만 노출 */}
            {phase2?.published_at ? (
              <ReportCard
                href={`/husband-match/deep-report/${phase2.id}`}
                eyebrow="PHASE 2 · 심층"
                title="이상형 남편 심층 리포트"
                description="설문 18문항 기반 CBT 심층 분석 10장"
                meta={formatDate(phase2.published_at)}
              />
            ) : phase2 ? (
              <PlaceholderCard
                eyebrow="PHASE 2 · 검토 중"
                title="심층 리포트가 준비 중이에요"
                description="전문가가 리포트를 검토하고 있어요. 공개되면 알림으로 알려드릴게요."
              />
            ) : (
              <PlaceholderCard
                eyebrow="PHASE 2 · 잠금"
                title="더 깊이 알아보고 싶다면"
                description="설문 18문항 기반의 CBT 심층 리포트로 이어갈 수 있어요."
                cta={{
                  label: "Phase 2 안내 보기",
                  href: `/husband-match/payment/${phase1.id}`,
                }}
              />
            )}
          </div>
        ) : (
          <EmptyState
            title="아직 남편상 분석을 받지 않으셨어요"
            description="YouTube 구독 채널 기반의 무료 셀프 분석으로 시작할 수 있어요."
            ctaLabel="분석 시작하기"
            ctaHref="/husband-match/birth-info"
          />
        )}
      </section>

      {/* ── 섹션 2: 데일리 체크인 (Mind Spill) ── */}
      <section>
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            데일리 체크인 리포트
          </h2>
          <Link
            href="/dashboard/mind-spill"
            className="text-xs text-[var(--foreground)]/60 underline hover:text-[var(--foreground)]"
          >
            {reportedPeriods.length > 0 ? "캘린더에서 더 보기 →" : "셀프 체크인 시작하기 →"}
          </Link>
        </div>

        {reportedPeriods.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reportedPeriods.map((p) => (
              <ReportCard
                key={p.id}
                href={`/dashboard/mind-spill/period/${p.id}`}
                eyebrow={`${p.entry_ids.length}일치 종합`}
                title={`${formatDailyEyebrow(p.period_start)} ~ ${formatDailyEyebrow(p.period_end)}`}
                description="반복 패턴·강점 3가지·코치 편지·처방"
                meta={formatDate(p.generated_at ?? p.period_end)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="아직 받은 종합 리포트가 없어요"
            description="캘린더에서 매일 한 칸씩 체크인하고, 3일치가 모이면 종합 리포트를 결제할 수 있어요. 작성과 매일 감정 분석은 계속 무료예요."
            ctaLabel="캘린더 열기"
            ctaHref="/dashboard/mind-spill"
          />
        )}
      </section>
    </div>
  );
}

/* ─── 카드 컴포넌트 ─── */

function ReportCard({
  href,
  eyebrow,
  title,
  description,
  meta,
}: {
  href: string;
  eyebrow: string;
  title: string;
  description: string;
  meta?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-xl border-2 border-[var(--foreground)] bg-white p-6 transition-shadow hover:shadow-[4px_4px_0_var(--foreground)]"
    >
      <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--foreground)]/50">
        {eyebrow}
      </div>
      <h3 className="mt-2 text-base font-semibold text-[var(--foreground)] line-clamp-2">
        {title}
      </h3>
      <p className="mt-2 text-sm text-[var(--foreground)]/60 leading-relaxed line-clamp-2 flex-grow">
        {description}
      </p>
      <div className="mt-4 flex items-center justify-between text-xs text-[var(--foreground)]/50">
        <span>{meta ?? ""}</span>
        <span className="font-semibold text-[var(--foreground)] group-hover:translate-x-0.5 transition-transform">
          보기 →
        </span>
      </div>
    </Link>
  );
}

function PlaceholderCard({
  eyebrow,
  title,
  description,
  cta,
}: {
  eyebrow: string;
  title: string;
  description: string;
  cta?: { label: string; href: string };
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border-2 border-dashed border-[var(--foreground)]/30 bg-white p-6">
      <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--foreground)]/40">
        {eyebrow}
      </div>
      <h3 className="mt-2 text-base font-semibold text-[var(--foreground)]/70">
        {title}
      </h3>
      <p className="mt-2 text-sm text-[var(--foreground)]/50 leading-relaxed flex-grow">
        {description}
      </p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-4 inline-flex w-fit items-center rounded-lg border border-[var(--foreground)]/30 px-3 py-1.5 text-xs font-medium text-[var(--foreground)]/70 hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}

function EmptyState({
  title,
  description,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <div className="rounded-xl border-2 border-dashed border-[var(--foreground)]/20 bg-white p-8 text-center">
      <h3 className="text-base font-semibold text-[var(--foreground)]">
        {title}
      </h3>
      <p className="mt-2 text-sm text-[var(--foreground)]/60 leading-relaxed">
        {description}
      </p>
      <Link
        href={ctaHref}
        className="mt-5 inline-flex items-center rounded-lg border-2 border-[var(--foreground)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)]"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

/** entry_date(YYYY-MM-DD) → "JUN 04 · THU" 같은 라벨 (카드 eyebrow용). */
function formatDailyEyebrow(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${m}.${day} · ${DOW[d.getDay()]}요일`;
}
