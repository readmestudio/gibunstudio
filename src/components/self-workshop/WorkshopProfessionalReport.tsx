"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  isProfessionalReport,
  type ProfessionalReport,
} from "@/lib/self-workshop/professional-report";

interface Props {
  workshopId: string;
  savedReport?: unknown;
}

export function WorkshopProfessionalReport({
  workshopId,
  savedReport,
}: Props) {
  const router = useRouter();
  const initial = isProfessionalReport(savedReport) ? savedReport : null;
  const [report, setReport] = useState<ProfessionalReport | null>(initial);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initial) return;
    let cancelled = false;
    async function fetchReport() {
      try {
        const res = await fetch("/api/self-workshop/generate-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workshopId }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? "리포트를 불러오지 못했어요");
        }
        const data = await res.json();
        const next = isProfessionalReport(data?.report)
          ? (data.report as ProfessionalReport)
          : null;
        if (!cancelled) {
          if (next) setReport(next);
          else setError("리포트 형식이 올바르지 않아요. 잠시 후 다시 시도해 주세요.");
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "오류가 발생했어요"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchReport();
    return () => {
      cancelled = true;
    };
  }, [workshopId, initial]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[var(--foreground)] border-t-transparent" />
          <p className="text-base font-medium text-[var(--foreground)]">
            상담사가 리포트를 작성하고 있어요...
          </p>
          <p className="mt-2 text-sm text-[var(--foreground)]/50">
            잠시만 기다려 주세요
          </p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="mx-auto max-w-lg text-center py-20">
        <p className="text-sm text-red-600">
          {error || "리포트를 불러올 수 없어요."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg border-2 border-[var(--foreground)] px-6 py-2 text-sm font-medium hover:bg-[var(--surface)] transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-20">
      {/* 표지 */}
      <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--foreground)]/50">
          전문 상담사 리포트
        </p>
        <h2 className="mt-3 text-xl font-bold leading-snug text-[var(--foreground)]">
          성취 중독을 위한 마음 챙김 워크북
          <br />
          통합 정리
        </h2>
        <p className="mt-3 text-xs text-[var(--foreground)]/50">
          {formatDate(report.generated_at)}
        </p>
      </div>

      {/* 인트로: 인사 + 진단 요약 */}
      <Section label="도입" headline="여정의 시작">
        <Paragraph>{report.intro.greeting}</Paragraph>
        <div className="mt-5 rounded-lg border-2 border-[var(--foreground)]/15 bg-[var(--surface)] p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground)]/50">
            진단 요약
          </p>
          <Paragraph className="mt-2 text-sm">
            {report.intro.diagnosis_summary}
          </Paragraph>
        </div>
      </Section>

      {/* 분석 */}
      <Section label="분석" headline={report.analysis.headline}>
        <Paragraph>{report.analysis.body}</Paragraph>
        {report.analysis.cognitive_error_quotes.length > 0 && (
          <div className="mt-5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground)]/50">
              자주 떠올랐던 생각들
            </p>
            {report.analysis.cognitive_error_quotes.map((q, i) => (
              <p
                key={i}
                className="rounded-lg border-2 border-[var(--foreground)]/15 bg-white px-4 py-2 text-sm italic text-[var(--foreground)]/70"
              >
                “{q}”
              </p>
            ))}
          </div>
        )}
      </Section>

      {/* 변화 여정 */}
      <Section
        label="변화 여정"
        headline={report.transformation.headline}
      >
        <Paragraph>{report.transformation.body}</Paragraph>
      </Section>

      {/* DO & DONT */}
      <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--foreground)]/50">
          {`당신만을 위한 DO & DON'T`}
        </p>
        <h3 className="mt-2 mb-5 text-lg font-bold leading-snug text-[var(--foreground)]">
          새 신념을 일상에서 지키는 법
        </h3>

        <div className="space-y-5">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--foreground)] px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white">
              ✅ DO
            </p>
            <ul className="space-y-3">
              {report.do_donts.dos.map((item, i) => (
                <li
                  key={i}
                  className="rounded-lg border-2 border-[var(--foreground)]/15 bg-white p-4"
                >
                  <p className="text-sm font-bold text-[var(--foreground)]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--foreground)]/70">
                    {item.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border-2 border-[var(--foreground)] px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[var(--foreground)]">
              ⚠ DON&apos;T
            </p>
            <ul className="space-y-3">
              {report.do_donts.donts.map((item, i) => (
                <li
                  key={i}
                  className="rounded-lg border-2 border-[var(--foreground)]/15 bg-[var(--surface)] p-4"
                >
                  <p className="text-sm font-bold text-[var(--foreground)]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--foreground)]/70">
                    {item.description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 다음 */}
      <div className="text-center pt-4">
        <button
          onClick={() => router.push("/dashboard/self-workshop/step/11")}
          className="inline-flex rounded-xl border-2 border-[var(--foreground)] bg-[var(--foreground)] px-8 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90"
        >
          마무리 성찰 →
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────── 보조 ─────────────────────────── */

function Section({
  label,
  headline,
  children,
}: {
  label: string;
  headline: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--foreground)]/50">
        {label}
      </p>
      <h3 className="mt-2 mb-4 text-lg font-bold leading-snug text-[var(--foreground)]">
        {headline}
      </h3>
      {children}
    </div>
  );
}

function Paragraph({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <p
      className={`whitespace-pre-line text-sm leading-relaxed text-[var(--foreground)]/80 ${className ?? ""}`}
    >
      {children}
    </p>
  );
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return "";
  }
}
