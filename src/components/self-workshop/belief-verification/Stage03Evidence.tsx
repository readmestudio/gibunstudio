"use client";

import { useMemo, useState } from "react";
import type {
  BeliefEvidenceEntry,
  OriginBelief,
  Stage03Evidence as Stage03Data,
} from "@/lib/self-workshop/belief-verification";
import { reconcileStage03Evidence } from "@/lib/self-workshop/belief-verification";
import {
  STAGE_03_BRIEF,
  STAGE_03_INSIGHT,
} from "@/lib/self-workshop/belief-verification-copy";
import { Mono } from "@/components/self-workshop/clinical-report/shared/Mono";
import { InvertedInsightCard } from "./shared/InvertedInsightCard";

/**
 * Stage 03 — EVIDENCE.
 *
 * 핸드오프 v2 흐름:
 *  - 신념 하나씩 작업 (BVT.accent로 ACTIVE 시그널)
 *  - PHASE 01: SUPPORTING 입력 → "제출하기" → 1.1초 로딩 → PHASE 02 노출
 *  - PHASE 02: COUNTER (Facilitator 카드 → 입력 → "다음 신념으로")
 *  - 신념×phase 조합당 AI 도움 1회 사용 가능
 *  - 모든 신념 done → AllDone 요약
 */
export function Stage03Evidence({
  data,
  beliefs,
  onUpdate,
}: {
  data: Stage03Data | undefined;
  beliefs: OriginBelief[];
  onUpdate: (next: Stage03Data) => void;
}) {
  // 신념 목록과 데이터 동기화 (목록 변동 시 키 매칭으로 보존)
  const value: Stage03Data = useMemo(
    () => reconcileStage03Evidence(data, beliefs),
    [data, beliefs]
  );

  const total = beliefs.length;
  const completed = value.beliefs.filter((b) => b.status === "done").length;
  const allDone = total > 0 && completed === total;
  const activeIndex = Math.min(value.active_index, total);
  const activeBelief = !allDone && activeIndex < total ? beliefs[activeIndex] : null;
  const activeEntry =
    !allDone && activeIndex < total ? value.beliefs[activeIndex] : null;

  function patchEntry(idx: number, patch: Partial<BeliefEvidenceEntry>) {
    const nextEntries = value.beliefs.map((e, i) =>
      i === idx ? { ...e, ...patch } : e
    );
    onUpdate({ ...value, beliefs: nextEntries });
  }

  function setLines(idx: number, kind: "support" | "counter", lines: string[]) {
    patchEntry(idx, { [kind]: lines } as Partial<BeliefEvidenceEntry>);
  }

  function commitToCounter(idx: number) {
    onUpdate({
      ...value,
      beliefs: value.beliefs.map((e, i) => (i === idx ? { ...e } : e)),
      active_phase: "counter",
    });
  }

  function commitBeliefDone(idx: number) {
    const nextEntries = value.beliefs.map((e, i) =>
      i === idx ? { ...e, status: "done" as const } : e
    );
    const nextIndex = idx + 1;
    onUpdate({
      ...value,
      beliefs: nextEntries,
      active_index: nextIndex,
      active_phase: "support",
    });
  }

  function reopenBelief(idx: number) {
    const nextEntries = value.beliefs.map((e, i) =>
      i === idx ? { ...e, status: "pending" as const } : e
    );
    onUpdate({
      ...value,
      beliefs: nextEntries,
      active_index: idx,
      active_phase: "support",
    });
  }

  function markAiUsed(idx: number, kind: "support" | "counter") {
    patchEntry(
      idx,
      kind === "support"
        ? { ai_used_support: true }
        : { ai_used_counter: true }
    );
  }

  return (
    <div className="flex flex-col gap-7">
      {/* (1) 인사이트 카드 */}
      <InvertedInsightCard
        label="WHY THIS STEP"
        body={STAGE_03_INSIGHT}
        closing={STAGE_03_BRIEF}
      />

      {/* (2) 진행 레일 — 3개 신념 */}
      {total > 0 && (
        <ProgressRail
          beliefs={beliefs}
          entries={value.beliefs}
          activeIndex={activeIndex}
          allDone={allDone}
        />
      )}

      {/* (3) 활성 신념 작업 영역 */}
      {!allDone && activeBelief && activeEntry && (
        <BeliefStep
          key={`bv-${activeIndex}`}
          belief={activeBelief}
          index={activeIndex}
          total={total}
          phase={value.active_phase}
          entry={activeEntry}
          previous={beliefs
            .map((b, i) => ({ b, e: value.beliefs[i] }))
            .filter(({ e }, i) => i < activeIndex && e?.status === "done")
            .map(({ b, e }) => ({ belief: b, entry: e }))}
          onChangeLines={(kind, lines) => setLines(activeIndex, kind, lines)}
          onSubmitSupport={() => commitToCounter(activeIndex)}
          onSkipSupport={() => commitToCounter(activeIndex)}
          onCommitBelief={() => commitBeliefDone(activeIndex)}
          onMarkAiUsed={(kind) => markAiUsed(activeIndex, kind)}
        />
      )}

      {/* (4) 모두 완료 — 요약 */}
      {allDone && (
        <AllDoneSummary
          beliefs={beliefs}
          entries={value.beliefs}
          onEdit={reopenBelief}
        />
      )}

      {/* (5) 진행 푸터 */}
      <div
        style={{
          marginTop: 8,
          paddingTop: 14,
          borderTop: "1px solid var(--v2-line2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Mono size={10} weight={600} color="var(--v2-mute)" tracked={0.16}>
          PROGRESS · {completed} / {total} BELIEFS COMPLETE
        </Mono>
      </div>
    </div>
  );
}

/* ──────────────────────── PROGRESS RAIL ──────────────────────── */

function ProgressRail({
  beliefs,
  entries,
  activeIndex,
  allDone,
}: {
  beliefs: OriginBelief[];
  entries: BeliefEvidenceEntry[];
  activeIndex: number;
  allDone: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${beliefs.length}, 1fr)`,
        gap: 8,
      }}
    >
      {beliefs.map((b, i) => {
        const isActive = i === activeIndex && !allDone;
        const isDone = entries[i]?.status === "done";
        const borderColor = isActive
          ? "#FF5A1F"
          : isDone
            ? "var(--v2-ink)"
            : "var(--v2-line)";
        return (
          <div
            key={b.key}
            style={{
              padding: "10px 12px",
              borderTop: `2px solid ${borderColor}`,
              opacity: !isActive && !isDone ? 0.5 : 1,
              transition: "opacity .15s",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Mono
                size={10}
                weight={600}
                color={
                  isActive
                    ? "#FF5A1F"
                    : isDone
                      ? "var(--v2-ink)"
                      : "var(--v2-mute)"
                }
                tracked={0.12}
              >
                {isActive ? "● " : isDone ? "✓ " : ""}BELIEF{" "}
                {String(i + 1).padStart(2, "0")} / {String(beliefs.length).padStart(2, "0")}
              </Mono>
              <Mono size={9} weight={600} color="var(--v2-mute)" tracked={0.16}>
                {b.monoLabel}
              </Mono>
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                lineHeight: 1.45,
                color: isActive ? "var(--v2-ink)" : "var(--v2-mute)",
                height: 34,
                overflow: "hidden",
                fontFamily: "var(--font-clinical-body)",
              }}
            >
              {b.text}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────────────── BELIEF STEP (active) ──────────────────────── */

function BeliefStep({
  belief,
  index,
  total,
  phase,
  entry,
  previous,
  onChangeLines,
  onSubmitSupport,
  onSkipSupport,
  onCommitBelief,
  onMarkAiUsed,
}: {
  belief: OriginBelief;
  index: number;
  total: number;
  phase: "support" | "counter";
  entry: BeliefEvidenceEntry;
  previous: { belief: OriginBelief; entry: BeliefEvidenceEntry }[];
  onChangeLines: (kind: "support" | "counter", lines: string[]) => void;
  onSubmitSupport: () => void;
  onSkipSupport: () => void;
  onCommitBelief: () => void;
  onMarkAiUsed: (kind: "support" | "counter") => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const counterShown = phase === "counter";

  function handleSubmitSupport() {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onSubmitSupport();
    }, 1100);
  }

  return (
    <div>
      {/* 활성 신념 카드 */}
      <div
        style={{
          border: "1px solid var(--v2-ink)",
          borderRadius: 16,
          padding: "26px 28px",
          background: "var(--v2-paper)",
          position: "relative",
          marginBottom: 24,
        }}
      >
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            top: 22,
            bottom: 22,
            width: 3,
            background: "#FF5A1F",
            borderRadius: 2,
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Mono size={10} weight={600} color="var(--v2-mute)" tracked={0.16}>
            NOW WORKING ON · {belief.monoLabel}
          </Mono>
          <Mono size={10} weight={700} color="#FF5A1F" tracked={0.16}>
            ● BELIEF {String(index + 1).padStart(2, "0")} OF{" "}
            {String(total).padStart(2, "0")}
          </Mono>
        </div>
        <div
          style={{
            fontFamily: "var(--font-clinical-body)",
            fontWeight: 700,
            fontSize: 22,
            lineHeight: 1.4,
            letterSpacing: "-0.02em",
            color: "var(--v2-ink)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-clinical-mono)",
              color: "var(--v2-mute)",
              marginRight: 6,
            }}
          >
            &ldquo;
          </span>
          {belief.text.replace(/\.$/, "")}
          <span
            style={{
              fontFamily: "var(--font-clinical-mono)",
              color: "var(--v2-mute)",
              marginLeft: 6,
            }}
          >
            &rdquo;
          </span>
        </div>
      </div>

      {/* PHASE 01 — SUPPORT */}
      <PhaseBlock
        stepNum="01"
        phaseLabel="SUPPORTING EVIDENCE"
        title="이 신념을 뒷받침하는 근거"
        hint="이 신념을 사실이라고 믿을 수 있는 근거나 사건이 있나요?"
        lines={entry.support}
        placeholder="예: 작년 3월에 마감을 한 번 놓쳤다."
        locked={counterShown}
        belief={belief}
        kind="support"
        aiUsed={entry.ai_used_support}
        onChange={(lines) => onChangeLines("support", lines)}
        onMarkAiUsed={() => onMarkAiUsed("support")}
      />

      {/* SUPPORT 단계 — 제출/스킵 버튼 */}
      {!counterShown && (
        <div
          style={{
            marginTop: 18,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            type="button"
            onClick={onSkipSupport}
            disabled={submitting}
            className="text-sm text-[var(--v2-mute)] underline-offset-4 hover:text-[var(--v2-ink)] hover:underline disabled:opacity-40"
            style={{ background: "transparent", border: "none", padding: "10px 14px" }}
          >
            지금은 떠오르지 않아요
          </button>
          <button
            type="button"
            onClick={handleSubmitSupport}
            disabled={submitting}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              borderRadius: 10,
              background: "var(--v2-ink)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: "var(--font-clinical-body)",
              border: "none",
              cursor: submitting ? "wait" : "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? (
              <>
                <Spinner /> <span>정리하는 중…</span>
              </>
            ) : (
              <>
                <span>제출하기</span>
                <Arrow />
              </>
            )}
          </button>
        </div>
      )}

      {/* PHASE 02 — COUNTER */}
      {counterShown && (
        <div
          style={{
            marginTop: 32,
            paddingTop: 24,
            borderTop: "1px solid var(--v2-line)",
            animation: "bvFadeIn .45s ease",
          }}
        >
          {/* Facilitator 카드 */}
          <div
            style={{
              background: "var(--v2-ink)",
              color: "#fff",
              borderRadius: 14,
              padding: "18px 22px",
              marginBottom: 22,
            }}
          >
            <Mono
              size={10}
              weight={600}
              color="rgba(255,255,255,0.55)"
              tracked={0.12}
            >
              FACILITATOR · NEXT
            </Mono>
            <div
              style={{
                marginTop: 10,
                fontFamily: "var(--font-clinical-body)",
                fontSize: 16,
                fontWeight: 500,
                lineHeight: 1.55,
                letterSpacing: "-0.01em",
                color: "#fff",
              }}
            >
              이번에는 이 신념이{" "}
              <span style={{ color: "#FF5A1F", fontWeight: 700 }}>
                사실이 아닐 수도 있다는
              </span>{" "}
              반대 근거를 찾아볼까요?
            </div>
          </div>

          <PhaseBlock
            stepNum="02"
            phaseLabel="COUNTER EVIDENCE"
            title="사실이 아닐 수도 있는 증거"
            hint="이 신념과 다르게 보이는 사실이 있나요? 아주 사소해도 괜찮아요."
            lines={entry.counter}
            placeholder="예: 지난 분기 후반엔 팀 발표 일정을 끝까지 책임졌다."
            belief={belief}
            kind="counter"
            aiUsed={entry.ai_used_counter}
            onChange={(lines) => onChangeLines("counter", lines)}
            onMarkAiUsed={() => onMarkAiUsed("counter")}
          />

          <div
            style={{
              marginTop: 18,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 12,
            }}
          >
            <button
              type="button"
              onClick={onCommitBelief}
              className="text-sm text-[var(--v2-mute)] underline-offset-4 hover:text-[var(--v2-ink)] hover:underline"
              style={{ background: "transparent", border: "none", padding: "10px 14px" }}
            >
              지금은 떠오르지 않아요
            </button>
            <button
              type="button"
              onClick={onCommitBelief}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                borderRadius: 10,
                background: "var(--v2-ink)",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "var(--font-clinical-body)",
                border: "none",
                cursor: "pointer",
              }}
            >
              <span>{index === total - 1 ? "모두 완료" : "다음 신념으로"}</span>
              <Arrow />
            </button>
          </div>
        </div>
      )}

      {/* 완료된 이전 신념 collapse */}
      {previous.length > 0 && (
        <div
          style={{
            marginTop: 24,
            padding: "14px 16px",
            borderRadius: 10,
            background: "var(--v2-line3)",
          }}
        >
          <Mono size={10} weight={600} color="var(--v2-mute)" tracked={0.16}>
            COMPLETED · {String(previous.length).padStart(2, "0")} ITEM
            {previous.length > 1 ? "S" : ""}
          </Mono>
          <ul
            style={{
              marginTop: 8,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {previous.map((p, i) => (
              <li
                key={p.belief.key}
                style={{
                  fontSize: 12,
                  color: "var(--v2-body)",
                  lineHeight: 1.5,
                  fontFamily: "var(--font-clinical-body)",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-clinical-mono)",
                    color: "var(--v2-mute)",
                    marginRight: 8,
                  }}
                >
                  ✓ {String(i + 1).padStart(2, "0")}
                </span>
                {p.belief.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <style>{`
        @keyframes bvFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bvSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* ──────────────────────── PHASE BLOCK ──────────────────────── */

function PhaseBlock({
  stepNum,
  phaseLabel,
  title,
  hint,
  lines,
  placeholder,
  locked,
  belief,
  kind,
  aiUsed,
  onChange,
  onMarkAiUsed,
}: {
  stepNum: string;
  phaseLabel: string;
  title: string;
  hint: string;
  lines: string[];
  placeholder: string;
  locked?: boolean;
  belief: OriginBelief;
  kind: "support" | "counter";
  aiUsed: boolean;
  onChange: (lines: string[]) => void;
  onMarkAiUsed: () => void;
}) {
  function update(idx: number, next: string) {
    const out = [...lines];
    out[idx] = next;
    onChange(out);
  }
  function add() {
    onChange([...lines, ""]);
  }
  function remove(idx: number) {
    const out = lines.filter((_, i) => i !== idx);
    onChange(out.length ? out : [""]);
  }
  function insert(text: string) {
    const emptyIdx = lines.findIndex((l) => !l || !l.trim());
    if (emptyIdx >= 0) {
      const out = [...lines];
      out[emptyIdx] = text;
      onChange(out);
    } else {
      onChange([...lines, text]);
    }
  }

  return (
    <div style={{ opacity: locked ? 0.65 : 1 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <Mono size={10} weight={600} color="var(--v2-mute)" tracked={0.16}>
          STEP {stepNum} · {phaseLabel}
        </Mono>
        <div style={{ flex: 1, height: 1, background: "var(--v2-line)" }} />
      </div>

      <h3
        style={{
          margin: "0 0 6px",
          fontFamily: "var(--font-clinical-body)",
          fontWeight: 700,
          fontSize: 20,
          color: "var(--v2-ink)",
          letterSpacing: "-0.015em",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          margin: "0 0 16px",
          fontSize: 13.5,
          lineHeight: 1.6,
          color: "var(--v2-body)",
          fontFamily: "var(--font-clinical-body)",
        }}
      >
        {hint}
      </p>

      <div className="flex flex-col gap-2.5">
        {lines.map((v, i) => (
          <div key={i} className="flex items-start gap-2">
            <textarea
              value={v}
              rows={2}
              disabled={locked}
              placeholder={i === 0 ? placeholder : "한 줄 더 추가…"}
              onChange={(e) => update(i, e.target.value)}
              style={{
                flex: 1,
                resize: "vertical",
                minHeight: 56,
                padding: "12px 14px",
                borderRadius: 10,
                border: `1px solid ${v ? "var(--v2-ink)" : "var(--v2-line)"}`,
                background: locked ? "var(--v2-line3)" : "var(--v2-paper)",
                fontSize: 14,
                lineHeight: 1.55,
                color: "var(--v2-ink)",
                fontFamily: "var(--font-clinical-body)",
                outline: "none",
                transition: "border-color .12s",
              }}
            />
            {!locked && lines.length > 1 && (
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label="삭제"
                className="mt-3 text-[var(--v2-mute)] hover:text-[var(--v2-ink)]"
                style={{ background: "transparent", border: "none", fontSize: 14 }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {!locked && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 10,
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={add}
            className="text-sm text-[var(--v2-body2)] underline-offset-4 hover:text-[var(--v2-ink)] hover:underline"
            style={{ background: "transparent", border: "none", padding: "6px 0" }}
          >
            + 한 줄 더 추가
          </button>
          <AiHelpControl
            beliefText={belief.text}
            kind={kind}
            aiUsed={aiUsed}
            onInsert={insert}
            onMarkAiUsed={onMarkAiUsed}
          />
        </div>
      )}
    </div>
  );
}

/* ──────────────────────── AI HELP CONTROL ──────────────────────── */

function AiHelpControl({
  beliefText,
  kind,
  aiUsed,
  onInsert,
  onMarkAiUsed,
}: {
  beliefText: string;
  kind: "support" | "counter";
  aiUsed: boolean;
  onInsert: (text: string) => void;
  onMarkAiUsed: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 잠금 + 카드 닫힘 — 단순 라벨
  if (!open && aiUsed) {
    return (
      <Mono size={10} weight={600} color="var(--v2-mute)" tracked={0.12}>
        ● AI 도움 사용 완료 (1/1)
      </Mono>
    );
  }

  // 미사용 + 카드 닫힘 — 트리거 버튼
  if (!open && !aiUsed) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          void requestCandidates();
        }}
        style={{
          fontFamily: "var(--font-clinical-body)",
          fontSize: 13,
          fontWeight: 600,
          color: "var(--v2-ink)",
          background: "transparent",
          border: "1px solid var(--v2-ink)",
          borderRadius: 999,
          padding: "7px 14px",
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          aria-hidden
          style={{
            width: 6,
            height: 6,
            borderRadius: 999,
            background: "#FF5A1F",
            boxShadow: "0 0 0 3px rgba(255,90,31,0.08)",
          }}
        />
        AI에게 도움 받기
        <Mono size={10} weight={500} color="var(--v2-mute)" tracked={0.12}>
          · 1회
        </Mono>
      </button>
    );
  }

  async function requestCandidates() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/self-workshop/ai-evidence-help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ belief: beliefText, kind }),
      });
      if (!res.ok) throw new Error("ai_failed");
      const json = (await res.json()) as { candidates?: string[] };
      const list = (json.candidates ?? []).slice(0, 4);
      if (list.length === 0) throw new Error("empty");
      setItems(list);
      onMarkAiUsed();
    } catch {
      setError("도움을 가져오지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  // 펼쳐진 후보 카드
  return (
    <div
      style={{
        width: "100%",
        marginTop: 4,
        border: "1px solid var(--v2-ink)",
        borderRadius: 12,
        padding: "16px 18px",
        background: "var(--v2-paper)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <Mono size={10} weight={700} color="var(--v2-ink)" tracked={0.16}>
          ● AI · 떠올릴 만한 후보들
        </Mono>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-[var(--v2-body)] hover:text-[var(--v2-ink)]"
          style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
        >
          닫기
        </button>
      </div>

      {loading && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 0",
            color: "var(--v2-body)",
            fontSize: 13,
            fontFamily: "var(--font-clinical-body)",
          }}
        >
          <DarkSpinner />
          <span>후보들을 떠올려보는 중…</span>
        </div>
      )}

      {error && (
        <div
          style={{
            color: "#FF5A1F",
            fontSize: 13,
            fontFamily: "var(--font-clinical-body)",
            padding: "8px 0",
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <div
            style={{
              fontSize: 12,
              color: "var(--v2-body)",
              lineHeight: 1.55,
              marginBottom: 12,
              fontFamily: "var(--font-clinical-body)",
            }}
          >
            아래는 <b>예시</b>일 뿐이에요. 자기 경험과 가까운 것이 있다면 가져다 다듬어 쓰고,
            아니면 무시해도 돼요.
          </div>
          <div className="flex flex-col gap-2">
            {items.map((t, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onInsert(t)}
                style={{
                  textAlign: "left",
                  cursor: "pointer",
                  background: "var(--v2-line3)",
                  border: "1px solid var(--v2-line)",
                  borderRadius: 10,
                  padding: "12px 14px",
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 12,
                  alignItems: "center",
                  fontFamily: "var(--font-clinical-body)",
                }}
              >
                <span style={{ fontSize: 14, color: "var(--v2-ink)", lineHeight: 1.5 }}>
                  {t}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--v2-body)",
                    border: "1px solid var(--v2-line)",
                    borderRadius: 999,
                    padding: "4px 10px",
                    whiteSpace: "nowrap",
                  }}
                >
                  + 가져오기
                </span>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <Mono size={9} weight={500} color="var(--v2-mute)" tracked={0.16}>
              이 신념에서 AI 도움은 1회만 사용할 수 있어요.
            </Mono>
          </div>
        </>
      )}
    </div>
  );
}

/* ──────────────────────── ALL DONE SUMMARY ──────────────────────── */

function AllDoneSummary({
  beliefs,
  entries,
  onEdit,
}: {
  beliefs: OriginBelief[];
  entries: BeliefEvidenceEntry[];
  onEdit: (idx: number) => void;
}) {
  return (
    <div>
      <div
        style={{
          border: "1px solid var(--v2-ink)",
          borderRadius: 16,
          padding: "26px 28px",
          background: "var(--v2-paper)",
          marginBottom: 20,
        }}
      >
        <Mono size={10} weight={700} color="#FF5A1F" tracked={0.16}>
          ● ALL THREE COMPLETE
        </Mono>
        <h3
          style={{
            margin: "12px 0 8px",
            fontFamily: "var(--font-clinical-body)",
            fontWeight: 700,
            fontSize: 24,
            color: "var(--v2-ink)",
            letterSpacing: "-0.02em",
          }}
        >
          {beliefs.length === 1
            ? "신념의 양쪽 사실을 모았어요."
            : `${beliefs.length}개 신념 모두, 양쪽 사실을 모았어요.`}
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: "var(--v2-body)",
            lineHeight: 1.7,
            fontFamily: "var(--font-clinical-body)",
            maxWidth: 640,
          }}
        >
          이제 다음 단계에서, 모은 사실들을 토대로{" "}
          <b style={{ color: "var(--v2-ink)" }}>다른 시점</b>에서 신념을 바라보게 됩니다.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {beliefs.map((b, i) => {
          const e = entries[i];
          const supports = e?.support.filter((s) => s.trim()) ?? [];
          const counters = e?.counter.filter((s) => s.trim()) ?? [];
          return (
            <div
              key={b.key}
              style={{
                border: "1px solid var(--v2-line)",
                borderRadius: 14,
                padding: "18px 20px",
                background: "var(--v2-paper)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <Mono size={10} weight={600} color="var(--v2-mute)" tracked={0.16}>
                  {b.monoLabel}
                </Mono>
                <button
                  type="button"
                  onClick={() => onEdit(i)}
                  style={{
                    fontFamily: "var(--font-clinical-body)",
                    fontSize: 12,
                    fontWeight: 500,
                    color: "var(--v2-body)",
                    background: "transparent",
                    border: "1px solid var(--v2-line)",
                    borderRadius: 999,
                    padding: "5px 12px",
                    cursor: "pointer",
                  }}
                >
                  ✎ 수정
                </button>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-clinical-body)",
                  fontWeight: 600,
                  fontSize: 15,
                  color: "var(--v2-ink)",
                  lineHeight: 1.5,
                  marginBottom: 12,
                  letterSpacing: "-0.01em",
                }}
              >
                &ldquo;{b.text}&rdquo;
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  paddingTop: 12,
                  borderTop: "1px solid var(--v2-line2)",
                }}
              >
                <SummaryColumn
                  label={`SUPPORTING · ${String(supports.length).padStart(2, "0")}`}
                  items={supports}
                />
                <SummaryColumn
                  label={`COUNTER · ${String(counters.length).padStart(2, "0")}`}
                  items={counters}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryColumn({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <Mono size={9} weight={600} color="var(--v2-mute)" tracked={0.16}>
        {label}
      </Mono>
      <ul
        style={{
          margin: "8px 0 0",
          paddingLeft: 16,
          fontSize: 13,
          color: "var(--v2-body)",
          lineHeight: 1.6,
          fontFamily: "var(--font-clinical-body)",
        }}
      >
        {items.length > 0 ? (
          items.map((s, k) => <li key={k}>{s}</li>)
        ) : (
          <li
            style={{
              color: "var(--v2-mute)",
              listStyle: "none",
              marginLeft: -16,
            }}
          >
            — 비어있음
          </li>
        )}
      </ul>
    </div>
  );
}

/* ──────────────────────── PRIMITIVES ──────────────────────── */

function Spinner() {
  return (
    <span
      style={{
        width: 12,
        height: 12,
        borderRadius: 999,
        border: "1.5px solid rgba(255,255,255,0.35)",
        borderTopColor: "#fff",
        display: "inline-block",
        animation: "bvSpin 0.7s linear infinite",
      }}
    />
  );
}

function DarkSpinner() {
  return (
    <span
      style={{
        width: 12,
        height: 12,
        borderRadius: 999,
        border: "1.5px solid rgba(0,0,0,0.15)",
        borderTopColor: "var(--v2-ink)",
        display: "inline-block",
        animation: "bvSpin 0.7s linear infinite",
      }}
    />
  );
}

function Arrow() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3 8 H13 M9 4 L13 8 L9 12"
        stroke="#fff"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

