"use client";

import { useState, type KeyboardEvent } from "react";
import {
  MIND_SPILL_BODY_SIGNS,
  MIND_SPILL_EMOTIONS,
} from "@/lib/mind-spill/constants";
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

export function PartOneEmpty({ wb, onPatch }: Props) {
  return (
    <>
      <WeeklyScanStep scan={wb.weekly_scan} onPatch={onPatch} />
      <BrainDumpStep dump={wb.brain_dump} onPatch={onPatch} />
      <MirrorReportStep wb={wb} />
    </>
  );
}

/* ============= i. Weekly Scan ============= */

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
  const toggle = (key: "emotions" | "body_signs", v: string) => {
    const list = scan[key] ?? [];
    const next = list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
    update(key, next);
  };
  const addCustom = (key: "emotions" | "body_signs", v: string) => {
    const t = v.trim();
    if (!t) return;
    const list = scan[key] ?? [];
    if (list.includes(t)) return;
    update(key, [...list, t]);
  };

  return (
    <section className="ms-step">
      <div className="ms-step-header">
        <div className="ms-step-num">i.</div>
        <h2 className="ms-step-title">지금의 나를 스캔합니다</h2>
      </div>
      <p className="ms-step-intro">
        정확하지 않아도 괜찮습니다. 떠오르는 대로, 짐작으로도 충분합니다. 5분.
        준비된 단어를 누르거나, 옆 칸에 직접 적어주세요.
      </p>

      <div className="ms-scan-grid">
        {/* 감정 */}
        <div className="ms-scan-card">
          <div className="ms-scan-card-head">
            <div className="ms-scan-card-title">
              감정 <span className="en">emotion</span>
            </div>
            <div className="ms-scan-card-icon">e</div>
          </div>

          <div className="ms-emo-chips">
            {MIND_SPILL_EMOTIONS.map((e) => (
              <button
                type="button"
                key={e}
                className={`ms-chip ${scan.emotions?.includes(e) ? "active" : ""}`}
                onClick={() => toggle("emotions", e)}
                aria-pressed={scan.emotions?.includes(e) ?? false}
              >
                {e}
              </button>
            ))}
            {/* 사용자가 직접 추가한 감정 */}
            {(scan.emotions ?? [])
              .filter((e) => !PRESET_EMOTIONS.has(e))
              .map((e) => (
                <button
                  type="button"
                  key={`custom-${e}`}
                  className="ms-chip active"
                  onClick={() => toggle("emotions", e)}
                  aria-label={`${e} 삭제`}
                >
                  {e} ×
                </button>
              ))}
          </div>
          <CustomTagInput
            placeholder="+ 직접 추가 (Enter)"
            onAdd={(v) => addCustom("emotions", v)}
          />

          <SliderRow
            label="강도"
            value={scan.emotion_intensity ?? 5}
            onChange={(v) => update("emotion_intensity", v)}
          />
        </div>

        {/* 수면 */}
        <div className="ms-scan-card">
          <div className="ms-scan-card-head">
            <div className="ms-scan-card-title">
              수면 <span className="en">sleep</span>
            </div>
            <div className="ms-scan-card-icon">s</div>
          </div>
          <div className="ms-stat-row">
            <NumberStat
              label="평균 수면"
              unit="h"
              value={scan.sleep_avg_hours}
              onChange={(v) => update("sleep_avg_hours", v)}
              min={0}
              max={14}
              step={0.5}
            />
            <NumberStat
              label="잠들기까지"
              unit="min"
              value={scan.sleep_latency_min}
              onChange={(v) => update("sleep_latency_min", v)}
              min={0}
              max={180}
              step={5}
            />
          </div>
          <SliderRow
            label="회복감"
            value={scan.sleep_recovery ?? 5}
            onChange={(v) => update("sleep_recovery", v)}
          />
        </div>

        {/* 신체 반응 */}
        <div className="ms-scan-card">
          <div className="ms-scan-card-head">
            <div className="ms-scan-card-title">
              신체 반응 <span className="en">body</span>
            </div>
            <div className="ms-scan-card-icon">b</div>
          </div>
          <div className="ms-body-map">
            {MIND_SPILL_BODY_SIGNS.map((b) => (
              <button
                type="button"
                key={b}
                className={`ms-body-tag ${scan.body_signs?.includes(b) ? "active" : ""}`}
                onClick={() => toggle("body_signs", b)}
                aria-pressed={scan.body_signs?.includes(b) ?? false}
              >
                {b}
              </button>
            ))}
            {(scan.body_signs ?? [])
              .filter((e) => !PRESET_BODY.has(e))
              .map((e) => (
                <button
                  type="button"
                  key={`body-custom-${e}`}
                  className="ms-body-tag active"
                  onClick={() => toggle("body_signs", e)}
                  aria-label={`${e} 삭제`}
                >
                  {e} ×
                </button>
              ))}
          </div>
          <CustomTagInput
            placeholder="+ 다른 신체 반응 적기 (Enter)"
            onAdd={(v) => addCustom("body_signs", v)}
          />
        </div>

        {/* 컨디션 */}
        <div className="ms-scan-card">
          <div className="ms-scan-card-head">
            <div className="ms-scan-card-title">
              컨디션 <span className="en">condition</span>
            </div>
            <div className="ms-scan-card-icon">c</div>
          </div>
          {(
            [
              ["energy", "에너지"],
              ["focus", "집중력"],
              ["motivation", "의욕"],
            ] as const
          ).map(([key, label], i) => (
            <SliderRow
              key={key}
              label={label}
              value={scan[key] ?? 5}
              onChange={(v) => update(key, v)}
              flush={i === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----- helpers (Weekly Scan 내부 컨트롤) ----- */

function SliderRow({
  label,
  value,
  onChange,
  flush = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  flush?: boolean;
}) {
  return (
    <div className="ms-intensity" style={flush ? { marginTop: 12 } : undefined}>
      <span className="ms-intensity-label">{label}</span>
      <div className="ms-slider-wrap">
        <input
          className="ms-slider"
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={(e) => onChange(clamp10(Number(e.target.value)))}
          aria-label={label}
        />
      </div>
      <input
        className="ms-value-input"
        type="number"
        min={1}
        max={10}
        step={1}
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") return;
          onChange(clamp10(Number(raw)));
        }}
        aria-label={`${label} 값 직접 입력`}
      />
    </div>
  );
}

function NumberStat({
  label,
  unit,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  unit: string;
  value: number | null;
  onChange: (v: number | null) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div className="ms-stat-block">
      <div className="ms-stat-num">
        <input
          className="ms-stat-input"
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
        <span className="unit">{unit}</span>
      </div>
      <div className="ms-stat-cap">{label}</div>
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
      className="ms-custom-tag-input"
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
  return (
    <section className="ms-step">
      <div className="ms-step-header">
        <div className="ms-step-num">ii.</div>
        <h2 className="ms-step-title">머릿속을 쏟아냅니다</h2>
      </div>
      <p className="ms-step-intro">
        완성된 문장이 아니어도, 모순돼도, 부끄러워도 괜찮습니다. 검열하지 마세요.
        10분 타이머.
      </p>

      <BdPrompt
        title="현재, 나를 불편하게 하는"
        en="recurring"
        hint="요즘 머릿속에 자주 자리 잡는 생각, 자꾸 신경 쓰이는 일을 한 줄씩 적어주세요."
        items={dump.recurring ?? []}
        onChange={(items) => onPatch({ brain_dump: { ...dump, recurring: items } })}
      />
      <BdPrompt
        title="나를 불편하게 만든 생각들"
        en="discomfort"
        hint="두려웠거나 불안하게 만든 생각을 써보세요. 막연한 것도, 형태가 없는 것도 괜찮습니다."
        items={dump.discomfort ?? []}
        onChange={(items) => onPatch({ brain_dump: { ...dump, discomfort: items } })}
      />
      <BdPrompt
        title="해야 하는 일, 해야 하는데 하지 않은 일"
        en="to-do & undone"
        hint="큰 일도, 미루고 있는 작은 일도 모두 좋습니다. 죄책감이 따라오는 항목일수록 적어두세요."
        items={dump.todos ?? []}
        onChange={(items) => onPatch({ brain_dump: { ...dump, todos: items } })}
      />
    </section>
  );
}

function BdPrompt({
  title,
  en,
  hint,
  items,
  onChange,
}: {
  title: string;
  en: string;
  hint: string;
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

  return (
    <div className="ms-bd-prompt">
      <div className="ms-bd-prompt-q">
        {title} <span className="en">{en}</span>
      </div>
      <p className="ms-bd-prompt-hint">{hint}</p>
      <div className="ms-bd-list">
        {draft.map((it) => (
          <div className="ms-bd-block" key={it.id}>
            <div className="ms-bd-block-head">
              <span className="ms-bd-badge">BD</span>
              {draft.length > 1 && (
                <button
                  type="button"
                  className="ms-bd-delete"
                  onClick={() => commit(draft.filter((x) => x.id !== it.id))}
                >
                  삭제
                </button>
              )}
            </div>
            <textarea
              className="ms-bd-textarea"
              value={it.text}
              onChange={(e) =>
                commit(
                  draft.map((x) =>
                    x.id === it.id ? { ...x, text: e.target.value } : x
                  )
                )
              }
              placeholder="Brain Dump 항목"
              rows={1}
              onInput={(e) => {
                const ta = e.currentTarget;
                ta.style.height = "auto";
                ta.style.height = `${ta.scrollHeight}px`;
              }}
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        className="ms-bd-add"
        onClick={() => commit([...draft, newBd()])}
      >
        + Brain Dump 항목 추가
      </button>
    </div>
  );
}

/* ============= iii. Mirror Report (LLM) ============= */

function MirrorReportStep({ wb }: { wb: Workbook }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // optimistic: workbook.mirror_report 가 갱신되어야 UI에 반영되는데,
  // mirror_report 는 WorkbookPatch 의 화이트리스트에 없음 (LLM이 별도 endpoint로 저장).
  // 클라이언트는 fetch 응답으로 받은 결과를 별도 state로 보유.
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

      {/* 분석 트리거 */}
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
        <ReportView
          wb={wb}
          report={report}
          loading={loading}
          onRerun={run}
          error={error}
        />
      )}
    </section>
  );
}

function ReportView({
  wb,
  report,
  loading,
  onRerun,
  error,
}: {
  wb: Workbook;
  report: NonNullable<Workbook["mirror_report"]>;
  loading: boolean;
  onRerun: () => void;
  error: string | null;
}) {
  const clusters = report.emotion_clusters ?? [];
  const distortions = report.cognitive_distortions ?? [];
  const links = report.body_thought_links ?? [];

  // 클러스터 색 매핑
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
                  background:
                    clusterColors[c.category] ?? "var(--ms-ink-3)",
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

      <div className="ms-mirror-actions">
        <button
          type="button"
          className="ms-btn-ghost"
          onClick={onRerun}
          disabled={loading}
        >
          {loading ? "다시 분석 중…" : "다시 분석하기 ↻"}
        </button>
        <span
          style={{
            fontFamily: "var(--ms-font-mono)",
            fontSize: 10,
            color: "var(--ms-ink-3)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            alignSelf: "center",
          }}
        >
          내용을 수정한 뒤 다시 누르면 새로 분석합니다
        </span>
      </div>
      {error && <div className="ms-mirror-error">{error}</div>}

      {/* 다음 단계 안내 */}
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
