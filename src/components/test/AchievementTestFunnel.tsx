"use client";

/**
 * 성취 중독 무료 테스트 — 독립 퍼널 (로그인·DB 불필요, 결과에서 바로 결제)
 *
 * 워크북 Step 1·2(WorkshopDiagnosisContent / WorkshopResultContent)에서
 * "테스트 + 결과"만 떼어내 무료 리드 마그넷으로 재구성한 화면이다.
 *
 * 핵심 차이:
 *  - 점수 계산을 서버 API 가 아니라 클라이언트에서 calculateDiagnosisScores() 로 처리
 *    (순수 함수라 로그인/DB 없이 동작 → 마찰 0)
 *  - 결과 화면에서 답변을 /api/achievement-test/diagnose 로 보내 LLM 상황 진단을 받고
 *    (지금 이런 상태 → 자주 하는 생각 → 빠지기 쉬운 인지 오류) 워크북으로 자연스럽게 연결
 *  - 워크북 랜딩으로 보내지 않고, 결과에서 바로 카카오페이/네이버페이로 결제
 *    (WorkshopCheckoutProvider 공유) + 항상 따라다니는 스티키 구매 버튼
 *  - "심리 상담 워크북은 이렇게 작동합니다" 설명~FAQ는 /payment/self-workshop 의
 *    overview 섹션을 그대로 재사용(.lr 네임스페이스)
 *
 * 문항·점수·레벨 데이터는 워크북과 동일 출처(diagnosis.ts)를 공유하므로
 * 한쪽을 고치면 양쪽이 함께 정렬된다.
 */

import { useCallback, useEffect, useState } from "react";
import {
  DIAGNOSIS_QUESTIONS,
  LIKERT_OPTIONS,
  DIMENSIONS,
  DIAGNOSIS_LEVELS,
  calculateDiagnosisScores,
  type DiagnosisScores,
  type DimensionKey,
} from "@/lib/self-workshop/diagnosis";
import {
  WORKSHOP_PRICE,
  WORKSHOP_ORIGINAL_PRICE,
  WORKSHOP_DISCOUNT_PERCENT,
} from "@/lib/self-workshop/landing-data";
import { trackMetaEvent } from "@/lib/meta-pixel";
import {
  D,
  COL,
  Mono,
  Reveal,
  smoothstep,
  useInView,
  useTimeline,
} from "@/components/self-workshop/clinical-report/v3-shared";

// ── 워크북 결제 + overview 섹션 재사용 (.lr 네임스페이스) ──
import "@/components/self-workshop/redesign-landing/landing.css";
import {
  WorkshopCheckoutProvider,
  useWorkshopCheckoutCtx,
} from "@/components/self-workshop/redesign-landing/WorkshopCheckoutContext";
import { useFadeIn } from "@/components/self-workshop/redesign-landing/useFadeIn";
import { StickyCTA, Divider } from "@/components/self-workshop/redesign-landing/Chrome";
import { OverviewIntroSection } from "@/components/self-workshop/redesign-landing/OverviewIntroSection";
import { CompareSection } from "@/components/self-workshop/redesign-landing/MidSections";
import {
  OverviewApproachSection,
  OverviewJourneySection,
  OverviewLineupSection,
  OverviewMethodSection,
} from "@/components/self-workshop/redesign-landing/OverviewSections";
import { OverviewPointsSection } from "@/components/self-workshop/redesign-landing/OverviewPointsSection";
import { OverviewTestimonialsSection } from "@/components/self-workshop/redesign-landing/OverviewTestimonialsSection";
import {
  FaqSection,
  PricingSection,
  PrivacySection,
} from "@/components/self-workshop/redesign-landing/RestSections";
import { WorkbookScreenshotStrip } from "@/components/self-workshop/redesign-landing/WorkbookScreenshotSection";

const TOTAL = DIAGNOSIS_QUESTIONS.length;

const wonFormat = (n: number) => `₩${n.toLocaleString("ko-KR")}`;

type Phase = "intro" | "test" | "result";

// ─────────────────────────── INTRO ─────────────────────────── //

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <section
      style={{
        maxWidth: COL + 96,
        margin: "0 auto",
        padding: "120px 48px 80px",
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <Reveal>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 28,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              background: D.accent,
              boxShadow: `0 0 0 5px ${D.accentSoft}`,
            }}
          />
          <Mono size={11} color={D.accent} tracking={0.2}>
            FREE TEST · ACHIEVEMENT ADDICTION
          </Mono>
        </div>
      </Reveal>

      <Reveal delay={120}>
        <h1
          style={{
            margin: 0,
            fontWeight: 700,
            fontSize: "clamp(36px, 6vw, 76px)",
            lineHeight: 1.06,
            letterSpacing: "-0.04em",
            color: D.ink,
            textWrap: "balance",
          }}
        >
          쉬면 불안한 당신,
          <br />
          성취 중독일까요?
        </h1>
      </Reveal>

      <Reveal delay={260}>
        <p
          style={{
            margin: "32px 0 0",
            maxWidth: 560,
            fontSize: "clamp(16px, 1.5vw, 19px)",
            lineHeight: 1.6,
            color: D.text2,
            fontWeight: 400,
            textWrap: "pretty",
          }}
        >
          20개 문항으로 내 성취 패턴이 지금 어디까지 와 있는지 진단해요. CBT 기반
          자가 진단으로, 네 가지 핵심 지표와 위험 레벨을 바로 확인할 수 있어요.
        </p>
      </Reveal>

      <Reveal delay={400}>
        <div style={{ marginTop: 48, display: "flex", flexWrap: "wrap", gap: 16 }}>
          <button
            type="button"
            onClick={onStart}
            style={{
              fontFamily: D.font,
              fontWeight: 600,
              fontSize: 16,
              color: "#fff",
              background: D.ink,
              border: "none",
              borderRadius: 999,
              padding: "16px 32px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              boxShadow: "0 12px 28px -12px rgba(0,0,0,0.30)",
            }}
          >
            테스트 시작하기
            <span style={{ fontFamily: D.mono, fontSize: 15 }}>→</span>
          </button>
        </div>
      </Reveal>

      <Reveal delay={520}>
        <div style={{ marginTop: 40, display: "flex", flexWrap: "wrap", gap: 24 }}>
          {[
            ["20", "문항"],
            ["약 5분", "소요"],
            ["무료", "로그인 없이"],
          ].map(([big, small]) => (
            <div key={small}>
              <div
                style={{
                  fontFamily: D.font,
                  fontSize: 20,
                  fontWeight: 700,
                  color: D.ink,
                  letterSpacing: "-0.02em",
                }}
              >
                {big}
              </div>
              <Mono size={10} color={D.text3} tracking={0.16} style={{ marginTop: 4, display: "block" }}>
                {small}
              </Mono>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

// ─────────────────────────── TEST ─────────────────────────── //

function Test({
  answers,
  setAnswers,
  onComplete,
}: {
  answers: Record<string, number>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  onComplete: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const safeIndex = Math.min(Math.max(currentIndex, 0), TOTAL - 1);
  const question = DIAGNOSIS_QUESTIONS[safeIndex];
  const questionId = question.id;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === TOTAL;
  const progress = ((safeIndex + 1) / TOTAL) * 100;

  const handleSelect = useCallback(
    (value: number) => {
      setAnswers((prev) => ({ ...prev, [String(questionId)]: value }));
      // 마지막 문항이 아니면 0.3초 뒤 자동으로 다음 문항으로.
      if (safeIndex < TOTAL - 1) {
        setTimeout(() => setCurrentIndex((i) => Math.min(i + 1, TOTAL - 1)), 300);
      }
    },
    [safeIndex, questionId, setAnswers]
  );

  return (
    <div style={{ maxWidth: COL, margin: "0 auto", padding: "80px 24px 64px" }}>
      {/* 진행률 */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <Mono size={11} color={D.text2} tracking={0.16}>
            {String(safeIndex + 1).padStart(2, "0")} / {String(TOTAL).padStart(2, "0")}
          </Mono>
          <Mono size={11} color={D.text3} tracking={0.16}>
            {answeredCount} ANSWERED
          </Mono>
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 3,
            background: D.hair2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: D.ink,
              borderRadius: 3,
              transition: "width 300ms ease",
            }}
          />
        </div>
      </div>

      {/* 문항 */}
      <p
        style={{
          margin: "0 0 32px",
          fontFamily: D.font,
          fontSize: "clamp(20px, 2.4vw, 28px)",
          fontWeight: 600,
          lineHeight: 1.5,
          color: D.ink,
          letterSpacing: "-0.02em",
        }}
      >
        {question.text}
      </p>

      {/* 리커트 5점 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {LIKERT_OPTIONS.map((opt) => {
          const isSelected = answers[String(question.id)] === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              style={{
                width: "100%",
                textAlign: "left",
                fontFamily: D.font,
                fontSize: 16,
                fontWeight: 500,
                padding: "16px 20px",
                borderRadius: 14,
                border: `2px solid ${isSelected ? D.ink : D.hair}`,
                background: isSelected ? D.ink : D.paper,
                color: isSelected ? "#fff" : D.ink,
                cursor: "pointer",
                transition: "border-color .15s ease, background .15s ease, color .15s ease",
              }}
            >
              <span style={{ marginRight: 12, opacity: 0.55, fontSize: 14 }}>
                {opt.value}
              </span>
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* 네비게이션 */}
      <div
        style={{
          marginTop: 32,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={safeIndex === 0}
          style={{
            fontFamily: D.font,
            fontSize: 14,
            fontWeight: 500,
            padding: "10px 20px",
            borderRadius: 10,
            border: `2px solid ${D.hair}`,
            background: D.paper,
            color: D.text2,
            cursor: safeIndex === 0 ? "not-allowed" : "pointer",
            opacity: safeIndex === 0 ? 0.3 : 1,
          }}
        >
          ← 이전
        </button>

        {safeIndex < TOTAL - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => Math.min(i + 1, TOTAL - 1))}
            style={{
              fontFamily: D.font,
              fontSize: 14,
              fontWeight: 500,
              padding: "10px 20px",
              borderRadius: 10,
              border: `2px solid ${D.ink}`,
              background: D.paper,
              color: D.ink,
              cursor: "pointer",
            }}
          >
            다음 →
          </button>
        ) : (
          <button
            type="button"
            onClick={onComplete}
            disabled={!allAnswered}
            style={{
              fontFamily: D.font,
              fontSize: 14,
              fontWeight: 600,
              padding: "10px 24px",
              borderRadius: 10,
              border: `2px solid ${D.ink}`,
              background: allAnswered ? D.ink : D.paper,
              color: allAnswered ? "#fff" : D.ink,
              cursor: allAnswered ? "pointer" : "not-allowed",
              opacity: allAnswered ? 1 : 0.3,
            }}
          >
            결과 보기
          </button>
        )}
      </div>

      {safeIndex === TOTAL - 1 && !allAnswered && (
        <p style={{ marginTop: 16, textAlign: "center" }}>
          <Mono size={11} color={D.text3} tracking={0.16}>
            아직 {TOTAL - answeredCount}개 문항이 남아 있어요
          </Mono>
        </p>
      )}

      {/* 문항 점프 도트 */}
      <div
        style={{
          marginTop: 40,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 6,
        }}
      >
        {DIAGNOSIS_QUESTIONS.map((q, i) => {
          const hasAnswer = String(q.id) in answers;
          const isCurrent = i === safeIndex;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrentIndex(i)}
              title={`${q.id}번 문항`}
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                border: "none",
                fontSize: 10,
                fontWeight: 500,
                fontFamily: D.mono,
                cursor: "pointer",
                background: isCurrent
                  ? D.ink
                  : hasAnswer
                    ? D.hair
                    : D.hair3,
                color: isCurrent ? "#fff" : hasAnswer ? D.ink : D.text4,
              }}
            >
              {q.id}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────── RESULT: 점수 + 지표 ─────────────────────── //

function ResultScore({ scores }: { scores: DiagnosisScores }) {
  const [ref, seen] = useInView<HTMLElement>(0.2);
  const t = useTimeline(seen, 2200);
  const totalP = smoothstep(0.0, 0.45, t);
  const totalVal = Math.round(totalP * scores.total);

  const levelMeta =
    DIAGNOSIS_LEVELS.find((l) => l.level === scores.level) ?? null;

  const dimensionScores = DIMENSIONS.map((dim) => ({
    name: dim.jargonLabel,
    sub: dim.label,
    value: scores.dimensions[dim.key as DimensionKey],
    max: 25,
  }));

  return (
    <section
      ref={ref}
      style={{ maxWidth: COL + 96, margin: "0 auto", padding: "120px 48px 0" }}
    >
      <Reveal>
        <Mono size={11} color={D.accent} tracking={0.2}>
          YOUR RESULT · 성취 중독 진단
        </Mono>
      </Reveal>

      {/* 총점 + 레벨 배지 */}
      <Reveal delay={120}>
        <div
          style={{
            marginTop: 28,
            display: "grid",
            gridTemplateColumns: "1fr auto",
            alignItems: "end",
            gap: 24,
          }}
        >
          <div>
            <Mono size={11} color={D.text3} tracking={0.18}>
              TOTAL SCORE
            </Mono>
            <div
              style={{
                marginTop: 12,
                display: "flex",
                alignItems: "baseline",
                gap: 6,
                fontFamily: D.font,
                fontWeight: 700,
                color: D.ink,
                letterSpacing: "-0.05em",
                lineHeight: 0.95,
              }}
            >
              <span
                style={{
                  fontSize: "clamp(72px, 12vw, 152px)",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {totalVal}
              </span>
              <span
                style={{
                  fontSize: "clamp(24px, 3vw, 40px)",
                  color: D.text3,
                  fontWeight: 600,
                }}
              >
                /100
              </span>
            </div>
          </div>
          {levelMeta && (
            <div
              style={{
                opacity: smoothstep(0.45, 0.7, t),
                transform: `translateY(${(1 - smoothstep(0.45, 0.7, t)) * 8}px)`,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 16px",
                  border: `1px solid ${D.ink}`,
                  borderRadius: 999,
                  background: D.paper,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: 3, background: D.risk }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: D.ink }}>
                  Level {scores.level}
                </span>
                <span style={{ width: 1, height: 12, background: D.hair }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: D.text2 }}>
                  {levelMeta.name}
                </span>
              </div>
            </div>
          )}
        </div>
      </Reveal>

      {/* 레벨 설명 */}
      {levelMeta && (
        <Reveal delay={240}>
          <p
            style={{
              margin: "40px 0 0",
              maxWidth: 680,
              fontSize: "clamp(16px, 1.6vw, 20px)",
              lineHeight: 1.65,
              color: D.text,
              fontWeight: 400,
              textWrap: "pretty",
            }}
          >
            {levelMeta.description}
          </p>
        </Reveal>
      )}

      {/* 4가지 핵심 지표 */}
      <div style={{ paddingTop: 72, paddingBottom: 40 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 36,
            borderTop: `1px solid ${D.hair2}`,
            paddingTop: 40,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: D.ink }}>
            4가지 핵심 지표
          </h3>
          <Mono size={10} color={D.text3} tracking={0.16}>
            BREAKDOWN · 4 / 4
          </Mono>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
          {dimensionScores.map((s, i) => {
            const start = 0.1 + i * 0.13;
            const end = start + 0.4;
            const p = smoothstep(start, end, t);
            const val = Math.round(p * s.value);
            return (
              <div key={i}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 16,
                    marginBottom: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: "clamp(16px, 2vw, 20px)",
                        fontWeight: 700,
                        color: D.ink,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {s.name}
                    </span>
                    <span
                      style={{
                        fontSize: "clamp(13px, 1.4vw, 15px)",
                        color: D.text2,
                        marginLeft: 10,
                      }}
                    >
                      {s.sub}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: D.font,
                      fontSize: 22,
                      fontWeight: 700,
                      color: D.ink,
                      letterSpacing: "-0.02em",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {val}
                    <span style={{ color: D.text3, fontWeight: 500 }}>/{s.max}</span>
                  </span>
                </div>
                <div
                  style={{
                    position: "relative",
                    height: 6,
                    borderRadius: 3,
                    background: D.hair2,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${p * (s.value / s.max) * 100}%`,
                      background: `linear-gradient(90deg, ${D.ink} 0%, ${D.darkAlt} 100%)`,
                      borderRadius: 3,
                    }}
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

// ─────────────────── RESULT: LLM 상황 진단 ─────────────────── //

// /api/achievement-test/diagnose 응답 형태.
interface LlmDiagnosis {
  state_summary: string;
  frequent_thoughts: string[];
  cognitive_errors: { id: string; name: string; why: string }[];
  bridge: string;
}

/**
 * 사용자의 20문항 답변을 LLM으로 보내 "지금 이런 상태 → 자주 하는 생각 →
 * 빠지기 쉬운 인지 오류 → 성취 중독 워크북으로 분석 받아 보세요"를 생성해 보여준다.
 *
 * 점수만으로는 '왜'가 풀리지 않으므로(닫힌 고리), 여기서 개인화된 거울을 보여주고
 * 자연스럽게 워크북 구매(ResultCTA)로 이어준다.
 */
function ResultLLMDiagnosis({ answers }: { answers: Record<string, number> }) {
  const [data, setData] = useState<LlmDiagnosis | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/achievement-test/diagnose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers }),
        });
        if (!res.ok) throw new Error("diagnose failed");
        const json = await res.json();
        if (!alive) return;
        if (json?.diagnosis) {
          setData(json.diagnosis as LlmDiagnosis);
          setStatus("ok");
        } else {
          setStatus("error");
        }
      } catch {
        if (alive) setStatus("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [answers]);

  return (
    <section
      style={{
        background: D.bgAlt,
        borderTop: `1px solid ${D.hair2}`,
        borderBottom: `1px solid ${D.hair2}`,
        padding: "120px 0",
      }}
    >
      <div style={{ maxWidth: COL + 96, margin: "0 auto", padding: "0 48px" }}>
        <Reveal>
          <Mono size={11} color={D.accent} tracking={0.2}>
            AI 분석 · 지금 당신의 상태
          </Mono>
        </Reveal>
        <Reveal delay={120}>
          <h2
            style={{
              margin: "24px 0 0",
              fontSize: "clamp(28px, 4.2vw, 52px)",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              color: D.ink,
              textWrap: "balance",
              maxWidth: 720,
            }}
          >
            점수 너머,
            <br />
            지금 당신의 마음을 읽었어요.
          </h2>
        </Reveal>

        {/* 로딩 — 답변을 분석하는 동안 */}
        {status === "loading" && (
          <div style={{ marginTop: 64 }}>
            <Mono size={11} color={D.text3} tracking={0.16}>
              답변을 분석하는 중이에요…
            </Mono>
            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 16,
                    width: `${[92, 76, 84][i]}%`,
                    borderRadius: 8,
                    background: D.hair2,
                    opacity: 0.8,
                    animation: "achPulse 1.3s ease-in-out infinite",
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
            <style>{`@keyframes achPulse {0%,100%{opacity:.45}50%{opacity:.9}}`}</style>
          </div>
        )}

        {/* 본문 — LLM 진단 */}
        {status === "ok" && data && (
          <>
            {/* 지금 이런 상태에요 */}
            <Reveal delay={200}>
              <p
                style={{
                  margin: "48px 0 0",
                  maxWidth: 720,
                  fontSize: "clamp(17px, 1.7vw, 21px)",
                  lineHeight: 1.7,
                  color: D.ink,
                  fontWeight: 400,
                  textWrap: "pretty",
                }}
              >
                {data.state_summary}
              </p>
            </Reveal>

            {/* 이런 생각을 자주 해요 */}
            {data.frequent_thoughts.length > 0 && (
              <Reveal delay={120}>
                <div style={{ marginTop: 56 }}>
                  <Mono size={10} color={D.text3} tracking={0.18}>
                    자주 떠오르는 생각
                  </Mono>
                  <div
                    style={{
                      marginTop: 18,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {data.frequent_thoughts.map((t, i) => (
                      <div
                        key={i}
                        style={{
                          position: "relative",
                          padding: "16px 20px 16px 24px",
                          borderRadius: 14,
                          background: D.paper,
                          border: `1px solid ${D.hair}`,
                          fontSize: "clamp(15px, 1.5vw, 18px)",
                          lineHeight: 1.5,
                          color: D.ink,
                          fontWeight: 500,
                        }}
                      >
                        <span
                          aria-hidden
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 16,
                            bottom: 16,
                            width: 3,
                            background: D.accent,
                            borderRadius: 3,
                          }}
                        />
                        {t.startsWith("“") || t.startsWith('"') ? t : `“${t}”`}
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}

            {/* 이런 인지 오류에 빠지기 쉬워요 */}
            {data.cognitive_errors.length > 0 && (
              <Reveal delay={120}>
                <div style={{ marginTop: 56 }}>
                  <Mono size={10} color={D.text3} tracking={0.18}>
                    빠지기 쉬운 인지 오류
                  </Mono>
                  <div
                    style={{
                      marginTop: 18,
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(260px, 1fr))",
                      gap: 16,
                    }}
                  >
                    {data.cognitive_errors.map((e) => (
                      <div
                        key={e.id}
                        style={{
                          padding: "22px 22px",
                          borderRadius: 16,
                          background: D.paper,
                          border: `1px solid ${D.hair}`,
                        }}
                      >
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "clamp(16px, 1.8vw, 19px)",
                            fontWeight: 700,
                            color: D.ink,
                            letterSpacing: "-0.02em",
                          }}
                        >
                          {e.name}
                        </h3>
                        <p
                          style={{
                            margin: "10px 0 0",
                            fontSize: 14.5,
                            lineHeight: 1.65,
                            color: D.text2,
                            fontWeight: 400,
                          }}
                        >
                          {e.why}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            )}

            {/* 워크북으로 자연스럽게 연결 */}
            <Reveal delay={160}>
              <div
                style={{
                  position: "relative",
                  marginTop: 64,
                  padding: "32px 30px",
                  borderRadius: 20,
                  background: D.ink,
                  color: "#fff",
                }}
              >
                <Mono size={10} color={D.accent} tracking={0.18}>
                  ● 다음 단계
                </Mono>
                <p
                  style={{
                    margin: "14px 0 0",
                    fontSize: "clamp(16px, 1.7vw, 20px)",
                    lineHeight: 1.65,
                    color: "rgba(255,255,255,0.92)",
                    fontWeight: 500,
                    textWrap: "pretty",
                  }}
                >
                  {data.bridge}
                </p>
              </div>
            </Reveal>
          </>
        )}

        {/* 에러 — 분석 실패 시에도 워크북으로 연결되는 정적 폴백 */}
        {status === "error" && (
          <Reveal delay={120}>
            <div
              style={{
                position: "relative",
                marginTop: 56,
                padding: "32px 30px",
                borderRadius: 20,
                background: D.ink,
                color: "#fff",
              }}
            >
              <Mono size={10} color={D.accent} tracking={0.18}>
                ● 다음 단계
              </Mono>
              <p
                style={{
                  margin: "14px 0 0",
                  fontSize: "clamp(16px, 1.7vw, 20px)",
                  lineHeight: 1.65,
                  color: "rgba(255,255,255,0.92)",
                  fontWeight: 500,
                  textWrap: "pretty",
                }}
              >
                점수는 &lsquo;내가 어떤 상태인가&rsquo;를 보여주지만, &lsquo;왜
                그런 반응이 반복되는가&rsquo;는 직접 따라가야 풀려요. 성취 중독
                워크북으로 내 트리거·자동사고·핵심 신념을 분석 받아 보세요.
              </p>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

// ─────────────────── RESULT: 워크북 구매 CTA ─────────────────── //

function ResultCTA() {
  // 워크북 랜딩의 결제 컨텍스트를 그대로 공유 — 클릭 즉시 NicePay 결제창.
  // (상품/금액/이미구매 처리는 모두 WorkshopCheckoutProvider 안에서 일괄)
  const { payKakao, payNpay, openModal, isSubmitting, sdkPending } =
    useWorkshopCheckoutCtx();
  const blocked = isSubmitting || sdkPending;

  return (
    <section
      style={{
        background: D.dark,
        color: "#fff",
        padding: "120px 0",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 1100px 600px at 50% 0%, rgba(255,90,31,0.12) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "relative",
          maxWidth: COL + 96,
          margin: "0 auto",
          padding: "0 48px",
        }}
      >
        <Reveal>
          <Mono size={11} color={D.accent} tracking={0.2}>
            성취 중독 워크북
          </Mono>
        </Reveal>
        <Reveal delay={120}>
          <h2
            style={{
              margin: "24px 0 0",
              fontSize: "clamp(30px, 4.6vw, 60px)",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.035em",
              color: "#fff",
              textWrap: "balance",
              maxWidth: 760,
            }}
          >
            쉬지 못하는 마음을
            <br />
            끝까지 풀어내는 10단계 워크북
          </h2>
        </Reveal>
        <Reveal delay={260}>
          <p
            style={{
              margin: "28px 0 0",
              maxWidth: 620,
              fontSize: "clamp(15px, 1.5vw, 18px)",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.65)",
              fontWeight: 400,
              textWrap: "pretty",
            }}
          >
            방금 받은 진단을 출발점으로, 내 트리거·자동사고·핵심 신념을 직접 따라가며
            닫힌 고리를 해체하고 새로운 신념을 다시 빚어요. 진단 결과 리포트와
            3가지 분석 리포트, 자기 확언 카드까지 모두 포함돼요.
          </p>
        </Reveal>

        {/* 가격 (직접결제 — landing-data 단일 출처) */}
        <Reveal delay={380}>
          <div
            style={{
              marginTop: 56,
              display: "flex",
              alignItems: "baseline",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 999,
                background: D.accent,
                color: "#fff",
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {WORKSHOP_DISCOUNT_PERCENT}% 할인
            </span>
            <span
              style={{
                fontSize: 18,
                fontWeight: 500,
                color: "rgba(255,255,255,0.4)",
                textDecoration: "line-through",
              }}
            >
              {wonFormat(WORKSHOP_ORIGINAL_PRICE)}
            </span>
            <span
              style={{
                fontSize: "clamp(40px, 6vw, 56px)",
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "-0.04em",
              }}
            >
              {wonFormat(WORKSHOP_PRICE)}
            </span>
          </div>
        </Reveal>

        {/* 결제 — 랜딩으로 보내지 않고 여기서 바로. 카카오페이 / 네이버페이 2버튼. */}
        <Reveal delay={480}>
          <div
            style={{
              marginTop: 40,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 12,
            }}
          >
            <button
              type="button"
              onClick={payKakao}
              disabled={blocked}
              aria-label="카카오페이로 워크북 결제"
              style={{
                fontFamily: D.font,
                fontWeight: 700,
                fontSize: 16,
                color: "#191600",
                background: "#FEE500",
                border: "none",
                borderRadius: 999,
                padding: "16px 30px",
                cursor: blocked ? "not-allowed" : "pointer",
                opacity: blocked ? 0.6 : 1,
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              {isSubmitting ? "결제 진행 중…" : "카카오페이로 결제"}
            </button>
            <button
              type="button"
              onClick={payNpay}
              disabled={blocked}
              aria-label="네이버페이로 워크북 결제"
              style={{
                fontFamily: D.font,
                fontWeight: 700,
                fontSize: 16,
                color: "#fff",
                background: "#03C75A",
                border: "none",
                borderRadius: 999,
                padding: "16px 30px",
                cursor: blocked ? "not-allowed" : "pointer",
                opacity: blocked ? 0.6 : 1,
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              {isSubmitting ? "결제 진행 중…" : "네이버페이로 결제"}
            </button>
          </div>
        </Reveal>

        <Reveal delay={540}>
          <button
            type="button"
            onClick={openModal}
            disabled={blocked}
            style={{
              marginTop: 18,
              fontFamily: D.font,
              fontSize: 14,
              fontWeight: 500,
              color: "rgba(255,255,255,0.7)",
              background: "transparent",
              border: "none",
              cursor: blocked ? "not-allowed" : "pointer",
              textDecoration: "underline",
              textUnderlineOffset: 4,
            }}
          >
            신용·체크카드 등 다른 결제수단
          </button>
        </Reveal>

        <Reveal delay={600}>
          <Mono
            size={11}
            color="rgba(255,255,255,0.45)"
            tracking={0.14}
            style={{ marginTop: 24, display: "block" }}
          >
            워크북 1인 1회 · 리포트 1년 보관 · 서베이 제출 전 전액 환불
          </Mono>
        </Reveal>
      </div>
    </section>
  );
}

// ──────────── 워크북 작동 설명 ~ FAQ (/payment/self-workshop 재사용) ──────────── //

/**
 * "심리 상담 워크북은 이렇게 작동합니다" 설명부터 FAQ까지 —
 * /payment/self-workshop(OverviewLandingPage)의 overview 섹션을 그대로 붙인다.
 *
 * 이 섹션들은 모두 `.lr` 네임스페이스 CSS와 useFadeIn(.lr-f-up → .lr-in) 모션을
 * 전제로 하므로, `<div className="lr">`로 감싸고 useFadeIn()을 호출한다.
 * result phase에서 마운트될 때 useFadeIn이 실행되도록 별도 컴포넌트로 분리.
 *
 * 결제 CTA(PricingSection·StickyCTA의 WorkbookBuyButton)는 상위
 * WorkshopCheckoutProvider의 컨텍스트를 그대로 사용한다.
 */
function WorkbookHowItWorks() {
  useFadeIn();
  return (
    <div className="lr">
      <OverviewIntroSection />
      <Divider />
      <CompareSection />
      <Divider />
      <OverviewMethodSection />
      <OverviewJourneySection />
      <WorkbookScreenshotStrip />
      <OverviewApproachSection />
      <OverviewLineupSection />
      <PricingSection />
      <OverviewPointsSection />
      <PrivacySection />
      <OverviewTestimonialsSection />
      <FaqSection />
      {/* 항상 따라다니는 워크북 구매 스티키 버튼 (스크롤 800px 이후 노출) */}
      <StickyCTA />
    </div>
  );
}

// ─────────────────────────── RESULT ─────────────────────────── //

function Result({
  scores,
  answers,
  onRetake,
}: {
  scores: DiagnosisScores;
  answers: Record<string, number>;
  onRetake: () => void;
}) {
  return (
    <div style={{ background: D.bg, color: D.text, fontFamily: D.font }}>
      <ResultScore scores={scores} />
      <ResultLLMDiagnosis answers={answers} />
      <ResultCTA />
      <WorkbookHowItWorks />

      {/* 다시 하기 */}
      <div
        style={{
          maxWidth: COL + 96,
          margin: "0 auto",
          padding: "48px 48px 96px",
          textAlign: "center",
        }}
      >
        <button
          type="button"
          onClick={onRetake}
          style={{
            fontFamily: D.font,
            fontSize: 13,
            fontWeight: 500,
            color: D.text3,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
            textUnderlineOffset: 4,
          }}
        >
          테스트 다시 하기
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────── PAGE ─────────────────────────── //

export function AchievementTestFunnel({ skipIntro = false }: { skipIntro?: boolean } = {}) {
  // skipIntro=true: 광고/카드뉴스 유입용. 랜딩(Intro)을 건너뛰고 바로 첫 문항부터 시작해
  // 이탈을 줄이고 진단 완료율을 높인다.
  const [phase, setPhase] = useState<Phase>(skipIntro ? "test" : "intro");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [scores, setScores] = useState<DiagnosisScores | null>(null);

  // 점수는 순수 함수로 클라이언트에서 계산 — 로그인/DB 불필요.
  const computeAndShow = useCallback(() => {
    const result = calculateDiagnosisScores(answers);
    setScores(result);
    setPhase("result");
    // 무료 테스트 완료 = 관심 신호. 결과 도달을 ViewContent 로 가볍게 기록한다
    // (실제 결제 전환은 NicePay return 이후 처리).
    trackMetaEvent("ViewContent", {
      content_name: "성취중독 무료테스트 결과",
      content_category: "free_test",
      // 레벨도 함께 보내 캠페인에서 결과 분포를 볼 수 있게.
      value: result.level,
    });
  }, [answers]);

  const retake = useCallback(() => {
    setAnswers({});
    setScores(null);
    setPhase(skipIntro ? "test" : "intro");
  }, [skipIntro]);

  return (
    // 결과 화면의 결제 CTA(카카오/네이버/카드)·스티키 버튼이 공유하는 결제 컨텍스트.
    // intro/test 단계에서도 감싸 두면 SDK가 미리 로드되어 결제 클릭 지연이 줄어든다.
    <WorkshopCheckoutProvider>
      <main style={{ background: D.bg, minHeight: "100vh" }}>
        {phase === "intro" && <Intro onStart={() => setPhase("test")} />}
        {phase === "test" && (
          <Test answers={answers} setAnswers={setAnswers} onComplete={computeAndShow} />
        )}
        {phase === "result" && scores && (
          <Result scores={scores} answers={answers} onRetake={retake} />
        )}
      </main>
    </WorkshopCheckoutProvider>
  );
}
