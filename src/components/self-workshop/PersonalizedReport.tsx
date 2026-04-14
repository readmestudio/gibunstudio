"use client";

import { useEffect, useState } from "react";
import type { DiagnosisScores } from "@/lib/self-workshop/diagnosis";
import { buildFallbackReport } from "@/lib/self-workshop/report-fallback";

interface Props {
  workshopId: string;
  scores: DiagnosisScores;
  userName: string | null;
  cachedReport: string | null;
}

export function PersonalizedReport({
  workshopId,
  scores,
  userName,
  cachedReport,
}: Props) {
  const [report, setReport] = useState<string | null>(cachedReport);
  const [loading, setLoading] = useState(!cachedReport);

  useEffect(() => {
    console.log(
      "[PersonalizedReport] mount — cachedReport:",
      cachedReport ? `"${cachedReport.slice(0, 40)}..." (len=${cachedReport.length})` : "NULL"
    );
    if (cachedReport) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/self-workshop/personalize-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workshopId }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { report: string };
        if (cancelled) return;
        setReport(json.report);
      } catch (err) {
        console.error("[PersonalizedReport] 생성 실패, 로컬 폴백:", err);
        if (cancelled) return;
        setReport(buildFallbackReport(scores, userName));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [cachedReport, workshopId, scores, userName]);

  const addressee = userName ? `${userName}님의` : "당신의";

  return (
    <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
      <p className="mb-4 text-xs font-medium uppercase tracking-wider text-[var(--foreground)]/50">
        {addressee} 진단 리포트
      </p>

      {loading ? (
        <ReportSkeleton />
      ) : (
        <div className="space-y-3 whitespace-pre-wrap text-[15px] leading-relaxed text-[var(--foreground)]/85">
          {report}
        </div>
      )}
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-3" aria-label="리포트 생성 중">
      <div className="h-4 w-11/12 animate-pulse rounded bg-[var(--foreground)]/10" />
      <div className="h-4 w-10/12 animate-pulse rounded bg-[var(--foreground)]/10" />
      <div className="h-4 w-9/12 animate-pulse rounded bg-[var(--foreground)]/10" />
      <div className="mt-4 h-4 w-11/12 animate-pulse rounded bg-[var(--foreground)]/10" />
      <div className="h-4 w-10/12 animate-pulse rounded bg-[var(--foreground)]/10" />
      <div className="h-4 w-8/12 animate-pulse rounded bg-[var(--foreground)]/10" />
      <p className="pt-2 text-xs text-[var(--foreground)]/40">
        진단 결과를 해석하고 있어요… (약 3~6초)
      </p>
    </div>
  );
}
