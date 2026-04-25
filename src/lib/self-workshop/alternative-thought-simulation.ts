/**
 * DESTROY · 2단계: 대안 자동사고 시뮬레이션
 *
 * 같은 상황도 사고가 달라지면 마음/행동이 어떻게 바뀌는지
 * 사용자가 직접 빈칸을 채워가며 체감하는 실습.
 *
 * Step 3 (mechanism_analysis)의 상황·자동사고·감정·행동을 스냅샷으로 가져와
 * 그 위에 "대안 자동사고 → 예측 감정 → 예측 행동"을 추가 작성한다.
 */

export interface AlternativeThought {
  alternative_thought: string;
  /** "내 마음은 ( )" — 감정 예측 */
  predicted_emotion: string;
  /** "내 행동은 ( )" — 행동 예측 */
  predicted_behavior: string;
  /** AI 도움 버튼으로 채운 항목인지 (분석용) */
  ai_assisted: boolean;
}

export interface ScenarioSimulation {
  /** Step 3 mechanism_analysis 스냅샷 (실습 당시 값을 보존) */
  situation: string;
  original_automatic_thought: string;
  original_emotion: string;
  original_behavior: string;
  /** 사용자가 작성하는 대안들 (기본 2개 슬롯, 추가 가능) */
  alternatives: AlternativeThought[];
}

export interface AlternativeThoughtSimulation {
  scenarios: ScenarioSimulation[];
  /** 마무리 통찰 한 줄: "이 시뮬레이션을 통해 깨달은 점" */
  insight: string;
}

export const EMPTY_ALTERNATIVE_THOUGHT: AlternativeThought = {
  alternative_thought: "",
  predicted_emotion: "",
  predicted_behavior: "",
  ai_assisted: false,
};

export function createEmptyScenario(
  snapshot: Pick<
    ScenarioSimulation,
    "situation" | "original_automatic_thought" | "original_emotion" | "original_behavior"
  >,
): ScenarioSimulation {
  return {
    ...snapshot,
    alternatives: [
      { ...EMPTY_ALTERNATIVE_THOUGHT },
      { ...EMPTY_ALTERNATIVE_THOUGHT },
    ],
  };
}

/**
 * 다음 단계 진입 게이트.
 * 시나리오마다 최소 1개의 대안이 세 칸(사고/감정/행동) 모두 채워져 있어야 함.
 */
export function isAlternativeThoughtMinimallyComplete(
  data: Partial<AlternativeThoughtSimulation> | null | undefined,
): boolean {
  if (!data?.scenarios?.length) return false;
  return data.scenarios.every((scenario) =>
    scenario.alternatives.some(
      (alt) =>
        alt.alternative_thought.trim().length > 0 &&
        alt.predicted_emotion.trim().length > 0 &&
        alt.predicted_behavior.trim().length > 0,
    ),
  );
}
