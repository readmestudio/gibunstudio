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
        <DiagnosisSnapshot
          scores={diagnosisScores}
          levelName={levelMeta?.name ?? ""}
          finalProfile={report.final_profile}
        />
      )}

      <CyclePatternSection
        headline={report.pattern_cycle.headline}
        overview={report.pattern_cycle.overview}
        nodes={report.pattern_cycle.nodes}
      />

      <HiddenPatternsSection
        sectionNum="03"
        summary={report.hidden_patterns.summary}
        errors={report.hidden_patterns.errors}
      />

      <KeyQuestionSection sectionNum="04" data={report.key_question} />

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

const LIFE_IMPACT_AREAS: Array<{
  key: keyof AnalysisReport["final_profile"]["life_impact"];
  label: string;
}> = [
  { key: "work", label: "일" },
  { key: "relationship", label: "관계" },
  { key: "rest", label: "쉼" },
  { key: "body", label: "몸" },
];

function DiagnosisSnapshot({
  scores,
  levelName,
  finalProfile,
}: {
  scores: DiagnosisScores;
  levelName: string;
  finalProfile: AnalysisReport["final_profile"];
}) {
  return (
    <section>
      <SectionTitle num="01" title="당신의 진단 점수를 먼저 볼게요" />

      {/* 총점·레벨 카드 */}
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
      </div>

      {/* 통합 프로필: 캐릭터 + 차원 바 + 일상 영향 */}
      <div className="mt-4 rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground)]/50 text-center">
          Your Final Profile
        </p>
        <p className="mt-3 text-center text-xl font-bold leading-snug text-[var(--foreground)]">
          {finalProfile.character_line}
        </p>

        {/* 4차원 콤팩트 바 모음 */}
        <div className="mt-6 space-y-4">
          {DIMENSIONS.map((dim) => {
            const score = scores.dimensions[dim.key as DimensionKey];
            const percent = (score / 25) * 100;
            const signal = getSignalLevel(score);
            return (
              <div key={dim.key}>
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 text-sm font-semibold text-[var(--foreground)]">
                    {dim.jargonLabel}
                    <span className="ml-1 text-xs font-normal text-[var(--foreground)]/55">
                      ({dim.label})
                    </span>
                  </p>
                  <div className="flex shrink-0 items-center gap-2">
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
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--foreground)]/10">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* 캐릭터 설명 — 점수 바 아래, 일상 영향 박스 위 */}
        <p className="mt-6 text-sm leading-relaxed text-[var(--foreground)]/75">
          {finalProfile.character_description}
        </p>

        {/* 일상 영향 4영역 */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {LIFE_IMPACT_AREAS.map((area) => (
            <div
              key={area.key}
              className="rounded-lg border border-[var(--foreground)]/15 bg-[var(--surface)]/40 p-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--foreground)]/50">
                {area.label}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--foreground)]/80">
                {finalProfile.life_impact[area.key]}
              </p>
            </div>
          ))}
        </div>
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
      <SectionTitle num="02" title="당신에게 반복되고 있는 흐름은 이렇습니다" />

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
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────── 섹션 03 ─────────────────────────────── */

function HiddenPatternsSection({
  sectionNum,
  summary,
  errors,
}: {
  sectionNum: string;
  summary: string;
  errors: AnalysisReport["hidden_patterns"]["errors"];
}) {
  const exampleById: Record<string, string> = Object.fromEntries(
    COGNITIVE_ERRORS.map((e) => [e.id, e.example])
  );

  return (
    <section>
      <SectionTitle num={sectionNum} title="당신도 모르게 자주 쓰는 생각의 함정" />
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

/* ─────────────────────────────── 섹션 04 ─────────────────────────────── */

function KeyQuestionSection({
  sectionNum,
  data,
}: {
  sectionNum: string;
  data: AnalysisReport["key_question"];
}) {
  return (
    <section>
      <SectionTitle num={sectionNum} title="이제 이 질문 앞에 잠시 멈춰볼 시간" />
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
