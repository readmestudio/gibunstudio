"use client";

/**
 * 마음 체크 — 온보딩 심리 스크리너 퍼널 (로그인·DB·결제 불필요)
 *
 * 심리상담 키워드로 유입된 방문자가 바로 시작할 수 있는 무료 자가 점검 깔때기.
 * (intro → test → result) 3단계로, 7개 영역을 한 번에 거른 뒤 "주 유형 + 부 유형"
 * 진단 리포트를 보여주고 1:1 심리 상담(/programs/counseling)으로 잇는다.
 *
 * 성취중독 무료 테스트(AchievementTestFunnel)와 동일한 패턴이지만:
 *  - 점수/리포트 데이터는 screener.ts (7영역 21문항)에서 가져온다
 *  - 결과 하단 CTA가 워크북 결제가 아니라 "상담 유도"로 바뀐다
 *  - 우울 안전 문항이 높으면 결과 상단에 위기 자원 안내를 먼저 띄운다
 */

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  SCREENER_QUESTIONS,
  SCALE_OPTIONS,
  AXES,
  AXIS_MAX,
  TOTAL_QUESTIONS,
  TYPE_REPORTS,
  SEVERITY_META,
  axisMeta,
  calculateScreener,
  type ScreenerResult,
  type AxisKey,
} from "@/lib/mind-check/screener";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { KAKAO_CHANNEL_URL } from "@/app/programs/counseling/content";
import {
  D,
  COL,
  Mono,
  Reveal,
  smoothstep,
  useInView,
  useTimeline,
} from "@/components/self-workshop/clinical-report/v3-shared";

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
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
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
            FREE CHECK · 마음 체크
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
          요즘 내 마음,
          <br />
          어디가 가장 힘든 걸까요?
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
          불안·우울·번아웃·스트레스·성취중독·자존감·주의력, 7가지 마음 신호를 한 번에
          점검해요. 21개 문항으로 지금 내게 가장 크게 작동하는 마음이 무엇인지 바로
          확인할 수 있어요.
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
            마음 체크 시작하기
            <span style={{ fontFamily: D.mono, fontSize: 15 }}>→</span>
          </button>
        </div>
      </Reveal>

      <Reveal delay={520}>
        <div style={{ marginTop: 40, display: "flex", flexWrap: "wrap", gap: 24 }}>
          {[
            [String(TOTAL_QUESTIONS), "문항"],
            ["약 3분", "소요"],
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

      <Reveal delay={620}>
        <Mono size={10} color={D.text4} tracking={0.14} style={{ marginTop: 32, display: "block" }}>
          ※ 본 테스트는 의학적 진단이 아닌 자가 점검용이에요.
        </Mono>
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

  const safeIndex = Math.min(Math.max(currentIndex, 0), TOTAL_QUESTIONS - 1);
  const question = SCREENER_QUESTIONS[safeIndex];
  const questionId = question.id;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === TOTAL_QUESTIONS;
  const progress = ((safeIndex + 1) / TOTAL_QUESTIONS) * 100;

  const handleSelect = useCallback(
    (value: number) => {
      setAnswers((prev) => ({ ...prev, [String(questionId)]: value }));
      if (safeIndex < TOTAL_QUESTIONS - 1) {
        setTimeout(() => setCurrentIndex((i) => Math.min(i + 1, TOTAL_QUESTIONS - 1)), 300);
      }
    },
    [safeIndex, questionId, setAnswers]
  );

  return (
    <div style={{ maxWidth: COL, margin: "0 auto", padding: "80px 24px 64px" }}>
      {/* 진행률 */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <Mono size={11} color={D.text2} tracking={0.16}>
            {String(safeIndex + 1).padStart(2, "0")} / {String(TOTAL_QUESTIONS).padStart(2, "0")}
          </Mono>
          <Mono size={11} color={D.text3} tracking={0.16}>
            {answeredCount} ANSWERED
          </Mono>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: D.hair2, overflow: "hidden" }}>
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

      {/* 4점 척도 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {SCALE_OPTIONS.map((opt) => {
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
              <span style={{ marginRight: 12, opacity: 0.55, fontSize: 14 }}>{opt.value}</span>
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* 네비게이션 */}
      <div style={{ marginTop: 32, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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

        {safeIndex < TOTAL_QUESTIONS - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => Math.min(i + 1, TOTAL_QUESTIONS - 1))}
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

      {safeIndex === TOTAL_QUESTIONS - 1 && !allAnswered && (
        <p style={{ marginTop: 16, textAlign: "center" }}>
          <Mono size={11} color={D.text3} tracking={0.16}>
            아직 {TOTAL_QUESTIONS - answeredCount}개 문항이 남아 있어요
          </Mono>
        </p>
      )}

      {/* 문항 점프 도트 */}
      <div style={{ marginTop: 40, display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 6 }}>
        {SCREENER_QUESTIONS.map((q, i) => {
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
                background: isCurrent ? D.ink : hasAnswer ? D.hair : D.hair3,
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

// ─────────────────── RESULT: 안전 배너 ─────────────────── //

function SafetyNet() {
  return (
    <section style={{ maxWidth: COL + 96, margin: "0 auto", padding: "40px 48px 0" }}>
      <div
        style={{
          position: "relative",
          padding: "24px 26px",
          borderRadius: 18,
          background: D.riskSoft,
          border: `1px solid ${D.risk}`,
        }}
      >
        <Mono size={10} color={D.risk} tracking={0.16}>
          ● 잠깐, 먼저 전하고 싶은 말이 있어요
        </Mono>
        <p
          style={{
            margin: "14px 0 0",
            fontSize: 16,
            lineHeight: 1.7,
            color: D.ink,
            fontWeight: 500,
          }}
        >
          지금 많이 지치고 힘든 마음이 느껴져요. 혼자 견디지 않아도 괜찮아요.
          전문가의 도움을 지금 바로 받을 수 있어요.
        </p>
        <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 10 }}>
          {[
            ["자살예방 상담전화", "☎ 109"],
            ["정신건강 상담전화", "☎ 1577-0199"],
          ].map(([label, num]) => (
            <div
              key={num}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                borderRadius: 999,
                background: D.paper,
                border: `1px solid ${D.hair}`,
              }}
            >
              <span style={{ fontSize: 13, color: D.text2, fontWeight: 500 }}>{label}</span>
              <span style={{ fontSize: 14, color: D.ink, fontWeight: 700 }}>{num}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────── RESULT: 유형 + 7축 ─────────────────── //

function ResultScore({ result }: { result: ScreenerResult }) {
  const [ref, seen] = useInView<HTMLElement>(0.2);
  const t = useTimeline(seen, 2200);

  const primary = axisMeta(result.primary);
  const primaryReport = TYPE_REPORTS[result.primary];
  const sev = SEVERITY_META[result.severity];
  const secondary = result.secondary ? axisMeta(result.secondary) : null;

  // 7축 막대 (점수 내림차순)
  const bars = result.ranked.map((key) => {
    const meta = axisMeta(key);
    return {
      key,
      name: meta.userLabel,
      en: meta.enLabel,
      value: result.axisScores[key],
      isPrimary: key === result.primary,
      isSecondary: key === result.secondary,
    };
  });

  return (
    <section ref={ref} style={{ maxWidth: COL + 96, margin: "0 auto", padding: "80px 48px 0" }}>
      <Reveal>
        <Mono size={11} color={D.accent} tracking={0.2}>
          YOUR RESULT · 마음 체크
        </Mono>
      </Reveal>

      {/* 주 유형 */}
      <Reveal delay={120}>
        <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <Mono size={11} color={D.text3} tracking={0.18}>
            {primary.clinicalLabel} · {primary.enLabel}
          </Mono>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              border: `1px solid ${result.severity === "high" ? D.risk : D.ink}`,
              borderRadius: 999,
              background: D.paper,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: result.severity === "low" ? D.text3 : result.severity === "moderate" ? D.accent : D.risk,
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: D.ink }}>{sev.label}</span>
          </span>
        </div>
        <h2
          style={{
            margin: "16px 0 0",
            fontSize: "clamp(40px, 7vw, 88px)",
            fontWeight: 700,
            lineHeight: 1.02,
            letterSpacing: "-0.045em",
            color: D.ink,
            textWrap: "balance",
          }}
        >
          {primary.userLabel}
        </h2>
      </Reveal>

      {/* 주 유형 해설 */}
      <Reveal delay={240}>
        <p
          style={{
            margin: "32px 0 0",
            maxWidth: 680,
            fontSize: "clamp(16px, 1.6vw, 20px)",
            lineHeight: 1.65,
            color: D.text,
            fontWeight: 400,
            textWrap: "pretty",
          }}
        >
          {primaryReport.summary}
        </p>
      </Reveal>
      <Reveal delay={320}>
        <p
          style={{
            margin: "20px 0 0",
            maxWidth: 680,
            fontSize: "clamp(15px, 1.5vw, 18px)",
            lineHeight: 1.7,
            color: D.text2,
            fontWeight: 400,
            textWrap: "pretty",
          }}
        >
          {primaryReport.reframe}
        </p>
      </Reveal>

      {/* 부 유형 */}
      {secondary && (
        <Reveal delay={400}>
          <div
            style={{
              marginTop: 28,
              padding: "20px 22px",
              borderRadius: 16,
              background: D.bgAlt,
              border: `1px solid ${D.hair2}`,
            }}
          >
            <Mono size={10} color={D.text3} tracking={0.16}>
              함께 보이는 신호
            </Mono>
            <p style={{ margin: "10px 0 0", fontSize: 15, lineHeight: 1.65, color: D.text }}>
              <strong style={{ color: D.ink }}>{secondary.userLabel}</strong>의 결도 함께
              나타나요. {TYPE_REPORTS[result.secondary as AxisKey].summary}
            </p>
          </div>
        </Reveal>
      )}

      {/* 7축 브레이크다운 */}
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
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: D.ink }}>7가지 마음 신호</h3>
          <Mono size={10} color={D.text3} tracking={0.16}>
            BREAKDOWN · 7 / 7
          </Mono>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {bars.map((b, i) => {
            const start = 0.1 + i * 0.1;
            const end = start + 0.4;
            const p = smoothstep(start, end, t);
            const val = Math.round(p * b.value);
            const barColor = b.isPrimary ? D.accent : D.ink;
            return (
              <div key={b.key}>
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
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        fontSize: "clamp(16px, 2vw, 20px)",
                        fontWeight: b.isPrimary ? 700 : 600,
                        color: b.isPrimary ? D.ink : D.text,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {b.name}
                    </span>
                    {b.isPrimary && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#fff",
                          background: D.accent,
                          borderRadius: 999,
                          padding: "2px 8px",
                        }}
                      >
                        주 유형
                      </span>
                    )}
                    {b.isSecondary && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: D.text2,
                          border: `1px solid ${D.hair}`,
                          borderRadius: 999,
                          padding: "2px 8px",
                        }}
                      >
                        부 유형
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: D.font,
                      fontSize: 20,
                      fontWeight: 700,
                      color: D.ink,
                      letterSpacing: "-0.02em",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {val}
                    <span style={{ color: D.text3, fontWeight: 500 }}>/{AXIS_MAX}</span>
                  </span>
                </div>
                <div style={{ position: "relative", height: 6, borderRadius: 3, background: D.hair2, overflow: "hidden" }}>
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${p * (b.value / AXIS_MAX) * 100}%`,
                      background: barColor,
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

// ─────────────────── RESULT: 더 깊은 분석 다리 ─────────────────── //

const LIMITS = [
  {
    tag: "이 테스트가 알려준 것",
    title: "지금 어떤 마음이 가장 큰지",
    body: "7가지 마음 신호 중 무엇이 지금 내게 가장 크게 작동하는지를 숫자로 보여줘요. '내 상태가 어디쯤인가'를 객관적으로 확인하는 단계예요.",
    accent: false,
  },
  {
    tag: "아직 알 수 없는 것",
    title: "왜 그 패턴이 반복되는지",
    body: "어떤 상황이 그 마음을 켜고, 그 아래에서 어떤 생각과 신념이 작동하는지 — 이 '닫힌 고리'는 점수만으로는 풀리지 않아요. 내 사례를 따라가며 함께 풀어야 비로소 흐름이 바뀌어요.",
    accent: true,
  },
];

function ResultDeepDive() {
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
          <Mono size={11} color={D.text3} tracking={0.2}>
            WHAT&apos;S NEXT · 더 깊은 분석
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
            신호를 알았다면,
            <br />
            이제 &apos;왜&apos;를 풀 차례예요.
          </h2>
        </Reveal>

        <div
          style={{
            marginTop: 72,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
          }}
        >
          {LIMITS.map((item, i) => (
            <Reveal key={i} delay={i * 100}>
              <div
                style={{
                  position: "relative",
                  height: "100%",
                  padding: "28px 26px",
                  borderRadius: 18,
                  background: D.paper,
                  border: `1px solid ${item.accent ? D.ink : D.hair}`,
                  boxShadow: item.accent ? "0 12px 32px -16px rgba(255,90,31,0.30)" : "none",
                }}
              >
                {item.accent && (
                  <span
                    aria-hidden
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 26,
                      bottom: 26,
                      width: 3,
                      background: D.accent,
                      borderRadius: 3,
                    }}
                  />
                )}
                <Mono size={10} color={item.accent ? D.accent : D.text3} tracking={0.16}>
                  {item.accent ? "● " : ""}
                  {item.tag}
                </Mono>
                <h3
                  style={{
                    margin: "14px 0 0",
                    fontSize: "clamp(18px, 2vw, 22px)",
                    fontWeight: 700,
                    color: D.ink,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.3,
                  }}
                >
                  {item.title}
                </h3>
                <p style={{ margin: "14px 0 0", fontSize: 15, lineHeight: 1.7, color: D.text2, fontWeight: 400 }}>
                  {item.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────── RESULT: 상담 유도 CTA ─────────────────── //

function CounselingCTA({ result }: { result: ScreenerResult }) {
  const sev = SEVERITY_META[result.severity];
  const primary = axisMeta(result.primary);

  const onCounselingClick = useCallback(() => {
    trackMetaEvent("InitiateCheckout", {
      content_name: "mind_check_counseling",
      content_category: "counseling",
      primary: result.primary,
      severity: result.severity,
    });
  }, [result.primary, result.severity]);

  const onWorkbookClick = useCallback(() => {
    trackMetaEvent("InitiateCheckout", {
      content_name: "mind_check_workbook",
      content_category: "workbook",
      primary: result.primary,
      severity: result.severity,
    });
  }, [result.primary, result.severity]);

  const onKakaoClick = useCallback(() => {
    trackMetaEvent("Lead", {
      content_name: "mind_check_to_kakao",
      content_category: "counseling",
      primary: result.primary,
    });
  }, [result.primary]);

  return (
    <section style={{ background: D.dark, color: "#fff", padding: "120px 0", position: "relative", overflow: "hidden" }}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 1100px 600px at 50% 0%, rgba(255,90,31,0.12) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", maxWidth: COL + 96, margin: "0 auto", padding: "0 48px" }}>
        <Reveal>
          <Mono size={11} color={D.accent} tracking={0.2}>
            1:1 심리 상담
          </Mono>
        </Reveal>
        <Reveal delay={120}>
          <h2
            style={{
              margin: "24px 0 0",
              fontSize: "clamp(30px, 4.6vw, 60px)",
              fontWeight: 700,
              lineHeight: 1.12,
              letterSpacing: "-0.035em",
              color: "#fff",
              textWrap: "balance",
              maxWidth: 760,
              whiteSpace: "pre-line",
            }}
          >
            {sev.ctaHeadline}
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
            {sev.ctaLede}
          </p>
        </Reveal>

        <Reveal delay={360}>
          <p
            style={{
              margin: "24px 0 0",
              fontSize: 14,
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.5)",
            }}
          >
            1급 심리상담사와 함께 <strong style={{ color: "#fff" }}>{primary.userLabel}</strong>의
            뿌리부터 차근차근 들여다봐요. 유료 심리검사·50분 화상 상담·맞춤 리포트가 포함돼요.
          </p>
        </Reveal>

        <Reveal delay={480}>
          <div style={{ marginTop: 44, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
            {/* 1차: 통일 결제 페이지 — 워크북 또는 1:1 심리상담을 같은 가격으로 선택 */}
            <Link
              href="/payment/start"
              onClick={onCounselingClick}
              style={{
                fontFamily: D.font,
                fontWeight: 600,
                fontSize: 16,
                color: D.ink,
                background: "#fff",
                border: "none",
                borderRadius: 999,
                padding: "16px 34px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                textDecoration: "none",
              }}
            >
              1:1 심리 상담 신청하기
              <span style={{ fontFamily: D.mono, fontSize: 15 }}>→</span>
            </Link>
            {/* 2차: 동일한 통일 결제 페이지 — 워크북으로 혼자 해보기 진입점 */}
            <Link
              href="/payment/start"
              onClick={onWorkbookClick}
              style={{
                fontFamily: D.font,
                fontWeight: 600,
                fontSize: 15,
                color: "#fff",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.4)",
                borderRadius: 999,
                padding: "16px 28px",
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              혼자 해보기 · 워크북 구매
            </Link>
          </div>
        </Reveal>

        <Reveal delay={560}>
          <div style={{ marginTop: 28, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
            <Link
              href="/programs/counseling"
              onClick={onCounselingClick}
              style={{
                fontFamily: D.font,
                fontSize: 13,
                fontWeight: 500,
                color: "rgba(255,255,255,0.7)",
                textDecoration: "underline",
                textUnderlineOffset: 4,
              }}
            >
              상담 프로그램 자세히 보기
            </Link>
            <a
              href={KAKAO_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onKakaoClick}
              style={{
                fontFamily: D.font,
                fontSize: 13,
                fontWeight: 500,
                color: "rgba(255,255,255,0.7)",
                textDecoration: "underline",
                textUnderlineOffset: 4,
              }}
            >
              카카오톡으로 문의하기
            </a>
          </div>
        </Reveal>

        <Reveal delay={640}>
          <Mono size={11} color="rgba(255,255,255,0.45)" tracking={0.14} style={{ marginTop: 24, display: "block" }}>
            상담심리사 1급 · 12년 임상 경험 · 50분 1:1 화상 상담
          </Mono>
        </Reveal>
      </div>
    </section>
  );
}

// ─────────────────────────── RESULT ─────────────────────────── //

function Result({ result, onRetake }: { result: ScreenerResult; onRetake: () => void }) {
  return (
    <div style={{ background: D.bg, color: D.text, fontFamily: D.font }}>
      {result.needsSafetyNet && <SafetyNet />}
      <ResultScore result={result} />
      <ResultDeepDive />
      <CounselingCTA result={result} />

      {/* 다시 하기 */}
      <div style={{ maxWidth: COL + 96, margin: "0 auto", padding: "48px 48px 96px", textAlign: "center" }}>
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
          마음 체크 다시 하기
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────── PAGE ─────────────────────────── //

export function MindCheckFunnel({ skipIntro = false }: { skipIntro?: boolean } = {}) {
  // skipIntro=true: 광고/카드뉴스 유입용. 랜딩(Intro)을 건너뛰고 바로 첫 문항부터 시작.
  const [phase, setPhase] = useState<Phase>(skipIntro ? "test" : "intro");
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<ScreenerResult | null>(null);

  // 점수는 순수 함수로 클라이언트에서 계산 — 로그인/DB 불필요.
  const computeAndShow = useCallback(() => {
    const r = calculateScreener(answers);
    setResult(r);
    setPhase("result");
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
    // 무료 테스트 완료 = 관심 신호. 결과 도달 + 주 유형 분포를 가볍게 기록.
    trackMetaEvent("ViewContent", {
      content_name: "마음체크 결과",
      content_category: "free_test",
      primary: r.primary,
      severity: r.severity,
    });
  }, [answers]);

  const retake = useCallback(() => {
    setAnswers({});
    setResult(null);
    setPhase(skipIntro ? "test" : "intro");
  }, [skipIntro]);

  return (
    <main style={{ background: D.bg, minHeight: "100vh" }}>
      {phase === "intro" && <Intro onStart={() => setPhase("test")} />}
      {phase === "test" && (
        <Test answers={answers} setAnswers={setAnswers} onComplete={computeAndShow} />
      )}
      {phase === "result" && result && <Result result={result} onRetake={retake} />}
    </main>
  );
}
