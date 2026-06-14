"use client";

/**
 * Mind Spill 데일리 체크인 작성 클라이언트.
 *
 * report-redesign(체크인 작성.html) 적용:
 *   · 상단 레일(섹션 내비 + 스크롤 진행률)
 *   · 커버(애니메이션 타이틀 + 라이브 세션 타이머 + 메타 + 티커)
 *   · PART 01/02 대형 헤더 + 실시간 진행 스탯
 *   · 그 사이 weekly-parts(Scan/BD/Fact/Control/Action/Strengths) 를 어댑터로 재사용.
 *
 * 매일 무료 LLM(거울)은 "오늘 하루 정리하기"(DailyWrapUp)로 대체 → 작성창엔 인라인 안 함.
 */

import { useEffect, useMemo, useState } from "react";
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
import { DailyWrapUp } from "./DailyWrapUp";

type PeriodCta =
  | { kind: "none"; unclaimedCount: number }
  | { kind: "ready"; unclaimedCount: number; entryIds: string[] };

type Props = {
  entry: DailyEntry;
  /** "6월 4일 (목요일)" 같은 날짜 라벨 */
  dateLabel: string;
  /** 미결제 entries 카운트 + 3개 이상이면 entryIds 포함 */
  periodCta: PeriodCta;
  /** READER 표기용 이름 (예: "서연") */
  readerName: string;
};

const NAV: Array<{ id: string; label: string }> = [
  { id: "cover", label: "COVER" },
  { id: "part-one", label: "비우기" },
  { id: "part-two", label: "채우기" },
  { id: "wrap", label: "정리" },
];

const TICKER = [
  "SCAN",
  "BRAIN DUMP",
  "FACT vs THOUGHT",
  "CONTROL",
  "ACTION",
  "STRENGTHS",
  "오늘 하루 정리",
  "VOL · 01",
  "비우고 채웁니다",
];

export function DailyEntryClient({
  entry,
  dateLabel,
  periodCta,
  readerName,
}: Props) {
  const [current, setCurrent] = useState<DailyEntry>(entry);
  const { state: saveState, queueSave, flush } = useEntryAutosave(entry.id);
  const elapsed = useElapsed();
  const { pct: scrollPct, active } = useScrollNav();

  const wbAdapted: Workbook = useMemo(() => entryToWorkbook(current), [current]);

  const p1 = partOneStats(current);
  const p2 = partTwoStats(current);
  const stageOn = Math.round(((p1.progress + p2.progress) / 12) * 6);

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

  const liveClass =
    saveState === "saving"
      ? " is-saving"
      : saveState === "error"
      ? " is-error"
      : "";
  const liveLabel =
    saveState === "saving"
      ? "SAVING…"
      : saveState === "error"
      ? "SAVE FAILED"
      : "SESSION · LIVE";

  return (
    <div className="mind-spill">
      {/* TOP RAIL */}
      <div className="ms-w-rail">
        <div className="ms-container ms-w-rail-inner">
          <Link href="/dashboard/mind-spill" className="brand">
            <span className="blip" />← 감정 캘린더
          </Link>
          <nav className="nav">
            {NAV.map((n, i) => (
              <span key={n.id} style={{ display: "inline-flex", gap: 16, alignItems: "center" }}>
                {i > 0 && <span className="sep">·</span>}
                <a href={`#${n.id}`} className={active === n.id ? "on" : undefined}>
                  {n.label}
                </a>
              </span>
            ))}
          </nav>
          <div className="scroll">
            <span>{String(scrollPct).padStart(2, "0")}%</span>
            <span className="track">
              <i style={{ width: `${scrollPct}%` }} />
            </span>
            SCROLL
          </div>
        </div>
      </div>

      <main className="ms-container" style={{ paddingTop: 16, paddingBottom: 120 }}>
        {/* COVER */}
        <header className="ms-w-cover" id="cover" style={{ scrollMarginTop: 70 }}>
          <div className="ms-w-cover-grid">
            <div>
              <div className="kick">DAILY CHECK-IN WORKBOOK</div>
              <h1>
                <CoverTitle label={dateLabel} />
              </h1>
              <p className="ms-w-cover-lede">
                오늘의 나를 천천히 적어봅니다. 정답은 없어요. 떠오르는 대로 충분합니다.
                <br />
                <span style={{ color: "var(--ms-ink-4)" }}>— 비우고 채웁니다 —</span>
              </p>
            </div>
            <aside className="ms-w-cover-side">
              <div className={`ms-w-live-strip${liveClass}`} aria-live="polite">
                <span className="dot" />
                <span>{liveLabel}</span>
                <span className="timer">{fmtClock(elapsed)}</span>
              </div>
              <div className="ms-w-meta-row">
                <div className="ms-w-meta-item">
                  <span className="k">Started</span>
                  <span className="v">{fmtStarted(current.created_at)}</span>
                </div>
                <div className="ms-w-meta-item">
                  <span className="k">Duration</span>
                  <span className="v">{Math.floor(elapsed / 60)} min</span>
                </div>
                <div className="ms-w-meta-item">
                  <span className="k">Edition</span>
                  <span className="v">Vol. 01</span>
                </div>
                <div className="ms-w-meta-item">
                  <span className="k">Reader</span>
                  <span className="v">{readerName} 님</span>
                </div>
                <div className="ms-w-meta-item">
                  <span className="k">Stage</span>
                  <span className="v" style={{ display: "flex", gap: 4 }}>
                    {Array.from({ length: 6 }, (_, i) => (
                      <span
                        key={i}
                        style={{
                          width: 14,
                          height: 6,
                          borderRadius: 3,
                          background:
                            i < stageOn ? "var(--ms-accent)" : "var(--ms-line)",
                        }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            </aside>
          </div>

          {/* 티커 */}
          <div className="ms-w-ticker">
            <div className="ms-w-ticker-track">
              {[...TICKER, ...TICKER].map((t, i) => (
                <span key={i} className={i % 3 === 1 ? "acc" : undefined}>
                  {t}
                  <i>&nbsp;&nbsp;—&nbsp;&nbsp;</i>
                </span>
              ))}
            </div>
          </div>
        </header>

        {/* ── PART 01 — 비우기 ── */}
        <section className="ms-w-part" id="part-one" style={{ scrollMarginTop: 70 }}>
          <PartHead
            label="PART · ONE"
            num="01"
            title="비우기"
            en="EMPTY · OUT"
            summary="지금의 나를 있는 그대로 스캔하고, 머릿속을 검열 없이 쏟아냅니다."
            progress={p1.progress}
            stats={p1}
          />
        </section>
        <PartOneEmpty wb={wbAdapted} onPatch={handleWeeklyPatch} showMirror={false} />

        {/* BREATH 전환 */}
        <section className="ms-w-breath">
          <div className="q">잠깐 숨을 고르고, 이제 채워봅니다.</div>
          <div className="pulse-bar" />
          <div className="meta">PART 01 → PART 02</div>
        </section>

        {/* ── PART 02 — 채우기 ── */}
        <section className="ms-w-part" id="part-two" style={{ scrollMarginTop: 70 }}>
          <PartHead
            label="PART · TWO"
            num="02"
            title="채우기"
            en="FILL · IN"
            summary="사실과 생각을 가르고, 통제권을 나누고, 다음 한 걸음을 설계합니다."
            progress={p2.progress}
            stats={p2}
          />
        </section>
        <PartTwoFill wb={wbAdapted} onPatch={handleWeeklyPatch} dailyMode />

        {/* ── 오늘 하루 정리하기 ── */}
        <div id="wrap" style={{ scrollMarginTop: 70 }}>
          <DailyWrapUp
            entryId={current.id}
            initialAnalysis={current.daily_analysis}
            onBeforeAnalyze={flush}
          />
          <div style={{ textAlign: "center", marginTop: 18 }}>
            <Link
              href={`/dashboard/mind-spill/day/${current.entry_date}/report`}
              onClick={() => flush()}
              style={{
                fontFamily: "var(--ms-font-mono)",
                fontSize: 12,
                letterSpacing: "0.08em",
                color: "var(--ms-ink-3)",
                textDecoration: "none",
              }}
            >
              이 날 리포트로 보기 →
            </Link>
          </div>
        </div>

        {/* ── Period CTA ── */}
        <PeriodCtaSection periodCta={periodCta} onBeforeNav={() => flush()} />
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────
 * PART 헤더 — 좌: 라벨/번호/제목, 우: 진행 + 스탯
 * ───────────────────────────────────────────── */

function PartHead({
  label,
  num,
  title,
  en,
  summary,
  progress,
  stats,
}: {
  label: string;
  num: string;
  title: string;
  en: string;
  summary: string;
  progress: number;
  stats: PartStats;
}) {
  return (
    <div className="ms-w-part-head">
      <div>
        <div className="label">
          <span className="barlet" />
          {label}
        </div>
        <div className="num">{num}</div>
        <h2>{title}</h2>
        <div className="en">{en}</div>
        <p className="summary">{summary}</p>
      </div>
      <div>
        <div className="ms-w-part-prog">SECTION PROGRESS</div>
        <div className="stage-meter">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={`seg${i < progress ? " on" : ""}`} />
          ))}
        </div>
        <div className="ms-w-part-stats">
          <div className="ms-w-part-stat">
            <div className="k">Chapters</div>
            <div className="v">{String(stats.chapters).padStart(2, "0")}</div>
          </div>
          <div className="ms-w-part-stat">
            <div className="k">Datapoints</div>
            <div className="v">{String(stats.datapoints).padStart(2, "0")}</div>
          </div>
          <div className="ms-w-part-stat">
            <div className="k">Words in</div>
            <div className="v">{stats.words}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 날짜 라벨을 공백 단위로 끊어 word-up 애니메이션 span 으로 감쌈. */
function CoverTitle({ label }: { label: string }) {
  const words = label.split(" ");
  return (
    <>
      {words.map((w, i) => (
        <span className="word" key={i}>
          <span>{w}&nbsp;</span>
        </span>
      ))}
    </>
  );
}

/* ─────────────────────────────────────────────
 * 라이브 타이머 · 스크롤 진행 훅
 * ───────────────────────────────────────────── */

function useElapsed(): number {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  return sec;
}

function useScrollNav(): { pct: number; active: string } {
  const [pct, setPct] = useState(0);
  const [active, setActive] = useState<string>(NAV[0].id);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setPct(max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 0);
      let cur = NAV[0].id;
      for (const n of NAV) {
        const el = document.getElementById(n.id);
        if (el && el.getBoundingClientRect().top <= 120) cur = n.id;
      }
      setActive(cur);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return { pct, active };
}

function fmtClock(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function fmtStarted(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/* ─────────────────────────────────────────────
 * 진행 스탯 계산
 * ───────────────────────────────────────────── */

type PartStats = {
  chapters: number;
  datapoints: number;
  words: number;
  progress: number;
};

function countWords(s: string): number {
  const t = s.trim();
  return t ? t.split(/\s+/).filter(Boolean).length : 0;
}

function partOneStats(e: DailyEntry): PartStats {
  const s = e.daily_scan;
  const bd = e.brain_dump ?? { recurring: [], discomfort: [], todos: [] };
  const rec = bd.recurring ?? [];
  const dis = bd.discomfort ?? [];
  const td = bd.todos ?? [];
  const flags = [
    (s.emotions?.length ?? 0) > 0,
    s.sleep_avg_hours != null || s.sleep_recovery != null || s.sleep_latency_min != null,
    (s.body_signs?.length ?? 0) > 0,
    s.energy != null || s.focus != null || s.motivation != null,
    rec.some((x) => x.text.trim()),
    dis.some((x) => x.text.trim()) || td.some((x) => x.text.trim()),
  ];
  const items = [...rec, ...dis, ...td].filter((x) => x.text.trim());
  const datapoints =
    (s.emotions?.length ?? 0) +
    (s.body_signs?.length ?? 0) +
    [
      s.energy,
      s.focus,
      s.motivation,
      s.sleep_avg_hours,
      s.sleep_recovery,
      s.sleep_latency_min,
    ].filter((v) => v != null).length +
    items.length;
  const words = items.reduce((a, x) => a + countWords(x.text), 0);
  return { chapters: 2, datapoints, words, progress: flags.filter(Boolean).length };
}

function partTwoStats(e: DailyEntry): PartStats {
  const c = e.classification ?? {};
  const fc = c.fact_check ?? {};
  const facts = Object.keys(fc).length;
  const classified =
    (c.controllable?.length ?? 0) +
    (c.uncontrollable?.length ?? 0) +
    (c.influenceable?.length ?? 0);
  const actions = e.actions ?? [];
  const moments = e.moments ?? [];
  const flags = [
    facts > 0,
    classified > 0,
    actions.length > 0,
    actions.some((a) => a.goal?.trim() || a.first_step?.trim()),
    moments.length > 0,
    moments.some((m) => m.title?.trim() || m.experience?.trim() || (m.reason ?? "").trim()),
  ];
  const datapoints = facts + classified + actions.length + moments.length;
  const words =
    actions.reduce(
      (a, x) => a + countWords([x.goal, x.first_step, x.when, x.where, x.if_then].join(" ")),
      0
    ) +
    moments.reduce(
      (a, m) => a + countWords([m.title, m.experience, m.reason ?? ""].join(" ")),
      0
    );
  return { chapters: 4, datapoints, words, progress: flags.filter(Boolean).length };
}

/* ─────────────────────────────────────────────
 * DailyEntry → Workbook 어댑터
 * ───────────────────────────────────────────── */

function entryToWorkbook(e: DailyEntry): Workbook {
  return {
    id: e.id,
    user_id: e.user_id,
    subscription_id: "",
    volume_no: 0,
    week_label: e.entry_date,
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
