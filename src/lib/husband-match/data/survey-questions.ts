import { SurveyQuestion } from '../types';

// Phase 2 서베이 — 하이브리드 18문항 (스케일 5 + SCT 10 + CBT 3)
// q1-q5: 스케일(수치 교차검증용)
// q6-q15: SCT 문장완성(핵심 신념/자동 사고 파악용)
// q16-q18: CBT 강화(Hot Thought/중간 신념/핵심 신념)

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  // ── q1-q5: 스케일 (수치 교차검증용) ──

  {
    id: 'q1_together_time',
    question: '연인과 함께 보내는 시간은 어느 정도가 이상적인가요?',
    type: 'scale',
    min: 1,
    max: 10,
    placeholder: '1(각자 시간 많이) ~ 10(매일 함께)',
  },
  {
    id: 'q2_anxiety_influence',
    question: '불안하거나 걱정되는 마음이 중요한 결정에 얼마나 영향을 미치나요?',
    type: 'scale',
    min: 1,
    max: 10,
    placeholder: '1(거의 없음) ~ 10(매우 큼)',
  },
  {
    id: 'q3_logic_vs_emotion',
    question: '중요한 결정을 내릴 때 논리와 감정 중 어느 쪽에 더 기울어지나요?',
    type: 'scale',
    min: 1,
    max: 10,
    placeholder: '1(완전 감정) ~ 10(완전 논리)',
  },
  {
    id: 'q4_independence',
    question: '연인/배우자와의 관계에서 나만의 영역(취미, 친구, 시간)은 얼마나 중요한가요?',
    type: 'scale',
    min: 1,
    max: 10,
    placeholder: '1(모두 나누고 싶음) ~ 10(내 영역 필수)',
  },
  {
    id: 'q5_emotional_expression',
    question: '감정을 표현하는 편인가요?',
    type: 'scale',
    min: 1,
    max: 10,
    placeholder: '1(거의 안 함) ~ 10(매우 적극적)',
  },

  // ── q6-q8: SCT — 관계 패턴 (카드 4 "관계의 지도") ──

  {
    id: 'q6_conflict_pattern',
    question: '아래 문장을 완성해 주세요.',
    type: 'sct',
    sctPrompt: '연인과 갈등이 생기면, 나는 보통...',
    placeholder: '예: 일단 조용히 있다가, 나중에 조심스럽게 말을 꺼내요',
  },
  {
    id: 'q7_partner_distance',
    question: '아래 문장을 완성해 주세요.',
    type: 'sct',
    sctPrompt: '연인이 나에게서 멀어진다고 느낄 때, 나는...',
    placeholder: '예: 불안해지면서 더 연락을 자주 하게 돼요',
  },
  {
    id: 'q8_recurring_issue',
    question: '아래 문장을 완성해 주세요.',
    type: 'sct',
    sctPrompt: '관계에서 반복되는 문제가 있다면, 그건...',
    placeholder: '예: 내 기대를 말하지 않고 속으로 삼키는 것',
  },

  // ── q9-q11: SCT — 감정 처리 (카드 3 "내면의 계절") ──

  {
    id: 'q9_stress_response',
    question: '아래 문장을 완성해 주세요.',
    type: 'sct',
    sctPrompt: '나는 스트레스를 받으면 가장 먼저...',
    placeholder: '예: 혼자 방에 들어가서 유튜브를 켜요',
  },
  {
    id: 'q10_body_signal',
    question: '아래 문장을 완성해 주세요.',
    type: 'sct',
    sctPrompt: '불안하거나 두려울 때, 내 몸에서 가장 먼저 느껴지는 변화는...',
    placeholder: '예: 가슴이 답답해지고 손이 차가워져요',
  },
  {
    id: 'q11_comfort_source',
    question: '아래 문장을 완성해 주세요.',
    type: 'sct',
    sctPrompt: '나를 가장 편하게 만들어주는 사람이나 상황은...',
    placeholder: '예: 아무 말 없이 옆에 있어 주는 친구',
  },

  // ── q12-q13: SCT — 성장/두려움 (카드 6 "성장의 문턱") ──

  {
    id: 'q12_deepest_fear',
    question: '아래 문장을 완성해 주세요.',
    type: 'sct',
    sctPrompt: '결혼이나 깊은 관계를 생각할 때 가장 두려운 것은...',
    placeholder: '예: 나 자신을 잃어버릴까 봐',
  },
  {
    id: 'q13_want_to_change',
    question: '아래 문장을 완성해 주세요.',
    type: 'sct',
    sctPrompt: '관계에서 내가 바꾸고 싶지만 잘 안 되는 것은...',
    placeholder: '예: 화가 나도 참다가 나중에 폭발하는 것',
  },

  // ── q14-q15: SCT — 이상형/욕구 (카드 2 + 카드 7) ──

  {
    id: 'q14_ideal_day',
    question: '아래 문장을 완성해 주세요.',
    type: 'sct',
    sctPrompt: '내가 꿈꾸는 파트너와의 가장 이상적인 하루는...',
    placeholder: '예: 아침에 같이 산책하고, 각자 일하다가, 저녁에 요리하며 수다 떠는 하루',
  },
  {
    id: 'q15_core_desire',
    question: '아래 문장을 완성해 주세요.',
    type: 'sct',
    sctPrompt: '내가 진짜 원하는 관계는 한마디로...',
    placeholder: '예: 말하지 않아도 통하는 편안함',
  },

  // ── q16: Hot Thought 시나리오 (CBT — 자동적 사고) ──

  {
    id: 'q16_hot_scenario',
    question: '그 순간, 머릿속에 가장 먼저 떠오르는 생각은?',
    type: 'scenario',
    scenarioText: '오랜 연인과 함께 있는데, 갑자기 상대가 "우리 관계에 대해 진지하게 이야기 좀 하자"라고 말합니다.',
    placeholder: '예: "혹시 헤어지자는 건가?" / "내가 뭘 잘못했지?"',
  },

  // ── q17: 중간 신념 — 규칙/가정 (CBT) ──

  {
    id: 'q17_relationship_rules',
    question: '아래 세 문장을 각각 완성해 주세요.',
    type: 'multi_sct',
    multiSctPrompts: [
      '연인이라면 당연히 ~해야 한다',
      '연인이 나를 진심으로 사랑한다면, ~할 것이다',
      '내가 연인에게 약한 모습을 보이면, ~할 것이다',
    ],
    placeholder: '자유롭게 작성해 주세요',
  },

  // ── q18: 하향 화살표 — 핵심 신념 선택 (CBT) ──

  {
    id: 'q18_core_belief_choice',
    question: '"관계에서 상처받는 것이 두렵다"는 마음 아래에는 어떤 생각이 숨어 있을까요? 가장 가까운 것을 골라주세요.',
    type: 'choice',
    options: [
      '결국 나는 사랑받을 자격이 없는 사람이다',
      '사람들은 결국 나를 떠난다',
      '세상은 안전하지 않고, 언제든 상처받을 수 있다',
      '내가 완벽하지 않으면 사랑받을 수 없다',
      '나는 혼자서는 아무것도 할 수 없다',
      '위의 어느 것도 아닌, 다른 생각이 있다',
    ],
  },
];

export function getSurveyQuestion(id: string): SurveyQuestion | undefined {
  return SURVEY_QUESTIONS.find((q) => q.id === id);
}

export function getTotalQuestions(): number {
  return SURVEY_QUESTIONS.length;
}
