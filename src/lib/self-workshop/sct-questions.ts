/**
 * Sentence Completion Test (SCT) 14문항.
 *
 * Step 4 "핵심 신념 찾기"에서 자기·타인·세계 3축의 핵심 신념을 추정하기 위해 사용한다.
 * Beck 인지치료의 핵심 신념 발굴, Young 도식치료(EMS), Sacks SSCT의 자기개념·대인관계 영역에서
 * 핵심 문항을 추려, 직장인 3-15년차 톤으로 변형했다.
 *
 * UI 컴포넌트와 API 프롬프트가 모두 이 모듈을 import 하여 single source of truth를 유지.
 */

export type SctCategoryCode = "A" | "B" | "C" | "D";

export interface SctCategory {
  code: SctCategoryCode;
  labelKo: string;
  introKo: string; // 카테고리 헤더 옆 짧은 안내
}

export interface SctQuestion {
  code: string; // "A1" ~ "D3"
  category: SctCategoryCode;
  prompt: string; // 미완성 문장 (___ 자리는 입력 필드로 대체)
  examples: string[]; // 1~2개의 짧은 예시
}

export const SCT_CATEGORIES: Record<SctCategoryCode, SctCategory> = {
  A: {
    code: "A",
    labelKo: "자기 가치",
    introKo: "내가 나를 어떻게 바라보는지",
  },
  B: {
    code: "B",
    labelKo: "성취·인정",
    introKo: "성과와 인정에 대한 마음의 규칙",
  },
  C: {
    code: "C",
    labelKo: "타인 신뢰·관계",
    introKo: "사람들과의 관계에서 작동하는 믿음",
  },
  D: {
    code: "D",
    labelKo: "통제·안전",
    introKo: "통제하지 못할 때 일어나는 반응",
  },
};

export const SCT_QUESTIONS: SctQuestion[] = [
  // ── A. 자기 가치 (4문항)
  {
    code: "A1",
    category: "A",
    prompt: "내가 정말로 별 볼일 없다고 느낄 때는",
    examples: ["예: 회의에서 내 의견이 통하지 않을 때"],
  },
  {
    code: "A2",
    category: "A",
    prompt: "다른 사람들이 진짜 내 모습을 알게 된다면",
    examples: ["예: 실망할 거예요", "예: 거리를 둘 것 같아요"],
  },
  {
    code: "A3",
    category: "A",
    prompt: "나에게 가장 부족한 것은",
    examples: ["예: 자신감", "예: 꾸준함"],
  },
  {
    code: "A4",
    category: "A",
    prompt: "내가 나 자신에게 가장 자주 하는 말은",
    examples: ["예: 더 잘했어야지"],
  },

  // ── B. 성취·인정 (4문항)
  {
    code: "B1",
    category: "B",
    prompt: "내가 멈추거나 쉬게 되면",
    examples: ["예: 불안해져요", "예: 뒤처질 것 같아요"],
  },
  {
    code: "B2",
    category: "B",
    prompt: "내 가치는 ___에 달려 있다",
    examples: ["예: 성과", "예: 다른 사람의 평가"],
  },
  {
    code: "B3",
    category: "B",
    prompt: "사람들이 나를 인정해주지 않으면",
    examples: ["예: 의미가 없게 느껴져요"],
  },
  {
    code: "B4",
    category: "B",
    prompt: "내가 절대 해서는 안 되는 일은",
    examples: ["예: 실수", "예: 약한 모습 보이기"],
  },

  // ── C. 타인 신뢰·관계 (3문항)
  {
    code: "C1",
    category: "C",
    prompt: "사람들이란 결국",
    examples: ["예: 자기 이익이 우선인 것 같아요"],
  },
  {
    code: "C2",
    category: "C",
    prompt: "누군가에게 진짜 약한 모습을 보이면",
    examples: ["예: 만만하게 볼까 봐 걱정돼요"],
  },
  {
    code: "C3",
    category: "C",
    prompt: "가까운 관계에서 가장 두려운 것은",
    examples: ["예: 결국 떠나가는 것"],
  },

  // ── D. 통제·안전 (3문항)
  {
    code: "D1",
    category: "D",
    prompt: "내가 모든 걸 통제하지 않으면",
    examples: ["예: 다 무너질 것 같아요"],
  },
  {
    code: "D2",
    category: "D",
    prompt: "실수를 하면 나는",
    examples: ["예: 자책을 오래 해요"],
  },
  {
    code: "D3",
    category: "D",
    prompt: "내가 가장 두려워하는 것은",
    examples: ["예: 무가치해지는 것"],
  },
];

export const SCT_TOTAL_COUNT = SCT_QUESTIONS.length; // 14
export const SCT_MIN_FOR_ANALYSIS = 7; // 분석 활성화 임계치 (절반)

export function getSctQuestionsByCategory(
  code: SctCategoryCode
): SctQuestion[] {
  return SCT_QUESTIONS.filter((q) => q.category === code);
}

export function getSctQuestion(code: string): SctQuestion | undefined {
  return SCT_QUESTIONS.find((q) => q.code === code);
}
