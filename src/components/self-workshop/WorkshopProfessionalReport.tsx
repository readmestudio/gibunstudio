"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isProfessionalReport,
  type ProfessionalReport,
} from "@/lib/self-workshop/professional-report";
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
  savedReport?: unknown;
  userName?: string | null;
}

// ───────── 변화 여정 5-노드 (Escape Loop) ───────── //
// Step 2 의 4-노드 닫힌 고리에 EXIT 노드를 추가해 펄스가 빠져나가는 경로를 만든다.
// 의미: 같은 회로 + 다른 출구.
const ESCAPE_STAGES = [
  {
    stage: "01",
    label: "TRIGGER",
    ko: "트리거",
    hint: "같은 신호가 들어와도",
    detail: "발표 전, 마감 직전, 평가 시즌 — 익숙한 신호는 여전히 들어옵니다.",
  },
  {
    stage: "02",
    label: "AUTO-THOUGHT",
    ko: "자동사고",
    hint: "옛 사고가 먼저 떠오르더라도",
    detail: '"이번에도 못 해내면…"이 1초 안에 떠올라도, 더 이상 그게 끝이 아닙니다.',
  },
  {
    stage: "03",
    label: "PATTERN",
    ko: "행동 패턴",
    hint: "옛 패턴이 손을 뻗어와도",
    detail: "더 무리해서 일하기 · 잠 줄이기 — 익숙한 손짓을 알아챕니다.",
  },
  {
    stage: "04",
    label: "CORE BELIEF",
    ko: "옛 핵심 믿음",
    hint: "여기서 멈추지 않고",
    detail: '"내 가치는 결과로만 증명된다" — 이 자리에서 한 번 더 쓰지 않습니다.',
  },
  {
    stage: "EX",
    label: "EXIT",
    ko: "새 신념",
    hint: "다른 출구로 빠져나갑니다",
    detail: "옛 고리를 인지하고, 새 핵심 신념과 일관된 행동을 한 가지 골라 둡니다.",
  },
] as const;

const HERO_SUB =
  "지금까지 적어 주신 모든 흐름을 한 분의 상담사가 모아 정리해 드린 리포트예요. 당신의 언어 그대로, 그러나 한 발짝 떨어져서 본 흐름입니다.";

const INTRO_HEAD = "여기까지 함께 와주셨어요.";

const PRACTICE_HEAD = "다음 한 달, 이렇게 살아보세요.";

const TRANSFORM_FOOT_LEFT = "↻ 같은 고리, 다른 출구";
const TRANSFORM_FOOT_RIGHT = "워크북 = 새 신념을 지키는 일상의 컴퍼스";

const CLOSING_TITLE = [
  "여기까지 정말 잘 오셨어요.",
  "이제 마지막 한 걸음만 남았습니다.",
];
const CLOSING_BODY = [
  "이 리포트는 한 번 읽고 닫는 글이 아니에요. 다음 한 달, 트리거가 들어올 때마다 펼쳐 보면서 다섯 번째 노드—새 신념—로 손이 가도록 설계됐습니다.",
  "마지막 화면에서는 이 여정 전체를 한 줄씩 짚으며 마무리합니다. 짧지만 가장 또렷한 단계예요.",
];
const CLOSING_EMPH =
  "고리를 알아차린 사람만이 다른 출구를 찾을 수 있습니다. 이미 그 자리에 와 계세요.";

// ───────── LOCAL GLYPHS ───────── //
function CheckGlyph({ size = 18, color = D.ink }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path
        d="M5 12.5 L10 17.5 L19 7"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossGlyph({ size = 18, color = D.risk }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path
        d="M6 6 L18 18 M18 6 L6 18"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ───────── HERO ───────── //
function Hero({
  caseId,
  userName,
  generatedAt,
}: {
  caseId: string;
  userName: string;
  generatedAt: string;
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
            FIG 02 / 02 · COUNSELOR REPORT
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
          {generatedAt && (
            <>
              <span style={{ width: 1, height: 10, background: D.hair }} />
              <Mono size={10} color={D.text3} tracking={0.16}>
                {generatedAt}
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
          당신의 워크북,
          <br />
          정리됐어요.
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

// ───────── INTRODUCTION ───────── //
function IntroSection({ report }: { report: ProfessionalReport }) {
  const greetingParas = splitParagraphs(report.intro.greeting);
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
            INTRODUCTION · 시작하며
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
          {INTRO_HEAD}
        </h2>
      </Reveal>

      <div
        style={{
          marginTop: 56,
          display: "flex",
          flexDirection: "column",
          gap: 24,
          maxWidth: 720,
        }}
      >
        {greetingParas.map((p, i) => (
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
                whiteSpace: "pre-line",
              }}
            >
              {p}
            </p>
          </Reveal>
        ))}
      </div>

      {/* DIAGNOSIS RECAP — inset 좌측 룰 (카드 박스 X) */}
      <Reveal delay={240}>
        <div
          style={{
            marginTop: 56,
            paddingLeft: 16,
            borderLeft: `1px solid ${D.hair}`,
            maxWidth: 720,
          }}
        >
          <Mono size={10} color={D.text3} tracking={0.18}>
            DIAGNOSIS RECAP · 진단 요약
          </Mono>
          <p
            style={{
              margin: "12px 0 0",
              fontSize: "clamp(15px, 1.45vw, 17px)",
              lineHeight: 1.7,
              color: D.text2,
              letterSpacing: "-0.005em",
              fontWeight: 400,
              textWrap: "pretty",
              whiteSpace: "pre-line",
            }}
          >
            {report.intro.diagnosis_summary}
          </p>
        </div>
      </Reveal>
    </section>
  );
}

// ───────── ANALYSIS ───────── //
function AnalysisSection({ report }: { report: ProfessionalReport }) {
  const bodyParas = splitParagraphs(report.analysis.body);
  const quotes = report.analysis.cognitive_error_quotes ?? [];
  const hasQuotes = quotes.length > 0;

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
        style={{
          maxWidth: COL + 96,
          margin: "0 auto",
          padding: "0 48px",
        }}
      >
        <Reveal>
          <Mono size={11} color={D.text3} tracking={0.22}>
            ANALYSIS · 패턴 분석
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
            {report.analysis.headline}
          </h2>
        </Reveal>

        <div
          style={{
            marginTop: 56,
            display: "flex",
            flexDirection: "column",
            gap: 28,
            maxWidth: 720,
          }}
        >
          {bodyParas.map((p, i) => (
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
                  whiteSpace: "pre-line",
                }}
              >
                {p}
              </p>
            </Reveal>
          ))}
        </div>

        {hasQuotes && (
          <div style={{ marginTop: 88, maxWidth: 760 }}>
            <Reveal>
              <Mono size={10} color={D.text3} tracking={0.2}>
                자주 떠올랐던 생각들 · YOUR OWN WORDS
              </Mono>
            </Reveal>
            <div style={{ marginTop: 24 }}>
              {quotes.map((q, i) => (
                <Reveal key={i} delay={i * 100}>
                  <div
                    style={{
                      padding: "32px 0",
                      borderTop: `1px solid ${D.hair2}`,
                      ...(i === quotes.length - 1
                        ? { borderBottom: `1px solid ${D.hair2}` }
                        : {}),
                      textAlign: "center",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: "clamp(17px, 1.8vw, 22px)",
                        lineHeight: 1.55,
                        color: D.ink,
                        letterSpacing: "-0.015em",
                        fontStyle: "italic",
                        fontWeight: 500,
                        textWrap: "balance",
                      }}
                    >
                      &ldquo;{q}&rdquo;
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ───────── TRANSFORMATION (Escape Loop) ───────── //
function TransformationSection({ report }: { report: ProfessionalReport }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.25);
  const t = useTimeline(seen, 10000, 0, true); // 10s 사이클
  const bodyParas = splitParagraphs(report.transformation.body);
  const N = ESCAPE_STAGES.length; // 5

  function nodeActivation(i: number) {
    // 마지막(i = N-1)은 EXIT — 펄스가 잠시 머무는 구간을 길게
    const phaseStart = i / N;
    const phaseEnd = (i + 1) / N;
    const center = (phaseStart + phaseEnd) / 2;
    const dist = Math.abs(t - center);
    const wrapped = Math.min(dist, 1 - dist);
    const span = (1 / N) * (i === N - 1 ? 0.95 : 0.7);
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
              TRANSFORMATION · 변화의 여정
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
              maxWidth: 760,
            }}
          >
            {report.transformation.headline}
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
          {bodyParas.map((p, i) => (
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

        {/* Escape Loop diagram */}
        <div
          style={{
            marginTop: 96,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {/* 중앙 척추 — 04 까지 점선, EXIT 까지는 solid accent */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 28,
              bottom: "calc(20% + 28px)",
              width: 1,
              marginLeft: -0.5,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.18) 8%, rgba(255,255,255,0.18) 92%, rgba(255,255,255,0.02) 100%)",
              pointerEvents: "none",
            }}
          />
          {/* 04 → EXIT 구간만 solid accent — "출구" 의미 강조 */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: 28,
              width: 1,
              marginLeft: -0.5,
              height: "20%",
              background: `linear-gradient(180deg, rgba(255,90,31,0.0) 0%, ${D.accent} 50%, rgba(255,90,31,0.0) 100%)`,
              boxShadow: `0 0 12px ${D.accent}`,
              pointerEvents: "none",
            }}
          />

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

          {ESCAPE_STAGES.map((s, i) => {
            const a = nodeActivation(i);
            const isActive = a > 0.4;
            const isExit = i === N - 1;
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
                    {isExit ? "EXIT" : `STEP ${s.stage}`} · {s.label}
                  </Mono>
                  <div
                    style={{
                      marginTop: 10,
                      fontSize: "clamp(22px, 3vw, 32px)",
                      fontWeight: 700,
                      color: isExit && isActive ? D.accent : "#fff",
                      letterSpacing: "-0.025em",
                      lineHeight: 1.1,
                      transition: "color 380ms ease",
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
                      width: isExit ? 76 : 64,
                      height: isExit ? 76 : 64,
                      borderRadius: isExit ? 38 : 32,
                      background: isActive
                        ? D.accent
                        : isExit
                          ? "rgba(255,90,31,0.12)"
                          : "rgba(255,255,255,0.04)",
                      border: `1.5px solid ${
                        isActive
                          ? D.accent
                          : isExit
                            ? "rgba(255,90,31,0.45)"
                            : "rgba(255,255,255,0.20)"
                      }`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition:
                        "background 380ms ease, border-color 380ms ease, box-shadow 380ms ease",
                      boxShadow: isActive
                        ? `0 0 0 ${a * 12}px rgba(255,90,31,0.10), 0 0 ${
                            isExit ? 60 : 40
                          }px ${D.accent}`
                        : "0 0 0 0 transparent",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: -10,
                        borderRadius: 50,
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
                        fontSize: isExit ? 12 : 14,
                        color: isActive ? "#fff" : "rgba(255,255,255,0.5)",
                        letterSpacing: "0.04em",
                      }}
                    >
                      {isExit ? "EXIT" : s.stage}
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
                    color: isExit && isActive ? D.accent : "rgba(255,255,255,0.5)",
                    fontStyle: "italic",
                    letterSpacing: "-0.005em",
                    transform: `translateX(${(i % 2 === 0 ? 1 : -1) * (1 - a) * 10}px)`,
                    transition: "color 380ms ease",
                  }}
                >
                  {s.hint}
                </div>

                {/* 노드 사이 화살표 — 04 → EXIT 는 accent 컬러 */}
                {i < ESCAPE_STAGES.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      bottom: -12,
                      transform: "translateX(-50%)",
                      color:
                        i === ESCAPE_STAGES.length - 2
                          ? D.accent
                          : "rgba(255,255,255,0.25)",
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
              {TRANSFORM_FOOT_LEFT}
            </Mono>
            <Mono size={11} color={D.accent} tracking={0.18}>
              {TRANSFORM_FOOT_RIGHT}
            </Mono>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ───────── PRACTICE COMPASS · DO & DON'T ───────── //
function PracticeSection({ report }: { report: ProfessionalReport }) {
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
          PRACTICE · 일상에서 챙길 것
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
          {PRACTICE_HEAD}
        </h2>
      </Reveal>

      {/* DO */}
      <div style={{ marginTop: 80 }}>
        <Reveal>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              aria-hidden
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
                borderRadius: 11,
                background: D.ink,
              }}
            >
              <CheckGlyph size={14} color="#fff" />
            </span>
            <Mono size={11} color={D.ink} tracking={0.2}>
              DO · 새 신념을 지키는 행동
            </Mono>
          </div>
        </Reveal>
        <div style={{ marginTop: 24 }}>
          {report.do_donts.dos.map((item, i) => (
            <Reveal key={i} delay={i * 60}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(48px, 56px) 1fr 28px",
                  gap: 20,
                  alignItems: "baseline",
                  padding: "28px 0",
                  borderTop: `1px solid ${D.hair2}`,
                  ...(i === report.do_donts.dos.length - 1
                    ? { borderBottom: `1px solid ${D.hair2}` }
                    : {}),
                }}
              >
                <Mono size={13} color={D.ink} tracking={0.06} weight={600}>
                  0{i + 1}
                </Mono>
                <div>
                  <div
                    style={{
                      fontSize: "clamp(16px, 1.7vw, 19px)",
                      fontWeight: 700,
                      color: D.ink,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.35,
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: "clamp(14px, 1.4vw, 16px)",
                      lineHeight: 1.7,
                      color: D.text2,
                      letterSpacing: "-0.005em",
                      fontWeight: 400,
                      textWrap: "pretty",
                    }}
                  >
                    {item.description}
                  </div>
                </div>
                <div style={{ alignSelf: "start", paddingTop: 4 }}>
                  <CheckGlyph size={20} color={D.ink} />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* DON'T */}
      <div style={{ marginTop: 80 }}>
        <Reveal>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              aria-hidden
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 22,
                height: 22,
                borderRadius: 11,
                background: D.riskSoft,
                border: `1px solid ${D.risk}`,
              }}
            >
              <CrossGlyph size={12} color={D.risk} />
            </span>
            <Mono size={11} color={D.risk} tracking={0.2}>
              DON&apos;T · 옛 신념을 강화하는 행동
            </Mono>
          </div>
        </Reveal>
        <div style={{ marginTop: 24 }}>
          {report.do_donts.donts.map((item, i) => (
            <Reveal key={i} delay={i * 60}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(48px, 56px) 1fr 28px",
                  gap: 20,
                  alignItems: "baseline",
                  padding: "28px 0",
                  borderTop: `1px solid ${D.hair2}`,
                  ...(i === report.do_donts.donts.length - 1
                    ? { borderBottom: `1px solid ${D.hair2}` }
                    : {}),
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 3,
                      background: D.risk,
                      display: "inline-block",
                    }}
                  />
                  <Mono size={13} color={D.risk} tracking={0.06} weight={600}>
                    0{i + 1}
                  </Mono>
                </span>
                <div>
                  <div
                    style={{
                      fontSize: "clamp(16px, 1.7vw, 19px)",
                      fontWeight: 700,
                      color: D.ink,
                      letterSpacing: "-0.02em",
                      lineHeight: 1.35,
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: "clamp(14px, 1.4vw, 16px)",
                      lineHeight: 1.7,
                      color: D.text2,
                      letterSpacing: "-0.005em",
                      fontWeight: 400,
                      textWrap: "pretty",
                    }}
                  >
                    {item.description}
                  </div>
                </div>
                <div style={{ alignSelf: "start", paddingTop: 4 }}>
                  <CrossGlyph size={20} color={D.risk} />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────── CLOSING + CTA ───────── //
function ClosingSection({ onNext }: { onNext: () => void }) {
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

        <Reveal delay={420}>
          <div
            style={{
              marginTop: 96,
              paddingTop: 40,
              borderTop: `1px solid ${D.hair2}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 20,
            }}
          >
            <Mono size={10} color={D.text3} tracking={0.18}>
              FIG 02 / 02 · REPORT COMPLETE
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
                transition: "opacity 200ms ease",
              }}
            >
              마무리 성찰
              <span style={{ fontFamily: D.mono, fontSize: 14 }}>→</span>
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ───────── LOADING / ERROR ───────── //
function LoadingState() {
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
      <div style={{ textAlign: "center" }}>
        <Mono size={11} color={D.text3} tracking={0.18}>
          PROFESSIONAL REPORT · GENERATING
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
          style={{
            margin: "32px 0 0",
            fontSize: 14,
            color: D.text,
            letterSpacing: "-0.005em",
            fontWeight: 500,
          }}
        >
          상담사가 리포트를 작성하고 있어요…
        </p>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 13,
            color: D.text3,
            letterSpacing: "-0.005em",
          }}
        >
          약 10–20초 정도 걸려요
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
          ERROR · 리포트 불러오기 실패
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
export function WorkshopProfessionalReport({
  workshopId,
  savedReport,
  userName,
}: Props) {
  const router = useRouter();
  const initial = isProfessionalReport(savedReport) ? savedReport : null;
  const [report, setReport] = useState<ProfessionalReport | null>(initial);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState("");
  const cancelledRef = useRef(false);

  const fetchReport = () => {
    cancelledRef.current = false;
    setLoading(true);
    setError("");
    (async () => {
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
        if (cancelledRef.current) return;
        const next = isProfessionalReport(data?.report)
          ? (data.report as ProfessionalReport)
          : null;
        if (next) setReport(next);
        else setError("리포트 형식이 올바르지 않아요. 잠시 후 다시 시도해 주세요.");
      } catch (err: unknown) {
        if (!cancelledRef.current) {
          setError(err instanceof Error ? err.message : "오류가 발생했어요");
        }
      } finally {
        if (!cancelledRef.current) setLoading(false);
      }
    })();
  };

  useEffect(() => {
    if (initial) return;
    fetchReport();
    return () => {
      cancelledRef.current = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workshopId]);

  if (loading) return <LoadingState />;
  if (error || !report) {
    return (
      <ErrorState
        message={error || "리포트를 불러올 수 없어요."}
        onRetry={fetchReport}
      />
    );
  }

  const caseId = deriveCaseId(workshopId);
  const displayName = (userName ?? "").trim();
  const generatedAt = formatDate(report.generated_at);

  return (
    <div
      style={{
        background: D.bg,
        color: D.text,
        fontFamily: D.font,
      }}
    >
      <Hero caseId={caseId} userName={displayName} generatedAt={generatedAt} />
      <IntroSection report={report} />
      <AnalysisSection report={report} />
      <TransformationSection report={report} />
      <PracticeSection report={report} />
      <ClosingSection
        onNext={() => router.push("/dashboard/self-workshop/step/10")}
      />
    </div>
  );
}
