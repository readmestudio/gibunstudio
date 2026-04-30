/**
 * SOFTEN · 1단계: 핵심 믿음 다시 보기
 *
 * 핸드오프(design-handoff_belief-verification.md v1.0) 기반 6스테이지 흐름.
 * RECOGNIZE → ORIGIN → EVIDENCE → PERSPECTIVE → SPECTRUM → REWRITE.
 *
 * 신념을 *부수는(destroy)* 게 아니라, *검증 가능한 가설(hypothesis)로 다시 보고*,
 * 양쪽 증거를 모으고, 더 정확한 버전으로 *업데이트*하는 흐름.
 *
 * 데이터는 기존 belief_destroy JSONB 컬럼 안에 belief_verification 서브키로 저장.
 * 레거시 4기법 데이터(triple_column 등)는 보존만, 신규 UI는 안 씀.
 */

import type { BeliefAnalysis } from "./core-belief-excavation";

/* ─────────────────────────── 기본 타입 ─────────────────────────── */

export type StageNumber = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Stage 02 INSIGHT / Stage 06 카드 카피 분기 키워드.
 * 핸드오프 §07 COPY DECK과 1:1 매칭.
 */
export type PrimaryKeyword =
  | "P0" // 조건부 자기 가치 (US, AS — 과도한 기준 / 인정 추구)
  | "P1" // 결함·실패 두려움 (DS, DI, PU)
  | "P2"; // 타인 신뢰 (ED, AB, MA, SI, EI)

/**
 * Stage 01 RECOGNIZE — *기분 다스리기(Mind Over Mood)*의 "상황·기분·생각 구분하기" 실습.
 *
 * 사용자가 자기 자료(자동사고, 감정 단어, 상황 묘사, 신념 라인 등)를 보고
 * 각각이 "상황 / 기분 / 생각" 중 어디에 해당하는지 분류한다.
 *
 * 의도: 신념 검증(Stage 03~06) 전에, *덩어리진 자기 진술을 세 컬럼으로 풀어내는*
 * 분리 도구를 먼저 익힌다. 그래야 신념과 감정·상황을 헷갈리지 않게 된다.
 */
export type StatementId =
  | "auto" // 자동사고 (Step 3)
  | "auto_alt" // Step 7의 original_automatic_thought (자동사고와 다를 때)
  | "emotion" // 감정 단어 (Step 3 emotions)
  | "emotion_alt" // Step 7의 original_emotion (있을 때)
  | "situation" // Step 3 recent_situation
  | "belief_line"
  | "belief_self"
  | "belief_others"
  | "belief_world";

/** "기분 다스리기" 실습의 3분류. */
export type ChoiceValue = "situation" | "emotion" | "thought";

/* ─────────────────────────── Stage별 데이터 ─────────────────────────── */

export interface RecognizeRound {
  statement_id: StatementId;
  statement_text: string;
  choice: ChoiceValue;
  answered_at: string;
}

export interface Stage01Recognize {
  rounds: RecognizeRound[];
}

export type OriginCheckId =
  | "family"
  | "school"
  | "work"
  | "peer"
  | "failure"
  | "single_remark"
  | "unknown";

export type GainCheckId =
  | "approval"
  | "safety"
  | "control"
  | "self_esteem"
  | "belonging"
  | "avoidance";

/** 신념 종류 키 — Stage 02는 dedup 후 살아남은 신념마다 따로 답변 받음 */
export type BeliefKey = "core" | "self" | "others" | "world";

/** 한 신념에 대한 기원 답변 1세트 — 단일 선택 + 펼쳐지는 follow-up */
export interface OriginEntry {
  /** 어디서부터 시작됐는지 — 단일 선택. "other"는 사용자 직접 입력. */
  origin_id?: OriginCheckId | "other";
  /** origin_id === "other"일 때 사용자가 적은 라벨 (한 줄) */
  origin_other_label?: string;
  /** Q2: "어떤 장면이 떠오르나요?" — 사람·상황·판단의 구체화 */
  scene_text?: string;
  /** Q3: "이 신념이 나를 어떤 사람으로 만들어주었나? 얻은 장점은?" — 정체성·이득 인정 */
  identity_text?: string;
}

export interface Stage02Origin {
  // [레거시 v1 — 자유 텍스트] 보존만, 신규 UI는 안 씀
  when_first_arose?: string;
  how_it_protected?: string;
  // [v2 — 다중 선택, v3에 의해 deprecated] 보존만
  origins?: OriginCheckId[];
  origin_other?: string;
  gains?: GainCheckId[];
  gain_other?: string;
  // [v3 — 신념별 반복: 각 신념마다 단일 선택 + follow-up]
  per_belief?: Partial<Record<BeliefKey, OriginEntry>>;
  skipped?: boolean;
}

/**
 * 한 신념에 대한 양쪽 증거 + AI 도움 사용 플래그.
 * 핸드오프 v2: 신념별 + phase별 분리 (BELIEF.CORE → support → counter → BELIEF.SELF → ...).
 */
export interface BeliefEvidenceEntry {
  belief_key: BeliefKey;
  support: string[]; // 다중 입력
  counter: string[];
  status: "pending" | "done";
  ai_used_support: boolean; // 신념×phase 조합당 1회
  ai_used_counter: boolean;
}

export interface Stage03Evidence {
  /** 신념별 진행 데이터 (Stage 02 buildOriginBeliefs와 1:1 매칭) */
  beliefs: BeliefEvidenceEntry[];
  /** 현재 작업 중인 신념 인덱스 (0~N-1, 또는 N=모두 완료) */
  active_index: number;
  /** 현재 phase: 'support' → 'counter' */
  active_phase: "support" | "counter";
  /** [레거시 v1] 단일 batch 형태 — 기존 사용자 데이터 보존만, 신규 UI는 안 씀 */
  supporting?: string[];
  counter?: string[];
  counter_skipped?: boolean;
}

export interface Stage04Perspective {
  friend_response?: string;
}

export interface Stage05Spectrum {
  bound_left?: string; // 0점 정의 ("가치가 전혀 없는 사람")
  bound_right?: string; // 100점 정의 ("가치가 완벽한 사람")
  self_value?: number; // 0–100
  loved_value?: number;
}

export type RewriteCardId = "soften" | "reframe" | "decouple";

export interface Stage06Rewrite {
  /** 선택된 카드들 — 다중 선택 가능 (조금이라도 동의되는 버전을 여러 개 골라도 됨) */
  chosen_cards?: RewriteCardId[];
  /** "어느 것도 동의 안됨" 분기에서 사용자가 직접 편집한 텍스트 — 단독 사용 */
  edited_text?: string;
  /** [레거시 v1] 단일 선택 — normalizeStage06에서 chosen_cards로 마이그레이션 */
  chosen_card?: RewriteCardId;
  chosen_text?: string;
  /** [레거시] 14일 리마인드 토글 — UI 제거됨, 데이터만 보존 */
  persist_to_home?: boolean;
  daily_reminder?: boolean;
}

/* ─────────────────────────── 통합 타입 ─────────────────────────── */

export interface BeliefVerificationData {
  current_stage: StageNumber;
  /** entry 시점 belief_line 스냅샷 (사용자가 Step 4에서 다시 작성해도 이 흐름은 진입 시점 신념을 다룬다) */
  input_belief_line: string;
  /** Stage 02/06 카피 분기 키 — entry 시점 belief_analysis 기반으로 한 번만 결정 */
  primary_keyword: PrimaryKeyword;
  stage_01_recognize?: Stage01Recognize;
  stage_02_origin?: Stage02Origin;
  stage_03_evidence?: Stage03Evidence;
  stage_04_perspective?: Stage04Perspective;
  stage_05_spectrum?: Stage05Spectrum;
  stage_06_rewrite?: Stage06Rewrite;
  completed_at?: string;
}

export const EMPTY_BELIEF_VERIFICATION: Pick<
  BeliefVerificationData,
  "current_stage"
> = {
  current_stage: 1,
};

/* ─────────────────────────── EMS → 키워드 매핑 ─────────────────────────── */

/**
 * core_belief_excavation.belief_analysis.dominant_schemas[0].ems_code 기반으로
 * Stage 02/06 카피 분기 키워드를 결정한다.
 *
 * Young 스키마 약어:
 * - P0(조건부 가치): US(Unrelenting Standards), AS(Approval Seeking)
 * - P1(결함·실패):   DS(Defectiveness), DI(Dependence/Incompetence), PU(Punitiveness)
 * - P2(타인 신뢰):   ED(Emotional Deprivation), AB(Abandonment), MA(Mistrust),
 *                   SI(Social Isolation), EI(Emotional Inhibition)
 *
 * 매핑 부재/입력 없음 시 P0 기본값 — 성취 중독 워크북 모집단에서 가장 흔함.
 */
export function derivePrimaryKeyword(
  beliefAnalysis: BeliefAnalysis | null | undefined
): PrimaryKeyword {
  const code = (
    beliefAnalysis?.dominant_schemas?.[0]?.ems_code ?? ""
  )
    .trim()
    .toUpperCase();

  if (code === "DS" || code === "DI" || code === "PU") return "P1";
  if (
    code === "ED" ||
    code === "AB" ||
    code === "MA" ||
    code === "SI" ||
    code === "EI"
  ) {
    return "P2";
  }
  return "P0";
}

/* ─────────────────────────── Stage 01 카드 빌더 ─────────────────────────── */

export interface RecognizeStatement {
  id: StatementId;
  /** 화면 노출 영문 모노 라벨 */
  monoLabel: string;
  /** 화면 노출 한글 라벨 */
  korLabel: string;
  /** 카드 본문 (큰 따옴표 인용) */
  text: string;
}

/**
 * Stage 01 분류 카드용 진술 목록.
 *
 * *기분 다스리기*의 "상황·기분·생각 구분" 실습 대상.
 * 사용자가 이전 단계에서 적은 자료(자동사고, 감정 단어들, 상황 묘사, 신념 라인)를
 * 카드 단위로 풀어내 각각 분류하게 한다.
 *
 * 순서 정책:
 *  1) 상황 본문 (recentSituation) — 사실에 가장 가까운 카드. 워밍업.
 *  2) 감정 단어들 (emotions) — 기분 카테고리의 정답에 가까움. 단, 사용자가 *생각*으로
 *     적은 감정 단어가 섞여 있을 수 있으므로 분류 의의 있음.
 *  3) 자동사고들 (auto, auto_alt) — *생각* 카테고리의 정답에 가까움.
 *  4) 핵심 신념 라인들 — 신념도 결국 *생각*임을 자각하게 하는 카드.
 *
 * - 빈 문장 자동 제외, 정규화 텍스트 기준 중복 제거.
 * - 감정 단어가 같은 단어로 두 번 들어오면 dedup.
 */
export function buildRecognizeStatements(input: {
  automaticThought: string;
  beliefLine: string;
  beliefAnalysis: BeliefAnalysis | null | undefined;
  /** Step 3 mechanism_analysis.recent_situation */
  recentSituation?: string;
  /** Step 3 mechanism_analysis.emotions_body.emotions — 감정 단어 배열 */
  emotions?: string[];
  /** Step 7 alternative_thought_simulation.original_automatic_thought (다를 때만 추가) */
  altAutomaticThought?: string;
  /** Step 7 alternative_thought_simulation.original_emotion (있을 때만) */
  altEmotion?: string;
}): RecognizeStatement[] {
  const items: RecognizeStatement[] = [];
  const seen = new Set<string>();

  const normalize = (s: string) =>
    s
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[.!?。!?]+$/g, "")
      .toLowerCase();

  const push = (
    id: StatementId,
    monoLabel: string,
    korLabel: string,
    raw: string | undefined | null
  ) => {
    const text = (raw ?? "").trim();
    if (!text) return;
    const key = normalize(text);
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ id, monoLabel, korLabel, text });
  };

  // 1) 상황 본문
  push("situation", "STMT.SITUATION", "상황 묘사", input.recentSituation);

  // 2) 감정 단어들 — 단어 단위로 한 카드씩
  if (Array.isArray(input.emotions)) {
    for (const word of input.emotions) {
      push("emotion", "STMT.EMOTION", "감정 단어", word);
    }
  }
  push("emotion_alt", "STMT.EMOTION", "감정 단어", input.altEmotion);

  // 3) 자동사고
  push("auto", "STMT.THOUGHT", "자동사고", input.automaticThought);
  push("auto_alt", "STMT.THOUGHT", "자동사고", input.altAutomaticThought);

  // 4) 신념 라인들 — 신념도 결국 생각의 한 형태임을 자각하는 카드
  push("belief_line", "STMT.BELIEF", "핵심 신념", input.beliefLine);
  push(
    "belief_self",
    "STMT.BELIEF",
    "자기에 대한 신념",
    input.beliefAnalysis?.belief_about_self
  );
  push(
    "belief_others",
    "STMT.BELIEF",
    "타인에 대한 신념",
    input.beliefAnalysis?.belief_about_others
  );
  push(
    "belief_world",
    "STMT.BELIEF",
    "세계에 대한 신념",
    input.beliefAnalysis?.belief_about_world
  );

  return items;
}

/* ─────────────────────────── Stage 02 신념 빌더 ─────────────────────────── */

export interface OriginBelief {
  key: BeliefKey;
  /** 모노 라벨 (예: BELIEF.CORE) */
  monoLabel: string;
  /** 한국어 라벨 (예: "핵심 신념") */
  korLabel: string;
  /** 신념 본문 */
  text: string;
}

/**
 * Stage 02에서 신념별 반복 작업할 신념 목록 생성.
 * 우선순위: core(belief_line) → self → others → world.
 *
 * - 빈 신념은 자동 제외.
 * - `synthesis.belief_line`이 보통 `belief_about_self`와 동일하므로 dedup 적용.
 *   먼저 들어간 core를 살리고 뒤따라오는 중복은 스킵.
 */
export function buildOriginBeliefs(input: {
  beliefLine: string;
  beliefAnalysis: BeliefAnalysis | null | undefined;
}): OriginBelief[] {
  const items: OriginBelief[] = [];
  const seen = new Set<string>();
  const normalize = (s: string) =>
    s
      .trim()
      .replace(/\s+/g, " ")
      .replace(/[.!?。!?]+$/g, "")
      .toLowerCase();

  const push = (
    key: BeliefKey,
    monoLabel: string,
    korLabel: string,
    raw: string | undefined | null
  ) => {
    const text = (raw ?? "").trim();
    if (!text) return;
    const k = normalize(text);
    if (seen.has(k)) return;
    seen.add(k);
    items.push({ key, monoLabel, korLabel, text });
  };

  push("core", "BELIEF.CORE", "핵심 신념", input.beliefLine);
  push(
    "self",
    "BELIEF.SELF",
    "자기에 대한 신념",
    input.beliefAnalysis?.belief_about_self
  );
  push(
    "others",
    "BELIEF.OTHERS",
    "타인에 대한 신념",
    input.beliefAnalysis?.belief_about_others
  );
  push(
    "world",
    "BELIEF.WORLD",
    "세계에 대한 신념",
    input.beliefAnalysis?.belief_about_world
  );

  return items;
}

/* ─────────────────────────── 진행 게이트 ─────────────────────────── */

/** Stage 01 완료 조건: 모든 라운드 응답 */
export function isStage01Complete(
  data: Stage01Recognize | undefined,
  totalRounds: number
): boolean {
  if (!data || totalRounds <= 0) return false;
  return data.rounds.length >= totalRounds;
}

/** Stage 03 진행 가능: 모든 신념이 done 상태일 때 */
export function canAdvanceFromStage03(
  data: Stage03Evidence | undefined
): boolean {
  if (!data || !Array.isArray(data.beliefs) || data.beliefs.length === 0) {
    return false;
  }
  return data.beliefs.every((b) => b.status === "done");
}

/** 빈 신념 진행 데이터 생성 — Stage 02의 buildOriginBeliefs() 결과로 시드 */
export function seedStage03Evidence(
  beliefs: OriginBelief[]
): Stage03Evidence {
  return {
    beliefs: beliefs.map((b) => ({
      belief_key: b.key,
      support: [""],
      counter: [""],
      status: "pending",
      ai_used_support: false,
      ai_used_counter: false,
    })),
    active_index: 0,
    active_phase: "support",
  };
}

/**
 * 기존 데이터 + 새 buildOriginBeliefs 결과를 머지.
 * 신념 목록 변동(추가/제거)이 있어도 매칭되는 belief_key의 데이터는 살림.
 */
export function reconcileStage03Evidence(
  data: Stage03Evidence | undefined,
  beliefs: OriginBelief[]
): Stage03Evidence {
  if (beliefs.length === 0) {
    return data ?? seedStage03Evidence([]);
  }
  const existingByKey = new Map<BeliefKey, BeliefEvidenceEntry>();
  if (data?.beliefs) {
    for (const e of data.beliefs) existingByKey.set(e.belief_key, e);
  }
  // [레거시 폴백] v1 단일 batch 데이터가 있으면 첫 신념의 support/counter로 1회 마이그레이션
  const legacySupporting =
    !data?.beliefs?.length && Array.isArray(data?.supporting)
      ? data.supporting
      : null;
  const legacyCounter =
    !data?.beliefs?.length && Array.isArray(data?.counter) ? data.counter : null;

  const nextEntries: BeliefEvidenceEntry[] = beliefs.map((b, i) => {
    const found = existingByKey.get(b.key);
    if (found) return found;
    if (i === 0 && (legacySupporting || legacyCounter)) {
      return {
        belief_key: b.key,
        support: legacySupporting && legacySupporting.length ? legacySupporting : [""],
        counter: legacyCounter && legacyCounter.length ? legacyCounter : [""],
        status: "pending",
        ai_used_support: false,
        ai_used_counter: false,
      };
    }
    return {
      belief_key: b.key,
      support: [""],
      counter: [""],
      status: "pending",
      ai_used_support: false,
      ai_used_counter: false,
    };
  });

  const activeIndex =
    typeof data?.active_index === "number" &&
    data.active_index >= 0 &&
    data.active_index <= nextEntries.length
      ? data.active_index
      : 0;

  const activePhase =
    data?.active_phase === "counter" ? "counter" : "support";

  return {
    beliefs: nextEntries,
    active_index: activeIndex,
    active_phase: activePhase,
    supporting: data?.supporting,
    counter: data?.counter,
    counter_skipped: data?.counter_skipped,
  };
}

/** Stage 05 진행 가능: 두 슬라이더 모두 한 번이라도 조작 (값이 정의됨) */
export function canAdvanceFromStage05(
  data: Stage05Spectrum | undefined
): boolean {
  if (!data) return false;
  return (
    typeof data.self_value === "number" && typeof data.loved_value === "number"
  );
}

/** Stage 06 완료 조건: 카드 1개 이상 선택했거나, 편집 텍스트가 있음 */
export function isStage06Complete(data: Stage06Rewrite | undefined): boolean {
  if (!data) return false;
  const hasCards =
    Array.isArray(data.chosen_cards) && data.chosen_cards.length > 0;
  const hasEdited =
    typeof data.edited_text === "string" && data.edited_text.trim().length > 0;
  // 레거시 단일 선택 데이터도 인정
  const hasLegacyCard = !!data.chosen_card;
  return hasCards || hasEdited || hasLegacyCard;
}

/* ─────────────────────────── 정규화/마이그레이션 ─────────────────────────── */

/**
 * DB에서 읽어온 belief_verification 데이터를 안전한 형태로 정규화.
 * 누락/타입 오염 시 빈 객체 또는 안전한 기본값으로.
 */
export function normalizeBeliefVerification(
  raw: unknown,
  fallback: { beliefLine: string; primaryKeyword: PrimaryKeyword }
): BeliefVerificationData {
  if (!raw || typeof raw !== "object") {
    return {
      current_stage: 1,
      input_belief_line: fallback.beliefLine,
      primary_keyword: fallback.primaryKeyword,
    };
  }
  const r = raw as Partial<BeliefVerificationData> & Record<string, unknown>;
  const stage =
    typeof r.current_stage === "number" &&
    r.current_stage >= 1 &&
    r.current_stage <= 6
      ? (r.current_stage as StageNumber)
      : 1;
  return {
    current_stage: stage,
    input_belief_line:
      typeof r.input_belief_line === "string" && r.input_belief_line
        ? r.input_belief_line
        : fallback.beliefLine,
    primary_keyword:
      r.primary_keyword === "P0" ||
      r.primary_keyword === "P1" ||
      r.primary_keyword === "P2"
        ? r.primary_keyword
        : fallback.primaryKeyword,
    stage_01_recognize: normalizeStage01(r.stage_01_recognize),
    stage_02_origin: normalizeStage02(r.stage_02_origin),
    stage_03_evidence: normalizeStage03(r.stage_03_evidence),
    stage_04_perspective: normalizeStage04(r.stage_04_perspective),
    stage_05_spectrum: normalizeStage05(r.stage_05_spectrum),
    stage_06_rewrite: normalizeStage06(r.stage_06_rewrite),
    completed_at:
      typeof r.completed_at === "string" ? r.completed_at : undefined,
  };
}

const STATEMENT_IDS: ReadonlyArray<StatementId> = [
  "auto",
  "auto_alt",
  "emotion",
  "emotion_alt",
  "situation",
  "belief_line",
  "belief_self",
  "belief_others",
  "belief_world",
];

const CHOICE_VALUES: ReadonlyArray<ChoiceValue> = [
  "situation",
  "emotion",
  "thought",
];

function normalizeStage01(v: unknown): Stage01Recognize | undefined {
  if (!v || typeof v !== "object") return undefined;
  const rounds = (v as { rounds?: unknown }).rounds;
  if (!Array.isArray(rounds)) return { rounds: [] };
  const cleaned: RecognizeRound[] = [];
  for (const r of rounds) {
    if (!r || typeof r !== "object") continue;
    const x = r as Partial<RecognizeRound>;
    // 옛 fact/interpretation 데이터는 새 실습으로 갈아끼웠으므로 드롭.
    if (!STATEMENT_IDS.includes(x.statement_id as StatementId)) continue;
    if (typeof x.statement_text !== "string") continue;
    if (!CHOICE_VALUES.includes(x.choice as ChoiceValue)) continue;
    cleaned.push({
      statement_id: x.statement_id as StatementId,
      statement_text: x.statement_text,
      choice: x.choice as ChoiceValue,
      answered_at:
        typeof x.answered_at === "string"
          ? x.answered_at
          : new Date().toISOString(),
    });
  }
  return { rounds: cleaned };
}

const ORIGIN_IDS: ReadonlyArray<OriginCheckId> = [
  "family",
  "school",
  "work",
  "peer",
  "failure",
  "single_remark",
  "unknown",
];
const GAIN_IDS: ReadonlyArray<GainCheckId> = [
  "approval",
  "safety",
  "control",
  "self_esteem",
  "belonging",
  "avoidance",
];
const BELIEF_KEYS: ReadonlyArray<BeliefKey> = ["core", "self", "others", "world"];

function normalizeStage02(v: unknown): Stage02Origin | undefined {
  if (!v || typeof v !== "object") return undefined;
  const r = v as Partial<Stage02Origin>;

  const filterIds = <T extends string>(
    arr: unknown,
    whitelist: ReadonlyArray<T>
  ): T[] =>
    Array.isArray(arr)
      ? arr.filter((x): x is T => whitelist.includes(x as T))
      : [];

  const perBelief: Partial<Record<BeliefKey, OriginEntry>> = {};
  const rawPerBelief = (r.per_belief ?? {}) as Record<string, unknown>;
  for (const k of BELIEF_KEYS) {
    const ent = rawPerBelief[k];
    if (!ent || typeof ent !== "object") continue;
    const e = ent as Partial<OriginEntry>;
    const oid =
      e.origin_id === "other" ||
      (typeof e.origin_id === "string" &&
        ORIGIN_IDS.includes(e.origin_id as OriginCheckId))
        ? (e.origin_id as OriginCheckId | "other")
        : undefined;
    perBelief[k] = {
      origin_id: oid,
      origin_other_label:
        typeof e.origin_other_label === "string"
          ? e.origin_other_label
          : undefined,
      scene_text: typeof e.scene_text === "string" ? e.scene_text : undefined,
      identity_text:
        typeof e.identity_text === "string" ? e.identity_text : undefined,
    };
  }

  return {
    when_first_arose:
      typeof r.when_first_arose === "string" ? r.when_first_arose : undefined,
    how_it_protected:
      typeof r.how_it_protected === "string" ? r.how_it_protected : undefined,
    origins: filterIds(r.origins, ORIGIN_IDS),
    origin_other:
      typeof r.origin_other === "string" ? r.origin_other : undefined,
    gains: filterIds(r.gains, GAIN_IDS),
    gain_other: typeof r.gain_other === "string" ? r.gain_other : undefined,
    per_belief: perBelief,
    skipped: r.skipped === true,
  };
}

function normalizeStage03(v: unknown): Stage03Evidence | undefined {
  if (!v || typeof v !== "object") return undefined;
  const r = v as Partial<Stage03Evidence> & Record<string, unknown>;
  const arr = (x: unknown): string[] =>
    Array.isArray(x) ? x.filter((s): s is string => typeof s === "string") : [];

  const rawBeliefs = Array.isArray(r.beliefs) ? r.beliefs : [];
  const beliefs: BeliefEvidenceEntry[] = [];
  for (const b of rawBeliefs) {
    if (!b || typeof b !== "object") continue;
    const e = b as Partial<BeliefEvidenceEntry>;
    if (!BELIEF_KEYS.includes(e.belief_key as BeliefKey)) continue;
    beliefs.push({
      belief_key: e.belief_key as BeliefKey,
      support: arr(e.support),
      counter: arr(e.counter),
      status: e.status === "done" ? "done" : "pending",
      ai_used_support: e.ai_used_support === true,
      ai_used_counter: e.ai_used_counter === true,
    });
  }

  const activeIndex =
    typeof r.active_index === "number" && r.active_index >= 0
      ? r.active_index
      : 0;
  const activePhase = r.active_phase === "counter" ? "counter" : "support";

  return {
    beliefs,
    active_index: activeIndex,
    active_phase: activePhase,
    supporting: arr(r.supporting),
    counter: arr(r.counter),
    counter_skipped: r.counter_skipped === true,
  };
}

function normalizeStage04(v: unknown): Stage04Perspective | undefined {
  if (!v || typeof v !== "object") return undefined;
  const r = v as Partial<Stage04Perspective>;
  return {
    friend_response:
      typeof r.friend_response === "string" ? r.friend_response : undefined,
  };
}

function normalizeStage05(v: unknown): Stage05Spectrum | undefined {
  if (!v || typeof v !== "object") return undefined;
  const r = v as Partial<Stage05Spectrum>;
  const num = (x: unknown): number | undefined => {
    if (typeof x !== "number" || Number.isNaN(x)) return undefined;
    return Math.min(100, Math.max(0, Math.round(x)));
  };
  return {
    bound_left: typeof r.bound_left === "string" ? r.bound_left : undefined,
    bound_right: typeof r.bound_right === "string" ? r.bound_right : undefined,
    self_value: num(r.self_value),
    loved_value: num(r.loved_value),
  };
}

function normalizeStage06(v: unknown): Stage06Rewrite | undefined {
  if (!v || typeof v !== "object") return undefined;
  const r = v as Partial<Stage06Rewrite>;

  const isCardId = (x: unknown): x is RewriteCardId =>
    x === "soften" || x === "reframe" || x === "decouple";

  // 다중 선택 카드 — 신규 형식 우선, 없으면 레거시 단일 선택을 배열로 마이그레이션
  let chosenCards: RewriteCardId[] = [];
  if (Array.isArray(r.chosen_cards)) {
    const seen = new Set<RewriteCardId>();
    for (const c of r.chosen_cards) {
      if (isCardId(c) && !seen.has(c)) {
        seen.add(c);
        chosenCards.push(c);
      }
    }
  } else if (isCardId(r.chosen_card)) {
    chosenCards = [r.chosen_card];
  }

  return {
    chosen_cards: chosenCards.length > 0 ? chosenCards : undefined,
    edited_text: typeof r.edited_text === "string" ? r.edited_text : undefined,
    chosen_card: isCardId(r.chosen_card) ? r.chosen_card : undefined,
    chosen_text: typeof r.chosen_text === "string" ? r.chosen_text : undefined,
    persist_to_home: r.persist_to_home === true,
    daily_reminder: r.daily_reminder === true,
  };
}
