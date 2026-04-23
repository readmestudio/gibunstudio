/**
 * 성취 중독 진단 테스트
 * - 리커트 5점 척도 20문항
 * - 4개 하위 영역 (각 5문항)
 * - CBT 기반 성취 중독 메커니즘 모델
 */

// ── 하위 영역 정의 ──

export type DimensionKey =
  | "conditional_self_worth"
  | "compulsive_striving"
  | "fear_of_failure"
  | "emotional_avoidance";

export interface Dimension {
  key: DimensionKey;
  label: string;         // 유저 노출용 풀어쓴 표현 (예: "성과로 나를 증명하려는 마음")
  jargonLabel: string;   // 임상 용어 표기 (Section 01 전용). 예: "자기 가치의 조건화"
  description: string;
  questionIds: number[];
}

export const DIMENSIONS: Dimension[] = [
  {
    key: "conditional_self_worth",
    label: "성과로 나를 증명하려는 마음",
    jargonLabel: "자기 가치의 조건화",
    description: "성취가 있어야만 내가 괜찮다고 느껴지는 정도",
    questionIds: [1, 2, 3, 4, 5],
  },
  {
    key: "compulsive_striving",
    label: "멈추지 못하고 계속 달리는 습관",
    jargonLabel: "과잉 추동",
    description: "쉬거나 멈추는 순간 불편해지는 강도",
    questionIds: [6, 7, 8, 9, 10],
  },
  {
    key: "fear_of_failure",
    label: "실패가 두려워 완벽을 고집하는 마음",
    jargonLabel: "실패 공포 / 완벽주의",
    description: "실수·실패에 대한 과도한 두려움과 완벽주의 성향",
    questionIds: [11, 12, 13, 14, 15],
  },
  {
    key: "emotional_avoidance",
    label: "불편한 감정을 일로 덮는 패턴",
    jargonLabel: "정서적 회피",
    description: "마음이 불편할 때 감정을 직면하지 않고 성취·일로 회피하는 경향",
    questionIds: [16, 17, 18, 19, 20],
  },
];

// ── 20문항 ──

export interface DiagnosisQuestion {
  id: number;
  text: string;
  dimension: DimensionKey;
}

export const DIAGNOSIS_QUESTIONS: DiagnosisQuestion[] = [
  // 영역 1: 자기 가치의 조건화 (1-5)
  { id: 1, text: "나의 가치는 내가 이룬 성과에 의해 결정된다고 느낀다.", dimension: "conditional_self_worth" },
  { id: 2, text: "성과가 없는 하루는 낭비한 하루처럼 느껴진다.", dimension: "conditional_self_worth" },
  { id: 3, text: "누군가 나를 인정해 주지 않으면, 내가 한 일의 의미가 줄어드는 것 같다.", dimension: "conditional_self_worth" },
  { id: 4, text: "\"충분히 잘하고 있다\"는 말을 들어도 진심으로 받아들이기 어렵다.", dimension: "conditional_self_worth" },
  { id: 5, text: "나보다 뛰어난 사람을 보면, 내 존재 자체가 작아지는 느낌이 든다.", dimension: "conditional_self_worth" },

  // 영역 2: 과잉 추동 (6-10)
  { id: 6, text: "하나의 목표를 달성하면 바로 다음 목표를 세우지 않으면 불안하다.", dimension: "compulsive_striving" },
  { id: 7, text: "아무것도 안 하고 쉬는 것에 죄책감을 느낀다.", dimension: "compulsive_striving" },
  { id: 8, text: "할 일 목록이 줄어들면 오히려 불편하고, 새 항목을 추가하게 된다.", dimension: "compulsive_striving" },
  { id: 9, text: "주변 사람들이 \"너무 무리한다\"고 말해도, 멈추기가 어렵다.", dimension: "compulsive_striving" },
  { id: 10, text: "\"더 할 수 있었는데\"라는 생각이 늘 따라다닌다.", dimension: "compulsive_striving" },

  // 영역 3: 실패 공포 / 완벽주의 (11-15)
  { id: 11, text: "실수를 하면 그 장면이 오래도록 머릿속에서 반복 재생된다.", dimension: "fear_of_failure" },
  { id: 12, text: "\"완벽하지 않으면 의미가 없다\"는 생각이 자주 든다.", dimension: "fear_of_failure" },
  { id: 13, text: "새로운 일을 시작할 때, 실패할까 봐 미루게 된다.", dimension: "fear_of_failure" },
  { id: 14, text: "남들 앞에서 약한 모습이나 부족한 면을 보이는 것이 두렵다.", dimension: "fear_of_failure" },
  { id: 15, text: "결과가 좋아도 더 잘할 수 있었을 거라는 아쉬움이 먼저 든다.", dimension: "fear_of_failure" },

  // 영역 4: 정서적 회피 (16-20)
  { id: 16, text: "기분이 안 좋을 때 일에 몰두하면 기분이 나아진다.", dimension: "emotional_avoidance" },
  { id: 17, text: "슬프거나 외로울 때, 감정을 느끼기보다 무언가를 하는 쪽을 택한다.", dimension: "emotional_avoidance" },
  { id: 18, text: "몸이 피곤하다는 신호를 보내도, 무시하고 계속 일할 때가 많다.", dimension: "emotional_avoidance" },
  { id: 19, text: "내 감정 상태를 물어보면, 뭐라고 답해야 할지 잘 모르겠을 때가 있다.", dimension: "emotional_avoidance" },
  { id: 20, text: "조용히 혼자 있으면 불편한 생각이 올라와서, 바쁘게 지내는 게 편하다.", dimension: "emotional_avoidance" },
];

// ── 리커트 5점 척도 옵션 ──

export const LIKERT_OPTIONS = [
  { value: 1, label: "전혀 아니다" },
  { value: 2, label: "아니다" },
  { value: 3, label: "보통이다" },
  { value: 4, label: "그렇다" },
  { value: 5, label: "매우 그렇다" },
] as const;

// ── 레벨 정의 ──

export interface DiagnosisLevel {
  level: number;
  name: string;
  range: [number, number]; // [min, max] 포함
  keyword: string;
  description: string;
}

export const DIAGNOSIS_LEVELS: DiagnosisLevel[] = [
  {
    level: 1,
    name: "건강한 성취 동기",
    range: [20, 39],
    keyword: "균형 잡힌 동기",
    description:
      "성취를 즐기되, 그것이 당신의 전부는 아닙니다. 결과와 무관하게 자기 가치를 느낄 수 있는 건강한 기반을 가지고 있어요.",
  },
  {
    level: 2,
    name: "성취 의존 경향",
    range: [40, 59],
    keyword: "조절 가능한 의존",
    description:
      "성취에서 자기 가치를 확인하려는 경향이 있지만, 의식적으로 조절할 수 있는 수준입니다. 다만 스트레스 상황에서 패턴이 강화될 수 있어요.",
  },
  {
    level: 3,
    name: "성취 중독 위험군",
    range: [60, 79],
    keyword: "주의 필요",
    description:
      "성취 없이는 불안을 느끼고, 쉬는 것이 어려운 상태입니다. 자기 가치가 성과에 상당히 묶여 있어, 번아웃이나 관계 문제로 이어질 수 있습니다.",
  },
  {
    level: 4,
    name: "심각한 성취 중독",
    range: [80, 100],
    keyword: "즉각적 돌봄 필요",
    description:
      "성취가 거의 유일한 자기 가치의 원천이 되고 있습니다. 소진, 만성 피로, 관계 단절의 위험이 높은 상태이며, 전문가 상담을 병행하면 큰 도움이 됩니다.",
  },
];

// ── 점수 계산 ──

export interface DiagnosisScores {
  total: number;
  level: number;
  levelName: string;
  dimensions: Record<DimensionKey, number>;
}

export function calculateDiagnosisScores(
  answers: Record<string, number>
): DiagnosisScores {
  const dimensions = {} as Record<DimensionKey, number>;

  for (const dim of DIMENSIONS) {
    dimensions[dim.key] = dim.questionIds.reduce(
      (sum, qId) => sum + (answers[String(qId)] || 0),
      0
    );
  }

  const total = Object.values(dimensions).reduce((a, b) => a + b, 0);

  const matched =
    DIAGNOSIS_LEVELS.find((l) => total >= l.range[0] && total <= l.range[1]) ??
    DIAGNOSIS_LEVELS[DIAGNOSIS_LEVELS.length - 1];

  return {
    total,
    level: matched.level,
    levelName: matched.name,
    dimensions,
  };
}

// ── 감정 칩 목록 (Step 4 실습용) ──

export const EMOTION_CHIPS = [
  "불안", "초조", "죄책감", "분노", "무력감",
  "슬픔", "외로움", "수치심", "두려움", "답답함",
  "공허함", "자기비난", "조급함", "짜증",
] as const;

// ── 인지적 오류 목록 (Step 4 해석 섹션 · Step 6 체크박스 공용) ──
// 단일 출처: cognitive-errors.ts (10종 정의)
export { COGNITIVE_ERRORS } from "./cognitive-errors";

// ── 워크북 Step 메타데이터 ──

export interface WorkshopStep {
  step: number;
  title: string;
  subtitle: string;
  type: "read" | "diagnosis" | "result" | "exercise" | "ai_analysis" | "reflection";
  estimatedMinutes: [number, number]; // [min, max]
  hasUserInput: boolean;
}

export const WORKSHOP_STEPS: WorkshopStep[] = [
  { step: 1, title: "나의 성취 패턴 진단", subtitle: "자가 진단", type: "diagnosis", estimatedMinutes: [7, 10], hasUserInput: true },
  { step: 2, title: "나의 진단 결과", subtitle: "결과 분석", type: "result", estimatedMinutes: [5, 8], hasUserInput: false },
  { step: 3, title: "나의 성취 중독 패턴 찾기", subtitle: "성취 중독 이해 + 패턴 찾기 실습", type: "exercise", estimatedMinutes: [20, 30], hasUserInput: true },
  { step: 4, title: "당신의 패턴은 이렇습니다", subtitle: "인지 패턴 분석", type: "ai_analysis", estimatedMinutes: [3, 5], hasUserInput: false },
  { step: 5, title: "패턴을 만드는 핵심 믿음 찾기", subtitle: "핵심 믿음 문답 실습", type: "exercise", estimatedMinutes: [15, 20], hasUserInput: true },
  { step: 6, title: "나만의 대처 계획 세우기", subtitle: "대처 실습", type: "exercise", estimatedMinutes: [15, 20], hasUserInput: true },
  { step: 7, title: "나의 워크북 요약", subtitle: "전체 써머리", type: "ai_analysis", estimatedMinutes: [3, 5], hasUserInput: false },
  { step: 8, title: "워크북을 마치며", subtitle: "마무리 성찰", type: "reflection", estimatedMinutes: [5, 10], hasUserInput: true },
];
