import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

/* ── 리포트 JSON 타입 ── */
interface AttachmentStyleSection {
  type: string;
  typeName: string;
  summary: string;
}

interface DimensionAnalysis {
  title: string;
  score: number;
  interpretation: string;
  behavioral_patterns: string;
  origin: string;
}

interface RelationshipPatterns {
  title: string;
  attraction: string;
  conflict: string;
  needs: string;
}

interface GrowthGuide {
  title: string;
  awareness: string;
  practices: string;
  ideal_partner: string;
}

interface ProfessionalNote {
  title: string;
  message: string;
}

interface AttachmentReport {
  attachmentStyle: AttachmentStyleSection;
  anxietyAnalysis: DimensionAnalysis;
  avoidanceAnalysis: DimensionAnalysis;
  relationshipPatterns: RelationshipPatterns;
  growthGuide: GrowthGuide;
  professionalNote: ProfessionalNote;
}

/* ── 점수 바 컴포넌트 ── */
function ScoreBar({ label, score }: { label: string; score: number }) {
  const percent = ((score - 1) / 4) * 100;

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-medium text-[var(--foreground)]">{label}</span>
        <span className="text-[var(--foreground)]/60">
          {score.toFixed(1)} / 5.0
        </span>
      </div>
      <div className="h-2.5 bg-[var(--foreground)]/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--foreground)] rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/* ── 차원 분석 카드 컴포넌트 ── */
function DimensionCard({ analysis }: { analysis: DimensionAnalysis }) {
  return (
    <div className="rounded-2xl border-2 border-[var(--foreground)] bg-white p-6 mb-6">
      <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
        {analysis.title}
      </h2>

      <div className="mb-5">
        <ScoreBar
          label={analysis.title.includes("불안") ? "관계 불안" : "친밀감 회피"}
          score={analysis.score}
        />
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
          해석
        </h3>
        <p className="text-sm text-[var(--foreground)]/70 leading-relaxed whitespace-pre-line">
          {analysis.interpretation}
        </p>
      </div>

      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
          행동 패턴
        </h3>
        <p className="text-sm text-[var(--foreground)]/70 leading-relaxed whitespace-pre-line">
          {analysis.behavioral_patterns}
        </p>
      </div>

      <div className="rounded-xl border border-[var(--foreground)]/10 bg-[var(--surface)] p-4">
        <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
          형성 배경
        </h3>
        <p className="text-sm text-[var(--foreground)]/70 leading-relaxed whitespace-pre-line">
          {analysis.origin}
        </p>
      </div>
    </div>
  );
}

/* ── 메인 페이지 ── */
export default async function AttachmentReportPage({
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
    redirect("/login?redirect=/self-hacking/attachment/report/" + id);
  }

  const { data: reportRow, error } = await supabase
    .from("attachment_reports")
    .select("id, report, payment_status, created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !reportRow) {
    notFound();
  }

  const report = reportRow.report as AttachmentReport;
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
            연애 애착 분석 리포트
          </h1>
          <p className="text-sm text-[var(--foreground)]/50">{createdAt}</p>
        </div>

        {/* 1. 애착 유형 요약 */}
        <div className="rounded-2xl border-2 border-[var(--foreground)] bg-white p-6 mb-6">
          <div className="rounded-xl bg-[var(--foreground)]/5 p-4 mb-5 text-center">
            <p className="text-sm font-medium text-[var(--foreground)]/60 mb-1">
              나의 애착 유형
            </p>
            <p className="text-xl font-bold text-[var(--foreground)]">
              {report.attachmentStyle.typeName}
            </p>
          </div>
          <p className="text-sm text-[var(--foreground)]/70 leading-relaxed whitespace-pre-line">
            {report.attachmentStyle.summary}
          </p>
        </div>

        {/* 2. 관계 불안 분석 */}
        <DimensionCard analysis={report.anxietyAnalysis} />

        {/* 3. 친밀감 회피 분석 */}
        <DimensionCard analysis={report.avoidanceAnalysis} />

        {/* 4. 연애 관계 패턴 */}
        <div className="rounded-2xl border-2 border-[var(--foreground)] bg-white p-6 mb-6">
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
            {report.relationshipPatterns.title}
          </h2>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
              끌림의 패턴
            </h3>
            <p className="text-sm text-[var(--foreground)]/70 leading-relaxed whitespace-pre-line">
              {report.relationshipPatterns.attraction}
            </p>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
              갈등 반응 패턴
            </h3>
            <p className="text-sm text-[var(--foreground)]/70 leading-relaxed whitespace-pre-line">
              {report.relationshipPatterns.conflict}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--foreground)]/10 bg-[var(--surface)] p-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
              충족되지 못한 핵심 욕구
            </h3>
            <p className="text-sm text-[var(--foreground)]/70 leading-relaxed whitespace-pre-line">
              {report.relationshipPatterns.needs}
            </p>
          </div>
        </div>

        {/* 5. 성장 가이드 */}
        <div className="rounded-2xl border-2 border-[var(--foreground)] bg-white p-6 mb-6">
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
            {report.growthGuide.title}
          </h2>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
              자기 인식
            </h3>
            <p className="text-sm text-[var(--foreground)]/70 leading-relaxed whitespace-pre-line">
              {report.growthGuide.awareness}
            </p>
          </div>

          <div className="mb-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
              실천 방법
            </h3>
            <p className="text-sm text-[var(--foreground)]/70 leading-relaxed whitespace-pre-line">
              {report.growthGuide.practices}
            </p>
          </div>

          <div className="rounded-xl border border-[var(--foreground)]/10 bg-[var(--surface)] p-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">
              나에게 맞는 파트너
            </h3>
            <p className="text-sm text-[var(--foreground)]/70 leading-relaxed whitespace-pre-line">
              {report.growthGuide.ideal_partner}
            </p>
          </div>
        </div>

        {/* 6. 상담사의 한마디 */}
        <div className="rounded-2xl border-2 border-[var(--foreground)] bg-white p-6 mb-6">
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
            {report.professionalNote.title}
          </h2>
          <p className="text-base text-[var(--foreground)]/80 leading-relaxed whitespace-pre-line italic">
            {report.professionalNote.message}
          </p>
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
