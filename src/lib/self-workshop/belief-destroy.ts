/**
 * DESTROY · 1단계: 핵심 믿음 반박하기
 * 기분 다스리기(Burns, Feeling Good) 기반 4가지 인지 왜곡 반박 기법.
 */

import {
  isCognitiveErrorId,
  type CognitiveErrorId,
} from "./cognitive-errors";

export interface BeliefDestroyData {
  /** FIND_OUT 2단계 synthesis.belief_line 스냅샷 (반박 대상) */
  input_belief_line: string;

  /** 삼중 컬럼 기법 */
  triple_column: {
    /** Step 3 mechanism_analysis.automatic_thought prefill (수정 가능) */
    automatic_thought: string;
    /** Step 5 mechanism_insights에서 prefill된 인지 오류 id 배열 */
    cognitive_errors: CognitiveErrorId[];
    /** 사용자가 작성한 합리적 반응 */
    rational_response: string;
  };

  /** 이중 표준 기법 */
  double_standard: {
    /** "사랑하는 친구가 같은 믿음을 갖고 있다면 뭐라고 말해줄까?" */
    letter_to_friend: string;
  };

  /** 증거 검토 */
  evidence_review: {
    /** 그 믿음을 뒷받침하는 증거 */
    supporting: string;
    /** 그 믿음을 반박하는 증거 */
    refuting: string;
  };

  /** 비용-편익 분석 */
  cost_benefit: {
    /** 이 믿음을 계속 갖고 있을 때의 장점 */
    benefits: string;
    /** 이 믿음을 계속 갖고 있을 때의 단점 */
    costs: string;
  };

  /** (선택) LLM이 제시한 추가 반박 포인트 */
  ai_extra_points?: {
    items: string[];
    generated_at: string;
  };
}

export const EMPTY_BELIEF_DESTROY: BeliefDestroyData = {
  input_belief_line: "",
  triple_column: {
    automatic_thought: "",
    cognitive_errors: [],
    rational_response: "",
  },
  double_standard: { letter_to_friend: "" },
  evidence_review: { supporting: "", refuting: "" },
  cost_benefit: { benefits: "", costs: "" },
};

/** 사용자가 4기법 중 최소 1기법 이상 충실히 작성했는지 (다음 단계 진입 게이트) */
export function isBeliefDestroyMinimallyComplete(
  data: Partial<BeliefDestroyData> | undefined
): boolean {
  if (!data) return false;
  const tripleDone = (data.triple_column?.rational_response ?? "").trim().length > 0;
  const doubleDone = (data.double_standard?.letter_to_friend ?? "").trim().length > 0;
  const evidenceDone =
    (data.evidence_review?.supporting ?? "").trim().length > 0 &&
    (data.evidence_review?.refuting ?? "").trim().length > 0;
  const costBenefitDone =
    (data.cost_benefit?.benefits ?? "").trim().length > 0 &&
    (data.cost_benefit?.costs ?? "").trim().length > 0;
  return tripleDone || doubleDone || evidenceDone || costBenefitDone;
}

/** 외부에서 받은 데이터에서 cognitive_errors 화이트리스트 검증 */
export function sanitizeCognitiveErrors(
  ids: unknown
): CognitiveErrorId[] {
  if (!Array.isArray(ids)) return [];
  return ids.filter((id): id is CognitiveErrorId => isCognitiveErrorId(id));
}
