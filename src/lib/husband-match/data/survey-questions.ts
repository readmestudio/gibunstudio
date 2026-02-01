import { SurveyQuestion } from '../types';

// Phase 2 survey questions (9 questions)
// These will be cross-validated with YouTube data

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: 'q1_relationship_style',
    question: '연애할 때 어떤 스타일인가요?',
    type: 'choice',
    options: [
      '매일 연락하고 자주 만나는 것이 좋아요',
      '각자의 시간을 존중하면서 만나는 게 편해요',
      '기분에 따라 달라요',
    ],
  },
  {
    id: 'q2_conflict_resolution',
    question: '갈등이 생겼을 때 어떻게 해결하나요?',
    type: 'choice',
    options: [
      '바로 대화로 풀어요',
      '혼자 시간을 가진 후 이야기해요',
      '시간이 해결해 주길 기다려요',
    ],
  },
  {
    id: 'q3_ideal_weekend',
    question: '이상적인 주말은 어떤 모습인가요?',
    type: 'choice',
    options: [
      '친구들과 활동적으로 보내기',
      '집에서 편하게 쉬기',
      '둘만의 데이트',
      '혼자만의 시간 갖기',
    ],
  },
  {
    id: 'q4_decision_making',
    question: '중요한 결정을 내릴 때 어떻게 하나요?',
    type: 'choice',
    options: [
      '논리적으로 분석해서 결정해요',
      '마음이 가는 대로 결정해요',
      '주변 사람들과 상의해요',
      '직감을 따라요',
    ],
  },
  {
    id: 'q5_future_planning',
    question: '미래 계획에 대해 어떻게 생각하나요?',
    type: 'choice',
    options: [
      '구체적인 계획을 세우는 것이 중요해요',
      '대략적인 방향만 정하고 유연하게 가요',
      '계획보다는 현재에 집중해요',
    ],
  },
  {
    id: 'q6_value_importance',
    question: '결혼 생활에서 가장 중요한 것은?',
    type: 'choice',
    options: [
      '서로에 대한 이해와 소통',
      '경제적 안정',
      '개인의 성장과 자유',
      '가족과의 조화',
    ],
  },
  {
    id: 'q7_emotional_expression',
    question: '감정을 표현하는 편인가요?',
    type: 'scale',
    min: 1,
    max: 10,
  },
  {
    id: 'q8_ideal_partner',
    question: '이상적인 파트너의 모습을 자유롭게 적어주세요',
    type: 'text',
    placeholder: '예: 저를 존중해주고, 함께 성장할 수 있는 사람...',
  },
  {
    id: 'q9_marriage_concern',
    question: '결혼에 대해 가장 고민되는 점은 무엇인가요?',
    type: 'text',
    placeholder: '솔직하게 작성해주세요. 이 답변은 분석에 중요하게 활용됩니다.',
  },
];

export function getSurveyQuestion(id: string): SurveyQuestion | undefined {
  return SURVEY_QUESTIONS.find((q) => q.id === id);
}

export function getTotalQuestions(): number {
  return SURVEY_QUESTIONS.length;
}
