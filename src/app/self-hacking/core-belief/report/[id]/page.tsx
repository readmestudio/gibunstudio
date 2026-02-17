import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

/* ── 리포트 JSON 타입 ── */
interface BeliefSection {
  title: string;
  core_belief: string;
  analysis: string;
  pattern: string;
  reframe: string;
}

interface SummarySection {
  title: string;
  overview: string;
  strengths: string;
  growth_direction: string;
}

interface CoreBeliefReport {
  selfBelief: BeliefSection;
  othersBelief: BeliefSection;
  worldBelief: BeliefSection;
  summary: SummarySection;
}

/* ── 신념 섹션 카드 컴포넌트 ── */
function BeliefCard({ section }: { section: BeliefSection }) {
  return (
    <div className="rounded-2xl border-2 border-[var(--foreground)] bg-white p-6 mb-6">
      <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
        {section.title}
      </h2>

      {/* 핵심 신념 요약 */}
      <div className="rounded-xl bg-[var(--foreground)]/5 p-4 mb-5">
        <p className="text-sm font-medium text-[var(--foreground)]/60 mb-1">
          핵심 신념
        </p>
        <p className="text-base font-semibold text-[var(--foreground)] leading-relaxed">
          {section.core_belief}
        </p>
      </div>

      {/* 분석 */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
          분석
        </h3>
        <p className="text-sm text-[var(--foreground)]/70 leading-relaxed whitespace-pre-line">
          {section.analysis}
        </p>
      </div>

      {/* 패턴 */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
          반복되는 패턴
        </h3>
        <p className="text-sm text-[var(--foreground)]/70 leading-relaxed whitespace-pre-line">
          {section.pattern}
        </p>
      </div>

      {/* 리프레이밍 */}
      <div className="rounded-xl border border-[var(--foreground)]/10 bg-[var(--surface)] p-4">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
          새로운 관점
        </h3>
        <p className="text-sm text-[var(--foreground)]/70 leading-relaxed whitespace-pre-line">
          {section.reframe}
        </p>
      </div>
    </div>
  );
}

/* ── 메인 페이지 ── */
export default async function CoreBeliefReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/self-hacking/core-belief/report/" + id);
  }

  const { data: reportRow, error } = await supabase
    .from("core_belief_reports")
    .select("id, report, payment_status, created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !reportRow) {
    notFound();
  }

  const report = reportRow.report as CoreBeliefReport;
  const createdAt = new Date(reportRow.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-white px-4 py-12">
      <div className="mx-auto max-w-2xl">
        {/* 헤더 */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
            핵심 신념 분석 리포트
          </h1>
          <p className="text-sm text-[var(--foreground)]/50">{createdAt}</p>
        </div>

        {/* 3개 신념 섹션 */}
        <BeliefCard section={report.selfBelief} />
        <BeliefCard section={report.othersBelief} />
        <BeliefCard section={report.worldBelief} />

        {/* 종합 분석 */}
        <div className="rounded-2xl border-2 border-[var(--foreground)] bg-white p-6 mb-6">
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
            {report.summary.title}
          </h2>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
              전체 패턴
            </h3>
            <p className="text-sm text-[var(--foreground)]/70 leading-relaxed whitespace-pre-line">
              {report.summary.overview}
            </p>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
              내면의 강점
            </h3>
            <p className="text-sm text-[var(--foreground)]/70 leading-relaxed whitespace-pre-line">
              {report.summary.strengths}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--foreground)]/10 bg-[var(--surface)] p-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
              성장 방향
            </h3>
            <p className="text-sm text-[var(--foreground)]/70 leading-relaxed whitespace-pre-line">
              {report.summary.growth_direction}
            </p>
          </div>
        </div>

        {/* 하단 CTA */}
        <div className="mt-10 text-center space-y-3">
          <Link
            href="/self-hacking"
            className="inline-flex items-center rounded-lg border-2 border-[var(--foreground)] px-6 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
          >
            다른 검사 둘러보기
          </Link>
          <div>
            <Link
              href="/dashboard"
              className="text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:underline"
            >
              대시보드로 이동
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
