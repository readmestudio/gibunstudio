/**
 * 인지 오류(자동사고의 함정) 10종 정의
 *
 * Step 4 "당신의 패턴은 이렇습니다"의 인지 오류 해석 섹션과
 * Step 6 "나만의 대처 계획 세우기"의 체크박스 선택지에서 공용으로 사용합니다.
 *
 * ID는 snake_case로 통일하며, 한번 배정된 ID는 변경하지 않습니다
 * (DB에 저장된 사용자 선택값과 호환성 유지).
 */

export const COGNITIVE_ERROR_IDS = [
  "dichotomous",
  "catastrophizing",
  "labeling",
  "magnification_minimization",
  "emotional_reasoning",
  "mental_filter",
  "mind_reading",
  "overgeneralization",
  "personalization",
  "should_statements",
  "comparison_trap",
  "fortune_telling",
  "disqualifying_positive",
] as const;

export type CognitiveErrorId = (typeof COGNITIVE_ERROR_IDS)[number];

export interface CognitiveError {
  id: CognitiveErrorId;
  label: string;
  /** 영문 임상명 — Step 5 새 리포트의 "(영문명)" 표기에 사용 */
  englishLabel: string;
  definition: string;
  example: string;
}

export const COGNITIVE_ERRORS: readonly CognitiveError[] = [
  {
    id: "dichotomous",
    label: "흑백사고",
    englishLabel: "All-or-Nothing Thinking",
    definition:
      "내 기준을 벗어난 건 전부 '나쁨'으로 몰아가는, 전부 아니면 전무의 사고예요.",
    example: "완벽하지 않으면 실패한 거다",
  },
  {
    id: "catastrophizing",
    label: "재앙화",
    englishLabel: "Catastrophizing",
    definition:
      "현실적 단계를 건너뛰고 미래를 한 번에 파국으로 예측하는 습관이에요.",
    example: "이번 실수로 내 커리어가 끝장날 거야",
  },
  {
    id: "labeling",
    label: "명명하기",
    englishLabel: "Labeling",
    definition:
      "자신이나 상황에 고정된 이름표를 붙여서, 그 프레임에 갇히게 만드는 사고예요.",
    example: "나는 원래 사회성이 없는 사람이야",
  },
  {
    id: "magnification_minimization",
    label: "과대평가·과소평가",
    englishLabel: "Magnification / Minimization",
    definition:
      "부정적인 면은 크게 확대하고, 잘한 부분이나 긍정적인 면은 작게 축소하는 사고예요.",
    example: "오늘 칭찬받은 건 운이고, 실수한 건 내 무능력 때문이야",
  },
  {
    id: "emotional_reasoning",
    label: "정서적 추론",
    englishLabel: "Emotional Reasoning",
    definition:
      "근거를 따져보기 전에 '느낌'만으로 결론을 내리는 사고예요.",
    example: "불안하니까 분명히 잘못될 거야",
  },
  {
    id: "mental_filter",
    label: "정신적 여과",
    englishLabel: "Mental Filter",
    definition:
      "세세한 단점 하나에 집중해서 전체 그림을 잃어버리는 사고예요.",
    example: "한 부분이 어색하니까 이 작업은 통째로 망쳤어",
  },
  {
    id: "mind_reading",
    label: "독심술",
    englishLabel: "Mind Reading",
    definition:
      "상대의 반응을 민감히 읽는 걸 넘어, '그 사람이 나를 이렇게 본다'고 내 마음대로 결론 내리는 사고예요.",
    example: "저 사람은 나를 무능하다고 생각할 거야",
  },
  {
    id: "overgeneralization",
    label: "과잉 일반화",
    englishLabel: "Overgeneralization",
    definition:
      "한 번의 경험을 '앞으로도 늘 이럴 것'이라며 넓게 적용하는 사고예요.",
    example: "한 번 거절당했으니까 다음에도 거절당할 거야",
  },
  {
    id: "personalization",
    label: "개인화",
    englishLabel: "Personalization",
    definition:
      "우연히 일어난 일까지 '내가 잘못해서 그래'라며 스스로에게 책임을 돌리는 사고예요.",
    example: "회의 분위기가 무거운 건 내가 말을 잘못해서 그래",
  },
  {
    id: "should_statements",
    label: "당위적 사고",
    englishLabel: "Should Statements",
    definition:
      "'반드시 ~해야 한다'는 고정된 기준을 내려놓지 못해, 충족되지 않으면 스스로를 괴롭히는 사고예요.",
    example: "나는 반드시 완벽하게 해내야만 해",
  },
  {
    id: "comparison_trap",
    label: "비교함정",
    englishLabel: "Comparison Trap",
    definition:
      "남의 완성된 결과와 내 과정 중인 모습을 비대칭적으로 견주며 자신을 깎아내리는 사고예요.",
    example: "남들은 다 잘하는데 나만 뒤처져 있어",
  },
  {
    id: "fortune_telling",
    label: "점쟁이 오류",
    englishLabel: "Fortune Telling",
    definition:
      "확실한 근거 없이 미래를 부정적으로 예단하고, 그 예측을 사실처럼 받아들이는 사고예요.",
    example: "이번에도 분명히 또 실패할 거야",
  },
  {
    id: "disqualifying_positive",
    label: "긍정 평가절하",
    englishLabel: "Disqualifying the Positive",
    definition:
      "잘한 일이나 받은 인정을 '운', '예외'로 깎아내려 자기 자원으로 쌓이지 못하게 하는 사고예요.",
    example: "이번엔 운이 좋았을 뿐이야",
  },
] as const;

const COGNITIVE_ERROR_ID_SET: ReadonlySet<string> = new Set<string>(
  COGNITIVE_ERROR_IDS
);

export function isCognitiveErrorId(v: unknown): v is CognitiveErrorId {
  return typeof v === "string" && COGNITIVE_ERROR_ID_SET.has(v);
}

export function findCognitiveError(
  id: string
): CognitiveError | undefined {
  return COGNITIVE_ERRORS.find((e) => e.id === id);
}
