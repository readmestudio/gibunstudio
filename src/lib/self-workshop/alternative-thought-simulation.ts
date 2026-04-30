/**
 * DESTROY · 2단계: 대안 자동사고 시뮬레이션 (Stage 07)
 *
 * 핸드오프 v2 — "같은 상황, 다른 사고였다면" 시뮬레이션:
 *  - PART A · TUTORIAL: 워밍업 (남자친구 표정 시나리오) — 사용자가 두 자동사고에 대한 감정 선택
 *  - PART B · YOUR TURN: 본인 사례 (Step 3 mechanism_analysis 기반)
 *      - AI가 생성한 SOFTEN/REFRAME/DECOUPLE 3개 카드 중 하나 선택
 *      - 미리 정의된 6개 감정 라벨 중 하나 선택
 *      - RECAP (BEFORE → AFTER)
 *
 * Step 3 (mechanism_analysis)의 상황·자동사고·감정을 스냅샷으로 가져와 진입.
 */

/* ─────────────────────────── 카드 타입 (PART B) ─────────────────────────── */

export type AltThoughtCardId = "soften" | "reframe" | "decouple";

/** AI가 생성하는 SOFTEN/REFRAME/DECOUPLE 카드. 한 번 생성 후 저장. */
export interface AltThoughtCard {
  id: AltThoughtCardId;
  /** 모노 코드 라벨 (예: "A · SOFTEN") */
  code: string;
  /** 한국어 짧은 라벨 (예: "작은 한 걸음") */
  label: string;
  /** 사용자 사례에 맞춰진 대안 자동사고 본문 (큰 따옴표 안 본문) */
  text: string;
  /** "↳ 왜 이게 더 정확할까:" 부연 한 줄 */
  why: string;
}

/* ─────────────────────────── 감정 정의 ─────────────────────────── */

export type EmotionId =
  | "calm"
  | "relief"
  | "curious"
  | "gentle"
  | "free"
  | "still";

export interface EmotionDef {
  id: EmotionId;
  ko: string;
  en: string;
  glyph: string;
}

/** PART B에서 사용자가 선택할 새 감정 후보 (핸드오프 EMO_NEW와 1:1 매칭) */
export const NEW_EMOTIONS: ReadonlyArray<EmotionDef> = [
  { id: "calm", ko: "담담함", en: "CALM", glyph: "○" },
  { id: "relief", ko: "안도", en: "RELIEF", glyph: "◌" },
  { id: "curious", ko: "호기심", en: "CURIOUS", glyph: "◍" },
  { id: "gentle", ko: "스스로에게 다정함", en: "GENTLE", glyph: "◐" },
  { id: "free", ko: "가벼워짐", en: "LIGHT", glyph: "◇" },
  { id: "still", ko: "불안 (남아있음)", en: "STILL TENSE", glyph: "◆" },
];

/* ─────────────────────────── 튜토리얼 정의 (PART A · 고정) ─────────────────────────── */

export const TUTORIAL_SITUATION =
  "오랜만에 만난 남자친구의 표정이 안 좋다.";

export interface TutorialThought {
  id: "t1" | "t2";
  text: string;
}

export const TUTORIAL_THOUGHTS: ReadonlyArray<TutorialThought> = [
  { id: "t1", text: '"나 때문에 화가 났나 봐."' },
  { id: "t2", text: '"어디 아픈 건 아닐까?"' },
];

export type TutorialEmotionId =
  | "anxious"
  | "guilt"
  | "worry"
  | "anger"
  | "sad"
  | "calm";

export const TUTORIAL_EMOTIONS: ReadonlyArray<{
  id: TutorialEmotionId;
  ko: string;
  en: string;
  glyph: string;
}> = [
  { id: "anxious", ko: "불안", en: "ANXIOUS", glyph: "◐" },
  { id: "guilt", ko: "죄책감", en: "GUILT", glyph: "◍" },
  { id: "worry", ko: "걱정", en: "WORRY", glyph: "◑" },
  { id: "anger", ko: "분노", en: "ANGER", glyph: "◆" },
  { id: "sad", ko: "서운함", en: "HURT", glyph: "◇" },
  { id: "calm", ko: "담담함", en: "CALM", glyph: "○" },
];

/* ─────────────────────────── 통합 데이터 ─────────────────────────── */

export interface TutorialState {
  /** 첫 번째 자동사고 ("나 때문에...")에 대해 고른 감정 */
  first_emotion?: TutorialEmotionId;
  /** 첫 번째 자동사고 — 직접 입력한 감정 (id 대신 사용) */
  first_emotion_custom?: string;
  /** 두 번째 자동사고 ("어디 아픈 건...")에 대해 고른 감정 */
  second_emotion?: TutorialEmotionId;
  /** 두 번째 자동사고 — 직접 입력한 감정 (id 대신 사용) */
  second_emotion_custom?: string;
}

export interface AlternativeThoughtSimulation {
  /** 사용자 사례 스냅샷 — Step 3 mechanism_analysis에서 진입 시 채움 */
  situation?: string;
  original_automatic_thought?: string;
  original_emotion?: string;
  original_emotion_detail?: string;

  /** PART A 튜토리얼 결과 */
  tutorial?: TutorialState;

  /** PART B AI 생성 카드 3개 — 한 번 생성 후 보존 (재진입 시 동일 카드 노출) */
  cards?: AltThoughtCard[];

  /** PART B에서 사용자가 선택한 카드 */
  picked_card_id?: AltThoughtCardId;
  /** PART B에서 사용자가 선택한 새 감정 (정의된 6개 중 하나) */
  new_emotion_id?: EmotionId;
  /** PART B — 직접 입력한 감정 (id 대신 사용) */
  new_emotion_custom?: string;

  /** 완료 시각 */
  completed_at?: string;

  /* ─────────────── 레거시 v1 — 보존만, 신규 UI 미사용 ─────────────── */
  scenarios?: ScenarioSimulation[];
  insight?: string;
}

/* ─────────────────────────── 레거시 v1 (보존) ─────────────────────────── */

export interface AlternativeThought {
  alternative_thought: string;
  predicted_emotion: string;
  predicted_behavior: string;
  ai_assisted: boolean;
}

export interface ScenarioSimulation {
  situation: string;
  original_automatic_thought: string;
  original_emotion: string;
  original_behavior: string;
  alternatives: AlternativeThought[];
}

/* ─────────────────────────── 빈 값 / 헬퍼 ─────────────────────────── */

export const EMPTY_ALTERNATIVE_THOUGHT_SIMULATION: AlternativeThoughtSimulation =
  {};

/**
 * 다음 단계 진입 게이트.
 * v2: 카드 1개 + 새 감정 1개 선택 완료 시 통과.
 * v1 레거시 데이터(scenarios가 minimally complete)도 통과로 인정.
 */
export function isAlternativeThoughtMinimallyComplete(
  data: Partial<AlternativeThoughtSimulation> | null | undefined
): boolean {
  if (!data) return false;

  // v2 — 카드 + 감정 선택 (정의 감정 또는 직접 입력)
  const hasNewEmotion =
    !!data.new_emotion_id ||
    (typeof data.new_emotion_custom === "string" &&
      data.new_emotion_custom.trim().length > 0);
  const v2Done = !!data.picked_card_id && hasNewEmotion;
  if (v2Done) return true;

  // v1 레거시 — scenarios 최소 완성도
  if (!data.scenarios?.length) return false;
  return data.scenarios.every((s) =>
    s.alternatives.some(
      (alt) =>
        alt.alternative_thought.trim().length > 0 &&
        alt.predicted_emotion.trim().length > 0 &&
        alt.predicted_behavior.trim().length > 0
    )
  );
}

/**
 * Step 3 mechanism_analysis 스냅샷에서 사용자 사례 시드 생성.
 * 이미 저장된 데이터가 있으면 스냅샷은 첫 진입 때만 채워지고, 그 후엔 보존.
 */
export function seedSimulationFromMechanism(
  prev: Partial<AlternativeThoughtSimulation> | undefined,
  mechanism: {
    situation: string;
    automatic_thought: string;
    emotion: string;
    behavior: string;
  }
): AlternativeThoughtSimulation {
  return {
    ...prev,
    situation: prev?.situation ?? mechanism.situation,
    original_automatic_thought:
      prev?.original_automatic_thought ?? mechanism.automatic_thought,
    original_emotion: prev?.original_emotion ?? mechanism.emotion,
    original_emotion_detail:
      prev?.original_emotion_detail ?? mechanism.behavior,
  };
}
