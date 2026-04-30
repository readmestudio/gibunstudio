"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  isAnalysisReport,
  type AnalysisReport,
  type CascadeNode,
  type CoreMechanism,
  type DestroyRebuildPreview,
  type SituationSummary,
} from "@/lib/self-workshop/analysis-report";
import { CognitiveLoop } from "./clinical-report/CognitiveLoop";
import { DistortionStack } from "./clinical-report/DistortionStack";
import { KeywordSection } from "./clinical-report/KeywordSection";
import { V2TopMeta } from "./clinical-report/shared/V2TopMeta";
import { V2TitleBlock } from "./clinical-report/shared/V2TitleBlock";
import { V2BottomStrip } from "./clinical-report/shared/V2BottomStrip";
import { Eyebrow } from "./clinical-report/shared/Eyebrow";
import { Mono } from "./clinical-report/shared/Mono";
import { deriveCaseId } from "./clinical-report/shared/deriveCaseId";

/**
 * 분석 로딩 중 단계별 진행을 시뮬레이트하는 메시지 시퀀스.
 */
const LOADING_MESSAGES = [
  "트리거와 자동사고를 살펴보고 있어요…",
  "자동사고의 흐름(Cognitive Cascade)을 그리고 있어요…",
  "Step 4 SCT 응답에서 핵심 신념 키워드를 찾고 있어요…",
  "성취 중독의 순환 고리를 정리하고 있어요…",
  "작동 중인 인지 왜곡을 골라내고 있어요…",
  "마지막으로 리포트를 다듬는 중이에요…",
];
const LOADING_INTERVAL_MS = 4000;

interface Props {
  workshopId: string;
  savedReport: unknown;
  mechanismAnalysis?: unknown;
  coreBeliefExcavation?: unknown;
  userName?: string | null;
}

export function WorkshopCognitiveReport({
  workshopId,
  savedReport,
  userName,
}: Props) {
  const router = useRouter();
  const initialReport = isAnalysisReport(savedReport) ? savedReport : null;
  const [report, setReport] = useState<AnalysisReport | null>(initialReport);
  const [loading, setLoading] = useState(!initialReport);
  const [error, setError] = useState("");
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => {
      setLoadingMessageIndex((i) =>
        Math.min(i + 1, LOADING_MESSAGES.length - 1)
      );
    }, LOADING_INTERVAL_MS);
    return () => clearInterval(id);
  }, [loading]);

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
        if (!cancelled) {
          if (isAnalysisReport(data.report)) {
            setReport(data.report);
          } else {
            throw new Error("분석 결과 형식이 올바르지 않습니다");
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "오류가 발생했습니다");
        }
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
    const currentMessage = LOADING_MESSAGES[loadingMessageIndex];
    const progress =
      ((loadingMessageIndex + 1) / LOADING_MESSAGES.length) * 100;
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-[var(--foreground)] border-t-transparent" />

          <div className="relative h-7">
            <AnimatePresence mode="wait">
              <motion.p
                key={loadingMessageIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="absolute inset-x-0 text-base font-medium text-[var(--foreground)]"
              >
                {currentMessage}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="mx-auto mt-4 h-1 w-40 overflow-hidden rounded-full bg-[var(--foreground)]/10">
            <motion.div
              className="h-full bg-[var(--foreground)]"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

          <p className="mt-4 text-sm text-[var(--foreground)]/60">
            자동사고와 SCT 응답을 통합 분석하고 있어요
            <br />
            최대 30초까지 걸릴 수 있어요
          </p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <p className="text-base text-red-600">
          {error || "리포트를 불러오지 못했어요"}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg border-2 border-[var(--foreground)] px-6 py-2 text-base font-medium"
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

  return (
    <div className="mx-auto max-w-2xl space-y-12 pb-24">
      <ReportHeader userName={userName} today={today} />
      <ReportOverview />

      <SituationSection
        summary={report.situation_summary}
        workshopId={workshopId}
      />
      <KeywordSection
        keywords={report.belief_keywords}
        figureNumber="02"
        caseId={deriveCaseId(workshopId)}
        sectionTitle="CORE BELIEFS"
        eyebrow="CORE BELIEFS"
        title={`${countKo(report.belief_keywords.length)} 가지 키워드로 응축된 신념의 골조`}
        subtitle="4개 카테고리(자기 가치 · 성취·인정 · 관계 · 통제) 응답 전체를 통독한 뒤, 가장 강하게 작동하는 신념을 추출했어요. 각 카드의 EVIDENCE 표는 그 신념을 시사하는 실제 자기보고를 보여줍니다."
      />
      <CognitiveLoop
        loop={report.achievement_loop}
        reportLabel="REPORT"
        figureNumber="03"
        figureTotal="06"
        caseId={deriveCaseId(workshopId)}
        sectionLabel="SECTION 03"
        sectionTitle="ACHIEVEMENT LOOP"
        eyebrow={`THE ACHIEVEMENT LOOP — 반복적 순환구조`}
        title={`${countKo(report.achievement_loop.stages.length)}개의 노드가 스스로 회로처럼 돌아갑니다`}
        subtitle={report.achievement_loop.intro}
        implication={deriveLoopImplication(report.achievement_loop.core_mechanism)}
      />
      <DistortionStack
        distortions={report.cognitive_distortions}
        meta={report.cognitive_distortions_meta}
        reportLabel="REPORT"
        figureNumber="04"
        figureTotal="06"
        caseId={deriveCaseId(workshopId)}
        sectionLabel="SECTION 04"
        sectionTitle="DISTORTIONS"
        eyebrow={`동시 작동 중 — COGNITIVE DISTORTIONS`}
        title={`${countKo(report.cognitive_distortions.length)} 가지 왜곡이 동시에 작동하고 있어요`}
        subtitle={`당신의 답변에서 다음 ${report.cognitive_distortions.length}가지 인지 왜곡이 함께 관찰돼요. 각 카드의 SEVERITY · FREQUENCY 막대를 보면 가장 먼저 다룰 왜곡이 어디에 있는지 보입니다.`}
      />
      <DestroyRebuildPreviewSection
        preview={report.destroy_rebuild_preview}
        workshopId={workshopId}
        onCta={() => router.push("/dashboard/self-workshop/step/6")}
      />
    </div>
  );
}

/* ─────────────────────────── 공통 ─────────────────────────── */

function MetaLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]/50">
      {children}
    </p>
  );
}

/* ─────────────────────────── 헤더 ─────────────────────────── */

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
            Cognitive Pattern Integrated Report
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--foreground)]">
            인지 패턴 통합 분석 리포트
          </h1>
          {userName && (
            <p className="mt-2 text-base text-[var(--foreground)]/70">
              대상자:{" "}
              <span className="font-semibold text-[var(--foreground)]">
                {userName}
              </span>{" "}
              님
            </p>
          )}
        </div>
        <div className="text-right text-sm text-[var(--foreground)]/60">
          <p>발행일: {today}</p>
          <p className="mt-1">분석자: AI Clinical Reviewer</p>
        </div>
      </div>
    </header>
  );
}

function ReportOverview() {
  return (
    <div>
      <MetaLabel>📋 리포트 개요</MetaLabel>
      <p className="mt-3 text-base leading-relaxed text-[var(--foreground)]/80">
        본 리포트는 당신이 작성한{" "}
        <strong>CBT 5컬럼(상황·감정·생각·신체·행동)</strong> 과{" "}
        <strong>
          핵심 신념 자기보고(자기 가치 / 성취·인정 / 타인 신뢰 / 통제·안전)
        </strong>
        를 통합 분석한 결과예요. 자동사고와 그 아래 흐르는 신념의 연결고리를 함께
        살펴봅니다.
      </p>
    </div>
  );
}

/* ─────────────────────── Section 01: 상황 + Cascade ─────────────────────── */

function SituationSection({
  summary,
  workshopId,
}: {
  summary: SituationSummary;
  workshopId: string;
}) {
  const total = summary.cascade.length;
  const [active, setActive] = useState(0);

  // 2.2초 간격으로 자동 advance — 핸드오프 ConceptOne의 자동 점화 패턴.
  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(() => {
      setActive((a) => (a + 1) % total);
    }, 2200);
    return () => clearInterval(id);
  }, [total]);

  return (
    <section
      style={{
        fontFamily: "var(--font-clinical-body)",
        background: "var(--v2-paper)",
        color: "var(--v2-ink)",
        border: "1px solid var(--v2-line)",
      }}
    >
      <V2TopMeta
        caseId={deriveCaseId(workshopId)}
        docId="doc/fig-01.cascade"
        sectionNum={1}
        sectionAnchor="COGNITIVE CASCADE"
        ts={`${total} events · ~1.8s`}
      />
      <V2TitleBlock
        idx={1}
        eyebrowEn="COGNITIVE CASCADE"
        headlineKr="당신의 머릿속에서 1~2초 사이에 일어난 일"
        headlineEn="What happened inside your head in 1–2 seconds"
        sub="자동으로 떨어진 6개의 이벤트를 시간 순서대로 펼쳤어요. 각 단계가 다음 단계의 트리거가 됩니다. 동그라미를 하나씩 클릭하면서 흐름을 따라가보세요."
      />

      {/* SUMMARY — 자동사고 한 문장 */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "60px 1fr",
          gap: 24,
          padding: "28px 20px",
          borderBottom: "1px solid var(--v2-line)",
        }}
      >
        <div>
          <Eyebrow size={9.5} weight={600} color="var(--v2-mute)" tracked="0.16em">
            SUMMARY
          </Eyebrow>
        </div>
        <div>
          <div className="mb-3 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5"
              style={{
                padding: "3px 8px",
                background: "var(--v2-ink)",
                color: "#fff",
                fontFamily: "var(--font-clinical-mono)",
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: "0.04em",
                printColorAdjust: "exact",
                WebkitPrintColorAdjust: "exact",
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 5,
                  height: 5,
                  background: "var(--v2-accent)",
                  borderRadius: 5,
                }}
              />
              AUTOMATIC THOUGHT
            </span>
            <Mono size={10} color="var(--v2-mute)">
              1 sentence · ~1.5s
            </Mono>
          </div>
          <div
            style={{
              fontFamily: "var(--font-clinical-body)",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 1.45,
              color: "var(--v2-ink)",
              textWrap: "balance",
            }}
          >
            <span
              style={{
                color: "var(--v2-mute)",
                fontFamily: "var(--font-clinical-mono)",
                fontWeight: 400,
                fontSize: 22,
                marginRight: 4,
              }}
            >
              &ldquo;
            </span>
            {summary.automatic_thought_summary}
            <span
              style={{
                color: "var(--v2-mute)",
                fontFamily: "var(--font-clinical-mono)",
                fontWeight: 400,
                fontSize: 22,
                marginLeft: 4,
              }}
            >
              &rdquo;
            </span>
          </div>
        </div>
      </div>

      {/* FLOW 헤더 — line3 배경 + nav buttons */}
      <div
        className="grid items-center"
        style={{
          gridTemplateColumns: "60px 1fr auto",
          gap: 24,
          padding: "12px 20px",
          borderBottom: "1px solid var(--v2-line)",
          background: "var(--v2-line3)",
        }}
      >
        <Eyebrow size={9.5} weight={600} color="var(--v2-mute)" tracked="0.16em" style={{ textAlign: "center" }}>
          FLOW
        </Eyebrow>
        <div className="flex flex-wrap items-center gap-2">
          <Eyebrow size={9.5} weight={600} color="var(--v2-mute)" tracked="0.16em">
            EVENT
          </Eyebrow>
          <span
            className="inline-flex items-center gap-1.5"
            style={{
              padding: "2px 7px",
              background: "var(--v2-paper)",
              border: "1px solid var(--v2-line)",
              fontFamily: "var(--font-clinical-mono)",
              fontSize: 9.5,
              fontWeight: 600,
              color: "var(--v2-body2)",
              letterSpacing: "0.04em",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 5,
                height: 5,
                borderRadius: 5,
                background: "var(--v2-accent)",
                animation: "cascHintBlink 1.6s ease-in-out infinite",
              }}
            />
            CLICK A NODE TO STEP THROUGH
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActive((i) => Math.max(0, i - 1))}
            disabled={active === 0}
            style={navBtnStyle(active === 0)}
            aria-label="이전 단계"
          >
            ←
          </button>
          <Mono size={10.5} color="var(--v2-body2)" style={{ minWidth: 38, textAlign: "center" }}>
            {pad2(active + 1)} / {pad2(total)}
          </Mono>
          <button
            type="button"
            onClick={() => setActive((i) => Math.min(total - 1, i + 1))}
            disabled={active === total - 1}
            style={navBtnStyle(active === total - 1)}
            aria-label="다음 단계"
          >
            →
          </button>
          <button
            type="button"
            onClick={() => setActive(0)}
            style={{ ...navBtnStyle(false), marginLeft: 4, padding: "4px 8px", width: "auto", fontSize: 10 }}
          >
            RESET
          </button>
        </div>
      </div>

      {/* Cognitive Cascade 본체 — 모션 그대로 (gridDrift, nodeGlow, 펄스 링, flowDot, ACTIVE blink) */}
      <div
        className="relative"
        style={{
          padding: "24px 0 8px",
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0 39px, var(--line-clinical-2) 39px 40px)," +
            "repeating-linear-gradient(90deg, transparent 0 39px, var(--line-clinical-2) 39px 40px)",
          backgroundSize: "40px 40px, 40px 40px",
          animation: "gridDrift 24s linear infinite",
        }}
      >
        <ol className="m-0 list-none p-0">
          {summary.cascade.map((node, i) => (
            <CascadeRow
              key={`${node.label}-${i}`}
              node={node}
              n={pad2(i + 1)}
              isFired={i <= active}
              isActive={i === active}
              isLast={i === total - 1}
              onTap={() => setActive(i)}
            />
          ))}
        </ol>
      </div>

      {/* IMPLICATION — V2 60px gutter 버전 */}
      {summary.flow_insight && (
        <div
          className="grid"
          style={{
            gridTemplateColumns: "60px 1fr",
            gap: 24,
            padding: "24px 20px",
            background: "var(--v2-ink)",
            color: "#fff",
            printColorAdjust: "exact",
            WebkitPrintColorAdjust: "exact",
          }}
        >
          <div>
            <Eyebrow size={9.5} weight={600} color="var(--v2-mute2)" tracked="0.16em">
              IMPLICATION
            </Eyebrow>
            <Mono size={10} color="var(--v2-mute2)" style={{ marginTop: 4, display: "block" }}>
              →
            </Mono>
          </div>
          <p
            style={{
              fontFamily: "var(--font-clinical-body)",
              fontSize: 14,
              lineHeight: 1.7,
              color: "#E5E6EA",
              letterSpacing: "-0.015em",
              maxWidth: 580,
              textWrap: "pretty",
              margin: 0,
            }}
          >
            {summary.flow_insight}
          </p>
        </div>
      )}

      <V2BottomStrip
        caption={`${total} events · click each node to step through`}
        figureNumber="01"
      />
    </section>
  );
}

function navBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    appearance: "none",
    cursor: disabled ? "default" : "pointer",
    background: "var(--v2-paper)",
    border: "1px solid var(--v2-line)",
    color: disabled ? "var(--v2-mute2)" : "var(--v2-ink)",
    width: 26,
    height: 26,
    fontFamily: "var(--font-clinical-mono)",
    fontSize: 12,
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    opacity: disabled ? 0.5 : 1,
    transition: "background .15s ease",
  };
}

function CascadeRow({
  node,
  n,
  isFired,
  isActive,
  isLast,
  onTap,
}: {
  node: CascadeNode;
  n: string;
  isFired: boolean;
  isActive: boolean;
  isLast: boolean;
  onTap: () => void;
}) {
  return (
    <li
      onClick={onTap}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onTap();
        }
      }}
      aria-label={`${n}단계 — ${node.label}${isActive ? " (현재 활성)" : ""}`}
      style={{
        position: "relative",
        cursor: "pointer",
        padding: "0 28px",
        display: "grid",
        gridTemplateColumns: "70px 1fr",
        gap: 18,
        alignItems: "stretch",
      }}
    >
      {/* 좌측 RAIL — 노드 + 연결선 */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: "1.6px solid var(--ink)",
            background: isFired ? "var(--ink)" : "#fff",
            color: isFired ? "#fff" : "var(--ink)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 8,
            flexShrink: 0,
            transition: "background .35s ease, color .35s ease",
            animation: isActive ? "nodeGlow 2.2s ease-in-out infinite" : "none",
            zIndex: 2,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-clinical-mono)",
              fontSize: 16,
              fontWeight: 700,
              color: isFired ? "#fff" : "var(--ink)",
            }}
          >
            {n}
          </span>

          {isActive && (
            <>
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: -6,
                  borderRadius: "50%",
                  border: "1px solid var(--ink)",
                  animation: "pulseRing 2.2s ease-out infinite",
                  pointerEvents: "none",
                }}
              />
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: -6,
                  borderRadius: "50%",
                  border: "1px solid var(--ink)",
                  animation: "pulseRing 2.2s ease-out 1.1s infinite",
                  pointerEvents: "none",
                }}
              />
            </>
          )}
        </div>

        {!isLast && (
          <div
            style={{
              flex: 1,
              width: 2,
              marginTop: 4,
              marginBottom: 4,
              position: "relative",
              background: isFired ? "var(--ink)" : "transparent",
              backgroundImage: isFired
                ? "none"
                : "repeating-linear-gradient(0deg, var(--mute) 0 4px, transparent 4px 8px)",
            }}
          >
            {isFired && (
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#fff",
                  border: "1px solid var(--ink)",
                  animation: "flowDot 2.2s linear infinite",
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* 우측 — 카드 콘텐츠 */}
      <div
        style={{
          padding: "14px 0 18px",
          opacity: isFired ? 1 : 0.55,
          transition: "opacity .3s ease",
        }}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            style={{
              fontFamily: "var(--font-clinical-eyebrow)",
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: isActive ? "var(--ink)" : "var(--mute)",
            }}
          >
            {node.label}
          </span>
          <span style={{ flex: 1 }} />
          {isActive && (
            <span
              className="inline-flex items-center gap-1.5"
              style={{
                fontFamily: "var(--font-clinical-eyebrow)",
                fontSize: 9,
                letterSpacing: "0.22em",
                fontWeight: 700,
                color: "var(--ink)",
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "var(--ink)",
                  animation: "blink 1.2s ease-in-out infinite",
                }}
              />
              ACTIVE
            </span>
          )}
        </div>

        <p
          style={{
            margin: "6px 0 0",
            fontFamily: "var(--font-clinical-body)",
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1.4,
            color: "var(--ink)",
            textWrap: "pretty",
          }}
        >
          {node.content}
        </p>

        {!isLast && node.transition && (
          <p
            style={{
              marginTop: 10,
              fontSize: 12.5,
              lineHeight: 1.65,
              color: "var(--ink-soft)",
              paddingLeft: 12,
              borderLeft: `2px solid ${isActive ? "var(--ink)" : "var(--line-clinical)"}`,
              transition: "border-color .3s ease",
              fontStyle: "italic",
              textWrap: "pretty",
            }}
          >
            ↓ {node.transition}
          </p>
        )}
      </div>
    </li>
  );
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/* ─── Section 03/04 helpers — 시각화 본체는 ./clinical-report/* ─── */

const COUNT_KO_WORDS: readonly string[] = [
  "",
  "한",
  "두",
  "세",
  "네",
  "다섯",
  "여섯",
  "일곱",
  "여덟",
  "아홉",
  "열",
];

function countKo(n: number): string {
  return COUNT_KO_WORDS[n] ?? String(n);
}

/**
 * core_mechanism의 핵심 결론을 한 줄 IMPLICATION으로 합성.
 * 사용자별로 변하는 부분(core_behavior)과 일반 카피("불안에 대한 진짜 해결...")를 결합.
 */
function deriveLoopImplication(mechanism: CoreMechanism): string {
  return `${mechanism.core_behavior}는 불안에 대한 진짜 해결이 아니라 불안을 다루는 방식이 되어버린 상태일 수 있어요.`;
}

/* ─────────────────────── Section 05: Destroy & Rebuild — V2 인스펙터 톤 ─────────────────────── */

function DestroyRebuildPreviewSection({
  preview,
  workshopId,
  onCta,
}: {
  preview: DestroyRebuildPreview;
  workshopId: string;
  onCta: () => void;
}) {
  const [hover, setHover] = useState(false);
  const swaps = [
    preview.target_automatic_thought
      ? {
          codeFrom: "AT2",
          codeTo: "AT2′",
          from: preview.target_automatic_thought,
          to: "대신 어떤 문장이 들어갈 수 있을까요?",
        }
      : null,
    preview.target_checklist_item
      ? {
          codeFrom: "IDF",
          codeTo: "IDF′",
          from: preview.target_checklist_item,
          to: "대신 어떤 문장이 더 정확할까요?",
        }
      : null,
  ].filter((s): s is NonNullable<typeof s> => s !== null);

  return (
    <section
      style={{
        fontFamily: "var(--font-clinical-body)",
        background: "var(--v2-paper)",
        color: "var(--v2-ink)",
        border: "1px solid var(--v2-line)",
      }}
    >
      <V2TopMeta
        caseId={deriveCaseId(workshopId)}
        docId="doc/fig-05.transition"
        sectionNum={5}
        sectionAnchor="RESHAPE"
        ts="phase 02 entry"
      />
      <V2TitleBlock
        idx={5}
        eyebrowEn="RESHAPE"
        headlineKr="발견은 끝났어요. 이제 새 신념을 다시 빚어 자리잡게 합니다."
        headlineEn="Discovery ends. Reshaping begins."
        sub="여기까지 우리는 당신의 머릿속 회로를 이름 붙여 꺼내 놓았어요. 다음 단계에서는 그 회로를 흔들어 보고, 그 자리에 더 균형 잡힌 사고를 함께 심을 거예요."
      />

      {/* LEAD */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "60px 1fr",
          gap: 24,
          padding: "28px 20px",
          borderBottom: "1px solid var(--v2-line)",
        }}
      >
        <Eyebrow size={9.5} weight={600} color="var(--v2-mute)" tracked="0.16em">
          LEAD
        </Eyebrow>
        <div>
          <div
            style={{
              fontFamily: "var(--font-clinical-body)",
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.45,
              color: "var(--v2-ink)",
            }}
          >
            지금까지는{" "}
            <span
              style={{
                background: "var(--v2-accent-soft)",
                color: "var(--v2-accent)",
                padding: "1px 6px",
              }}
            >
              발견
            </span>{" "}
            이었어요.
            <br />
            이제부터는{" "}
            <span
              style={{
                background: "var(--v2-ink)",
                color: "#fff",
                padding: "1px 6px",
              }}
            >
              새 신념 다시 빚기
            </span>{" "}
            입니다.
          </div>
          <p
            style={{
              margin: "14px 0 0",
              fontFamily: "var(--font-clinical-body)",
              fontSize: 14,
              lineHeight: 1.75,
              color: "var(--v2-body)",
              letterSpacing: "-0.015em",
              maxWidth: 600,
              textWrap: "pretty",
            }}
          >
            하지만 발견만으로는 패턴이 바뀌지 않아요. 알고 있는데도 똑같이 반응하는 자신을 보며 더 답답해질 수도 있죠. 그래서 다음 단계가 필요해요.
          </p>
        </div>
      </div>

      {/* RESHAPE step 01 — 대안 자동사고 시뮬레이션 */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "60px 1fr",
          gap: 24,
          padding: "24px 20px",
          borderBottom: "1px solid var(--v2-line2)",
        }}
      >
        <div>
          <Mono size={11} weight={600} color="var(--v2-accent)">
            RSHP
          </Mono>
          <Mono size={9.5} color="var(--v2-mute2)" style={{ display: "block", marginTop: 4 }}>
            step.01
          </Mono>
        </div>
        <div>
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <Eyebrow size={10} weight={700} color="var(--v2-accent)" tracked="0.16em">
              RESHAPE
            </Eyebrow>
            <span
              style={{
                padding: "2px 6px",
                background: "var(--v2-accent-soft)",
                color: "var(--v2-accent)",
                fontFamily: "var(--font-clinical-mono)",
                fontSize: 9.5,
                fontWeight: 600,
                letterSpacing: "0.04em",
              }}
            >
              REFRAME
            </span>
            <Mono size={10} color="var(--v2-mute)">
              · 같은 상황, 다른 시선
            </Mono>
          </div>
          <div
            style={{
              fontFamily: "var(--font-clinical-body)",
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.55,
              color: "var(--v2-ink)",
              marginBottom: 12,
            }}
          >
            같은 상황을 다른 자동사고로 다시 통과해봅니다.
          </div>
          <div className="grid gap-2 mb-3">
            {preview.keyword_propositions.map((proposition, i) => (
              <div
                key={i}
                className="grid"
                style={{
                  gridTemplateColumns: "44px 1fr",
                  gap: 8,
                  padding: "10px 12px",
                  background: "var(--v2-line3)",
                  border: "1px solid var(--v2-line2)",
                }}
              >
                <Mono size={10.5} weight={600} color="var(--v2-accent)">
                  KW-{pad2(i + 1)}
                </Mono>
                <div
                  style={{
                    fontFamily: "var(--font-clinical-body)",
                    fontSize: 13.5,
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.55,
                    color: "var(--v2-ink)",
                    textWrap: "pretty",
                  }}
                >
                  <span
                    style={{
                      color: "var(--v2-mute)",
                      fontFamily: "var(--font-clinical-mono)",
                      fontWeight: 400,
                      marginRight: 2,
                    }}
                  >
                    &ldquo;
                  </span>
                  {proposition}
                  <span
                    style={{
                      color: "var(--v2-mute)",
                      fontFamily: "var(--font-clinical-mono)",
                      fontWeight: 400,
                      marginLeft: 2,
                    }}
                  >
                    &rdquo;
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              fontFamily: "var(--font-clinical-body)",
              fontSize: 13,
              lineHeight: 1.7,
              color: "var(--v2-body2)",
              letterSpacing: "-0.015em",
              maxWidth: 600,
              textWrap: "pretty",
            }}
          >
            이 신념들이 자동으로 떠올리게 만든 자동사고를, 같은 상황에서 더 부드럽고 균형잡힌 사고로 다시 통과해봅니다. 옛 사고가 유일한 답이 아니었음을 직접 체감하는 자리예요.
          </div>
        </div>
      </div>

      {/* RESHAPE step 02-03 — 새 핵심 신념 찾기 + 떠받치기 (스왑 미리보기로 대체 시선 일부 노출) */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "60px 1fr",
          gap: 24,
          padding: "24px 20px",
          borderBottom: "1px solid var(--v2-line)",
        }}
      >
        <div>
          <Mono size={11} weight={600} color="var(--v2-ink)">
            RSHP
          </Mono>
          <Mono size={9.5} color="var(--v2-mute2)" style={{ display: "block", marginTop: 4 }}>
            step.02
          </Mono>
        </div>
        <div>
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <Eyebrow size={10} weight={700} color="var(--v2-ink)" tracked="0.16em">
              RESHAPE
            </Eyebrow>
            <span
              style={{
                padding: "2px 6px",
                background: "var(--v2-ink)",
                color: "#fff",
                fontFamily: "var(--font-clinical-mono)",
                fontSize: 9.5,
                fontWeight: 600,
                letterSpacing: "0.04em",
                printColorAdjust: "exact",
                WebkitPrintColorAdjust: "exact",
              }}
            >
              BALANCED
            </span>
            <Mono size={10} color="var(--v2-mute)">
              · 새 신념을 빚고 떠받치기
            </Mono>
          </div>
          <div
            style={{
              fontFamily: "var(--font-clinical-body)",
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.55,
              color: "var(--v2-ink)",
              marginBottom: 12,
            }}
          >
            옛 신념 옆에 균형 잡힌 새 신념을 두고, 살아있는 증거로 떠받칩니다.
          </div>

          {swaps.map((s, i) => (
            <div
              key={i}
              style={{
                padding: 12,
                border: "1px solid var(--v2-line)",
                marginBottom: 8,
              }}
            >
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  style={{
                    padding: "1px 5px",
                    background: "var(--v2-line3)",
                    color: "var(--v2-body2)",
                    fontFamily: "var(--font-clinical-mono)",
                    fontSize: 9.5,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                  }}
                >
                  FROM
                </span>
                <Mono size={10} color="var(--v2-mute)">
                  old · {s.codeFrom}
                </Mono>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-clinical-body)",
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: "var(--v2-body2)",
                  letterSpacing: "-0.015em",
                  textDecoration: "line-through",
                  textDecorationColor: "var(--v2-mute2)",
                }}
              >
                {s.from}
              </div>
              <div
                className="flex items-center gap-2"
                style={{ margin: "10px 0 6px" }}
              >
                <span
                  style={{
                    padding: "1px 5px",
                    background: "var(--v2-ink)",
                    color: "#fff",
                    fontFamily: "var(--font-clinical-mono)",
                    fontSize: 9.5,
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    printColorAdjust: "exact",
                    WebkitPrintColorAdjust: "exact",
                  }}
                >
                  TO
                </span>
                <Mono size={10} color="var(--v2-mute)">
                  new · {s.codeTo}
                </Mono>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-clinical-body)",
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.6,
                  color: "var(--v2-ink)",
                }}
              >
                {s.to}
              </div>
            </div>
          ))}

          <div
            style={{
              marginTop: 10,
              fontFamily: "var(--font-clinical-body)",
              fontSize: 12.5,
              lineHeight: 1.7,
              color: "var(--v2-mute)",
              letterSpacing: "-0.01em",
              maxWidth: 600,
              fontStyle: "italic",
            }}
          >
            단순히 긍정적인 말로 덮는 게 아니라, 당신이 진짜로 동의할 수 있는 균형 잡힌 새 신념을 짓고, 일상의 작은 증거들로 그 신념을 떠받치는 자리까지 함께 갑니다.
          </div>
        </div>
      </div>

      {/* WHY */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "60px 1fr",
          gap: 24,
          padding: "24px 20px",
          borderBottom: "1px solid var(--v2-line)",
        }}
      >
        <Eyebrow size={9.5} weight={600} color="var(--v2-mute)" tracked="0.16em">
          WHY
        </Eyebrow>
        <div>
          <div
            style={{
              fontFamily: "var(--font-clinical-body)",
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.5,
              color: "var(--v2-ink)",
            }}
          >
            검증되지 않은 신념은 자동사고를 계속 생산해요.
          </div>
          <div
            style={{
              marginTop: 10,
              fontFamily: "var(--font-clinical-body)",
              fontSize: 13.5,
              lineHeight: 1.75,
              color: "var(--v2-body)",
              letterSpacing: "-0.015em",
              maxWidth: 600,
              textWrap: "pretty",
            }}
          >
            자동사고만 바꾸려 하면 같은 뿌리에서 새로운 자동사고가 다시 자라나요. 핵심 신념을 검증해 흔들고, 그 자리에 새로운 사고를 심어야 비로소 이 회로가 끊어지고, 새로운 패턴이 시작돼요.
          </div>
          <div
            style={{
              marginTop: 10,
              fontFamily: "var(--font-clinical-body)",
              fontSize: 12.5,
              lineHeight: 1.7,
              color: "var(--v2-mute)",
              letterSpacing: "-0.01em",
              maxWidth: 600,
              fontStyle: "italic",
            }}
          >
            지금까지의 작업이 지도를 그리는 일이었다면, 다음 단계는 그 지도 위에 새로운 길을 내는 일이에요. 함께 가보시죠.
          </div>
        </div>
      </div>

      {/* CTA */}
      <div
        className="grid items-center"
        style={{
          gridTemplateColumns: "60px 1fr auto",
          gap: 24,
          padding: "24px 20px",
          background: "var(--v2-line3)",
        }}
      >
        <Eyebrow size={9.5} weight={600} color="var(--v2-mute)" tracked="0.16em">
          NEXT
        </Eyebrow>
        <div>
          <div
            style={{
              fontFamily: "var(--font-clinical-body)",
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--v2-ink)",
              marginBottom: 4,
            }}
          >
            다음 단계: 핵심 믿음 검증
          </div>
          <Mono size={10.5} color="var(--v2-body2)">
            est. ~12 min · {preview.keyword_propositions.length} beliefs · evidence-based prompts
          </Mono>
        </div>
        <button
          type="button"
          onClick={onCta}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            appearance: "none",
            cursor: "pointer",
            background: "var(--v2-ink)",
            color: "#fff",
            border: "none",
            padding: "14px 20px",
            fontFamily: "var(--font-clinical-body)",
            fontSize: 13.5,
            fontWeight: 700,
            letterSpacing: "-0.005em",
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            transition: "background .2s ease",
            printColorAdjust: "exact",
            WebkitPrintColorAdjust: "exact",
          }}
        >
          <span>핵심 믿음 검증하러 가기</span>
          <span
            className="inline-flex items-center gap-1.5"
            style={{ paddingLeft: 12, borderLeft: "1px solid #2A2C32" }}
          >
            <span
              style={{
                fontFamily: "var(--font-clinical-mono)",
                fontSize: 10,
                color: "var(--v2-mute2)",
                letterSpacing: "0.04em",
              }}
            >
              ↵
            </span>
            <span
              style={{
                transform: hover ? "translateX(3px)" : "translateX(0)",
                transition: "transform .25s cubic-bezier(.2,.8,.2,1)",
              }}
            >
              →
            </span>
          </span>
        </button>
      </div>

      <V2BottomStrip
        caption="section transition · validation phase"
        figureNumber="05"
      />
    </section>
  );
}
