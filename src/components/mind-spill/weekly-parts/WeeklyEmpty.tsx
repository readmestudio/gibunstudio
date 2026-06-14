"use client";

import { useState, type KeyboardEvent } from "react";
import {
  MIND_SPILL_BODY_SIGNS,
  MIND_SPILL_EMOTIONS,
} from "@/lib/mind-spill/constants";
import {
  EMPTY_MODAL_BG,
  meshLayers,
  toScanColorInput,
} from "@/lib/mind-spill/emotion-color";
import type {
  BDItem,
  BrainDump,
  WeeklyScan,
  Workbook,
  WorkbookPatch,
} from "@/lib/mind-spill/types";

const PRESET_EMOTIONS = new Set<string>(MIND_SPILL_EMOTIONS);
const PRESET_BODY = new Set<string>(MIND_SPILL_BODY_SIGNS);

/** 1~10 클램프. */
function clamp10(n: number): number {
  if (!Number.isFinite(n)) return 5;
  return Math.max(1, Math.min(10, Math.round(n)));
}

type Props = { wb: Workbook; onPatch: (p: WorkbookPatch) => void };

function makeBdId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `bd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function newBd(): BDItem {
  return { id: makeBdId(), text: "", created_at: new Date().toISOString() };
}

export function PartOneEmpty({
  wb,
  onPatch,
  showMirror = true,
}: Props & { showMirror?: boolean }) {
  return (
    <>
      <WeeklyScanStep scan={wb.weekly_scan} onPatch={onPatch} />
      <BrainDumpStep dump={wb.brain_dump} onPatch={onPatch} />
      {showMirror && <MirrorReportStep wb={wb} />}
    </>
  );
}

/* ============= i. Scan (데이터-viz) ============= */

function WeeklyScanStep({
  scan,
  onPatch,
}: {
  scan: WeeklyScan;
  onPatch: (p: WorkbookPatch) => void;
}) {
  const update = <K extends keyof WeeklyScan>(key: K, value: WeeklyScan[K]) => {
    onPatch({ weekly_scan: { ...scan, [key]: value } });
  };

  const emotions = scan.emotions ?? [];
  const intensities = scan.emotion_intensities ?? {};
  const hasEmo = emotions.length > 0;
  const todayBg = hasEmo
    ? meshLayers(toScanColorInput(scan)).bg
    : EMPTY_MODAL_BG;

  /** 선택된 감정들의 평균을 emotion_intensity 로 동기화 (캘린더 색 계산 호환). */
  function avgOf(list: string[], ints: Record<string, number>): number | null {
    if (!list.length) return null;
    const vals = list.map((e) => ints[e] ?? 5);
    return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }

  function toggleEmotion(e: string) {
    const has = emotions.includes(e);
    const nextList = has ? emotions.filter((x) => x !== e) : [...emotions, e];
    const ints = { ...intensities };
    if (has) delete ints[e];
    else if (ints[e] == null) ints[e] = scan.emotion_intensity ?? 5;
    onPatch({
      weekly_scan: {
        ...scan,
        emotions: nextList,
        emotion_intensities: ints,
        emotion_intensity: avgOf(nextList, ints),
      },
    });
  }

  function addEmotion(v: string) {
    const t = v.trim();
    if (!t || emotions.includes(t)) return;
    const nextList = [...emotions, t];
    const ints = { ...intensities, [t]: scan.emotion_intensity ?? 5 };
    onPatch({
      weekly_scan: {
        ...scan,
        emotions: nextList,
        emotion_intensities: ints,
        emotion_intensity: avgOf(nextList, ints),
      },
    });
  }

  function setIntensity(e: string, val: number) {
    const ints = { ...intensities, [e]: clamp10(val) };
    onPatch({
      weekly_scan: {
        ...scan,
        emotion_intensities: ints,
        emotion_intensity: avgOf(emotions, ints),
      },
    });
  }

  function toggleBody(v: string) {
    const list = scan.body_signs ?? [];
    const next = list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
    update("body_signs", next);
  }
  function addBody(v: string) {
    const t = v.trim();
    if (!t) return;
    const list = scan.body_signs ?? [];
    if (list.includes(t)) return;
    update("body_signs", [...list, t]);
  }

  const bodyCount = (scan.body_signs ?? []).length;

  return (
    <section className="ms-w-sec">
      <div className="ms-w-sec-head">
        <div className="ix">i. — scan</div>
        <div>
          <h3>지금의 나를 스캔합니다</h3>
          <p className="desc">
            정확하지 않아도 괜찮습니다. 떠오르는 대로, 짐작으로도 충분합니다.
            준비된 단어를 누르거나 직접 적고, 강도를 조절해보세요.
          </p>
        </div>
        <div className="tag">
          <span>SELF SCAN</span>
          <span>≈ 5 MIN</span>
        </div>
      </div>

      <div className="ms-w-scan-grid">
        {/* TODAY'S COLOR — 현재 고른 마음으로 블렌딩된 오늘의 색 미리보기 */}
        <div className="ms-w-today">
          <div className="fill" style={{ background: todayBg }} />
          <div className="ms-w-today-glass">
            <div className="lbl">TODAY&apos;S COLOR · 오늘의 색</div>
            <h4>
              지금 고른 마음이,
              <br />한 칸의 색이 됩니다
            </h4>
            <p>
              감정은 색상, 강도는 선명함, 컨디션은 밝기로 블렌딩됩니다. 이 색이
              오늘 <b>감정 캘린더</b> 한 칸에 그대로 담겨요.
            </p>
          </div>
          <div className="ms-w-today-side">
            <span className="hint">
              {hasEmo ? "오늘의 색이 채워졌어요" : "감정을 골라보세요"}
            </span>
            <a className="link" href="/dashboard/mind-spill">
              캘린더에서 보기 →
            </a>
          </div>
        </div>

        {/* 감정 */}
        <div className="ms-w-panel ms-w-panel-emotion">
          <div className="p-head">
            <div className="p-title">
              <h4>감정</h4>
              <span className="en">EMOTION</span>
            </div>
            <div className="p-meta">{emotions.length} SELECTED</div>
          </div>
          <div className="emotion-split">
            <div>
              <div className="ms-w-chip-row">
                {MIND_SPILL_EMOTIONS.map((e) => {
                  const on = emotions.includes(e);
                  return (
                    <button
                      type="button"
                      key={e}
                      className={`ms-w-chip${on ? " on" : ""}`}
                      onClick={() => toggleEmotion(e)}
                      aria-pressed={on}
                    >
                      {on && <span className="dot" />}
                      {e}
                    </button>
                  );
                })}
                {emotions
                  .filter((e) => !PRESET_EMOTIONS.has(e))
                  .map((e) => (
                    <button
                      type="button"
                      key={`custom-${e}`}
                      className="ms-w-chip on"
                      onClick={() => toggleEmotion(e)}
                      aria-label={`${e} 삭제`}
                    >
                      <span className="dot" />
                      {e} ×
                    </button>
                  ))}
              </div>
              <CustomTagInput
                placeholder="+ 직접 추가 (Enter)"
                onAdd={addEmotion}
              />
            </div>
            <div className="ms-w-heat-col">
              {emotions.length === 0 ? (
                <p className="ms-w-heat-hint">
                  감정을 고르면 각 감정의 강도를 조절할 수 있어요.
                </p>
              ) : (
                emotions.map((e) => (
                  <Heatrow
                    key={e}
                    label={e}
                    value={intensities[e] ?? 5}
                    onChange={(v) => setIntensity(e, v)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* 수면 */}
        <div className="ms-w-panel ms-w-panel-sleep">
          <div className="p-head">
            <div className="p-title">
              <h4>수면</h4>
              <span className="en">SLEEP</span>
            </div>
            <div className="p-meta">
              회복 {scan.sleep_recovery ?? "—"}/10
            </div>
          </div>
          <div className="sleep-flex">
            <SleepRing hours={scan.sleep_avg_hours} />
            <div className="ms-w-sleep-stats">
              <NumberStatBar
                label="평균 수면"
                unit="h"
                value={scan.sleep_avg_hours}
                onChange={(v) => update("sleep_avg_hours", v)}
                min={0}
                max={14}
                step={0.5}
                pct={(scan.sleep_avg_hours ?? 0) / 14}
              />
              <NumberStatBar
                label="잠들기까지"
                unit="min"
                value={scan.sleep_latency_min}
                onChange={(v) => update("sleep_latency_min", v)}
                min={0}
                max={180}
                step={5}
                pct={Math.min(1, (scan.sleep_latency_min ?? 0) / 120)}
              />
              <RangeStatBar
                label="회복감"
                value={scan.sleep_recovery ?? 5}
                onChange={(v) => update("sleep_recovery", v)}
              />
            </div>
          </div>
        </div>

        {/* 신체 반응 */}
        <div className="ms-w-panel ms-w-panel-body">
          <div className="p-head">
            <div className="p-title">
              <h4>신체 반응</h4>
              <span className="en">BODY</span>
            </div>
            <div className="p-meta">{bodyCount} ACTIVE</div>
          </div>
          <div className="body-grid">
            <div>
              <div className="ms-w-body-tags">
                {MIND_SPILL_BODY_SIGNS.map((b) => {
                  const on = (scan.body_signs ?? []).includes(b);
                  return (
                    <button
                      type="button"
                      key={b}
                      className={`ms-w-body-tag${on ? " on" : ""}`}
                      onClick={() => toggleBody(b)}
                      aria-pressed={on}
                    >
                      {b}
                    </button>
                  );
                })}
                {(scan.body_signs ?? [])
                  .filter((e) => !PRESET_BODY.has(e))
                  .map((e) => (
                    <button
                      type="button"
                      key={`body-custom-${e}`}
                      className="ms-w-body-tag on"
                      onClick={() => toggleBody(e)}
                      aria-label={`${e} 삭제`}
                    >
                      {e} ×
                    </button>
                  ))}
              </div>
              <CustomTagInput
                placeholder="+ 다른 신체 반응 적기 (Enter)"
                onAdd={addBody}
              />
            </div>
            <div className="ms-w-body-load">
              <div className="v">{bodyCount}</div>
              <div className="k">Body Load</div>
              <div className="dots">
                {Array.from({ length: 8 }, (_, i) => (
                  <i key={i} className={i < Math.min(bodyCount, 8) ? "on" : undefined} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 컨디션 */}
        <div className="ms-w-panel ms-w-panel-condition">
          <div className="p-head">
            <div className="p-title">
              <h4>컨디션</h4>
              <span className="en">CONDITION</span>
            </div>
            <div className="p-meta">1 — 10</div>
          </div>
          <div className="cond-row">
            {(
              [
                ["energy", "에너지", "ENERGY"],
                ["focus", "집중력", "FOCUS"],
                ["motivation", "의욕", "DRIVE"],
              ] as const
            ).map(([key, label, en]) => (
              <SegStat
                key={key}
                label={label}
                en={en}
                value={scan[key] ?? 5}
                onChange={(v) => update(key, v)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----- Scan 컨트롤 ----- */

function Heatrow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="ms-w-heatrow">
      <span className="lbl">{label}</span>
      <div className="bar">
        <i style={{ width: `${value * 10}%` }} />
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={(e) => onChange(clamp10(Number(e.target.value)))}
          aria-label={`${label} 강도`}
        />
      </div>
      <span className="num">{value}</span>
    </div>
  );
}

function SleepRing({ hours }: { hours: number | null }) {
  const C = 282.7; // 2π·45
  const pct = hours != null ? Math.max(0, Math.min(1, hours / 9)) : 0;
  const offset = C * (1 - pct);
  return (
    <div className="ms-w-ring">
      <svg viewBox="0 0 130 130" aria-hidden="true">
        <circle className="track" cx="65" cy="65" r="45" />
        <circle className="fill" cx="65" cy="65" r="45" style={{ strokeDashoffset: offset }} />
      </svg>
      <div className="ring-num">
        <b>{hours != null ? `${hours}h` : "—"}</b>
        <span>AVG SLEEP</span>
      </div>
    </div>
  );
}

function NumberStatBar({
  label,
  unit,
  value,
  onChange,
  min,
  max,
  step,
  pct,
}: {
  label: string;
  unit: string;
  value: number | null;
  onChange: (v: number | null) => void;
  min: number;
  max: number;
  step: number;
  pct: number;
}) {
  return (
    <div className="ms-w-sleep-stat">
      <div className="row1">
        <span>{label}</span>
        <span>
          <input
            className="ms-w-sleep-num"
            type="number"
            min={min}
            max={max}
            step={step}
            value={value ?? ""}
            onChange={(e) => {
              const raw = e.target.value;
              onChange(raw === "" ? null : Number(raw));
            }}
            placeholder="—"
            aria-label={label}
          />
          <span style={{ fontSize: 12, color: "var(--ms-ink-4)", marginLeft: 2 }}>
            {unit}
          </span>
        </span>
      </div>
      <div className="bar">
        <i style={{ width: `${Math.max(0, Math.min(1, pct)) * 100}%` }} />
      </div>
    </div>
  );
}

function RangeStatBar({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="ms-w-sleep-stat">
      <div className="row1">
        <span>{label}</span>
        <span className="num">{value}/10</span>
      </div>
      <div className="bar">
        <i style={{ width: `${value * 10}%`, background: "var(--ms-accent)" }} />
        <input
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={(e) => onChange(clamp10(Number(e.target.value)))}
          aria-label={label}
        />
      </div>
    </div>
  );
}

function SegStat({
  label,
  en,
  value,
  onChange,
}: {
  label: string;
  en: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="ms-w-seg-stat">
      <div className="row1">
        <span>{label}</span>
        <span className="num">{value}/10</span>
      </div>
      <div className="ms-w-seg-bar">
        {Array.from({ length: 10 }, (_, i) => (
          <button
            type="button"
            key={i}
            className={i < value ? "on" : undefined}
            onClick={() => onChange(i + 1)}
            aria-label={`${label} ${i + 1}점`}
          />
        ))}
      </div>
      <div className="legend">{en}</div>
    </div>
  );
}

function CustomTagInput({
  placeholder,
  onAdd,
}: {
  placeholder: string;
  onAdd: (v: string) => void;
}) {
  const [draft, setDraft] = useState("");

  function commit() {
    const t = draft.trim();
    if (!t) return;
    onAdd(t);
    setDraft("");
  }
  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    }
  }

  return (
    <input
      className="ms-w-custom-input"
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={onKeyDown}
      onBlur={commit}
      placeholder={placeholder}
      aria-label={placeholder}
    />
  );
}

/* ============= ii. Brain Dump ============= */

function BrainDumpStep({
  dump,
  onPatch,
}: {
  dump: BrainDump;
  onPatch: (p: WorkbookPatch) => void;
}) {
  const recCount = (dump.recurring ?? []).length;
  const disCount = (dump.discomfort ?? []).length;
  const todoCount = (dump.todos ?? []).length;
  const total = recCount + disCount + todoCount;

  return (
    <section className="ms-w-sec">
      <div className="ms-w-sec-head">
        <div className="ix">ii. — dump</div>
        <div>
          <h3>머릿속을 쏟아냅니다</h3>
          <p className="desc">
            완성된 문장이 아니어도, 모순돼도, 부끄러워도 괜찮습니다. 검열하지
            마세요. 떠오르는 대로 한 줄씩.
          </p>
        </div>
        <div className="tag">
          <span>BRAIN DUMP</span>
          <span>≈ 10 MIN</span>
        </div>
      </div>

      <div className="ms-w-bd-bar">
        <div className="ms-w-bd-stat">
          <div className="v">{String(recCount).padStart(2, "0")}</div>
          <div className="k">반복되는</div>
        </div>
        <div className="ms-w-bd-stat">
          <div className="v">{String(disCount).padStart(2, "0")}</div>
          <div className="k">불편한 생각</div>
        </div>
        <div className="ms-w-bd-stat">
          <div className="v">{String(todoCount).padStart(2, "0")}</div>
          <div className="k">할 일</div>
        </div>
        <div className="ms-w-bd-stat">
          <div className="v">{String(total).padStart(2, "0")}</div>
          <div className="k">총 항목</div>
        </div>
        <div className="live">
          <span className="rd" />
          LIVE
        </div>
      </div>

      <div className="ms-w-bd-grid">
        <BdCol
          title="반복되는 생각"
          en="RECURRING"
          hint="요즘 머릿속에 자주 자리 잡는 생각, 자꾸 신경 쓰이는 일을 한 줄씩."
          variant="recurring"
          items={dump.recurring ?? []}
          onChange={(items) => onPatch({ brain_dump: { ...dump, recurring: items } })}
        />
        <BdCol
          title="불편하게 만든 생각"
          en="DISCOMFORT"
          hint="두려웠거나 불안하게 만든 생각. 막연한 것도, 형태가 없는 것도 괜찮아요."
          variant="discomfort"
          items={dump.discomfort ?? []}
          onChange={(items) => onPatch({ brain_dump: { ...dump, discomfort: items } })}
        />
        <BdCol
          title="해야 하는 일"
          en="TO-DO & UNDONE"
          hint="큰 일도, 미루던 작은 일도. 죄책감이 따라오는 항목일수록 적어두세요."
          variant="todos"
          items={dump.todos ?? []}
          onChange={(items) => onPatch({ brain_dump: { ...dump, todos: items } })}
        />
      </div>
    </section>
  );
}

function BdCol({
  title,
  en,
  hint,
  variant,
  items,
  onChange,
}: {
  title: string;
  en: string;
  hint: string;
  variant: "recurring" | "discomfort" | "todos";
  items: BDItem[];
  onChange: (items: BDItem[]) => void;
}) {
  // 빈 칸 1개를 항상 보장 — 처음 적기 쉽도록.
  const [draft, setDraft] = useState<BDItem[]>(
    items.length > 0 ? items : [newBd()]
  );

  function commit(next: BDItem[]) {
    setDraft(next);
    onChange(next.filter((x) => x.text.trim().length > 0));
  }

  const itemClass =
    variant === "discomfort"
      ? "ms-w-bd-item discomfort"
      : variant === "recurring"
      ? "ms-w-bd-item recurring"
      : "ms-w-bd-item";

  return (
    <div className="ms-w-bd-col">
      <div className="ms-w-bd-col-head">
        <h5>
          {title} <span className="en">{en}</span>
        </h5>
        <p className="colsub">{hint}</p>
      </div>
      <div className="ms-w-bd-col-list">
        {draft.map((it, i) => (
          <div className={itemClass} key={it.id}>
            <span className="ln">{String(i + 1).padStart(2, "0")}</span>
            <textarea
              className="ms-w-bd-textarea"
              value={it.text}
              onChange={(e) =>
                commit(
                  draft.map((x) =>
                    x.id === it.id ? { ...x, text: e.target.value } : x
                  )
                )
              }
              placeholder="한 줄 적기"
              rows={1}
              onInput={(e) => {
                const ta = e.currentTarget;
                ta.style.height = "auto";
                ta.style.height = `${ta.scrollHeight}px`;
              }}
            />
            {draft.length > 1 && (
              <button
                type="button"
                className="ms-w-bd-del"
                onClick={() => commit(draft.filter((x) => x.id !== it.id))}
              >
                삭제
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="ms-w-bd-add"
          onClick={() => commit([...draft, newBd()])}
        >
          + 항목 추가
        </button>
      </div>
    </div>
  );
}

/* ============= iii. Mirror Report (LLM) — 주간(레거시) 경로 전용 ============= */

function MirrorReportStep({ wb }: { wb: Workbook }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localReport, setLocalReport] = useState<typeof wb.mirror_report>(
    wb.mirror_report
  );
  const report = localReport ?? wb.mirror_report;

  const bdCount =
    (wb.brain_dump.recurring?.length ?? 0) +
    (wb.brain_dump.discomfort?.length ?? 0) +
    (wb.brain_dump.todos?.length ?? 0);

  const canRun = bdCount > 0 && !loading;

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mind-spill/mirror-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workbookId: wb.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "분석 중 문제가 생겼어요.");
        return;
      }
      setLocalReport(data.mirror_report);
    } catch (e) {
      console.error(e);
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="ms-step">
      <div className="ms-step-header">
        <div className="ms-step-num">iii.</div>
        <h2 className="ms-step-title">거울이 돌아옵니다</h2>
      </div>
      <p className="ms-step-intro">
        진단이 아닙니다. 당신이 적은 것들을 다시 비춰주는, 한 발 떨어진 관찰입니다.
        준비되었다면 아래 버튼을 눌러주세요.
      </p>

      {!report ? (
        <div className="ms-mirror-cta">
          <button
            type="button"
            className="ms-btn-ink"
            onClick={run}
            disabled={!canRun}
          >
            {loading ? "분석 중…" : "내 상태 진단하기 →"}
          </button>
          <p className="ms-mirror-cta-hint">
            {bdCount === 0
              ? "ii. 머릿속을 쏟아냅니다 에 한 줄이라도 적어야 분석할 수 있어요."
              : "Brain Dump · 감정 · 신체 신호를 종합해 CBT 임상 톤으로 분석합니다. 약 10~30초 소요."}
          </p>
          {error && <div className="ms-mirror-error">{error}</div>}
        </div>
      ) : (
        <ReportView wb={wb} report={report} error={error} />
      )}
    </section>
  );
}

function ReportView({
  wb,
  report,
  error,
}: {
  wb: Workbook;
  report: NonNullable<Workbook["mirror_report"]>;
  error: string | null;
}) {
  const clusters = report.emotion_clusters ?? [];
  const distortions = report.cognitive_distortions ?? [];
  const links = report.body_thought_links ?? [];

  const clusterColors: Record<string, string> = {
    불안: "var(--ms-accent)",
    압박: "var(--ms-coral)",
    무력: "var(--ms-ink-3)",
    분노: "var(--ms-coral)",
    슬픔: "var(--ms-ink-2)",
    긍정: "var(--ms-sage)",
  };

  return (
    <div className="ms-report">
      <div className="ms-report-head">
        <div className="title">Reflective Mirror</div>
        <div className="ts">VOL. {String(wb.volume_no).padStart(2, "0")}</div>
      </div>
      <p className="ms-report-intro">{report.intro}</p>

      {clusters.length > 0 && (
        <div className="ms-report-section">
          <div className="ms-report-section-label">
            <span className="num">a.</span>
            <span className="name">감정 클러스터</span>
          </div>
          <div className="ms-cluster-bar">
            {clusters.map((c, i) => (
              <div
                key={i}
                style={{
                  width: `${Math.max(0, Math.min(100, c.percent))}%`,
                  background: clusterColors[c.category] ?? "var(--ms-ink-3)",
                }}
              >
                {c.category} {c.percent}%
              </div>
            ))}
          </div>
          <div className="ms-cluster-legend">
            {clusters.map((c, i) => (
              <span key={i}>
                <span
                  className="dot"
                  style={{
                    background: clusterColors[c.category] ?? "var(--ms-ink-3)",
                  }}
                />
                {c.category}
                {c.keywords.length > 0 && (
                  <span style={{ color: "var(--ms-ink-3)" }}>
                    {" "}
                    · {c.keywords.slice(0, 3).join(" · ")}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {distortions.length > 0 && (
        <div className="ms-report-section">
          <div className="ms-report-section-label">
            <span className="num">b.</span>
            <span className="name">감지된 인지 오류</span>
          </div>
          <div className="ms-distortion-list">
            {distortions.map((d, i) => (
              <div className="ms-distortion" key={i}>
                <div className="ms-distortion-name">{d.distortion_type}</div>
                <div className="ms-distortion-quote">
                  &quot;{d.quoted_text}&quot;
                </div>
                <div className="ms-distortion-meta">
                  {d.brief_explanation} · {d.frequency}회
                </div>
                {d.reframe && (
                  <div className="ms-reframe">
                    <span className="ms-reframe-label">생각의 전환</span>
                    <p className="ms-reframe-body">{d.reframe}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {links.length > 0 && (
        <div className="ms-report-section">
          <div className="ms-report-section-label">
            <span className="num">c.</span>
            <span className="name">몸 · 감정 · 생각의 연결</span>
          </div>
          <div className="ms-link-list">
            {links.map((l, i) => (
              <div className="ms-link-row" key={i}>
                <span className="body">{l.body}</span>
                <span className="arrow">↔</span>
                <span className="thought">{l.linked_thought}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <div className="ms-mirror-error">{error}</div>}

      <NextStepCta />
    </div>
  );
}

function NextStepCta() {
  return (
    <a href="#part-two" className="ms-next-step">
      <div className="ms-next-step-meta">
        <span className="ms-next-step-eyebrow">NEXT — PART 02 · 채우기</span>
        <span className="ms-next-step-title">
          이제 현재 상태를 진단했어요.
          <br />
          현재를 벗어나 발전할 방법을 함께 찾아봐요.
        </span>
      </div>
      <span className="ms-next-step-arrow">↓</span>
    </a>
  );
}
