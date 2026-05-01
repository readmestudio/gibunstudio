/**
 * workshop_progress 자가 회복 유틸리티.
 *
 * 사용자가 작성/저장한 컬럼들로부터 "이 사용자가 도달했어야 할 최소 step" 을
 * derive 한다. 옛 11→10 마이그레이션 코드가 idempotency 가드 없이 매 방문마다
 * current_step 을 깎아내려 사용자의 실제 진행보다 뒤처진 케이스를 자동 회복하기
 * 위해 사용한다.
 *
 * 보정은 위로만 (절대 내림 X). 호출 측에서 `current_step < derive(progress)`
 * 일 때만 admin client 로 update 한다.
 */
export interface WorkshopProgressFields {
  current_step?: number | null;
  status?: string | null;
  diagnosis_scores?: unknown;
  mechanism_analysis?: unknown;
  core_belief_excavation?: unknown;
  mechanism_insights?: unknown;
  alternative_thought_simulation?: unknown;
  new_belief?: unknown;
  coping_plan?: unknown;
  summary_cards?: unknown;
  reflections?: unknown;
}

/**
 * 컬럼 충실도 → 최소 step 매핑.
 *
 * 저장 시점의 advanceStep 을 기준으로 한다. 즉 step N 의 "다음" 버튼이
 * `advanceStep: N+1` 와 함께 컬럼 X 를 저장하면, X 가 채워져 있다 = step N 을
 * 마쳤다 = current_step ≥ N+1 이어야 한다.
 *
 * 예외: `mechanism_analysis` 는 step 2 → step 3 전환 시 EMPTY_MECHANISM 스텁으로
 * 채워지므로, 컬럼 존재만으로는 step 3 도달(=current_step ≥ 3) 까지만 보장된다.
 * step 3 완료(=current_step ≥ 4) 신호는 `core_belief_excavation` 의 존재로 대체.
 */
export function deriveExpectedMinStep(p: WorkshopProgressFields): number {
  let min = 1;
  if (p.diagnosis_scores != null) min = Math.max(min, 2);
  if (p.mechanism_analysis != null) min = Math.max(min, 3);
  if (p.core_belief_excavation != null) min = Math.max(min, 5);
  if (p.mechanism_insights != null) min = Math.max(min, 6);
  if (p.alternative_thought_simulation != null) min = Math.max(min, 7);
  if (p.new_belief != null) min = Math.max(min, 8);
  if (p.coping_plan != null) min = Math.max(min, 9);
  // summary_cards 는 step 9 페이지 진입 시 LLM 으로 생성·캐시되므로 도달 신호.
  if (p.summary_cards != null) min = Math.max(min, 9);
  if (p.reflections != null) min = Math.max(min, 10);
  return min;
}

/**
 * 회복이 필요한지 여부. 호출 측에서 update 호출 전에 빠르게 판별.
 */
export function needsRecovery(p: WorkshopProgressFields): boolean {
  const cur = typeof p.current_step === "number" ? p.current_step : 1;
  return cur < deriveExpectedMinStep(p);
}
