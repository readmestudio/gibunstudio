"use client";

/**
 * Mind Spill 워크북 — 한 권의 단일 스크롤 페이지.
 * 시안(mind-spill-workbook.html)의 흐름 그대로:
 *   Cover → Part 1 비우기 (Scan + BD + Mirror) → Bridge
 *        → Part 2 채우기 (Control + Action + Strengths) → Bridge
 *        → Closing Report (Chart + Released + Actions + Strengths cloud + Coach's Letter)
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "./mind-spill-theme.css";
import type { Workbook, WorkbookPatch } from "@/lib/mind-spill/types";
import { MindSpillFonts } from "./MindSpillFonts";
import { useWeeklyAutosave } from "./useWeeklyAutosave";
import { CoverHeader } from "./weekly-parts/Cover";
import { PartOneEmpty } from "./weekly-parts/WeeklyEmpty";
import { PartTwoFill } from "./weekly-parts/WeeklyFill";
import { ClosingReport } from "./weekly-parts/WeeklyClosing";

type Props = { workbook: Workbook };

export function WeeklyWorkbookClient({ workbook }: Props) {
  const router = useRouter();
  const [wb, setWb] = useState<Workbook>(workbook);
  const { state: saveState, queueSave, flush } = useWeeklyAutosave(workbook.id);

  /** 부분 patch — 로컬 state 즉시 갱신 + 자동 저장 큐잉. */
  function patch(p: WorkbookPatch) {
    setWb((prev) => {
      const next: Workbook = { ...prev };
      for (const [k, v] of Object.entries(p)) {
        // 부분 필드 갱신. WorkbookPatch는 Workbook의 부분 집합.
        (next as unknown as Record<string, unknown>)[k] = v as unknown;
      }
      return next;
    });
    queueSave(p);
  }

  async function finish() {
    queueSave({ status: "completed" });
    await flush();
    router.push("/dashboard/mind-spill");
  }

  const saveBadge = useMemo(() => {
    switch (saveState) {
      case "saving":
        return (
          <span className="ms-save-status saving" aria-live="polite">
            <span className="ms-dot" /> saving
          </span>
        );
      case "saved":
        return (
          <span className="ms-save-status saved" aria-live="polite">
            <span className="ms-dot" /> saved
          </span>
        );
      case "error":
        return (
          <button
            type="button"
            className="ms-save-status error"
            onClick={() => flush()}
          >
            <span className="ms-dot" /> save failed · retry
          </button>
        );
      default:
        return (
          <span className="ms-save-status">
            <span className="ms-dot" /> auto-saving
          </span>
        );
    }
  }, [saveState, flush]);

  // PartDivider 통계 — 작성 진행도 시각화.
  const scan = wb.weekly_scan;
  const bd = wb.brain_dump;
  const bdAll = [
    ...(bd.recurring ?? []),
    ...(bd.discomfort ?? []),
    ...(bd.todos ?? []),
  ].filter((b) => b.text.trim());
  const scanFilled =
    [
      scan.emotion_intensity,
      scan.sleep_avg_hours,
      scan.sleep_latency_min,
      scan.sleep_recovery,
      scan.energy,
      scan.focus,
      scan.motivation,
    ].filter((v) => v != null).length +
    (scan.emotions?.length ?? 0) +
    (scan.body_signs ?? []).filter((b) => b !== "없음").length;
  const p1Datapoints = scanFilled + bdAll.length;
  const p1Words = bdAll.reduce(
    (s, b) => s + b.text.trim().split(/\s+/).filter(Boolean).length,
    0
  );
  const p1Segs = [scanFilled > 0, bdAll.length > 0, !!wb.mirror_report].filter(
    Boolean
  ).length;

  const p2Actions = (wb.actions ?? []).filter(
    (a) => a.goal?.trim() || a.first_step?.trim()
  ).length;
  const p2Moments = (wb.moments ?? []).filter(
    (m) => m.title?.trim() || m.experience?.trim()
  ).length;
  const cls = wb.classification;
  const factFilled = Object.keys(cls?.fact_check ?? {}).length > 0;
  const ctrlFilled =
    (cls?.controllable ?? []).length +
      (cls?.influenceable ?? []).length +
      (cls?.uncontrollable ?? []).length >
    0;
  const p2Segs = [
    factFilled,
    ctrlFilled,
    p2Actions > 0,
    p2Moments > 0,
  ].filter(Boolean).length;

  return (
    <div className="mind-spill">
      <MindSpillFonts />
      {/* Sticky top bar */}
      <div className="ms-topbar">
        <Link
          href="/dashboard/mind-spill"
          className="ms-topbar-back"
          onClick={() => {
            void flush();
          }}
        >
          ← 워크북 목록
        </Link>
        {saveBadge}
      </div>

      {/* ===== COVER ===== */}
      <CoverHeader workbook={wb} onPatch={patch} />

      {/* ===== PART 1 DIVIDER ===== */}
      <PartDivider
        num="01"
        kr="비우기"
        en="EMPTY · OUT"
        summary="정확하지 않아도 괜찮습니다. 떠오르는 대로, 짐작으로도 충분합니다. 머릿속에 쌓여 있는 것을 한 번에 비웁니다."
        chapters="03"
        statB={{ k: "DATAPOINTS", v: p1Datapoints }}
        statC={{ k: "WORDS IN", v: p1Words }}
        onSegs={p1Segs}
      />

      {/* ===== PART 1 ===== */}
      <div className="ms-container">
        <PartOneEmpty wb={wb} onPatch={patch} />
      </div>

      {/* ===== BRIDGE ===== */}
      <div className="ms-bridge">
        <div className="ms-bridge-text">&quot;비웠으면, 잠시 숨을 고릅니다.&quot;</div>
        <div>
          <span className="ms-bridge-rule" />
          <span className="ms-breath" />
          <span className="ms-bridge-rule" />
        </div>
      </div>

      {/* ===== PART 2 DIVIDER ===== */}
      <PartDivider
        id="part-two"
        num="02"
        kr="채우기"
        en="FILL · BACK"
        summary="비운 자리에 무엇을 다시 채울지 천천히 고릅니다. 사실과 생각을 분리하고, 통제할 수 있는 것만 골라, 24시간 안에 할 수 있는 한 걸음으로 만듭니다."
        chapters="04"
        statB={{ k: "ACTIONS", v: p2Actions }}
        statC={{ k: "STRENGTHS", v: p2Moments }}
        onSegs={p2Segs}
      />

      {/* ===== PART 2 ===== */}
      <div className="ms-container">
        <PartTwoFill wb={wb} onPatch={patch} />
      </div>

      {/* ===== CLOSING — coach_note 가 도착해야 표시 ===== */}
      {wb.coach_note && (
        <>
          <div className="ms-bridge">
            <div className="ms-bridge-text">
              &quot;이 회를 한 장에 담으면.&quot;
            </div>
            <div>
              <span className="ms-bridge-rule" />
              <span className="ms-breath" />
              <span className="ms-bridge-rule" />
            </div>
          </div>
          <ClosingReport wb={wb} />
        </>
      )}

      {/* CTA */}
      <div className="ms-container">
        <div className="ms-cta-row">
          <button
            type="button"
            className="ms-btn-ink"
            onClick={() => finish()}
          >
            이 워크북을 완료로 표시 →
          </button>
        </div>
      </div>

      <footer className="ms-footer">
        <div className="mark">mind · spill</div>
        <div>An honest mirror, written by hand.</div>
      </footer>
    </div>
  );
}

/* ───────────── PART DIVIDER (에디토리얼 파트헤드) ───────────── */

type PartDividerProps = {
  num: "01" | "02";
  kr: string;
  en: string;
  summary: string;
  chapters: string;
  statB: { k: string; v: number };
  statC: { k: string; v: number };
  onSegs: number;
  id?: string;
};

function PartDivider({
  num,
  kr,
  en,
  summary,
  chapters,
  statB,
  statC,
  onSegs,
  id,
}: PartDividerProps) {
  return (
    <div
      id={id}
      className="ms-parthead"
      style={id ? { scrollMarginTop: 64 } : undefined}
    >
      <div>
        <div className="ms-parthead-label">
          <span className="barlet" />PART · {num === "01" ? "ONE" : "TWO"}
        </div>
        <div className="ms-parthead-num">{num}</div>
        <h2 className="ms-parthead-kr">{kr}</h2>
        <div className="ms-parthead-en">{en}</div>
        <p className="ms-parthead-summary">{summary}</p>
      </div>
      <div>
        <div className="ms-parthead-prog">SECTION&nbsp;PROGRESS</div>
        <div className="ms-stage-meter">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`seg${i < onSegs ? " on" : ""}`}
              style={i < onSegs ? { animationDelay: `${i * 0.1}s` } : undefined}
            />
          ))}
        </div>
        <div className="ms-parthead-stats">
          <div>
            <div className="k">CHAPTERS</div>
            <div className="v">{chapters}</div>
          </div>
          <div>
            <div className="k">{statB.k}</div>
            <div className="v">{String(statB.v).padStart(2, "0")}</div>
          </div>
          <div>
            <div className="k">{statC.k}</div>
            <div className="v">{String(statC.v).padStart(2, "0")}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
