"use client";

/**
 * Mind Spill 데일리 체크인 작성 클라이언트.
 *
 * 기존 weekly-parts(PartOneEmpty / PartTwoFill)를 어댑터 패턴으로 그대로 재사용 —
 * Workbook 시각 디자인과 모든 활동(Scan/BD/FactCheck/Control/Action/Moments)을 유지.
 *
 * 매일 무료 LLM: Mirror Report (entry당 1회). 작성 페이지 안에서 즉시 트리거 + 표시.
 * 3일 누적 후 유료 종합 리포트는 캘린더의 별도 CTA로 진입.
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import "./mind-spill-theme.css";
import type {
  Action,
  BrainDump,
  Classification,
  DailyEntry,
  DailyEntryPatch,
  DailyScan,
  Moment,
  Workbook,
  WorkbookPatch,
} from "@/lib/mind-spill/types";
import { useEntryAutosave } from "./useEntryAutosave";
import { PartOneEmpty } from "./weekly-parts/WeeklyEmpty";
import { PartTwoFill } from "./weekly-parts/WeeklyFill";

type PeriodCta =
  | { kind: "none"; unclaimedCount: number }
  | { kind: "ready"; unclaimedCount: number; entryIds: string[] };

type Props = {
  entry: DailyEntry;
  /** "6월 4일 (목요일)" 같은 날짜 라벨 */
  dateLabel: string;
  /** 미결제 entries 카운트 + 3개 이상이면 entryIds 포함 */
  periodCta: PeriodCta;
};

export function DailyEntryClient({ entry, dateLabel, periodCta }: Props) {
  const [current, setCurrent] = useState<DailyEntry>(entry);
  const { state: saveState, queueSave, flush } = useEntryAutosave(entry.id);

  /**
   * weekly-parts는 Workbook 인터페이스를 받는다. entry를 wb 형태로 어댑팅해 전달.
   * `wb.id`는 mirror-report API의 `workbookId` 파라미터로 사용되는데, 새 API는 entry_id로도 받도록 fallback 처리됨.
   */
  const wbAdapted: Workbook = useMemo(() => entryToWorkbook(current), [current]);

  /**
   * weekly-parts에서 호출되는 onPatch (WorkbookPatch) → DailyEntryPatch로 변환.
   * weekly_scan ↔ daily_scan 필드명만 다르고 나머지는 동일.
   */
  function handleWeeklyPatch(p: WorkbookPatch) {
    const ep: DailyEntryPatch = {};
    if (p.weekly_scan !== undefined) ep.daily_scan = p.weekly_scan as DailyScan;
    if (p.brain_dump !== undefined) ep.brain_dump = p.brain_dump as BrainDump;
    if (p.classification !== undefined)
      ep.classification = p.classification as Classification;
    if (p.released !== undefined) ep.released = p.released as string[];
    if (p.actions !== undefined) ep.actions = p.actions as Action[];
    if (p.moments !== undefined) ep.moments = p.moments as Moment[];

    if (Object.keys(ep).length === 0) return;

    // 로컬 상태 즉시 반영.
    setCurrent((prev) => {
      const next: DailyEntry = { ...prev };
      if (ep.daily_scan !== undefined) next.daily_scan = ep.daily_scan;
      if (ep.brain_dump !== undefined) next.brain_dump = ep.brain_dump;
      if (ep.classification !== undefined) next.classification = ep.classification;
      if (ep.released !== undefined) next.released = ep.released;
      if (ep.actions !== undefined) next.actions = ep.actions;
      if (ep.moments !== undefined) next.moments = ep.moments;
      return next;
    });

    queueSave(ep);
  }

  const saveBadge = (
    <span className={`ms-save-status ${saveState}`} aria-live="polite">
      <span className="ms-dot" />
      {saveState === "saving"
        ? "saving"
        : saveState === "saved"
        ? "saved"
        : saveState === "error"
        ? "save failed"
        : "auto-saving"}
    </span>
  );

  return (
    <div className="mind-spill">
      <main className="ms-container" style={{ paddingTop: 40, paddingBottom: 120 }}>
        {/* 헤더 */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <Link
            href="/dashboard/mind-spill"
            style={{
              fontFamily: "var(--ms-font-mono)",
              fontSize: 11,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--ms-ink-3)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            ← 캘린더
          </Link>
          {saveBadge}
        </header>

        {/* Date Hero */}
        <div style={{ marginBottom: 36 }}>
          <div className="ms-eyebrow" style={{ marginBottom: 12 }}>
            MIND · SPILL — DAILY CHECK-IN
          </div>
          <h1
            style={{
              fontFamily: "var(--ms-font-display)",
              fontWeight: 700,
              fontSize: "clamp(30px, 5vw, 48px)",
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              color: "var(--ms-ink)",
              margin: 0,
              wordBreak: "keep-all",
            }}
          >
            {dateLabel}
          </h1>
          <p
            style={{
              marginTop: 14,
              fontSize: 14,
              color: "var(--ms-ink-3)",
              lineHeight: 1.7,
              wordBreak: "keep-all",
              maxWidth: 540,
            }}
          >
            오늘 마음을 한 칸에 담아두세요. 비우고 · 사실을 가르고 · 통제권을
            나누고 · 다음 한 걸음까지. 작성한 만큼 자동으로 저장돼요.
          </p>
        </div>

        {/* ── Part 1 — 비우기 (Scan + BrainDump + Mirror 트리거) ── */}
        <PartOneEmpty wb={wbAdapted} onPatch={handleWeeklyPatch} />

        {/* ── Part 2 — 채우기 (FactCheck + Control + Action + Moments) ── */}
        <PartTwoFill wb={wbAdapted} onPatch={handleWeeklyPatch} />

        {/* ── Period CTA — 미결제 누적 3개 이상이면 ── */}
        <PeriodCtaSection periodCta={periodCta} onBeforeNav={() => flush()} />
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────
 * DailyEntry → Workbook 어댑터
 * ─────────────────────────────────────────────
 *
 * weekly-parts 컴포넌트는 Workbook 형태를 기대한다. 필드명만 약간 다른 곳을
 * 매핑하고, DailyEntry에 없는 strengths_report/coach_note/prescriptions는
 * null로 채운다 — weekly-parts는 이미 null 처리를 한다.
 */
function entryToWorkbook(e: DailyEntry): Workbook {
  return {
    id: e.id,
    user_id: e.user_id,
    subscription_id: "",
    volume_no: 0,
    week_label: e.entry_date,  // 카드 헤더 표기용
    status: "draft",
    current_step: 2,
    weekly_scan: e.daily_scan,
    brain_dump: e.brain_dump,
    mirror_report: e.mirror_report,
    classification: e.classification,
    released: e.released,
    actions: e.actions,
    moments: e.moments,
    strengths_report: null,
    coach_note: null,
    prescriptions: null,
    created_at: e.created_at,
    updated_at: e.updated_at,
    completed_at: null,
  };
}

/* ─────────────────────────────────────────────
 * Period CTA Section
 * ───────────────────────────────────────────── */

function PeriodCtaSection({
  periodCta,
  onBeforeNav,
}: {
  periodCta: PeriodCta;
  onBeforeNav: () => void;
}) {
  if (periodCta.kind === "none") {
    return (
      <section
        style={{
          marginTop: 64,
          padding: 24,
          border: "1px dashed var(--ms-line)",
          borderRadius: 14,
          background: "transparent",
        }}
      >
        <div
          className="ms-eyebrow"
          style={{ marginBottom: 10, color: "var(--ms-ink-3)" }}
        >
          ₩4,900 · PERIOD REPORT (3일 누적)
        </div>
        <h3
          style={{
            fontFamily: "var(--ms-font-display)",
            fontWeight: 600,
            fontSize: 19,
            color: "var(--ms-ink)",
            margin: "0 0 8px",
            letterSpacing: "-0.015em",
          }}
        >
          3일치가 모이면 패턴이 보여요
        </h3>
        <p
          style={{
            fontSize: 13,
            color: "var(--ms-ink-3)",
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          체크인을{" "}
          <b style={{ color: "var(--ms-ink)" }}>
            {Math.max(0, 3 - periodCta.unclaimedCount)}일
          </b>{" "}
          더 작성하시면 종합 리포트를 받을 수 있어요. 반복되는 감정 패턴 · 강점 ·
          상담사의 편지가 한 통에 담겨요.
        </p>
      </section>
    );
  }

  return (
    <section
      style={{
        marginTop: 64,
        padding: 28,
        border: "2px solid var(--ms-ink)",
        borderRadius: 16,
        background: "var(--ms-surface)",
      }}
    >
      <div
        className="ms-eyebrow"
        style={{ marginBottom: 10, color: "var(--ms-accent)" }}
      >
        ₩4,900 · PERIOD REPORT · {periodCta.unclaimedCount}일치
      </div>
      <h3
        style={{
          fontFamily: "var(--ms-font-display)",
          fontWeight: 600,
          fontSize: 21,
          color: "var(--ms-ink)",
          margin: "0 0 10px",
          letterSpacing: "-0.018em",
        }}
      >
        지난 {periodCta.unclaimedCount}일치 종합 리포트가 준비됐어요
      </h3>
      <p
        style={{
          fontSize: 14,
          color: "var(--ms-ink-3)",
          lineHeight: 1.75,
          marginBottom: 18,
        }}
      >
        모인 체크인에서 발견한 반복 패턴, 당신만의 강점 3가지, 상담사의 한 통의
        편지까지. 약 1분 안에 받아보세요.
      </p>
      <Link
        href="/dashboard/mind-spill"
        className="ms-btn-ink"
        onClick={() => onBeforeNav()}
        style={{
          display: "inline-block",
          padding: "12px 22px",
          fontSize: 14,
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        캘린더에서 종합 리포트 받기 →
      </Link>
    </section>
  );
}
