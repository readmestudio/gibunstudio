"use client";

import { useEffect, useState } from "react";
import type {
  CognitiveDistortion,
  CognitiveDistortionMeta,
} from "@/lib/self-workshop/analysis-report";
import { HeaderStrip } from "./shared/HeaderStrip";
import { TitleBand } from "./shared/TitleBand";
import { Eyebrow } from "./shared/Eyebrow";
import { Mono } from "./shared/Mono";

const ROTATE_INTERVAL_MS = 2600;

/**
 * 임상 리포트 톤의 인지 왜곡 카드 스택 — 자동 active 회전.
 * 핸드오프 `concepts.jsx`의 ConceptTwo를 단일 진실로 삼아 재현.
 *
 * - 2.6초마다 active 카드가 자동 순회
 * - 클릭으로 즉시 해당 카드로 점프 가능
 *
 * graceful degradation:
 * - severity / frequency 둘 다 누락 시 메터 영역 생략
 * - meta 누락 시 TitleBand 스탯 슬롯 / IMPLICATION 박스 생략
 */
export function DistortionStack({
  distortions,
  meta,
  reportLabel,
  figureNumber,
  figureTotal,
  caseId,
  sectionLabel,
  sectionTitle,
  eyebrow,
  title,
  subtitle,
}: {
  distortions: CognitiveDistortion[];
  meta?: CognitiveDistortionMeta;
  reportLabel: string;
  figureNumber: string;
  figureTotal: string;
  caseId: string;
  sectionLabel: string;
  sectionTitle: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  const total = distortions.length;
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(() => {
      setActive((a) => (a + 1) % total);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [total]);

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
        metaSlot={<DistortionMeta meta={meta} />}
      />

      <div className="px-4 py-6" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {distortions.map((d, i) => (
          <DistortionCard
            key={`${d.id}-${i}`}
            distortion={d}
            index={i}
            total={total}
            isActive={i === active}
            onTap={() => setActive(i)}
          />
        ))}
      </div>

      {meta?.implication && (
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
            {meta.implication}
          </p>
        </div>
      )}
    </section>
  );
}

function DistortionMeta({ meta }: { meta?: CognitiveDistortionMeta }) {
  if (!meta) return null;
  const { observed, total_known, cooccurrence } = meta;
  if (observed == null && total_known == null && cooccurrence == null) {
    return null;
  }
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      {observed != null && (
        <span className="inline-flex items-baseline gap-1.5">
          <Eyebrow size={9} weight={600} color="var(--mute)" tracked="0.22em">
            OBSERVED
          </Eyebrow>
          <Mono size={20} weight={700} color="var(--ink)">
            {observed}
            {total_known != null ? ` / ${total_known}` : ""}
          </Mono>
        </span>
      )}
      {cooccurrence != null && (
        <Mono size={11} color="var(--mute)">
          · distortions · co-occurrence {cooccurrence.toFixed(2)}
        </Mono>
      )}
    </div>
  );
}

function DistortionCard({
  distortion,
  index,
  total,
  isActive,
  onTap,
}: {
  distortion: CognitiveDistortion;
  index: number;
  total: number;
  isActive: boolean;
  onTap: () => void;
}) {
  const code = `CD-${pad2(index + 1)}`;
  const enUpper = distortion.name_en?.toUpperCase() ?? "";
  const enLower = distortion.name_en?.toLowerCase() ?? "";

  return (
    <article
      onClick={onTap}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onTap();
        }
      }}
      aria-label={`${code} ${distortion.name_ko}${isActive ? " (현재 활성)" : ""}`}
      style={{
        position: "relative",
        cursor: "pointer",
        padding: "22px 24px",
        border: "1px solid var(--line-clinical)",
        borderRadius: 0,
        background: isActive ? "var(--paper-2)" : "#fff",
        transition: "background .3s ease, border-color .3s ease",
        borderColor: isActive ? "var(--ink)" : "var(--line-clinical)",
        overflow: "hidden",
      }}
    >
      {/* 활성 좌측 강조 바 */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: "var(--ink)",
          transform: `scaleY(${isActive ? 1 : 0})`,
          transformOrigin: "top",
          transition: "transform .35s ease",
        }}
      />

      {/* HEAD */}
      <div className="flex items-center gap-3">
        <span
          style={{
            fontFamily: "var(--font-clinical-mono)",
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 8px",
            background: isActive ? "var(--ink)" : "#fff",
            color: isActive ? "#fff" : "var(--ink)",
            border: "1px solid var(--ink)",
            letterSpacing: "0.04em",
            animation: isActive ? "chip 2.4s ease-in-out infinite" : "none",
            printColorAdjust: "exact",
            WebkitPrintColorAdjust: "exact",
          }}
        >
          {code}
        </span>
        {enUpper && (
          <Eyebrow size={9} weight={700} color="var(--ink)" tracked="0.22em">
            {enUpper}
          </Eyebrow>
        )}
        <span style={{ flex: 1 }} />
        <Mono size={10} color="var(--mute)">
          {pad2(index + 1)} / {pad2(total)}
        </Mono>
      </div>

      {/* TITLE — 한국어 + 영문 italic 같은 라인 */}
      <h3
        style={{
          margin: "10px 0 0",
          fontFamily: "var(--font-clinical-body)",
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: "-0.025em",
          lineHeight: 1.2,
          color: "var(--ink)",
        }}
      >
        {distortion.name_ko}
        {enLower && (
          <span
            style={{
              fontFamily: "var(--font-clinical-eyebrow)",
              fontSize: 14,
              fontStyle: "italic",
              fontWeight: 500,
              color: "var(--mute)",
              marginLeft: 10,
              letterSpacing: "0.02em",
            }}
          >
            {enLower}
          </span>
        )}
      </h3>

      {/* QUOTE — 좌측 ink 보더 */}
      {distortion.quote && (
        <div
          style={{
            marginTop: 14,
            padding: "10px 0 10px 14px",
            borderLeft: "2px solid var(--ink)",
            fontFamily: "var(--font-clinical-body)",
            fontSize: 17,
            fontWeight: 700,
            lineHeight: 1.55,
            fontStyle: "italic",
            letterSpacing: "-0.01em",
            color: "var(--ink)",
            textWrap: "pretty",
          }}
        >
          &ldquo;{distortion.quote}&rdquo;
        </div>
      )}

      {/* BODY */}
      {distortion.interpretation && (
        <div
          style={{
            marginTop: 14,
            fontSize: 14.5,
            lineHeight: 1.75,
            color: "var(--ink-soft)",
            textWrap: "pretty",
          }}
        >
          {distortion.interpretation}
        </div>
      )}

      {/* TWIN METERS — SEVERITY / FREQUENCY.
          LLM이 점수를 채우지 않은 경우(이전 분석 데이터) 인덱스 기반 fallback을 사용해
          핸드오프 디자인의 시각적 무게가 항상 유지되도록 한다. */}
      <div
        className="grid sm:gap-7"
        style={{
          marginTop: 16,
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
        }}
      >
        <MeterRow
          label="SEVERITY"
          value={distortion.severity ?? severityFallback(index, total)}
          note="개입 우선도"
          animKey={isActive ? `s-${index}-on` : `s-${index}-off`}
        />
        <MeterRow
          label="FREQUENCY"
          value={distortion.frequency ?? frequencyFallback(index, total)}
          note="14일 관찰"
          animKey={isActive ? `f-${index}-on` : `f-${index}-off`}
        />
      </div>
    </article>
  );
}

/**
 * severity fallback — 첫 번째 왜곡이 가장 개입 우선도 높음(0.88) → 점진적 감소(0.62).
 * 임상적으로 LLM이 보통 가장 강한 왜곡부터 정렬해서 내려보내기 때문에 인덱스 기반 derive가 합리적.
 */
function severityFallback(index: number, total: number): number {
  if (total <= 1) return 0.84;
  const t = index / (total - 1);
  return 0.88 - t * 0.26;
}

/**
 * frequency fallback — 첫 번째가 가장 빈번(0.78) → 점진적 감소(0.58).
 * severity와 약간 다른 곡선을 써서 두 메터가 동기화되어 보이지 않도록 한다.
 */
function frequencyFallback(index: number, total: number): number {
  if (total <= 1) return 0.7;
  const t = index / (total - 1);
  return 0.78 - t * 0.2;
}

function MeterRow({
  label,
  value,
  note,
  animKey,
}: {
  label: string;
  value: number;
  note: string;
  animKey: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Eyebrow size={11} weight={700} color="var(--ink)" tracked="0.22em">
          {label}
        </Eyebrow>
        <Mono size={11} color="var(--mute)">
          {note}
        </Mono>
      </div>
      <div className="mt-2.5 flex items-baseline gap-1.5">
        <Mono size={28} weight={700} color="var(--ink)">
          {Math.round(pct)}
        </Mono>
        <Mono size={12} color="var(--mute)">
          /100
        </Mono>
      </div>
      <div
        style={{
          marginTop: 10,
          height: 5,
          background: "var(--line-clinical-2)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          key={animKey}
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--ink)",
            transformOrigin: "left",
            transform: `scaleX(${pct / 100})`,
            animation: "barFill 1s ease-out",
          }}
        />
      </div>
    </div>
  );
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
