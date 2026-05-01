"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DIMENSIONS,
  DIAGNOSIS_LEVELS,
  WORKSHOP_STEPS,
  type DiagnosisScores,
  type DimensionKey,
} from "@/lib/self-workshop/diagnosis";
import {
  isDiagnosisProfile,
  type DiagnosisProfile,
} from "@/lib/self-workshop/diagnosis-profile";
import { deriveCaseId } from "./clinical-report/shared/deriveCaseId";
import {
  COL,
  D,
  Mono,
  Reveal,
  clamp,
  lerp,
  smoothstep,
  useInView,
  useTimeline,
} from "./clinical-report/v3-shared";

interface Props {
  scores: DiagnosisScores;
  workshopId: string;
  cachedProfile: DiagnosisProfile | null;
  mechanismAlreadySaved: boolean;
  userName?: string | null;
}

const EMPTY_MECHANISM = {
  recent_situation: "",
  primary_emotion: "",
  emotion_intensity: 0,
  candidate_thoughts: [] as string[],
  automatic_thought: "",
  common_thoughts_checked: [] as string[],
  trigger_context: "",
  emotions_body: { emotions: [] as string[], body_text: "" },
  worst_case_result: "",
  thought_image: "",
  social_perception: "",
  resulting_behavior: "",
  core_beliefs: { about_self: "" },
};

// ───────── 닫힌 고리 4단계 ───────── //
const LOOP_STAGES = [
  {
    stage: "01",
    label: "TRIGGER",
    ko: "트리거",
    hint: "특정 상황이 회로를 켭니다",
    detail: "발표 전, 마감 직전, 평가 시즌 — 익숙한 신호가 들어옵니다.",
  },
  {
    stage: "02",
    label: "AUTO-THOUGHT",
    ko: "자동사고",
    hint: "생각이 자동으로 따라붙어요",
    detail: '"이번에도 못 해내면 끝이야" 1초도 안 되어 떠오릅니다.',
  },
  {
    stage: "03",
    label: "PATTERN",
    ko: "행동 패턴",
    hint: "익숙한 행동이 활성화됩니다",
    detail: "더 무리해서 일하기, 잠 줄이기, 쉬어도 죄책감 느끼기.",
  },
  {
    stage: "04",
    label: "CORE BELIEF",
    ko: "핵심 믿음",
    hint: "오래된 믿음이 다시 강화돼요",
    detail: '"내 가치는 결과로만 증명된다" 회로가 한 바퀴 더 단단해집니다.',
  },
] as const;

// 워크북 진행 두 단계 — FIND_OUT, RESHAPE 의 본문 요약
const WORKBOOK_INTROS: Record<"FIND_OUT" | "RESHAPE", { tag: string; title: string; body: string }> = {
  FIND_OUT: {
    tag: "FIND OUT",
    title: "내 패턴을 발견하기",
    body:
      "어떤 상황에서 어떤 자동사고가 튀어나오는지부터 시작합니다. 그 위에 얹힌 행동 패턴을 따라가다 보면, 가장 깊은 곳에 자리 잡은 핵심 믿음에 닿게 됩니다. 이 단계에서는 평소 외면해 온 생각도 솔직하게 마주하셔야 해요.",
  },
  RESHAPE: {
    tag: "RESHAPE",
    title: "새 신념을 다시 빚어 자리잡게 하기",
    body:
      "같은 상황을 다른 자동사고로 통과해보고, 옛 신념 옆에 균형 잡힌 새 핵심 신념을 함께 둡니다. 그리고 그 신념을 떠받칠 살아있는 작은 증거들을 모아, 머리로 끝나는 통찰이 아니라 일상에서 꺼내 쓸 수 있는 자리까지 내려갑니다.",
  },
};

const ABOUT_PARAGRAPHS: Array<{ lead?: string; body: string; emph?: string; tail?: string }> = [
  {
    lead: "방금 받은 점수와 캐릭터 라인이 낯설지 않으셨을 거예요.",
    body:
      "마감을 끝내고 나면 곧장 다음 마감이 보이고, 발표가 끝나도 박수보다 미흡했던 한 장면이 먼저 떠오르는 분이라면, 지금 화면에 적힌 결과는 우연한 숫자가 아닙니다. 이런 반복이 일정 수준을 넘어선 상태를 ",
    emph: "성취 중독 (Achievement Addiction)",
    tail: "이라고 부릅니다.",
  },
  {
    body:
      "성취 중독은 단순히 부지런하거나 책임감이 강한 것과 다릅니다. 핵심은 ",
    emph: "자기 가치를 오로지 결과물로만 계산하려는 회로",
    tail:
      "가 자리 잡았다는 점이에요. 평가 시즌이나 분기 마감 같은 구간에 평소보다 더 무리하고, 기대했던 성과가 나와도 만족이 며칠을 못 가고, 아무것도 하지 않는 시간에는 오히려 불안해진다면, 이 회로가 이미 일상 속에서 작동하고 있다는 신호입니다.",
  },
  {
    body:
      "이건 의지가 약해서 생기는 일이 아닙니다. 특정 상황이 트리거가 되면 자동사고가 따라붙고, 그 사고가 익숙한 행동 패턴을 끌어내며, 마지막에는 오래된 핵심 믿음을 다시 한번 강화시키는 식으로 ",
    emph: "네 단계가 닫힌 고리",
    tail:
      "를 만들고 있을 뿐이에요. 이 고리를 머릿속에서만 인지하는 걸로는 끊어지지 않습니다. 어디서 어떻게 시작되고 어디서 끝나는지를 직접 풀어봐야 비로소 흐름을 바꿀 수 있습니다.",
  },
];

const CLOSING_TITLE = [
  "가벼운 여정은 아닙니다.",
  "하지만 지금 내린 결정이, 가장 잘한 결정이 됩니다.",
];
const CLOSING_BODY = [
  "실습을 따라가는 동안 외면해 둔 감정이 올라오는 순간이 분명히 옵니다. 그건 워크북이 제대로 작동하고 있다는 신호이지, 무언가 잘못된 게 아니에요.",
  "빠르게 끝내려 하지 마세요. 한 단계를 마치고 잠시 숨을 고르셔도 좋고, 하루 비워두었다가 다시 돌아오셔도 진행은 그대로 이어집니다.",
];
const CLOSING_EMPH =
  "이 과정을 끝까지 통과한 분들은 같은 상황에서 다른 선택을 합니다. 자신을 들여다보기로 한 지금의 결정만으로도, 변화는 이미 시작되었습니다.";

const CHECKLIST = [
  "원활한 작성을 위해 PC 환경에서 진행하시길 권장드려요.",
  "총 소요 시간은 약 60분입니다.",
  "작성 내용은 자동 저장되어, 중간에 멈추셔도 언제든 이어서 하실 수 있어요.",
  "한 단계를 완료하셔야 다음 단계가 열립니다. 순서대로 차근차근 진행해 주세요.",
];

const LIFE_AREAS: Array<{ key: keyof DiagnosisProfile["life_impact"]; tag: string }> = [
  { key: "work", tag: "일" },
  { key: "relationship", tag: "관계" },
  { key: "rest", tag: "쉼" },
  { key: "body", tag: "몸" },
];

// ───────── HERO ───────── //
function Hero({ caseId, userName }: { caseId: string; userName: string }) {
  return (
    <section
      style={{
        maxWidth: COL + 96,
        margin: "0 auto",
        padding: "120px 48px 40px",
      }}
    >
      <Reveal>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 32,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 6,
              height: 6,
              borderRadius: 3,
              background: D.accent,
              boxShadow: `0 0 0 5px ${D.accentSoft}`,
            }}
          />
          <Mono size={11} color={D.accent} tracking={0.2}>
            FIG 01 / 02 · DIAGNOSIS PROFILE
          </Mono>
          <div style={{ flex: 1, minWidth: 24, height: 1, background: D.hair2 }} />
          <Mono size={10} color={D.text3} tracking={0.16}>
            {caseId}
          </Mono>
          {userName && (
            <>
              <span style={{ width: 1, height: 10, background: D.hair }} />
              <Mono size={10} color={D.text3} tracking={0.16}>
                {userName}님
              </Mono>
            </>
          )}
        </div>
      </Reveal>

      <Reveal delay={120}>
        <h1
          style={{
            margin: 0,
            fontWeight: 700,
            fontSize: "clamp(40px, 6.4vw, 84px)",
            lineHeight: 1.04,
            letterSpacing: "-0.04em",
            color: D.ink,
            textWrap: "balance",
          }}
        >
          당신의 성취 중독
          <br />
          진단 결과.
        </h1>
      </Reveal>

      <Reveal delay={260}>
        <p
          style={{
            margin: "32px 0 0",
            maxWidth: 640,
            fontSize: "clamp(16px, 1.5vw, 20px)",
            lineHeight: 1.55,
            color: D.text2,
            letterSpacing: "-0.01em",
            fontWeight: 400,
            textWrap: "pretty",
          }}
        >
          자가 진단 응답을 분석한 결과예요. 어떤 영역에서 균형이 어긋나 있는지, 그 아래 어떤
          신념이 흐르고 있는지 함께 살펴봅니다.
        </p>
      </Reveal>
    </section>
  );
}

// ───────── ANIMATED SCORE GRAPH ───────── //
function ScoreSection({ scores }: { scores: DiagnosisScores }) {
  const [ref, seen] = useInView<HTMLElement>(0.2);
  const t = useTimeline(seen, 2400);
  const totalP = smoothstep(0.0, 0.45, t);
  const totalVal = Math.round(totalP * scores.total);

  const levelMeta = DIAGNOSIS_LEVELS.find((l) => l.level === scores.level) ?? null;

  const dimensionScores = DIMENSIONS.map((dim) => ({
    name: dim.jargonLabel,
    sub: dim.label,
    value: scores.dimensions[dim.key as DimensionKey],
    max: 25,
  }));

  return (
    <section
      ref={ref}
      style={{
        maxWidth: COL + 96,
        margin: "0 auto",
        padding: "40px 48px 0",
      }}
    >
      <Reveal>
        <div
          style={{
            paddingTop: 40,
            paddingBottom: 48,
            borderTop: `1px solid ${D.hair2}`,
            display: "grid",
            gridTemplateColumns: "1fr auto",
            alignItems: "end",
            gap: 32,
          }}
        >
          <div>
            <Mono size={11} color={D.text3} tracking={0.18}>
              TOTAL SCORE
            </Mono>
            <div
              style={{
                marginTop: 14,
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
              <span style={{ fontSize: "clamp(80px, 13vw, 168px)", fontVariantNumeric: "tabular-nums" }}>
                {totalVal}
              </span>
              <span
                style={{
                  fontSize: "clamp(24px, 3.2vw, 40px)",
                  color: D.text3,
                  fontWeight: 600,
                  letterSpacing: "-0.02em",
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
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: D.ink,
                    letterSpacing: "-0.01em",
                  }}
                >
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

      <div
        style={{
          paddingTop: 48,
          paddingBottom: 80,
          borderTop: `1px solid ${D.hair2}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 36,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 600,
              color: D.ink,
              letterSpacing: "-0.01em",
            }}
          >
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
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 16,
                    marginBottom: 14,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      opacity: smoothstep(start - 0.05, start + 0.1, t),
                      transform: `translateY(${
                        (1 - smoothstep(start - 0.05, start + 0.1, t)) * 6
                      }px)`,
                    }}
                  >
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
                        fontWeight: 400,
                        letterSpacing: "-0.005em",
                      }}
                    >
                      {s.sub}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      opacity: smoothstep(start + 0.1, end, t),
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 10px",
                        borderRadius: 999,
                        background: D.riskSoft,
                        color: D.risk,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "-0.005em",
                      }}
                    >
                      <span style={{ width: 5, height: 5, borderRadius: 3, background: D.risk }} />
                      위험
                    </span>
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
                  {p > 0 && p < 1 && (
                    <div
                      style={{
                        position: "absolute",
                        top: -4,
                        bottom: -4,
                        left: `calc(${p * (s.value / s.max) * 100}% - 16px)`,
                        width: 32,
                        background:
                          "radial-gradient(ellipse, rgba(255,90,31,0.45) 0%, transparent 70%)",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ───────── PROFILE NAME ───────── //
function ProfileSection({
  profile,
  loading,
  error,
  onRetry,
}: {
  profile: DiagnosisProfile | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
}) {
  return (
    <section
      style={{
        background: D.bgAlt,
        padding: "120px 0",
        borderTop: `1px solid ${D.hair2}`,
        borderBottom: `1px solid ${D.hair2}`,
      }}
    >
      <div
        style={{
          maxWidth: COL + 96,
          margin: "0 auto",
          padding: "0 48px",
          textAlign: "center",
        }}
      >
        <Reveal>
          <Mono size={11} color={D.text3} tracking={0.22}>
            YOUR FINAL PROFILE
          </Mono>
        </Reveal>

        {loading && (
          <div style={{ marginTop: 56 }}>
            <div
              style={{
                margin: "0 auto",
                width: 280,
                height: 56,
                borderRadius: 8,
                background: D.hair3,
                animation: "diag-pulse 1.6s ease-in-out infinite",
              }}
            />
            <p
              style={{
                marginTop: 32,
                fontSize: 13,
                color: D.text3,
                letterSpacing: "-0.005em",
              }}
            >
              프로필을 작성하고 있어요… (약 5~10초)
            </p>
            <style>{`
              @keyframes diag-pulse {
                0%, 100% { opacity: 0.6; }
                50% { opacity: 1; }
              }
            `}</style>
          </div>
        )}

        {!loading && (error || !profile) && (
          <div style={{ marginTop: 56 }}>
            <p style={{ fontSize: 16, color: D.risk, letterSpacing: "-0.005em" }}>
              {error || "프로필을 불러오지 못했어요"}
            </p>
            <button
              type="button"
              onClick={onRetry}
              style={{
                marginTop: 16,
                fontFamily: D.font,
                fontSize: 13,
                fontWeight: 600,
                color: D.ink,
                background: D.paper,
                border: `1px solid ${D.ink}`,
                borderRadius: 999,
                padding: "10px 20px",
                cursor: "pointer",
                letterSpacing: "-0.005em",
              }}
            >
              다시 시도
            </button>
          </div>
        )}

        {!loading && profile && (
          <>
            <Reveal delay={120}>
              <h2
                style={{
                  margin: "24px 0 0",
                  fontSize: "clamp(36px, 6.8vw, 96px)",
                  fontWeight: 700,
                  lineHeight: 1.04,
                  letterSpacing: "-0.04em",
                  color: D.ink,
                  textWrap: "balance",
                }}
              >
                {profile.character_line}
              </h2>
            </Reveal>
            <Reveal delay={400}>
              <p
                style={{
                  margin: "56px auto 0",
                  maxWidth: 640,
                  fontSize: "clamp(16px, 1.5vw, 19px)",
                  lineHeight: 1.65,
                  color: D.text,
                  letterSpacing: "-0.005em",
                  fontWeight: 400,
                  textWrap: "pretty",
                }}
              >
                {profile.character_description}
              </p>
            </Reveal>
          </>
        )}
      </div>
    </section>
  );
}

// ───────── DOMAIN BREAKDOWN ───────── //
function DomainSection({ profile }: { profile: DiagnosisProfile | null }) {
  if (!profile) return null;
  return (
    <section
      style={{
        maxWidth: COL + 96,
        margin: "0 auto",
        padding: "120px 48px",
      }}
    >
      <Reveal>
        <Mono size={11} color={D.text3} tracking={0.2}>
          DOMAIN ANALYSIS · 4 LIFE AREAS
        </Mono>
      </Reveal>
      <Reveal delay={120}>
        <h2
          style={{
            margin: "24px 0 0",
            fontSize: "clamp(28px, 4.2vw, 56px)",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: D.ink,
            textWrap: "balance",
            maxWidth: 720,
          }}
        >
          삶의 네 영역에서
          <br />
          어떻게 작동하고 있을까요.
        </h2>
      </Reveal>

      <div style={{ marginTop: 80 }}>
        {LIFE_AREAS.map((area, i) => (
          <Reveal key={area.key} delay={i * 80}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(80px, 140px) 1fr",
                gap: "clamp(24px, 4vw, 48px)",
                alignItems: "baseline",
                padding: "40px 0",
                borderTop: `1px solid ${D.hair2}`,
                ...(i === LIFE_AREAS.length - 1
                  ? { borderBottom: `1px solid ${D.hair2}` }
                  : {}),
              }}
            >
              <div>
                <Mono size={10} color={D.text3} tracking={0.18}>
                  0{i + 1}
                </Mono>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: "clamp(24px, 3vw, 32px)",
                    fontWeight: 700,
                    color: D.ink,
                    letterSpacing: "-0.025em",
                    lineHeight: 1,
                  }}
                >
                  {area.tag}
                </div>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "clamp(15px, 1.5vw, 18px)",
                  lineHeight: 1.7,
                  color: D.text,
                  letterSpacing: "-0.005em",
                  fontWeight: 400,
                  textWrap: "pretty",
                }}
              >
                {profile.life_impact[area.key]}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ───────── ABOUT 성취 중독 ───────── //
function AboutSection() {
  return (
    <section
      style={{
        maxWidth: COL + 96,
        margin: "0 auto",
        padding: "40px 48px 120px",
      }}
    >
      <Reveal>
        <Mono size={11} color={D.text3} tracking={0.22}>
          ABOUT · ACHIEVEMENT ADDICTION
        </Mono>
      </Reveal>
      <Reveal delay={120}>
        <h2
          style={{
            margin: "24px 0 0",
            fontSize: "clamp(28px, 4.2vw, 56px)",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: D.ink,
            textWrap: "balance",
            maxWidth: 760,
          }}
        >
          성취 중독이란
          <br />
          무엇일까요.
        </h2>
      </Reveal>

      <div
        style={{
          marginTop: 64,
          display: "flex",
          flexDirection: "column",
          gap: 32,
          maxWidth: 720,
        }}
      >
        {ABOUT_PARAGRAPHS.map((p, i) => (
          <Reveal key={i} delay={i * 80}>
            <p
              style={{
                margin: 0,
                fontSize: "clamp(16px, 1.6vw, 19px)",
                lineHeight: 1.7,
                color: D.text,
                letterSpacing: "-0.005em",
                fontWeight: 400,
                textWrap: "pretty",
              }}
            >
              {p.lead && (
                <span style={{ fontWeight: 600, color: D.ink }}>{p.lead} </span>
              )}
              {p.body}
              {p.emph && <strong style={{ color: D.ink, fontWeight: 700 }}>{p.emph}</strong>}
              {p.tail}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ───────── CLOSED LOOP MOTION ───────── //
function ClosedLoop() {
  const [ref, seen] = useInView<HTMLDivElement>(0.25);
  const t = useTimeline(seen, 8000, 0, true);

  const N = LOOP_STAGES.length;

  function nodeActivation(i: number) {
    const phaseStart = i / N;
    const phaseEnd = (i + 1) / N;
    const center = (phaseStart + phaseEnd) / 2;
    const dist = Math.abs(t - center);
    const wrapped = Math.min(dist, 1 - dist);
    const span = (1 / N) * 0.7;
    return clamp(1 - wrapped / span, 0, 1);
  }

  const pulse = t;

  return (
    <section
      style={{
        background: D.dark,
        color: "#fff",
        padding: "140px 0",
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
            "radial-gradient(ellipse 1200px 700px at 50% 50%, rgba(255,90,31,0.10) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      <div
        ref={ref}
        style={{
          position: "relative",
          maxWidth: COL + 96,
          margin: "0 auto",
          padding: "0 48px",
        }}
      >
        <Reveal>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 32,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: D.accent,
                boxShadow: "0 0 0 5px rgba(255,90,31,0.18)",
              }}
            />
            <Mono size={11} color={D.accent} tracking={0.22}>
              HOW THE LOOP WORKS
            </Mono>
            <div
              style={{
                flex: 1,
                minWidth: 24,
                height: 1,
                background: "rgba(255,255,255,0.10)",
              }}
            />
          </div>
        </Reveal>

        <Reveal delay={120}>
          <h2
            style={{
              margin: 0,
              fontSize: "clamp(32px, 4.8vw, 64px)",
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-0.035em",
              color: "#fff",
              textWrap: "balance",
              maxWidth: 720,
            }}
          >
            닫힌 고리는
            <br />
            이렇게 작동해요.
          </h2>
        </Reveal>

        <Reveal delay={260}>
          <p
            style={{
              margin: "28px 0 0",
              maxWidth: 600,
              fontSize: "clamp(15px, 1.5vw, 18px)",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.65)",
              letterSpacing: "-0.005em",
              fontWeight: 400,
              textWrap: "pretty",
            }}
          >
            하나의 트리거가 자동사고를 부르고, 익숙한 행동 패턴을 거쳐 핵심 믿음을 다시 한번
            강화합니다. 워크북은 이 흐름을 정확히 같은 순서로 따라가며 끊어냅니다.
          </p>
        </Reveal>

        <div
          style={{
            marginTop: 88,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {/* 중앙 척추 */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 28,
              bottom: 28,
              width: 1,
              marginLeft: -0.5,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.18) 8%, rgba(255,255,255,0.18) 92%, rgba(255,255,255,0.02) 100%)",
              pointerEvents: "none",
            }}
          />

          {/* 우측 루프백 호 */}
          <svg
            viewBox="0 0 200 100"
            preserveAspectRatio="none"
            style={{
              position: "absolute",
              right: -40,
              top: "50%",
              height: "92%",
              width: 160,
              transform: "translateY(-50%)",
              pointerEvents: "none",
              opacity: 0.55,
            }}
          >
            <defs>
              <linearGradient id="diag-loopback" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
                <stop offset="50%" stopColor="rgba(255,90,31,0.55)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
              </linearGradient>
            </defs>
            <path
              d="M 0 4 Q 180 50 0 96"
              stroke="url(#diag-loopback)"
              strokeWidth="0.6"
              fill="none"
              strokeDasharray="2 2"
            />
          </svg>

          {/* 이동하는 펄스 */}
          {seen && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: `${pulse * 100}%`,
                width: 10,
                height: 10,
                marginLeft: -5,
                marginTop: -5,
                borderRadius: 5,
                background: D.accent,
                boxShadow: `0 0 0 4px rgba(255,90,31,0.18), 0 0 24px ${D.accent}`,
                pointerEvents: "none",
                transition: "none",
              }}
            />
          )}

          {LOOP_STAGES.map((s, i) => {
            const a = nodeActivation(i);
            const isActive = a > 0.4;
            const textCol = i % 2 === 0 ? ("1 / 2" as const) : ("3 / 4" as const);
            const hintCol = i % 2 === 0 ? ("3 / 4" as const) : ("1 / 2" as const);
            return (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr clamp(180px, 24vw, 220px) 1fr",
                  gap: 32,
                  alignItems: "center",
                  padding: "36px 0",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    textAlign: i % 2 === 0 ? "right" : "left",
                    gridColumn: textCol,
                    gridRow: 1,
                    opacity: lerp(0.35, 1, a),
                    transform: `translateX(${(i % 2 === 0 ? -1 : 1) * (1 - a) * 10}px)`,
                  }}
                >
                  <Mono
                    size={10}
                    color={isActive ? D.accent : "rgba(255,255,255,0.4)"}
                    tracking={0.22}
                  >
                    STEP {s.stage} · {s.label}
                  </Mono>
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: "clamp(22px, 3vw, 32px)",
                      fontWeight: 700,
                      color: "#fff",
                      letterSpacing: "-0.025em",
                      lineHeight: 1.1,
                    }}
                  >
                    {s.ko}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 14,
                      color: "rgba(255,255,255,0.55)",
                      fontWeight: 400,
                      lineHeight: 1.55,
                      letterSpacing: "-0.005em",
                      maxWidth: 280,
                      marginLeft: i % 2 === 0 ? "auto" : 0,
                    }}
                  >
                    {s.detail}
                  </div>
                </div>

                <div
                  style={{
                    gridColumn: "2 / 3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      background: isActive ? D.accent : "rgba(255,255,255,0.04)",
                      border: `1.5px solid ${
                        isActive ? D.accent : "rgba(255,255,255,0.20)"
                      }`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition:
                        "background 380ms ease, border-color 380ms ease, box-shadow 380ms ease",
                      boxShadow: isActive
                        ? `0 0 0 ${a * 10}px rgba(255,90,31,0.10), 0 0 40px ${D.accent}`
                        : "0 0 0 0 transparent",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: -10,
                        borderRadius: 42,
                        border: `1px solid ${D.accent}`,
                        opacity: isActive ? a * 0.6 : 0,
                        transform: `scale(${1 + a * 0.4})`,
                        transition: "none",
                      }}
                    />
                    <span
                      style={{
                        fontFamily: D.mono,
                        fontWeight: 700,
                        fontSize: 14,
                        color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {s.stage}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    textAlign: i % 2 === 0 ? "left" : "right",
                    gridColumn: hintCol,
                    gridRow: 1,
                    opacity: lerp(0.3, 0.9, a),
                    fontSize: 13,
                    color: "rgba(255,255,255,0.5)",
                    fontStyle: "italic",
                    letterSpacing: "-0.005em",
                    transform: `translateX(${(i % 2 === 0 ? 1 : -1) * (1 - a) * 10}px)`,
                  }}
                >
                  {s.hint}
                </div>

                {i < LOOP_STAGES.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      bottom: -12,
                      transform: "translateX(-50%)",
                      color: "rgba(255,255,255,0.25)",
                      fontFamily: D.mono,
                      fontSize: 14,
                    }}
                  >
                    ↓
                  </div>
                )}

                {i === LOOP_STAGES.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      bottom: -22,
                      transform: "translateX(-50%)",
                      color: D.accent,
                      opacity: 0.6,
                      fontFamily: D.mono,
                      fontSize: 11,
                      letterSpacing: "0.18em",
                    }}
                  >
                    ↻ 다시 01로
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Reveal delay={400}>
          <div
            style={{
              marginTop: 80,
              paddingTop: 32,
              borderTop: "1px solid rgba(255,255,255,0.10)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <Mono size={11} color="rgba(255,255,255,0.45)" tracking={0.18}>
              ↻ 무한 루프 · 의지로는 끊어지지 않습니다
            </Mono>
            <Mono size={11} color={D.accent} tracking={0.18}>
              워크북 = 이 고리를 끊는 도구
            </Mono>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ───────── WORKBOOK FLOW ───────── //
function WorkbookSection() {
  const sections: Array<"FIND_OUT" | "RESHAPE"> = ["FIND_OUT", "RESHAPE"];
  return (
    <section
      style={{
        maxWidth: COL + 96,
        margin: "0 auto",
        padding: "140px 48px 80px",
      }}
    >
      <Reveal>
        <Mono size={11} color={D.text3} tracking={0.2}>
          HOW WE BREAK IT · TWO STAGES
        </Mono>
      </Reveal>
      <Reveal delay={120}>
        <h2
          style={{
            margin: "24px 0 0",
            fontSize: "clamp(28px, 4.2vw, 56px)",
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            color: D.ink,
            textWrap: "balance",
            maxWidth: 760,
          }}
        >
          워크북은 이렇게 진행됩니다.
        </h2>
      </Reveal>
      <Reveal delay={260}>
        <p
          style={{
            margin: "24px 0 0",
            maxWidth: 600,
            fontSize: "clamp(15px, 1.5vw, 18px)",
            lineHeight: 1.65,
            color: D.text2,
            letterSpacing: "-0.005em",
            fontWeight: 400,
            textWrap: "pretty",
          }}
        >
          앞서 설명드린 닫힌 고리를, 두 개의 단계를 거치며 순서대로 풀어냅니다.
        </p>
      </Reveal>

      <div style={{ marginTop: 88 }}>
        {sections.map((sec, i) => {
          const meta = WORKBOOK_INTROS[sec];
          const steps = WORKSHOP_STEPS.filter((ws) => ws.section === sec);
          return (
            <Reveal key={sec} delay={i * 100}>
              <div
                style={{
                  padding: "48px 0",
                  borderTop: `1px solid ${D.hair2}`,
                  ...(i === sections.length - 1 ? { borderBottom: `1px solid ${D.hair2}` } : {}),
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(80px, 120px) 1fr",
                    gap: "clamp(24px, 4vw, 48px)",
                    alignItems: "baseline",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: D.font,
                        fontSize: "clamp(48px, 5.5vw, 64px)",
                        fontWeight: 700,
                        color: D.ink,
                        letterSpacing: "-0.04em",
                        lineHeight: 0.95,
                      }}
                    >
                      {i + 1}
                    </div>
                    <Mono
                      size={10}
                      color={D.accent}
                      tracking={0.2}
                      style={{ marginTop: 14, display: "inline-block" }}
                    >
                      {meta.tag}
                    </Mono>
                  </div>
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: "clamp(22px, 3vw, 32px)",
                        fontWeight: 700,
                        color: D.ink,
                        letterSpacing: "-0.025em",
                        lineHeight: 1.15,
                      }}
                    >
                      {meta.title}
                    </h3>
                    <p
                      style={{
                        margin: "18px 0 0",
                        fontSize: "clamp(14px, 1.4vw, 17px)",
                        lineHeight: 1.65,
                        color: D.text2,
                        letterSpacing: "-0.003em",
                        fontWeight: 400,
                        textWrap: "pretty",
                        maxWidth: 620,
                      }}
                    >
                      {meta.body}
                    </p>

                    <div style={{ marginTop: 36 }}>
                      {steps.map((st, j) => (
                        <div
                          key={st.step}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "40px 1fr auto",
                            gap: 20,
                            alignItems: "baseline",
                            padding: "20px 0",
                            borderTop: `1px solid ${D.hair3}`,
                            ...(j === steps.length - 1
                              ? { borderBottom: `1px solid ${D.hair3}` }
                              : {}),
                          }}
                        >
                          <Mono size={13} color={D.text3} tracking={0.06} weight={500}>
                            0{st.sectionStepNumber}
                          </Mono>
                          <div>
                            <Mono size={10} color={D.text3} tracking={0.16}>
                              {st.subtitle}
                            </Mono>
                            <div
                              style={{
                                marginTop: 6,
                                fontSize: "clamp(15px, 1.5vw, 18px)",
                                fontWeight: 600,
                                color: D.ink,
                                letterSpacing: "-0.015em",
                                lineHeight: 1.4,
                              }}
                            >
                              {st.title}
                            </div>
                          </div>
                          <Mono size={11} color={D.text3} tracking={0.04}>
                            {st.estimatedMinutes[0]}~{st.estimatedMinutes[1]}분
                          </Mono>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

// ───────── CLOSING + CTA ───────── //
function ClosingSection({
  onStart,
  submitting,
}: {
  onStart: () => void;
  submitting: boolean;
}) {
  return (
    <section
      style={{
        background: D.bgAlt,
        borderTop: `1px solid ${D.hair2}`,
        padding: "120px 0 60px",
      }}
    >
      <div style={{ maxWidth: COL + 96, margin: "0 auto", padding: "0 48px" }}>
        <Reveal>
          <h2
            style={{
              margin: 0,
              fontSize: "clamp(24px, 3.8vw, 48px)",
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: "-0.025em",
              color: D.ink,
              textWrap: "balance",
              maxWidth: 760,
            }}
          >
            {CLOSING_TITLE[0]}
            <br />
            {CLOSING_TITLE[1]}
          </h2>
        </Reveal>

        <div
          style={{
            marginTop: 56,
            maxWidth: 720,
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {CLOSING_BODY.map((p, i) => (
            <Reveal key={i} delay={i * 80}>
              <p
                style={{
                  margin: 0,
                  fontSize: "clamp(15px, 1.5vw, 18px)",
                  lineHeight: 1.7,
                  color: D.text,
                  letterSpacing: "-0.005em",
                  fontWeight: 400,
                  textWrap: "pretty",
                }}
              >
                {p}
              </p>
            </Reveal>
          ))}
          <Reveal delay={240}>
            <p
              style={{
                margin: 0,
                fontSize: "clamp(16px, 1.6vw, 20px)",
                lineHeight: 1.6,
                color: D.ink,
                letterSpacing: "-0.01em",
                fontWeight: 600,
                textWrap: "pretty",
              }}
            >
              {CLOSING_EMPH}
            </p>
          </Reveal>
        </div>

        <Reveal delay={320}>
          <div
            style={{
              marginTop: 96,
              paddingTop: 40,
              borderTop: `1px solid ${D.hair2}`,
            }}
          >
            <Mono size={11} color={D.text3} tracking={0.2}>
              BEFORE YOU START
            </Mono>
            <h3
              style={{
                margin: "18px 0 32px",
                fontSize: "clamp(20px, 2.2vw, 24px)",
                fontWeight: 700,
                color: D.ink,
                letterSpacing: "-0.02em",
              }}
            >
              실습 전 꼭 확인해 주세요
            </h3>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {CHECKLIST.map((c, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "40px 1fr",
                    gap: 16,
                    alignItems: "baseline",
                    padding: "18px 0",
                    borderTop: `1px solid ${D.hair3}`,
                    ...(i === CHECKLIST.length - 1
                      ? { borderBottom: `1px solid ${D.hair3}` }
                      : {}),
                  }}
                >
                  <Mono size={12} color={D.text3} tracking={0.04} weight={500}>
                    0{i + 1}
                  </Mono>
                  <div
                    style={{
                      fontSize: "clamp(14px, 1.4vw, 16px)",
                      lineHeight: 1.6,
                      color: D.text,
                      letterSpacing: "-0.003em",
                      fontWeight: 400,
                    }}
                  >
                    {c}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={420}>
          <div
            style={{
              marginTop: 64,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 20,
            }}
          >
            <Mono size={10} color={D.text3} tracking={0.18}>
              FIG 01 / 02 · DIAGNOSIS COMPLETE
            </Mono>
            <button
              type="button"
              onClick={onStart}
              disabled={submitting}
              style={{
                fontFamily: D.font,
                fontWeight: 600,
                fontSize: 15,
                color: "#fff",
                background: D.ink,
                border: "none",
                borderRadius: 999,
                padding: "14px 28px",
                cursor: submitting ? "not-allowed" : "pointer",
                letterSpacing: "-0.005em",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                boxShadow: "0 12px 28px -12px rgba(0,0,0,0.30)",
                opacity: submitting ? 0.5 : 1,
                transition: "opacity 200ms ease",
              }}
            >
              {submitting ? "이동 중..." : "실습 시작하기"}
              <span style={{ fontFamily: D.mono, fontSize: 14 }}>→</span>
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ───────── PAGE ───────── //
export function WorkshopResultContent({
  scores,
  workshopId,
  cachedProfile,
  mechanismAlreadySaved,
  userName,
}: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const initialProfile = isDiagnosisProfile(cachedProfile) ? cachedProfile : null;
  const [profile, setProfile] = useState<DiagnosisProfile | null>(initialProfile);
  const [loading, setLoading] = useState(!initialProfile);
  const [error, setError] = useState("");

  const fetchProfile = () => {
    setLoading(true);
    setError("");
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/self-workshop/personalize-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workshopId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "프로필 생성에 실패했습니다");
        if (cancelled) return;
        if (isDiagnosisProfile(data.profile)) {
          setProfile(data.profile);
        } else {
          throw new Error("프로필 형식이 올바르지 않습니다");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "오류가 발생했습니다");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  };

  useEffect(() => {
    if (initialProfile) return;
    const cleanup = fetchProfile();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workshopId]);

  async function handleStartExercise() {
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        workshopId,
        advanceStep: 3,
      };
      if (!mechanismAlreadySaved) {
        body.field = "mechanism_analysis";
        body.data = EMPTY_MECHANISM;
      }
      const res = await fetch("/api/self-workshop/save-progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("진행 저장 실패");
      router.push("/dashboard/self-workshop/step/3");
    } catch {
      setSubmitting(false);
      alert("이동 중 문제가 발생했습니다. 다시 시도해주세요.");
    }
  }

  const caseId = deriveCaseId(workshopId);
  const displayName = (userName ?? "").trim();

  return (
    <div
      style={{
        background: D.bg,
        color: D.text,
        fontFamily: D.font,
      }}
    >
      <Hero caseId={caseId} userName={displayName} />
      <ScoreSection scores={scores} />
      <ProfileSection
        profile={profile}
        loading={loading}
        error={error}
        onRetry={fetchProfile}
      />
      <DomainSection profile={profile} />
      <AboutSection />
      <ClosedLoop />
      <WorkbookSection />
      <ClosingSection onStart={handleStartExercise} submitting={submitting} />
    </div>
  );
}
