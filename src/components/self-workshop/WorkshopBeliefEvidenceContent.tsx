"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
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
import {
  type BeliefNarrative,
  type BeliefNarrativeReport,
  isBeliefNarrativeReport,
} from "@/lib/self-workshop/belief-narrative-report";
import { COL as PAGE_COL, TS } from "@/components/self-workshop/clinical-report/v3-shared";

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

/** Step 3 자기보고에서 추출한 보호 루프 시각화용 스냅샷.
 *  AllDone의 PROTECTION LOOP 섹션이 이 데이터를 트리거→감정→보호 다이어그램으로 그린다. */
export interface MechanismSnapshotForRecap {
  situation: string;
  automatic_thought: string;
  emotion: string;
  behavior: string;
  emotion_words: string[];
  body_text: string;
  worst_case: string;
}

interface Props {
  workshopId: string;
  savedData?: Partial<CopingPlanV2> | null;
  /** Step 8 결과 — 신념·새 신념 본문의 source. 없으면 가드 표시. */
  newBelief: NewBeliefData | null;
  /** 다운스트림에서 사용 안 하지만 호환성 유지를 위해 받아둠 */
  beliefAnalysis: BeliefAnalysisInput | null;
  /** Step 3 자기보고 스냅샷 — AllDone의 PROTECTION LOOP 다이어그램 데이터 소스 */
  mechanism?: MechanismSnapshotForRecap;
  /** 사용자 이름 — Hero의 인사말에 사용 */
  userName?: string | null;
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
        } else {
          // 응답이 4개 미만 — 다음 effect 사이클에서 재시도 가능하도록 락 해제
          fetchKey.current = "";
        }
      } catch {
        // 네트워크/서버 실패 — 락을 풀어 다음 진입 시 재시도 가능하게.
        // 안 풀어주면 같은 (source, belief_text) 조합으로 영영 재호출이 막혀
        // QUESTIONS 영역이 무한 로딩에 갇힌다.
        fetchKey.current = "";
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
  /** AllDone에서 특정 신념 카드를 클릭해 수정 모드(writing)로 들어간다.
   *  selected_sources에 없는 source라도 자동 포함시켜 그 신념의 writing으로 진입.
   *  답변/근거/강도가 보존되어 있으므로 사용자는 그 위에서 자유롭게 수정 가능. */
  function editEntry(source: CoreBeliefSource) {
    update((d) => {
      const idx = d.entries.findIndex((e) => e.source === source);
      if (idx < 0) return d;
      const selected = d.selected_sources.includes(source)
        ? d.selected_sources
        : [...d.selected_sources, source];
      return {
        ...d,
        selected_sources: selected,
        current_idx: idx,
        phase: "writing",
      };
    });
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
      <div
        className="text-center"
        style={{ maxWidth: PAGE_COL + 96, margin: "0 auto", padding: "80px 48px" }}
      >
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
        maxWidth: PAGE_COL + 96,
        margin: "0 auto",
        padding: "0 48px",
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
          workshopId={props.workshopId}
          entries={data.entries}
          selectedSources={data.selected_sources}
          saveStatus={saveStatus}
          onBackToSelect={backToSelect}
          onEditEntry={editEntry}
          onContinue={goNextStage}
          submitting={submitting}
          error={error}
          mechanism={props.mechanism}
          userName={props.userName ?? null}
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
        @keyframes bev-spin {
          to {
            transform: rotate(360deg);
          }
        }
        .bev-spin {
          animation: bev-spin 1s linear infinite;
        }
        .bev-reveal {
          animation: bev-fade-up 0.45s cubic-bezier(0.2, 0.7, 0.2, 1) both;
        }
        @keyframes bev-loading-pulse {
          0%,
          100% {
            opacity: 0.55;
          }
          50% {
            opacity: 1;
          }
        }
        .bev-loading-pulse {
          animation: bev-loading-pulse 1.6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .bev-reveal,
          .bev-loading-pulse {
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
          fontSize: TS.h1,
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
          margin: "32px 0 0",
          fontSize: TS.body,
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
          fontSize: TS.h2,
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
          margin: "32px 0 0",
          fontSize: TS.body,
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
 * QuestionsLoadingStatus — 질문 LLM 응답을 기다리는 동안
 *   "어떤 작업을 하고 있는지" 3단계로 보여주는 felt-progress UI.
 *   각 단계 ~2.2초씩 진행 → 마지막 단계에서 멈추되 펄스가 계속 돌아
 *   "여전히 작업 중"임을 알린다. 새 신념으로 넘어갈 때 재마운트되어
 *   자연스럽게 1단계부터 다시 시작.
 * ────────────────────────────────────────────────────────── */
function QuestionsLoadingStatus() {
  const STEPS = [
    { current: "대체 신념을 파악하고 있어요", done: "대체 신념을 파악했어요" },
    { current: "작성된 답변을 분석 중이에요", done: "작성된 답변을 분석했어요" },
    { current: "질문을 생성 중이에요", done: "질문을 생성했어요" },
  ];
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step >= STEPS.length - 1) return;
    const id = setTimeout(() => setStep((s) => s + 1), 2200);
    return () => clearTimeout(id);
  }, [step, STEPS.length]);

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 10, padding: "4px 0" }}
      aria-live="polite"
      aria-label="질문을 만드는 중"
    >
      {STEPS.map((s, i) => {
        const status = i < step ? "done" : i === step ? "current" : "pending";
        const text = status === "done" ? s.done : s.current;
        const dotColor =
          status === "done" ? T.text3 : status === "current" ? T.accent : T.text4;
        const textColor =
          status === "done" ? T.text3 : status === "current" ? T.text : T.text4;
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13.5,
              lineHeight: 1.5,
              color: textColor,
              letterSpacing: "-0.003em",
            }}
            className={status === "current" ? "bev-loading-pulse" : undefined}
          >
            <span
              aria-hidden
              style={{
                width: 14,
                height: 14,
                borderRadius: 7,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                fontWeight: 700,
                border: status === "pending" ? `1.5px solid ${dotColor}` : "none",
                background:
                  status === "done" || status === "current" ? dotColor : "transparent",
                color: status === "done" || status === "current" ? T.surface : dotColor,
                flexShrink: 0,
              }}
            >
              {status === "done" ? "✓" : ""}
            </span>
            <span>
              {text}
              {status === "current" ? "…" : ""}
            </span>
          </div>
        );
      })}
    </div>
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
          <QuestionsLoadingStatus />
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
 * RECAP DESIGN — Belief Recap.html 핸드오프 기반 시각 재구현
 *   Hero · Old Belief & Origin · Protection Loop(다크) · New Belief(영웅) · Evidence · Path Forward
 *   각 섹션은 useTimeline 기반 자동 재생 (in-view 트리거 시 한 번 플레이).
 *   기존 5단계 BeliefNarrative 데이터를 그대로 소비하므로 API/스키마 변경 없음.
 *   Protection Loop는 Step 3 mechanism_analysis 스냅샷을 워크북당 1회만 그림.
 * ────────────────────────────────────────────────────────── */
const RECAP_COL = 760;

/* Recap 페이지 최상단 Hero 카피 — LLM이 아니라 하드코딩.
 *   "지금까지 살펴봤다 / 정리해보겠다"는 톤만 유지하면 되는 인트로 영역이라
 *   사용자별로 다를 필요가 없고, 매번 LLM에 맡기지 않는 편이 비용·일관성 모두 유리하다.
 *   per-belief 스테이지(Old/Origin/Bridge/New/Evidence) 본문은 그대로 LLM 생성. */
const RECAP_HERO_HEADLINE = "지금까지 함께 본 마음의 길을 정리해볼게요";
const RECAP_HERO_INTRO =
  "옛 신념이 어디서 자라났고 어떻게 자기 자신을 지켜왔는지, 그리고 이미 마음 한편에 자리 잡고 있던 새로운 가능성까지 — 한 마음의 어제와 오늘을 함께 살펴봤습니다. 여기서는 그 흐름을 한 자리에 모아, 차분히 다시 짚어봅니다.";

function recapClamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
function recapLerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function recapSmoothstep(a: number, b: number, t: number) {
  const x = recapClamp((t - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
}

/** in-view 트리거 — 한 번 보이면 그대로 true 유지 (다시 안 사라짐) */
function useInViewOnce(threshold = 0.2) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen] as const;
}

/** 0..1 타임라인 — play=true 가 되면 dur(ms) 동안 raf 진행 */
function useRecapTimeline(play: boolean, dur = 2400, delay = 0) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!play) return;
    let raf: number | null = null;
    const begin = performance.now() + delay;
    function tick(now: number) {
      if (now < begin) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const k = recapClamp((now - begin) / dur, 0, 1);
      setT(k);
      if (k < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [play, dur, delay]);
  return t;
}

function RecapReveal({
  children,
  delay = 0,
  y = 14,
  dur = 700,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  dur?: number;
}) {
  const [ref, seen] = useInViewOnce(0.15);
  return (
    <div
      ref={ref}
      style={{
        opacity: seen ? 1 : 0,
        transform: seen ? "translateY(0)" : `translateY(${y}px)`,
        transition: `opacity ${dur}ms cubic-bezier(.2,.7,.2,1) ${delay}ms, transform ${dur}ms cubic-bezier(.2,.7,.2,1) ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

/** 단어 단위 슬라이드-업 리빌. 한국어/영어 모두 자연 줄바꿈. */
function RecapWordsReveal({
  text,
  delay = 0,
  size = 56,
  weight = 800,
  color,
  lh = 1.12,
  ls = "-0.03em",
}: {
  text: string;
  delay?: number;
  size?: number;
  weight?: number;
  color?: string;
  lh?: number;
  ls?: string;
}) {
  const [ref, seen] = useInViewOnce(0.2);
  const words = text.split(" ");
  return (
    <h2
      ref={ref}
      style={{
        margin: 0,
        fontFamily: T.font,
        fontWeight: weight,
        fontSize: size,
        lineHeight: lh,
        letterSpacing: ls,
        color: color ?? T.ink,
        textWrap: "balance" as React.CSSProperties["textWrap"],
      }}
    >
      {words.map((w, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            overflow: "hidden",
            verticalAlign: "top",
          }}
        >
          <span
            style={{
              display: "inline-block",
              transform: seen ? "translateY(0)" : "translateY(110%)",
              opacity: seen ? 1 : 0,
              transition: `transform 900ms cubic-bezier(.2,.8,.2,1) ${
                delay + i * 70
              }ms, opacity 600ms ease ${delay + i * 70}ms`,
              willChange: "transform, opacity",
            }}
          >
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        </span>
      ))}
    </h2>
  );
}

/* ──── Hero — overall_headline + overall_intro ──── */
function RecapHero({
  overallHeadline,
  overallIntro,
  userName,
  beliefCount,
}: {
  overallHeadline: string;
  overallIntro: string;
  userName: string | null;
  beliefCount: number;
}) {
  return (
    <section
      style={{
        maxWidth: RECAP_COL + 80,
        margin: "0 auto",
        padding: "72px 40px 48px",
      }}
    >
      <RecapReveal>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 28,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: 4,
              background: T.accent,
              boxShadow: `0 0 0 6px ${T.accentSoft}`,
            }}
          />
          <Mono size={11} color={T.accent} tracking={0.18}>
            STAGE COMPLETE · RESHAPE
          </Mono>
          <div
            style={{
              flex: 1,
              minWidth: 80,
              height: 1,
              background: T.hair,
            }}
          />
          <Mono size={10} color={T.text3} tracking={0.14}>
            RECAP · BELIEF SHIFT
          </Mono>
        </div>
      </RecapReveal>

      <RecapWordsReveal text={overallHeadline} size={54} lh={1.12} />

      {overallIntro && (
        <RecapReveal delay={500}>
          <p
            style={{
              margin: "26px 0 0",
              fontSize: 17,
              lineHeight: 1.7,
              color: T.text2,
              letterSpacing: "-0.005em",
              textWrap: "pretty" as React.CSSProperties["textWrap"],
              whiteSpace: "pre-line",
            }}
          >
            {overallIntro}
          </p>
        </RecapReveal>
      )}

      <RecapReveal delay={700}>
        <div
          style={{
            marginTop: 48,
            display: "flex",
            alignItems: "center",
            gap: 16,
            paddingTop: 24,
            borderTop: `1px solid ${T.hair}`,
            flexWrap: "wrap",
          }}
        >
          <Mono size={10} color={T.text3} tracking={0.18}>
            {userName ? `${userName}님 · ` : ""}
            {beliefCount > 0 ? `${beliefCount}개 신념 정리` : "신념 정리"}
          </Mono>
          <div
            style={{
              flex: 1,
              minWidth: 60,
              height: 1,
              background: `repeating-linear-gradient(90deg, ${T.text4} 0 4px, transparent 4px 8px)`,
            }}
          />
          <Mono size={10} color={T.text3} tracking={0.18}>
            ↓
          </Mono>
        </div>
      </RecapReveal>
    </section>
  );
}

/* ──── Old Belief + Origin ──── */
function RecapOldBelief({
  index,
  classificationLabel,
  stage1,
  stage2,
}: {
  index: number;
  classificationLabel: string;
  stage1: BeliefNarrative["stage1_old_belief"];
  stage2: BeliefNarrative["stage2_origin"];
}) {
  const idx = String(index).padStart(2, "0");
  const [refOrigin, seenOrigin] = useInViewOnce(0.2);
  const t = useRecapTimeline(seenOrigin, 2400);
  const beliefP = recapSmoothstep(0.55, 1.0, t);
  const introP = recapSmoothstep(0, 0.45, t);

  return (
    <section
      style={{
        maxWidth: RECAP_COL + 80,
        margin: "0 auto",
        padding: "56px 40px 32px",
      }}
    >
      <RecapReveal>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Mono size={10} color={T.text3} tracking={0.18}>
            BELIEF {idx} · {classificationLabel}
          </Mono>
          <div
            style={{ flex: 1, minWidth: 60, height: 1, background: T.hair }}
          />
        </div>
      </RecapReveal>

      <RecapReveal delay={120}>
        <div style={{ marginTop: 28 }}>
          <Mono size={10} color={T.text3} tracking={0.18}>
            STAGE 01 · OLD BELIEF
          </Mono>
        </div>
      </RecapReveal>

      <RecapReveal delay={180}>
        <h2
          style={{
            margin: "12px 0 0",
            fontFamily: T.font,
            fontWeight: 800,
            fontSize: 38,
            lineHeight: 1.16,
            letterSpacing: "-0.028em",
            color: T.ink,
            textWrap: "balance" as React.CSSProperties["textWrap"],
          }}
        >
          {stage1.headline}
        </h2>
      </RecapReveal>

      <RecapReveal delay={260}>
        <div
          style={{
            marginTop: 22,
            paddingLeft: 18,
            borderLeft: `2px solid ${T.ink}`,
          }}
        >
          <div
            style={{
              fontFamily: T.font,
              fontStyle: "italic",
              fontSize: 18,
              fontWeight: 500,
              color: T.ink,
              lineHeight: 1.5,
              letterSpacing: "-0.01em",
              whiteSpace: "pre-line",
            }}
          >
            “{stage1.quote}”
          </div>
        </div>
      </RecapReveal>

      <RecapReveal delay={340}>
        <p
          style={{
            margin: "20px 0 0",
            fontSize: 16,
            lineHeight: 1.75,
            color: T.text2,
            letterSpacing: "-0.003em",
            textWrap: "pretty" as React.CSSProperties["textWrap"],
            whiteSpace: "pre-line",
          }}
        >
          {stage1.body}
        </p>
      </RecapReveal>

      {/* STAGE 02 — origin narrative + dark crystallized card */}
      <div ref={refOrigin} style={{ marginTop: 64 }}>
        <RecapReveal>
          <Mono size={10} color={T.text3} tracking={0.18}>
            STAGE 02 · HOW IT WAS FORMED
          </Mono>
        </RecapReveal>
        <RecapReveal delay={120}>
          <h3
            style={{
              margin: "14px 0 0",
              fontFamily: T.font,
              fontWeight: 700,
              fontSize: 28,
              lineHeight: 1.25,
              letterSpacing: "-0.022em",
              color: T.ink,
              textWrap: "balance" as React.CSSProperties["textWrap"],
            }}
          >
            {stage2.headline}
          </h3>
        </RecapReveal>
        <p
          style={{
            margin: "16px 0 0",
            fontSize: 15.5,
            lineHeight: 1.75,
            color: T.text2,
            letterSpacing: "-0.003em",
            textWrap: "pretty" as React.CSSProperties["textWrap"],
            whiteSpace: "pre-line",
            opacity: introP,
            transform: `translateY(${(1 - introP) * 8}px)`,
            transition: "none",
          }}
        >
          {stage2.body}
        </p>

        <div
          style={{
            marginTop: 32,
            padding: "22px 22px 28px",
            background: `linear-gradient(180deg, ${T.surface} 0%, ${T.surface2} 100%)`,
            borderRadius: 18,
            border: `1px solid ${T.hair2}`,
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              background: T.accentTint,
              borderRadius: 10,
              borderLeft: `3px solid ${T.accent}`,
              fontSize: 14.5,
              fontWeight: 500,
              color: T.ink,
              lineHeight: 1.65,
              letterSpacing: "-0.005em",
              fontStyle: "italic",
            }}
          >
            {stage2.highlight}
          </div>

          <div
            style={{
              marginTop: 22,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Mono size={9.5} color={T.text3} tracking={0.16}>
              ↓ 그래서 굳어진 신념
            </Mono>
            <div
              style={{
                width: "100%",
                padding: "20px 22px",
                background: T.ink,
                color: T.surface,
                borderRadius: 14,
                boxShadow: "0 30px 60px -30px rgba(10,10,11,0.55)",
                opacity: beliefP,
                transform: `translateY(${(1 - beliefP) * 14}px) scale(${recapLerp(
                  0.97,
                  1,
                  beliefP
                )})`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    background: T.accent,
                    boxShadow: `0 0 0 4px rgba(255,90,31,0.18)`,
                  }}
                />
                <Mono size={9.5} color={T.accent} tracking={0.18}>
                  CORE BELIEF · CRYSTALLIZED
                </Mono>
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontFamily: T.font,
                  fontWeight: 700,
                  fontSize: 19,
                  lineHeight: 1.45,
                  letterSpacing: "-0.014em",
                  textWrap: "balance" as React.CSSProperties["textWrap"],
                  whiteSpace: "pre-line",
                }}
              >
                “{stage1.quote}”
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──── Bridge — Protection Loop (dark) ──── */
function RecapBridge({
  mechanism,
  userName,
}: {
  mechanism: MechanismSnapshotForRecap;
  userName: string | null;
}) {
  const [ref, seen] = useInViewOnce(0.25);
  const t = useRecapTimeline(seen, 2800);
  const nodeP = (i: number) =>
    recapSmoothstep(i * 0.22, 0.3 + i * 0.22, t);
  const arrowP = (i: number) =>
    recapSmoothstep(0.18 + i * 0.22, 0.36 + i * 0.22, t);

  // 트리거 — 상황(있으면) → 자동사고 백업
  const triggerBody =
    (mechanism.situation && mechanism.situation.trim()) ||
    (mechanism.automatic_thought && mechanism.automatic_thought.trim()) ||
    "성과를 내지 못할 것 같은 조짐이 보일 때.";
  const triggerTitle = "이런 순간이 오면";

  // 감정 — 단어가 있으면 단어들로, 없으면 폴백
  const emotionTitle =
    mechanism.emotion_words.length > 0
      ? mechanism.emotion_words.slice(0, 3).join(" · ")
      : "두렵고 불안함";
  const emotionBody =
    (mechanism.body_text && mechanism.body_text.trim()) ||
    (mechanism.worst_case && mechanism.worst_case.trim()) ||
    "“내 가치가 사라지는 건 아닐까” 하는 깊은 불안이 올라옵니다.";

  // 보호 — 결과 행동
  const protectionTitle = "그래서 이렇게 자기를 지킵니다";
  const protectionBody =
    (mechanism.behavior && mechanism.behavior.trim()) ||
    "불안으로부터 스스로를 지키기 위해, 더 결과에 매달리게 됩니다.";

  const FLOW = [
    { tag: "TRIGGER", title: triggerTitle, body: triggerBody },
    { tag: "EMOTION", title: emotionTitle, body: emotionBody },
    {
      tag: "PROTECTION",
      title: protectionTitle,
      body: protectionBody,
    },
  ];

  const nodeColors = [
    { dot: "#9CA3AF", ring: "rgba(255,255,255,0.10)" },
    { dot: T.accent, ring: "rgba(255,90,31,0.18)" },
    { dot: "#FFFFFF", ring: "rgba(255,255,255,0.16)" },
  ];

  return (
    <section
      style={{
        background: "#0A0A0B",
        color: T.surface,
        padding: "84px 0",
        marginTop: 32,
      }}
    >
      <div
        style={{
          maxWidth: RECAP_COL + 80,
          margin: "0 auto",
          padding: "0 40px",
          position: "relative",
        }}
      >
        <RecapReveal>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 24,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: 3,
                background: T.accent,
              }}
            />
            <Mono size={10} color={T.accent} tracking={0.18}>
              STAGE 03 · PROTECTION LOOP
            </Mono>
            <div
              style={{
                flex: 1,
                minWidth: 60,
                height: 1,
                background: "rgba(255,255,255,0.1)",
              }}
            />
          </div>
        </RecapReveal>

        <RecapReveal delay={150}>
          <div style={{ maxWidth: 760, marginBottom: 48 }}>
            <div
              style={{
                fontFamily: T.font,
                fontWeight: 600,
                fontSize: 22,
                lineHeight: 1.5,
                letterSpacing: "-0.018em",
                color: T.surface,
                textWrap: "balance" as React.CSSProperties["textWrap"],
              }}
            >
              <span style={{ color: "rgba(255,255,255,0.55)" }}>
                {userName ? `${userName}님,` : "이 신념"} 옛 신념이 만들어지자,
                자신을 지키기 위해 다음과 같은 보호 회로가 매번 자동으로
                돌아갔어요.{" "}
              </span>
              <span style={{ color: T.surface, fontWeight: 700 }}>
                결과에 집중하는 것은 이 불안으로부터 스스로를 지키려는 가장
                합리적인 방법이었습니다.
              </span>
            </div>
          </div>
        </RecapReveal>

        <div
          ref={ref}
          style={{
            position: "relative",
            padding: "44px 28px 36px",
            background:
              "radial-gradient(ellipse 700px 420px at 50% 55%, rgba(255,90,31,0.16) 0%, transparent 70%)",
            borderRadius: 18,
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0,
            }}
          >
            {FLOW.map((node, i) => (
              <React.Fragment key={i}>
                <div
                  style={{
                    width: "100%",
                    maxWidth: 520,
                    opacity: nodeP(i),
                    transform: `translateY(${
                      (1 - nodeP(i)) * 16
                    }px) scale(${recapLerp(0.96, 1, nodeP(i))})`,
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      padding: "18px 22px",
                      background:
                        i === FLOW.length - 1
                          ? "rgba(255,255,255,0.95)"
                          : "rgba(255,255,255,0.05)",
                      color: i === FLOW.length - 1 ? T.ink : T.surface,
                      border:
                        i === FLOW.length - 1
                          ? "1.5px solid rgba(255,255,255,0.95)"
                          : i === 1
                          ? "1px solid rgba(255,90,31,0.5)"
                          : "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 14,
                      boxShadow:
                        i === FLOW.length - 1
                          ? "0 0 60px -10px rgba(255,255,255,0.25), 0 20px 40px -20px rgba(0,0,0,0.5)"
                          : i === 1
                          ? "0 0 50px -16px rgba(255,90,31,0.55)"
                          : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          background: nodeColors[i].dot,
                          boxShadow: `0 0 0 4px ${nodeColors[i].ring}`,
                        }}
                      />
                      <Mono
                        size={9.5}
                        tracking={0.18}
                        color={
                          i === FLOW.length - 1
                            ? T.text2
                            : i === 1
                            ? T.accent
                            : "rgba(255,255,255,0.55)"
                        }
                      >
                        STEP {String(i + 1).padStart(2, "0")} · {node.tag}
                      </Mono>
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        fontFamily: T.font,
                        fontWeight: 700,
                        fontSize: 19,
                        lineHeight: 1.4,
                        letterSpacing: "-0.014em",
                        textWrap: "balance" as React.CSSProperties["textWrap"],
                      }}
                    >
                      {node.title}
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 14,
                        lineHeight: 1.6,
                        color:
                          i === FLOW.length - 1
                            ? T.text2
                            : "rgba(255,255,255,0.65)",
                        letterSpacing: "-0.003em",
                        textWrap: "pretty" as React.CSSProperties["textWrap"],
                        whiteSpace: "pre-line",
                      }}
                    >
                      {node.body}
                    </div>
                  </div>
                </div>

                {i < FLOW.length - 1 && (
                  <div
                    style={{
                      position: "relative",
                      height: 56,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: arrowP(i),
                    }}
                  >
                    <svg
                      width="20"
                      height="56"
                      viewBox="0 0 20 56"
                      style={{ overflow: "visible" }}
                    >
                      <defs>
                        <linearGradient
                          id={`bev-recap-arrow-${i}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="rgba(255,255,255,0.25)"
                          />
                          <stop offset="100%" stopColor={T.accent} />
                        </linearGradient>
                      </defs>
                      <line
                        x1="10"
                        y1="0"
                        x2="10"
                        y2={6 + arrowP(i) * 36}
                        stroke={`url(#bev-recap-arrow-${i})`}
                        strokeWidth="1.5"
                      />
                      <polygon
                        points={`10,${48 + arrowP(i) * 4} 4,${
                          38 + arrowP(i) * 4
                        } 16,${38 + arrowP(i) * 4}`}
                        fill={T.accent}
                        opacity={arrowP(i) > 0.7 ? 1 : 0}
                      />
                    </svg>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──── New Core Belief — hero centerpiece with orbital rings ──── */
function RecapNewBelief({
  stage3,
  reinforcedStrength,
}: {
  stage3: BeliefNarrative["stage3_new_belief"];
  reinforcedStrength: number;
}) {
  const [ref, seen] = useInViewOnce(0.15);
  const t = useRecapTimeline(seen, 4000);
  const tagP = recapSmoothstep(0, 0.15, t);
  const wordsP = recapSmoothstep(0.1, 0.55, t);
  const descP = recapSmoothstep(0.55, 0.78, t);
  const strP = recapSmoothstep(0.65, 0.95, t);
  const ringP = recapSmoothstep(0.05, 0.45, t);

  const strengthVal = Math.round(strP * reinforcedStrength);

  return (
    <section
      ref={ref}
      style={{
        position: "relative",
        overflow: "hidden",
        background: `radial-gradient(ellipse 900px 560px at 50% 38%, ${T.accentTint} 0%, ${T.surface} 70%)`,
        padding: "112px 0 96px",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "50%",
          top: "34%",
          width: 720,
          height: 720,
          marginLeft: -360,
          marginTop: -360,
          pointerEvents: "none",
        }}
      >
        {[0, 1, 2].map((i) => {
          const size = 320 + i * 150;
          const rp = recapSmoothstep(0.05 + i * 0.08, 0.45 + i * 0.08, t);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: size,
                height: size,
                marginLeft: -size / 2,
                marginTop: -size / 2,
                border: `1px dashed ${
                  i === 0 ? "rgba(255,90,31,0.35)" : "rgba(255,90,31,0.15)"
                }`,
                borderRadius: "50%",
                opacity: rp * (1 - i * 0.25),
                transform: `scale(${recapLerp(0.85, 1, rp)}) rotate(${
                  rp * 30 + i * 15
                }deg)`,
              }}
            />
          );
        })}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 480,
            height: 480,
            marginLeft: -240,
            marginTop: -240,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,90,31,0.18) 0%, transparent 65%)",
            opacity: ringP,
            filter: "blur(12px)",
          }}
        />
      </div>

      <div
        style={{
          position: "relative",
          maxWidth: RECAP_COL + 80,
          margin: "0 auto",
          padding: "0 40px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            opacity: tagP,
            transform: `translateY(${(1 - tagP) * 8}px)`,
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 14px",
              borderRadius: 999,
              background: T.surface,
              border: `1px solid ${T.accent}`,
              boxShadow: "0 8px 22px -10px rgba(255,90,31,0.4)",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: 3,
                background: T.accent,
                boxShadow: `0 0 0 4px ${T.accentSoft}`,
              }}
            />
            <Mono size={10} color={T.accent} tracking={0.2}>
              STAGE 04 · NEW CORE BELIEF
            </Mono>
          </span>
        </div>

        <RecapReveal delay={150}>
          <div
            style={{
              marginTop: 22,
              fontFamily: T.font,
              fontWeight: 700,
              fontSize: 22,
              color: T.ink,
              letterSpacing: "-0.018em",
              lineHeight: 1.4,
              textWrap: "balance" as React.CSSProperties["textWrap"],
              maxWidth: 580,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {stage3.headline}
          </div>
        </RecapReveal>

        <h2
          style={{
            margin: "32px auto 0",
            maxWidth: 920,
            fontFamily: T.font,
            fontWeight: 800,
            fontSize: "clamp(32px, 5vw, 56px)",
            lineHeight: 1.18,
            letterSpacing: "-0.034em",
            color: T.ink,
            textWrap: "balance" as React.CSSProperties["textWrap"],
            opacity: recapLerp(0.08, 1, wordsP),
            WebkitMaskImage: `linear-gradient(105deg, #000 ${
              wordsP * 120 - 20
            }%, rgba(0,0,0,0.08) ${wordsP * 120}%, rgba(0,0,0,0.08) 100%)`,
            maskImage: `linear-gradient(105deg, #000 ${
              wordsP * 120 - 20
            }%, rgba(0,0,0,0.08) ${wordsP * 120}%, rgba(0,0,0,0.08) 100%)`,
            filter: `blur(${(1 - wordsP) * 1.5}px)`,
            transform: `translateY(${(1 - wordsP) * 8}px)`,
            whiteSpace: "pre-line",
          }}
        >
          <span
            style={{
              color: T.accent,
              fontFamily: T.mono,
              fontWeight: 600,
              fontSize: "0.45em",
              verticalAlign: "top",
              marginRight: 8,
            }}
          >
            “
          </span>
          {stage3.new_belief_quote}
          <span
            style={{
              color: T.accent,
              fontFamily: T.mono,
              fontWeight: 600,
              fontSize: "0.45em",
              verticalAlign: "top",
              marginLeft: 4,
            }}
          >
            ”
          </span>
        </h2>

        <div
          style={{
            margin: "28px auto 0",
            height: 1,
            background: T.hair,
            width: `${wordsP * 100}%`,
            maxWidth: 480,
          }}
        />

        <p
          style={{
            margin: "26px auto 0",
            maxWidth: 580,
            fontSize: 16,
            lineHeight: 1.75,
            color: T.text2,
            letterSpacing: "-0.003em",
            textWrap: "pretty" as React.CSSProperties["textWrap"],
            whiteSpace: "pre-line",
            opacity: descP,
            transform: `translateY(${(1 - descP) * 8}px)`,
          }}
        >
          {stage3.body}
        </p>

        <div
          style={{
            margin: "44px auto 0",
            maxWidth: 480,
            padding: "18px 22px",
            background: T.surface,
            border: `1px solid ${T.hair}`,
            borderRadius: 16,
            boxShadow: "0 30px 60px -30px rgba(0,0,0,0.15)",
            opacity: strP,
            transform: `translateY(${(1 - strP) * 12}px) scale(${recapLerp(
              0.96,
              1,
              strP
            )})`,
            textAlign: "left",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: 14,
            }}
          >
            <Mono size={10} color={T.text3} tracking={0.16}>
              BELIEF STRENGTH
            </Mono>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 4,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: T.mono,
                  fontWeight: 700,
                  fontSize: 28,
                  color: T.accent,
                  letterSpacing: "-0.025em",
                  lineHeight: 1,
                }}
              >
                {strengthVal}
              </span>
              <span
                style={{
                  fontFamily: T.mono,
                  fontSize: 13,
                  color: T.text3,
                }}
              >
                %
              </span>
            </div>
          </div>
          <div
            style={{
              height: 4,
              borderRadius: 2,
              background: T.hair2,
              overflow: "hidden",
              marginBottom: 12,
            }}
          >
            <div
              style={{
                width: `${strP * reinforcedStrength}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${T.accent}, #FF8A4F)`,
                borderRadius: 2,
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              fontFamily: T.mono,
              fontSize: 9.5,
              color: T.text3,
              letterSpacing: "0.06em",
            }}
          >
            <span>지금 이 순간의 믿음 강도</span>
            <span style={{ flexShrink: 0 }}>
              {reinforcedStrength >= 50 ? "안정적 시작점" : "연습으로 자라남"}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ──── Evidence cards ──── */
function RecapEvidence({
  stage4,
}: {
  stage4: BeliefNarrative["stage4_evidence_support"];
}) {
  if (
    stage4.quoted_evidences.length === 0 &&
    !stage4.body.trim() &&
    !stage4.headline.trim()
  ) {
    return null;
  }
  return (
    <section
      style={{
        maxWidth: RECAP_COL + 80,
        margin: "0 auto",
        padding: "72px 40px 32px",
      }}
    >
      <RecapReveal>
        <Mono size={10} color={T.text3} tracking={0.18}>
          STAGE 05 · YOUR EVIDENCE
        </Mono>
      </RecapReveal>
      <RecapReveal delay={120}>
        <h3
          style={{
            margin: "14px 0 0",
            fontFamily: T.font,
            fontWeight: 700,
            fontSize: 28,
            lineHeight: 1.25,
            letterSpacing: "-0.022em",
            color: T.ink,
            textWrap: "balance" as React.CSSProperties["textWrap"],
          }}
        >
          {stage4.headline}
        </h3>
      </RecapReveal>
      {stage4.body && (
        <RecapReveal delay={220}>
          <p
            style={{
              margin: "16px 0 0",
              fontSize: 15.5,
              lineHeight: 1.75,
              color: T.text2,
              letterSpacing: "-0.003em",
              textWrap: "pretty" as React.CSSProperties["textWrap"],
              whiteSpace: "pre-line",
            }}
          >
            {stage4.body}
          </p>
        </RecapReveal>
      )}
      {stage4.quoted_evidences.length > 0 && (
        <div
          style={{
            marginTop: 26,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {stage4.quoted_evidences.map((q, i) => (
            <RecapReveal key={i} delay={120 + 80 * i}>
              <div
                style={{
                  padding: "16px 20px",
                  background: T.surface,
                  border: `1px solid ${T.hair}`,
                  borderRadius: 12,
                  boxShadow: "0 8px 24px -18px rgba(0,0,0,0.18)",
                }}
              >
                <Mono size={9.5} color={T.text3} tracking={0.16}>
                  YOUR WORDS · {String(i + 1).padStart(2, "0")}
                </Mono>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 15,
                    lineHeight: 1.65,
                    color: T.text,
                    letterSpacing: "-0.003em",
                    textWrap: "pretty" as React.CSSProperties["textWrap"],
                    whiteSpace: "pre-line",
                  }}
                >
                  “{q}”
                </div>
              </div>
            </RecapReveal>
          ))}
        </div>
      )}
    </section>
  );
}

/* ──── (사용자 요청으로 STAGE 06 PATH FORWARD 영역 제거 — 게이지/마무리 인용/CTA 비노출.
 *   stage5_path_forward 데이터는 narrative 캐시에 그대로 남지만 UI에는 그리지 않음.
 *   각 신념 끝 "BELIEF RECAP COMPLETE · ✎ 수정하기" 줄은 RecapBeliefSection 안으로 이전했음.) */

/* ──── 한 신념의 전체 리캡 묶음 (Old + Origin / Bridge / New / Evidence + 마무리 줄) ──── */
function RecapBeliefSection({
  index,
  narrative,
  reinforcedStrength,
  mechanism,
  userName,
  onEdit,
  isFirst,
}: {
  index: number;
  narrative: BeliefNarrative;
  reinforcedStrength: number;
  mechanism: MechanismSnapshotForRecap | undefined;
  userName: string | null;
  onEdit: () => void;
  isFirst: boolean;
}) {
  const meta = SOURCE_META[narrative.source];
  const classificationLabel =
    meta?.classification_en ||
    narrative.classification_en ||
    narrative.source.toUpperCase();

  // Bridge는 mechanism 데이터가 풍부할 때만, 그리고 첫 신념에서만 1회 그림
  const showBridge =
    isFirst &&
    !!mechanism &&
    (mechanism.situation.trim().length > 0 ||
      mechanism.behavior.trim().length > 0 ||
      mechanism.emotion_words.length > 0);

  return (
    <article>
      <RecapOldBelief
        index={index}
        classificationLabel={classificationLabel}
        stage1={narrative.stage1_old_belief}
        stage2={narrative.stage2_origin}
      />
      {showBridge && mechanism && (
        <RecapBridge mechanism={mechanism} userName={userName} />
      )}
      <RecapNewBelief
        stage3={narrative.stage3_new_belief}
        reinforcedStrength={reinforcedStrength}
      />
      <RecapEvidence stage4={narrative.stage4_evidence_support} />

      {/* belief 마무리 줄 — 이 신념 수정 버튼만 남기고 PATH FORWARD 본문은 노출하지 않음 */}
      <section
        style={{
          maxWidth: RECAP_COL + 80,
          margin: "0 auto",
          padding: "40px 40px 24px",
        }}
      >
        <RecapReveal>
          <div
            style={{
              paddingTop: 22,
              borderTop: `1px solid ${T.hair}`,
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
              justifyContent: "space-between",
            }}
          >
            <Mono size={10} color={T.text3} tracking={0.16}>
              BELIEF RECAP COMPLETE
            </Mono>
            <button
              onClick={onEdit}
              style={{
                fontFamily: T.font,
                fontWeight: 500,
                fontSize: 13,
                color: T.text2,
                background: "transparent",
                border: `1px solid ${T.hair}`,
                borderRadius: 999,
                padding: "9px 16px",
                cursor: "pointer",
                letterSpacing: "-0.005em",
              }}
            >
              ✎ 이 신념 수정하기
            </button>
          </div>
        </RecapReveal>
      </section>
    </article>
  );
}

/* ──────────────────────────────────────────────────────────
 * AllDone — 5단계 상담사 narrative 리포트 + Step 10 CTA
 *   AllDone 진입 시 /api/self-workshop/belief-narrative-report 를 호출해
 *   coping_plan.narrative_report 캐시(또는 새 LLM 응답)를 받아 그린다.
 *   사용자가 ✎수정하기 후 entries가 바뀌면 isStale 배너가 뜨고,
 *   ↻다시 만들기 클릭 시에만 LLM 재호출(force).
 *   리포트 본문은 RecapBeliefSection (Belief Recap.html 핸드오프 디자인) 사용.
 * ────────────────────────────────────────────────────────── */
const NARRATIVE_LOADING_MESSAGES = [
  "지난 90분의 자기보고를 다시 읽고 있어요…",
  "옛 신념이 너를 어떻게 지켜왔는지 정리하고 있어요…",
  "새 신념이 원래 어디 있었는지 찾고 있어요…",
  "네가 적은 근거들을 narrative로 엮고 있어요…",
  "마지막으로 상담사 관점으로 다듬는 중이에요…",
];
const NARRATIVE_LOADING_INTERVAL_MS = 4000;

function AllDone({
  workshopId,
  entries,
  selectedSources,
  saveStatus,
  onBackToSelect,
  onEditEntry,
  onContinue,
  submitting,
  error,
  mechanism,
  userName,
}: {
  workshopId: string;
  entries: BeliefEvidenceEntry[];
  selectedSources: CoreBeliefSource[];
  saveStatus: "idle" | "saving" | "saved";
  onBackToSelect: () => void;
  onEditEntry: (source: CoreBeliefSource) => void;
  onContinue: () => void;
  submitting: boolean;
  error: string;
  mechanism?: MechanismSnapshotForRecap;
  userName: string | null;
}) {
  const completed = entries.filter(
    (e) => selectedSources.includes(e.source) && isEntryComplete(e)
  );
  const remainingSources = entries
    .filter((e) => !selectedSources.includes(e.source))
    .map((e) => e.source);

  const hasCompletedEntries = completed.length > 0;

  // narrative 리포트 상태
  const [report, setReport] = useState<BeliefNarrativeReport | null>(null);
  const [loading, setLoading] = useState(hasCompletedEntries);
  const [isStale, setIsStale] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [reportError, setReportError] = useState("");
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  // 로딩 메시지 시퀀스 — WorkshopCognitiveReport 패턴 차용
  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => {
      setLoadingMessageIndex((i) =>
        Math.min(i + 1, NARRATIVE_LOADING_MESSAGES.length - 1)
      );
    }, NARRATIVE_LOADING_INTERVAL_MS);
    return () => clearInterval(id);
  }, [loading]);

  // narrative fetch — saveStatus가 saved/idle 일 때만 (마지막 debounced save 반영 후)
  const fetchNarrative = useCallback(
    async (force: boolean) => {
      setLoading(true);
      setLoadingMessageIndex(0);
      setReportError("");
      try {
        const res = await fetch(
          "/api/self-workshop/belief-narrative-report",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workshopId, force }),
          }
        );
        const json = await res.json();
        if (!res.ok) {
          throw new Error(
            (json && typeof json.error === "string"
              ? json.error
              : "리포트 생성에 실패했어요") as string
          );
        }
        if (!isBeliefNarrativeReport(json.report)) {
          throw new Error("리포트 형식이 올바르지 않아요");
        }
        setReport(json.report);
        setIsStale(json.isStale === true);
      } catch (err) {
        setReportError(
          err instanceof Error ? err.message : "오류가 발생했어요"
        );
      } finally {
        setLoading(false);
        setRegenerating(false);
      }
    },
    [workshopId]
  );

  // 첫 진입 자동 fetch (완료된 entry가 1개 이상일 때만)
  // saveStatus가 "saving"이면 마지막 entry의 저장이 끝나길 기다림 — race 방지
  const didFetch = useRef(false);
  useEffect(() => {
    if (!hasCompletedEntries) {
      setLoading(false);
      return;
    }
    if (didFetch.current) return;
    if (saveStatus === "saving") return; // 마지막 저장 끝날 때까지 대기
    didFetch.current = true;
    void fetchNarrative(false);
  }, [hasCompletedEntries, saveStatus, fetchNarrative]);

  function handleRegenerate() {
    setRegenerating(true);
    void fetchNarrative(true);
  }

  /* ───── 가드 1: 완료된 신념 0개 — 폴백 ───── */
  if (!hasCompletedEntries) {
    return (
      <NarrativeFallback
        entries={entries}
        selectedSources={selectedSources}
        remainingSources={remainingSources}
        submitting={submitting}
        error={error}
        onBackToSelect={onBackToSelect}
        onContinue={onContinue}
      />
    );
  }

  /* ───── 가드 2: 로딩 ───── */
  if (loading && !report) {
    return (
      <NarrativeLoading
        messageIndex={loadingMessageIndex}
        regenerating={regenerating}
      />
    );
  }

  /* ───── 가드 3: 에러 (캐시 없는 첫 진입) ───── */
  if (reportError && !report) {
    return (
      <section
        style={{
          padding: "80px 24px",
          boxSizing: "border-box",
          maxWidth: COL,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 14, color: "#C82027", marginBottom: 18 }}>
          {reportError}
        </p>
        <button
          onClick={() => fetchNarrative(true)}
          style={{
            fontFamily: T.font,
            fontSize: 13,
            color: T.ink,
            background: "transparent",
            border: `1px solid ${T.ink}`,
            borderRadius: 999,
            padding: "10px 18px",
            cursor: "pointer",
          }}
        >
          ↻ 다시 시도
        </button>
      </section>
    );
  }

  /* ───── 정상: Belief Recap 디자인 핸드오프 기반 렌더 ───── */
  return (
    <div style={{ background: T.surface }}>
      <RecapHero
        overallHeadline={RECAP_HERO_HEADLINE}
        overallIntro={RECAP_HERO_INTRO}
        userName={userName}
        beliefCount={report?.beliefs.length ?? 0}
      />

      {/* stale / regenerating 배너 — Hero 와 본문 사이에 배치 */}
      {(isStale || regenerating) && (
        <div
          style={{
            maxWidth: RECAP_COL + 80,
            margin: "0 auto",
            padding: "0 40px 24px",
          }}
        >
          {isStale && !regenerating && (
            <div
              style={{
                padding: "14px 18px",
                borderRadius: 12,
                background: T.accentTint,
                border: `1px solid ${T.accent}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 13.5,
                  color: T.text,
                  lineHeight: 1.55,
                  letterSpacing: "-0.003em",
                }}
              >
                ⚠ 수정한 내용이 아직 리포트에 반영되지 않았어요.
              </span>
              <button
                onClick={handleRegenerate}
                style={{
                  fontFamily: T.font,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: T.ink,
                  background: T.surface,
                  border: `1px solid ${T.ink}`,
                  borderRadius: 999,
                  padding: "7px 14px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                ↻ 다시 만들기
              </button>
            </div>
          )}
          {regenerating && (
            <div
              style={{
                padding: "14px 18px",
                borderRadius: 12,
                background: T.surface2,
                border: `1px solid ${T.hair}`,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span
                className="bev-spin"
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 999,
                  border: `2px solid ${T.text3}`,
                  borderTopColor: "transparent",
                  flexShrink: 0,
                }}
              />
              <span
                style={{ fontSize: 13.5, color: T.text2, lineHeight: 1.55 }}
              >
                수정한 내용을 반영해 리포트를 다시 만들고 있어요…
              </span>
            </div>
          )}
        </div>
      )}

      {/* 신념별 5단계 recap — 첫 신념에서만 PROTECTION LOOP(다크) 1회 노출 */}
      {report?.beliefs.map((b, i) => {
        const entry = entries.find((e) => e.source === b.source);
        const strength =
          typeof entry?.reinforced_strength === "number"
            ? entry.reinforced_strength
            : 0;
        return (
          <div key={`${b.source}-${i}`}>
            {i > 0 && (
              <div
                style={{
                  maxWidth: RECAP_COL + 80,
                  margin: "0 auto",
                  padding: "0 40px",
                }}
              >
                <div
                  style={{
                    height: 1,
                    background: T.hair,
                    margin: "60px 0",
                  }}
                />
              </div>
            )}
            <RecapBeliefSection
              index={i + 1}
              narrative={b}
              reinforcedStrength={strength}
              mechanism={mechanism}
              userName={userName}
              onEdit={() => onEditEntry(b.source)}
              isFirst={i === 0}
            />
          </div>
        );
      })}

      {error && (
        <div
          style={{
            maxWidth: RECAP_COL + 80,
            margin: "0 auto",
            padding: "0 40px",
          }}
        >
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
        </div>
      )}

      {/* 워크북 단계 이동 CTA — 모든 신념 recap 이후 한 번만 */}
      <section
        style={{
          maxWidth: RECAP_COL + 80,
          margin: "0 auto",
          padding: "32px 40px 100px",
        }}
      >
        <div
          style={{
            paddingTop: 28,
            borderTop: `1px solid ${T.hair}`,
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          <Mono size={10} color={T.text3} tracking={0.16}>
            NEXT · SUMMARY
          </Mono>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
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
            <button
              disabled={submitting}
              onClick={onContinue}
              style={{
                fontFamily: T.font,
                fontWeight: 600,
                fontSize: 15,
                background: T.ink,
                color: T.surface,
                border: "none",
                borderRadius: 999,
                padding: "13px 24px",
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
          </div>
        </div>
      </section>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
 * NarrativeLoading — felt-progress 로딩 (5단계 메시지 cycle)
 * ────────────────────────────────────────────────────────── */
function NarrativeLoading({
  messageIndex,
  regenerating,
}: {
  messageIndex: number;
  regenerating: boolean;
}) {
  const message = NARRATIVE_LOADING_MESSAGES[messageIndex];
  const progress =
    ((messageIndex + 1) / NARRATIVE_LOADING_MESSAGES.length) * 100;
  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 380, textAlign: "center" }}>
        <span
          className="bev-spin"
          style={{
            display: "inline-block",
            width: 40,
            height: 40,
            borderRadius: 999,
            border: `2px solid ${T.ink}`,
            borderTopColor: "transparent",
            marginBottom: 22,
          }}
        />
        <div style={{ position: "relative", height: 28 }}>
          <AnimatePresence mode="wait">
            <motion.p
              key={messageIndex}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              style={{
                position: "absolute",
                inset: 0,
                margin: 0,
                fontFamily: T.font,
                fontSize: 15.5,
                fontWeight: 500,
                color: T.ink,
                letterSpacing: "-0.005em",
              }}
            >
              {message}
            </motion.p>
          </AnimatePresence>
        </div>
        <div
          style={{
            margin: "18px auto 0",
            width: 168,
            height: 3,
            borderRadius: 2,
            background: T.hair2,
            overflow: "hidden",
          }}
        >
          <motion.div
            style={{
              height: "100%",
              background: T.ink,
            }}
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <p
          style={{
            marginTop: 18,
            fontSize: 13,
            color: T.text3,
            lineHeight: 1.6,
          }}
        >
          {regenerating
            ? "수정한 내용을 반영해 다시 만들고 있어요"
            : "지난 모든 자기보고를 통합하고 있어요"}
          <br />
          최대 30초까지 걸릴 수 있어요
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
 * NarrativeFallback — 완료된 신념이 0개일 때의 폴백 뷰
 * ────────────────────────────────────────────────────────── */
function NarrativeFallback({
  entries,
  selectedSources,
  remainingSources,
  submitting,
  error,
  onBackToSelect,
  onContinue,
}: {
  entries: BeliefEvidenceEntry[];
  selectedSources: CoreBeliefSource[];
  remainingSources: CoreBeliefSource[];
  submitting: boolean;
  error: string;
  onBackToSelect: () => void;
  onContinue: () => void;
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
        여기까지 모은 근거를 정리했어요.
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
        한 신념을 끝까지 채우면 5단계 상담사 리포트가 자동으로 만들어져요. 지금은
        다음 단계로 바로 넘어가거나, 빠진 신념을 더 채워볼 수 있어요.
      </p>

      {/* 작성한 신념 미리보기 (이전 카드 뷰 그대로) */}
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
                  whiteSpace: "pre-line",
                  paddingLeft: 12,
                  borderLeft: `2px solid ${T.accent}`,
                }}
              >
                {e.new_belief_text}
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
          <span>{submitting ? "저장 중…" : "전문 상담사 리포트 보기"}</span>
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
