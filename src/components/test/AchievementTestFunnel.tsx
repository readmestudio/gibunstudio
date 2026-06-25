"use client";

/**
 * 성취 중독 무료 테스트 — 독립 퍼널 (로그인·DB·결제 불필요)
 *
 * 워크북 Step 1·2(WorkshopDiagnosisContent / WorkshopResultContent)에서
 * "테스트 + 결과"만 떼어내 무료 리드 마그넷으로 재구성한 화면이다.
 *
 * 핵심 차이:
 *  - 점수 계산을 서버 API 가 아니라 클라이언트에서 calculateDiagnosisScores() 로 처리
 *    (순수 함수라 로그인/DB 없이 동작 → 마찰 0)
 *  - AI 개인화 프로필·실습 게이트는 제거하고, 레벨 기반 정적 해석만 노출
 *  - 결과 하단에서 "더 깊은 분석"이 필요하다는 메시지와 함께 워크북 대기신청(/waitlist)으로 유도
 *
 * 문항·점수·레벨 데이터는 워크북과 동일 출처(diagnosis.ts)를 공유하므로
 * 한쪽을 고치면 양쪽이 함께 정렬된다.
 */

import { useCallback, useState } from "react";
import Link from "next/link";
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

// ─────────────────── RESULT: 더 깊은 분석 안내 ─────────────────── //

// 이 테스트가 알려주는 것 vs 알려주지 못하는 것 — 워크북/상담으로 가는 다리.
const LIMITS = [
  {
    tag: "이 테스트가 알려준 것",
    title: "내 패턴이 지금 어디까지 왔는지",
    body: "성취 패턴의 위험 레벨과 네 가지 지표의 균형을 숫자로 보여줘요. '내가 어떤 상태인가'를 객관적으로 확인하는 단계예요.",
    accent: false,
  },
  {
    tag: "아직 알 수 없는 것",
    title: "왜 그런 반응이 반복되는지",
    body: "어떤 상황이 트리거가 되고, 어떤 자동사고와 핵심 신념이 그 아래에서 작동하는지 — 이 '닫힌 고리'는 문항 점수만으로는 풀리지 않아요. 직접 자기 사례를 따라가며 해체해야 비로소 흐름을 바꿀 수 있어요.",
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
            점수를 알았다면,
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
                  boxShadow: item.accent
                    ? "0 12px 32px -16px rgba(255,90,31,0.30)"
                    : "none",
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
                <Mono
                  size={10}
                  color={item.accent ? D.accent : D.text3}
                  tracking={0.16}
                >
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
                <p
                  style={{
                    margin: "14px 0 0",
                    fontSize: 15,
                    lineHeight: 1.7,
                    color: D.text2,
                    fontWeight: 400,
                  }}
                >
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

// ─────────────────── RESULT: 워크북 구매 CTA ─────────────────── //

function ResultCTA() {
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
            {/* 통일 결제 페이지 — 워크북(₩49,000) 또는 심리상담을 한 곳에서 선택 */}
            <Link
              href="/payment/start"
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
              워크북·상담 보러가기
              <span style={{ fontFamily: D.mono, fontSize: 15 }}>→</span>
            </Link>
          </div>
        </Reveal>

        <Reveal delay={560}>
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

// ─────────────────────────── RESULT ─────────────────────────── //

function Result({
  scores,
  onRetake,
}: {
  scores: DiagnosisScores;
  onRetake: () => void;
}) {
  return (
    <div style={{ background: D.bg, color: D.text, fontFamily: D.font }}>
      <ResultScore scores={scores} />
      <ResultDeepDive />
      <ResultCTA />

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
    <main style={{ background: D.bg, minHeight: "100vh" }}>
      {phase === "intro" && <Intro onStart={() => setPhase("test")} />}
      {phase === "test" && (
        <Test answers={answers} setAnswers={setAnswers} onComplete={computeAndShow} />
      )}
      {phase === "result" && scores && (
        <Result scores={scores} onRetake={retake} />
      )}
    </main>
  );
}
