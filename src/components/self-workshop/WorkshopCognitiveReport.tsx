"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CognitiveCycleDiagram } from "./CognitiveCycleDiagram";
import { CognitiveErrorsSection } from "./CognitiveErrorsSection";
import {
  isAnalysisReport,
  type AnalysisReport,
  type PatternStage,
} from "@/lib/self-workshop/analysis-report";
import { composeAutomaticThought } from "@/lib/self-workshop/compose-automatic-thought";

interface Props {
  workshopId: string;
  savedReport: unknown;
  mechanismAnalysis?: unknown;
  userName?: string | null;
}

function extractThoughtParts(raw: unknown): {
  primary: string;
  worstCase: string;
} {
  if (!raw || typeof raw !== "object") return { primary: "", worstCase: "" };
  const m = raw as {
    automatic_thought?: unknown;
    worst_case_result?: unknown;
  };
  return {
    primary: typeof m.automatic_thought === "string" ? m.automatic_thought : "",
    worstCase:
      typeof m.worst_case_result === "string" ? m.worst_case_result : "",
  };
}

const STAGE_LABEL: Record<PatternStage, string> = {
  trigger: "상황",
  thought: "자동 사고",
  emotion: "감정",
  body: "신체 반응",
  behavior: "행동",
  core_belief: "핵심 신념",
};

export function WorkshopCognitiveReport({
  workshopId,
  savedReport,
  mechanismAnalysis,
  userName,
}: Props) {
  const router = useRouter();
  const initialReport = isAnalysisReport(savedReport) ? savedReport : null;
  const [report, setReport] = useState<AnalysisReport | null>(initialReport);
  const [loading, setLoading] = useState(!initialReport);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialReport) return;
    let cancelled = false;

    async function run() {
      try {
        const res = await fetch("/api/self-workshop/analyze-mechanism", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workshopId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "분석에 실패했습니다");
        if (!cancelled) setReport(data.report as AnalysisReport);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : "오류가 발생했습니다");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [workshopId, initialReport]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[var(--foreground)] border-t-transparent" />
          <p className="text-base font-medium text-[var(--foreground)]">
            리포트를 작성하고 있어요…
          </p>
          <p className="mt-2 text-sm text-[var(--foreground)]/50">
            최대 30초까지 걸릴 수 있어요
          </p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <p className="text-sm text-red-600">{error || "리포트를 불러오지 못했어요"}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg border-2 border-[var(--foreground)] px-6 py-2 text-sm font-medium"
        >
          다시 시도
        </button>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const { primary, worstCase } = extractThoughtParts(mechanismAnalysis);
  const composedThought = composeAutomaticThought(primary, worstCase);

  return (
    <div className="mx-auto max-w-2xl space-y-10 pb-24">
      <ReportHeader userName={userName} today={today} />

      {composedThought.length > 0 && (
        <AutomaticThoughtHeadline
          thought={composedThought}
          hasBothParts={primary.trim().length > 0 && worstCase.trim().length > 0}
        />
      )}

      <CognitiveErrorsSection errors={report.cognitive_errors} />

      <CyclePatternSection
        headline={report.pattern_cycle.headline}
        overview={report.pattern_cycle.overview}
        nodes={report.pattern_cycle.nodes}
      />

      <div className="text-center pt-4">
        <button
          onClick={() => router.push("/dashboard/self-workshop/step/6")}
          className="inline-flex rounded-xl border-2 border-[var(--foreground)] bg-[var(--foreground)] px-8 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90"
        >
          핵심 믿음 반박하기 →
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────── 헤더 ─────────────────────────────── */

function ReportHeader({
  userName,
  today,
}: {
  userName?: string | null;
  today: string;
}) {
  return (
    <header className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--foreground)]/50">
            Cognitive Pattern Analysis
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--foreground)]">
            인지 패턴 분석 리포트
          </h1>
          {userName && (
            <p className="mt-2 text-sm text-[var(--foreground)]/70">
              대상자: <span className="font-semibold text-[var(--foreground)]">{userName}</span> 님
            </p>
          )}
        </div>
        <div className="text-right text-xs text-[var(--foreground)]/60">
          <p>발행일: {today}</p>
          <p className="mt-1">분석자: AI Clinical Reviewer</p>
        </div>
      </div>
    </header>
  );
}

/* ─────────────────────────── 자동사고 헤드라인 ─────────────────────────── */

function AutomaticThoughtHeadline({
  thought,
  hasBothParts,
}: {
  thought: string;
  hasBothParts: boolean;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--foreground)]/40">
          Automatic Thought
        </span>
        <span className="h-px flex-1 bg-[var(--foreground)]/15" />
        <span className="text-sm font-bold text-[var(--foreground)]">
          당신이 찾은 자동사고
        </span>
      </div>

      <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--foreground)]/45">
          {hasBothParts
            ? "상황에 대한 생각 + 생각으로 인한 결과"
            : "상황에 대한 생각"}
        </p>
        <p className="mt-3 text-lg leading-relaxed font-semibold text-[var(--foreground)]">
          “{thought}”
        </p>
        <p className="mt-4 text-xs text-[var(--foreground)]/55">
          이 문장이 어떤 감정과 행동을 만들어내는지, 아래 리포트에서 함께
          살펴볼게요.
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────── 섹션 02 ─────────────────────────────── */

function CyclePatternSection({
  headline,
  overview,
  nodes,
}: {
  headline: string;
  overview: string;
  nodes: AnalysisReport["pattern_cycle"]["nodes"];
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--foreground)]/40">
          Section 02
        </span>
        <span className="h-px flex-1 bg-[var(--foreground)]/15" />
        <span className="text-sm font-bold text-[var(--foreground)]">
          당신에게 반복되고 있는 흐름은 이렇습니다
        </span>
      </div>

      <div className="space-y-6">
        {/* ── Step 1: 패턴 발견 + 반복 일러스트 ── */}
        <div className="rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-6">
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]/45">
              Step 1
            </p>
            <h3 className="mt-1 text-base font-semibold text-[var(--foreground)]">
              실습 내용을 바탕으로 당신의 성취 중독 패턴을 발견했어요
            </h3>
          </div>

          <p className="text-lg font-bold leading-snug text-[var(--foreground)]">
            {headline}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)]/75">
            {overview}
          </p>

          <div className="mt-6 border-t border-[var(--foreground)]/10 pt-6">
            <CognitiveCycleDiagram
              nodes={nodes.map((n) => ({ stage: n.stage, label: n.label }))}
              centerLabel="성취 중독"
            />
            <p className="mt-4 text-center text-xs text-[var(--foreground)]/50">
              한 바퀴가 다시 첫 단계로 이어지며 점점 강화돼요
            </p>
          </div>
        </div>

        {/* ── Step 2: 각 단계 상세 해석 ── */}
        <div className="rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-6">
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]/45">
              Step 2
            </p>
            <h3 className="mt-1 text-base font-semibold text-[var(--foreground)]">
              각 단계를 조금 더 자세히 들여다보면
            </h3>
          </div>

          <ol className="space-y-0">
            {nodes.map((node, i) => (
              <Fragment key={i}>
                <li className="flex gap-4 rounded-lg border border-[var(--foreground)]/10 bg-[var(--surface)]/40 p-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[var(--foreground)] text-xs font-bold">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground)]/45">
                        {STAGE_LABEL[node.stage]}
                      </span>
                      <span className="text-sm font-semibold text-[var(--foreground)]">
                        {node.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--foreground)]/75">
                      {node.description}
                    </p>
                  </div>
                </li>
                {i < nodes.length - 1 && (
                  <div
                    aria-hidden
                    className="flex justify-center py-2 text-[var(--foreground)]/30"
                  >
                    <svg
                      width="16"
                      height="20"
                      viewBox="0 0 16 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M8 2v14" />
                      <path d="M3 12l5 5 5-5" />
                    </svg>
                  </div>
                )}
              </Fragment>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
