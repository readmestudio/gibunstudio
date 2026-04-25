import {
  isCognitiveErrorId,
  type CognitiveErrorId,
} from "./cognitive-errors";

export type PatternStage =
  | "trigger"
  | "thought"
  | "emotion"
  | "body"
  | "behavior"
  | "core_belief";

const PATTERN_STAGE_SET: ReadonlySet<string> = new Set<PatternStage>([
  "trigger",
  "thought",
  "emotion",
  "body",
  "behavior",
  "core_belief",
]);

// FIND_OUT 3 (통합 패턴 분석)에서 LLM에게 강제하는 6-Part 도미노 순서.
const EXPECTED_STAGES_6_PART: PatternStage[] = [
  "trigger",
  "thought",
  "emotion",
  "body",
  "behavior",
  "core_belief",
];

export interface CognitiveErrorItem {
  /** 10개 화이트리스트 중 하나 */
  id: CognitiveErrorId;
  /** 한글명 (예: "명명하기") */
  name: string;
  /** 강의 톤의 한 줄 정의 */
  definition: string;
  /** 사용자 자동사고에서 이 오류가 드러나는 구체적 해석 (근거 인용 포함) */
  interpretation: string;
}

export interface AnalysisReport {
  cognitive_errors: {
    /** 사용자 자동사고 인용 + 맥락 설명 */
    intro: string;
    /** 1~4개. 사용자 자동사고에 해당되는 인지 오류만 선별 */
    items: CognitiveErrorItem[];
    /** 1~2문장 마무리 */
    closing: string;
  };
  pattern_cycle: {
    headline: string;
    overview: string;
    nodes: Array<{
      stage: PatternStage;
      label: string;
      description: string;
    }>;
  };
}

export function isAnalysisReport(v: unknown): v is AnalysisReport {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const r = v as Partial<AnalysisReport>;

  // pattern_cycle — 6단계 도미노 (trigger → thought → emotion → body → behavior → core_belief)
  if (!r.pattern_cycle || !Array.isArray(r.pattern_cycle.nodes)) return false;
  if (r.pattern_cycle.nodes.length !== 6) return false;
  for (let i = 0; i < EXPECTED_STAGES_6_PART.length; i++) {
    const node = r.pattern_cycle.nodes[i];
    if (!node || typeof node.stage !== "string") return false;
    if (!PATTERN_STAGE_SET.has(node.stage)) return false;
    if (node.stage !== EXPECTED_STAGES_6_PART[i]) return false;
  }

  // cognitive_errors — 신규 스키마 필수
  const ce = r.cognitive_errors;
  if (!ce || typeof ce !== "object" || Array.isArray(ce)) return false;
  if (typeof ce.intro !== "string" || ce.intro.trim().length === 0) {
    return false;
  }
  if (typeof ce.closing !== "string" || ce.closing.trim().length === 0) {
    return false;
  }
  if (!Array.isArray(ce.items)) return false;
  if (ce.items.length < 1 || ce.items.length > 4) return false;
  for (const item of ce.items) {
    if (!item || typeof item !== "object") return false;
    if (!isCognitiveErrorId(item.id)) return false;
    if (typeof item.name !== "string" || item.name.trim().length === 0) {
      return false;
    }
    if (
      typeof item.definition !== "string" ||
      item.definition.trim().length === 0
    ) {
      return false;
    }
    if (
      typeof item.interpretation !== "string" ||
      item.interpretation.trim().length === 0
    ) {
      return false;
    }
  }

  return true;
}
