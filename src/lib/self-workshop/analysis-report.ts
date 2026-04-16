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

export interface AnalysisReport {
  pattern_cycle: {
    headline: string;
    overview: string;
    nodes: Array<{
      stage: PatternStage;
      label: string;
      description: string;
    }>;
  };
  cross_validation: {
    summary: string;
    rows: Array<{
      dimension_key:
        | "conditional_self_worth"
        | "compulsive_striving"
        | "fear_of_failure"
        | "emotional_avoidance";
      score: number;
      evidence_quote: string;
      interpretation: string;
    }>;
  };
  hidden_patterns: {
    summary: string;
    errors: Array<{
      id:
        | "dichotomous"
        | "overgeneralization"
        | "should_statements"
        | "emotional_reasoning"
        | "mind_reading"
        | "catastrophizing";
      label: string;
      evidence: string;
    }>;
  };
  key_question: {
    headline: string;
    question: string;
    rationale: string;
  };
}

export function isAnalysisReport(v: unknown): v is AnalysisReport {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const r = v as Partial<AnalysisReport>;
  if (!r.pattern_cycle || !Array.isArray(r.pattern_cycle.nodes)) return false;

  // 5단계 고정 + stage 집합 엄격 검증 (옛 6단계 캐시 자동 무효화)
  if (r.pattern_cycle.nodes.length !== 5) return false;
  for (const n of r.pattern_cycle.nodes) {
    if (!n || typeof n.stage !== "string" || !PATTERN_STAGE_SET.has(n.stage)) {
      return false;
    }
  }

  return (
    !!r.cross_validation &&
    Array.isArray(r.cross_validation.rows) &&
    !!r.hidden_patterns &&
    Array.isArray(r.hidden_patterns.errors) &&
    !!r.key_question
  );
}
