import { HusbandType } from '../types';

/**
 * 48 Husband Types (6 categories × 4 subtypes × 2 E/I variants)
 *
 * This is a STUB file for demonstration.
 * You should implement this in Cursor with:
 * - Complete descriptions for each type
 * - Accurate 18-dimensional ideal vectors
 * - Creative metaphors for E/I variants
 *
 * Categories:
 * 1. 성장파트너형 (Growth Partner)
 * 2. 안정추구형 (Stability Seeker)
 * 3. 모험가형 (Adventurer)
 * 4. 감성교감형 (Emotional Resonance)
 * 5. 리더십형 (Leadership)
 * 6. 자유영혼형 (Free Spirit)
 */

export const HUSBAND_TYPES: HusbandType[] = [
  // Example: 성장파트너형 - 모험가
  {
    id: 'growth_adventurer_e',
    name: '성장파트너형 - 모험가 (외향)',
    category: '성장파트너형',
    subcategory: '모험가',
    variant: 'extrovert',
    description: '함께 새로운 경험을 즐기며 성장하는 파트너',
    // These vectors should be carefully calibrated in Cursor
    idealVector: [
      75, 35, 60, 70, 75, 70, 60, // TCI: NS, HA, RD, P, SD, CO, ST
      60, 50, 70, // Enneagram: head, heart, body
      40, 50, 60, 40, 30, 45, 55, 50, // Content preferences
    ],
    metaphor_e: '새로운 세계를 함께 탐험하는 동반자',
  },
  {
    id: 'growth_adventurer_i',
    name: '성장파트너형 - 모험가 (내향)',
    category: '성장파트너형',
    subcategory: '모험가',
    variant: 'introvert',
    description: '깊이 있는 탐구를 통해 함께 성장하는 파트너',
    idealVector: [
      70, 40, 55, 75, 80, 65, 65,
      70, 45, 60,
      35, 60, 50, 45, 35, 40, 60, 45,
    ],
    metaphor_i: '조용히 깊은 바다를 함께 탐험하는 잠수부',
  },

  // 성장파트너형 - 학자
  {
    id: 'growth_scholar_e',
    name: '성장파트너형 - 학자 (외향)',
    category: '성장파트너형',
    subcategory: '학자',
    variant: 'extrovert',
    description: '지식을 나누며 함께 배우고 성장하는 파트너. 토론과 대화를 통해 서로의 지적 호기심을 자극하며, 새로운 아이디어를 함께 탐구합니다.',
    idealVector: [
      65, 45, 55, 85, 90, 65, 75, // TCI: NS, HA, RD, P, SD, CO, ST
      80, 40, 50, // Enneagram: head, heart, body
      30, 70, 30, 40, 25, 50, 65, 40, // Content
    ],
    metaphor_e: '함께 지혜의 숲을 탐험하는 동료 연구자',
  },
  {
    id: 'growth_scholar_i',
    name: '성장파트너형 - 학자 (내향)',
    category: '성장파트너형',
    subcategory: '학자',
    variant: 'introvert',
    description: '깊이 있는 사색과 연구를 통해 함께 성장하는 파트너. 조용한 대화 속에서 깊은 통찰을 나누며, 서로의 내면세계를 탐구합니다.',
    idealVector: [
      55, 50, 50, 90, 95, 60, 80,
      85, 35, 45,
      25, 75, 25, 45, 30, 45, 70, 35,
    ],
    metaphor_i: '고요한 서재에서 함께 진리를 탐구하는 학자',
  },

  // 성장파트너형 - 멘토
  {
    id: 'growth_mentor_e',
    name: '성장파트너형 - 멘토 (외향)',
    category: '성장파트너형',
    subcategory: '멘토',
    variant: 'extrovert',
    description: '서로를 격려하고 이끌어주는 파트너. 긍정적인 에너지로 상대방의 잠재력을 끌어내며, 함께 목표를 향해 나아갑니다.',
    idealVector: [
      70, 40, 65, 80, 85, 75, 70,
      65, 60, 65,
      35, 55, 45, 50, 30, 55, 60, 50,
    ],
    metaphor_e: '함께 산을 오르며 서로를 격려하는 등반 파트너',
  },
  {
    id: 'growth_mentor_i',
    name: '성장파트너형 - 멘토 (내향)',
    category: '성장파트너형',
    subcategory: '멘토',
    variant: 'introvert',
    description: '조용히 지지하며 함께 성장하는 파트너. 깊은 공감과 이해를 바탕으로 상대방의 내면적 성장을 돕습니다.',
    idealVector: [
      60, 45, 60, 85, 90, 70, 75,
      70, 55, 60,
      30, 60, 40, 55, 35, 50, 65, 45,
    ],
    metaphor_i: '조용히 옆에서 성장을 지켜보는 정원사',
  },

  // 성장파트너형 - 크리에이터
  {
    id: 'growth_creator_e',
    name: '성장파트너형 - 크리에이터 (외향)',
    category: '성장파트너형',
    subcategory: '크리에이터',
    variant: 'extrovert',
    description: '창의적인 프로젝트를 함께 만들어가는 파트너. 새로운 아이디어를 실현하며 서로의 창의성을 자극합니다.',
    idealVector: [
      75, 35, 70, 75, 80, 70, 85,
      60, 65, 60,
      45, 50, 40, 55, 35, 60, 70, 55,
    ],
    metaphor_e: '함께 새로운 세계를 창조하는 예술가',
  },
  {
    id: 'growth_creator_i',
    name: '성장파트너형 - 크리에이터 (내향)',
    category: '성장파트너형',
    subcategory: '크리에이터',
    variant: 'introvert',
    description: '깊은 영감을 나누며 함께 창작하는 파트너. 조용한 작업 속에서 서로의 예술적 감성을 키워갑니다.',
    idealVector: [
      65, 40, 65, 80, 85, 65, 90,
      65, 60, 55,
      40, 55, 35, 60, 40, 55, 75, 50,
    ],
    metaphor_i: '고요한 작업실에서 함께 작품을 빚는 장인',
  },

  // 안정추구형 - 수호자
  {
    id: 'stability_guardian_e',
    name: '안정추구형 - 수호자 (외향)',
    category: '안정추구형',
    subcategory: '수호자',
    variant: 'extrovert',
    description: '가족과 관계를 소중히 여기며 안정적인 삶을 추구하는 파트너. 따뜻한 보살핌으로 편안한 가정을 만듭니다.',
    idealVector: [
      40, 55, 70, 60, 65, 85, 65,
      50, 70, 60,
      40, 45, 35, 60, 30, 50, 50, 55,
    ],
    metaphor_e: '따뜻한 둥지를 함께 지키는 수호천사',
  },
  {
    id: 'stability_guardian_i',
    name: '안정추구형 - 수호자 (내향)',
    category: '안정추구형',
    subcategory: '수호자',
    variant: 'introvert',
    description: '조용히 가족을 지키는 든든한 파트너. 깊은 헌신으로 안정적이고 평화로운 가정을 만듭니다.',
    idealVector: [
      35, 60, 65, 65, 70, 80, 70,
      55, 65, 55,
      35, 50, 30, 65, 35, 45, 55, 50,
    ],
    metaphor_i: '조용한 항구처럼 안전함을 주는 등대',
  },

  // 안정추구형 - 건설자
  {
    id: 'stability_builder_e',
    name: '안정추구형 - 건설자 (외향)',
    category: '안정추구형',
    subcategory: '건설자',
    variant: 'extrovert',
    description: '체계적으로 미래를 설계하는 파트너. 실용적인 계획으로 안정적인 기반을 함께 만들어갑니다.',
    idealVector: [
      45, 50, 60, 75, 70, 75, 60,
      60, 55, 65,
      35, 50, 40, 55, 40, 60, 55, 50,
    ],
    metaphor_e: '함께 튼튼한 집을 짓는 건축가',
  },
  {
    id: 'stability_builder_i',
    name: '안정추구형 - 건설자 (내향)',
    category: '안정추구형',
    subcategory: '건설자',
    variant: 'introvert',
    description: '신중하게 미래를 준비하는 파트너. 꼼꼼한 계획으로 안정적인 삶의 토대를 쌓아갑니다.',
    idealVector: [
      40, 55, 55, 80, 75, 70, 65,
      65, 50, 60,
      30, 55, 35, 60, 45, 55, 60, 45,
    ],
    metaphor_i: '조용히 기초를 다지는 석공',
  },

  // 안정추구형 - 조율자
  {
    id: 'stability_harmonizer_e',
    name: '안정추구형 - 조율자 (외향)',
    category: '안정추구형',
    subcategory: '조율자',
    variant: 'extrovert',
    description: '관계의 균형을 중시하는 파트너. 갈등을 조화롭게 해결하며 평화로운 관계를 유지합니다.',
    idealVector: [
      50, 50, 75, 65, 70, 85, 70,
      55, 75, 55,
      40, 45, 35, 55, 30, 55, 50, 60,
    ],
    metaphor_e: '조화로운 오케스트라를 이끄는 지휘자',
  },
  {
    id: 'stability_harmonizer_i',
    name: '안정추구형 - 조율자 (내향)',
    category: '안정추구형',
    subcategory: '조율자',
    variant: 'introvert',
    description: '조용히 균형을 맞추는 파트너. 깊은 이해로 관계의 조화를 유지하며 평온함을 만듭니다.',
    idealVector: [
      45, 55, 70, 70, 75, 80, 75,
      60, 70, 50,
      35, 50, 30, 60, 35, 50, 55, 55,
    ],
    metaphor_i: '고요한 호수처럼 평온함을 주는 존재',
  },

  // 안정추구형 - 전통주의자
  {
    id: 'stability_traditionalist_e',
    name: '안정추구형 - 전통주의자 (외향)',
    category: '안정추구형',
    subcategory: '전통주의자',
    variant: 'extrovert',
    description: '가치와 전통을 소중히 여기는 파트너. 검증된 방식으로 안정적인 가정을 이끌어갑니다.',
    idealVector: [
      40, 60, 65, 70, 65, 80, 60,
      50, 60, 65,
      35, 45, 40, 60, 35, 50, 50, 55,
    ],
    metaphor_e: '든든한 뿌리를 지닌 오래된 나무',
  },
  {
    id: 'stability_traditionalist_i',
    name: '안정추구형 - 전통주의자 (내향)',
    category: '안정추구형',
    subcategory: '전통주의자',
    variant: 'introvert',
    description: '조용히 가치를 지키는 파트너. 깊은 신념으로 안정적인 삶의 방식을 유지합니다.',
    idealVector: [
      35, 65, 60, 75, 70, 75, 65,
      55, 55, 60,
      30, 50, 35, 65, 40, 45, 55, 50,
    ],
    metaphor_i: '세월을 견딘 고요한 사원',
  },

  // 모험가형 - 탐험가
  {
    id: 'adventurer_explorer_e',
    name: '모험가형 - 탐험가 (외향)',
    category: '모험가형',
    subcategory: '탐험가',
    variant: 'extrovert',
    description: '새로운 경험을 적극적으로 찾는 파트너. 함께 세계를 여행하며 다양한 문화와 경험을 즐깁니다.',
    idealVector: [
      85, 30, 65, 65, 70, 70, 60,
      55, 60, 75,
      35, 45, 55, 45, 70, 50, 55, 60,
    ],
    metaphor_e: '미지의 대륙을 함께 탐험하는 모험가',
  },
  {
    id: 'adventurer_explorer_i',
    name: '모험가형 - 탐험가 (내향)',
    category: '모험가형',
    subcategory: '탐험가',
    variant: 'introvert',
    description: '깊이 있게 세계를 탐구하는 파트너. 조용히 새로운 문화와 지식을 흡수하며 함께 성장합니다.',
    idealVector: [
      75, 35, 60, 70, 75, 65, 65,
      60, 55, 70,
      30, 50, 50, 50, 65, 45, 60, 55,
    ],
    metaphor_i: '고요히 깊은 숲을 탐험하는 여행자',
  },

  // 모험가형 - 도전자
  {
    id: 'adventurer_challenger_e',
    name: '모험가형 - 도전자 (외향)',
    category: '모험가형',
    subcategory: '도전자',
    variant: 'extrovert',
    description: '한계에 도전하며 함께 성장하는 파트너. 새로운 목표를 향해 열정적으로 나아갑니다.',
    idealVector: [
      80, 35, 60, 70, 65, 65, 55,
      50, 55, 80,
      40, 40, 65, 40, 60, 55, 50, 55,
    ],
    metaphor_e: '함께 정상을 향해 달리는 마라토너',
  },
  {
    id: 'adventurer_challenger_i',
    name: '모험가형 - 도전자 (내향)',
    category: '모험가형',
    subcategory: '도전자',
    variant: 'introvert',
    description: '내면의 한계를 극복하는 파트너. 조용히 자신과의 싸움에서 승리하며 함께 강해집니다.',
    idealVector: [
      70, 40, 55, 75, 70, 60, 60,
      55, 50, 75,
      35, 45, 60, 45, 55, 50, 55, 50,
    ],
    metaphor_i: '고요히 내면의 산을 오르는 수행자',
  },

  // 모험가형 - 혁신가
  {
    id: 'adventurer_innovator_e',
    name: '모험가형 - 혁신가 (외향)',
    category: '모험가형',
    subcategory: '혁신가',
    variant: 'extrovert',
    description: '새로운 방식을 시도하는 파트너. 기존의 틀을 깨고 혁신적인 삶을 함께 만들어갑니다.',
    idealVector: [
      80, 30, 55, 70, 75, 60, 70,
      65, 50, 70,
      40, 45, 50, 45, 55, 65, 60, 55,
    ],
    metaphor_e: '미래를 함께 창조하는 혁명가',
  },
  {
    id: 'adventurer_innovator_i',
    name: '모험가형 - 혁신가 (내향)',
    category: '모험가형',
    subcategory: '혁신가',
    variant: 'introvert',
    description: '조용히 혁신을 만드는 파트너. 깊은 사고로 새로운 가능성을 발견하고 실현합니다.',
    idealVector: [
      70, 35, 50, 75, 80, 55, 75,
      70, 45, 65,
      35, 50, 45, 50, 50, 60, 65, 50,
    ],
    metaphor_i: '고요한 실험실에서 미래를 발명하는 과학자',
  },

  // 모험가형 - 자유인
  {
    id: 'adventurer_free_spirit_e',
    name: '모험가형 - 자유인 (외향)',
    category: '모험가형',
    subcategory: '자유인',
    variant: 'extrovert',
    description: '자유롭게 살아가는 파트너. 규칙에 얽매이지 않고 함께 즉흥적인 삶을 즐깁니다.',
    idealVector: [
      85, 25, 70, 60, 65, 65, 65,
      50, 65, 70,
      45, 40, 55, 40, 65, 55, 55, 65,
    ],
    metaphor_e: '바람처럼 자유롭게 날아다니는 새',
  },
  {
    id: 'adventurer_free_spirit_i',
    name: '모험가형 - 자유인 (내향)',
    category: '모험가형',
    subcategory: '자유인',
    variant: 'introvert',
    description: '내면의 자유를 추구하는 파트너. 조용히 자신만의 길을 가며 독립적인 삶을 삽니다.',
    idealVector: [
      75, 30, 65, 65, 70, 60, 70,
      55, 60, 65,
      40, 45, 50, 45, 60, 50, 60, 60,
    ],
    metaphor_i: '고요히 자신의 길을 가는 구름',
  },

  // 감성교감형 - 공감자
  {
    id: 'emotional_empath_e',
    name: '감성교감형 - 공감자 (외향)',
    category: '감성교감형',
    subcategory: '공감자',
    variant: 'extrovert',
    description: '깊은 공감 능력을 지닌 파트너. 상대방의 감정을 잘 이해하고 따뜻하게 위로합니다.',
    idealVector: [
      55, 45, 80, 60, 65, 85, 75,
      50, 85, 50,
      40, 45, 30, 55, 25, 50, 55, 60,
    ],
    metaphor_e: '마음을 어루만지는 따뜻한 봄바람',
  },
  {
    id: 'emotional_empath_i',
    name: '감성교감형 - 공감자 (내향)',
    category: '감성교감형',
    subcategory: '공감자',
    variant: 'introvert',
    description: '조용히 마음을 나누는 파트너. 깊은 이해로 상대방의 내면을 어루만집니다.',
    idealVector: [
      50, 50, 75, 65, 70, 80, 80,
      55, 80, 45,
      35, 50, 25, 60, 30, 45, 60, 55,
    ],
    metaphor_i: '고요한 달빛처럼 마음을 비추는 존재',
  },

  // 감성교감형 - 예술가
  {
    id: 'emotional_artist_e',
    name: '감성교감형 - 예술가 (외향)',
    category: '감성교감형',
    subcategory: '예술가',
    variant: 'extrovert',
    description: '감성을 예술로 표현하는 파트너. 아름다움을 함께 만들고 나누며 삶을 풍요롭게 합니다.',
    idealVector: [
      65, 40, 75, 65, 70, 75, 85,
      55, 80, 55,
      50, 45, 35, 50, 30, 60, 70, 60,
    ],
    metaphor_e: '함께 아름다운 그림을 그리는 화가',
  },
  {
    id: 'emotional_artist_i',
    name: '감성교감형 - 예술가 (내향)',
    category: '감성교감형',
    subcategory: '예술가',
    variant: 'introvert',
    description: '내면의 감성을 작품으로 승화하는 파트너. 조용한 창작 속에서 깊은 감동을 나눕니다.',
    idealVector: [
      60, 45, 70, 70, 75, 70, 90,
      60, 75, 50,
      45, 50, 30, 55, 35, 55, 75, 55,
    ],
    metaphor_i: '고요한 작업실에서 영혼을 담는 조각가',
  },

  // 감성교감형 - 치유자
  {
    id: 'emotional_healer_e',
    name: '감성교감형 - 치유자 (외향)',
    category: '감성교감형',
    subcategory: '치유자',
    variant: 'extrovert',
    description: '상처를 치유하는 따뜻한 파트너. 긍정적인 에너지로 서로를 회복시키고 성장시킵니다.',
    idealVector: [
      50, 50, 75, 65, 70, 85, 70,
      55, 85, 50,
      35, 50, 30, 60, 25, 55, 60, 60,
    ],
    metaphor_e: '상처를 어루만지는 따뜻한 햇살',
  },
  {
    id: 'emotional_healer_i',
    name: '감성교감형 - 치유자 (내향)',
    category: '감성교감형',
    subcategory: '치유자',
    variant: 'introvert',
    description: '조용히 마음을 치유하는 파트너. 깊은 공감으로 내면의 상처를 회복시킵니다.',
    idealVector: [
      45, 55, 70, 70, 75, 80, 75,
      60, 80, 45,
      30, 55, 25, 65, 30, 50, 65, 55,
    ],
    metaphor_i: '고요한 숲속 샘물처럼 마음을 정화하는 존재',
  },

  // 감성교감형 - 낭만주의자
  {
    id: 'emotional_romantic_e',
    name: '감성교감형 - 낭만주의자 (외향)',
    category: '감성교감형',
    subcategory: '낭만주의자',
    variant: 'extrovert',
    description: '로맨틱한 순간을 만드는 파트너. 특별한 경험으로 관계를 풍요롭게 하고 추억을 만듭니다.',
    idealVector: [
      60, 40, 80, 60, 65, 80, 75,
      50, 85, 55,
      45, 40, 35, 50, 40, 55, 65, 65,
    ],
    metaphor_e: '별빛 아래 함께 춤추는 연인',
  },
  {
    id: 'emotional_romantic_i',
    name: '감성교감형 - 낭만주의자 (내향)',
    category: '감성교감형',
    subcategory: '낭만주의자',
    variant: 'introvert',
    description: '조용한 낭만을 즐기는 파트너. 소소한 순간에서 깊은 감동을 찾고 나눕니다.',
    idealVector: [
      55, 45, 75, 65, 70, 75, 80,
      55, 80, 50,
      40, 45, 30, 55, 45, 50, 70, 60,
    ],
    metaphor_i: '고요한 밤하늘의 별처럼 은은하게 빛나는 존재',
  },

  // 리더십형 - 비전가
  {
    id: 'leadership_visionary_e',
    name: '리더십형 - 비전가 (외향)',
    category: '리더십형',
    subcategory: '비전가',
    variant: 'extrovert',
    description: '큰 그림을 그리는 파트너. 명확한 비전으로 함께 미래를 설계하고 이끌어갑니다.',
    idealVector: [
      70, 40, 55, 80, 75, 70, 65,
      70, 55, 70,
      40, 50, 50, 45, 40, 60, 60, 50,
    ],
    metaphor_e: '미래를 향해 나아가는 항해사',
  },
  {
    id: 'leadership_visionary_i',
    name: '리더십형 - 비전가 (내향)',
    category: '리더십형',
    subcategory: '비전가',
    variant: 'introvert',
    description: '깊은 통찰로 미래를 보는 파트너. 조용히 방향을 제시하며 함께 목표를 향해 나아갑니다.',
    idealVector: [
      60, 45, 50, 85, 80, 65, 70,
      75, 50, 65,
      35, 55, 45, 50, 45, 55, 65, 45,
    ],
    metaphor_i: '고요히 별을 읽는 현자',
  },

  // 리더십형 - 전략가
  {
    id: 'leadership_strategist_e',
    name: '리더십형 - 전략가 (외향)',
    category: '리더십형',
    subcategory: '전략가',
    variant: 'extrovert',
    description: '체계적으로 계획하는 파트너. 논리적인 전략으로 목표를 달성하며 함께 성공합니다.',
    idealVector: [
      65, 45, 50, 85, 80, 65, 60,
      75, 45, 70,
      35, 55, 50, 40, 45, 65, 60, 45,
    ],
    metaphor_e: '전장을 지휘하는 명장군',
  },
  {
    id: 'leadership_strategist_i',
    name: '리더십형 - 전략가 (내향)',
    category: '리더십형',
    subcategory: '전략가',
    variant: 'introvert',
    description: '깊이 생각하며 전략을 세우는 파트너. 신중한 계획으로 확실한 성과를 만듭니다.',
    idealVector: [
      55, 50, 45, 90, 85, 60, 65,
      80, 40, 65,
      30, 60, 45, 45, 50, 60, 65, 40,
    ],
    metaphor_i: '조용히 수를 읽는 바둑 기사',
  },

  // 리더십형 - 조직가
  {
    id: 'leadership_organizer_e',
    name: '리더십형 - 조직가 (외향)',
    category: '리더십형',
    subcategory: '조직가',
    variant: 'extrovert',
    description: '효율적으로 관리하는 파트너. 체계적인 시스템으로 안정적인 삶을 만들어갑니다.',
    idealVector: [
      60, 50, 55, 80, 75, 75, 55,
      65, 50, 70,
      35, 50, 45, 50, 40, 60, 55, 50,
    ],
    metaphor_e: '완벽하게 조율된 오케스트라의 지휘자',
  },
  {
    id: 'leadership_organizer_i',
    name: '리더십형 - 조직가 (내향)',
    category: '리더십형',
    subcategory: '조직가',
    variant: 'introvert',
    description: '조용히 체계를 만드는 파트너. 꼼꼼한 관리로 안정적인 구조를 세웁니다.',
    idealVector: [
      50, 55, 50, 85, 80, 70, 60,
      70, 45, 65,
      30, 55, 40, 55, 45, 55, 60, 45,
    ],
    metaphor_i: '고요히 질서를 만드는 건축가',
  },

  // 리더십형 - 영감가
  {
    id: 'leadership_inspirer_e',
    name: '리더십형 - 영감가 (외향)',
    category: '리더십형',
    subcategory: '영감가',
    variant: 'extrovert',
    description: '열정으로 동기부여하는 파트너. 긍정적인 에너지로 함께 꿈을 향해 나아갑니다.',
    idealVector: [
      70, 35, 65, 75, 70, 75, 70,
      60, 70, 70,
      45, 45, 50, 45, 35, 60, 60, 60,
    ],
    metaphor_e: '불꽃처럼 열정을 나누는 영감의 원천',
  },
  {
    id: 'leadership_inspirer_i',
    name: '리더십형 - 영감가 (내향)',
    category: '리더십형',
    subcategory: '영감가',
    variant: 'introvert',
    description: '조용히 영감을 주는 파트너. 깊은 통찰로 상대방의 잠재력을 일깨웁니다.',
    idealVector: [
      60, 40, 60, 80, 75, 70, 75,
      65, 65, 65,
      40, 50, 45, 50, 40, 55, 65, 55,
    ],
    metaphor_i: '고요히 빛을 밝히는 등불',
  },

  // 자유영혼형 - 몽상가
  {
    id: 'free_dreamer_e',
    name: '자유영혼형 - 몽상가 (외향)',
    category: '자유영혼형',
    subcategory: '몽상가',
    variant: 'extrovert',
    description: '꿈과 이상을 추구하는 파트너. 상상력으로 새로운 가능성을 함께 탐구합니다.',
    idealVector: [
      75, 35, 70, 60, 65, 65, 80,
      60, 70, 55,
      50, 40, 40, 45, 40, 55, 70, 65,
    ],
    metaphor_e: '무지개를 쫓는 자유로운 영혼',
  },
  {
    id: 'free_dreamer_i',
    name: '자유영혼형 - 몽상가 (내향)',
    category: '자유영혼형',
    subcategory: '몽상가',
    variant: 'introvert',
    description: '내면의 세계를 탐험하는 파트너. 조용히 꿈을 키우며 상상의 나래를 펼칩니다.',
    idealVector: [
      65, 40, 65, 65, 70, 60, 85,
      65, 65, 50,
      45, 45, 35, 50, 45, 50, 75, 60,
    ],
    metaphor_i: '고요한 밤하늘의 별을 바라보는 시인',
  },

  // 자유영혼형 - 철학자
  {
    id: 'free_philosopher_e',
    name: '자유영혼형 - 철학자 (외향)',
    category: '자유영혼형',
    subcategory: '철학자',
    variant: 'extrovert',
    description: '삶의 의미를 탐구하는 파트너. 깊은 대화로 함께 진리를 찾아갑니다.',
    idealVector: [
      60, 45, 60, 80, 85, 60, 75,
      80, 50, 50,
      35, 65, 30, 45, 35, 50, 70, 45,
    ],
    metaphor_e: '진리를 찾아 함께 대화하는 소크라테스',
  },
  {
    id: 'free_philosopher_i',
    name: '자유영혼형 - 철학자 (내향)',
    category: '자유영혼형',
    subcategory: '철학자',
    variant: 'introvert',
    description: '조용히 사색하는 파트너. 깊은 성찰로 삶의 본질을 함께 탐구합니다.',
    idealVector: [
      50, 50, 55, 85, 90, 55, 80,
      85, 45, 45,
      30, 70, 25, 50, 40, 45, 75, 40,
    ],
    metaphor_i: '고요한 산속에서 명상하는 수도자',
  },

  // 자유영혼형 - 유목민
  {
    id: 'free_nomad_e',
    name: '자유영혼형 - 유목민 (외향)',
    category: '자유영혼형',
    subcategory: '유목민',
    variant: 'extrovert',
    description: '자유롭게 떠도는 파트너. 새로운 곳을 찾아 함께 여행하며 삶을 즐깁니다.',
    idealVector: [
      80, 30, 70, 55, 60, 60, 65,
      50, 60, 70,
      45, 35, 60, 40, 75, 50, 55, 70,
    ],
    metaphor_e: '바람을 따라 떠도는 자유로운 여행자',
  },
  {
    id: 'free_nomad_i',
    name: '자유영혼형 - 유목민 (내향)',
    category: '자유영혼형',
    subcategory: '유목민',
    variant: 'introvert',
    description: '조용히 자신의 길을 가는 파트너. 내면의 나침반을 따라 독립적으로 살아갑니다.',
    idealVector: [
      70, 35, 65, 60, 65, 55, 70,
      55, 55, 65,
      40, 40, 55, 45, 70, 45, 60, 65,
    ],
    metaphor_i: '고요히 자신만의 길을 걷는 순례자',
  },

  // 자유영혼형 - 반항아
  {
    id: 'free_rebel_e',
    name: '자유영혼형 - 반항아 (외향)',
    category: '자유영혼형',
    subcategory: '반항아',
    variant: 'extrovert',
    description: '기존의 틀을 깨는 파트너. 자유롭게 자신만의 방식으로 살아가며 변화를 만듭니다.',
    idealVector: [
      85, 25, 65, 60, 65, 55, 70,
      55, 60, 75,
      50, 35, 55, 35, 65, 60, 60, 65,
    ],
    metaphor_e: '규칙을 깨고 새로운 길을 만드는 개척자',
  },
  {
    id: 'free_rebel_i',
    name: '자유영혼형 - 반항아 (내향)',
    category: '자유영혼형',
    subcategory: '반항아',
    variant: 'introvert',
    description: '조용히 저항하는 파트너. 내면의 신념으로 자신만의 방식을 고수합니다.',
    idealVector: [
      75, 30, 60, 65, 70, 50, 75,
      60, 55, 70,
      45, 40, 50, 40, 60, 55, 65, 60,
    ],
    metaphor_i: '고요히 자신의 신념을 지키는 은둔자',
  },
];

export function getHusbandType(id: string): HusbandType | undefined {
  return HUSBAND_TYPES.find((type) => type.id === id);
}

export function getHusbandTypesByCategory(category: string): HusbandType[] {
  return HUSBAND_TYPES.filter((type) => type.category === category);
}

export function getAllHusbandTypes(): HusbandType[] {
  return HUSBAND_TYPES;
}

// Helper to convert E/I preference to variant
export function selectVariant(baseTypeId: string, isExtrovert: boolean): HusbandType | undefined {
  const variant = isExtrovert ? 'extrovert' : 'introvert';
  return HUSBAND_TYPES.find(
    (type) => type.id.startsWith(baseTypeId) && type.variant === variant
  );
}
