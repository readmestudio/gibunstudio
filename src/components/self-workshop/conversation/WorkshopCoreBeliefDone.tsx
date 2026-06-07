"use client";

/**
 * Step 4(핵심 신념 찾기) 전용 완료 화면 (2026-06-06 신규).
 *
 * Step 3와 달리, 여기서는 *앞 대화를 리캡*하고 LLM이 제시한 **자동사고·핵심신념 후보**를
 * 사용자가 다중 선택(+직접 추가)한다. 고른 자동사고는 Step 6(대안 자동사고), 고른 신념은
 * Step 7(새 신념) 수정 실습의 대상이 된다.
 *
 * WorkshopConversation의 renderDone 훅으로 주입되어 기본 시각화 카드를 대체한다.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Body,
  D,
  EditorialInput,
  Headline,
  Mono,
  SectionHeader,
  TS,
} from "@/components/self-workshop/clinical-report/v3-shared";
import {
  migrateLegacyExcavation,
  type CoreBeliefExcavation,
} from "@/lib/self-workshop/core-belief-excavation";
import type { ConversationTranscript } from "@/lib/self-workshop/conversation";

interface Props {
  workshopId: string;
  transcript: ConversationTranscript;
  /** Step 3에서 포착한 자동사고(후보 생성 컨텍스트 + 리캡 표시용). */
  priorAutomaticThought?: string;
  /** 이어하기용 core_belief_excavation 원본(후보·선택 캐시 복원). */
  savedData?: unknown;
}

export function WorkshopCoreBeliefDone({
  workshopId,
  transcript,
  priorAutomaticThought,
  savedData,
}: Props) {
  const router = useRouter();
  const initial = useMemo<CoreBeliefExcavation>(
    () => migrateLegacyExcavation(savedData),
    [savedData]
  );

  // 후보(자동사고/핵심신념) + 리캡
  const [thoughtItems, setThoughtItems] = useState<string[]>(
    () => initial.belief_candidates?.thoughts ?? []
  );
  const [beliefItems, setBeliefItems] = useState<string[]>(
    () => initial.belief_candidates?.beliefs ?? []
  );
  const [recapSummary, setRecapSummary] = useState("");
  const [loading, setLoading] = useState(
    () => !initial.belief_candidates // 캐시 없으면 fetch 필요
  );

  // 선택 상태(텍스트 집합)
  const [selThoughts, setSelThoughts] = useState<Set<string>>(
    () => new Set(initial.selected_thoughts ?? [])
  );
  const [selBeliefs, setSelBeliefs] = useState<Set<string>>(
    () => new Set(initial.selected_beliefs ?? [])
  );

  const [customThought, setCustomThought] = useState("");
  const [customBelief, setCustomBelief] = useState("");
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const fetchedRef = useRef(false);

  // 후보 생성 fetch (캐시 없을 때 1회)
  useEffect(() => {
    if (initial.belief_candidates) return; // 캐시 사용
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    void (async () => {
      try {
        const res = await fetch("/api/self-workshop/belief-candidates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript,
            prior_automatic_thought: priorAutomaticThought ?? "",
          }),
        });
        const j = (await res.json()) as Partial<{
          recap_summary: string;
          candidate_thoughts: string[];
          candidate_beliefs: string[];
        }>;
        setRecapSummary(typeof j.recap_summary === "string" ? j.recap_summary : "");
        setThoughtItems(Array.isArray(j.candidate_thoughts) ? j.candidate_thoughts : []);
        setBeliefItems(Array.isArray(j.candidate_beliefs) ? j.candidate_beliefs : []);
      } catch {
        // 폴백: 후보 없이 직접 입력으로 진행 가능
      } finally {
        setLoading(false);
      }
    })();
  }, [initial.belief_candidates, transcript, priorAutomaticThought]);

  const toggle = useCallback(
    (set: Set<string>, setter: (s: Set<string>) => void, value: string) => {
      const next = new Set(set);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      setter(next);
    },
    []
  );

  function addCustom(kind: "thought" | "belief") {
    const raw = (kind === "thought" ? customThought : customBelief).trim();
    if (!raw) return;
    if (kind === "thought") {
      if (!thoughtItems.includes(raw)) setThoughtItems((p) => [...p, raw]);
      setSelThoughts((p) => new Set(p).add(raw));
      setCustomThought("");
    } else {
      if (!beliefItems.includes(raw)) setBeliefItems((p) => [...p, raw]);
      setSelBeliefs((p) => new Set(p).add(raw));
      setCustomBelief("");
    }
  }

  const canAdvance = selThoughts.size > 0 || selBeliefs.size > 0;

  async function handleNext() {
    setCompleting(true);
    setError("");
    try {
      const chosenThoughts = thoughtItems.filter((t) => selThoughts.has(t));
      const chosenBeliefs = beliefItems.filter((b) => selBeliefs.has(b));

      // 다운스트림 호환: 고른 신념을 belief_analysis 3축 + synthesis에 매핑.
      const preserved = {
        ...(initial.legacy_downward_arrow
          ? { legacy_downward_arrow: initial.legacy_downward_arrow }
          : {}),
      };
      const beliefAnalysis =
        chosenBeliefs.length > 0
          ? {
              belief_about_self: chosenBeliefs[0] ?? "",
              belief_about_others: chosenBeliefs[1] ?? "",
              belief_about_world: chosenBeliefs[2] ?? "",
              dominant_schemas: [],
              evidence_quotes: [],
              generated_at: new Date().toISOString(),
            }
          : initial.belief_analysis;
      const synthesis =
        chosenBeliefs.length > 0
          ? {
              belief_line: chosenBeliefs[0] ?? "",
              how_it_works: "",
              reframe_invitation: "",
            }
          : initial.synthesis;

      const data = {
        ...preserved,
        sct_responses: initial.sct_responses ?? {},
        dialogue: transcript,
        selected_thoughts: chosenThoughts,
        selected_beliefs: chosenBeliefs,
        belief_candidates: { thoughts: thoughtItems, beliefs: beliefItems },
        selection_made_at: new Date().toISOString(),
        ...(beliefAnalysis ? { belief_analysis: beliefAnalysis } : {}),
        ...(synthesis ? { synthesis } : {}),
      };

      const res = await fetch("/api/self-workshop/save-progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshopId,
          field: "core_belief_excavation",
          advanceStep: 5,
          data,
        }),
      });
      if (!res.ok) throw new Error("저장에 실패했어요. 잠시 후 다시 시도해주세요.");
      router.push("/dashboard/self-workshop/step/5");
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했어요");
      setCompleting(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <Mono size={10} weight={600} color={D.accent} tracking={0.16}>
          ● 대화 완료 · 내 생각과 신념 고르기
        </Mono>
        <Headline size="h3">내 안의 생각과 신념을 직접 골라볼게요</Headline>
      </header>

      {/* 리캡 */}
      <article
        style={{
          border: `1px solid ${D.hair}`,
          borderRadius: 14,
          background: D.paper,
          padding: 22,
        }}
      >
        <div
          style={{
            fontFamily: D.mono,
            fontSize: TS.micro,
            fontWeight: 600,
            color: D.text3,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          — 여기까지 따라가 보면
        </div>
        {loading ? (
          <Body muted style={{ fontStyle: "italic" }}>
            방금 나눈 이야기를 정리하고 있어요…
          </Body>
        ) : (
          <>
            {recapSummary && <Body style={{ color: D.ink }}>{recapSummary}</Body>}
            {priorAutomaticThought && (
              <div
                style={{
                  marginTop: recapSummary ? 12 : 0,
                  borderLeft: `2px solid ${D.accent}`,
                  paddingLeft: 14,
                }}
              >
                <div
                  style={{
                    fontFamily: D.mono,
                    fontSize: TS.micro,
                    fontWeight: 600,
                    color: D.text3,
                    letterSpacing: "0.16em",
                    marginBottom: 4,
                  }}
                >
                  STEP 3 · 그때의 자동사고
                </div>
                <span
                  style={{
                    fontFamily: D.font,
                    fontSize: 15,
                    fontWeight: 600,
                    color: D.ink,
                    lineHeight: 1.5,
                  }}
                >
                  &ldquo;{priorAutomaticThought}&rdquo;
                </span>
              </div>
            )}
          </>
        )}
      </article>

      {/* 자동사고 고르기 */}
      <SelectBlock
        kicker="● 골라보기 1 · 자동사고"
        title="이런 생각, 익숙한가요?"
        guide="그 순간 머릿속에 스치는 생각이에요. 나에게 해당하는 걸 모두 골라주세요."
        items={thoughtItems}
        selected={selThoughts}
        onToggle={(v) => toggle(selThoughts, setSelThoughts, v)}
        loading={loading}
        customValue={customThought}
        onCustomChange={setCustomThought}
        onCustomAdd={() => addCustom("thought")}
        customPlaceholder="직접 추가 — 내가 자주 하는 생각을 적어보세요"
      />

      {/* 핵심신념 고르기 */}
      <SelectBlock
        kicker="● 골라보기 2 · 핵심신념"
        title="이런 믿음이 마음 깊은 곳에 있나요?"
        guide="자동사고 아래에 깔린 더 근원적인 믿음이에요. 와닿는 걸 모두 골라주세요."
        items={beliefItems}
        selected={selBeliefs}
        onToggle={(v) => toggle(selBeliefs, setSelBeliefs, v)}
        loading={loading}
        customValue={customBelief}
        onCustomChange={setCustomBelief}
        onCustomAdd={() => addCustom("belief")}
        customPlaceholder="직접 추가 — 내 안의 믿음을 적어보세요"
      />

      <Body muted style={{ fontSize: 13 }}>
        여기서 고른 생각과 신념은 다음 단계에서 하나씩 함께 다시 살펴보고 바꿔갈 거예요.
      </Body>

      <div className="pt-1">
        <button
          onClick={handleNext}
          disabled={!canAdvance || completing}
          className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--foreground)] bg-[var(--foreground)] px-8 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {completing ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              저장하는 중…
            </>
          ) : (
            "다음 단계로 →"
          )}
        </button>
        {!canAdvance && !loading && (
          <p className="mt-2 text-xs text-[var(--foreground)]/50">
            하나 이상 골라주세요 (또는 직접 추가).
          </p>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </section>
  );
}

/* ─────────────────────────── 선택 블록 ─────────────────────────── */

function SelectBlock({
  kicker,
  title,
  guide,
  items,
  selected,
  onToggle,
  loading,
  customValue,
  onCustomChange,
  onCustomAdd,
  customPlaceholder,
}: {
  kicker: string;
  title: string;
  guide: string;
  items: string[];
  selected: Set<string>;
  onToggle: (value: string) => void;
  loading: boolean;
  customValue: string;
  onCustomChange: (v: string) => void;
  onCustomAdd: () => void;
  customPlaceholder: string;
}) {
  return (
    <section className="space-y-3">
      <SectionHeader kicker={kicker} rightLabel="SELECT" />
      <Headline size="h3">{title}</Headline>
      <Body muted style={{ fontSize: 13.5 }}>
        {guide}
      </Body>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
        {loading && items.length === 0 && (
          <Body muted style={{ fontStyle: "italic", fontSize: 13 }}>
            후보를 떠올리고 있어요…
          </Body>
        )}
        {items.map((item) => (
          <CheckRow
            key={item}
            label={item}
            checked={selected.has(item)}
            onClick={() => onToggle(item)}
          />
        ))}
      </div>

      {/* 직접 추가 */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginTop: 4 }}>
        <div style={{ flex: 1 }}>
          <EditorialInput
            value={customValue}
            onChange={onCustomChange}
            placeholder={customPlaceholder}
          />
        </div>
        <button
          onClick={onCustomAdd}
          disabled={!customValue.trim()}
          className="shrink-0 rounded-lg border border-[var(--foreground)]/30 px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30"
        >
          추가
        </button>
      </div>
    </section>
  );
}

function CheckRow({
  label,
  checked,
  onClick,
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "grid",
        gridTemplateColumns: "22px 1fr",
        gap: 12,
        alignItems: "center",
        textAlign: "left",
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        border: `1px solid ${checked ? D.accent : D.hair}`,
        background: checked ? D.accentSoft : D.paper,
        cursor: "pointer",
        transition: "all .18s ease",
      }}
    >
      <span
        aria-hidden
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          border: `2px solid ${checked ? D.accent : D.hair}`,
          background: checked ? D.accent : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6.5L5 9L9.5 3.5"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span
        style={{
          fontFamily: D.font,
          fontSize: 15,
          fontWeight: checked ? 600 : 500,
          color: D.ink,
          lineHeight: 1.5,
        }}
      >
        {label}
      </span>
    </button>
  );
}
