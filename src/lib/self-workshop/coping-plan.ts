/**
 * SOLUTION · 2단계: 새 핵심 신념 떠받치기 (Step 9 — Stage 09)
 *
 * Step 8에서 사용자가 고른 새 핵심 신념을 *살아있는 작은 증거*로 떠받치는 실습.
 * 신념별로 LLM이 던지는 6 카테고리 유도 질문에 답하며 근거 카드를 누적한다.
 *
 * `coping_plan` 필드(JSONB)는 그대로 사용하고 내부 모양만 갈아끼운다.
 * 다운스트림(generate-summary) 호환을 위해 derived 필드를 함께 채워서 저장한다.
 */

import {
  type BeliefAnswer,
  type CoreBeliefSource,
  type NewBeliefData,
  joinChosenBeliefTexts,
} from "@/lib/self-workshop/new-belief";
import type { BeliefNarrativeReport } from "@/lib/self-workshop/belief-narrative-report";

/* ─────────────────── 상수 ─────────────────── */

export const SOURCE_META: Record<
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

export const EVIDENCE_CATEGORIES = [
  "past_evidence",
  "friend_metaphor",
  "small_daily",
  "third_person",
  "counter_example",
  "embodied",
] as const;

export type EvidenceCategory = (typeof EVIDENCE_CATEGORIES)[number];

export const CATEGORY_LABEL: Record<EvidenceCategory, string> = {
  past_evidence: "과거의 증거",
  friend_metaphor: "친구의 시선",
  small_daily: "오늘의 작은 사실",
  third_person: "제3자의 시선",
  counter_example: "옛 신념의 반례",
  embodied: "몸이 기억하는 순간",
};

export const CATEGORY_LABEL_EN: Record<EvidenceCategory, string> = {
  past_evidence: "PAST EVIDENCE",
  friend_metaphor: "FRIEND'S VIEW",
  small_daily: "SMALL DAILY",
  third_person: "THIRD PERSON",
  counter_example: "COUNTER EXAMPLE",
  embodied: "EMBODIED",
};

/**
 * LLM 응답이 형식을 만족하지 못했을 때 채워 넣을 폴백 질문.
 * 사용자가 인용한 톤("내가 실수해도 나를 지지해준 경험이 있나요?",
 * "사랑하는 친구가 같은 실수를 했다면 비판할 건가요?")을 표준으로 박는다.
 */
export const FALLBACK_QUESTIONS: Record<EvidenceCategory, string> = {
  past_evidence: "내가 실수해도 나를 지지해준 경험이 있나요?",
  friend_metaphor: "사랑하는 친구가 같은 실수를 했다면 비판할 건가요?",
  small_daily:
    "오늘 또는 이번 주에 이 신념이 살짝이라도 맞아 떨어진 작은 순간이 있었나요?",
  third_person: "10년 후의 내가 지금의 나를 본다면 무엇을 알아챌까요?",
  counter_example:
    "옛 신념이 항상 사실이었던 건 아니었던, 한 번의 반례가 떠오르나요?",
  embodied:
    "이 신념을 따라갔을 때 몸에서 작은 안도가 느껴졌던 순간이 있나요?",
};

/* ─────────────────── 타입 ─────────────────── */

export interface EvidenceQuestion {
  /** 안정적 슬러그 (예: "past_evidence_q1") — 답변과 짝지어 저장 */
  id: string;
  category: EvidenceCategory;
  /** 질문체 본문 — 신념체 어미는 인용된 신념 자체에만 */
  text: string;
}

export interface BeliefEvidenceEntry {
  source: CoreBeliefSource;
  /** 분류 라벨(한국어) */
  classification: string;
  /** 분류 라벨(영문) — 모노 메타 */
  classification_en: string;
  /** Step 8에서 고른 새 신념 본문(여러 개면 줄바꿈으로 합침) */
  new_belief_text: string;
  /** 옛 신념 — 대비 표기용 */
  old_belief_text: string;

  /** LLM이 신념 본문에 맞춰 생성한 4~6개의 유도 질문 */
  questions: EvidenceQuestion[];
  /** question.id → 답변 본문 */
  answers: Record<string, string>;
  /** 자유형 근거 카드 */
  free_evidence: string[];

  /** 작성 후 새 신념을 얼마나 단단하게 느끼는가 (0~100) */
  reinforced_strength: number | null;
  /** 이 신념의 흐름이 끝났는지 */
  done: boolean;
}

export interface CopingPlanV2 {
  /** 스키마 버전 식별 — generate-summary가 v1/v2 분기에 사용 */
  version: 2;
  /** 사용자가 강화 작업 대상으로 고른 축 */
  selected_sources: CoreBeliefSource[];
  /** 신념별 근거 모음 (selected_sources 순서) */
  entries: BeliefEvidenceEntry[];
  /** 진행 단계 */
  phase: "intro" | "select" | "writing" | "allDone";
  /** writing 페이즈에서의 활성 entry 인덱스 */
  current_idx: number;

  /* ── 다운스트림(generate-summary) 호환을 위한 derived 필드 ── */
  /** 모든 답변·자유 근거를 합친 본문. 옛 alternative_thought 자리. */
  alternative_thought: string;
  /** 모든 카테고리별 답변을 합친 본문. 옛 evidence_against 자리. */
  evidence_against: string;
  /** Step 8 신념 본문을 합친 스냅샷 */
  new_core_belief_snapshot: string;

  /** AllDone에서 보여줄 5단계 상담사 narrative 리포트 — coping_plan 안에 nested 캐시 */
  narrative_report?: BeliefNarrativeReport;
}

export const EMPTY_COPING_PLAN_V2: CopingPlanV2 = {
  version: 2,
  selected_sources: [],
  entries: [],
  phase: "intro",
  current_idx: 0,
  alternative_thought: "",
  evidence_against: "",
  new_core_belief_snapshot: "",
};

/* ─────────────────── 헬퍼 ─────────────────── */

/**
 * Step 8 결과(NewBeliefData)에서 entry 후보 배열을 만든다.
 * `chosen_options`가 비어있는 축은 제외(=Step 8에서 신념을 안 고른 축).
 */
export function buildEntriesFromNewBelief(
  newBelief: NewBeliefData | null
): BeliefEvidenceEntry[] {
  if (!newBelief?.beliefs?.length) return [];
  const entries: BeliefEvidenceEntry[] = [];
  for (const b of newBelief.beliefs) {
    const newText = joinChosenBeliefTexts(b);
    if (!newText) continue;
    const meta = SOURCE_META[b.source];
    entries.push({
      source: b.source,
      classification: meta.classification,
      classification_en: meta.classification_en,
      new_belief_text: newText,
      old_belief_text: b.text,
      questions: [],
      answers: {},
      free_evidence: [],
      reinforced_strength: null,
      done: false,
    });
  }
  return entries;
}

/** 한 entry의 작성이 의미 있게 끝났는가 — 답변 2개 이상 + 강도 슬라이더 터치 */
export function isEntryComplete(entry: BeliefEvidenceEntry): boolean {
  const filledAnswers = Object.values(entry.answers || {}).filter(
    (s) => typeof s === "string" && s.trim().length > 4
  ).length;
  if (filledAnswers < 2) return false;
  if (entry.reinforced_strength == null) return false;
  return true;
}

/**
 * 모든 entry의 답변·자유 근거를 합쳐 generate-summary가 읽는 derived 필드를 만든다.
 * - alternative_thought: 신념별 답변/근거 본문 모음 (주된 요약 인용 자리)
 * - evidence_against: 카테고리별 답변 모음 (카테고리 라벨로 그루핑)
 * - new_core_belief_snapshot: 모든 신념 본문 합침
 */
export function deriveSummaryFields(entries: BeliefEvidenceEntry[]): {
  alternative_thought: string;
  evidence_against: string;
  new_core_belief_snapshot: string;
} {
  const altLines: string[] = [];
  const evidLines: string[] = [];
  const beliefLines: string[] = [];

  for (const e of entries) {
    if (e.new_belief_text.trim()) {
      beliefLines.push(`[${e.classification}] ${e.new_belief_text.replace(/\n/g, " / ")}`);
    }

    const answersByCat: string[] = [];
    for (const q of e.questions) {
      const ans = (e.answers?.[q.id] || "").trim();
      if (!ans) continue;
      const catLabel = CATEGORY_LABEL[q.category] ?? q.category;
      answersByCat.push(`  · [${catLabel}] ${ans}`);
    }
    const freeLines = (e.free_evidence || [])
      .filter((s) => s && s.trim().length > 0)
      .map((s) => `  · [자유 근거] ${s.trim()}`);

    if (answersByCat.length > 0 || freeLines.length > 0) {
      altLines.push(`[${e.classification}] "${e.new_belief_text.replace(/\n/g, " / ")}"`);
      altLines.push(...answersByCat, ...freeLines);
      evidLines.push(`[${e.classification}]`);
      evidLines.push(...answersByCat);
    }
  }

  return {
    alternative_thought: altLines.join("\n"),
    evidence_against: evidLines.join("\n"),
    new_core_belief_snapshot: beliefLines.join("\n"),
  };
}

/**
 * 저장 페이로드를 만든다 — v2 본체 + derived + generate-summary v1 빌더용 legacy shim.
 * 이걸로 다운스트림은 v2 분기 없이도 alternative_thought/evidence_against를 자연스레 읽는다.
 */
export function buildPersistPayload(v2: CopingPlanV2): Record<string, unknown> {
  const derived = deriveSummaryFields(v2.entries);
  return {
    ...v2,
    ...derived,
    // v1 빌더 호환 shim
    cognitive_restructuring: {
      original_thought: "",
      cognitive_error_type: [],
      evidence_for: "",
      evidence_against: derived.evidence_against,
      alternative_thought: derived.alternative_thought,
      belief_rating: 0,
    },
    behavioral_experiment: {
      experiment_situation: "",
      prediction: "",
      prediction_belief: 0,
      coping_plan: "",
    },
    self_compassion: {
      self_compassion_letter: "",
      rest_permission: "",
      boundary_setting: "",
    },
  };
}

/**
 * 한 entry에 대해 LLM이 만든 questions를 정규화한다.
 * - 카테고리당 1개만 통과
 * - id가 비거나 중복이면 카테고리명_q1 식으로 부여
 * - 4개 미만이면 폴백으로 부족분 채움
 * - 정확히 4~6개로 잘라서 반환
 */
export function normalizeQuestionsWithFallback(
  raw: unknown
): EvidenceQuestion[] {
  const candidates = collectRawQuestions(raw);

  const seenCategories = new Set<EvidenceCategory>();
  const out: EvidenceQuestion[] = [];
  const usedIds = new Set<string>();

  for (const c of candidates) {
    const category = parseCategory(c.category);
    if (!category) continue;
    if (seenCategories.has(category)) continue;
    const text = typeof c.text === "string" ? c.text.trim() : "";
    if (!text) continue;

    let id =
      typeof c.id === "string" && c.id.trim().length > 0
        ? c.id.trim()
        : `${category}_q1`;
    let n = 1;
    while (usedIds.has(id)) {
      n += 1;
      id = `${category}_q${n}`;
    }
    usedIds.add(id);
    seenCategories.add(category);
    out.push({ id, category, text });
  }

  // 부족분을 폴백으로 — 카테고리가 모자라면 안 사용된 카테고리부터 채운다
  if (out.length < 4) {
    for (const cat of EVIDENCE_CATEGORIES) {
      if (out.length >= 4) break;
      if (seenCategories.has(cat)) continue;
      let id = `${cat}_q1`;
      let n = 1;
      while (usedIds.has(id)) {
        n += 1;
        id = `${cat}_q${n}`;
      }
      usedIds.add(id);
      seenCategories.add(cat);
      out.push({ id, category: cat, text: FALLBACK_QUESTIONS[cat] });
    }
  }

  return out.slice(0, 6);
}

/** 모든 카테고리가 빈 폴백을 그대로 반환 — LLM 완전 실패 시 사용 */
export function buildFullFallback(): EvidenceQuestion[] {
  return EVIDENCE_CATEGORIES.slice(0, 6).map((cat) => ({
    id: `${cat}_q1`,
    category: cat,
    text: FALLBACK_QUESTIONS[cat],
  }));
}

/* ─────────────────── 내부 유틸 ─────────────────── */

interface RawQuestion {
  id?: unknown;
  category?: unknown;
  text?: unknown;
}

function collectRawQuestions(raw: unknown): RawQuestion[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter((x): x is RawQuestion => !!x && typeof x === "object");
  }
  if (typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.questions)) {
    return obj.questions.filter(
      (x): x is RawQuestion => !!x && typeof x === "object"
    );
  }
  if (obj.questions && typeof obj.questions === "object") {
    return Object.values(obj.questions as Record<string, unknown>).filter(
      (x): x is RawQuestion => !!x && typeof x === "object"
    );
  }
  return [];
}

function parseCategory(raw: unknown): EvidenceCategory | null {
  if (typeof raw !== "string") return null;
  const lower = raw.trim().toLowerCase();
  for (const cat of EVIDENCE_CATEGORIES) {
    if (lower === cat || lower.includes(cat.replace("_", " ")) || lower.includes(cat)) {
      return cat;
    }
  }
  return null;
}

/* ─────────────────── BeliefAnswer 호환 (Step 9 진입 가드) ─────────────────── */

export function hasAnyChosenBelief(beliefs: BeliefAnswer[] | undefined): boolean {
  if (!beliefs?.length) return false;
  return beliefs.some((b) => joinChosenBeliefTexts(b).length > 0);
}
