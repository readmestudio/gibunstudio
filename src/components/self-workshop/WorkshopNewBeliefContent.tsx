"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  type BeliefAnswer,
  type CoreBeliefSource,
  type NewBeliefData,
  EMPTY_NEW_BELIEF,
  deriveLegacySummaryFields,
  isBeliefAnswerComplete,
} from "@/lib/self-workshop/new-belief";
import { COL as PAGE_COL, TS } from "@/components/self-workshop/clinical-report/v3-shared";

/* ──────────────────────────────────────────────────────────
 * 디자인 토큰(매핑)
 *   디자인 NCB.* → 프로젝트 var(--wb-*)
 *   ink         #0A0A0B → --wb-ink
 *   text(2/3/4) 5B/8A/B5 → --wb-text/text2/text3 (+ inline #B5B5BC)
 *   hair/hair2  E5E5EA / EFEFF2 → --wb-hair / --wb-hair2
 *   accent      #FF5A1F → --wb-accent
 *   accent-soft 8% / tint  → --wb-accent-soft / inline #FFFBF7
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
  accent: "var(--wb-accent)",
  accentSoft: "var(--wb-accent-soft)",
  accentTint: "#FFFBF7",
  font: "'Pretendard Variable', 'Pretendard', system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

const COL = 720;

const SOURCE_META: Record<
  CoreBeliefSource,
  { code: string; classification: string; classification_en: string }
> = {
  self: {
    code: "KW-01",
    classification: "자기 자신에 대한 신념",
    classification_en: "BELIEF ABOUT SELF",
  },
  others: {
    code: "KW-02",
    classification: "타인에 대한 신념",
    classification_en: "BELIEF ABOUT OTHERS",
  },
  world: {
    code: "KW-03",
    classification: "세계에 대한 신념",
    classification_en: "BELIEF ABOUT WORLD",
  },
};

interface BeliefAnalysisInput {
  belief_about_self?: string;
  belief_about_others?: string;
  belief_about_world?: string;
}

interface Props {
  workshopId: string;
  savedData?: Partial<NewBeliefData> & {
    /** 레거시 단일 신념 데이터 호환 */
    new_core_belief?: string;
    why_this_works?: string;
    situation?: string;
    old_belief_snapshot?: string;
    reframe_invitation?: string;
    ai_candidates?: string[];
  };
  /**
   * 선행 단계 가드용 — recent_situation이 비어 있으면 step 진입 차단.
   * 화면에는 노출하지 않는다. (SITUATION은 LLM이 신념별로 새로 생성)
   */
  recentSituation: string;
  /** core_belief_excavation.belief_analysis (자기/타인/세계 3축) */
  beliefAnalysis: BeliefAnalysisInput | null;
}

/* ──────────────────────────────────────────────────────────
 * 초기 데이터 빌드
 *   - 저장된 beliefs가 있으면 그대로 사용(텍스트/상황은 최신값으로 동기화)
 *   - 없으면 belief_analysis 3축에서 새로 만듦
 * ────────────────────────────────────────────────────────── */
function buildInitialData(props: Props): NewBeliefData {
  const sources: CoreBeliefSource[] = ["self", "others", "world"];
  const ba = props.beliefAnalysis ?? {};
  const beliefTextOf = (s: CoreBeliefSource): string => {
    if (s === "self") return (ba.belief_about_self ?? "").trim();
    if (s === "others") return (ba.belief_about_others ?? "").trim();
    return (ba.belief_about_world ?? "").trim();
  };

  // 저장된 다중 신념 데이터가 있는 경우
  if (props.savedData?.beliefs && Array.isArray(props.savedData.beliefs)) {
    const savedBeliefs = props.savedData.beliefs as BeliefAnswer[];
    const merged: BeliefAnswer[] = sources.map((src) => {
      const meta = SOURCE_META[src];
      const found = savedBeliefs.find((b) => b.source === src);
      const baseText = beliefTextOf(src);
      const text = found?.text || baseText;
      return {
        source: src,
        classification: meta.classification,
        classification_en: meta.classification_en,
        text,
        // 저장된 시나리오가 있으면 그대로(LLM 생성), 없으면 빈 문자열로 두고
        // Q&A 진입 시 새로 생성되도록 한다. recentSituation은 SITUATION으로 쓰지 않는다.
        situation: found?.situation || "",
        old_outcome_hint: found?.old_outcome_hint || "",
        new_outcome_hint: found?.new_outcome_hint || "",
        options: found?.options ?? [],
        old_strength: found?.old_strength ?? null,
        old_outcome: found?.old_outcome ?? "",
        chosen_options: found?.chosen_options ?? [],
        custom_option: found?.custom_option ?? "",
        new_strengths: found?.new_strengths ?? {},
        new_outcome: found?.new_outcome ?? "",
        done: found?.done ?? false,
      };
    });
    return {
      ...EMPTY_NEW_BELIEF,
      beliefs: merged,
      phase: props.savedData.phase ?? "intro",
      current_idx: props.savedData.current_idx ?? 0,
      new_core_belief: props.savedData.new_core_belief ?? "",
      why_this_works: props.savedData.why_this_works ?? "",
    };
  }

  // 신규 시작 (또는 레거시 단일 신념만 저장된 경우)
  const beliefs: BeliefAnswer[] = [];
  for (const src of sources) {
    const meta = SOURCE_META[src];
    const text = beliefTextOf(src);
    if (!text) continue;
    beliefs.push({
      source: src,
      classification: meta.classification,
      classification_en: meta.classification_en,
      text,
      situation: "",
      old_outcome_hint: "",
      new_outcome_hint: "",
      options: [],
      old_strength: null,
      old_outcome: "",
      chosen_options: [],
      custom_option: "",
      new_strengths: {},
      new_outcome: "",
      done: false,
    });
  }

  return {
    ...EMPTY_NEW_BELIEF,
    beliefs,
    phase: "intro",
    current_idx: 0,
    legacy_situation: props.savedData?.situation,
    legacy_old_belief_snapshot: props.savedData?.old_belief_snapshot,
    legacy_reframe_invitation: props.savedData?.reframe_invitation,
    legacy_ai_candidates: props.savedData?.ai_candidates,
  };
}

/* ──────────────────────────────────────────────────────────
 * 메인
 * ────────────────────────────────────────────────────────── */
export function WorkshopNewBeliefContent(props: Props) {
  const router = useRouter();
  const [data, setData] = useState<NewBeliefData>(() => buildInitialData(props));
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback(
    (next: NewBeliefData) => {
      setSaveStatus("saving");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          const derived = deriveLegacySummaryFields(next.beliefs);
          await fetch("/api/self-workshop/save-progress", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              workshopId: props.workshopId,
              field: "new_belief",
              data: { ...next, ...derived },
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
    (updater: (d: NewBeliefData) => NewBeliefData) => {
      setData((prev) => {
        const next = updater(prev);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const updateBelief = useCallback(
    (idx: number, patch: Partial<BeliefAnswer>) => {
      update((d) => {
        const beliefs = d.beliefs.slice();
        beliefs[idx] = { ...beliefs[idx], ...patch };
        return { ...d, beliefs };
      });
    },
    [update]
  );

  /* 페이즈/벨리프 변경 시 상단 스크롤 */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [data.phase, data.current_idx]);

  /* ─────────────────────────────────────────────
   * LLM prefetch 캐시
   *   key: `${source}:${text}` → 진행 중인 promise.
   *   scenario·options 둘로 분리해 critical path를 빠르게.
   * ───────────────────────────────────────────── */
  type ScenarioResult = {
    scenario: string;
    old_outcome_hint?: string;
    new_outcome_hint?: string;
  };
  type OptionsResult = { options: string[] };

  const scenarioCache = useRef<Map<string, Promise<ScenarioResult>>>(new Map());
  const optionsCache = useRef<Map<string, Promise<OptionsResult>>>(new Map());

  const fetchScenario = useCallback(
    (b: BeliefAnswer): Promise<ScenarioResult> => {
      const key = `${b.source}:${b.text}`;
      const cached = scenarioCache.current.get(key);
      if (cached) return cached;
      const p = (async (): Promise<ScenarioResult> => {
        try {
          const res = await fetch("/api/self-workshop/new-belief-options", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: "scenario",
              belief_text: b.text,
              classification: b.classification,
              source: b.source,
            }),
          });
          if (!res.ok) throw new Error("scenario 생성 실패");
          const json = (await res.json()) as ScenarioResult;
          return {
            scenario: (json.scenario || "").trim(),
            old_outcome_hint: (json.old_outcome_hint || "").trim(),
            new_outcome_hint: (json.new_outcome_hint || "").trim(),
          };
        } catch (err) {
          // 캐시에서 빼서 재시도 가능하게 만들기
          scenarioCache.current.delete(key);
          throw err;
        }
      })();
      scenarioCache.current.set(key, p);
      return p;
    },
    []
  );

  const fetchOptions = useCallback(
    (b: BeliefAnswer): Promise<OptionsResult> => {
      const key = `${b.source}:${b.text}`;
      const cached = optionsCache.current.get(key);
      if (cached) return cached;
      const p = (async (): Promise<OptionsResult> => {
        try {
          const res = await fetch("/api/self-workshop/new-belief-options", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: "options",
              belief_text: b.text,
              classification: b.classification,
              source: b.source,
            }),
          });
          if (!res.ok) throw new Error("options 생성 실패");
          const json = (await res.json()) as OptionsResult;
          return { options: Array.isArray(json.options) ? json.options : [] };
        } catch (err) {
          optionsCache.current.delete(key);
          throw err;
        }
      })();
      optionsCache.current.set(key, p);
      return p;
    },
    []
  );

  /* Q&A 진입 시 캐시 lookup → 도착하는 대로 부분 patch 적용.
     scenario는 critical path(step 2 SITUATION), options는 step 3에서 필요. */
  useEffect(() => {
    if (data.phase !== "qa") return;
    const cur = data.beliefs[data.current_idx];
    if (!cur) return;

    const idx = data.current_idx;
    let cancelled = false;

    // 사용자가 아직 답변을 시작하지 않은 신념인지(pristine) — 시나리오/힌트를
    // 안전하게 덮어쓸 수 있는 조건. 답변이 진행 중인 신념의 시나리오를 갑자기 바꾸면
    // 사용자가 적은 결과와 미스매치가 생길 수 있어 보호한다.
    const pristine =
      cur.old_strength == null &&
      (cur.old_outcome || "").trim() === "" &&
      (cur.chosen_options || []).length === 0 &&
      (cur.new_outcome || "").trim() === "";

    // 잘림/구식 판정:
    //  · 빈 값
    //  · 30자 미만 (시나리오는 한 줄 요약 40~110자, 힌트는 80~170자 — 헐거운 임계)
    //  · 줄임표(..., …)로 끝남 — LLM이 글자 한도 맞추려고 트레일 오프한 경우
    //  · 마침표/물음표/느낌표로 정상 종료되지 않음
    const isTruncated = (s: string | undefined, min = 30) => {
      if (!s) return true;
      const t = s.trim();
      if (t.length < min) return true;
      if (/(?:\.{2,}|…)['"'')\s]*$/.test(t)) return true;
      const lastChar = t.slice(-1);
      if (![".", "!", "?", "。", "!", "?"].includes(lastChar)) return true;
      return false;
    };

    // 옛 카피(긴 서술형 시나리오: 110자 초과 또는 두 문장 이상)도 *pristine 신념에 한해*
    // 갱신 대상으로. 답변 진행 중인 신념은 옛 카피라도 그대로 유지.
    const isOldStyleScenario = (s: string | undefined) => {
      if (!s) return false;
      const t = s.trim();
      if (t.length > 110) return true;
      // 종결 부호 카운트 — 두 문장 이상이면 옛 서술형
      const sentenceEnds = (t.match(/[.!?。!?]/g) || []).length;
      return sentenceEnds >= 2;
    };
    const isOldStyleHint = (s: string | undefined) => {
      if (!s) return false;
      // 힌트는 80~170자라 길이 기준 X. 옛 카피의 흔적을 감지하려면 다른 기준 필요하면 추가.
      return false;
    };

    const needScenario =
      isTruncated(cur.situation) || (pristine && isOldStyleScenario(cur.situation));
    const needHints =
      isTruncated(cur.old_outcome_hint) ||
      isTruncated(cur.new_outcome_hint) ||
      (pristine && (isOldStyleHint(cur.old_outcome_hint) || isOldStyleHint(cur.new_outcome_hint)));

    if (needScenario || needHints) {
      // 캐시에 잘린/옛 결과가 들어 있을 수 있으니 무효화 후 재호출
      const cacheKey = `${cur.source}:${cur.text}`;
      scenarioCache.current.delete(cacheKey);
      void fetchScenario(cur)
        .then((r) => {
          if (cancelled) return;
          const patch: Partial<BeliefAnswer> = {};
          if (r.scenario && needScenario) patch.situation = r.scenario;
          if (
            r.old_outcome_hint &&
            (isTruncated(cur.old_outcome_hint) ||
              (pristine && isOldStyleHint(cur.old_outcome_hint)))
          ) {
            patch.old_outcome_hint = r.old_outcome_hint;
          }
          if (
            r.new_outcome_hint &&
            (isTruncated(cur.new_outcome_hint) ||
              (pristine && isOldStyleHint(cur.new_outcome_hint)))
          ) {
            patch.new_outcome_hint = r.new_outcome_hint;
          }
          if (Object.keys(patch).length > 0) updateBelief(idx, patch);
        })
        .catch(() => {
          /* 폴백 없음 — 사용자는 직접 쓰기로 진행 가능 */
        });
    }
    // 옵션(균형 신념 후보)은 시나리오와 달리 사용자 답변과 의존성이 없으므로
    // pristine 보호 및 chosen_options 가드를 적용하지 않는다. options 배열이
    // 비어 있으면 후보 카드 UI 자체가 안 그려지므로(로딩 메시지만 표시),
    // 이미 일부 후보를 고른 사용자라도 options가 < 3이면 다시 채워야 한다.
    // API는 항상 0개 또는 3개로만 응답하므로 인덱스 미스매치 위험 없음.
    const needOptions = (cur.options?.length ?? 0) < 3;
    if (needOptions) {
      void fetchOptions(cur)
        .then((r) => {
          if (cancelled) return;
          if (Array.isArray(r.options) && r.options.length >= 3) {
            updateBelief(idx, { options: r.options.slice(0, 3) });
          }
        })
        .catch(() => {
          /* fail silently */
        });
    }

    return () => {
      cancelled = true;
    };
  }, [
    data.phase,
    data.current_idx,
    data.beliefs,
    fetchScenario,
    fetchOptions,
    updateBelief,
  ]);

  /* CTA 액션 */
  function startFlow() {
    // phase 전환 *전에* 첫 belief의 prefetch를 즉시 발사 — wire 위에 fetch가 미리 올라가도록.
    const first = data.beliefs[data.current_idx];
    if (first) {
      void fetchScenario(first);
      void fetchOptions(first);
    }
    update((d) => ({ ...d, phase: "qa" }));
  }

  /* 다음 belief의 시나리오를 미리 가져오기 — Final reveal 시점에 호출됨 */
  const prefetchNextScenario = useCallback(() => {
    const next = data.beliefs[data.current_idx + 1];
    if (!next) return;
    if (next.situation) return; // 이미 채워져 있으면 skip
    void fetchScenario(next);
  }, [data.beliefs, data.current_idx, fetchScenario]);
  function completeBelief() {
    update((d) => {
      const next = d.current_idx + 1;
      const beliefs = d.beliefs.slice();
      beliefs[d.current_idx] = { ...beliefs[d.current_idx], done: true };
      if (next >= beliefs.length) {
        return { ...d, beliefs, phase: "allDone" };
      }
      return { ...d, beliefs, current_idx: next };
    });
  }
  function restart() {
    if (
      !window.confirm("처음부터 다시 시작하면 모든 답변이 지워집니다. 계속할까요?")
    )
      return;
    setData(() => buildInitialData({ ...props, savedData: undefined }));
    setSaveStatus("idle");
  }

  async function goNextStage() {
    setSubmitting(true);
    setError("");
    try {
      const derived = deriveLegacySummaryFields(data.beliefs);
      const res = await fetch("/api/self-workshop/save-progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshopId: props.workshopId,
          field: "new_belief",
          data: { ...data, ...derived, phase: "allDone" },
          advanceStep: 8,
        }),
      });
      if (!res.ok) throw new Error("저장에 실패했습니다.");
      router.push("/dashboard/self-workshop/step/8");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  /* 선행 데이터 가드 */
  if (!props.recentSituation || data.beliefs.length === 0) {
    return (
      <div
        className="text-center"
        style={{ maxWidth: PAGE_COL + 96, margin: "0 auto", padding: "80px 48px" }}
      >
        <p className="text-sm text-[var(--foreground)]/60">
          이 단계로 오기 전 단계들이 비어 있어요. FIND OUT 단계부터 다시 진행해
          주세요.
        </p>
        <Link
          href="/dashboard/self-workshop"
          className="mt-4 inline-block text-sm font-medium text-[var(--foreground)] underline"
        >
          워크북 목록으로 돌아가기 →
        </Link>
      </div>
    );
  }

  const hasProgress = data.beliefs.some(
    (b) =>
      b.old_strength != null ||
      (b.old_outcome || "").length > 0 ||
      (b.chosen_options || []).length > 0 ||
      (b.new_outcome || "").length > 0 ||
      b.done
  );

  const currentBelief = data.beliefs[data.current_idx];

  return (
    <div
      className="ncb-root"
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
        total={data.beliefs.length}
      />

      {data.phase === "intro" && (
        <Intro
          beliefs={data.beliefs}
          onStart={startFlow}
          hasProgress={hasProgress}
        />
      )}

      {data.phase === "qa" && currentBelief && (
        <BeliefQA
          key={currentBelief.source}
          belief={currentBelief}
          idx={data.current_idx + 1}
          total={data.beliefs.length}
          onChange={(patch) => updateBelief(data.current_idx, patch)}
          onComplete={completeBelief}
          onPrefetchNext={prefetchNextScenario}
        />
      )}

      {data.phase === "allDone" && (
        <AllDone
          beliefs={data.beliefs}
          onRestart={restart}
          onContinue={goNextStage}
          submitting={submitting}
          error={error}
        />
      )}

      {/* 글로벌 스타일(범위 슬라이더 thumb 등) */}
      <style jsx global>{`
        @keyframes ncb-fade-up {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .ncb-reveal-fade {
          animation: ncb-fade-up 0.55s cubic-bezier(0.2, 0.7, 0.2, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .ncb-reveal-fade {
            animation: none;
          }
        }
        /* 3-동그라미 도식: 좁은 화면(<560px)에서 세로 스택 */
        @media (max-width: 560px) {
          .ncb-three-step-grid {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
          .ncb-three-step-line {
            display: none !important;
          }
          .ncb-step-body {
            padding-left: 0 !important;
          }
        }
        /* Final 비포/애프터 2열: 좁은 화면(<640px)에서 1열 폴백 */
        @media (max-width: 640px) {
          .ncb-shift-grid {
            grid-template-columns: 1fr !important;
            gap: 28px !important;
          }
        }
        .ncb-root textarea {
          font-family: inherit;
        }
        .ncb-root textarea::placeholder {
          color: ${T.text4};
        }
        .ncb-root textarea:focus {
          outline: none;
        }
        .ncb-root button:focus-visible {
          outline: 2px solid ${T.ink};
          outline-offset: 3px;
        }
        .ncb-range {
          -webkit-appearance: none;
          appearance: none;
        }
        .ncb-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 11px;
          background: ${T.surface};
          border: 2px solid ${T.ink};
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);
          cursor: pointer;
          margin-top: -10px;
        }
        .ncb-range-accent::-webkit-slider-thumb {
          border-color: ${T.accent};
        }
        .ncb-range::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 11px;
          background: ${T.surface};
          border: 2px solid ${T.ink};
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.14);
          cursor: pointer;
        }
        .ncb-range-accent::-moz-range-thumb {
          border-color: ${T.accent};
        }
      `}</style>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
 * 서브: 모노 라벨
 * ────────────────────────────────────────────────────────── */
interface MonoProps {
  children: React.ReactNode;
  size?: number;
  color?: string;
  tracking?: number;
  weight?: number;
  upper?: boolean;
  style?: React.CSSProperties;
}
function Mono({
  children,
  size = 11,
  color,
  tracking = 0.08,
  weight = 600,
  upper = true,
  style,
}: MonoProps) {
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
 * 서브: Reveal — show=false 면 렌더하지 않고, true 가 되면
 * 마운트되며 CSS 키프레임으로 페이드 + 위로 슬라이드 진입.
 * (useState/useEffect 없이 CSS animation 한 번만)
 * ────────────────────────────────────────────────────────── */
function Reveal({
  show,
  children,
}: {
  show: boolean;
  children: React.ReactNode;
}) {
  if (!show) return null;
  return <div className="ncb-reveal-fade">{children}</div>;
}

/* ──────────────────────────────────────────────────────────
 * 서브: 신념 진행 상태바 (워크샵 헤더는 외부 페이지에서 이미 렌더되므로
 * 여기서는 신념 3개의 sub-progress + 저장 뱃지만 표기)
 * ────────────────────────────────────────────────────────── */
function SubProgress({
  saveStatus,
  currentIdx,
  phase,
  total,
}: {
  saveStatus: "idle" | "saving" | "saved";
  currentIdx: number;
  phase: NewBeliefData["phase"];
  total: number;
}) {
  const sub = phase === "allDone" ? total : phase === "qa" ? currentIdx : 0;
  return (
    <header
      style={{
        padding: "0 0 0",
        boxSizing: "border-box",
        maxWidth: COL,
        margin: "0 auto 0",
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
          BELIEFS
        </Mono>
        <div style={{ flex: 1, display: "flex", gap: 4 }}>
          {Array.from({ length: total }).map((_, i) => {
            const isCur = phase === "qa" && i === currentIdx;
            const isDone = i < sub;
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
            ? `${String(total).padStart(2, "0")} / ${String(total).padStart(
                2,
                "0"
              )}`
            : `${String(Math.min(currentIdx + 1, total)).padStart(
                2,
                "0"
              )} / ${String(total).padStart(2, "0")}`}
        </Mono>
      </div>
    </header>
  );
}

/* ──────────────────────────────────────────────────────────
 * 인트로 (3개 신념 미리보기 + 3-동그라미 도식 + CTA)
 * ────────────────────────────────────────────────────────── */
function Intro({
  beliefs,
  onStart,
  hasProgress,
}: {
  beliefs: BeliefAnswer[];
  onStart: () => void;
  hasProgress: boolean;
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
        앞에서 발견한{" "}
        {beliefs.length === 3 ? "세 가지" : `${beliefs.length}가지`} 신념을, 하나씩
        다시 마주봅니다.
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
        한 번에 하나의 신념만, 짧은 질문들을 통해 살펴봐요. 같은 상황 안에서 옛
        신념과 새 신념이 각각 어떤 결과를 만들어내는지 직접 비교하게 됩니다.
      </p>

      {/* 3개 신념 미리보기 */}
      <div
        style={{
          marginTop: 40,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {beliefs.map((b, i) => {
          const meta = SOURCE_META[b.source];
          return (
            <div
              key={b.source}
              style={{
                padding: "20px 0",
                borderTop: `1px solid ${T.hair}`,
                borderBottom:
                  i === beliefs.length - 1 ? `1px solid ${T.hair}` : "none",
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
                    fontSize: 18,
                    fontWeight: 700,
                    color: T.ink,
                    lineHeight: 1.45,
                    letterSpacing: "-0.012em",
                    textWrap:
                      "pretty" as React.CSSProperties["textWrap"],
                  }}
                >
                  {b.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3-동그라미 도식 — 사용자 요청대로 6단계 리스트를 3단계로 단순화 */}
      <ThreeStepDiagram />

      {/* CTA */}
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
          <span>{hasProgress ? "이어서 시작하기" : "시작하기"}</span>
          <span style={{ fontFamily: T.mono, fontSize: 14 }}>→</span>
        </button>
        <Mono size={10} color={T.text3}>
          총 ~10분 소요 · 자동 저장
        </Mono>
      </div>

      <div style={{ height: 80 }} />
    </section>
  );
}

/* 3개 동그라미가 가로선으로 이어지는 도식 */
function ThreeStepDiagram() {
  const steps: { num: string; title: string; sub: string }[] = [
    { num: "01", title: "옛 신념 마주보기", sub: "지금 얼마나 믿고 있는지, 어떤 결과로 이어졌는지" },
    { num: "02", title: "새 신념 고르기", sub: "균형 잡힌 후보를 골라요. 여러 개도 좋아요" },
    { num: "03", title: "결과 비교하기", sub: "같은 상황, 새 신념일 때의 나는 어떻게 반응할까" },
  ];

  return (
    <div className="ncb-three-step" style={{ marginTop: 40 }}>
      <Mono size={10} color={T.text3} tracking={0.14}>
        이렇게 진행됩니다
      </Mono>

      <div
        className="ncb-three-step-grid"
        style={{
          marginTop: 22,
          position: "relative",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 0,
          alignItems: "flex-start",
        }}
      >
        {/* 가로 연결선 — 동그라미 가운데 높이에 위치 */}
        <div
          aria-hidden
          className="ncb-three-step-line"
          style={{
            position: "absolute",
            top: 22, // 동그라미 지름 44px의 중앙
            left: "16.66%", // 첫 컬럼 중앙
            right: "16.66%", // 마지막 컬럼 중앙
            height: 1,
            background: T.hair,
            zIndex: 0,
          }}
        />

        {steps.map((s) => (
          <div
            key={s.num}
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "0 8px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: "50%",
                background: T.surface,
                border: `1.5px solid ${T.ink}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: T.mono,
                fontSize: 12,
                fontWeight: 700,
                color: T.ink,
                letterSpacing: "0.06em",
              }}
            >
              {s.num}
            </div>
            <div
              style={{
                marginTop: 14,
                fontSize: 15,
                fontWeight: 700,
                color: T.ink,
                letterSpacing: "-0.005em",
                lineHeight: 1.35,
              }}
            >
              {s.title}
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: 12.5,
                color: T.text2,
                lineHeight: 1.55,
                letterSpacing: "-0.003em",
                maxWidth: 200,
                textWrap: "pretty" as React.CSSProperties["textWrap"],
              }}
            >
              {s.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
 * 신념별 Q&A — 6단계 점진 공개
 * ────────────────────────────────────────────────────────── */
function BeliefQA({
  belief,
  idx,
  total,
  onChange,
  onComplete,
  onPrefetchNext,
}: {
  belief: BeliefAnswer;
  idx: number;
  total: number;
  onChange: (patch: Partial<BeliefAnswer>) => void;
  onComplete: () => void;
  /** Final reveal 시점에 다음 belief 시나리오를 prefetch하기 위한 콜백 */
  onPrefetchNext?: () => void;
}) {
  const set = (patch: Partial<BeliefAnswer>) => onChange(patch);

  const showStep2 = belief.old_strength != null;
  const showStep3 = showStep2 && (belief.old_outcome || "").trim().length > 4;

  const customChosen = (belief.chosen_options || []).includes("custom");
  const customValid =
    !customChosen || (belief.custom_option || "").trim().length > 3;
  const chosenValid =
    (belief.chosen_options || []).length > 0 && customValid;
  const showStep4 = showStep3 && chosenValid;

  const allStrengthsSet = (belief.chosen_options || []).every(
    (k) => belief.new_strengths?.[String(k)] != null
  );
  const showStep5 = showStep4 && allStrengthsSet;
  const showFinal = showStep5 && (belief.new_outcome || "").trim().length > 4;

  // Final reveal 직전(=showStep5 진입) 시점에 다음 belief의 시나리오를 prefetch.
  // 사용자가 step 5 textarea를 채우는 동안 wire 위에서 응답이 도착함.
  useEffect(() => {
    if (showStep5 && onPrefetchNext) onPrefetchNext();
  }, [showStep5, onPrefetchNext]);

  function toggleOption(key: number | "custom") {
    const cur = belief.chosen_options || [];
    const has = cur.includes(key);
    const next = has ? cur.filter((k) => k !== key) : [...cur, key];
    const newStrengths = { ...(belief.new_strengths || {}) };
    if (has) delete newStrengths[String(key)];
    set({ chosen_options: next, new_strengths: newStrengths });
  }
  function setStrength(key: number | "custom", v: number) {
    set({
      new_strengths: {
        ...(belief.new_strengths || {}),
        [String(key)]: v,
      },
    });
  }

  const chosenItems = (belief.chosen_options || []).map((k) => ({
    key: k,
    text: k === "custom" ? belief.custom_option || "" : belief.options[k] || "",
    strength: belief.new_strengths?.[String(k)] ?? 30,
  }));

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
          ● BELIEF · {String(idx).padStart(2, "0")} /{" "}
          {String(total).padStart(2, "0")}
        </Mono>
        <Mono size={9.5} color={T.text3} tracking={0.14}>
          {belief.classification_en}
        </Mono>
      </div>

      {/* STEP 0 — 신념 보여주기 */}
      <Step n={0} kicker="당신이 발견한 신념" sub="앞 단계에서 추출한 핵심 신념입니다.">
        <blockquote
          style={{
            margin: 0,
            padding: "0 0 0 18px",
            fontFamily: T.font,
            fontSize: 28,
            fontWeight: 700,
            color: T.ink,
            lineHeight: 1.3,
            letterSpacing: "-0.022em",
            textWrap: "balance" as React.CSSProperties["textWrap"],
            borderLeft: `2px solid ${T.ink}`,
          }}
        >
          “{belief.text}”
        </blockquote>
        <div
          style={{
            marginTop: 14,
            fontFamily: T.mono,
            fontSize: 10,
            color: T.text3,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          분류 · {belief.classification}
        </div>
      </Step>

      {/* STEP 1 — 옛 강도 */}
      <Step
        n={1}
        kicker="얼마나 믿고 있나요?"
        sub="지금 이 순간, 이 신념을 얼마나 믿고 있는지 가늠해보세요."
      >
        <StrengthSlider
          value={belief.old_strength ?? 50}
          dirty={belief.old_strength != null}
          tone="ink"
          onChange={(v) => set({ old_strength: v })}
        />
      </Step>

      {/* STEP 2 — 옛 결과 (영역 분리: 상황/결과) */}
      <Reveal show={showStep2}>
        <Step
          n={2}
          kicker="이 신념을 계속 믿는다면"
          sub="아래 상황은 이 신념이 가장 강하게 작동하는 가상의 장면이에요. 이 상황에서 신념대로 행동한다면 어떤 결과가 따라올 것 같나요?"
        >
          <SectionCard label="SITUATION" tone="neutral">
            <SituationBody loading={!belief.situation}>
              {belief.situation}
            </SituationBody>
          </SectionCard>

          <SectionCard label="MY RESPONSE · 결과 적기" tone="input">
            <Field
              value={belief.old_outcome}
              onChange={(v) => set({ old_outcome: v })}
              placeholder={
                belief.old_outcome_hint ||
                "예) 이 생각으로 인해 어떤 행동을 하게 되거나, 어떤 일을 하지 않게 될지 떠오르는 대로 적어보세요."
              }
              rows={4}
              flush
            />
            <MinCharHint value={belief.old_outcome} min={5} tone="ink" />
          </SectionCard>
        </Step>
      </Reveal>

      {/* STEP 3 — 새 신념 다중 선택 */}
      <Reveal show={showStep3}>
        <Step
          n={3}
          kicker="이 신념 대신 갖고 싶은 신념을 한 번 골라 보세요"
          sub="여러 개를 함께 골라도 좋아요. 마음에 드는 표현이 없다면 직접 써도 좋습니다."
        >
          <Options
            options={belief.options}
            chosen={belief.chosen_options || []}
            onToggle={toggleOption}
            customValue={belief.custom_option}
            onCustomChange={(v) => set({ custom_option: v })}
          />
        </Step>
      </Reveal>

      {/* STEP 4 — 고른 신념별 강도 */}
      <Reveal show={showStep4}>
        <Step
          n={4}
          kicker={
            chosenItems.length > 1
              ? "고른 신념들은 각각 얼마나 믿어지나요?"
              : "새 신념은 얼마나 믿어지나요?"
          }
          sub="처음에는 낮은 게 자연스러워요. 지금 느껴지는 만큼만 솔직하게."
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {chosenItems.map((it, i) => (
              <PerOptionStrength
                key={String(it.key)}
                index={i + 1}
                total={chosenItems.length}
                text={it.text}
                value={belief.new_strengths?.[String(it.key)] ?? 30}
                dirty={belief.new_strengths?.[String(it.key)] != null}
                onChange={(v) => setStrength(it.key, v)}
              />
            ))}
          </div>
        </Step>
      </Reveal>

      {/* STEP 5 — 새 결과 (영역 3개로 분명히 분리: 상황/신념/결과) */}
      <Reveal show={showStep5}>
        <Step
          n={5}
          kicker="새로운 신념을 장착한다면"
          sub="같은 상황에 만약 위에서 고른 신념을 핵심 신념으로 장착했다면, 나는 어떻게 반응하고 어떤 결과가 만들어질까요?"
        >
          <SectionCard label="SITUATION" tone="neutral">
            <SituationBody loading={!belief.situation}>
              {belief.situation}
            </SituationBody>
          </SectionCard>

          {chosenItems.length > 0 && (
            <SectionCard
              label={`BELIEF · 고른 새 신념 ${chosenItems.length}개`}
              tone="accent"
            >
              <ChosenStackInline items={chosenItems} />
            </SectionCard>
          )}

          <SectionCard label="MY RESPONSE · 결과 적기" tone="input">
            <Field
              value={belief.new_outcome}
              onChange={(v) => set({ new_outcome: v })}
              placeholder={
                belief.new_outcome_hint ||
                "예) 이 신념을 가진 내가 같은 상황에서 어떻게 다르게 반응하고 어떤 작은 행동을 하게 될지 떠올려 보세요."
              }
              rows={4}
              accent
              flush
            />
            <MinCharHint value={belief.new_outcome} min={5} tone="accent" />
          </SectionCard>
        </Step>
      </Reveal>

      {/* FINAL — 비교 카드 */}
      <Reveal show={showFinal}>
        <Final
          situation={belief.situation}
          oldText={belief.text}
          oldStrength={belief.old_strength}
          chosenItems={chosenItems}
          oldOutcome={belief.old_outcome}
          newOutcome={belief.new_outcome}
          isLast={idx === total}
          onContinue={onComplete}
        />
      </Reveal>

      <div style={{ height: 120 }} />
    </section>
  );
}

/* ──────────────────────────────────────────────────────────
 * Step 컨테이너
 * ────────────────────────────────────────────────────────── */
function Step({
  n,
  kicker,
  sub,
  children,
}: {
  n: number;
  kicker: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        paddingTop: 44,
        paddingBottom: 4,
        borderTop: n === 0 ? "none" : `1px solid ${T.hair}`,
        marginTop: n === 0 ? 28 : 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 14,
          marginBottom: 14,
        }}
      >
        <span
          style={{
            fontFamily: T.mono,
            fontSize: 44,
            fontWeight: 700,
            color: T.text4,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            minWidth: 48,
          }}
        >
          0{n}
        </span>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              margin: 0,
              fontFamily: T.font,
              fontWeight: 700,
              fontSize: 24,
              color: T.ink,
              letterSpacing: "-0.02em",
              lineHeight: 1.3,
              textWrap: "balance" as React.CSSProperties["textWrap"],
            }}
          >
            {kicker}
          </h3>
          {sub && (
            <p
              style={{
                margin: "6px 0 0",
                fontSize: 14,
                color: T.text2,
                lineHeight: 1.6,
                letterSpacing: "-0.003em",
                textWrap: "pretty" as React.CSSProperties["textWrap"],
              }}
            >
              {sub}
            </p>
          )}
        </div>
      </div>
      <div className="ncb-step-body" style={{ paddingLeft: 62 }}>
        {children}
      </div>
    </div>
  );
}

/* SectionCard — 영역(상황/신념/결과)을 시각적으로 분명히 분리하는 카드 박스
   compact: true일 때 자체 marginBottom을 죽인다. Final처럼 박스 사이에
   FlowArrow가 spacing을 책임지는 구조에서 사용. */
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
      : { bg: "var(--wb-surface2)", border: T.hair, labelColor: T.text3 };
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

/* MinCharHint — textarea 아래에 두는 진행 안내.
   사용자가 짧게 적었을 때 "왜 다음 단계가 안 펼쳐지는지"를 명확히 알리고,
   임계를 넘으면 ✓ 체크로 통과 신호를 준다. */
function MinCharHint({
  value,
  min,
  tone = "ink",
}: {
  value: string;
  min: number;
  tone?: "ink" | "accent";
}) {
  const len = (value || "").trim().length;
  const ok = len >= min;
  const fill = tone === "accent" ? T.accent : T.ink;
  return (
    <div
      style={{
        marginTop: 10,
        paddingTop: 8,
        borderTop: `1px dashed ${T.hair2}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        fontFamily: T.mono,
        fontSize: 10,
        letterSpacing: "0.04em",
      }}
    >
      <span style={{ color: ok ? fill : T.text3 }}>
        {ok ? "✓ 다음 단계가 펼쳐져요" : `최소 ${min}자 이상 작성해 주세요`}
      </span>
      <span style={{ color: ok ? fill : T.text3, fontWeight: 600 }}>
        {len} / {min}+
      </span>
    </div>
  );
}

/* FlowArrow — 박스(SectionCard) 사이에 끼워서 인과 흐름을 시각화.
   상황 → 신념 → 결과가 도미노처럼 이어진다는 느낌만 가볍게.
   캡션 없이 작은 화살표 + 컴팩트 패딩. */
function FlowArrow() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 0",
      }}
      aria-hidden
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path
          d="M6 1 V 10 M2.5 7.5 L6 11 L9.5 7.5"
          stroke={T.text3}
          strokeWidth="1.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/* SituationBody — SectionCard 안에 들어가는 시나리오 본문 (또는 로딩 스켈레톤) */
function SituationBody({
  children,
  loading,
}: {
  children: React.ReactNode;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
        aria-label="이 신념이 가장 강하게 작동하는 장면을 만드는 중"
      >
        <div
          style={{
            height: 14,
            borderRadius: 4,
            background: T.hair2,
            width: "78%",
          }}
        />
        <div
          style={{
            height: 14,
            borderRadius: 4,
            background: T.hair2,
            width: "62%",
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
          이 신념이 가장 강하게 작동하는 장면을 그려보고 있어요…
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        fontSize: 15,
        fontWeight: 500,
        color: T.text,
        lineHeight: 1.65,
        letterSpacing: "-0.005em",
        textWrap: "pretty" as React.CSSProperties["textWrap"],
      }}
    >
      {children}
    </div>
  );
}

/* ChosenStackInline — SectionCard 안에 박스 외곽선 없이 들어가는 신념 리스트 */
function ChosenStackInline({
  items,
}: {
  items: { key: number | "custom"; text: string; strength: number }[];
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((it, i) => (
        <div
          key={String(it.key)}
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            gap: 10,
            alignItems: "baseline",
          }}
        >
          <span
            style={{
              fontFamily: T.mono,
              fontSize: 10,
              color: T.text3,
              letterSpacing: "0.1em",
            }}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <div
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: T.ink,
              lineHeight: 1.55,
              letterSpacing: "-0.005em",
              textWrap: "pretty" as React.CSSProperties["textWrap"],
            }}
          >
            {it.text}
          </div>
          <Mono size={10} color={T.accent}>
            {it.strength}%
          </Mono>
        </div>
      ))}
    </div>
  );
}

function Field({
  value,
  onChange,
  placeholder,
  rows = 3,
  accent = false,
  flush = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  accent?: boolean;
  /** SectionCard 안에 들어갈 때 자체 padding/border-bottom을 제거 */
  flush?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%",
        boxSizing: "border-box",
        padding: flush ? 0 : "14px 0",
        border: "none",
        borderBottom: flush
          ? "none"
          : `1.5px solid ${accent ? T.accent : T.ink}`,
        fontFamily: T.font,
        fontSize: 16,
        color: T.ink,
        letterSpacing: "-0.005em",
        lineHeight: 1.65,
        resize: "none",
        background: "transparent",
        outline: "none",
        fontWeight: 500,
      }}
    />
  );
}

/* ──────────────────────────────────────────────────────────
 * 강도 슬라이더
 * ────────────────────────────────────────────────────────── */
function StrengthSlider({
  value,
  dirty,
  tone,
  onChange,
}: {
  value: number;
  dirty: boolean;
  tone: "ink" | "accent";
  onChange: (v: number) => void;
}) {
  const fill = tone === "accent" ? T.accent : T.ink;
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
          강도
        </Mono>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span
            style={{
              fontFamily: T.mono,
              fontSize: 36,
              fontWeight: 700,
              color: dirty ? T.ink : T.text4,
              letterSpacing: "-0.025em",
              lineHeight: 1,
              transition: "color .25s",
            }}
          >
            {value}
          </span>
          <span
            style={{
              fontFamily: T.mono,
              fontSize: 14,
              color: T.text3,
            }}
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
              background: dirty ? fill : T.text4,
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
          className={`ncb-range ${
            tone === "accent" ? "ncb-range-accent" : "ncb-range-ink"
          }`}
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
        <span>0 · 전혀 안 믿음</span>
        <span>100 · 완전히 믿음</span>
      </div>
    </div>
  );
}

function PerOptionStrength({
  index,
  total,
  text,
  value,
  dirty,
  onChange,
}: {
  index: number;
  total: number;
  text: string;
  value: number;
  dirty: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <Mono size={9.5} color={T.accent} tracking={0.14}>
          ● 신념 {String(index).padStart(2, "0")} /{" "}
          {String(total).padStart(2, "0")}
        </Mono>
      </div>
      <div
        style={{
          marginBottom: 14,
          paddingBottom: 12,
          fontSize: 15.5,
          fontWeight: 600,
          color: T.ink,
          lineHeight: 1.55,
          letterSpacing: "-0.008em",
          textWrap: "pretty" as React.CSSProperties["textWrap"],
          borderBottom: `1px dashed ${T.hair}`,
        }}
      >
        {text}
      </div>
      <StrengthSlider value={value} dirty={dirty} tone="accent" onChange={onChange} />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
 * 새 신념 다중 선택
 * ────────────────────────────────────────────────────────── */
function Options({
  options,
  chosen,
  onToggle,
  customValue,
  onCustomChange,
}: {
  options: string[];
  chosen: Array<number | "custom">;
  onToggle: (key: number | "custom") => void;
  customValue: string;
  onCustomChange: (v: string) => void;
}) {
  const customChecked = chosen.includes("custom");
  const optionsLoading = options.length === 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {optionsLoading && (
        <div
          style={{
            padding: "16px 18px",
            border: `1px dashed ${T.hair}`,
            borderRadius: 14,
            color: T.text3,
            fontSize: 13,
            lineHeight: 1.6,
            background: "transparent",
          }}
        >
          균형 잡힌 새 신념 후보를 만들고 있어요…{" "}
          <span style={{ color: T.text4 }}>
            잠시 후 후보가 나타나요. 직접 쓰기로 먼저 시작해도 좋아요.
          </span>
        </div>
      )}

      {options.map((o, i) => {
        const isPicked = chosen.includes(i);
        return (
          <button
            key={i}
            onClick={() => onToggle(i)}
            style={{
              fontFamily: T.font,
              textAlign: "left",
              cursor: "pointer",
              background: isPicked ? T.accentTint : "transparent",
              border: `1.5px solid ${isPicked ? T.accent : T.hair}`,
              borderRadius: 14,
              padding: "16px 18px",
              display: "grid",
              gridTemplateColumns: "24px 1fr",
              gap: 14,
              alignItems: "flex-start",
              transition: "all .18s",
            }}
            onMouseEnter={(e) => {
              if (!isPicked) e.currentTarget.style.borderColor = T.text2;
            }}
            onMouseLeave={(e) => {
              if (!isPicked) e.currentTarget.style.borderColor = T.hair;
            }}
          >
            <CheckBox checked={isPicked} />
            <div>
              <Mono
                size={9.5}
                color={isPicked ? T.accent : T.text3}
                tracking={0.14}
              >
                OPTION {String.fromCharCode(65 + i)}
              </Mono>
              <div
                style={{
                  marginTop: 4,
                  fontSize: 15,
                  fontWeight: 500,
                  color: T.ink,
                  lineHeight: 1.55,
                  letterSpacing: "-0.005em",
                  textWrap: "pretty" as React.CSSProperties["textWrap"],
                }}
              >
                {o}
              </div>
            </div>
          </button>
        );
      })}

      {/* 직접 쓰기 */}
      <div
        style={{
          marginTop: 4,
          padding: "14px 18px",
          border: `1.5px solid ${customChecked ? T.accent : T.hair}`,
          background: customChecked ? T.accentTint : "transparent",
          borderRadius: 14,
          transition: "all .18s",
          display: "grid",
          gridTemplateColumns: "24px 1fr",
          gap: 14,
          alignItems: "flex-start",
        }}
      >
        <button
          onClick={() => onToggle("custom")}
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
            width: 24,
            height: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >
          <CheckBox checked={customChecked} />
        </button>
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}
          >
            <Mono
              size={9.5}
              color={customChecked ? T.accent : T.text3}
              tracking={0.14}
            >
              ✎ 직접 쓰기
            </Mono>
          </div>
          <textarea
            value={customValue || ""}
            onChange={(e) => onCustomChange(e.target.value)}
            placeholder="나만의 균형잡힌 신념을 한 문장으로 적어보세요."
            rows={2}
            onFocus={() => {
              if (!customChecked) onToggle("custom");
            }}
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: 0,
              border: "none",
              fontFamily: T.font,
              fontSize: 15,
              color: T.ink,
              letterSpacing: "-0.005em",
              lineHeight: 1.6,
              resize: "none",
              background: "transparent",
              outline: "none",
              fontWeight: 500,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      style={{
        width: 22,
        height: 22,
        borderRadius: 6,
        marginTop: 1,
        border: `1.5px solid ${checked ? T.accent : T.hair}`,
        background: checked ? T.accent : "transparent",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all .18s",
        boxShadow: checked ? `0 0 0 4px ${T.accentSoft}` : "none",
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
 * Final — 신념 1개 마무리
 *   세 덩어리로 분명히 구분: SITUATION / BELIEF(OLD→NEW) / OUTCOME(OLD→NEW)
 *   + 마무리 멘트 ("한 번에 장착되는 건 어렵지만…")
 * ────────────────────────────────────────────────────────── */
function Final({
  situation,
  oldText,
  oldStrength,
  chosenItems,
  oldOutcome,
  newOutcome,
  isLast,
  onContinue,
}: {
  situation: string;
  oldText: string;
  oldStrength: number | null;
  chosenItems: { key: number | "custom"; text: string; strength: number }[];
  oldOutcome: string;
  newOutcome: string;
  isLast: boolean;
  onContinue: () => void;
}) {
  return (
    <div
      style={{
        marginTop: 56,
        paddingTop: 36,
        borderTop: `2px solid ${T.ink}`,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 18,
        }}
      >
        <Mono size={10} color={T.accent} tracking={0.18}>
          ● BELIEF SHIFT · COMPLETE
        </Mono>
        <div style={{ flex: 1, height: 1, background: T.hair }} />
      </div>

      <h3
        style={{
          margin: 0,
          fontFamily: T.font,
          fontWeight: 700,
          fontSize: 26,
          color: T.ink,
          letterSpacing: "-0.02em",
          lineHeight: 1.3,
          textWrap: "balance" as React.CSSProperties["textWrap"],
        }}
      >
        같은 상황, 같은 나 — 신념을 바꾸면.
      </h3>

      <div
        style={{
          marginTop: 28,
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        {/* ── 1. SITUATION ── */}
        {situation && (
          <>
            <SectionCard label="SITUATION · 같은 상황" tone="neutral" compact>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: T.text,
                  lineHeight: 1.65,
                  letterSpacing: "-0.005em",
                  textWrap: "pretty" as React.CSSProperties["textWrap"],
                }}
              >
                {situation}
              </div>
            </SectionCard>
            <FlowArrow />
          </>
        )}

        {/* ── 2. BELIEF — 좌(OLD) / 우(NEW) 2열 비포/애프터
            그룹 라벨을 따로 두지 않고 첫 ShiftRow 라벨에 합쳐서
            OLD와 NEW의 % / 프로그레스 바 / 본문 라인을 정확히 정렬한다. ── */}
        <SectionCard label="BELIEF · 신념 변화" tone="neutral" compact>
          <div
            className="ncb-shift-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
              alignItems: "flex-start",
            }}
          >
            <ShiftRow
              label="OLD"
              tone="ink"
              strengthValue={oldStrength ?? 0}
              beliefText={oldText}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              {chosenItems.map((it, i) => {
                const isFirst = i === 0;
                const idxLabel = `신념 ${String(i + 1).padStart(2, "0")}`;
                const label = isFirst
                  ? chosenItems.length === 1
                    ? "NEW"
                    : `NEW · ${idxLabel}`
                  : idxLabel;
                return (
                  <ShiftRow
                    key={String(it.key)}
                    label={label}
                    tone="accent"
                    strengthValue={it.strength}
                    beliefText={it.text}
                  />
                );
              })}
            </div>
          </div>
        </SectionCard>

        <FlowArrow />

        {/* ── 3. OUTCOME — 좌(OLD) / 우(NEW) 2열 비포/애프터 ── */}
        <SectionCard label="OUTCOME · 결과 변화" tone="neutral" compact>
          <div
            className="ncb-shift-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 24,
              alignItems: "flex-start",
            }}
          >
            <OutcomeRow tone="ink" label="OLD · 옛 신념대로일 때" text={oldOutcome} />
            <OutcomeRow
              tone="accent"
              label="NEW · 새 신념을 장착했다면"
              text={newOutcome}
            />
          </div>
        </SectionCard>
      </div>

      <div
        style={{
          marginTop: 36,
          paddingTop: 22,
          borderTop: `1px solid ${T.hair}`,
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <button
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
            cursor: "pointer",
            letterSpacing: "-0.005em",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            boxShadow: "0 8px 20px -8px rgba(0,0,0,0.3)",
          }}
        >
          <span>{isLast ? "완료 · 다음 단계로 →" : "다음 신념으로 →"}</span>
        </button>
        {!isLast && (
          <Mono size={10} color={T.text3}>
            나머지 신념도 같은 흐름으로 이어갑니다
          </Mono>
        )}
      </div>
    </div>
  );
}

/* ShiftRow — 강도 바 + 신념 본문 한 행 */
function ShiftRow({
  label,
  tone,
  strengthValue,
  beliefText,
}: {
  label: string;
  tone: "ink" | "accent";
  strengthValue: number;
  beliefText: string;
}) {
  const fill = tone === "accent" ? T.accent : T.ink;
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 6,
        }}
      >
        <Mono size={10} color={tone === "accent" ? T.accent : T.text3} tracking={0.14}>
          {label}
        </Mono>
        <span
          style={{
            fontFamily: T.mono,
            fontSize: 12,
            color: T.text2,
            fontWeight: 600,
          }}
        >
          {strengthValue}
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
          marginBottom: 10,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: `${strengthValue}%`,
            background: fill,
            borderRadius: 2,
          }}
        />
      </div>
      <div
        style={{
          fontSize: 15.5,
          color: T.ink,
          lineHeight: 1.5,
          letterSpacing: "-0.005em",
          textWrap: "pretty" as React.CSSProperties["textWrap"],
          fontWeight: 600,
        }}
      >
        {beliefText}
      </div>
    </div>
  );
}

/* OutcomeRow — 결과 한 행 (라벨 + 본문) */
function OutcomeRow({
  tone,
  label,
  text,
}: {
  tone: "ink" | "accent";
  label: string;
  text: string;
}) {
  const labelColor = tone === "accent" ? T.accent : T.text3;
  return (
    <div>
      <Mono size={10} color={labelColor} tracking={0.14}>
        {tone === "accent" ? "● " : ""}
        {label}
      </Mono>
      <div
        style={{
          marginTop: 8,
          fontSize: 15,
          color: T.text,
          lineHeight: 1.7,
          letterSpacing: "-0.003em",
          textWrap: "pretty" as React.CSSProperties["textWrap"],
          fontWeight: tone === "accent" ? 600 : 500,
        }}
      >
        {text || (
          <span style={{ color: T.text4 }}>(작성 안 함)</span>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
 * AllDone — 전체 신념 요약 + 다음 단계 CTA
 * ────────────────────────────────────────────────────────── */
function AllDone({
  beliefs,
  onRestart,
  onContinue,
  submitting,
  error,
}: {
  beliefs: BeliefAnswer[];
  onRestart: () => void;
  onContinue: () => void;
  submitting: boolean;
  error: string;
}) {
  const completedCount = useMemo(
    () => beliefs.filter(isBeliefAnswerComplete).length,
    [beliefs]
  );

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
          fontSize: TS.h1,
          lineHeight: 1.2,
          letterSpacing: "-0.025em",
          color: T.ink,
          textWrap: "balance" as React.CSSProperties["textWrap"],
        }}
      >
        {completedCount === beliefs.length
          ? `${beliefs.length === 3 ? "세" : beliefs.length} 가지 신념을 모두 다시 보았어요.`
          : "여기까지 마주본 신념을 정리했어요."}
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
        새로 고른 신념은 하루에 단단해지지 않습니다. 며칠, 몇 주에 걸쳐 작은
        증거를 쌓아갈 때 비로소 일상 안에 자리잡습니다.
      </p>
      <p
        style={{
          margin: "16px 0 0",
          fontSize: TS.body,
          lineHeight: 1.7,
          color: T.text2,
          maxWidth: 600,
          letterSpacing: "-0.005em",
        }}
      >
        다음 단계에서는 이 신념을{" "}
        <b style={{ color: T.ink }}>떠받칠 작은 증거들</b>을 함께 길어 올려요.
        과거의 한 장면, 친구에게 건넬 한 마디, 오늘 일어난 작은 사실 — 신념
        옆에 놓을 카드를 한 장씩 모아갑니다.
      </p>

      <div
        style={{
          marginTop: 36,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {beliefs.map((b, i) => {
          const items = (b.chosen_options || []).map((k) => ({
            key: k,
            text: k === "custom" ? b.custom_option || "" : b.options[k] || "",
          }));
          const meta = SOURCE_META[b.source];
          return (
            <div
              key={b.source}
              style={{
                padding: "20px 0",
                borderTop: `1px solid ${T.hair}`,
                borderBottom:
                  i === beliefs.length - 1 ? `1px solid ${T.hair}` : "none",
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
                    fontSize: 14.5,
                    color: T.text2,
                    lineHeight: 1.5,
                    letterSpacing: "-0.005em",
                    textWrap: "pretty" as React.CSSProperties["textWrap"],
                    textDecoration: "line-through",
                    textDecorationColor: T.text4,
                  }}
                >
                  {b.text}
                </div>
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {items.map((it) => (
                    <div
                      key={String(it.key)}
                      style={{
                        paddingLeft: 12,
                        borderLeft: `2px solid ${T.accent}`,
                        fontSize: 15,
                        fontWeight: 600,
                        color: T.ink,
                        lineHeight: 1.55,
                        letterSpacing: "-0.005em",
                        textWrap:
                          "pretty" as React.CSSProperties["textWrap"],
                      }}
                    >
                      {it.text}
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div style={{ fontSize: 13, color: T.text4 }}>
                      (고른 신념 없음)
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
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
          marginTop: 48,
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
            {submitting ? "저장 중…" : "새 신념 강화하러 가기"}
          </span>
          {!submitting && (
            <span style={{ fontFamily: T.mono, fontSize: 14 }}>→</span>
          )}
        </button>
        <button
          onClick={onRestart}
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
          ↻ 처음부터 다시 하기
        </button>
      </div>

      <div style={{ height: 100 }} />
    </section>
  );
}
