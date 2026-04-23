import {
  isCognitiveErrorId,
  type CognitiveErrorId,
} from "./cognitive-errors";

export type PatternStage =
  | "trigger"
  | "thought"
  | "emotion"
  | "body"
  | "behavior";

const PATTERN_STAGE_SET: ReadonlySet<string> = new Set<PatternStage>([
  "trigger",
  "thought",
  "emotion",
  "body",
  "behavior",
]);

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

  // pattern_cycle — 기존 5단계 엄격 검증 유지
  if (!r.pattern_cycle || !Array.isArray(r.pattern_cycle.nodes)) return false;
  if (r.pattern_cycle.nodes.length !== 5) return false;
  for (const n of r.pattern_cycle.nodes) {
    if (!n || typeof n.stage !== "string" || !PATTERN_STAGE_SET.has(n.stage)) {
      return false;
    }
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
