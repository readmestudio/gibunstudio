"use client";

/**
 * Mind Spill — 에디토리얼 워크북 뷰 (작성 + 돌아보기 통합).
 * 핸드오프 디자인(report-redesign/Report.html) 레이아웃을 단일 컴포넌트로 렌더.
 * editable=true → 작성(입력·자동저장·LLM 트리거), editable=false → 읽기 전용(돌아보기).
 * 같은 JSX·같은 report-view.css 를 공유하므로 두 모드의 디자인이 구조적으로 일치한다.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import "./report-view.css";
import { useWeeklyAutosave } from "../useWeeklyAutosave";
import {
  MIND_SPILL_BODY_SIGNS,
  MIND_SPILL_EMOTIONS,
} from "@/lib/mind-spill/constants";
import {
  EMPTY_BRAIN_DUMP,
  EMPTY_CLASSIFICATION,
  EMPTY_WEEKLY_SCAN,
  type BDItem,
  type BrainDump,
  type Classification,
  type CoachNote,
  type MirrorReport,
  type Prescription,
  type StrengthsReport,
  type WeeklyScan,
  type Workbook,
  type WorkbookPatch,
} from "@/lib/mind-spill/types";

type Props = { workbook: Workbook; editable?: boolean; readerName?: string };

/** 편집 모드에서 섹션들이 공유하는 편집 핸들 묶음. */
type EditCtx = {
  patch: (p: WorkbookPatch) => void;
  // LLM 트리거
  runMirror: () => void;
  mirrorLoading: boolean;
  mirrorError: string | null;
  runStrengths: () => void;
  strengthsLoading: boolean;
  strengthsError: string | null;
  runCoach: () => void;
  coachLoading: boolean;
  coachError: string | null;
};

/* ───────────── 포맷 헬퍼 ───────────── */

function vol(n: number): string {
  return String(n).padStart(2, "0");
}
function startedDot(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}
function footerDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
}
function genTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--:--";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function countWords(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}
function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
function makeId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
function newBd(): BDItem {
  return { id: makeId("bd"), text: "", created_at: new Date().toISOString() };
}

/* ───────────── effects (reveal / count-up / progress) ───────────── */

function useReportEffects(
  rootRef: React.RefObject<HTMLDivElement | null>,
  editable: boolean
) {
  useEffect(() => {
    const root: HTMLDivElement | null = rootRef.current;
    if (!root) return;
    const node: HTMLDivElement = root;

    const els = Array.from(node.querySelectorAll<HTMLElement>(".reveal"));

    function runCount(el: HTMLElement) {
      if (el.dataset.counted) return;
      el.dataset.counted = "1";
      const target = parseInt(el.dataset.count ?? "0", 10);
      const pad = target >= 10;
      const dur = 1100;
      const start = performance.now();
      function step(t: number) {
        const p = Math.min(1, (t - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        const cur = Math.round(target * eased);
        el.textContent = pad ? String(cur).padStart(2, "0") : String(cur);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = pad ? String(target).padStart(2, "0") : String(target);
      }
      requestAnimationFrame(step);
    }

    let io: IntersectionObserver | null = null;
    if (editable) {
      // 편집 모드: 인풋이 숨지 않도록 즉시 모두 reveal (fill 애니메이션 1회 재생).
      // count-up 은 건너뜀 — 편집 모드 숫자는 React 가 제어.
      els.forEach((e) => e.classList.add("in"));
    } else if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              const target = en.target as HTMLElement;
              target.classList.add("in");
              target
                .querySelectorAll<HTMLElement>("[data-count]")
                .forEach(runCount);
              io?.unobserve(target);
            }
          });
        },
        { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
      );
      els.forEach((e) => io?.observe(e));
    } else {
      els.forEach((e) => {
        e.classList.add("in");
        e.querySelectorAll<HTMLElement>("[data-count]").forEach(runCount);
      });
    }

    // 상단 진행 레일
    const fill = node.querySelector<HTMLElement>("#railFill");
    const pct = node.querySelector<HTMLElement>("#rail-pct");
    const railSpans = Array.from(
      node.querySelectorAll<HTMLElement>(".top-rail .center [data-section]")
    );
    const map = ["cover", "part01", "part02", "coach"];

    function updateRail() {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      const ratio = total > 0 ? clamp01(h.scrollTop / total) : 0;
      if (fill) fill.style.width = `${ratio * 100}%`;
      if (pct) pct.textContent = `${(ratio * 100).toFixed(0).padStart(2, "0")}%`;
      const y = h.scrollTop + window.innerHeight * 0.35;
      let cur = "cover";
      map.forEach((id) => {
        const el = node.querySelector<HTMLElement>(`#${id}`);
        if (el && el.offsetTop <= y) cur = id;
      });
      railSpans.forEach((s) => {
        const active = s.dataset.section === cur;
        s.style.color = active ? "var(--ink)" : "var(--mute)";
        s.style.fontWeight = active ? "700" : "400";
      });
    }
    updateRail();
    window.addEventListener("scroll", updateRail, { passive: true });

    return () => {
      io?.disconnect();
      window.removeEventListener("scroll", updateRail);
    };
  }, [rootRef, editable]);
}

/* ───────────── decorative heatmap 데이터 ───────────── */

function bodyHeatLevels(): number[] {
  const out: number[] = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 24; c++) {
      const base = r * 0.5 + c * 0.05;
      const noise = Math.sin(c * 0.7 + r * 1.2) * 0.5 + 0.5;
      const v = Math.min(4, Math.max(0, Math.floor(base + noise * (r < 2 ? 0.8 : 2.5))));
      out.push(v);
    }
  }
  return out;
}
const RECAP_HEAT = [
  0, 0, 1, 0, 0, 0, 1, 1, 2, 1,
  0, 0, 1, 1, 0, 1, 2, 2, 3, 2,
  1, 1, 2, 2, 3, 2, 3, 3, 4, 3,
  1, 2, 2, 3, 3, 3, 3, 4, 4, 4,
];
function heatClass(l: number): string {
  return l > 0 ? `l${l}` : "";
}

/* ───────────── 컴포넌트 ───────────── */

export function WorkbookEditorialView({
  workbook,
  editable = false,
  readerName,
}: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [wbState, setWbState] = useState<Workbook>(workbook);
  const { state: saveState, queueSave, flush } = useWeeklyAutosave(
    editable ? workbook.id : null
  );

  // LLM 결과는 patch 화이트리스트 밖 → 로컬 상태로 오버레이.
  const [mirrorLocal, setMirrorLocal] = useState<MirrorReport | null>(null);
  const [strengthsLocal, setStrengthsLocal] = useState<StrengthsReport | null>(
    null
  );
  const [coachLocal, setCoachLocal] = useState<{
    note: CoachNote;
    prescriptions: Prescription[];
  } | null>(null);
  const [mirrorLoading, setMirrorLoading] = useState(false);
  const [mirrorError, setMirrorError] = useState<string | null>(null);
  const [strengthsLoading, setStrengthsLoading] = useState(false);
  const [strengthsError, setStrengthsError] = useState<string | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);

  useReportEffects(rootRef, editable);

  // 병합 워크북: editable 이면 로컬 state + LLM 오버레이, 아니면 prop 그대로.
  const wb: Workbook = editable
    ? {
        ...wbState,
        mirror_report: mirrorLocal ?? wbState.mirror_report,
        strengths_report: strengthsLocal ?? wbState.strengths_report,
        coach_note: coachLocal?.note ?? wbState.coach_note,
        prescriptions: coachLocal?.prescriptions ?? wbState.prescriptions,
      }
    : workbook;

  function patch(p: WorkbookPatch) {
    setWbState((prev) => {
      const next: Workbook = { ...prev };
      for (const [k, v] of Object.entries(p)) {
        (next as unknown as Record<string, unknown>)[k] = v as unknown;
      }
      return next;
    });
    queueSave(p);
  }

  async function runMirror() {
    setMirrorLoading(true);
    setMirrorError(null);
    try {
      const res = await fetch("/api/mind-spill/mirror-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workbookId: workbook.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMirrorError(data?.error ?? "분석 중 문제가 생겼어요.");
        return;
      }
      setMirrorLocal(data.mirror_report);
    } catch {
      setMirrorError("네트워크 오류가 발생했어요.");
    } finally {
      setMirrorLoading(false);
    }
  }

  async function runStrengths() {
    setStrengthsLoading(true);
    setStrengthsError(null);
    try {
      const res = await fetch("/api/mind-spill/strengths-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workbookId: workbook.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStrengthsError(data?.error ?? "분석 중 문제가 생겼어요.");
        return;
      }
      if (Array.isArray(data?.moments)) patch({ moments: data.moments });
      if (data?.strengths_report) setStrengthsLocal(data.strengths_report);
    } catch {
      setStrengthsError("네트워크 오류가 발생했어요.");
    } finally {
      setStrengthsLoading(false);
    }
  }

  async function runCoach() {
    setCoachLoading(true);
    setCoachError(null);
    try {
      const res = await fetch("/api/mind-spill/coach-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workbookId: workbook.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCoachError(data?.error ?? "리포트 생성 중 문제가 생겼어요.");
        return;
      }
      setCoachLocal({
        note: data.coach_note,
        prescriptions: data.prescriptions ?? [],
      });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const target = rootRef.current?.querySelector("#coach");
          if (target instanceof HTMLElement) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
      });
    } catch {
      setCoachError("네트워크 오류가 발생했어요.");
    } finally {
      setCoachLoading(false);
    }
  }

  const edit: EditCtx | null = editable
    ? {
        patch,
        runMirror,
        mirrorLoading,
        mirrorError,
        runStrengths,
        strengthsLoading,
        strengthsError,
        runCoach,
        coachLoading,
        coachError,
      }
    : null;

  const scan = wb.weekly_scan ?? EMPTY_WEEKLY_SCAN;
  const bd = wb.brain_dump ?? EMPTY_BRAIN_DUMP;
  const cls = wb.classification ?? EMPTY_CLASSIFICATION;
  const mirror = wb.mirror_report;
  const moments = wb.moments ?? [];
  const actions = wb.actions ?? [];
  const note = wb.coach_note;
  const prescriptions = wb.prescriptions ?? [];

  // brain dump 집계 (read-only 표시 + 진행 통계)
  const recurring = (bd.recurring ?? []).filter((b) => b.text.trim());
  const discomfort = (bd.discomfort ?? []).filter((b) => b.text.trim());
  const todos = (bd.todos ?? []).filter((b) => b.text.trim());
  const allBd: BDItem[] = [...recurring, ...discomfort, ...todos];
  const bdById = new Map(allBd.map((b) => [b.id, b]));
  const totalEntries = allBd.length;
  const totalWords = allBd.reduce((s, b) => s + countWords(b.text), 0);
  const categories = [recurring, discomfort, todos].filter(
    (c) => c.length > 0
  ).length;

  const reader = readerName?.trim() || "나";
  const datapoints = countDatapoints(scan) + totalEntries;

  const saveBadge = useMemo(() => {
    if (!editable) return null;
    switch (saveState) {
      case "saving":
        return (
          <span className="rail-save saving">
            <span className="d" /> saving
          </span>
        );
      case "saved":
        return (
          <span className="rail-save saved">
            <span className="d" /> saved
          </span>
        );
      case "error":
        return (
          <button
            type="button"
            className="rail-save error"
            onClick={() => flush()}
          >
            <span className="d" /> retry
          </button>
        );
      default:
        return (
          <span className="rail-save">
            <span className="d" /> auto
          </span>
        );
    }
  }, [editable, saveState, flush]);

  return (
    <div className={`ms-report${editable ? " editable" : ""}`} ref={rootRef}>
      <TopRail
        volumeNo={workbook.volume_no}
        editable={editable}
        saveBadge={saveBadge}
        onFlush={flush}
      />

      <div className="shell">
        <Cover
          volumeNo={workbook.volume_no}
          createdAt={workbook.created_at}
          reader={reader}
          status={wb.status}
        />

        {/* ===== PART 01 ===== */}
        <section className="part" id="part01">
          <PartHead
            n="01"
            kr="비우기"
            en="EMPTY · OUT"
            summary="정확하지 않아도 괜찮습니다. 떠오르는 대로, 짐작으로도 충분합니다. 머릿속에 쌓여 있는 것을 한 번에 비웁니다."
            chapters="03"
            statB={{ k: "DATAPOINTS", v: datapoints }}
            statC={{ k: "WORDS IN", v: totalWords }}
            onSegs={3}
            editable={editable}
          />

          <ScanSection scan={scan} edit={edit} />
          <BrainDumpSection
            dump={bd}
            recurring={recurring}
            discomfort={discomfort}
            todos={todos}
            entries={totalEntries}
            words={totalWords}
            categories={categories}
            volumeNo={workbook.volume_no}
            edit={edit}
          />
          {(mirror || editable) && (
            <MirrorSection mirror={mirror} edit={edit} bdCount={totalEntries} />
          )}
        </section>

        {/* ===== BREATH ===== */}
        <section className="breath">
          <div className="q">비웠으면, 잠시 숨을 고릅니다.</div>
          <div className="pulse-bar" />
          <div className="meta">INHALE · 4&nbsp;&nbsp;&nbsp;HOLD · 4&nbsp;&nbsp;&nbsp;EXHALE · 6</div>
        </section>

        {/* ===== PART 02 ===== */}
        <section className="part" id="part02">
          <PartHead
            n="02"
            kr="채우기"
            en="FILL · BACK"
            summary="비운 자리에 무엇을 다시 채울지 천천히 고릅니다. 사실과 생각을 분리하고, 통제할 수 있는 것만 골라, 24시간 안에 할 수 있는 한 걸음으로 만듭니다."
            chapters="04"
            statB={{ k: "ACTIONS", v: actions.length }}
            statC={{ k: "STRENGTHS", v: moments.length }}
            onSegs={4}
            editable={editable}
          />

          <FactThoughtSection
            dump={bd}
            allBd={allBd}
            cls={cls}
            edit={edit}
          />
          <ControlSection dump={bd} cls={cls} bdById={bdById} edit={edit} />
          <ActionSection
            actions={actions}
            cls={cls}
            bdById={bdById}
            edit={edit}
          />
          <StrengthsSection
            moments={moments}
            report={wb.strengths_report}
            hasCoach={!!note}
            edit={edit}
          />
        </section>

        {/* ===== COACH REPORT ===== */}
        {note && (
          <section className="part" id="coach" style={{ paddingTop: 64 }}>
            <CoachReport
              note={note}
              prescriptions={prescriptions}
              scan={scan}
              moments={moments}
              datapoints={datapoints}
              volumeNo={workbook.volume_no}
              reader={reader}
              generatedAt={wb.updated_at}
            />
          </section>
        )}

        {/* ===== CTA ===== */}
        {note?.counseling && <CounselingCta counseling={note.counseling} />}
      </div>

      <footer className="report-footer">
        MIND&nbsp;SPILL · VOL.&nbsp;{vol(workbook.volume_no)} ·{" "}
        {footerDate(workbook.created_at)} · Reader&nbsp;{reader} · END&nbsp;OF&nbsp;DOC
      </footer>
    </div>
  );
}

/** /report 라우트 등 읽기 전용 진입점 호환용 별칭. */
export function ReportView(props: Props) {
  return <WorkbookEditorialView {...props} editable={false} />;
}

/* ───────────── TOP RAIL ───────────── */

function TopRail({
  volumeNo,
  editable,
  saveBadge,
  onFlush,
}: {
  volumeNo: number;
  editable: boolean;
  saveBadge: React.ReactNode;
  onFlush: () => void;
}) {
  return (
    <header className="top-rail">
      <div className="top-rail-inner">
        {editable ? (
          <Link
            href="/dashboard/mind-spill"
            className="brand"
            onClick={() => void onFlush()}
          >
            <span className="blip" />
            <span>← MIND&nbsp;SPILL · V{vol(volumeNo)}</span>
          </Link>
        ) : (
          <div className="brand">
            <span className="blip" />
            <span>MIND&nbsp;SPILL · V{vol(volumeNo)}</span>
          </div>
        )}
        <div className="center">
          <span data-section="cover">COVER</span>
          <span data-section="part01">PART · 비우기</span>
          <span data-section="part02">PART · 채우기</span>
          <span data-section="coach">COACH</span>
        </div>
        <div className="right">
          <span id="rail-pct">00%</span>
          <span className="progress-track">
            <span className="progress-fill" id="railFill" />
          </span>
          {editable ? saveBadge : <span>SCROLL</span>}
        </div>
      </div>
    </header>
  );
}

/* ───────────── COVER ───────────── */

function Cover({
  volumeNo,
  createdAt,
  reader,
  status,
}: {
  volumeNo: number;
  createdAt: string;
  reader: string;
  status: Workbook["status"];
}) {
  return (
    <section className="cover" id="cover">
      <div className="cover-grid">
        <div>
          <h1>
            <span className="word"><span>마음을</span></span><br />
            <span className="word"><span className="acc">쏟아내고,</span></span><br />
            <span className="word"><span>자기를&nbsp;</span></span>
            <span className="word"><span>줍는&nbsp;</span></span><br />
            <span className="word"><span>한&nbsp;</span></span>
            <span className="word"><span>회.</span></span>
          </h1>
          <p className="cover-lede">
            마음이 힘들 때, 생각이 많을 때, 언제든 한 회.<br />
            <span className="mono" style={{ fontSize: 13, letterSpacing: "0.04em", color: "var(--mute)" }}>
              — 비우고 채웁니다 —
            </span>
          </p>
        </div>

        <aside className="cover-side">
          <div className="live-strip">
            <span className="dot" />
            <span>SESSION · {status === "completed" ? "DONE" : "DRAFT"}</span>
            <span>VOL · {vol(volumeNo)}</span>
          </div>
          <div className="meta-row">
            <MetaItem k="Started" v={startedDot(createdAt)} mono />
            <MetaItem k="Duration" v={<><span className="mono">25</span>min</>} />
            <MetaItem k="Edition" v={<>Vol. <span className="mono">{vol(volumeNo)}</span></>} />
            <MetaItem k="Reader" v={`${reader} 님`} />
          </div>
        </aside>
      </div>

      <div className="cover-ticker">
        <div className="ticker-track">
          {[0, 1].map((dup) => (
            <span key={dup} style={{ display: "inline-flex", gap: 36 }}>
              <span>BIWUGI · 비우기</span><i>—</i>
              <span className="acc">CHAEUGI · 채우기</span><i>—</i>
              <span>SCAN</span><i>·</i>
              <span>BRAIN DUMP</span><i>·</i>
              <span>REFLECT</span><i>·</i>
              <span>SORT</span><i>·</i>
              <span>SPLIT</span><i>·</i>
              <span>ACT</span><i>·</i>
              <span>FIND STRENGTHS</span><i>·</i>
              <span className="acc">COACH REPORT</span><i>—</i>
              <span>VOL · {vol(volumeNo)}</span><i>—</i>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function MetaItem({
  k,
  v,
  mono,
}: {
  k: string;
  v: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="meta-item">
      <span className="k">{k}</span>
      <span className="v">{mono ? <span className="mono">{v}</span> : v}</span>
    </div>
  );
}

/* ───────────── PART HEAD ───────────── */

function PartHead({
  n,
  kr,
  en,
  summary,
  chapters,
  statB,
  statC,
  onSegs,
  editable,
}: {
  n: string;
  kr: string;
  en: string;
  summary: string;
  chapters: string;
  statB: { k: string; v: number };
  statC: { k: string; v: number };
  onSegs: number;
  editable: boolean;
}) {
  return (
    <div className="part-head reveal">
      <div>
        <div className="label"><span className="barlet" />PART · {n === "01" ? "ONE" : "TWO"}</div>
        <div className="num">{n}</div>
        <h2>{kr}</h2>
        <div className="en">{en}</div>
        <p className="summary">{summary}</p>
      </div>
      <div>
        <div className="mono" style={{ fontSize: 10.5, letterSpacing: "0.22em", color: "var(--mute)", textTransform: "uppercase", marginBottom: 14 }}>
          SECTION&nbsp;PROGRESS
        </div>
        <div className="stage-meter">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`seg${i < onSegs ? " on" : ""}`}
              style={i < onSegs ? { animationDelay: `${i * 0.1}s` } : undefined}
            />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginTop: 28 }}>
          <StatCell k="CHAPTERS" v={chapters} editable={editable} />
          <StatCell k={statB.k} count={statB.v} editable={editable} />
          <StatCell k={statC.k} count={statC.v} editable={editable} />
        </div>
      </div>
    </div>
  );
}

function StatCell({
  k,
  v,
  count,
  editable,
}: {
  k: string;
  v?: string;
  count?: number;
  editable: boolean;
}) {
  // 편집 모드: 라이브 갱신을 위해 data-count 없이 React 가 직접 렌더.
  const display =
    v != null
      ? v
      : count != null
        ? editable
          ? String(count).padStart(count >= 10 ? 2 : 1, "0")
          : "00"
        : "—";
  return (
    <div>
      <div className="mono" style={{ fontSize: 9.5, color: "var(--mute)", letterSpacing: "0.22em", textTransform: "uppercase" }}>
        {k}
      </div>
      <div
        className="mono"
        style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}
        data-count={!editable && count != null ? count : undefined}
      >
        {display}
      </div>
    </div>
  );
}

/* ───────────── I. SCAN ───────────── */

function ScanSection({
  scan,
  edit,
}: {
  scan: WeeklyScan;
  edit: EditCtx | null;
}) {
  const editing = !!edit;
  const selectedEmotions = scan.emotions ?? [];
  const customEmotions = selectedEmotions.filter(
    (e) => !(MIND_SPILL_EMOTIONS as readonly string[]).includes(e)
  );
  const intensity = scan.emotion_intensity;
  // 편집 모드: 선택한 감정 전체 / 읽기 모드: 상위 4개
  const heatEmotions = editing ? selectedEmotions : selectedEmotions.slice(0, 4);

  const bodySigns = (scan.body_signs ?? []).filter((b) => b !== "없음");
  const energy = scan.energy;
  const focus = scan.focus;
  const motivation = scan.motivation;
  const condVals = [energy, focus, motivation].filter(
    (v): v is number => v != null
  );
  const condAvg = condVals.length
    ? Math.round(condVals.reduce((a, b) => a + b, 0) / condVals.length)
    : null;

  const recovery = scan.sleep_recovery;
  const ringFill = recovery != null ? recovery / 10 : 0.5;
  const C = 2 * Math.PI * 45;

  function up<K extends keyof WeeklyScan>(key: K, value: WeeklyScan[K]) {
    edit?.patch({ weekly_scan: { ...scan, [key]: value } });
  }
  function toggleStr(key: "emotions" | "body_signs", v: string) {
    const list = (scan[key] ?? []) as string[];
    up(key, (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]) as WeeklyScan[typeof key]);
  }
  function setEmotionVal(e: string, v: number) {
    const m = { ...(scan.emotion_intensities ?? {}), [e]: v };
    edit?.patch({
      weekly_scan: {
        ...scan,
        emotion_intensities: m,
        emotion_intensity: Math.max(...Object.values(m), 0),
      },
    });
  }

  return (
    <div className="sec" id="scan">
      <SecHead
        ix="i. — chapter"
        h3="지금의 나를 스캔합니다"
        desc="정확하지 않아도 괜찮습니다. 떠오르는 대로, 짐작으로도 충분합니다. 그날의 감정·수면·신체·컨디션을 한눈에."
        tagL="SCAN"
        tagR="4 DIM"
      />

      <div className="scan-grid">
        {/* Emotion */}
        <div className="panel panel-emotion reveal d1">
          <PanelHead title="감정" en="Emotion" meta={intensity != null ? `INTENSITY · ${intensity}/10` : "—"} />
          <div className="emotion-split">
            <div>
              <div className="chip-row">
                {MIND_SPILL_EMOTIONS.map((e) => {
                  const on = selectedEmotions.includes(e);
                  return editing ? (
                    <button
                      type="button"
                      key={e}
                      className={`chip${on ? " on" : ""}`}
                      onClick={() => toggleStr("emotions", e)}
                    >
                      {on && <span className="dot" />}
                      {e}
                    </button>
                  ) : (
                    <span key={e} className={`chip${on ? " on" : ""}`}>
                      {on && <span className="dot" />}
                      {e}
                    </span>
                  );
                })}
                {customEmotions.map((e) =>
                  editing ? (
                    <button
                      type="button"
                      key={e}
                      className="chip on"
                      onClick={() => toggleStr("emotions", e)}
                    >
                      <span className="dot" />{e} ×
                    </button>
                  ) : (
                    <span key={e} className="chip on"><span className="dot" />{e}</span>
                  )
                )}
                {editing && (
                  <CustomChipInput
                    placeholder="+ 추가"
                    onAdd={(v) => {
                      if (!selectedEmotions.includes(v)) toggleStr("emotions", v);
                    }}
                  />
                )}
              </div>
              <div>
                {heatEmotions.length === 0 ? (
                  <div className="empty-line">
                    {editing ? "위에서 감정을 선택하면 강도를 조절할 수 있어요." : "선택한 감정이 없어요."}
                  </div>
                ) : (
                  heatEmotions.map((e) => {
                    const val = scan.emotion_intensities?.[e] ?? intensity ?? null;
                    const w = val != null ? val / 10 : 0.5;
                    return (
                      <div className="heatrow" key={e} style={{ ["--w" as string]: w }}>
                        <div className="lbl">{e}</div>
                        <div className="bar">
                          <i />
                          {editing && (
                            <input
                              type="range"
                              min={0}
                              max={10}
                              step={0.5}
                              value={val ?? 5}
                              onChange={(ev) => setEmotionVal(e, Number(ev.target.value))}
                              aria-label={`${e} 강도`}
                            />
                          )}
                        </div>
                        <div className="num">{val != null ? val.toFixed(1) : "—"}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sleep */}
        <div className="panel panel-sleep reveal d2">
          <PanelHead
            title="수면"
            en="Sleep"
            meta={recovery != null ? `RESTORED · ${recovery * 10}%` : "—"}
          />
          <div className="sleep-flex">
            <div className="ring" style={{ ["--C" as string]: C, ["--off" as string]: C * (1 - clamp01(ringFill)) }}>
              <svg viewBox="0 0 110 110">
                <circle className="track" cx="55" cy="55" r="45" />
                <circle className="fill" cx="55" cy="55" r="45" />
              </svg>
              <div className="ring-num">
                {editing ? (
                  <b>
                    <input
                      className="ring-input"
                      type="number"
                      min={0}
                      max={14}
                      step={0.5}
                      value={scan.sleep_avg_hours ?? ""}
                      placeholder="0"
                      onChange={(ev) =>
                        up("sleep_avg_hours", ev.target.value === "" ? null : Number(ev.target.value))
                      }
                      aria-label="평균 수면 시간"
                    />
                    h
                  </b>
                ) : (
                  <b>{formatHoursNode(scan.sleep_avg_hours)}</b>
                )}
                <span>SLEPT</span>
              </div>
            </div>
            <div className="sleep-stats">
              <SleepStat
                label="잠들기까지"
                value={scan.sleep_latency_min}
                unit="min"
                w={scan.sleep_latency_min != null ? clamp01(scan.sleep_latency_min / 60) : 0}
                editable={editing}
                min={0}
                max={180}
                step={5}
                onChange={(v) => up("sleep_latency_min", v)}
              />
              <SleepStat
                label="회복감"
                value={recovery}
                unit="/ 10"
                w={recovery != null ? recovery / 10 : 0}
                editable={editing}
                min={0}
                max={10}
                step={1}
                onChange={(v) => up("sleep_recovery", v)}
              />
              <SleepStat
                label="중간 깸"
                value={scan.sleep_wake_count ?? null}
                unit="×"
                w={scan.sleep_wake_count != null ? clamp01(scan.sleep_wake_count / 5) : 0}
                editable={editing}
                min={0}
                max={10}
                step={1}
                onChange={(v) => up("sleep_wake_count", v)}
              />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="panel panel-body reveal d3">
          <PanelHead title="신체 반응" en="Body" meta={`${bodySigns.length} ACTIVE`} />
          <div className="body-grid">
            <div className="body-tags">
              {MIND_SPILL_BODY_SIGNS.filter((b) => b !== "없음").map((b) => {
                const on = bodySigns.includes(b);
                return editing ? (
                  <button
                    type="button"
                    key={b}
                    className={`body-tag${on ? " on" : ""}`}
                    onClick={() => toggleStr("body_signs", b)}
                  >
                    {b}
                  </button>
                ) : (
                  <span key={b} className={`body-tag${on ? " on" : ""}`}>{b}</span>
                );
              })}
              {editing && (
                <CustomChipInput
                  placeholder="+ 추가"
                  onAdd={(v) => {
                    if (!bodySigns.includes(v)) toggleStr("body_signs", v);
                  }}
                />
              )}
            </div>
            <div>
              <div className="heatdots">
                {bodyHeatLevels().map((l, i) => (
                  <i key={i} className={heatClass(l)} />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: "var(--mute)", letterSpacing: "0.16em" }}>
                <span>00:00</span><span>NOW</span>
              </div>
            </div>
          </div>
        </div>

        {/* Condition */}
        <div className="panel panel-condition reveal d4">
          <PanelHead title="컨디션" en="Condition" meta={condAvg != null ? `AVG · ${condAvg}/10` : "—"} />
          <div className="cond-row">
            <CondStat label="에너지" value={energy} editable={editing} onSet={(v) => up("energy", v)} />
            <CondStat label="집중력" value={focus} editable={editing} onSet={(v) => up("focus", v)} />
            <CondStat label="의욕" value={motivation} editable={editing} onSet={(v) => up("motivation", v)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function formatHoursNode(h: number | null): React.ReactNode {
  if (h == null) return "—";
  const whole = Math.floor(h);
  const min = Math.round((h - whole) * 60);
  return (
    <>
      {whole}h{min > 0 && <span style={{ fontSize: 14 }}>{min}m</span>}
    </>
  );
}

function SleepStat({
  label,
  value,
  unit,
  w,
  editable,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number | null;
  unit: string;
  w: number;
  editable?: boolean;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (v: number | null) => void;
}) {
  return (
    <div className="sleep-stat" style={{ ["--w" as string]: w }}>
      <div className="row1">
        <span>{label}</span>
        <span>
          {editable ? (
            <input
              className="num stat-input"
              type="number"
              min={min}
              max={max}
              step={step}
              value={value ?? ""}
              placeholder="0"
              onChange={(e) =>
                onChange?.(e.target.value === "" ? null : Number(e.target.value))
              }
              aria-label={label}
            />
          ) : (
            <span className="num">{value != null ? value : "—"}</span>
          )}{" "}
          {unit}
        </span>
      </div>
      <div className="bar"><i /></div>
    </div>
  );
}

function CondStat({
  label,
  value,
  editable,
  onSet,
}: {
  label: string;
  value: number | null;
  editable?: boolean;
  onSet?: (v: number) => void;
}) {
  const v = value ?? 0;
  const legend =
    value == null ? "—" : v <= 3 ? "LOW · 회복 필요" : v <= 6 ? "MID" : "GOOD";
  return (
    <div className="seg-stat">
      <div className="row1">
        <span>{label}</span>
        <span><span className="num">{value != null ? value : "—"}</span> / 10</span>
      </div>
      <div className="seg-bar">
        {Array.from({ length: 10 }).map((_, i) => {
          const on = i < v;
          const warn = on && v <= 4;
          const cls = warn ? "warn" : on ? "on" : "";
          return editable ? (
            <button
              type="button"
              key={i}
              className={cls}
              onClick={() => onSet?.(i + 1)}
              aria-label={`${label} ${i + 1}`}
            />
          ) : (
            <i key={i} className={cls} />
          );
        })}
      </div>
      <div className="legend">{legend}</div>
    </div>
  );
}

/** 커스텀 칩 입력 — 편집 모드 감정/신체 직접 추가. */
function CustomChipInput({
  placeholder,
  onAdd,
}: {
  placeholder: string;
  onAdd: (v: string) => void;
}) {
  const [draft, setDraft] = useState("");
  function commit() {
    const v = draft.trim();
    if (v) onAdd(v);
    setDraft("");
  }
  return (
    <input
      className="chip chip-input"
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === ",") {
          e.preventDefault();
          commit();
        }
      }}
      onBlur={commit}
    />
  );
}

function PanelHead({ title, en, meta }: { title: string; en: string; meta: string }) {
  return (
    <div className="p-head">
      <div className="p-title">
        <h4>{title}</h4>
        <span className="en">{en}</span>
      </div>
      <div className="p-meta">{meta}</div>
    </div>
  );
}

function SecHead({
  ix,
  h3,
  desc,
  tagL,
  tagR,
}: {
  ix: string;
  h3: string;
  desc: string;
  tagL: string;
  tagR: string;
}) {
  return (
    <div className="sec-head reveal">
      <div className="ix">{ix}</div>
      <div>
        <h3>{h3}</h3>
        <p className="desc">{desc}</p>
      </div>
      <div className="tag"><span>{tagL}</span><span>{tagR}</span></div>
    </div>
  );
}

/* ───────────── II. BRAIN DUMP ───────────── */

function BrainDumpSection({
  dump,
  recurring,
  discomfort,
  todos,
  entries,
  words,
  categories,
  volumeNo,
  edit,
}: {
  dump: BrainDump;
  recurring: BDItem[];
  discomfort: BDItem[];
  todos: BDItem[];
  entries: number;
  words: number;
  categories: number;
  volumeNo: number;
  edit: EditCtx | null;
}) {
  const editing = !!edit;
  function setCol(col: keyof BrainDump, items: BDItem[]) {
    edit?.patch({ brain_dump: { ...dump, [col]: items } });
  }
  return (
    <div className="sec" id="dump">
      <SecHead
        ix="ii. — chapter"
        h3="머릿속을 쏟아냅니다"
        desc="완성된 문장이 아니어도, 모순돼도, 부끄러워도 괜찮습니다. 검열 없이 적어 내려간 기록이에요."
        tagL="BRAIN DUMP"
        tagR={`${entries} ENTRIES`}
      />

      <div className="bd-bar reveal">
        <BdStat v={entries} k="ENTRIES" editable={editing} />
        <BdStat v={words} k="WORDS" editable={editing} />
        <BdStat v={categories} k="CATEGORIES" editable={editing} />
        <div className="bd-stat"><div className="v mono">{vol(volumeNo)}</div><div className="k">VOL</div></div>
        <div className="live"><span className="ring-dot" /> {editing ? "WRITING" : "SAVED"}</div>
      </div>

      <div className="bd-grid">
        <BdColumn
          kr="현재, 나를 불편하게 하는"
          en="RECURRING"
          sub="요즘 머릿속에 자주 자리 잡는 생각, 자꾸 신경 쓰이는 일."
          items={editing ? (dump.recurring ?? []) : recurring}
          itemClass="recurring"
          editable={editing}
          onChange={(items) => setCol("recurring", items)}
        />
        <BdColumn
          kr="나를 불편하게 만든 생각들"
          en="DISCOMFORT"
          sub="두려웠거나 불안하게 만든 생각. 막연한 것도, 형태가 없는 것도 괜찮습니다."
          items={editing ? (dump.discomfort ?? []) : discomfort}
          itemClass="discomfort"
          editable={editing}
          onChange={(items) => setCol("discomfort", items)}
        />
        <BdColumn
          kr="해야 하는 일, 하지 않은 일"
          en="TO-DO · UNDONE"
          sub="큰 일도, 미루고 있는 작은 일도 모두. 죄책감이 따라오는 항목일수록."
          items={editing ? (dump.todos ?? []) : todos}
          itemClass="recurring"
          editable={editing}
          onChange={(items) => setCol("todos", items)}
        />
      </div>
    </div>
  );
}

function BdStat({
  v,
  k,
  editable,
}: {
  v: number;
  k: string;
  editable: boolean;
}) {
  return (
    <div className="bd-stat">
      <div className="v" data-count={editable ? undefined : v}>
        {editable ? String(v).padStart(2, "0") : "00"}
      </div>
      <div className="k">{k}</div>
    </div>
  );
}

function BdColumn({
  kr,
  en,
  sub,
  items,
  itemClass,
  editable,
  onChange,
}: {
  kr: string;
  en: string;
  sub: string;
  items: BDItem[];
  itemClass: "recurring" | "discomfort";
  editable: boolean;
  onChange: (items: BDItem[]) => void;
}) {
  // 편집 모드: 항상 빈 항목 1개를 끝에 유지하는 draft. 부모에는 비어있지 않은 것만 전달.
  const [draft, setDraft] = useState<BDItem[]>(
    items.length ? items : [newBd()]
  );
  function commit(next: BDItem[]) {
    setDraft(next.length ? next : [newBd()]);
    onChange(next.filter((x) => x.text.trim().length > 0));
  }
  const count = editable
    ? draft.filter((x) => x.text.trim()).length
    : items.length;

  return (
    <div className="bd-col reveal d1">
      <div className="bd-col-head">
        <h5>{kr}<span className="en">{en}</span></h5>
        <p className="colsub">{sub}</p>
        <div className="col-meta"><span className="k">ENTRIES</span><span className="v mono">{vol(count)}</span></div>
      </div>
      <div className="bd-col-list">
        {editable ? (
          <>
            {draft.map((it, i) => (
              <div className={`bd-item ${itemClass}`} key={it.id}>
                <div className="ln">{vol(i + 1)}</div>
                <textarea
                  className="txt bd-textarea"
                  value={it.text}
                  rows={1}
                  placeholder="한 줄씩 적어주세요"
                  onChange={(e) =>
                    commit(
                      draft.map((x) =>
                        x.id === it.id ? { ...x, text: e.target.value } : x
                      )
                    )
                  }
                />
                {draft.length > 1 && (
                  <button
                    type="button"
                    className="bd-del"
                    onClick={() => commit(draft.filter((x) => x.id !== it.id))}
                    aria-label="삭제"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              className="bd-add"
              onClick={() => commit([...draft, newBd()])}
            >
              + ENTRY 추가
            </button>
          </>
        ) : items.length === 0 ? (
          <div className="empty-line">적은 내용이 없어요.</div>
        ) : (
          items.map((it, i) => (
            <div className={`bd-item ${itemClass}`} key={it.id}>
              <div className="ln">{vol(i + 1)}</div>
              <div className="txt">{it.text}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ───────────── III. MIRROR ───────────── */

const CLUSTER_COLORS = ["var(--accent)", "#C24A1B", "var(--ink)"];

function MirrorSection({
  mirror,
  edit,
  bdCount,
}: {
  mirror: MirrorReport | null | undefined;
  edit: EditCtx | null;
  bdCount: number;
}) {
  const editing = !!edit;
  const clusters = mirror?.emotion_clusters ?? [];
  const distortions = mirror?.cognitive_distortions ?? [];
  const links = mirror?.body_thought_links ?? [];

  // 편집 모드 + 아직 분석 전: 트리거 표면.
  if (editing && !mirror) {
    const canRun = bdCount > 0 && !edit!.mirrorLoading;
    return (
      <div className="sec" id="mirror">
        <SecHead
          ix="iii. — chapter"
          h3="거울이 돌아옵니다"
          desc="진단이 아닙니다. 당신이 적은 것들을 다시 비춰주는, 한 발 떨어진 관찰입니다."
          tagL="REFLECT"
          tagR="CBT"
        />
        <div className="mirror-frame reveal">
          <div className="mirror-trigger">
            <p>비우기를 마쳤다면, 지금까지 적은 것들을 종합해 거울처럼 비춰드려요.</p>
            <button
              type="button"
              className="ms-trigger-btn"
              onClick={() => edit!.runMirror()}
              disabled={!canRun}
            >
              {edit!.mirrorLoading ? "분석 중…" : "내 상태 진단하기 →"}
            </button>
            {!canRun && !edit!.mirrorLoading && (
              <p className="trigger-hint">먼저 브레인 덤프에 한 줄이라도 적어주세요.</p>
            )}
            {edit!.mirrorError && <p className="trigger-error">{edit!.mirrorError}</p>}
          </div>
        </div>
      </div>
    );
  }

  if (!mirror) return null;

  return (
    <div className="sec" id="mirror">
      <SecHead
        ix="iii. — chapter"
        h3="거울이 돌아옵니다"
        desc="진단이 아닙니다. 당신이 적은 것들을 다시 비춰주는, 한 발 떨어진 관찰입니다."
        tagL="REFLECT"
        tagR="CBT"
      />

      <div className="mirror-frame reveal">
        <div className="mirror-head">
          <h4>Reflective Mirror <span className="live-tag">ANALYZED</span></h4>
          <div className="vol">CBT · v01</div>
          <div className="gen"><span className="gd" /> GENERATED</div>
        </div>

        {mirror.intro && <div className="mirror-summary">{mirror.intro}</div>}

        <div className="mirror-body">
          {clusters.length > 0 && (
            <>
              <div className="mirror-sub"><span className="a">A.</span> 감정 클러스터</div>
              <div className="cluster-bar">
                {clusters.map((c, i) => (
                  <div
                    key={i}
                    className={`seg c${(i % 3) + 1}`}
                    style={{ ["--cw" as string]: `${c.percent}%` }}
                  >
                    {c.category} · {c.percent}%
                  </div>
                ))}
              </div>
              <div className="cluster-legend">
                {clusters.map((c, i) => (
                  <div className="lg" key={i}>
                    <span className="sw" style={{ background: CLUSTER_COLORS[i % 3] }} />
                    <span>
                      <b>{c.category}</b>
                      {(c.keywords ?? []).join(", ")}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {distortions.length > 0 && (
            <>
              <div className="mirror-sub" style={{ marginTop: 32 }}><span className="a">B.</span> 감지된 인지 오류</div>
              <div className="err-grid">
                {distortions.map((d, i) => (
                  <div className="err-card" key={i}>
                    <div className="ek">
                      <span>{d.distortion_type}</span>
                      <span>·{d.frequency ?? 1}회</span>
                    </div>
                    <div className="quote">&ldquo;{d.quoted_text}&rdquo;</div>
                    <div className="desc">{d.brief_explanation}</div>
                    {d.reframe && <div className="rep">{d.reframe}</div>}
                  </div>
                ))}
              </div>
            </>
          )}

          {links.length > 0 && (
            <>
              <div className="mirror-sub" style={{ marginTop: 32 }}><span className="a">C.</span> 몸 · 감정 · 생각의 연결</div>
              <div className="connect-grid">
                {links.map((l, i) => (
                  <div className="connect-row" key={i}>
                    <span className="body-pill">{l.body}</span>
                    <div className="link"><i>↔</i></div>
                    <span className="think">{l.linked_thought}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────── IV. FACT vs THOUGHT ───────────── */

function FactThoughtSection({
  dump,
  allBd,
  cls,
  edit,
}: {
  dump: BrainDump;
  allBd: BDItem[];
  cls: Classification;
  edit: EditCtx | null;
}) {
  const editing = !!edit;
  const factCheck = cls.fact_check ?? {};

  // 편집: recurring+discomfort 전체가 분류 대상 / 읽기: 분류된 것만.
  const checkable: BDItem[] = editing
    ? [...(dump.recurring ?? []), ...(dump.discomfort ?? [])].filter((b) =>
        b.text.trim()
      )
    : allBd.filter((b) => !!factCheck[b.id]);

  const factCount = checkable.filter((b) => factCheck[b.id] === "fact").length;
  const thoughtCount = checkable.filter((b) => factCheck[b.id] === "thought").length;
  const unsorted = editing
    ? checkable.length - factCount - thoughtCount
    : allBd.length - factCount - thoughtCount;
  const tot = factCount + thoughtCount || 1;
  const fw = Math.round((factCount / tot) * 100);
  const tw = 100 - fw;

  function setFlag(id: string, flag: "fact" | "thought" | null) {
    const next = { ...factCheck };
    if (flag === null) delete next[id];
    else next[id] = flag;
    // fact 가 아니게 되면 통제권 분류에서 제거 (교차 부수효과 보존).
    let cleaned = cls;
    if (flag !== "fact") {
      cleaned = {
        ...cls,
        controllable: (cls.controllable ?? []).filter((x) => x !== id),
        influenceable: (cls.influenceable ?? []).filter((x) => x !== id),
        uncontrollable: (cls.uncontrollable ?? []).filter((x) => x !== id),
      };
    }
    edit!.patch({ classification: { ...cleaned, fact_check: next } });
  }

  if (!editing && checkable.length === 0) {
    return (
      <div className="sec" id="ft">
        <SecHead ix="iv. — chapter" h3="사실인가, 생각인가" desc="사실과 생각을 구분해두면 다음 단계가 훨씬 명확해집니다." tagL="SORT" tagR="—" />
        <div className="empty-line">아직 사실/생각으로 분류한 항목이 없어요.</div>
      </div>
    );
  }

  return (
    <div className="sec" id="ft">
      <SecHead
        ix="iv. — chapter"
        h3="사실인가, 생각인가"
        desc="통제권을 나누기 전에 먼저 분류합니다. 사실(실제로 일어난 일)과 생각(아직 일어나지 않은 해석·추측)을 구분해두면, 다음 단계가 훨씬 명확해집니다."
        tagL="SORT"
        tagR={`F ${factCount} · T ${thoughtCount}`}
      />

      <div className="ft-summary reveal">
        <FtCount cls="fact" v={factCount} label="FACT" editable={editing} />
        <FtCount cls="thought" v={thoughtCount} label="THOUGHT" editable={editing} />
        <FtCount cls="un" v={unsorted} label="UN-SORTED" editable={editing} />
        <div className="ratio" style={{ ["--fw" as string]: `${fw}%`, ["--tw" as string]: `${tw}%` }}>
          <i className="f-fact" /><i className="f-think" />
        </div>
      </div>

      <div className="ft-list">
        {checkable.map((item, i) => {
          const verdict = factCheck[item.id];
          return (
            <div className={`ft-item ${verdict ?? ""}`} key={item.id}>
              <div className="ln">{vol(i + 1)}</div>
              <div className="txt">{item.text}</div>
              <div className="tag-pill">
                {editing ? (
                  <>
                    <button
                      type="button"
                      className={`pill${verdict === "fact" ? " f" : ""}`}
                      onClick={() => setFlag(item.id, verdict === "fact" ? null : "fact")}
                    >
                      FACT
                    </button>
                    <button
                      type="button"
                      className={`pill${verdict === "thought" ? " t" : ""}`}
                      onClick={() => setFlag(item.id, verdict === "thought" ? null : "thought")}
                    >
                      생각
                    </button>
                  </>
                ) : (
                  <>
                    <span className={`pill${verdict === "fact" ? " f" : ""}`}>FACT</span>
                    <span className={`pill${verdict === "thought" ? " t" : ""}`}>생각</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {thoughtCount > 0 && (
        <div className="ft-note reveal">
          <span className="lbl">생각으로 표시한 {thoughtCount}개</span>
          이 항목들은 아직 검증되지 않은 해석에 가까울 수 있어요. <b>iii. 거울 리포트</b>의{" "}
          <b>인지 오류</b>와 <b>생각의 전환</b>을 함께 다시 살펴봐 주세요.
        </div>
      )}
    </div>
  );
}

function FtCount({
  cls,
  v,
  label,
  editable,
}: {
  cls: string;
  v: number;
  label: string;
  editable: boolean;
}) {
  return (
    <div className={`v ${cls}`}>
      <span data-count={editable ? undefined : v}>{editable ? v : 0}</span>
      <span className="k">{label}</span>
    </div>
  );
}

/* ───────────── V. CONTROL SPLIT ───────────── */

function ControlSection({
  dump,
  cls,
  bdById,
  edit,
}: {
  dump: BrainDump;
  cls: Classification;
  bdById: Map<string, BDItem>;
  edit: EditCtx | null;
}) {
  const editing = !!edit;
  const factCheck = cls.fact_check ?? {};
  const mergedControllable = Array.from(
    new Set([...(cls.controllable ?? []), ...(cls.influenceable ?? [])])
  );
  const uncontrollable = cls.uncontrollable ?? [];

  // read-only: 텍스트만
  const can = mergedControllable
    .map((id) => bdById.get(id)?.text)
    .filter((t): t is string => !!t);
  const cant = uncontrollable
    .map((id) => bdById.get(id)?.text)
    .filter((t): t is string => !!t);

  // editable: 사실로 표시한 항목 + 모든 todo = 통제권 분류 대상
  const factItems: BDItem[] = editing
    ? [
        ...(dump.recurring ?? []).filter((b) => factCheck[b.id] === "fact"),
        ...(dump.discomfort ?? []).filter((b) => factCheck[b.id] === "fact"),
        ...(dump.todos ?? []),
      ].filter((b) => b.text.trim())
    : [];

  function bucketOf(id: string): "controllable" | "uncontrollable" | null {
    if (mergedControllable.includes(id)) return "controllable";
    if (uncontrollable.includes(id)) return "uncontrollable";
    return null;
  }
  function setBucket(
    id: string,
    b: "controllable" | "uncontrollable" | null
  ) {
    const baseC = mergedControllable.filter((x) => x !== id);
    const baseU = uncontrollable.filter((x) => x !== id);
    const cleaned: Classification = {
      controllable: baseC,
      influenceable: [],
      uncontrollable: baseU,
      fact_check: cls.fact_check,
    };
    if (b === "controllable") cleaned.controllable = [...baseC, id];
    if (b === "uncontrollable") cleaned.uncontrollable = [...baseU, id];
    edit!.patch({ classification: cleaned });
  }

  return (
    <div className="sec" id="ctrl">
      <SecHead
        ix="v. — chapter"
        h3="통제권으로 나눕니다"
        desc="사실로 표시한 항목을 두 가지로 분류합니다. 이 분류만으로도 머릿속의 무게가 절반으로 줄어듭니다."
        tagL="SPLIT"
        tagR={
          editing
            ? `A ${mergedControllable.length} · B ${uncontrollable.length}`
            : `A ${can.length} · B ${cant.length}`
        }
      />

      <div className="ctrl-intro reveal">
        <div className="ctrl-card a">
          <div className="big">A</div>
          <div className="ck">CONTROL · ZONE</div>
          <h6>내가 할 수 있는 것</h6>
          <p>직접 행동을 바꾸거나 상황에 입력을 보낼 수 있는 영역. 결과 100%를 결정 못 해도 한 걸음은 둘 수 있는 것들.</p>
        </div>
        <div className="ctrl-card b">
          <div className="big">B</div>
          <div className="ck">OUTSIDE · ZONE</div>
          <h6>내가 통제할 수 없는 것</h6>
          <p>외부에서 결정되거나 감정·신체 상태처럼 직접 바꿀 수 없는 영역. 받아들이거나 잠시 놓아두는 게 답인 것들.</p>
        </div>
      </div>

      {editing ? (
        factItems.length === 0 ? (
          <div className="empty-line">
            먼저 iv. 에서 &lsquo;사실&rsquo;로 표시한 항목이 여기로 와요.
          </div>
        ) : (
          <div className="ctrl-block reveal">
            <div className="ch">
              <div className="title">사실 항목 분류 <span className="en">— A / B</span></div>
              <div className="ct">{factItems.length}</div>
              <div className="meta">ENTRIES</div>
            </div>
            {factItems.map((b, i) => {
              const bk = bucketOf(b.id);
              return (
                <div className="ctrl-row" key={b.id}>
                  <div className="ln">{vol(i + 1)}</div>
                  <div>{b.text}</div>
                  <button
                    type="button"
                    className={`pill ${bk === "controllable" ? "on" : "off"}`}
                    onClick={() =>
                      setBucket(b.id, bk === "controllable" ? null : "controllable")
                    }
                  >
                    A · 할 수 있는 것
                  </button>
                  <button
                    type="button"
                    className={`pill ${bk === "uncontrollable" ? "warn" : "off"}`}
                    onClick={() =>
                      setBucket(b.id, bk === "uncontrollable" ? null : "uncontrollable")
                    }
                  >
                    B · 통제할 수 없는 것
                  </button>
                </div>
              );
            })}
          </div>
        )
      ) : (
        <>
          {can.length > 0 && (
            <div className="ctrl-block can reveal">
              <div className="ch">
                <div className="title">A. 내가 할 수 있는 것 <span className="en">— I CAN</span></div>
                <div className="ct" data-count={can.length}>0</div>
                <div className="meta">ENTRIES</div>
              </div>
              {can.map((t, i) => (
                <div className="ctrl-row" key={i}>
                  <div className="ln">{vol(i + 1)}</div>
                  <div>{t}</div>
                  <span className="pill on">A · 할 수 있는 것</span>
                  <span className="pill off">B · 통제할 수 없는 것</span>
                </div>
              ))}
            </div>
          )}

          {cant.length > 0 && (
            <div className="ctrl-block cant reveal">
              <div className="ch">
                <div className="title">B. 내가 통제할 수 없는 것 <span className="en">— LET BE</span></div>
                <div className="ct"><span className="acc" data-count={cant.length}>0</span></div>
                <div className="meta">ENTRIES</div>
              </div>
              {cant.map((t, i) => (
                <div className="ctrl-row" key={i}>
                  <div className="ln">{vol(i + 1)}</div>
                  <div>{t}</div>
                  <span className="pill off">A · 할 수 있는 것</span>
                  <span className="pill warn">B · 통제할 수 없는 것</span>
                </div>
              ))}
            </div>
          )}

          {can.length === 0 && cant.length === 0 && (
            <div className="empty-line">아직 통제권으로 분류한 항목이 없어요.</div>
          )}
        </>
      )}
    </div>
  );
}

/* ───────────── VI. ACTION DESIGN ───────────── */

function ActionSection({
  actions,
  cls,
  bdById,
  edit,
}: {
  actions: Workbook["actions"];
  cls: Classification;
  bdById: Map<string, BDItem>;
  edit: EditCtx | null;
}) {
  const editing = !!edit;
  type ActionT = Workbook["actions"][number];
  const controllableIds = Array.from(
    new Set([...(cls.controllable ?? []), ...(cls.influenceable ?? [])])
  );
  const filled = (actions ?? []).filter(
    (a) => a.goal?.trim() || a.first_step?.trim()
  );
  const list = editing ? actions ?? [] : filled;

  function add() {
    const targetId =
      controllableIds.find((id) => !actions.some((a) => a.target_bd_id === id)) ??
      controllableIds[0] ??
      null;
    edit!.patch({
      actions: [
        ...actions,
        {
          id: makeId("act"),
          target_bd_id: targetId,
          goal: "",
          first_step: "",
          when: "",
          where: "",
          if_then: "",
          completed: false,
        },
      ],
    });
  }
  function update(id: string, p: Partial<ActionT>) {
    edit!.patch({ actions: actions.map((a) => (a.id === id ? { ...a, ...p } : a)) });
  }
  function remove(id: string) {
    edit!.patch({ actions: actions.filter((a) => a.id !== id) });
  }

  return (
    <div className="sec" id="act">
      <SecHead
        ix="vi. — chapter"
        h3="할 수 있는 행동을 설계합니다"
        desc="통제 가능한 항목 중 1–3개를 골라, 24시간 안에 시작할 수 있는 가장 작은 한 걸음으로 만듭니다."
        tagL="ACT"
        tagR={`${list.length} 개`}
      />

      {!editing && filled.length === 0 ? (
        <div className="empty-line">설계한 행동이 아직 없어요.</div>
      ) : (
        <div className="act-grid">
          {list.map((a, i) => {
            const target = a.target_bd_id ? bdById.get(a.target_bd_id)?.text : null;
            if (editing) {
              return (
                <div className="act-card reveal" key={a.id}>
                  <div className="ah">
                    <div>
                      <div className="lbl">ACTION · {vol(i + 1)}</div>
                      <select
                        className="act-target"
                        value={a.target_bd_id ?? ""}
                        onChange={(e) =>
                          update(a.id, { target_bd_id: e.target.value || null })
                        }
                      >
                        <option value="">— 어떤 항목에 대한 행동인가요</option>
                        {controllableIds.map((id) => (
                          <option key={id} value={id}>
                            {bdById.get(id)?.text ?? id}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      className="act-del"
                      onClick={() => remove(a.id)}
                      aria-label="삭제"
                    >
                      ×
                    </button>
                  </div>
                  <div className="act-grid-fields">
                    <div className="act-field span-2">
                      <div className="k"><span>G. 원하는 결과</span><span className="mono" style={{ marginLeft: "auto" }}>GOAL</span></div>
                      <input
                        className="v inline-input"
                        value={a.goal}
                        placeholder="가까운 시간 안에 도달하고 싶은 모습"
                        onChange={(e) => update(a.id, { goal: e.target.value })}
                      />
                    </div>
                    <div className="act-field">
                      <div className="k"><span>R. 가장 작은 첫걸음</span></div>
                      <input
                        className="v inline-input"
                        value={a.first_step}
                        placeholder="가장 작게 시작할 수 있는 한 가지"
                        onChange={(e) => update(a.id, { first_step: e.target.value })}
                      />
                    </div>
                    <div className="act-field">
                      <div className="k"><span>W. 언제</span></div>
                      <input
                        className="v inline-input"
                        value={a.when}
                        placeholder="목/오전/퇴근 후"
                        onChange={(e) => update(a.id, { when: e.target.value })}
                      />
                    </div>
                    <div className="act-field">
                      <div className="k"><span>W. 어디서</span></div>
                      <input
                        className="v inline-input"
                        value={a.where}
                        placeholder="책상/카페/방"
                        onChange={(e) => update(a.id, { where: e.target.value })}
                      />
                    </div>
                    <div className="act-field">
                      <div className="k"><span>IF. 안 되면</span></div>
                      <input
                        className="v dim inline-input"
                        value={a.if_then}
                        placeholder="이때 시도할 다른 방법"
                        onChange={(e) => update(a.id, { if_then: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <div className="act-card reveal" key={a.id}>
                <div className="ah">
                  <div>
                    <div className="lbl">ACTION · {vol(i + 1)}</div>
                    <div className="title">{target || a.goal || "행동"}</div>
                  </div>
                  <div className="est">
                    {a.when && <span>WHEN · <b>{a.when}</b></span>}
                    {a.where && <span>WHERE · <b>{a.where}</b></span>}
                  </div>
                </div>
                <div className="act-grid-fields">
                  {a.goal && (
                    <div className="act-field span-2">
                      <div className="k"><span>G. 원하는 결과</span><span className="mono" style={{ marginLeft: "auto" }}>GOAL</span></div>
                      <div className="v">{a.goal}</div>
                    </div>
                  )}
                  {a.first_step && (
                    <div className="act-field">
                      <div className="k"><span>R. 가장 작은 첫걸음</span></div>
                      <div className="v">{a.first_step}</div>
                    </div>
                  )}
                  {a.when && <div className="act-field"><div className="k"><span>W. 언제</span></div><div className="v">{a.when}</div></div>}
                  {a.where && <div className="act-field"><div className="k"><span>W. 어디서</span></div><div className="v">{a.where}</div></div>}
                  {a.if_then && <div className="act-field"><div className="k"><span>IF. 안 되면</span></div><div className="v dim">{a.if_then}</div></div>}
                </div>
              </div>
            );
          })}
          {editing && list.length < 5 && (
            <button type="button" className="bd-add" onClick={add}>
              + 액션 카드 추가
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────────── VII. STRENGTHS ───────────── */

function StrengthsSection({
  moments,
  report,
  hasCoach,
  edit,
}: {
  moments: Workbook["moments"];
  report: StrengthsReport | null;
  hasCoach: boolean;
  edit: EditCtx | null;
}) {
  const editing = !!edit;
  type MomentT = Workbook["moments"][number];
  const list = moments ?? [];
  const filled = list.filter((m) => m.title?.trim() || m.experience?.trim());
  const writtenCount = list.filter(
    (m) => m.title?.trim() || m.experience?.trim() || (m.reason ?? "").trim()
  ).length;

  function add() {
    edit!.patch({
      moments: [
        ...list,
        {
          id: makeId("mmt"),
          title: "",
          experience: "",
          reason: "",
          actions: [],
          strengths: [],
        } as MomentT,
      ],
    });
  }
  function update(id: string, p: Partial<MomentT>) {
    edit!.patch({ moments: list.map((m) => (m.id === id ? { ...m, ...p } : m)) });
  }
  function remove(id: string) {
    edit!.patch({ moments: list.filter((m) => m.id !== id) });
  }

  const cards = editing ? list : filled;

  return (
    <div className="sec" id="str">
      <SecHead
        ix="vii. — chapter"
        h3="좋았던 순간에서, 강점을 발견합니다"
        desc="부정적인 것만 다루면 워크북이 무거워집니다. 좋았던 순간 안에서 당신이 한 행동과 드러난 강점이 짚어집니다."
        tagL="FIND STRENGTH"
        tagR={`${cards.length} MOMENTS`}
      />

      {!editing && filled.length === 0 ? (
        <div className="empty-line">기록한 좋았던 순간이 아직 없어요.</div>
      ) : (
        <div className="str-grid">
          {cards.map((m, i) => (
            <div className="str-card reveal" key={m.id}>
              <div className="sn">{vol(i + 1)}</div>
              <div className="head">
                <div className="lbl">MOMENT · {vol(i + 1)}</div>
                {editing ? (
                  <input
                    className="moment inline-input"
                    value={m.title}
                    placeholder="최근 좋았던 순간 — 한 줄 제목"
                    onChange={(e) => update(m.id, { title: e.target.value })}
                  />
                ) : (
                  <div className="moment">{m.title || m.experience}</div>
                )}
              </div>
              {editing ? (
                <textarea
                  className="why inline-input"
                  value={m.reason ?? ""}
                  rows={2}
                  placeholder="이 순간이 왜 좋았는지 — 안도감, 뿌듯함, 연결감 등 떠오르는 대로."
                  onChange={(e) =>
                    update(m.id, { reason: e.target.value, experience: e.target.value })
                  }
                />
              ) : (
                <div className="why">{m.reason || m.experience || "—"}</div>
              )}
              <div className="str-tags">
                {(m.strengths ?? []).slice(0, 2).map((s, j) => (
                  <span className="t" key={j}>{s}</span>
                ))}
                {editing && (
                  <button
                    type="button"
                    className="str-del"
                    onClick={() => remove(m.id)}
                    aria-label="삭제"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
          {editing && (
            <button type="button" className="bd-add" onClick={add}>
              + 좋았던 순간 추가
            </button>
          )}
        </div>
      )}

      {editing && (
        <div className="str-triggers">
          {!report?.narrative ? (
            <>
              <button
                type="button"
                className="ms-trigger-btn"
                onClick={() => edit!.runStrengths()}
                disabled={writtenCount === 0 || edit!.strengthsLoading}
              >
                {edit!.strengthsLoading ? "강점 찾는 중…" : "내 강점 발견하기 →"}
              </button>
              <p className="trigger-hint">
                적은 순간들을 상담사가 읽고, 키워드와 함께 당신이 한 행동과 드러난 강점을 짚어줍니다.
              </p>
              {edit!.strengthsError && (
                <p className="trigger-error">{edit!.strengthsError}</p>
              )}
            </>
          ) : (
            <>
              <div className="strengths-note">
                <div className="strengths-note-head">
                  <span>상담사 코멘트</span>
                </div>
                <p
                  className="strengths-note-body"
                  dangerouslySetInnerHTML={{ __html: report.narrative }}
                />
              </div>
              <button
                type="button"
                className="ms-trigger-btn"
                onClick={() => edit!.runCoach()}
                disabled={edit!.coachLoading}
              >
                {edit!.coachLoading
                  ? "리포트 만드는 중…"
                  : hasCoach
                    ? "리포트 다시 보기 →"
                    : "리포트 보러가기 →"}
              </button>
              {edit!.coachError && (
                <p className="trigger-error">{edit!.coachError}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────────── COACH REPORT ───────────── */

function CoachReport({
  note,
  prescriptions,
  scan,
  moments,
  datapoints,
  volumeNo,
  reader,
  generatedAt,
}: {
  note: NonNullable<Workbook["coach_note"]>;
  prescriptions: NonNullable<Workbook["prescriptions"]>;
  scan: Workbook["weekly_scan"];
  moments: Workbook["moments"];
  datapoints: number;
  volumeNo: number;
  reader: string;
  generatedAt: string;
}) {
  const tickFor = (i: number) => (i === 0 ? "PRIORITY · HIGH" : "PRIORITY · MID");

  return (
    <div className="coach-wrap reveal">
      <div className="coach-top">
        <div>
          <div className="label">COACH&apos;S · REPORT</div>
          <h2>한 회, <span className="acc">정리</span></h2>
          <p className="sub">당신이 적은 모든 것을, 옆에서 본 사람의 시선으로 한 장에 정리했습니다.</p>
        </div>
        <div className="stamp">
          <div>READER · <b>{reader} 님</b></div>
          <div>VOL · <b>{vol(volumeNo)}</b></div>
          <div>GEN · <b>{genTime(generatedAt)}</b></div>
          <div>COACH · <b>Performance</b></div>
        </div>
      </div>

      <div className="coach-headline">
        <h3 dangerouslySetInnerHTML={{ __html: note.title }} />
        <p dangerouslySetInnerHTML={{ __html: note.lede }} />
      </div>

      <CoachRecap scan={scan} moments={moments} datapoints={datapoints} volumeNo={volumeNo} />

      <div className="coach-notes">
        {note.intro && (
          <div className="coach-line">
            <div className="rom">—</div>
            <div dangerouslySetInnerHTML={{ __html: note.intro }} />
          </div>
        )}
        {note.findings.map((f) => (
          <div className="coach-line" key={f.num}>
            <div className="rom">{f.num}.</div>
            <div dangerouslySetInnerHTML={{ __html: f.text }} />
          </div>
        ))}
      </div>

      {prescriptions.length > 0 && (
        <>
          <div className="ai-head">
            <span className="lbl">COACH&apos;S&nbsp;ACTION&nbsp;ITEMS</span>
            <h4>코치가 제안하는 다음 한 걸음</h4>
          </div>
          <div className="ai-list">
            {prescriptions.map((p, i) => (
              <div className="ai-item reveal" key={p.num}>
                <div className="ax">
                  <span className="axl">ACTION · {p.num}</span>
                  <span className="tick">{tickFor(i)}</span>
                </div>
                <div className="at" dangerouslySetInnerHTML={{ __html: p.title }} />
                <div className="ad" dangerouslySetInnerHTML={{ __html: p.body }} />
                {p.meta.length > 0 && (
                  <div className="subgrid">
                    {p.meta.map((m, j) => (
                      <FragmentRow key={j} k={m.key} v={m.val} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="coach-foot">
        이건 진단이 아니고, 제안도 명령이 아닙니다. 한 회의 노트를 옆에서 읽은 사람의 관찰과
        제안입니다. 동의되지 않는 부분이 있다면 — 그 한 줄이 다음 회 노트의 시작입니다.
      </div>
    </div>
  );
}

function FragmentRow({ k, v }: { k: string; v: string }) {
  return (
    <>
      <div className="k">{k}</div>
      <div dangerouslySetInnerHTML={{ __html: v }} />
    </>
  );
}

/* ── Coach recap (scan mini) ── */

function CoachRecap({
  scan,
  moments,
  datapoints,
  volumeNo,
}: {
  scan: Workbook["weekly_scan"];
  moments: Workbook["moments"];
  datapoints: number;
  volumeNo: number;
}) {
  const emotions = (scan.emotions ?? []).slice(0, 4);
  const intensity = scan.emotion_intensity;
  const recovery = scan.sleep_recovery;
  const energy = scan.energy;
  const focus = scan.focus;
  const motivation = scan.motivation;
  const condVals = [energy, focus, motivation].filter((v): v is number => v != null);
  const condAvg = condVals.length
    ? Math.round((condVals.reduce((a, b) => a + b, 0) / condVals.length) * 10) / 10
    : null;
  const bodySigns = (scan.body_signs ?? []).filter((b) => b !== "없음");
  const filledMoments = (moments ?? []).filter((m) => m.title?.trim());
  const C2 = 251.3;

  return (
    <div className="recap reveal">
      <div className="recap-head">
        <div className="left">
          <span className="lbl">WORKBOOK · RECAP</span>
          <h4>이 회의 데이터, 한눈에</h4>
        </div>
        <div className="right">
          <span><b>5</b> DIMENSIONS</span>
          <span><b>{datapoints}</b> DATAPOINTS</span>
          <span>VOL · <b>{vol(volumeNo)}</b></span>
        </div>
      </div>

      <div className="recap-grid">
        {/* Emotion */}
        <div className="rc rc-emo">
          <div className="rc-k"><span>감정 · EMOTION</span><b>{intensity != null ? `INTENSITY ${intensity}/10` : "—"}</b></div>
          <div className="rc-headline">
            <span className="big acc">{intensity != null ? intensity.toFixed(1) : "—"}</span>
            <span className="u">/ 10 · 평균</span>
          </div>
          {emotions.length === 0 ? (
            <div className="empty-line">—</div>
          ) : (
            emotions.map((e) => {
              const val = scan.emotion_intensities?.[e] ?? intensity ?? null;
              const w = val != null ? val / 10 : 0.5;
              return (
                <div className="mini" key={e} style={{ ["--w" as string]: w }}>
                  <div className="l">{e}</div>
                  <div className="b"><i /></div>
                  <div className="n">{val != null ? val.toFixed(1) : "—"}</div>
                </div>
              );
            })
          )}
        </div>

        {/* Sleep */}
        <div className="rc rc-sle">
          <div className="rc-k"><span>수면 · SLEEP</span><b>{recovery != null ? `RESTORED ${recovery * 10}%` : "—"}</b></div>
          <div className="sleep-row">
            <div className="sr" style={{ ["--off" as string]: C2 * (1 - (recovery != null ? recovery / 10 : 0.5)) }}>
              <svg viewBox="0 0 100 100">
                <circle className="t" cx="50" cy="50" r="40" />
                <circle className="f" cx="50" cy="50" r="40" />
              </svg>
              <div className="c">{formatHoursNode(scan.sleep_avg_hours)}</div>
            </div>
            <div className="sst">
              <div className="row"><span>회복감</span><span>{recovery != null ? `${recovery} / 10` : "—"}</span></div>
              <div className="row"><span>잠들기</span><span>{scan.sleep_latency_min != null ? `${scan.sleep_latency_min} min` : "—"}</span></div>
              <div className="row"><span>평균 수면</span><span>{scan.sleep_avg_hours != null ? `${scan.sleep_avg_hours} h` : "—"}</span></div>
            </div>
          </div>
        </div>

        {/* Condition */}
        <div className="rc rc-con">
          <div className="rc-k"><span>컨디션 · CONDITION</span><b>{condAvg != null ? `AVG ${condAvg}/10` : "—"}</b></div>
          <div className="rc-headline">
            <span className="big acc">{condAvg != null ? condAvg.toFixed(1) : "—"}</span>
            <span className="u">/ 10</span>
          </div>
          <div className="clist">
            <MiniCond label="에너지" value={energy} />
            <MiniCond label="집중력" value={focus} />
            <MiniCond label="의욕" value={motivation} />
          </div>
        </div>

        {/* Body */}
        <div className="rc rc-bod">
          <div className="rc-k"><span>신체 반응 · BODY</span><b>{bodySigns.length} ACTIVE</b></div>
          <div className="bbody">
            <div className="btags">
              {bodySigns.map((b) => <span className="t" key={b}>{b}</span>)}
              {MIND_SPILL_BODY_SIGNS.filter((b) => b !== "없음" && !bodySigns.includes(b))
                .slice(0, 3)
                .map((b) => <span className="t dim" key={b}>{b}</span>)}
            </div>
            <div className="bmini-heat">
              {RECAP_HEAT.map((l, i) => <i key={i} className={heatClass(l)} />)}
            </div>
          </div>
        </div>

        {/* Moments */}
        <div className="rc rc-mom">
          <div className="rc-k"><span>좋았던 순간 · STRENGTHS</span><b>{filledMoments.length} MOMENTS</b></div>
          <div className="mom-list">
            {filledMoments.slice(0, 4).map((m, i) => (
              <div className="m" key={m.id}>
                <div className="nn">{vol(i + 1)}</div>
                <div className="tt">{m.title || m.experience}</div>
                {(m.strengths ?? []).length > 0 && (
                  <div className="tag">{(m.strengths ?? []).slice(0, 2).join(" · ")}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniCond({ label, value }: { label: string; value: number | null }) {
  const v = value ?? 0;
  return (
    <div className="row">
      <div className="l">{label}</div>
      <div className="seg">
        {Array.from({ length: 10 }).map((_, i) => {
          const on = i < v;
          const warn = on && v <= 4;
          return <i key={i} className={warn ? "w" : on ? "on" : ""} />;
        })}
      </div>
      <div className="n">{value != null ? value : "—"}</div>
    </div>
  );
}

/* ───────────── CTA ───────────── */

function CounselingCta({
  counseling,
}: {
  counseling: NonNullable<NonNullable<Workbook["coach_note"]>["counseling"]>;
}) {
  const outcomes = Array.isArray(counseling.outcomes) ? counseling.outcomes : [];
  return (
    <section className="cta-wrap">
      <div className="cta-top">
        <div className="lbl">PERFORMANCE · COACH</div>
      </div>
      <div className="cta-card reveal">
        <div>
          <h3>
            워크북을 통해 <em>당신에게 필요한 상담</em>을 분석했습니다.<br />
            1급 심리 상담사와 함께 <em>1:1 상담</em>을 진행해보세요.
          </h3>
          <p dangerouslySetInnerHTML={{ __html: counseling.topic }} />
          <Link className="btn" href="/payment/counseling/mind-spill">
            <span>상담 신청하기</span>
            <span className="price">50MIN · ₩99,000 →</span>
          </Link>
        </div>
        <div className="meta-table">
          <div className="row">
            <div className="k">PSYCH&nbsp;ISSUE</div>
            <div className="v" dangerouslySetInnerHTML={{ __html: counseling.issue }} />
          </div>
          <div className="row">
            <div className="k">TOPIC</div>
            <div className="v warm" dangerouslySetInnerHTML={{ __html: counseling.topic }} />
          </div>
          {outcomes.length > 0 && (
            <div className="row">
              <div className="k">SOLVE</div>
              <div className="v">
                <ul>
                  {outcomes.map((o, i) => (
                    <li key={i} dangerouslySetInnerHTML={{ __html: o }} />
                  ))}
                </ul>
              </div>
            </div>
          )}
          <div className="row">
            <div className="k">DURATION</div>
            <div className="v">50분 · 1:1 Zoom</div>
          </div>
          <div className="row">
            <div className="k">COACH</div>
            <div className="v">한국상담심리학회 1급 심리 상담사</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── 헬퍼 ───────────── */

function countDatapoints(scan: Workbook["weekly_scan"]): number {
  let n = 0;
  n += (scan.emotions ?? []).length;
  n += (scan.body_signs ?? []).filter((b) => b !== "없음").length;
  [
    scan.emotion_intensity,
    scan.sleep_avg_hours,
    scan.sleep_latency_min,
    scan.sleep_recovery,
    scan.energy,
    scan.focus,
    scan.motivation,
  ].forEach((v) => {
    if (v != null) n += 1;
  });
  return n;
}
