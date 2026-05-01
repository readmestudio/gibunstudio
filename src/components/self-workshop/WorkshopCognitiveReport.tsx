"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isAnalysisReport,
  type AchievementLoop,
  type AnalysisReport,
  type BeliefKeyword,
  type CascadeNode,
  type CognitiveDistortion,
  type CognitiveDistortionMeta,
  type CoreMechanism,
  type DestroyRebuildPreview,
  type SituationSummary,
} from "@/lib/self-workshop/analysis-report";
import { deriveCaseId } from "./clinical-report/shared/deriveCaseId";
import {
  COL,
  D,
  Mono,
  Reveal,
  clamp,
  formatDate,
  lerp,
  splitParagraphs,
  useInView,
  useTimeline,
} from "./clinical-report/v3-shared";

interface Props {
  workshopId: string;
  savedReport: unknown;
  mechanismAnalysis?: unknown;
  coreBeliefExcavation?: unknown;
  userName?: string | null;
}

const LOADING_MESSAGES = [
  "트리거와 자동사고를 살펴보고 있어요…",
  "자동사고의 흐름(Cognitive Cascade)을 그리고 있어요…",
  "Step 4 SCT 응답에서 핵심 신념 키워드를 찾고 있어요…",
  "성취 중독의 순환 고리를 정리하고 있어요…",
  "작동 중인 인지 왜곡을 골라내고 있어요…",
  "마지막으로 리포트를 다듬는 중이에요…",
];
const LOADING_INTERVAL_MS = 4000;

const HERO_SUB =
  "방금 작성하신 CBT 5컬럼과 핵심 신념 자기보고를 통합 분석한 결과예요. 자동사고 한 줄에서 시작해 그 아래 흐르는 신념의 골조까지, 같은 흐름을 한 번에 따라가봅니다.";

const RESHAPE_HEAD = [
  "발견은 끝났어요.",
  "이제 새 신념을 다시 빚어 놓을 차례입니다.",
];
const RESHAPE_BODY = [
  "방금까지 본 세 키워드와 자동사고는 다음 챕터부터 직접 손을 대면서 다시 짜집니다. 머리로만 이해한 통찰은 같은 트리거 앞에서 다시 무너져요. 일상에서 꺼내 쓸 수 있는 자리까지 내려놓는 것이 여기서부터 할 일입니다.",
];
const RESHAPE_EMPH =
  "한 번 정리된 회로는 두 번째부터 더 빨리 보입니다. 끝까지 통과한 자신을 위해, 이제 다음 단계를 시작하세요.";

// ───────── HERO ───────── //
function Hero({
  caseId,
  userName,
  today,
}: {
  caseId: string;
  userName: string;
  today: string;
}) {
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
            FIG · COGNITIVE PATTERN INTEGRATED
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
          {today && (
            <>
              <span style={{ width: 1, height: 10, background: D.hair }} />
              <Mono size={10} color={D.text3} tracking={0.16}>
                {today}
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
          당신의 패턴이
          <br />
          어떻게 작동하는지,
          <br />
          보이기 시작했어요.
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
          {HERO_SUB}
        </p>
      </Reveal>
    </section>
  );
}

// ───────── OVERVIEW ───────── //
function OverviewSection() {
  return (
    <section
      style={{
        maxWidth: COL + 96,
        margin: "0 auto",
        padding: "40px 48px 120px",
      }}
    >
      <Reveal>
        <div
          style={{
            paddingTop: 40,
            borderTop: `1px solid ${D.hair2}`,
          }}
        >
          <Mono size={11} color={D.text3} tracking={0.2}>
            OVERVIEW · 분석 개요
          </Mono>
        </div>
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
          CBT 5컬럼과 SCT 응답을 한 흐름으로 합쳤어요.
        </h2>
      </Reveal>

      <div
        style={{
          marginTop: 56,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 32,
          maxWidth: 800,
        }}
      >
        {[
          {
            n: "01",
            label: "COGNITIVE CASCADE",
            body: "트리거 → 자동사고 → 핵심 자기 정의까지 1~2초 사이의 흐름",
          },
          {
            n: "02",
            label: "CORE BELIEFS",
            body: "SCT 응답에서 가장 강하게 작동하는 3가지 신념 키워드",
          },
          {
            n: "03",
            label: "ACHIEVEMENT LOOP",
            body: "신념이 합쳐져 만드는 6단계 행동 순환 고리",
          },
          {
            n: "04",
            label: "DISTORTIONS",
            body: "동시에 작동 중인 인지 왜곡과 그 우선순위",
          },
        ].map((it, i) => (
          <Reveal key={it.n} delay={i * 80}>
            <div>
              <Mono size={13} color={D.text3} tracking={0.06} weight={500}>
                {it.n}
              </Mono>
              <div
                style={{
                  marginTop: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: D.ink,
                  textTransform: "uppercase",
                }}
              >
                {it.label}
              </div>
              <p
                style={{
                  margin: "8px 0 0",
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: D.text2,
                  letterSpacing: "-0.005em",
                  textWrap: "pretty",
                }}
              >
                {it.body}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ───────── COGNITIVE CASCADE ───────── //
function CascadeSection({ summary }: { summary: SituationSummary }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.2);
  const cascade = summary.cascade;
  const N = cascade.length;
  // 노드 N개를 순환하는 ~ (N * 1.6)s 사이클
  const cycle = Math.max(8000, N * 1600);
  const t = useTimeline(seen, cycle, 0, true);

  function nodeActivation(i: number) {
    const phaseStart = i / N;
    const phaseEnd = (i + 1) / N;
    const center = (phaseStart + phaseEnd) / 2;
    const dist = Math.abs(t - center);
    const wrapped = Math.min(dist, 1 - dist);
    const span = (1 / N) * 0.7;
    return clamp(1 - wrapped / span, 0, 1);
  }

  return (
    <section
      style={{
        background: D.bgAlt,
        borderTop: `1px solid ${D.hair2}`,
        borderBottom: `1px solid ${D.hair2}`,
        padding: "120px 0",
      }}
    >
      <div
        ref={ref}
        style={{
          maxWidth: COL + 96,
          margin: "0 auto",
          padding: "0 48px",
        }}
      >
        <Reveal>
          <Mono size={11} color={D.text3} tracking={0.22}>
            COGNITIVE CASCADE · 1–2초의 사고 흐름
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
              wordBreak: "keep-all",
            }}
          >
            당신의 머릿속에서
            <br />
            1–2초 사이에 일어난 일.
          </h2>
        </Reveal>

        {/* flow_insight — 본문 단락 */}
        <Reveal delay={240}>
          <p
            style={{
              margin: "32px 0 0",
              maxWidth: 720,
              fontSize: "clamp(15px, 1.5vw, 18px)",
              lineHeight: 1.7,
              color: D.text2,
              letterSpacing: "-0.005em",
              fontWeight: 400,
              textWrap: "pretty",
              wordBreak: "keep-all",
            }}
          >
            {summary.flow_insight}
          </p>
        </Reveal>

        {/* 트리거 인용 */}
        <Reveal delay={320}>
          <div
            style={{
              marginTop: 56,
              padding: "32px 0",
              borderTop: `1px solid ${D.hair2}`,
              borderBottom: `1px solid ${D.hair2}`,
              maxWidth: 760,
            }}
          >
            <Mono size={10} color={D.text3} tracking={0.2}>
              TRIGGER · 시작 상황
            </Mono>
            <p
              style={{
                margin: "16px 0 0",
                fontSize: "clamp(17px, 1.8vw, 22px)",
                lineHeight: 1.55,
                color: D.ink,
                letterSpacing: "-0.015em",
                fontStyle: "italic",
                fontWeight: 500,
                textWrap: "balance",
                wordBreak: "keep-all",
              }}
            >
              &ldquo;{summary.trigger_quote}&rdquo;
            </p>
          </div>
        </Reveal>

        {/* 노드 cascade — 수직 척추 + 이동 펄스 */}
        <div
          style={{
            marginTop: 80,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {/* 척추 */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 28,
              bottom: 28,
              width: 1,
              marginLeft: -0.5,
              background: `linear-gradient(180deg, ${D.hair2} 0%, ${D.hair} 8%, ${D.hair} 92%, ${D.hair2} 100%)`,
              pointerEvents: "none",
            }}
          />

          {/* 이동 펄스 */}
          {seen && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: `${t * 100}%`,
                width: 10,
                height: 10,
                marginLeft: -5,
                marginTop: -5,
                borderRadius: 5,
                background: D.accent,
                boxShadow: `0 0 0 4px rgba(255,90,31,0.18), 0 0 20px ${D.accent}`,
                pointerEvents: "none",
              }}
            />
          )}

          {cascade.map((node: CascadeNode, i) => {
            const a = nodeActivation(i);
            const isActive = a > 0.4;
            const textCol = i % 2 === 0 ? ("1 / 2" as const) : ("3 / 4" as const);
            const transitionCol =
              i % 2 === 0 ? ("3 / 4" as const) : ("1 / 2" as const);
            return (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr clamp(180px, 24vw, 220px) 1fr",
                  gap: 32,
                  alignItems: "center",
                  padding: "32px 0",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    textAlign: i % 2 === 0 ? "right" : "left",
                    gridColumn: textCol,
                    gridRow: 1,
                    opacity: lerp(0.4, 1, a),
                    transform: `translateX(${
                      (i % 2 === 0 ? -1 : 1) * (1 - a) * 10
                    }px)`,
                  }}
                >
                  <Mono
                    size={10}
                    color={isActive ? D.accent : D.text3}
                    tracking={0.22}
                  >
                    {String(i + 1).padStart(2, "0")} · {node.label}
                  </Mono>
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: "clamp(17px, 2vw, 22px)",
                      fontWeight: 700,
                      color: D.ink,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.4,
                      textWrap: "balance",
                    }}
                  >
                    {node.content}
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
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      background: isActive ? D.accent : D.paper,
                      border: `1.5px solid ${isActive ? D.accent : D.hair}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition:
                        "background 380ms ease, border-color 380ms ease, box-shadow 380ms ease",
                      boxShadow: isActive
                        ? `0 0 0 ${a * 10}px rgba(255,90,31,0.10), 0 0 32px rgba(255,90,31,0.45)`
                        : "0 0 0 0 transparent",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: D.mono,
                        fontWeight: 700,
                        fontSize: 13,
                        color: isActive ? "#fff" : D.text3,
                        letterSpacing: "0.04em",
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    textAlign: i % 2 === 0 ? "left" : "right",
                    gridColumn: transitionCol,
                    gridRow: 1,
                    opacity: lerp(0.3, 0.85, a),
                    fontSize: 13,
                    color: D.text3,
                    fontStyle: "italic",
                    letterSpacing: "-0.005em",
                  }}
                >
                  {node.transition || ""}
                </div>

                {i < cascade.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      bottom: -10,
                      transform: "translateX(-50%)",
                      color: D.text3,
                      fontFamily: D.mono,
                      fontSize: 14,
                    }}
                  >
                    ↓
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 자동사고 한 문장 요약 */}
        <Reveal delay={400}>
          <div
            style={{
              marginTop: 80,
              padding: "32px 0",
              borderTop: `1px solid ${D.hair2}`,
              maxWidth: 760,
            }}
          >
            <Mono size={10} color={D.accent} tracking={0.2}>
              AUTOMATIC THOUGHT · 한 문장 요약
            </Mono>
            <p
              style={{
                margin: "16px 0 0",
                fontSize: "clamp(18px, 2vw, 24px)",
                lineHeight: 1.5,
                color: D.ink,
                letterSpacing: "-0.02em",
                fontWeight: 600,
                textWrap: "pretty",
              }}
            >
              {summary.automatic_thought_summary}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ───────── CORE BELIEFS · 3 KEYWORDS ───────── //
function KeywordsSection({ keywords }: { keywords: BeliefKeyword[] }) {
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
          CORE BELIEFS · 3 KEYWORDS
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
          세 가지 키워드로 응축된
          <br />
          신념의 골조.
        </h2>
      </Reveal>
      <Reveal delay={260}>
        <p
          style={{
            margin: "24px 0 0",
            maxWidth: 640,
            fontSize: "clamp(15px, 1.5vw, 18px)",
            lineHeight: 1.65,
            color: D.text2,
            letterSpacing: "-0.005em",
            fontWeight: 400,
            textWrap: "pretty",
          }}
        >
          4개 카테고리(자기 가치 · 성취·인정 · 관계 · 통제) 응답 전체를 통독한 뒤, 가장 강하게 작동하는 신념을 추출했어요. 각 키워드 아래의 근거 표는 그 신념을 시사하는 실제 자기보고를 보여줍니다.
        </p>
      </Reveal>

      <div style={{ marginTop: 88 }}>
        {keywords.map((kw, i) => (
          <Reveal key={i} delay={i * 100}>
            <div
              style={{
                padding: "64px 0",
                borderTop: `1px solid ${D.hair2}`,
                ...(i === keywords.length - 1
                  ? { borderBottom: `1px solid ${D.hair2}` }
                  : {}),
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
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <Mono
                    size={10}
                    color={D.accent}
                    tracking={0.2}
                    style={{ marginTop: 14, display: "inline-block" }}
                  >
                    {kw.clinical_name}
                  </Mono>
                </div>
                <div>
                  {/* 명제 (큰 인용) */}
                  <div
                    style={{
                      fontSize: "clamp(24px, 3.4vw, 40px)",
                      fontWeight: 700,
                      color: D.ink,
                      letterSpacing: "-0.025em",
                      lineHeight: 1.15,
                      textWrap: "balance",
                    }}
                  >
                    &ldquo;{kw.proposition}&rdquo;
                  </div>
                  {/* 설명 */}
                  <p
                    style={{
                      margin: "24px 0 0",
                      fontSize: "clamp(15px, 1.5vw, 18px)",
                      lineHeight: 1.7,
                      color: D.text2,
                      letterSpacing: "-0.005em",
                      fontWeight: 400,
                      textWrap: "pretty",
                      maxWidth: 640,
                      whiteSpace: "pre-line",
                    }}
                  >
                    {kw.explanation}
                  </p>

                  {/* 근거 목록 */}
                  <div style={{ marginTop: 36 }}>
                    <Mono size={10} color={D.text3} tracking={0.2}>
                      EVIDENCE · 자기보고에서 발견한 근거
                    </Mono>
                    <div style={{ marginTop: 16 }}>
                      {kw.evidence.map((ev, j) => (
                        <div
                          key={j}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(72px, 96px) 1fr",
                            gap: 20,
                            alignItems: "baseline",
                            padding: "20px 0",
                            borderTop: `1px solid ${D.hair3}`,
                            ...(j === kw.evidence.length - 1
                              ? { borderBottom: `1px solid ${D.hair3}` }
                              : {}),
                          }}
                        >
                          <Mono
                            size={11}
                            color={D.text3}
                            tracking={0.06}
                            weight={500}
                          >
                            {ev.id || ev.source_code}
                          </Mono>
                          <div>
                            <p
                              style={{
                                margin: 0,
                                fontSize: "clamp(15px, 1.5vw, 17px)",
                                lineHeight: 1.55,
                                color: D.ink,
                                letterSpacing: "-0.005em",
                                fontStyle: "italic",
                                fontWeight: 500,
                                textWrap: "pretty",
                              }}
                            >
                              &ldquo;{ev.quote}&rdquo;
                            </p>
                            <p
                              style={{
                                margin: "8px 0 0",
                                fontSize: 13,
                                lineHeight: 1.6,
                                color: D.text2,
                                letterSpacing: "-0.005em",
                                fontWeight: 400,
                                textWrap: "pretty",
                              }}
                            >
                              {ev.reasoning}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* insight_close — 마무리 */}
                  <p
                    style={{
                      margin: "32px 0 0",
                      fontSize: "clamp(16px, 1.6vw, 19px)",
                      lineHeight: 1.6,
                      color: D.ink,
                      letterSpacing: "-0.01em",
                      fontWeight: 600,
                      textWrap: "pretty",
                    }}
                  >
                    {kw.insight_close}
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ───────── ACHIEVEMENT LOOP (DARK) ───────── //
function AchievementLoopSection({ loop }: { loop: AchievementLoop }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.25);
  const cycleMs = 9000;
  const t = useTimeline(seen, cycleMs, 0, true);
  const stages = loop.stages;
  const N = stages.length;

  function nodeActivation(i: number) {
    const phaseStart = i / N;
    const phaseEnd = (i + 1) / N;
    const center = (phaseStart + phaseEnd) / 2;
    const dist = Math.abs(t - center);
    const wrapped = Math.min(dist, 1 - dist);
    const span = (1 / N) * 0.7;
    return clamp(1 - wrapped / span, 0, 1);
  }

  const introParas = splitParagraphs(loop.intro);

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
              ACHIEVEMENT LOOP · 6단계 닫힌 고리
            </Mono>
            <div
              style={{
                flex: 1,
                minWidth: 24,
                height: 1,
                background: "rgba(255,255,255,0.10)",
              }}
            />
            {loop.cycle_time && (
              <Mono size={10} color="rgba(255,255,255,0.55)" tracking={0.18}>
                {loop.cycle_time}
              </Mono>
            )}
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
              maxWidth: 760,
            }}
          >
            여섯 개의 노드가
            <br />
            스스로 회로처럼 돌아갑니다.
          </h2>
        </Reveal>

        <div
          style={{
            marginTop: 28,
            maxWidth: 640,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {introParas.map((p, i) => (
            <Reveal key={i} delay={260 + i * 80}>
              <p
                style={{
                  margin: 0,
                  fontSize: "clamp(15px, 1.5vw, 18px)",
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.65)",
                  letterSpacing: "-0.005em",
                  fontWeight: 400,
                  textWrap: "pretty",
                  whiteSpace: "pre-line",
                }}
              >
                {p}
              </p>
            </Reveal>
          ))}
        </div>

        {/* Loop diagram — 원형 6-노드 패턴 (펄스 시계방향 orbit) */}
        <CircularLoop stages={stages} t={t} seen={seen} nodeActivation={nodeActivation} />

        {/* loopback 표시 */}
        <Reveal delay={520}>
          <div
            style={{
              marginTop: 16,
              textAlign: "center",
            }}
          >
            <Mono size={11} color={D.accent} tracking={0.22}>
              {loop.loopback_text || "↻ 회로는 멈추지 않고 다시 01로"}
            </Mono>
          </div>
        </Reveal>

        {/* Core mechanism — 양립 두 행동 + 두려움 */}
        <Reveal delay={400}>
          <div
            style={{
              marginTop: 88,
              paddingTop: 32,
              borderTop: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <Mono size={10} color={D.accent} tracking={0.22}>
              CORE MECHANISM · 회로의 엔진
            </Mono>
            <CoreMechanismBlock m={loop.core_mechanism} />
          </div>
        </Reveal>

        <Reveal delay={500}>
          <div
            style={{
              marginTop: 64,
              paddingTop: 24,
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
            {loop.observed_text && (
              <Mono size={11} color={D.accent} tracking={0.18}>
                {loop.observed_text}
              </Mono>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ───────── CIRCULAR LOOP — 6-NODE ORBITAL PATTERN ───────── //
// 회로의 닫힌 본성을 시각화. 6 노드가 원주 위에 균등 배치되고, 펄스가 시계방향으로
// orbit 하면서 도착한 노드를 점화. 중앙에는 현재 활성 노드의 상세(name + user_case)가
// crossfade. 마지막 → 첫 번째로 돌아가는 자연스러운 회귀를 원형 그 자체로 보여준다.
function CircularLoop({
  stages,
  t,
  seen,
  nodeActivation,
}: {
  stages: AchievementLoop["stages"];
  t: number;
  seen: boolean;
  nodeActivation: (i: number) => number;
}) {
  const N = stages.length;
  const VB = 540; // viewBox 한 변
  const C = VB / 2; // 중앙
  const R = 188; // 노드 궤도 반지름
  const TWO_PI = Math.PI * 2;
  const startAngle = -Math.PI / 2; // 12시 방향에서 시작

  // 펄스 위치 (시계방향)
  const pulseAngle = startAngle + t * TWO_PI;
  const pulseX = C + R * Math.cos(pulseAngle);
  const pulseY = C + R * Math.sin(pulseAngle);

  // 펄스 뒤따르는 활성 호 (track 위에 일부 구간만 accent 컬러)
  const trackCircumference = 2 * Math.PI * R;
  const arcLen = trackCircumference * 0.18; // ~18% 호
  const arcDashArray = `${arcLen} ${trackCircumference}`;
  const arcDashOffset = trackCircumference * (1 - t) - arcLen * 0.5;

  return (
    <div
      style={{
        marginTop: 80,
        position: "relative",
        width: "min(560px, 100%)",
        aspectRatio: "1",
        margin: "80px auto 0",
      }}
    >
      <svg
        viewBox={`0 0 ${VB} ${VB}`}
        style={{ width: "100%", height: "100%", display: "block" }}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="cogloop-pulse-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,90,31,0.55)" />
            <stop offset="60%" stopColor="rgba(255,90,31,0.18)" />
            <stop offset="100%" stopColor="rgba(255,90,31,0)" />
          </radialGradient>
        </defs>

        {/* 중심 옅은 ring (배경 깊이) */}
        <circle
          cx={C}
          cy={C}
          r={R - 56}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />

        {/* dashed track */}
        <circle
          cx={C}
          cy={C}
          r={R}
          fill="none"
          stroke="rgba(255,255,255,0.20)"
          strokeWidth="1"
          strokeDasharray="3 5"
        />

        {/* 펄스 뒤 호 — accent (track 위에 진행 중인 부분만 강조) */}
        {seen && (
          <circle
            cx={C}
            cy={C}
            r={R}
            fill="none"
            stroke={D.accent}
            strokeWidth="2"
            strokeDasharray={arcDashArray}
            strokeDashoffset={arcDashOffset}
            transform={`rotate(-90 ${C} ${C})`}
            opacity="0.65"
            style={{ transition: "none" }}
          />
        )}

        {/* 펄스 글로우 */}
        {seen && (
          <circle
            cx={pulseX}
            cy={pulseY}
            r="28"
            fill="url(#cogloop-pulse-glow)"
            style={{ transition: "none" }}
          />
        )}

        {/* 노드 6개 */}
        {stages.map((s, i) => {
          const angle = startAngle + (i / N) * TWO_PI;
          const x = C + R * Math.cos(angle);
          const y = C + R * Math.sin(angle);
          const a = nodeActivation(i);
          const isActive = a > 0.4;
          const ringR = 28 + a * 4;
          return (
            <g key={i}>
              {isActive && (
                <circle
                  cx={x}
                  cy={y}
                  r={ringR + 6}
                  fill="none"
                  stroke={D.accent}
                  strokeWidth="1"
                  opacity={a * 0.5}
                  style={{ transition: "none" }}
                />
              )}
              <circle
                cx={x}
                cy={y}
                r={ringR}
                fill={isActive ? D.accent : "#0a0a0a"}
                stroke={isActive ? D.accent : "rgba(255,255,255,0.28)"}
                strokeWidth="1.5"
                style={{
                  transition: "fill 380ms ease, stroke 380ms ease",
                  filter: isActive
                    ? `drop-shadow(0 0 16px ${D.accent})`
                    : "none",
                }}
              />
              <text
                x={x}
                y={y + 5}
                textAnchor="middle"
                fontFamily={D.mono}
                fontSize="14"
                fontWeight="700"
                letterSpacing="1.4"
                fill={isActive ? "#fff" : "rgba(255,255,255,0.55)"}
                style={{ transition: "fill 380ms ease" }}
              >
                {String(s.step).padStart(2, "0")}
              </text>
            </g>
          );
        })}

        {/* 펄스 코어 */}
        {seen && (
          <>
            <circle
              cx={pulseX}
              cy={pulseY}
              r="6"
              fill={D.accent}
              style={{ transition: "none" }}
            />
            <circle
              cx={pulseX}
              cy={pulseY}
              r="3"
              fill="#fff"
              style={{ transition: "none" }}
            />
          </>
        )}
      </svg>

      {/* 외곽 라벨 — 각 노드 바깥에 stage 이름 */}
      {stages.map((s, i) => {
        const angle = startAngle + (i / N) * TWO_PI;
        // 라벨은 노드보다 살짝 더 바깥 (R+44)
        const labelR = R + 44;
        const xPct = ((C + labelR * Math.cos(angle)) / VB) * 100;
        const yPct = ((C + labelR * Math.sin(angle)) / VB) * 100;
        // 사분면별로 정렬축을 다르게
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        let translateX = -50;
        let textAlign: "left" | "right" | "center" = "center";
        if (cosA > 0.45) {
          translateX = 0;
          textAlign = "left";
        } else if (cosA < -0.45) {
          translateX = -100;
          textAlign = "right";
        }
        let translateY = -50;
        if (Math.abs(cosA) <= 0.45) {
          translateY = sinA < 0 ? -100 : 0;
        }
        const a = nodeActivation(i);
        const isActive = a > 0.4;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${xPct}%`,
              top: `${yPct}%`,
              transform: `translate(${translateX}%, ${translateY}%)`,
              textAlign,
              maxWidth: 140,
              pointerEvents: "none",
              opacity: lerp(0.55, 1, a),
              transition: "opacity 380ms ease",
            }}
          >
            <div
              style={{
                fontFamily: D.mono,
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: isActive ? D.accent : "rgba(255,255,255,0.4)",
                transition: "color 380ms ease",
              }}
            >
              {s.name_en
                ? s.name_en
                : `STEP ${String(s.step).padStart(2, "0")}`}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                letterSpacing: "-0.01em",
                lineHeight: 1.3,
                wordBreak: "keep-all",
              }}
            >
              {s.name}
            </div>
          </div>
        );
      })}

      {/* 중앙 — 활성 노드의 상세 (cross-fade) */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "48%",
          maxWidth: 220,
          textAlign: "center",
          pointerEvents: "none",
        }}
      >
        <div
          aria-hidden
          style={{
            fontFamily: D.mono,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.45)",
          }}
        >
          ↻ CYCLE
        </div>
        <div style={{ position: "relative", minHeight: 110, marginTop: 14 }}>
          {stages.map((s, i) => {
            const a = nodeActivation(i);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: a,
                  transition: "opacity 380ms ease",
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(15px, 1.6vw, 18px)",
                    fontWeight: 700,
                    color: "#fff",
                    letterSpacing: "-0.015em",
                    lineHeight: 1.25,
                    wordBreak: "keep-all",
                  }}
                >
                  {s.name}
                </div>
                <div
                  style={{
                    marginTop: 10,
                    fontSize: 12,
                    lineHeight: 1.55,
                    color: "rgba(255,255,255,0.6)",
                    letterSpacing: "-0.005em",
                    wordBreak: "keep-all",
                  }}
                >
                  {s.user_case}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CoreMechanismBlock({ m }: { m: CoreMechanism }) {
  const rows: Array<{ k: string; v: string }> = [
    { k: "안전한 행동", v: m.safe_action },
    { k: "회피되는 행동", v: m.avoided_action },
    { k: "회피 메커니즘", v: m.avoidance_mechanism },
    { k: "가장 강한 두려움", v: m.strongest_fear },
    { k: "두 번째 두려움", v: m.second_fear },
    { k: "핵심 행동", v: m.core_behavior },
  ];
  return (
    <div
      style={{
        marginTop: 24,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: 0,
      }}
    >
      {rows.map((r, i) => (
        <div
          key={i}
          style={{
            padding: "20px 0",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <Mono size={10} color="rgba(255,255,255,0.45)" tracking={0.16}>
            {r.k}
          </Mono>
          <div
            style={{
              marginTop: 8,
              fontSize: "clamp(15px, 1.5vw, 17px)",
              fontWeight: 600,
              color: "#fff",
              letterSpacing: "-0.01em",
              lineHeight: 1.5,
              textWrap: "pretty",
              paddingRight: 20,
            }}
          >
            {r.v}
          </div>
        </div>
      ))}
    </div>
  );
}

// ───────── COGNITIVE DISTORTIONS ───────── //
function DistortionsSection({
  distortions,
  meta,
}: {
  distortions: CognitiveDistortion[];
  meta?: CognitiveDistortionMeta;
}) {
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
          COGNITIVE DISTORTIONS · 인지 왜곡
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
          {distortions.length}가지 왜곡이
          <br />
          동시에 작동하고 있어요.
        </h2>
      </Reveal>
      <Reveal delay={260}>
        <p
          style={{
            margin: "24px 0 0",
            maxWidth: 640,
            fontSize: "clamp(15px, 1.5vw, 18px)",
            lineHeight: 1.65,
            color: D.text2,
            letterSpacing: "-0.005em",
            fontWeight: 400,
            textWrap: "pretty",
          }}
        >
          당신의 답변에서 다음 {distortions.length}가지 인지 왜곡이 함께
          관찰됐어요. SEVERITY · FREQUENCY 막대를 보면 가장 먼저 다룰 왜곡이
          어디에 있는지 보입니다.
        </p>
      </Reveal>

      {/* Meta strip */}
      {meta && (
        <Reveal delay={360}>
          <div
            style={{
              marginTop: 56,
              padding: "20px 0",
              borderTop: `1px solid ${D.hair2}`,
              borderBottom: `1px solid ${D.hair2}`,
              display: "flex",
              gap: "clamp(20px, 4vw, 64px)",
              flexWrap: "wrap",
            }}
          >
            {typeof meta.observed === "number" && (
              <div>
                <Mono size={10} color={D.text3} tracking={0.18}>
                  OBSERVED
                </Mono>
                <div
                  style={{
                    marginTop: 6,
                    fontFamily: D.font,
                    fontSize: 22,
                    fontWeight: 700,
                    color: D.ink,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {meta.observed}
                  {typeof meta.total_known === "number" && (
                    <span style={{ color: D.text3, fontWeight: 500 }}>
                      /{meta.total_known}
                    </span>
                  )}
                </div>
              </div>
            )}
            {typeof meta.cooccurrence === "number" && (
              <div>
                <Mono size={10} color={D.text3} tracking={0.18}>
                  CO-OCCURRENCE
                </Mono>
                <div
                  style={{
                    marginTop: 6,
                    fontFamily: D.font,
                    fontSize: 22,
                    fontWeight: 700,
                    color: D.ink,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {Math.round(meta.cooccurrence * 100)}
                  <span style={{ color: D.text3, fontWeight: 500 }}>%</span>
                </div>
              </div>
            )}
          </div>
        </Reveal>
      )}

      <div style={{ marginTop: 56 }}>
        {distortions.map((d, i) => (
          <Reveal key={i} delay={i * 80}>
            <div
              style={{
                padding: "40px 0",
                borderTop: `1px solid ${D.hair2}`,
                ...(i === distortions.length - 1
                  ? { borderBottom: `1px solid ${D.hair2}` }
                  : {}),
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(60px, 80px) 1fr",
                  gap: "clamp(20px, 4vw, 40px)",
                  alignItems: "baseline",
                }}
              >
                <div>
                  <Mono size={13} color={D.ink} tracking={0.06} weight={600}>
                    {String(i + 1).padStart(2, "0")}
                  </Mono>
                </div>
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "clamp(20px, 2.4vw, 28px)",
                        fontWeight: 700,
                        color: D.ink,
                        letterSpacing: "-0.025em",
                        lineHeight: 1.2,
                      }}
                    >
                      {d.name_ko}
                    </span>
                    <Mono size={11} color={D.text3} tracking={0.12}>
                      {d.name_en}
                    </Mono>
                  </div>
                  {/* Quote */}
                  <p
                    style={{
                      margin: "20px 0 0",
                      fontSize: "clamp(15px, 1.5vw, 17px)",
                      lineHeight: 1.55,
                      color: D.ink,
                      letterSpacing: "-0.005em",
                      fontStyle: "italic",
                      fontWeight: 500,
                      textWrap: "pretty",
                    }}
                  >
                    &ldquo;{d.quote}&rdquo;
                  </p>
                  {/* Interpretation */}
                  <p
                    style={{
                      margin: "12px 0 0",
                      fontSize: "clamp(14px, 1.4vw, 16px)",
                      lineHeight: 1.7,
                      color: D.text2,
                      letterSpacing: "-0.005em",
                      fontWeight: 400,
                      textWrap: "pretty",
                    }}
                  >
                    {d.interpretation}
                  </p>

                  {/* Severity / Frequency bars */}
                  {(typeof d.severity === "number" ||
                    typeof d.frequency === "number") && (
                    <div
                      style={{
                        marginTop: 24,
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(180px, 1fr))",
                        gap: 24,
                      }}
                    >
                      {typeof d.severity === "number" && (
                        <MeterBar
                          label="SEVERITY"
                          value={d.severity}
                          tone="risk"
                        />
                      )}
                      {typeof d.frequency === "number" && (
                        <MeterBar
                          label="FREQUENCY"
                          value={d.frequency}
                          tone="ink"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {/* Implication footer (optional) */}
      {meta?.implication && (
        <Reveal delay={400}>
          <div
            style={{
              marginTop: 48,
              padding: "28px 32px",
              background: D.dark,
              color: "#fff",
              borderRadius: 12,
            }}
          >
            <Mono size={10} color={D.accent} tracking={0.22}>
              IMPLICATION · 한 줄 정리
            </Mono>
            <p
              style={{
                margin: "12px 0 0",
                fontSize: "clamp(15px, 1.5vw, 18px)",
                lineHeight: 1.6,
                color: "#fff",
                letterSpacing: "-0.005em",
                fontWeight: 500,
                textWrap: "pretty",
              }}
            >
              {meta.implication}
            </p>
          </div>
        </Reveal>
      )}
    </section>
  );
}

function MeterBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "risk" | "ink";
}) {
  const [ref, seen] = useInView<HTMLDivElement>(0.3);
  const t = useTimeline(seen, 1200);
  const w = clamp(value, 0, 1) * t * 100;
  const color = tone === "risk" ? D.risk : D.ink;
  return (
    <div ref={ref}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <Mono size={10} color={D.text3} tracking={0.16}>
          {label}
        </Mono>
        <Mono size={10} color={color} tracking={0.06} weight={600}>
          {Math.round(value * 100)}
        </Mono>
      </div>
      <div
        style={{
          marginTop: 8,
          height: 4,
          borderRadius: 2,
          background: D.hair2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${w}%`,
            height: "100%",
            background: color,
            borderRadius: 2,
          }}
        />
      </div>
    </div>
  );
}

// ───────── RESHAPE PREVIEW + CTA ───────── //
function ReshapeSection({
  preview,
  onNext,
}: {
  preview: DestroyRebuildPreview;
  onNext: () => void;
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
          <Mono size={11} color={D.accent} tracking={0.22}>
            RESHAPE · 다시 빚기
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
            {RESHAPE_HEAD[0]}
            <br />
            {RESHAPE_HEAD[1]}
          </h2>
        </Reveal>

        <div
          style={{
            marginTop: 48,
            maxWidth: 720,
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          {RESHAPE_BODY.map((p, i) => (
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
        </div>

        {/* Targets — 다음 챕터에서 다룰 명제 / 자동사고 / 체크리스트 */}
        <Reveal delay={300}>
          <div
            style={{
              marginTop: 80,
              paddingTop: 32,
              borderTop: `1px solid ${D.hair2}`,
            }}
          >
            <Mono size={10} color={D.text3} tracking={0.2}>
              NEXT TARGETS · 다음 챕터에서 다룰 것
            </Mono>
            <div style={{ marginTop: 24 }}>
              {preview.keyword_propositions.map((kp, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(48px, 56px) 1fr",
                    gap: 20,
                    alignItems: "baseline",
                    padding: "20px 0",
                    borderTop: `1px solid ${D.hair3}`,
                  }}
                >
                  <Mono size={11} color={D.accent} tracking={0.06} weight={600}>
                    K.{i + 1}
                  </Mono>
                  <div
                    style={{
                      fontSize: "clamp(16px, 1.7vw, 19px)",
                      fontWeight: 600,
                      color: D.ink,
                      letterSpacing: "-0.015em",
                      lineHeight: 1.5,
                      fontStyle: "italic",
                    }}
                  >
                    &ldquo;{kp}&rdquo;
                  </div>
                </div>
              ))}
              {preview.target_automatic_thought && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(48px, 56px) 1fr",
                    gap: 20,
                    alignItems: "baseline",
                    padding: "20px 0",
                    borderTop: `1px solid ${D.hair3}`,
                  }}
                >
                  <Mono size={11} color={D.text3} tracking={0.06} weight={500}>
                    AT
                  </Mono>
                  <div>
                    <Mono size={10} color={D.text3} tracking={0.16}>
                      자동사고 — 다시 검증할 한 줄
                    </Mono>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: "clamp(15px, 1.5vw, 17px)",
                        color: D.ink,
                        fontWeight: 500,
                        letterSpacing: "-0.005em",
                        lineHeight: 1.55,
                      }}
                    >
                      {preview.target_automatic_thought}
                    </div>
                  </div>
                </div>
              )}
              {preview.target_checklist_item && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(48px, 56px) 1fr",
                    gap: 20,
                    alignItems: "baseline",
                    padding: "20px 0",
                    borderTop: `1px solid ${D.hair3}`,
                    borderBottom: `1px solid ${D.hair3}`,
                  }}
                >
                  <Mono size={11} color={D.text3} tracking={0.06} weight={500}>
                    CL
                  </Mono>
                  <div>
                    <Mono size={10} color={D.text3} tracking={0.16}>
                      체크리스트 — 함께 다시 볼 항목
                    </Mono>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: "clamp(15px, 1.5vw, 17px)",
                        color: D.ink,
                        fontWeight: 500,
                        letterSpacing: "-0.005em",
                        lineHeight: 1.55,
                      }}
                    >
                      {preview.target_checklist_item}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Reveal>

        <Reveal delay={420}>
          <p
            style={{
              margin: "56px 0 0",
              maxWidth: 720,
              fontSize: "clamp(16px, 1.6vw, 20px)",
              lineHeight: 1.6,
              color: D.ink,
              letterSpacing: "-0.01em",
              fontWeight: 600,
              textWrap: "pretty",
            }}
          >
            {RESHAPE_EMPH}
          </p>
        </Reveal>

        <Reveal delay={520}>
          <div
            style={{
              marginTop: 56,
              paddingTop: 32,
              borderTop: `1px solid ${D.hair2}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 20,
            }}
          >
            <Mono size={10} color={D.text3} tracking={0.18}>
              FIG · INTEGRATION COMPLETE
            </Mono>
            <button
              type="button"
              onClick={onNext}
              style={{
                fontFamily: D.font,
                fontWeight: 600,
                fontSize: 15,
                color: "#fff",
                background: D.ink,
                border: "none",
                borderRadius: 999,
                padding: "14px 28px",
                cursor: "pointer",
                letterSpacing: "-0.005em",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                boxShadow: "0 12px 28px -12px rgba(0,0,0,0.30)",
              }}
            >
              핵심 믿음 검증하러 가기
              <span style={{ fontFamily: D.mono, fontSize: 14 }}>→</span>
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ───────── LOADING / ERROR ───────── //
function LoadingState({ messageIndex }: { messageIndex: number }) {
  const total = LOADING_MESSAGES.length;
  const message = LOADING_MESSAGES[messageIndex] ?? LOADING_MESSAGES[0];
  const progress = ((messageIndex + 1) / total) * 100;

  return (
    <div
      style={{
        background: D.bgAlt,
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 480, width: "100%" }}>
        <Mono size={11} color={D.text3} tracking={0.18}>
          COGNITIVE PATTERN · ANALYZING
        </Mono>
        <div
          style={{
            margin: "32px auto 0",
            width: "min(280px, 80vw)",
            height: 56,
            borderRadius: 8,
            background: D.hair3,
            animation: "diag-pulse 1.6s ease-in-out infinite",
          }}
        />
        <p
          key={messageIndex}
          style={{
            margin: "32px 0 0",
            fontSize: 14,
            color: D.text,
            letterSpacing: "-0.005em",
            fontWeight: 500,
            transition: "opacity 320ms ease",
          }}
        >
          {message}
        </p>
        <div
          style={{
            margin: "20px auto 0",
            width: 200,
            height: 2,
            borderRadius: 1,
            background: D.hair2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: D.ink,
              transition: "width 500ms ease",
            }}
          />
        </div>
        <p
          style={{
            margin: "16px 0 0",
            fontSize: 13,
            color: D.text3,
            letterSpacing: "-0.005em",
          }}
        >
          자동사고와 SCT 응답을 통합 분석하고 있어요. 최대 30초까지 걸릴 수 있어요.
        </p>
        <style>{`
          @keyframes diag-pulse {
            0%, 100% { opacity: 0.55; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      style={{
        background: D.bgAlt,
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <Mono size={11} color={D.risk} tracking={0.18}>
          ERROR · 분석 불러오기 실패
        </Mono>
        <p
          style={{
            margin: "24px 0 0",
            fontSize: 16,
            color: D.text,
            letterSpacing: "-0.005em",
            lineHeight: 1.55,
            fontWeight: 500,
          }}
        >
          {message}
        </p>
        <button
          type="button"
          onClick={onRetry}
          style={{
            marginTop: 28,
            fontFamily: D.font,
            fontSize: 13,
            fontWeight: 600,
            color: D.ink,
            background: D.paper,
            border: `1px solid ${D.ink}`,
            borderRadius: 999,
            padding: "10px 24px",
            cursor: "pointer",
            letterSpacing: "-0.005em",
          }}
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}

// ───────── PAGE ───────── //
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
  const cancelledRef = useRef(false);

  // 로딩 메시지 사이클
  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => {
      setLoadingMessageIndex((i) =>
        Math.min(i + 1, LOADING_MESSAGES.length - 1)
      );
    }, LOADING_INTERVAL_MS);
    return () => clearInterval(id);
  }, [loading]);

  const fetchReport = () => {
    cancelledRef.current = false;
    setLoading(true);
    setError("");
    setLoadingMessageIndex(0);
    (async () => {
      try {
        const res = await fetch("/api/self-workshop/analyze-mechanism", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workshopId }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error ?? "분석에 실패했습니다");
        if (cancelledRef.current) return;
        if (isAnalysisReport(data.report)) {
          setReport(data.report);
        } else {
          setError("분석 결과 형식이 올바르지 않습니다");
        }
      } catch (err: unknown) {
        if (!cancelledRef.current) {
          setError(err instanceof Error ? err.message : "오류가 발생했습니다");
        }
      } finally {
        if (!cancelledRef.current) setLoading(false);
      }
    })();
  };

  useEffect(() => {
    if (initialReport) return;
    fetchReport();
    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workshopId]);

  if (loading) return <LoadingState messageIndex={loadingMessageIndex} />;
  if (error || !report) {
    return (
      <ErrorState
        message={error || "리포트를 불러오지 못했어요"}
        onRetry={fetchReport}
      />
    );
  }

  const caseId = deriveCaseId(workshopId);
  const displayName = (userName ?? "").trim();
  const today = formatDate(new Date().toISOString());

  return (
    <div
      style={{
        background: D.bg,
        color: D.text,
        fontFamily: D.font,
      }}
    >
      <Hero caseId={caseId} userName={displayName} today={today} />
      <OverviewSection />
      <CascadeSection summary={report.situation_summary} />
      <KeywordsSection keywords={report.belief_keywords} />
      <AchievementLoopSection loop={report.achievement_loop} />
      <DistortionsSection
        distortions={report.cognitive_distortions}
        meta={report.cognitive_distortions_meta}
      />
      <ReshapeSection
        preview={report.destroy_rebuild_preview}
        onNext={() => router.push("/dashboard/self-workshop/step/6")}
      />
    </div>
  );
}
