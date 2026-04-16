"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DIMENSIONS,
  DIAGNOSIS_LEVELS,
  COGNITIVE_ERRORS,
  type DiagnosisScores,
  type DimensionKey,
} from "@/lib/self-workshop/diagnosis";
import { getSignalLevel } from "@/lib/self-workshop/signal";
import { CognitiveCycleDiagram } from "./CognitiveCycleDiagram";
import {
  isAnalysisReport,
  type AnalysisReport,
  type PatternStage,
} from "@/lib/self-workshop/analysis-report";

interface Props {
  workshopId: string;
  savedReport: unknown;
  diagnosisScores?: DiagnosisScores;
  userName?: string | null;
}

const STAGE_LABEL: Record<PatternStage, string> = {
  trigger: "상황",
  thought: "자동 사고",
  emotion: "감정",
  body: "신체 반응",
  behavior: "행동",
};

const STAGE_ORDER: PatternStage[] = [
  "trigger",
  "thought",
  "emotion",
  "body",
  "behavior",
];

const MATCH_CHIP: Record<string, string> = {
  "잘 맞아요": "bg-[var(--foreground)] text-white",
  "조금 맞아요": "bg-[var(--foreground)]/15 text-[var(--foreground)]",
  "다르게 나타나요":
    "border border-[var(--foreground)]/40 text-[var(--foreground)]/60",
};

export function WorkshopCognitiveReport({
  workshopId,
  savedReport,
  diagnosisScores,
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

  const levelMeta = diagnosisScores
    ? DIAGNOSIS_LEVELS.find((l) => l.level === diagnosisScores.level)
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-10 pb-24">
      <ReportHeader userName={userName} today={today} />

      {diagnosisScores && (
        <DiagnosisSnapshot scores={diagnosisScores} levelName={levelMeta?.name ?? ""} />
      )}

      <CyclePatternSection
        headline={report.pattern_cycle.headline}
        overview={report.pattern_cycle.overview}
        userSummary={report.pattern_cycle.user_summary}
        nodes={report.pattern_cycle.nodes}
      />

      <CrossValidationSection
        summary={report.cross_validation.summary}
        rows={report.cross_validation.rows}
      />

      <HiddenPatternsSection
        summary={report.hidden_patterns.summary}
        errors={report.hidden_patterns.errors}
      />

      <KeyQuestionSection data={report.key_question} />

      <div className="text-center pt-4">
        <button
          onClick={() => router.push("/dashboard/self-workshop/step/5")}
          className="inline-flex rounded-xl border-2 border-[var(--foreground)] bg-[var(--foreground)] px-8 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90"
        >
          대처법 알아보기 →
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

/* ─────────────────────────────── 섹션 01 ─────────────────────────────── */

function DiagnosisSnapshot({
  scores,
  levelName,
}: {
  scores: DiagnosisScores;
  levelName: string;
}) {
  return (
    <section>
      <SectionTitle num="01" title="당신의 진단 점수를 먼저 볼게요" />
      <div className="rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-6">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-[var(--foreground)]/50">
              총점
            </p>
            <p className="text-4xl font-bold text-[var(--foreground)]">
              {scores.total}
              <span className="text-base font-normal text-[var(--foreground)]/40">
                {" "}/100
              </span>
            </p>
          </div>
          <span className="rounded-full border-2 border-[var(--foreground)] px-3 py-1 text-xs font-semibold">
            Level {scores.level} · {levelName}
          </span>
        </div>

        <div className="mt-6 space-y-4">
          {DIMENSIONS.map((dim) => {
            const score = scores.dimensions[dim.key as DimensionKey];
            const percent = (score / 25) * 100;
            const signal = getSignalLevel(score);
            return (
              <div key={dim.key}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {dim.label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${signal.className}`}
                    >
                      <span>{signal.emoji}</span>
                      {signal.label}
                    </span>
                    <span className="text-sm font-bold tabular-nums text-[var(--foreground)]">
                      {score}/25
                    </span>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--foreground)]/10">
                  <div
                    className="h-full rounded-full bg-[var(--foreground)] transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── 섹션 02 ─────────────────────────────── */

function CyclePatternSection({
  headline,
  overview,
  userSummary,
  nodes,
}: {
  headline: string;
  overview: string;
  userSummary: AnalysisReport["pattern_cycle"]["user_summary"];
  nodes: AnalysisReport["pattern_cycle"]["nodes"];
}) {
  return (
    <section>
      <SectionTitle num="02" title="당신에게 반복되고 있는 흐름은 이렇습니다" />

      <div className="space-y-6">
        {/* ── Block A: 유저 실습 원본 요약 ── */}
        <div className="rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-6">
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]/45">
              Step 1
            </p>
            <h3 className="mt-1 text-base font-semibold text-[var(--foreground)]">
              당신이 Step 3에서 남긴 말, 5단계로 정리했어요
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[var(--foreground)]/55">
              성취 중독의 순환 메커니즘(상황 → 자동사고 → 감정 → 신체반응 → 행동)에
              당신이 쓴 말을 그대로 대입해 볼게요.
            </p>
          </div>

          <div className="space-y-0">
            {STAGE_ORDER.map((stage, i) => {
              const isLast = i === STAGE_ORDER.length - 1;
              return (
                <div key={stage} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-[var(--foreground)] text-xs font-bold">
                      {i + 1}
                    </div>
                    {!isLast && (
                      <div className="h-10 w-0.5 bg-[var(--foreground)]/20" />
                    )}
                    {isLast && (
                      <div className="mt-1 text-xs text-[var(--foreground)]/40">
                        ↻
                      </div>
                    )}
                  </div>
                  <div className="pb-5 min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {STAGE_LABEL[stage]}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--foreground)]/75">
                      {userSummary[stage]}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Block B: 반복 패턴 일러스트 ── */}
        <div className="rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-6">
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]/45">
              Step 2
            </p>
            <h3 className="mt-1 text-base font-semibold text-[var(--foreground)]">
              이 5단계는 이렇게 맞물려 반복됩니다
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
              한 바퀴가 다시 1단계로 이어지며 점점 강화돼요
            </p>
          </div>
        </div>

        {/* ── Block C: 각 단계 상세 해석 ── */}
        <div className="rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-6">
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]/45">
              Step 3
            </p>
            <h3 className="mt-1 text-base font-semibold text-[var(--foreground)]">
              각 단계를 조금 더 자세히 들여다보면
            </h3>
          </div>

          <ol className="space-y-3">
            {nodes.map((node, i) => (
              <li
                key={i}
                className="flex gap-4 rounded-lg border border-[var(--foreground)]/10 bg-[var(--surface)]/40 p-4"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-[var(--foreground)] text-xs font-bold">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground)]/45">
                      {STAGE_LABEL[node.stage] ?? node.stage}
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
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── 섹션 03 ─────────────────────────────── */

function CrossValidationSection({
  summary,
  rows,
}: {
  summary: string;
  rows: AnalysisReport["cross_validation"]["rows"];
}) {
  const dimLabel: Record<string, string> = Object.fromEntries(
    DIMENSIONS.map((d) => [d.key, d.label])
  );

  return (
    <section>
      <SectionTitle num="03" title="점수와 당신이 쓴 말이 이렇게 이어져 있어요" />
      <div className="rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-6">
        <p className="text-sm leading-relaxed text-[var(--foreground)]/75 border-l-2 border-[var(--foreground)]/30 pl-4">
          {summary}
        </p>

        <div className="mt-6 -mx-2 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-[var(--foreground)] text-left">
                <th className="py-2 pr-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/60">
                  영역
                </th>
                <th className="py-2 pr-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/60">
                  점수
                </th>
                <th className="py-2 pr-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/60">
                  일치도
                </th>
                <th className="py-2 pr-3 text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/60">
                  당신의 표현
                </th>
                <th className="py-2 text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]/60">
                  한 줄 해석
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.dimension_key}
                  className="border-b border-[var(--foreground)]/10 align-top"
                >
                  <td className="py-3 pr-3 font-medium text-[var(--foreground)]">
                    {dimLabel[row.dimension_key] ?? row.dimension_key}
                  </td>
                  <td className="py-3 pr-3 tabular-nums text-[var(--foreground)]">
                    {row.score}/25
                  </td>
                  <td className="py-3 pr-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${MATCH_CHIP[row.match_level] ?? ""}`}
                    >
                      {row.match_level}
                    </span>
                  </td>
                  <td className="py-3 pr-3 italic text-[var(--foreground)]/75">
                    {row.evidence_quote ? `"${row.evidence_quote}"` : "—"}
                  </td>
                  <td className="py-3 leading-relaxed text-[var(--foreground)]/75">
                    {row.interpretation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── 섹션 04 ─────────────────────────────── */

function HiddenPatternsSection({
  summary,
  errors,
}: {
  summary: string;
  errors: AnalysisReport["hidden_patterns"]["errors"];
}) {
  const exampleById: Record<string, string> = Object.fromEntries(
    COGNITIVE_ERRORS.map((e) => [e.id, e.example])
  );

  return (
    <section>
      <SectionTitle num="04" title="당신도 모르게 자주 쓰는 생각의 함정" />
      <div className="rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-6 space-y-5">
        <p className="text-sm leading-relaxed text-[var(--foreground)]/75">{summary}</p>

        <div className="space-y-3">
          {errors.map((err, i) => (
            <div
              key={`${err.id}-${i}`}
              className="flex gap-4 rounded-lg border border-[var(--foreground)]/15 p-4"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-[var(--foreground)] text-xs font-bold tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {err.label}
                </p>
                {exampleById[err.id] && (
                  <p className="mt-0.5 text-[11px] text-[var(--foreground)]/45">
                    이런 생각 형태: “{exampleById[err.id]}”
                  </p>
                )}
                <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]/75">
                  {err.evidence}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── 섹션 05 ─────────────────────────────── */

function KeyQuestionSection({
  data,
}: {
  data: AnalysisReport["key_question"];
}) {
  return (
    <section>
      <SectionTitle num="05" title="이제 이 질문 앞에 잠시 멈춰볼 시간" />
      <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-[var(--foreground)]/50">
          {data.headline}
        </p>
        <blockquote className="mt-4 border-l-2 border-[var(--foreground)] pl-5">
          <p className="text-lg font-semibold leading-relaxed text-[var(--foreground)]">
            “{data.question}”
          </p>
        </blockquote>
        <p className="mt-4 text-sm leading-relaxed text-[var(--foreground)]/70">
          {data.rationale}
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────── 공용 ─────────────────────────────── */

function SectionTitle({ num, title }: { num: string; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--foreground)]/40">
        Section {num}
      </span>
      <span className="h-px flex-1 bg-[var(--foreground)]/15" />
      <span className="text-sm font-bold text-[var(--foreground)]">{title}</span>
    </div>
  );
}
