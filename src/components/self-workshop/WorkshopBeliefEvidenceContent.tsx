"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  type CoreBeliefSource,
  type NewBeliefData,
} from "@/lib/self-workshop/new-belief";
import {
  type BeliefEvidenceEntry,
  type CopingPlanV2,
  type EvidenceQuestion,
  CATEGORY_LABEL,
  CATEGORY_LABEL_EN,
  EMPTY_COPING_PLAN_V2,
  SOURCE_META,
  buildEntriesFromNewBelief,
  buildPersistPayload,
  hasAnyChosenBelief,
  isEntryComplete,
} from "@/lib/self-workshop/coping-plan";

/* ──────────────────────────────────────────────────────────
 * 디자인 토큰 — Step 8과 동일한 wb-* 매핑.
 * ────────────────────────────────────────────────────────── */
const T = {
  ink: "var(--wb-ink)",
  text: "var(--wb-text)",
  text2: "var(--wb-text2)",
  text3: "var(--wb-text3)",
  text4: "#B5B5BC",
  hair: "var(--wb-hair)",
  hair2: "var(--wb-hair2)",
  surface: "#FFFFFF",
  surface2: "var(--wb-surface2)",
  accent: "var(--wb-accent)",
  accentSoft: "var(--wb-accent-soft)",
  accentTint: "#FFFBF7",
  font: "'Pretendard Variable', 'Pretendard', system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

const COL = 720;

interface BeliefAnalysisInput {
  belief_about_self?: string;
  belief_about_others?: string;
  belief_about_world?: string;
}

interface Props {
  workshopId: string;
  savedData?: Partial<CopingPlanV2> | null;
  /** Step 8 결과 — 신념·새 신념 본문의 source. 없으면 가드 표시. */
  newBelief: NewBeliefData | null;
  /** 다운스트림에서 사용 안 하지만 호환성 유지를 위해 받아둠 */
  beliefAnalysis: BeliefAnalysisInput | null;
}

/* ──────────────────────────────────────────────────────────
 * 초기 데이터 빌드
 *   저장된 v2가 있으면 entries 텍스트를 최신 newBelief로 동기화하고 그대로 사용.
 *   없으면 newBelief에서 새로 만든다.
 * ────────────────────────────────────────────────────────── */
function buildInitialData(props: Props): CopingPlanV2 {
  const fresh = buildEntriesFromNewBelief(props.newBelief);
  const saved = props.savedData;

  // 저장된 v2가 있는 경우 — entries 머지(텍스트는 최신값으로 동기화)
  if (saved?.version === 2 && Array.isArray(saved.entries)) {
    const savedEntries = saved.entries as BeliefEvidenceEntry[];
    const merged: BeliefEvidenceEntry[] = fresh.map((freshEntry) => {
      const found = savedEntries.find((e) => e.source === freshEntry.source);
      if (!found) return freshEntry;
      return {
        ...freshEntry,
        new_belief_text: freshEntry.new_belief_text || found.new_belief_text,
        old_belief_text: freshEntry.old_belief_text || found.old_belief_text,
        questions: found.questions ?? [],
        answers: found.answers ?? {},
        free_evidence: found.free_evidence ?? [],
        reinforced_strength: found.reinforced_strength ?? null,
        done: found.done ?? false,
      };
    });
    return {
      ...EMPTY_COPING_PLAN_V2,
      version: 2,
      entries: merged,
      selected_sources:
        saved.selected_sources && Array.isArray(saved.selected_sources)
          ? saved.selected_sources
          : merged.map((e) => e.source),
      phase: saved.phase ?? "intro",
      current_idx: saved.current_idx ?? 0,
    };
  }

  return {
    ...EMPTY_COPING_PLAN_V2,
    version: 2,
    entries: fresh,
    selected_sources: fresh.map((e) => e.source),
  };
}

/* ──────────────────────────────────────────────────────────
 * 메인
 * ────────────────────────────────────────────────────────── */
export function WorkshopBeliefEvidenceContent(props: Props) {
  const router = useRouter();
  const [data, setData] = useState<CopingPlanV2>(() => buildInitialData(props));
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(
    (next: CopingPlanV2) => {
      setSaveStatus("saving");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          const payload = buildPersistPayload(next);
          await fetch("/api/self-workshop/save-progress", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workshopId: props.workshopId,
              field: "coping_plan",
              data: payload,
            }),
          });
          setSaveStatus("saved");
        } catch {
          setSaveStatus("idle");
        }
      }, 600);
    },
    [props.workshopId]
  );

  const update = useCallback(
    (updater: (d: CopingPlanV2) => CopingPlanV2) => {
      setData((prev) => {
        const next = updater(prev);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const updateEntry = useCallback(
    (idx: number, patch: Partial<BeliefEvidenceEntry>) => {
      update((d) => {
        const entries = d.entries.slice();
        entries[idx] = { ...entries[idx], ...patch };
        return { ...d, entries };
      });
    },
    [update]
  );

  /* 페이즈/인덱스 변경 시 상단 스크롤 */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [data.phase, data.current_idx]);

  /* writing 진입 시 활성 entry의 questions가 비어 있으면 LLM으로 생성
     (사용자가 답을 시작하지 않은 pristine entry만 갱신) */
  const fetchKey = useRef<string>("");
  useEffect(() => {
    if (data.phase !== "writing") return;
    const idx = activeEntryIndex(data);
    if (idx < 0) return;
    const cur = data.entries[idx];
    if (!cur) return;

    const hasQuestions = (cur.questions?.length ?? 0) >= 4;
    const pristine =
      Object.values(cur.answers || {}).every(
        (s) => !s || s.trim().length === 0
      ) &&
      (cur.free_evidence || []).length === 0 &&
      cur.reinforced_strength == null;

    if (hasQuestions && !pristine) return;
    if (hasQuestions) return; // pristine이라도 이미 받은 질문이 있으면 유지

    const key = `${cur.source}:${cur.new_belief_text}`;
    if (fetchKey.current === key) return;
    fetchKey.current = key;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          "/api/self-workshop/belief-evidence-questions",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              new_belief_text: cur.new_belief_text,
              old_belief_text: cur.old_belief_text,
              classification: cur.classification,
              source: cur.source,
            }),
          }
        );
        if (!res.ok) throw new Error("질문 생성 실패");
        const json = (await res.json()) as { questions?: EvidenceQuestion[] };
        if (cancelled) return;
        if (Array.isArray(json.questions) && json.questions.length >= 4) {
          updateEntry(idx, { questions: json.questions });
        }
      } catch {
        /* 폴백은 서버에서도 채워주므로 별도 UI 처리는 불필요 */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data, updateEntry]);

  /* ────── CTA 액션 ────── */
  function startFromIntro() {
    update((d) => ({ ...d, phase: "select" }));
  }
  function confirmSelection(sources: CoreBeliefSource[]) {
    if (sources.length === 0) return;
    update((d) => ({
      ...d,
      selected_sources: sources,
      phase: "writing",
      current_idx: 0,
    }));
    // 나머지 신념도 백그라운드 prefetch
    void prefetchBackgroundQuestions(data.entries, sources);
  }
  function completeCurrentEntry() {
    update((d) => {
      const entries = d.entries.slice();
      const idx = activeEntryIndex(d);
      if (idx >= 0) entries[idx] = { ...entries[idx], done: true };

      // 다음 selected source의 entry로 이동
      const orderedIndices = orderedSelectedIndices(d);
      const cursor = orderedIndices.indexOf(idx);
      if (cursor < 0 || cursor + 1 >= orderedIndices.length) {
        return { ...d, entries, phase: "allDone" };
      }
      return {
        ...d,
        entries,
        current_idx: orderedIndices[cursor + 1],
      };
    });
  }
  function backToSelect() {
    update((d) => ({ ...d, phase: "select" }));
  }

  async function goNextStage() {
    setSubmitting(true);
    setError("");
    try {
      const payload = buildPersistPayload({ ...data, phase: "allDone" });
      const res = await fetch("/api/self-workshop/save-progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshopId: props.workshopId,
          field: "coping_plan",
          data: payload,
          advanceStep: 9,
        }),
      });
      if (!res.ok) throw new Error("저장에 실패했습니다.");
      router.push("/dashboard/self-workshop/step/9");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  /* ────── 가드: Step 8을 건너뛴 사용자 ────── */
  if (!hasAnyChosenBelief(props.newBelief?.beliefs) || data.entries.length === 0) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <p className="text-sm text-[var(--foreground)]/60">
          이 단계로 오기 전에 새 핵심 신념을 먼저 골라야 해요. Step 8(새 핵심
          신념 찾기)부터 다시 진행해 주세요.
        </p>
        <Link
          href="/dashboard/self-workshop/step/8"
          className="mt-4 inline-block text-sm font-medium text-[var(--foreground)] underline"
        >
          Step 8으로 돌아가기 →
        </Link>
      </div>
    );
  }

  return (
    <div
      className="bev-root"
      style={{
        width: "100%",
        background: T.surface,
        color: T.text,
        fontFamily: T.font,
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <SubProgress
        saveStatus={saveStatus}
        currentIdx={data.current_idx}
        phase={data.phase}
        selectedCount={data.selected_sources.length}
        currentOrderIdx={
          data.phase === "writing"
            ? Math.max(
                0,
                orderedSelectedIndices(data).indexOf(data.current_idx)
              )
            : 0
        }
      />

      {data.phase === "intro" && (
        <Intro entries={data.entries} onStart={startFromIntro} />
      )}

      {data.phase === "select" && (
        <SelectPhase
          entries={data.entries}
          initialSelection={
            data.selected_sources.length > 0
              ? data.selected_sources
              : data.entries.map((e) => e.source)
          }
          onConfirm={confirmSelection}
        />
      )}

      {data.phase === "writing" &&
        (() => {
          const idx = activeEntryIndex(data);
          const cur = data.entries[idx];
          if (!cur) return null;
          const ordered = orderedSelectedIndices(data);
          const cursor = ordered.indexOf(idx);
          const isLast = cursor === ordered.length - 1;
          return (
            <WritingPhase
              key={cur.source}
              entry={cur}
              cursor={cursor + 1}
              total={ordered.length}
              isLast={isLast}
              onChange={(patch) => updateEntry(idx, patch)}
              onComplete={completeCurrentEntry}
            />
          );
        })()}

      {data.phase === "allDone" && (
        <AllDone
          entries={data.entries}
          selectedSources={data.selected_sources}
          onBackToSelect={backToSelect}
          onContinue={goNextStage}
          submitting={submitting}
          error={error}
        />
      )}

      {/* 글로벌 스타일(슬라이더 thumb, reveal 키프레임 등) */}
      <style jsx global>{`
        @keyframes bev-fade-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .bev-reveal {
          animation: bev-fade-up 0.45s cubic-bezier(0.2, 0.7, 0.2, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .bev-reveal {
            animation: none;
          }
        }
        .bev-root textarea {
          font-family: inherit;
        }
        .bev-root textarea::placeholder {
          color: ${T.text4};
        }
        .bev-root textarea:focus {
          outline: none;
        }
        .bev-root button:focus-visible {
          outline: 2px solid ${T.ink};
          outline-offset: 3px;
        }
        .bev-range {
          -webkit-appearance: none;
          appearance: none;
        }
        .bev-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 11px;
          background: ${T.surface};
          border: 2px solid ${T.accent};
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);
          cursor: pointer;
          margin-top: -10px;
        }
        .bev-range::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 11px;
          background: ${T.surface};
          border: 2px solid ${T.accent};
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);
          cursor: pointer;
        }
        @media (max-width: 560px) {
          .bev-select-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ────── 활성 entry 인덱스 계산 ────── */
function activeEntryIndex(d: CopingPlanV2): number {
  if (d.entries.length === 0) return -1;
  const ordered = orderedSelectedIndices(d);
  if (ordered.includes(d.current_idx)) return d.current_idx;
  return ordered[0] ?? -1;
}

/** selected_sources 순서대로 entries 인덱스 배열 */
function orderedSelectedIndices(d: CopingPlanV2): number[] {
  const out: number[] = [];
  for (const src of d.selected_sources) {
    const idx = d.entries.findIndex((e) => e.source === src);
    if (idx >= 0) out.push(idx);
  }
  return out;
}

/* ────── 백그라운드 prefetch ────── */
async function prefetchBackgroundQuestions(
  entries: BeliefEvidenceEntry[],
  selected: CoreBeliefSource[]
): Promise<void> {
  const targets = entries.filter(
    (e) =>
      selected.includes(e.source) &&
      (e.questions?.length ?? 0) < 4
  );
  // 첫 번째는 메인 useEffect에서 await — 백그라운드는 두 번째부터
  for (const e of targets.slice(1)) {
    fetch("/api/self-workshop/belief-evidence-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        new_belief_text: e.new_belief_text,
        old_belief_text: e.old_belief_text,
        classification: e.classification,
        source: e.source,
      }),
    }).catch(() => {});
  }
}

/* ──────────────────────────────────────────────────────────
 * 서브: Mono 라벨
 * ────────────────────────────────────────────────────────── */
function Mono({
  children,
  size = 11,
  color,
  tracking = 0.08,
  weight = 600,
  upper = true,
  style,
}: {
  children: React.ReactNode;
  size?: number;
  color?: string;
  tracking?: number;
  weight?: number;
  upper?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <span
      style={{
        fontFamily: T.mono,
        fontWeight: weight,
        fontSize: size,
        letterSpacing: `${tracking}em`,
        textTransform: upper ? "uppercase" : "none",
        color: color || T.text2,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function SaveBadge({
  status,
}: {
  status: "idle" | "saving" | "saved";
}) {
  const map = {
    idle: { dot: T.text4, label: "AUTO-SAVE" },
    saving: { dot: T.accent, label: "저장 중…" },
    saved: { dot: T.ink, label: "✓ 저장됨" },
  } as const;
  const cur = map[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "5px 10px",
        borderRadius: 999,
        border: `1px solid ${T.hair}`,
        background: T.surface,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          background: cur.dot,
          boxShadow: status === "saving" ? `0 0 0 3px ${T.accentSoft}` : "none",
        }}
      />
      <Mono size={9} color={T.text2} tracking={0.14}>
        {cur.label}
      </Mono>
    </span>
  );
}

/* ──────────────────────────────────────────────────────────
 * SubProgress (저장 뱃지 + 페이즈 진행도)
 * ────────────────────────────────────────────────────────── */
function SubProgress({
  saveStatus,
  phase,
  selectedCount,
  currentOrderIdx,
}: {
  saveStatus: "idle" | "saving" | "saved";
  currentIdx: number;
  phase: CopingPlanV2["phase"];
  selectedCount: number;
  currentOrderIdx: number;
}) {
  const total = Math.max(1, selectedCount);
  const done = phase === "allDone" ? total : phase === "writing" ? currentOrderIdx : 0;
  return (
    <header
      style={{
        boxSizing: "border-box",
        maxWidth: COL,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <SaveBadge status={saveStatus} />
      </div>

      {phase !== "intro" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            paddingBottom: 22,
            borderBottom: `1px solid ${T.hair}`,
          }}
        >
          <Mono size={10} color={T.text3}>
            EVIDENCE
          </Mono>
          <div style={{ flex: 1, display: "flex", gap: 4 }}>
            {Array.from({ length: total }).map((_, i) => {
              const isCur = phase === "writing" && i === currentOrderIdx;
              const isDone = i < done;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    background: isCur ? T.accent : isDone ? T.ink : T.hair,
                    transition: "background .3s",
                  }}
                />
              );
            })}
          </div>
          <Mono size={10} color={T.text2}>
            {phase === "allDone"
              ? `${String(total).padStart(2, "0")} / ${String(total).padStart(2, "0")}`
              : phase === "writing"
              ? `${String(currentOrderIdx + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`
              : `00 / ${String(total).padStart(2, "0")}`}
          </Mono>
        </div>
      )}
    </header>
  );
}

/* ──────────────────────────────────────────────────────────
 * SectionCard — 영역 분리 카드 박스 (Step 8 패턴 재현)
 * ────────────────────────────────────────────────────────── */
function SectionCard({
  label,
  tone,
  children,
  compact = false,
}: {
  label: string;
  tone: "neutral" | "accent" | "input";
  children: React.ReactNode;
  compact?: boolean;
}) {
  const palette =
    tone === "accent"
      ? { bg: T.accentTint, border: T.accent, labelColor: T.accent }
      : tone === "input"
      ? { bg: T.surface, border: T.ink, labelColor: T.ink }
      : { bg: T.surface2, border: T.hair, labelColor: T.text3 };
  return (
    <div
      style={{
        marginBottom: compact ? 0 : 14,
        border: `1px solid ${palette.border}`,
        background: palette.bg,
        borderRadius: 14,
        padding: "16px 18px",
      }}
    >
      <Mono size={10} color={palette.labelColor} tracking={0.14}>
        {label}
      </Mono>
      <div style={{ marginTop: 10 }}>{children}</div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
 * Intro
 * ────────────────────────────────────────────────────────── */
function Intro({
  entries,
  onStart,
}: {
  entries: BeliefEvidenceEntry[];
  onStart: () => void;
}) {
  return (
    <section
      style={{
        padding: "48px 0 0",
        boxSizing: "border-box",
        maxWidth: COL,
        margin: "0 auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Mono size={10} color={T.accent} tracking={0.18}>
          ● BEFORE WE BEGIN
        </Mono>
        <div style={{ flex: 1, height: 1, background: T.hair }} />
      </div>

      <h2
        style={{
          margin: "20px 0 0",
          fontFamily: T.font,
          fontWeight: 700,
          fontSize: 38,
          lineHeight: 1.2,
          letterSpacing: "-0.025em",
          color: T.ink,
          textWrap: "balance" as React.CSSProperties["textWrap"],
        }}
      >
        신념은 한 번에 강해지지 않아요. 오늘은 새 신념을 떠받칠 *증거*를 모아볼
        거예요.
      </h2>
      <p
        style={{
          margin: "16px 0 0",
          fontSize: 16,
          lineHeight: 1.7,
          color: T.text2,
          maxWidth: 600,
          letterSpacing: "-0.005em",
        }}
      >
        과거의 한 장면, 친구에게 건넬 한 마디, 오늘 일어난 작은 사실 — 이런
        조각들이 모여 새 신념의 자리가 됩니다. 한 번에 하나의 신념을, 부담
        없이 살펴봐요.
      </p>

      {/* 새 신념 미리보기 */}
      <div
        style={{
          marginTop: 40,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {entries.map((e, i) => {
          const meta = SOURCE_META[e.source];
          return (
            <div
              key={e.source}
              style={{
                padding: "20px 0",
                borderTop: `1px solid ${T.hair}`,
                borderBottom:
                  i === entries.length - 1 ? `1px solid ${T.hair}` : "none",
                display: "grid",
                gridTemplateColumns: "56px 1fr",
                gap: 18,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  fontFamily: T.mono,
                  fontSize: 11,
                  color: T.text3,
                  letterSpacing: "0.1em",
                  paddingTop: 4,
                }}
              >
                {meta.code}
              </div>
              <div>
                <Mono size={9.5} color={T.text3} tracking={0.16}>
                  ● {meta.classification_en}
                </Mono>
                <div
                  style={{
                    marginTop: 6,
                    fontSize: 17,
                    fontWeight: 700,
                    color: T.ink,
                    lineHeight: 1.45,
                    letterSpacing: "-0.012em",
                    textWrap: "pretty" as React.CSSProperties["textWrap"],
                    whiteSpace: "pre-line",
                  }}
                >
                  {e.new_belief_text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 40,
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={onStart}
          style={{
            fontFamily: T.font,
            fontWeight: 600,
            fontSize: 16,
            background: T.ink,
            color: T.surface,
            border: "none",
            borderRadius: 999,
            padding: "15px 28px",
            cursor: "pointer",
            letterSpacing: "-0.005em",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 8px 20px -8px rgba(0,0,0,0.3)",
          }}
        >
          <span>신념 하나씩 살펴볼게요</span>
          <span style={{ fontFamily: T.mono, fontSize: 14 }}>→</span>
        </button>
        <Mono size={10} color={T.text3}>
          자동 저장
        </Mono>
      </div>

      <div style={{ height: 80 }} />
    </section>
  );
}

/* ──────────────────────────────────────────────────────────
 * SelectPhase — 어떤 신념을 떠받칠지 1~3개 고르기
 * ────────────────────────────────────────────────────────── */
function SelectPhase({
  entries,
  initialSelection,
  onConfirm,
}: {
  entries: BeliefEvidenceEntry[];
  initialSelection: CoreBeliefSource[];
  onConfirm: (sources: CoreBeliefSource[]) => void;
}) {
  const [selected, setSelected] = useState<CoreBeliefSource[]>(initialSelection);

  function toggle(src: CoreBeliefSource) {
    setSelected((cur) =>
      cur.includes(src) ? cur.filter((s) => s !== src) : [...cur, src]
    );
  }

  return (
    <section
      style={{
        padding: "48px 0 0",
        boxSizing: "border-box",
        maxWidth: COL,
        margin: "0 auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Mono size={10} color={T.accent} tracking={0.18}>
          ● PICK YOUR FOCUS
        </Mono>
        <div style={{ flex: 1, height: 1, background: T.hair }} />
      </div>

      <h2
        style={{
          margin: "20px 0 0",
          fontFamily: T.font,
          fontWeight: 700,
          fontSize: 32,
          lineHeight: 1.25,
          letterSpacing: "-0.025em",
          color: T.ink,
          textWrap: "balance" as React.CSSProperties["textWrap"],
        }}
      >
        지금 가장 강하게 떠받치고 싶은 신념을 골라주세요.
      </h2>
      <p
        style={{
          margin: "14px 0 0",
          fontSize: 15,
          lineHeight: 1.7,
          color: T.text2,
          maxWidth: 600,
          letterSpacing: "-0.005em",
        }}
      >
        한 축이라도 충분해요. 나머지 신념은 다음에 다시 와서 채워도 좋아요.
      </p>

      <div
        className="bev-select-grid"
        style={{
          marginTop: 32,
          display: "grid",
          gridTemplateColumns: `repeat(${entries.length}, minmax(0, 1fr))`,
          gap: 16,
        }}
      >
        {entries.map((e) => {
          const meta = SOURCE_META[e.source];
          const isPicked = selected.includes(e.source);
          return (
            <button
              key={e.source}
              onClick={() => toggle(e.source)}
              style={{
                fontFamily: T.font,
                textAlign: "left",
                cursor: "pointer",
                background: isPicked ? T.accentTint : "transparent",
                border: `1.5px solid ${isPicked ? T.accent : T.hair}`,
                borderRadius: 14,
                padding: "18px 18px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                transition: "all .18s",
              }}
              onMouseEnter={(ev) => {
                if (!isPicked)
                  ev.currentTarget.style.borderColor = T.text2;
              }}
              onMouseLeave={(ev) => {
                if (!isPicked) ev.currentTarget.style.borderColor = T.hair;
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Mono
                  size={10}
                  color={isPicked ? T.accent : T.text3}
                  tracking={0.14}
                >
                  {meta.code} · {meta.classification_en}
                </Mono>
                <CheckBox checked={isPicked} />
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: T.ink,
                  lineHeight: 1.55,
                  letterSpacing: "-0.005em",
                  textWrap: "pretty" as React.CSSProperties["textWrap"],
                  whiteSpace: "pre-line",
                }}
              >
                {e.new_belief_text}
              </div>
            </button>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 36,
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={() => onConfirm(selected)}
          disabled={selected.length === 0}
          style={{
            fontFamily: T.font,
            fontWeight: 600,
            fontSize: 16,
            background: selected.length === 0 ? T.hair : T.ink,
            color: T.surface,
            border: "none",
            borderRadius: 999,
            padding: "15px 28px",
            cursor: selected.length === 0 ? "not-allowed" : "pointer",
            letterSpacing: "-0.005em",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            boxShadow:
              selected.length === 0 ? "none" : "0 8px 20px -8px rgba(0,0,0,0.3)",
            opacity: selected.length === 0 ? 0.6 : 1,
          }}
        >
          <span>
            {selected.length === 0
              ? "한 신념 이상 골라주세요"
              : `이 ${selected.length}개로 진행할게요`}
          </span>
          {selected.length > 0 && (
            <span style={{ fontFamily: T.mono, fontSize: 14 }}>→</span>
          )}
        </button>
      </div>

      <div style={{ height: 80 }} />
    </section>
  );
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      style={{
        width: 22,
        height: 22,
        borderRadius: 6,
        border: `1.5px solid ${checked ? T.accent : T.hair}`,
        background: checked ? T.accent : "transparent",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all .18s",
        boxShadow: checked ? `0 0 0 4px ${T.accentSoft}` : "none",
        flexShrink: 0,
      }}
    >
      {checked && (
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path
            d="M2 5.5L4.5 8L9 3"
            stroke="#fff"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────
 * WritingPhase — 신념 1개의 근거 모으기
 * ────────────────────────────────────────────────────────── */
function WritingPhase({
  entry,
  cursor,
  total,
  isLast,
  onChange,
  onComplete,
}: {
  entry: BeliefEvidenceEntry;
  cursor: number;
  total: number;
  isLast: boolean;
  onChange: (patch: Partial<BeliefEvidenceEntry>) => void;
  onComplete: () => void;
}) {
  const filledAnswers = useMemo(
    () =>
      Object.values(entry.answers || {}).filter(
        (s) => typeof s === "string" && s.trim().length > 4
      ).length,
    [entry.answers]
  );
  const canComplete = isEntryComplete(entry);
  const meta = SOURCE_META[entry.source];

  function setAnswer(qid: string, value: string) {
    onChange({ answers: { ...(entry.answers || {}), [qid]: value } });
  }
  function setStrength(v: number) {
    onChange({ reinforced_strength: v });
  }
  function addFreeEvidence() {
    onChange({ free_evidence: [...(entry.free_evidence || []), ""] });
  }
  function setFreeEvidence(i: number, v: string) {
    const next = (entry.free_evidence || []).slice();
    next[i] = v;
    onChange({ free_evidence: next });
  }
  function removeFreeEvidence(i: number) {
    const next = (entry.free_evidence || []).slice();
    next.splice(i, 1);
    onChange({ free_evidence: next });
  }

  return (
    <section
      style={{
        padding: "44px 0 0",
        boxSizing: "border-box",
        maxWidth: COL,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <Mono size={10} color={T.accent} tracking={0.18}>
          ● BELIEF · {String(cursor).padStart(2, "0")} /{" "}
          {String(total).padStart(2, "0")}
        </Mono>
        <Mono size={9.5} color={T.text3} tracking={0.14}>
          {meta.classification_en}
        </Mono>
      </div>

      {/* 새 신념 카드 */}
      <SectionCard label={`${meta.code} · 떠받칠 새 신념`} tone="accent">
        <blockquote
          style={{
            margin: 0,
            paddingLeft: 16,
            fontFamily: T.font,
            fontSize: 22,
            fontWeight: 700,
            color: T.ink,
            lineHeight: 1.4,
            letterSpacing: "-0.018em",
            textWrap: "balance" as React.CSSProperties["textWrap"],
            borderLeft: `2px solid ${T.accent}`,
            whiteSpace: "pre-line",
          }}
        >
          {entry.new_belief_text}
        </blockquote>
        {entry.old_belief_text && (
          <div
            style={{
              marginTop: 14,
              fontSize: 13,
              color: T.text3,
              letterSpacing: "-0.003em",
              lineHeight: 1.55,
            }}
          >
            <Mono size={9.5} color={T.text4} tracking={0.14}>
              옛 신념
            </Mono>{" "}
            <span
              style={{
                textDecoration: "line-through",
                textDecorationColor: T.text4,
              }}
            >
              {entry.old_belief_text}
            </span>
          </div>
        )}
      </SectionCard>

      {/* 안내문 */}
      <p
        style={{
          margin: "20px 0 16px",
          fontSize: 14.5,
          color: T.text2,
          lineHeight: 1.65,
          letterSpacing: "-0.003em",
        }}
      >
        아래 질문들은 이 신념을 *반박*하는 게 아니라 *떠받치는* 작은 사실들을
        떠올리도록 돕는 질문이에요. 모든 질문에 답할 필요는 없고, 떠오르는
        것만 적어도 충분해요.
      </p>

      {/* 질문 카드 4-6개 */}
      {entry.questions.length === 0 ? (
        <SectionCard label="QUESTIONS" tone="neutral">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: "8px 0",
            }}
            aria-label="질문을 만드는 중"
          >
            <div
              style={{
                height: 14,
                borderRadius: 4,
                background: T.hair2,
                width: "82%",
              }}
            />
            <div
              style={{
                height: 14,
                borderRadius: 4,
                background: T.hair2,
                width: "68%",
              }}
            />
            <div
              style={{
                marginTop: 4,
                fontFamily: T.mono,
                fontSize: 10,
                color: T.text3,
                letterSpacing: "0.04em",
              }}
            >
              이 신념을 떠받칠 질문들을 만들고 있어요…
            </div>
          </div>
        </SectionCard>
      ) : (
        entry.questions.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            answer={entry.answers?.[q.id] ?? ""}
            onChange={(v) => setAnswer(q.id, v)}
          />
        ))
      )}

      {/* 자유 근거 추가 */}
      <SectionCard label="FREE NOTES · 자유 근거" tone="neutral">
        <p
          style={{
            margin: "0 0 12px",
            fontSize: 13,
            color: T.text2,
            lineHeight: 1.6,
          }}
        >
          위 질문 외에 떠오른 증거가 있다면 자유롭게 적어보세요.
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {(entry.free_evidence || []).map((v, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <textarea
                value={v}
                onChange={(e) => setFreeEvidence(i, e.target.value)}
                placeholder="떠오른 작은 사실을 한 줄로 적어보세요."
                rows={2}
                style={{
                  flex: 1,
                  boxSizing: "border-box",
                  padding: "10px 12px",
                  border: `1px solid ${T.hair}`,
                  borderRadius: 8,
                  fontFamily: T.font,
                  fontSize: 14,
                  color: T.ink,
                  letterSpacing: "-0.003em",
                  lineHeight: 1.55,
                  resize: "none",
                  background: T.surface,
                  outline: "none",
                }}
              />
              <button
                onClick={() => removeFreeEvidence(i)}
                style={{
                  fontFamily: T.font,
                  fontSize: 12,
                  color: T.text3,
                  background: "transparent",
                  border: `1px solid ${T.hair}`,
                  borderRadius: 8,
                  padding: "6px 10px",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
                aria-label="이 카드 삭제"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={addFreeEvidence}
            style={{
              fontFamily: T.font,
              fontSize: 13,
              color: T.text2,
              background: "transparent",
              border: `1px dashed ${T.hair}`,
              borderRadius: 8,
              padding: "10px 12px",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            + 작은 사실 한 줄 더 적기
          </button>
        </div>
      </SectionCard>

      {/* 강화 슬라이더 */}
      <SectionCard label="STRENGTH · 단단함 가늠" tone="neutral">
        <p
          style={{
            margin: "0 0 12px",
            fontSize: 13.5,
            color: T.text2,
            lineHeight: 1.6,
          }}
        >
          지금 이 신념이 얼마나 단단하게 느껴지나요? 솔직한 만큼만.
        </p>
        <ReinforcedSlider
          value={entry.reinforced_strength ?? 30}
          dirty={entry.reinforced_strength != null}
          onChange={setStrength}
        />
      </SectionCard>

      {/* CTA */}
      <div
        style={{
          marginTop: 28,
          paddingTop: 20,
          borderTop: `1px solid ${T.hair}`,
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <button
          onClick={onComplete}
          disabled={!canComplete}
          style={{
            fontFamily: T.font,
            fontWeight: 600,
            fontSize: 15,
            background: canComplete ? T.ink : T.hair,
            color: T.surface,
            border: "none",
            borderRadius: 999,
            padding: "13px 24px",
            cursor: canComplete ? "pointer" : "not-allowed",
            opacity: canComplete ? 1 : 0.6,
            letterSpacing: "-0.005em",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            boxShadow: canComplete
              ? "0 8px 20px -8px rgba(0,0,0,0.3)"
              : "none",
          }}
        >
          <span>{isLast ? "정리 보기 →" : "이 신념 마치기 →"}</span>
        </button>
        {!canComplete && (
          <Mono size={10} color={T.text3}>
            답변 2개 이상 작성하고 단단함을 가늠해 주세요 ({filledAnswers}/2)
          </Mono>
        )}
      </div>

      <div style={{ height: 100 }} />
    </section>
  );
}

function QuestionCard({
  question,
  answer,
  onChange,
}: {
  question: EvidenceQuestion;
  answer: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [answer]);

  return (
    <SectionCard
      label={`● ${CATEGORY_LABEL_EN[question.category]} · ${
        CATEGORY_LABEL[question.category]
      }`}
      tone="input"
    >
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: T.ink,
          lineHeight: 1.5,
          letterSpacing: "-0.005em",
          textWrap: "pretty" as React.CSSProperties["textWrap"],
          marginBottom: 12,
        }}
      >
        {question.text}
      </div>
      <textarea
        ref={ref}
        value={answer}
        onChange={(e) => onChange(e.target.value)}
        placeholder="떠오르는 만큼만 적어보세요."
        rows={2}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "10px 0 4px",
          border: "none",
          borderTop: `1px solid ${T.hair2}`,
          fontFamily: T.font,
          fontSize: 15,
          color: T.ink,
          letterSpacing: "-0.003em",
          lineHeight: 1.6,
          resize: "none",
          background: "transparent",
          outline: "none",
          fontWeight: 500,
        }}
      />
    </SectionCard>
  );
}

function ReinforcedSlider({
  value,
  dirty,
  onChange,
}: {
  value: number;
  dirty: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 8,
        }}
      >
        <Mono size={10} color={T.text3} tracking={0.14}>
          단단함
        </Mono>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span
            style={{
              fontFamily: T.mono,
              fontSize: 32,
              fontWeight: 700,
              color: dirty ? T.accent : T.text4,
              letterSpacing: "-0.025em",
              lineHeight: 1,
              transition: "color .25s",
            }}
          >
            {value}
          </span>
          <span
            style={{ fontFamily: T.mono, fontSize: 13, color: T.text3 }}
          >
            %
          </span>
        </div>
      </div>
      <div style={{ position: "relative", padding: "12px 0 4px" }}>
        <div
          style={{
            height: 4,
            borderRadius: 2,
            background: T.hair2,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${value}%`,
              background: dirty ? T.accent : T.text4,
              borderRadius: 2,
              transition: "background .25s, width .15s",
            }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            width: "100%",
            height: 28,
            background: "transparent",
            appearance: "none",
            cursor: "pointer",
            margin: 0,
          }}
          className="bev-range"
        />
      </div>
      <div
        style={{
          marginTop: 10,
          display: "flex",
          justifyContent: "space-between",
          fontFamily: T.mono,
          fontSize: 10,
          color: T.text3,
          letterSpacing: "0.04em",
        }}
      >
        <span>0 · 아직 멀게 느껴짐</span>
        <span>100 · 단단하게 느껴짐</span>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
 * AllDone — 도서관 뷰 + Step 10 CTA
 * ────────────────────────────────────────────────────────── */
function AllDone({
  entries,
  selectedSources,
  onBackToSelect,
  onContinue,
  submitting,
  error,
}: {
  entries: BeliefEvidenceEntry[];
  selectedSources: CoreBeliefSource[];
  onBackToSelect: () => void;
  onContinue: () => void;
  submitting: boolean;
  error: string;
}) {
  const completed = entries.filter(
    (e) => selectedSources.includes(e.source) && isEntryComplete(e)
  );
  const avgStrength = useMemo(() => {
    const filled = completed
      .map((e) => e.reinforced_strength)
      .filter((v): v is number => typeof v === "number");
    if (filled.length === 0) return 0;
    return Math.round(filled.reduce((a, b) => a + b, 0) / filled.length);
  }, [completed]);

  const remainingSources = entries
    .filter((e) => !selectedSources.includes(e.source))
    .map((e) => e.source);

  return (
    <section
      style={{
        padding: "48px 0 0",
        boxSizing: "border-box",
        maxWidth: COL,
        margin: "0 auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Mono size={10} color={T.accent} tracking={0.18}>
          ● STAGE COMPLETE
        </Mono>
        <div style={{ flex: 1, height: 1, background: T.hair }} />
      </div>
      <h2
        style={{
          margin: "20px 0 0",
          fontFamily: T.font,
          fontWeight: 700,
          fontSize: 36,
          lineHeight: 1.2,
          letterSpacing: "-0.025em",
          color: T.ink,
          textWrap: "balance" as React.CSSProperties["textWrap"],
        }}
      >
        {completed.length > 0
          ? `${completed.length}가지 새 신념을 평균 ${avgStrength}%의 단단함으로 떠받쳤어요.`
          : "여기까지 모은 근거를 정리했어요."}
      </h2>
      <p
        style={{
          margin: "16px 0 0",
          fontSize: 16,
          lineHeight: 1.7,
          color: T.text2,
          maxWidth: 600,
          letterSpacing: "-0.005em",
        }}
      >
        오늘 모은 카드들은 다음에 신념이 흔들릴 때 다시 꺼내볼 수 있는{" "}
        <b style={{ color: T.ink }}>작은 도서관</b>이 됩니다. 며칠 뒤 다시
        와서 새 카드를 한두 장 더 보태면, 신념의 자리가 더 단단해져요.
      </p>

      {/* 완료된 신념 요약 */}
      <div
        style={{
          marginTop: 36,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {entries
          .filter((e) => selectedSources.includes(e.source))
          .map((e) => (
            <SectionCard
              key={e.source}
              label={`${SOURCE_META[e.source].code} · ${
                SOURCE_META[e.source].classification_en
              }`}
              tone="neutral"
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: T.ink,
                  lineHeight: 1.45,
                  letterSpacing: "-0.012em",
                  textWrap: "pretty" as React.CSSProperties["textWrap"],
                  whiteSpace: "pre-line",
                  paddingLeft: 12,
                  borderLeft: `2px solid ${T.accent}`,
                  marginBottom: 14,
                }}
              >
                {e.new_belief_text}
              </div>

              {/* 강도 바 */}
              {e.reinforced_strength != null && (
                <div style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      marginBottom: 6,
                    }}
                  >
                    <Mono size={9.5} color={T.text3}>
                      단단함
                    </Mono>
                    <span
                      style={{
                        fontFamily: T.mono,
                        fontSize: 11,
                        color: T.text2,
                        fontWeight: 600,
                      }}
                    >
                      {e.reinforced_strength}
                      <span style={{ color: T.text3 }}>%</span>
                    </span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      borderRadius: 2,
                      background: T.hair2,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${e.reinforced_strength}%`,
                        background: T.accent,
                        borderRadius: 2,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* 답변 카드 리스트 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {e.questions
                  .map((q) => ({
                    q,
                    a: (e.answers?.[q.id] || "").trim(),
                  }))
                  .filter((x) => x.a.length > 0)
                  .map(({ q, a }) => (
                    <div
                      key={q.id}
                      style={{
                        paddingLeft: 12,
                        borderLeft: `2px solid ${T.hair}`,
                      }}
                    >
                      <Mono size={9.5} color={T.text3} tracking={0.14}>
                        {CATEGORY_LABEL[q.category]}
                      </Mono>
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 14,
                          color: T.text,
                          lineHeight: 1.6,
                          letterSpacing: "-0.003em",
                          textWrap:
                            "pretty" as React.CSSProperties["textWrap"],
                        }}
                      >
                        {a}
                      </div>
                    </div>
                  ))}
                {(e.free_evidence || [])
                  .filter((s) => s && s.trim().length > 0)
                  .map((s, i) => (
                    <div
                      key={`free-${i}`}
                      style={{
                        paddingLeft: 12,
                        borderLeft: `2px solid ${T.hair}`,
                      }}
                    >
                      <Mono size={9.5} color={T.text3} tracking={0.14}>
                        자유 근거
                      </Mono>
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 14,
                          color: T.text,
                          lineHeight: 1.6,
                          letterSpacing: "-0.003em",
                          textWrap:
                            "pretty" as React.CSSProperties["textWrap"],
                        }}
                      >
                        {s}
                      </div>
                    </div>
                  ))}
              </div>
            </SectionCard>
          ))}
      </div>

      {error && (
        <p
          style={{
            marginTop: 20,
            fontSize: 13,
            color: "#C82027",
            textAlign: "center",
          }}
        >
          {error}
        </p>
      )}

      <div
        style={{
          marginTop: 36,
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <button
          disabled={submitting}
          onClick={onContinue}
          style={{
            fontFamily: T.font,
            fontWeight: 600,
            fontSize: 16,
            background: T.ink,
            color: T.surface,
            border: "none",
            borderRadius: 999,
            padding: "15px 28px",
            cursor: submitting ? "not-allowed" : "pointer",
            opacity: submitting ? 0.6 : 1,
            letterSpacing: "-0.005em",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 8px 20px -8px rgba(0,0,0,0.3)",
          }}
        >
          <span>
            {submitting ? "저장 중…" : "전문 상담사 리포트 보기"}
          </span>
          {!submitting && (
            <span style={{ fontFamily: T.mono, fontSize: 14 }}>→</span>
          )}
        </button>
        {remainingSources.length > 0 && (
          <button
            onClick={onBackToSelect}
            style={{
              fontFamily: T.font,
              fontSize: 13,
              color: T.text3,
              background: "transparent",
              border: `1px solid ${T.hair}`,
              borderRadius: 999,
              padding: "10px 16px",
              cursor: "pointer",
            }}
          >
            ↺ 다른 신념도 더 채워볼게요
          </button>
        )}
      </div>

      <div style={{ height: 100 }} />
    </section>
  );
}
