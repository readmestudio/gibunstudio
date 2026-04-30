"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { AchievementLoop, LoopStage } from "@/lib/self-workshop/analysis-report";
import { HeaderStrip } from "./shared/HeaderStrip";
import { TitleBand } from "./shared/TitleBand";
import { Eyebrow } from "./shared/Eyebrow";
import { Mono } from "./shared/Mono";

const ADVANCE_INTERVAL_MS = 2200;
const VIEW = 460;
const CX = VIEW / 2;
const CY = VIEW / 2;
const NODE_R = 28;
const RING_R = 150;
const LABEL_R = RING_R + 50;
const PULSE_TARGET_R = NODE_R * 2.0;

/**
 * 임상 리포트 톤의 Achievement Loop 시각화 — 가로 노드 레일 + 하단 active 콘텐츠 카드.
 *
 * - 노드 6개가 가로로 정렬되어 2.2초 간격으로 자동 advance
 * - 활성화된 노드의 상세 내용(라벨 + 제목 + 본문 + SIGNAL 메터)이 노드 레일 하단 카드에 표시
 * - active가 바뀔 때마다 카드 내용이 fade 트랜지션으로 교체
 * - 노드 클릭으로 즉시 jump 가능
 *
 * graceful degradation:
 * - stage.name_en / source / intensity 누락 시 해당 영역 생략
 */
export function CognitiveLoop({
  loop,
  reportLabel,
  figureNumber,
  figureTotal,
  caseId,
  sectionLabel,
  sectionTitle,
  eyebrow,
  title,
  subtitle,
  implication,
}: {
  loop: AchievementLoop;
  reportLabel: string;
  figureNumber: string;
  figureTotal: string;
  caseId: string;
  sectionLabel: string;
  sectionTitle: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  implication?: string;
}) {
  const total = loop.stages.length;
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(() => {
      setActive((a) => (a + 1) % total);
    }, ADVANCE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [total]);

  const activeStage = loop.stages[active];
  const isFullyFired = active === total - 1;

  return (
    <section style={{ fontFamily: "var(--font-clinical-body)" }}>
      <HeaderStrip
        reportLabel={reportLabel}
        figureNumber={figureNumber}
        caseId={caseId}
        sectionLabel={sectionLabel}
        sectionTitle={sectionTitle}
      />
      <TitleBand
        figureNumber={figureNumber}
        figureTotal={figureTotal}
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        metaSlot={<LoopMeta cycleTime={loop.cycle_time} observed={loop.observed_text} />}
      />

      {/* 원형 다이어그램 — 격자 배경 + 시계방향 회귀 화살표 */}
      <div
        className="relative"
        style={{
          padding: "20px 16px",
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 0 39px, var(--line-clinical-2) 39px 40px)," +
            "repeating-linear-gradient(90deg, transparent 0 39px, var(--line-clinical-2) 39px 40px)",
          backgroundSize: "40px 40px, 40px 40px",
          animation: "gridDrift 24s linear infinite",
        }}
      >
        <CircularLoop
          stages={loop.stages}
          active={active}
          onTap={(i) => setActive(i)}
        />
      </div>

      {/* active 콘텐츠 카드 — active 노드의 상세가 여기에 표시되며, 바뀔 때마다 fade 전환 */}
      <div
        style={{
          padding: "20px 24px",
          borderTop: "1px solid var(--line-clinical)",
          background: "var(--paper)",
          minHeight: 160,
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
          >
            <ActiveDetail stage={activeStage} n={pad2(activeStage.step)} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* LOOPBACK 푸터 — 모든 노드 점화 시 표시 */}
      {isFullyFired && loop.loopback_text && (
        <div
          className="flex items-center gap-2.5"
          style={{
            margin: "0 24px",
            padding: "14px 0 16px",
            borderTop: "1px dashed var(--line-clinical)",
          }}
        >
          <Mono size={11} color="var(--mute)" tracked={0.16}>
            ↻ LOOPBACK {pad2(total)} → 01
          </Mono>
          <span
            aria-hidden
            style={{ flex: 1, height: 1, background: "var(--line-clinical)" }}
          />
          <Eyebrow size={9} weight={600} color="var(--mute)" tracked="0.22em">
            {loop.loopback_text}
          </Eyebrow>
        </div>
      )}

      {/* IMPLICATION 박스 */}
      {implication && (
        <div
          style={{
            background: "var(--ink)",
            color: "#fff",
            padding: "20px 28px",
            printColorAdjust: "exact",
            WebkitPrintColorAdjust: "exact",
          }}
        >
          <Eyebrow size={9} weight={700} color="#A8A8AC" tracked="0.22em">
            ▸ IMPLICATION
          </Eyebrow>
          <p
            className="mt-2.5"
            style={{
              fontFamily: "var(--font-clinical-body)",
              fontSize: 14,
              lineHeight: 1.65,
              color: "#E5E5E8",
              textWrap: "pretty",
            }}
          >
            {implication}
          </p>
        </div>
      )}
    </section>
  );
}

function LoopMeta({
  cycleTime,
  observed,
}: {
  cycleTime?: string;
  observed?: string;
}) {
  if (!cycleTime && !observed) return null;
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      {cycleTime && (
        <span className="inline-flex items-baseline gap-1.5">
          <Eyebrow size={9} weight={600} color="var(--mute)" tracked="0.22em">
            CYCLE TIME
          </Eyebrow>
          <Mono size={20} weight={700} color="var(--ink)">
            {cycleTime}
          </Mono>
        </span>
      )}
      {observed && (
        <Mono size={11} color="var(--mute)">
          · {observed}
        </Mono>
      )}
    </div>
  );
}

/**
 * 6개 노드를 원형(circle)으로 배치하고 시계방향 화살표로 연결한 SVG 다이어그램.
 * 마지막 노드(06)에서 첫 노드(01)로 자연스럽게 회귀하여 "반복 고리"임을 시각화.
 */
function CircularLoop({
  stages,
  active,
  onTap,
}: {
  stages: LoopStage[];
  active: number;
  onTap: (i: number) => void;
}) {
  const total = stages.length;
  const angleAt = (i: number) => -90 + (i * 360) / total;
  const radAt = (i: number) => (angleAt(i) * Math.PI) / 180;
  const posAt = (i: number, radius: number) => ({
    x: CX + radius * Math.cos(radAt(i)),
    y: CY + radius * Math.sin(radAt(i)),
  });

  // i 노드에서 i+1 노드로 가는 시계방향 호 path (양 끝은 노드 가장자리에서 약간 떨어진 지점)
  const arcPath = (i: number) => {
    const next = (i + 1) % total;
    const a1 = radAt(i);
    const a2 = radAt(next);
    const angleOffset = Math.asin((NODE_R + 8) / RING_R);
    const sx = CX + RING_R * Math.cos(a1 + angleOffset);
    const sy = CY + RING_R * Math.sin(a1 + angleOffset);
    const ex = CX + RING_R * Math.cos(a2 - angleOffset);
    const ey = CY + RING_R * Math.sin(a2 - angleOffset);
    return `M ${sx} ${sy} A ${RING_R} ${RING_R} 0 0 1 ${ex} ${ey}`;
  };

  return (
    <svg
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      style={{
        display: "block",
        width: "100%",
        maxWidth: VIEW,
        margin: "0 auto",
      }}
      role="img"
      aria-label="성취 중독 반복 고리 다이어그램"
    >
      <defs>
        <marker
          id="loopArrowInk"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ink)" />
        </marker>
        <marker
          id="loopArrowMute"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--mute)" />
        </marker>
      </defs>

      {/* 시계방향 호 + 화살표 — fired 구간은 ink 솔리드, 미점화 구간은 점선 mute */}
      {stages.map((_, i) => {
        const isFired = i < active;
        return (
          <path
            key={`arc-${i}`}
            d={arcPath(i)}
            fill="none"
            stroke={isFired ? "var(--ink)" : "var(--mute)"}
            strokeWidth={isFired ? 1.5 : 1}
            strokeDasharray={isFired ? "0" : "3 4"}
            markerEnd={isFired ? "url(#loopArrowInk)" : "url(#loopArrowMute)"}
            opacity={isFired ? 1 : 0.55}
            style={{ transition: "stroke .35s ease, opacity .35s ease" }}
          />
        );
      })}

      {/* 가운데 라벨 — ACHIEVEMENT / LOOP */}
      <text
        x={CX}
        y={CY - 6}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontFamily: "var(--font-clinical-eyebrow)",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.22em",
          fill: "var(--ink)",
          textTransform: "uppercase",
        }}
      >
        ACHIEVEMENT
      </text>
      <text
        x={CX}
        y={CY + 12}
        textAnchor="middle"
        dominantBaseline="central"
        style={{
          fontFamily: "var(--font-clinical-eyebrow)",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.22em",
          fill: "var(--ink)",
          textTransform: "uppercase",
        }}
      >
        LOOP
      </text>

      {/* 노드 + 라벨 */}
      {stages.map((stage, i) => {
        const isFired = i <= active;
        const isActive = i === active;
        const { x, y } = posAt(i, RING_R);
        const labelP = posAt(i, LABEL_R);
        const angle = angleAt(i);
        const cos = Math.cos((angle * Math.PI) / 180);
        const sin = Math.sin((angle * Math.PI) / 180);
        const anchor: "start" | "end" | "middle" =
          cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";
        const baseline: "auto" | "central" | "hanging" =
          sin > 0.3 ? "hanging" : sin < -0.3 ? "auto" : "central";

        return (
          <g key={stage.step}>
            {/* 활성 노드 펄스 링 — SVG <animate>로 r/opacity 변화, 시간차 0초 + 1.1초 */}
            {isActive && (
              <>
                <circle
                  cx={x}
                  cy={y}
                  fill="none"
                  stroke="var(--ink)"
                  strokeWidth={1}
                >
                  <animate
                    attributeName="r"
                    values={`${NODE_R};${PULSE_TARGET_R}`}
                    dur="2.2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.7;0"
                    dur="2.2s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle
                  cx={x}
                  cy={y}
                  fill="none"
                  stroke="var(--ink)"
                  strokeWidth={1}
                >
                  <animate
                    attributeName="r"
                    values={`${NODE_R};${PULSE_TARGET_R}`}
                    dur="2.2s"
                    begin="1.1s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.7;0"
                    dur="2.2s"
                    begin="1.1s"
                    repeatCount="indefinite"
                  />
                </circle>
              </>
            )}

            {/* 노드 본체 */}
            <circle
              cx={x}
              cy={y}
              r={NODE_R}
              fill={isFired ? "var(--ink)" : "#fff"}
              stroke="var(--ink)"
              strokeWidth={isActive ? 2 : 1.6}
              style={{
                cursor: "pointer",
                transition: "fill .35s ease, stroke-width .25s ease",
              }}
              onClick={() => onTap(i)}
              role="button"
              aria-label={`${pad2(stage.step)}단계 — ${stage.name}`}
            />
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              style={{
                fontFamily: "var(--font-clinical-mono)",
                fontSize: 14,
                fontWeight: 700,
                fill: isFired ? "#fff" : "var(--ink)",
                pointerEvents: "none",
                userSelect: "none",
                transition: "fill .35s ease",
              }}
            >
              {pad2(stage.step)}
            </text>

            {/* 노드 외부 라벨 — 한글 키워드 */}
            <text
              x={labelP.x}
              y={labelP.y}
              textAnchor={anchor}
              dominantBaseline={baseline}
              style={{
                fontFamily: "var(--font-clinical-body)",
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                letterSpacing: "-0.02em",
                fill: isActive
                  ? "var(--ink)"
                  : isFired
                    ? "var(--ink-soft)"
                    : "var(--mute)",
                transition: "fill .3s ease, font-weight .3s ease",
              }}
            >
              {stage.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ActiveDetail({ stage, n }: { stage: LoopStage; n: string }) {
  const intensityPct =
    typeof stage.intensity === "number"
      ? Math.max(0, Math.min(1, stage.intensity)) * 100
      : null;

  return (
    <div>
      {/* eyebrow row — 영문 라벨 + SOURCE + ACTIVE */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Mono size={11} weight={700} color="var(--ink)">
          {n}
        </Mono>
        {stage.name_en && (
          <Eyebrow size={9.5} weight={700} color="var(--ink)" tracked="0.22em">
            {stage.name_en}
          </Eyebrow>
        )}
        {stage.source && (
          <>
            <span
              aria-hidden
              style={{
                width: 4,
                height: 4,
                background: "var(--mute)",
                borderRadius: "50%",
              }}
            />
            <Mono size={10} color="var(--mute)">
              SOURCE {stage.source}
            </Mono>
          </>
        )}
        <span style={{ flex: 1 }} />
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
      </div>

      {/* 한글 제목 */}
      <h3
        style={{
          margin: "10px 0 0",
          fontFamily: "var(--font-clinical-body)",
          fontSize: 22,
          fontWeight: 800,
          letterSpacing: "-0.025em",
          lineHeight: 1.3,
          color: "var(--ink)",
        }}
      >
        {stage.name}
      </h3>

      {/* 본문 */}
      {stage.user_case && (
        <p
          style={{
            marginTop: 12,
            fontSize: 14,
            lineHeight: 1.7,
            color: "var(--ink-soft)",
            paddingLeft: 14,
            borderLeft: "2px solid var(--ink)",
            textWrap: "pretty",
          }}
        >
          {stage.user_case}
        </p>
      )}

      {/* SIGNAL 메터 */}
      {intensityPct !== null && (
        <div className="mt-4 flex items-center gap-2.5">
          <Eyebrow size={9} weight={600} color="var(--mute)" tracked="0.22em">
            SIGNAL
          </Eyebrow>
          <div
            style={{
              flex: 1,
              height: 4,
              background: "var(--line-clinical-2)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                transformOrigin: "left",
                transform: `scaleX(${intensityPct / 100})`,
                background: "var(--ink)",
                transition: "transform .5s ease",
              }}
            />
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                width: "30%",
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)",
                animation: "sweepX 1.8s linear infinite",
              }}
            />
          </div>
          <Mono size={11} weight={700} color="var(--ink)">
            {Math.round(intensityPct)}
          </Mono>
          <Mono size={9} color="var(--mute)">
            /100
          </Mono>
        </div>
      )}
    </div>
  );
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
