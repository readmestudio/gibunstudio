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
  final_profile: {
    character_line: string;
    character_description: string;
    life_impact: {
      work: string;
      relationship: string;
      rest: string;
      body: string;
    };
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

  // final_profile 필수 5필드 검증 (신규 — 옛 캐시 자동 무효화)
  const fp = r.final_profile;
  if (!fp || typeof fp !== "object") return false;
  if (
    typeof fp.character_line !== "string" ||
    fp.character_line.trim().length === 0
  ) {
    return false;
  }
  if (
    typeof fp.character_description !== "string" ||
    fp.character_description.trim().length === 0
  ) {
    return false;
  }
  const li = fp.life_impact;
  if (!li || typeof li !== "object") return false;
  for (const k of ["work", "relationship", "rest", "body"] as const) {
    if (typeof li[k] !== "string" || li[k].trim().length === 0) return false;
  }

  return (
    !!r.hidden_patterns &&
    Array.isArray(r.hidden_patterns.errors) &&
    !!r.key_question
  );
}
