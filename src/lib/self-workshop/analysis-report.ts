/**
 * Step 5 "인지 패턴 통합 분석 리포트(Cognitive Pattern Integrated Report)"의
 * 단일 진실(SSOT) 데이터 구조.
 *
 * - 5개 섹션: situation_summary / belief_keywords / achievement_loop /
 *   cognitive_distortions / destroy_rebuild_preview
 * - 다운스트림 호환(legacy): cognitive_errors / pattern_cycle 두 필드를 함께 채워서
 *   Step 6(belief_destroy)·Step 9(coping_plan) 의 prefill 의존성을 깨뜨리지 않는다.
 */
import {
  isCognitiveErrorId,
  type CognitiveErrorId,
} from "./cognitive-errors";

/* ─────────────────────────── 섹션 1: 상황 요약 ─────────────────────────── */

/**
 * 자동사고의 흐름(Cognitive Cascade) 한 노드.
 * 단계 종류는 enum으로 강제하지 않는다 — 자동사고가 1~3개로 가변이고,
 * '자기 정의', '신체 신호', '행동' 같은 자유 라벨이 함께 나오기 때문.
 */
export interface CascadeNode {
  /** 예: "트리거", "1차 자동사고", "자기 정의", "신체 신호", "행동" */
  label: string;
  /** 본문 — 사용자 원문 인용 또는 그 단계의 설명 한 줄 */
  content: string;
  /** 다음 단계로 가는 화살표 옆에 붙는 인지적 점프 코멘트 (마지막 노드는 없음) */
  transition?: string;
}

export interface SituationSummary {
  /** Step 3의 recent_situation 그대로 인용 */
  trigger_quote: string;
  /**
   * 자동사고 한 문장 요약 — automatic_thoughts + self_definition + worst_case 를
   * 통합한 한 문장. "나는 [상태]이고, [결과 예측]이다" 형식.
   */
  automatic_thought_summary: string;
  /** 6~8개의 노드로 구성된 cascade 흐름 */
  cascade: CascadeNode[];
  /** 💡 이 흐름의 핵심 — 패턴에 이름을 붙이는 1~2문장 */
  flow_insight: string;
}

/* ─────────────────────────── 섹션 2: 핵심 신념 키워드 ─────────────────────────── */

export interface BeliefEvidence {
  /**
   * 출처 식별자 — SCT 코드("A1"~"D3") 또는 Step 3 필드명
   * (예: "최악의 시나리오", "추가질문 체크", "자기 정의").
   */
  source_code: string;
  /** 사용자 원문에서 그대로 가져온 인용 */
  quote: string;
  /** 그것이 이 키워드를 시사하는 이유 한 줄 해석 */
  reasoning: string;
  /**
   * 짧은 ID 라벨 (예: "B2", "S3", "A1"). 임상 리포트 디자인의 ID 셀에 표시.
   * 옵셔널 — LLM이 채우지 않으면 클라이언트에서 source_code 앞부분을 사용.
   */
  id?: string;
  /**
   * 자기보고 단계명 (예: "Stage B", "Step 3 · 추가질문"). 임상 리포트 디자인의
   * SOURCE 셀에 표시. 옵셔널 — LLM이 채우지 않으면 클라이언트에서 source_code 기반으로 derive.
   */
  stage?: string;
}

export interface BeliefKeyword {
  /** "[명제]" — 짧은 1인칭 명제 (예: "멈추면 무가치해진다") */
  proposition: string;
  /** 임상적 명명 (예: "조건부 자기 가치", "만성적 입증 모드") */
  clinical_name: string;
  /** 1~2문장으로 신념이 무엇인지 설명 */
  explanation: string;
  /** 최소 3개의 근거 인용 (SCT + Step 3 데이터 모두 활용 가능) */
  evidence: BeliefEvidence[];
  /** → 이 키워드가 사용자의 삶에서 어떻게 작동하는지 통찰적 한 문장 마무리 */
  insight_close: string;
}

/* ─────────────────────────── 섹션 3: Achievement Loop ─────────────────────────── */

export interface LoopStage {
  /** 1~6 */
  step: number;
  /** "불안 신호", "자기 비난", "압박 가속", "일시적 안도", "새 과제 추가", "결과 지연" */
  name: string;
  /**
   * 단계의 일반적 의미와 이 사용자의 구체적 사례를 한 문장에 녹인 설명.
   * 사용자 응답의 표현·단어를 자연스럽게 포함시켜 한 줄로 작성.
   */
  user_case: string;
  /**
   * 영문 라벨 (예: "ANXIETY SIGNAL", "SELF-CRITICISM"). 임상 리포트 디자인의
   * eyebrow에 표시. 옵셔널 — 없으면 이름에서 derive 또는 표시 생략.
   */
  name_en?: string;
  /**
   * 시그널 강도 (0~1). 임상 리포트 디자인의 SIGNAL 메터에 사용.
   * 옵셔널 — 없으면 메터 표시 생략.
   */
  intensity?: number;
  /**
   * 자기보고 출처 코드 (예: "A1", "B2"). 임상 리포트 디자인의 SOURCE 칩에 표시.
   * 옵셔널 — 없으면 표시 생략.
   */
  source?: string;
}

export interface CoreMechanism {
  /** 안전한 행동 (예: "만들기") */
  safe_action: string;
  /** 회피되는 행동 (예: "런칭") */
  avoided_action: string;
  /** 회피의 메커니즘 한 줄 (예: "결과를 내지 않음으로써") */
  avoidance_mechanism: string;
  /** 가장 강한 두려움 — Step 4 직접 인용 + (코드) 표기 권장 */
  strongest_fear: string;
  /** 두 번째로 강한 두려움 — Step 4 직접 인용 + (코드) 표기 권장 */
  second_fear: string;
  /** 사용자의 핵심 행동을 1~2단어로 (예: "바쁜 노력") */
  core_behavior: string;
}

export interface AchievementLoop {
  /** "세 가지 핵심 신념(...)이 합쳐지면서, 다음과 같은 순환 고리가..." */
  intro: string;
  /** 정확히 6단계 */
  stages: LoopStage[];
  core_mechanism: CoreMechanism;
  /**
   * 임상 리포트 디자인의 TitleBand에 표시되는 요약 메트릭.
   * cycle_time: "~3.2 days" 같은 한 줄 추정.
   * observed_text: "14d 동안 4.4× 관찰됨" 같은 빈도 묘사.
   * loopback_text: 마지막 노드 아래 표시되는 회귀 한 줄.
   * 모두 옵셔널 — 없으면 해당 영역 표시 생략.
   */
  cycle_time?: string;
  observed_text?: string;
  loopback_text?: string;
}

/* ─────────────────────────── 섹션 4: 인지 왜곡 ─────────────────────────── */

export interface CognitiveDistortion {
  /** 화이트리스트의 snake_case id (다운스트림 prefill 호환) */
  id: CognitiveErrorId;
  /** 한글명 (예: "재앙화", "비교함정") */
  name_ko: string;
  /** 영문명 (예: "Catastrophizing") */
  name_en: string;
  /** 사용자 응답에서 직접 인용 — 가장 분명한 증거 */
  quote: string;
  /** 이 왜곡이 어떻게 작동하는지 1~2문장 해석 */
  interpretation: string;
  /**
   * 개입 우선도 (0~1). 임상 리포트 디자인의 SEVERITY 메터에 사용.
   * 옵셔널 — 없으면 메터 표시 생략.
   */
  severity?: number;
  /**
   * 응답 전반에서 관찰된 빈도 (0~1). 임상 리포트 디자인의 FREQUENCY 메터에 사용.
   * 옵셔널 — 없으면 메터 표시 생략.
   */
  frequency?: number;
}

/**
 * cognitive_distortions 섹션의 메타 정보 — 임상 리포트 디자인의 TitleBand에 사용.
 * 옵셔널 — 없으면 해당 영역 표시 생략.
 */
export interface CognitiveDistortionMeta {
  /** 관찰된 왜곡 개수 (예: 4) */
  observed?: number;
  /** 카탈로그 전체 왜곡 수 (예: 12) */
  total_known?: number;
  /** 동시 발생 지수 0~1 (예: 0.74) */
  cooccurrence?: number;
  /** 마지막 IMPLICATION 박스에 들어갈 한 줄 정리 */
  implication?: string;
}

/* ─────────────────────────── 섹션 5: Destroy & Rebuild 예고 ─────────────────────────── */

export interface DestroyRebuildPreview {
  /** 키워드 1, 2, 3의 명제 — Destroy 인용에 사용 */
  keyword_propositions: [string, string, string];
  /** 사용자의 자동사고 중 가장 강한 것 — Rebuild 인용에 사용 */
  target_automatic_thought: string;
  /** 사용자의 추가질문 체크 항목 중 하나 — Rebuild 인용에 사용 */
  target_checklist_item: string;
}

/* ─────────────────────────── 다운스트림 호환 (Legacy) ─────────────────────────── */

/**
 * Step 6(belief_destroy)와 Step 9(coping_plan)이 Step 5 결과에서 prefill용으로 읽는 필드.
 * 새 리포트에서도 같은 모양으로 함께 채워줘서 다운스트림 회귀를 막는다.
 */
export interface LegacyCognitiveErrors {
  intro: string;
  items: Array<{
    id: CognitiveErrorId;
    name: string;
    definition: string;
    interpretation: string;
  }>;
  closing: string;
}

export type LegacyPatternStage =
  | "trigger"
  | "thought"
  | "emotion"
  | "body"
  | "behavior"
  | "core_belief";

export interface LegacyPatternCycle {
  headline: string;
  overview: string;
  nodes: Array<{
    stage: LegacyPatternStage;
    label: string;
    description: string;
  }>;
}

/* ─────────────────────────── 통합 AnalysisReport ─────────────────────────── */

export interface AnalysisReport {
  /** 1️⃣ 이런 상황에서 당신에게 일어난 일 */
  situation_summary: SituationSummary;
  /** 2️⃣ 핵심 신념 — 3가지 키워드 (정확히 3개) */
  belief_keywords: [BeliefKeyword, BeliefKeyword, BeliefKeyword];
  /** 3️⃣ 반복되는 성취 중독적 행동 패턴 */
  achievement_loop: AchievementLoop;
  /** 4️⃣ 작동 중인 인지 왜곡 (3~6개) */
  cognitive_distortions: CognitiveDistortion[];
  /** 4️⃣ 인지 왜곡 메타 — TitleBand 및 IMPLICATION 박스 (옵셔널, 임상 리포트 디자인 전용) */
  cognitive_distortions_meta?: CognitiveDistortionMeta;
  /** 5️⃣ 다음 챕터 예고 — Destroy & Rebuild */
  destroy_rebuild_preview: DestroyRebuildPreview;

  /* ── 다운스트림 호환 (LLM이 함께 채움) ── */
  cognitive_errors: LegacyCognitiveErrors;
  pattern_cycle: LegacyPatternCycle;
}

/* ─────────────────────────── 검증 ─────────────────────────── */

const LEGACY_STAGE_SET: ReadonlySet<string> = new Set<LegacyPatternStage>([
  "trigger",
  "thought",
  "emotion",
  "body",
  "behavior",
  "core_belief",
]);

const EXPECTED_LEGACY_STAGES: LegacyPatternStage[] = [
  "trigger",
  "thought",
  "emotion",
  "body",
  "behavior",
  "core_belief",
];

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isCascadeNode(v: unknown): v is CascadeNode {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  if (!isNonEmptyString(r.label)) return false;
  if (!isNonEmptyString(r.content)) return false;
  if (r.transition !== undefined && typeof r.transition !== "string") {
    return false;
  }
  return true;
}

function isSituationSummary(v: unknown): v is SituationSummary {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  if (!isNonEmptyString(r.trigger_quote)) return false;
  if (!isNonEmptyString(r.automatic_thought_summary)) return false;
  if (!isNonEmptyString(r.flow_insight)) return false;
  if (!Array.isArray(r.cascade) || r.cascade.length < 4) return false;
  return r.cascade.every(isCascadeNode);
}

function isBeliefEvidence(v: unknown): v is BeliefEvidence {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return (
    isNonEmptyString(r.source_code) &&
    isNonEmptyString(r.quote) &&
    isNonEmptyString(r.reasoning)
  );
}

function isBeliefKeyword(v: unknown): v is BeliefKeyword {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  if (!isNonEmptyString(r.proposition)) return false;
  if (!isNonEmptyString(r.clinical_name)) return false;
  if (!isNonEmptyString(r.explanation)) return false;
  if (!isNonEmptyString(r.insight_close)) return false;
  if (!Array.isArray(r.evidence) || r.evidence.length < 3) return false;
  return r.evidence.every(isBeliefEvidence);
}

function isLoopStage(v: unknown): v is LoopStage {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.step === "number" &&
    isNonEmptyString(r.name) &&
    isNonEmptyString(r.user_case)
  );
}

function isCoreMechanism(v: unknown): v is CoreMechanism {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return (
    isNonEmptyString(r.safe_action) &&
    isNonEmptyString(r.avoided_action) &&
    isNonEmptyString(r.avoidance_mechanism) &&
    isNonEmptyString(r.strongest_fear) &&
    isNonEmptyString(r.second_fear) &&
    isNonEmptyString(r.core_behavior)
  );
}

function isAchievementLoop(v: unknown): v is AchievementLoop {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  if (!isNonEmptyString(r.intro)) return false;
  if (!Array.isArray(r.stages) || r.stages.length !== 6) return false;
  if (!r.stages.every(isLoopStage)) return false;
  return isCoreMechanism(r.core_mechanism);
}

function isCognitiveDistortion(v: unknown): v is CognitiveDistortion {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  return (
    isCognitiveErrorId(r.id) &&
    isNonEmptyString(r.name_ko) &&
    isNonEmptyString(r.name_en) &&
    isNonEmptyString(r.quote) &&
    isNonEmptyString(r.interpretation)
  );
}

function isDestroyRebuildPreview(v: unknown): v is DestroyRebuildPreview {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  if (
    !Array.isArray(r.keyword_propositions) ||
    r.keyword_propositions.length !== 3
  ) {
    return false;
  }
  if (!r.keyword_propositions.every(isNonEmptyString)) return false;
  return (
    typeof r.target_automatic_thought === "string" &&
    typeof r.target_checklist_item === "string"
  );
}

function isLegacyCognitiveErrors(v: unknown): v is LegacyCognitiveErrors {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  if (!isNonEmptyString(r.intro)) return false;
  if (!isNonEmptyString(r.closing)) return false;
  if (!Array.isArray(r.items) || r.items.length < 1) return false;
  return r.items.every((it) => {
    if (!it || typeof it !== "object") return false;
    const e = it as Record<string, unknown>;
    return (
      isCognitiveErrorId(e.id) &&
      isNonEmptyString(e.name) &&
      isNonEmptyString(e.definition) &&
      isNonEmptyString(e.interpretation)
    );
  });
}

function isLegacyPatternCycle(v: unknown): v is LegacyPatternCycle {
  if (!v || typeof v !== "object") return false;
  const r = v as Record<string, unknown>;
  if (!isNonEmptyString(r.headline)) return false;
  if (!isNonEmptyString(r.overview)) return false;
  if (!Array.isArray(r.nodes) || r.nodes.length !== 6) return false;
  return r.nodes.every((n, i) => {
    if (!n || typeof n !== "object") return false;
    const e = n as Record<string, unknown>;
    if (!isNonEmptyString(e.stage)) return false;
    if (!LEGACY_STAGE_SET.has(e.stage)) return false;
    if (e.stage !== EXPECTED_LEGACY_STAGES[i]) return false;
    return isNonEmptyString(e.label) && isNonEmptyString(e.description);
  });
}

export function isAnalysisReport(v: unknown): v is AnalysisReport {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const r = v as Partial<AnalysisReport>;
  if (!isSituationSummary(r.situation_summary)) return false;
  if (!Array.isArray(r.belief_keywords) || r.belief_keywords.length !== 3) {
    return false;
  }
  if (!r.belief_keywords.every(isBeliefKeyword)) return false;
  if (!isAchievementLoop(r.achievement_loop)) return false;
  if (
    !Array.isArray(r.cognitive_distortions) ||
    r.cognitive_distortions.length < 3 ||
    r.cognitive_distortions.length > 6
  ) {
    return false;
  }
  if (!r.cognitive_distortions.every(isCognitiveDistortion)) return false;
  if (!isDestroyRebuildPreview(r.destroy_rebuild_preview)) return false;
  if (!isLegacyCognitiveErrors(r.cognitive_errors)) return false;
  if (!isLegacyPatternCycle(r.pattern_cycle)) return false;
  return true;
}

/* ─────────────────────────── 호환용 type alias ─────────────────────────── */

/**
 * 기존 코드(Step 6 prefill 등)에서 import하던 PatternStage alias.
 * 새 리포트의 legacy pattern_cycle에서도 그대로 의미가 통한다.
 */
export type PatternStage = LegacyPatternStage;
