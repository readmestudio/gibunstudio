"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  extractBeforeAfterSnapshot,
  hasBeliefShiftSummary,
  isProfessionalReport,
  type BeforeAfterSnapshot,
  type BeliefShiftSummary,
  type ProfessionalReport,
} from "@/lib/self-workshop/professional-report";
import { deriveCaseId } from "./clinical-report/shared/deriveCaseId";
import {
  COL,
  D,
  Mono,
  Reveal,
  formatDate,
  splitParagraphs,
  useInView,
} from "./clinical-report/v3-shared";

interface Props {
  workshopId: string;
  savedReport?: unknown;
  /** Step 9 BeliefShiftCards 가 사용 — 1~8단계 사용자 원본 답변들 */
  mechanismAnalysis?: unknown;
  mechanismInsights?: unknown;
  coreBeliefExcavation?: unknown;
  beliefDestroy?: unknown;
  newBelief?: unknown;
  copingPlan?: unknown;
  userName?: string | null;
}

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

// ───────── TRANSFORMATION (BEFORE / AFTER 신념 비교) ───────── //
// 옛 cascade(ESCAPE_STAGES)를 폐기하고, 사용자가 1~8단계에서 직접 적은
// 답변을 BEFORE/AFTER 두 카드로 대비해서 보여준다. Step 9는 정리 화면이므로
// 가공 없이 원문 그대로 노출하는 것이 핵심.
function TransformationSection({
  report,
  snapshot,
  summary,
}: {
  report: ProfessionalReport;
  snapshot: BeforeAfterSnapshot;
  summary: BeliefShiftSummary | null;
}) {
  const [ref] = useInView<HTMLDivElement>(0.25);
  const bodyParas = splitParagraphs(report.transformation.body);

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

        {/* BEFORE / AFTER 비교 카드 — LLM 한 줄 요약 + 클릭 시 원문 펼침 */}
        <BeliefShiftCards snapshot={snapshot} summary={summary} />

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

// ───────── BELIEF SHIFT CARDS — BEFORE / AFTER ───────── //
// 좌(옛 회로) / 우(새 회로) 두 카드 + 항목별 클릭 펼침 disclosure.
// 모든 텍스트는 사용자가 1~8단계에서 직접 적은 답을 그대로(원문) 노출한다.
// 데이터가 비어있는 항목은 회색 hint 로 "(아직 작성하지 않은 답)" 표시.

type ShiftKey =
  | "before-core"
  | "before-trigger"
  | "before-thought"
  | "before-behavior"
  | "after-core"
  | "after-thought"
  | "after-behavior"
  | "after-evidence";

interface ShiftItem {
  key: ShiftKey;
  /** 라벨 — 카드 내 작은 mono */
  label: string;
  /** 사용자가 어느 단계에서 적은 답인지 — 출처 메타 */
  source: string;
  /** 카드 표면에 노출되는 LLM 한 줄 요약 (30~60자). 빈 문자열이면 미작성. */
  summary: string;
  /** 펼침 시 보여줄 사용자 원문 — 가공 없이 작성한 그대로. */
  fullText: string | null;
  /** 펼침 시 추가로 보여줄 부가 텍스트(감정/신체/검증 증거 등) */
  detail?: ReactNode;
  /** 핵심 신념 항목인지 (시각 강조) */
  isCore?: boolean;
}

function emptyHint() {
  return "(아직 작성하지 않은 답)";
}

function BeliefShiftCards({
  snapshot,
  summary,
}: {
  snapshot: BeforeAfterSnapshot;
  summary: BeliefShiftSummary | null;
}) {
  const [open, setOpen] = useState<ShiftKey | null>(null);
  const toggle = (k: ShiftKey) => setOpen((prev) => (prev === k ? null : k));

  const { before, after } = snapshot;
  // LLM 요약이 없으면(옛 캐시) 원문을 폴백으로 그대로 표면에 노출.
  const sb = summary?.before;
  const sa = summary?.after;

  const pickSummary = (llm: string | undefined, fallback: string | null): string => {
    if (typeof llm === "string" && llm.trim().length > 0) return llm.trim();
    return fallback ?? "";
  };

  const beforeItems: ShiftItem[] = [
    {
      key: "before-core",
      label: "옛 핵심 신념",
      source: "Step 4 · 핵심 신념 찾기",
      summary: pickSummary(sb?.core_belief, before.coreBeliefLine),
      fullText: before.coreBeliefLine,
      isCore: true,
      detail: before.howBeliefWorks ? (
        <p style={detailParaStyle}>
          이 신념은 이렇게 작동했어요 — &ldquo;{before.howBeliefWorks}&rdquo;
        </p>
      ) : null,
    },
    {
      key: "before-trigger",
      label: "트리거 (시작 상황)",
      source: "Step 3 · 트리거 → 자동사고",
      summary: pickSummary(sb?.trigger, before.trigger),
      fullText: before.trigger,
      detail: (
        <>
          {before.emotion.primary && (
            <p style={detailParaStyle}>
              감정: <strong>{before.emotion.primary}</strong>
              {before.emotion.intensity != null
                ? ` (강도 ${before.emotion.intensity}/10)`
                : ""}
            </p>
          )}
          {before.emotion.body && (
            <p style={detailParaStyle}>신체 반응: {before.emotion.body}</p>
          )}
        </>
      ),
    },
    {
      key: "before-thought",
      label: "옛 자동사고",
      source: "Step 3 · 트리거 → 자동사고",
      summary: pickSummary(sb?.old_thought, before.oldAutoThought),
      fullText: before.oldAutoThought,
      detail: (
        <>
          {before.worstCase && (
            <p style={detailParaStyle}>
              최악 시나리오 — &ldquo;{before.worstCase}&rdquo;
            </p>
          )}
          {before.cognitiveErrors.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {before.cognitiveErrors.map((err, idx) => (
                <p key={idx} style={detailParaStyle}>
                  · <strong>{err.name}</strong>
                  {err.interpretation ? ` — ${err.interpretation}` : ""}
                </p>
              ))}
            </div>
          )}
        </>
      ),
    },
    {
      key: "before-behavior",
      label: "옛 행동 패턴",
      source: "Step 3 · 트리거 → 자동사고",
      summary: pickSummary(sb?.old_behavior, before.oldBehavior),
      fullText: before.oldBehavior,
    },
  ];

  const afterItems: ShiftItem[] = [
    {
      key: "after-core",
      label: "새 핵심 신념",
      source: "Step 7 · 새 핵심 신념 찾기",
      summary: pickSummary(sa?.new_core_belief, after.newCoreBelief),
      fullText: after.newCoreBelief,
      isCore: true,
      detail: after.whyNewBeliefWorks ? (
        <p style={detailParaStyle}>
          왜 이 신념이 맞나요 — &ldquo;{after.whyNewBeliefWorks}&rdquo;
        </p>
      ) : null,
    },
    {
      key: "after-thought",
      label: "대체 사고",
      source: "Step 8 · 새 신념 강화하기",
      summary: pickSummary(sa?.alternative_thought, after.alternativeThought),
      fullText: after.alternativeThought,
      detail:
        after.counterEvidences.length > 0 ? (
          <div>
            <p style={detailParaStyle}>
              검증 단계에서 모은 반대 증거:
            </p>
            {after.counterEvidences.slice(0, 5).map((ev, idx) => (
              <p key={idx} style={detailParaStyle}>
                · &ldquo;{ev}&rdquo;
              </p>
            ))}
          </div>
        ) : null,
    },
    {
      key: "after-behavior",
      label: "새 행동 · 대처 계획",
      source: "Step 8 · 대처 계획",
      summary: pickSummary(sa?.new_behavior, after.newBehavior),
      fullText: after.newBehavior,
    },
    {
      key: "after-evidence",
      label: "강화 근거",
      source: "Step 8 · 새 신념 강화하기",
      summary: pickSummary(sa?.reinforcement, after.reinforcement),
      fullText: after.reinforcement,
      detail:
        after.avgReinforcedStrength != null ? (
          <p style={detailParaStyle}>
            새 신념의 단단함 (평균): <strong>{after.avgReinforcedStrength}%</strong>
          </p>
        ) : null,
    },
  ];

  return (
    <div style={{ marginTop: 96 }}>
      <Reveal>
        <Mono size={10} color="rgba(255,255,255,0.45)" tracking={0.2}>
          ↳ 한 줄 요약이에요. 항목을 클릭하면 그 단계에서 직접 적은 원문이 펼쳐져요
        </Mono>
      </Reveal>
      <div
        style={{
          marginTop: 24,
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: 24,
          alignItems: "stretch",
        }}
        className="belief-shift-grid"
      >
        <ShiftCard
          variant="before"
          title="BEFORE"
          subtitle="옛 신념"
          items={beforeItems}
          openKey={open}
          onToggle={toggle}
        />
        <ShiftCard
          variant="after"
          title="AFTER"
          subtitle="새 신념"
          items={afterItems}
          openKey={open}
          onToggle={toggle}
        />
      </div>
      <style jsx>{`
        @media (min-width: 880px) {
          .belief-shift-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 24px !important;
          }
        }
      `}</style>
    </div>
  );
}

const detailParaStyle: CSSProperties = {
  margin: "6px 0 0",
  fontSize: 13,
  lineHeight: 1.6,
  color: "rgba(255,255,255,0.7)",
  letterSpacing: "-0.005em",
};

function ShiftCard({
  variant,
  title,
  subtitle,
  items,
  openKey,
  onToggle,
}: {
  variant: "before" | "after";
  title: string;
  subtitle: string;
  items: ShiftItem[];
  openKey: ShiftKey | null;
  onToggle: (k: ShiftKey) => void;
}) {
  const isAfter = variant === "after";
  const accentColor = isAfter ? D.accent : "rgba(255,255,255,0.55)";
  return (
    <div
      style={{
        border: `1px solid ${
          isAfter ? "rgba(255,90,31,0.45)" : "rgba(255,255,255,0.12)"
        }`,
        background: isAfter ? "rgba(255,90,31,0.04)" : "rgba(255,255,255,0.02)",
        borderRadius: 12,
        padding: "32px 28px",
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <Mono size={11} color={accentColor} tracking={0.24}>
          {title}
        </Mono>
        <span
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "-0.005em",
          }}
        >
          · {subtitle}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {items.map((it, idx) => (
          <ShiftRow
            key={it.key}
            item={it}
            isOpen={openKey === it.key}
            isAfter={isAfter}
            onToggle={() => onToggle(it.key)}
            isFirst={idx === 0}
          />
        ))}
      </div>
    </div>
  );
}

function ShiftRow({
  item,
  isOpen,
  isAfter,
  onToggle,
  isFirst,
}: {
  item: ShiftItem;
  isOpen: boolean;
  isAfter: boolean;
  onToggle: () => void;
  isFirst: boolean;
}) {
  const hasSummary = item.summary.trim().length > 0;
  const hasFullText = !!(item.fullText && item.fullText.trim().length > 0);
  const hasDetail = !!item.detail;
  // 펼칠 거리가 있을 때만 클릭 가능 — 원문이 요약과 다르거나, 부가 정보가 있을 때.
  const fullTextDiffersFromSummary =
    hasFullText && item.fullText!.trim() !== item.summary.trim();
  const isClickable = hasSummary && (fullTextDiffersFromSummary || hasDetail);
  const summaryColor = item.isCore
    ? isAfter
      ? D.accent
      : "#fff"
    : "rgba(255,255,255,0.85)";
  const summarySize = item.isCore
    ? "clamp(18px, 2vw, 22px)"
    : "clamp(14px, 1.45vw, 16px)";
  const summaryWeight = item.isCore ? 700 : 500;

  return (
    <div
      style={{
        borderTop: isFirst ? "none" : "1px solid rgba(255,255,255,0.06)",
        padding: item.isCore ? "20px 0 24px" : "16px 0",
      }}
    >
      <div
        role={isClickable ? "button" : undefined}
        tabIndex={isClickable ? 0 : -1}
        aria-expanded={isClickable ? isOpen : undefined}
        aria-label={
          isClickable
            ? `${item.label} ${isOpen ? "접기" : "원문 펼쳐서 자세히 보기"}`
            : undefined
        }
        onClick={isClickable ? onToggle : undefined}
        onKeyDown={(e) => {
          if (!isClickable) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        style={{
          cursor: isClickable ? "pointer" : "default",
          outline: "none",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <Mono size={10} color="rgba(255,255,255,0.55)" tracking={0.2}>
            {item.label}
          </Mono>
          {isClickable && (
            <span
              aria-hidden
              style={{
                fontFamily: D.mono,
                fontSize: 11,
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "0.04em",
              }}
            >
              {isOpen ? "접기 ▾" : "원문 보기 ▸"}
            </span>
          )}
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: summarySize,
            fontWeight: summaryWeight,
            color: hasSummary ? summaryColor : "rgba(255,255,255,0.35)",
            fontStyle: hasSummary ? "normal" : "italic",
            lineHeight: 1.45,
            letterSpacing: "-0.015em",
            wordBreak: "keep-all",
            // 좌우 카드의 같은 행이 시각적으로 대칭이 되도록 min-height 강제.
            // 요약은 짧은 한 줄이라 line-clamp 가 거의 안 걸리지만, 안전장치로 둠.
            display: "-webkit-box",
            WebkitBoxOrient: "vertical" as const,
            WebkitLineClamp: item.isCore ? 3 : 2,
            overflow: "hidden",
            minHeight: item.isCore ? 100 : 52,
          }}
        >
          {hasSummary ? item.summary : emptyHint()}
        </div>
      </div>
      {isOpen && (
        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            borderLeft: `2px solid ${
              isAfter ? D.accent : "rgba(255,255,255,0.25)"
            }`,
            background: "rgba(255,255,255,0.03)",
            borderRadius: 4,
          }}
        >
          <Mono size={9} color="rgba(255,255,255,0.4)" tracking={0.22}>
            {item.source} · 직접 적은 답
          </Mono>
          {fullTextDiffersFromSummary && (
            <p
              style={{
                margin: "8px 0 0",
                fontSize: 14,
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.85)",
                letterSpacing: "-0.005em",
                whiteSpace: "pre-line",
                wordBreak: "keep-all",
              }}
            >
              &ldquo;{item.fullText}&rdquo;
            </p>
          )}
          {hasDetail && <div style={{ marginTop: 10 }}>{item.detail}</div>}
        </div>
      )}
    </div>
  );
}

// ───────── AFFIRMATION CARDS · 캡쳐해서 마음에 새길 10문장 ───────── //
// 사용자가 한 달 동안 자주 꺼내 보도록 디자인 — 각 카드는 캡쳐 시 단독으로
// 잘라내도 의미가 통하게 워터마크/번호/큰 인용부호를 모두 카드 내부에 배치한다.
function AffirmationCards({ items }: { items: string[] }) {
  return (
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
              background: D.accentSoft,
              border: `1px solid ${D.accent}`,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: D.accent,
                display: "inline-block",
              }}
            />
          </span>
          <Mono size={11} color={D.accent} tracking={0.2}>
            AFFIRMATIONS · 마음에 새길 10문장
          </Mono>
        </div>
      </Reveal>

      <Reveal delay={80}>
        <p
          style={{
            margin: "16px 0 0",
            fontSize: "clamp(15px, 1.45vw, 17px)",
            lineHeight: 1.7,
            color: D.text2,
            letterSpacing: "-0.005em",
            maxWidth: 640,
          }}
        >
          마음에 닿는 카드를 길게 눌러 저장하거나 화면을 캡쳐해 두세요. 한 달
          동안 트리거가 들어올 때마다 한 번씩 꺼내 읽어 보면, 새 신념이 일상의
          언어로 스며듭니다.
        </p>
      </Reveal>

      <div
        style={{
          marginTop: 40,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))",
          gap: 16,
        }}
      >
        {items.map((text, i) => (
          <Reveal key={i} delay={i * 50}>
            <article
              style={{
                position: "relative",
                aspectRatio: "1 / 1",
                background: D.paper,
                border: `1px solid ${D.hair2}`,
                borderRadius: 20,
                padding: "28px 24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                overflow: "hidden",
                boxShadow:
                  "0 1px 0 rgba(0,0,0,0.02), 0 18px 36px -28px rgba(0,0,0,0.18)",
              }}
            >
              {/* 좌상단 큰 인용부호 — 캡쳐했을 때 "확언 카드" 라는 시각적 단서 */}
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  top: 14,
                  left: 18,
                  fontFamily: D.font,
                  fontSize: 56,
                  fontWeight: 700,
                  lineHeight: 1,
                  color: D.accent,
                  opacity: 0.18,
                  letterSpacing: "-0.04em",
                  pointerEvents: "none",
                }}
              >
                &ldquo;
              </span>

              {/* 본문 — 카드 중앙에 큰 글씨로 */}
              <p
                style={{
                  margin: 0,
                  paddingTop: 24,
                  fontSize: "clamp(18px, 2.1vw, 22px)",
                  lineHeight: 1.5,
                  color: D.ink,
                  letterSpacing: "-0.02em",
                  fontWeight: 600,
                  textWrap: "balance",
                  wordBreak: "keep-all",
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {text}
              </p>

              {/* 하단 메타 — 일련번호 + 워크북 워터마크 */}
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 14,
                  borderTop: `1px solid ${D.hair3}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <Mono size={10} color={D.text3} tracking={0.18}>
                  NO. {String(i + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
                </Mono>
                <Mono size={10} color={D.text3} tracking={0.22}>
                  GIBUN · 새 신념
                </Mono>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </div>
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

      {/* AFFIRMATIONS — 행동 처방(DO/DON'T) 다음, 마음의 처방으로 마무리.
          새 핵심 신념을 1인칭 짧은 문장 10개로 변주해 캡쳐 친화적 카드로 노출. */}
      {Array.isArray(report.affirmations) && report.affirmations.length > 0 && (
        <AffirmationCards items={report.affirmations} />
      )}
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
  mechanismAnalysis,
  mechanismInsights,
  coreBeliefExcavation,
  beliefDestroy,
  newBelief,
  copingPlan,
  userName,
}: Props) {
  const router = useRouter();
  // 옛 캐시(belief_shift_summary 부재) 는 무효 처리해서 새 요약을 가져오게 한다.
  const initial =
    isProfessionalReport(savedReport) && hasBeliefShiftSummary(savedReport)
      ? savedReport
      : null;
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

  // 1~8단계에서 사용자가 직접 적은 답을 BEFORE/AFTER 묶음으로 추출.
  // LLM 재요약 없이 원문 그대로 — Step 9 정리 화면의 핵심 가치.
  const snapshot = extractBeforeAfterSnapshot({
    mechanism_analysis: mechanismAnalysis,
    mechanism_insights: mechanismInsights,
    core_belief_excavation: coreBeliefExcavation,
    belief_destroy: beliefDestroy,
    new_belief: newBelief,
    coping_plan: copingPlan,
  });

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
      <TransformationSection
        report={report}
        snapshot={snapshot}
        summary={report.belief_shift_summary ?? null}
      />
      <PracticeSection report={report} />
      <ClosingSection
        onNext={() => router.push("/dashboard/self-workshop/step/10")}
      />
    </div>
  );
}
