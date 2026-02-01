// YouTube channel categories for analysis
// These will be used by the LLM to classify channels

export const CHANNEL_CATEGORIES = {
  music: {
    id: 'music',
    name: '음악/분위기',
    description: '음악, 감성, 무드, 플레이리스트 관련 채널',
    keywords: ['음악', '노래', '뮤직', 'music', '플레이리스트', 'playlist', 'OST', '감성'],
  },
  reading: {
    id: 'reading',
    name: '독서/인문학',
    description: '책, 독서, 철학, 역사, 인문학 관련 채널',
    keywords: ['책', '독서', '인문', '철학', '역사', 'book', '문학', '작가'],
  },
  sports: {
    id: 'sports',
    name: '운동/스포츠',
    description: '운동, 피트니스, 스포츠, 건강 관련 채널',
    keywords: ['운동', '헬스', '요가', '필라테스', '축구', '농구', 'fitness', '스포츠'],
  },
  cooking: {
    id: 'cooking',
    name: '요리/먹방',
    description: '요리, 음식, 먹방, 레시피 관련 채널',
    keywords: ['요리', '먹방', '레시피', '음식', 'cooking', '맛집', '식당'],
  },
  travel: {
    id: 'travel',
    name: '여행/탐험',
    description: '여행, 여행 브이로그, 세계 탐험 관련 채널',
    keywords: ['여행', 'travel', '브이로그', 'vlog', '해외', '여행기', '세계여행'],
  },
  gaming: {
    id: 'gaming',
    name: '게임/e스포츠',
    description: '게임, e스포츠, 게임 방송 관련 채널',
    keywords: ['게임', 'gaming', '롤', 'LOL', '스타', '배그', 'e스포츠'],
  },
  tech: {
    id: 'tech',
    name: '테크/IT',
    description: '기술, IT, 가젯, 코딩, 개발 관련 채널',
    keywords: ['기술', 'tech', 'IT', '코딩', '개발', '프로그래밍', '가젯', '리뷰'],
  },
  art: {
    id: 'art',
    name: '예술/창작',
    description: '미술, 디자인, 창작, 공예 관련 채널',
    keywords: ['미술', '예술', 'art', '디자인', '그림', '창작', '공예'],
  },
  education: {
    id: 'education',
    name: '교육/지식',
    description: '교육, 강의, 지식, 학습 관련 채널',
    keywords: ['교육', '강의', '지식', '학습', 'education', '공부', '강좌'],
  },
  entertainment: {
    id: 'entertainment',
    name: '예능/엔터',
    description: '예능, 연예인, 엔터테인먼트, 버라이어티 관련 채널',
    keywords: ['예능', '연예인', '엔터', 'entertainment', '버라이어티', '방송'],
  },
} as const;

export type CategoryId = keyof typeof CHANNEL_CATEGORIES;

export const CATEGORY_IDS = Object.keys(CHANNEL_CATEGORIES) as CategoryId[];

// For the analysis pipeline
export function getCategoryDescription(categoryId: CategoryId): string {
  return CHANNEL_CATEGORIES[categoryId].description;
}

export function getCategoryKeywords(categoryId: CategoryId): readonly string[] {
  return CHANNEL_CATEGORIES[categoryId].keywords;
}

export function getAllCategories() {
  return CATEGORY_IDS.map((id) => ({
    id,
    name: CHANNEL_CATEGORIES[id].name,
    description: CHANNEL_CATEGORIES[id].description,
  }));
}
