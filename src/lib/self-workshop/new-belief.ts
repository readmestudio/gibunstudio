/**
 * SOLUTION · 1단계: 새 핵심 신념 찾기
 *
 * 같은 상황(FIND_OUT 1의 recent_situation)을 다시 제시하고,
 * 옛 핵심 믿음(FIND_OUT 2 synthesis.belief_line) 대신 새 핵심 믿음을 작성하도록 한다.
 */

export interface NewBeliefData {
  /** Step 3 mechanism_analysis.recent_situation 스냅샷 */
  situation: string;
  /** FIND_OUT 2 synthesis.belief_line 스냅샷 (반박 대상) */
  old_belief_snapshot: string;
  /** FIND_OUT 2 synthesis.reframe_invitation 스냅샷 (힌트) */
  reframe_invitation: string;

  /** 사용자가 작성한 새 핵심 믿음 (필수) */
  new_core_belief: string;
  /** 왜 이 새 믿음이 자신에게 맞는지 (선택) */
  why_this_works: string;

  /** (선택) LLM이 제시한 새 핵심 믿음 후보 */
  ai_candidates?: string[];
}

export const EMPTY_NEW_BELIEF: NewBeliefData = {
  situation: "",
  old_belief_snapshot: "",
  reframe_invitation: "",
  new_core_belief: "",
  why_this_works: "",
};

/** 다음 단계 진입 게이트: 새 핵심 믿음을 한 줄이라도 작성했는가 */
export function isNewBeliefMinimallyComplete(
  data: Partial<NewBeliefData> | undefined
): boolean {
  if (!data) return false;
  return (data.new_core_belief ?? "").trim().length > 0;
}
