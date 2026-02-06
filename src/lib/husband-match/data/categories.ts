// YouTube channel categories for analysis
// 문서 명세 기준 10대 카테고리

export const CHANNEL_CATEGORIES = {
  musicMood: {
    id: 'musicMood',
    name: '음악/분위기',
    description: '음악, 감성, 무드, 플레이리스트, ASMR, 분위기 관련 채널',
    keywords: ['음악', '노래', '뮤직', 'music', '플레이리스트', 'playlist', 'OST', '감성', 'ASMR', 'lofi', '힙합', 'jazz', '클래식', 'bgm', '인디', '발라드'],
  },
  readingHumanities: {
    id: 'readingHumanities',
    name: '독서/인문학',
    description: '책, 독서, 철학, 역사, 인문학, 문학, 시사 관련 채널',
    keywords: ['책', '독서', '인문', '철학', '역사', 'book', '문학', '작가', '도서', '서평', '고전', '시사', '논픽션', '에세이', '지식인'],
  },
  sportsOutdoor: {
    id: 'sportsOutdoor',
    name: '스포츠/아웃도어',
    description: '운동, 피트니스, 스포츠, 아웃도어, 등산, 캠핑, 여행, 액티비티 관련 채널',
    keywords: ['운동', '헬스', '요가', '필라테스', '축구', '농구', 'fitness', '스포츠', '등산', '캠핑', '여행', 'travel', '하이킹', '자전거', '러닝', '마라톤', '아웃도어', '서핑', '골프'],
  },
  entertainmentVlog: {
    id: 'entertainmentVlog',
    name: '예능/브이로그',
    description: '예능, 연예인, 엔터테인먼트, 버라이어티, 브이로그, 일상 관련 채널',
    keywords: ['예능', '연예인', '엔터', 'entertainment', '버라이어티', '방송', 'vlog', '브이로그', '일상', '먹방', '코미디', '개그', '토크쇼', '리얼리티'],
  },
  languageCulture: {
    id: 'languageCulture',
    name: '언어/다문화',
    description: '외국어 학습, 언어, 다문화, 해외 문화, 국제 관련 채널',
    keywords: ['영어', '일본어', '중국어', '한국어', '언어', 'language', '외국어', '다문화', '해외', '국제', '번역', '어학', 'english', 'japanese', 'korean', '문화', '세계'],
  },
  lifestyleSpace: {
    id: 'lifestyleSpace',
    name: '라이프스타일/공간',
    description: '인테리어, 공간, 미니멀리즘, 정리정돈, 요리, 홈카페, 일상 관리 관련 채널',
    keywords: ['인테리어', '공간', '집꾸미기', '미니멀', '정리', '청소', '홈', '라이프', 'lifestyle', '집순이', '요리', '레시피', '홈카페', '플랜트', '가드닝', '살림'],
  },
  careerBusiness: {
    id: 'careerBusiness',
    name: '커리어/창업',
    description: '취업, 이직, 창업, 비즈니스, 자기계발, 생산성, IT/테크 관련 채널',
    keywords: ['취업', '이직', '창업', '비즈니스', 'business', '스타트업', '자기계발', '생산성', '커리어', 'career', '면접', '개발', '코딩', 'IT', '테크', '프로그래밍', 'ai'],
  },
  healingSpirituality: {
    id: 'healingSpirituality',
    name: '힐링/영성',
    description: '명상, 힐링, 심리, 영성, 종교, 마음챙김, 상담, 치유 관련 채널',
    keywords: ['명상', '힐링', '심리', '영성', '종교', '마음', 'meditation', '치유', '상담', '멘탈', '스트레스', '불교', '기독교', '요가철학', '마인드풀니스', '자존감'],
  },
  fashionBeauty: {
    id: 'fashionBeauty',
    name: '패션/뷰티',
    description: '패션, 뷰티, 메이크업, 스타일링, 코디, 미용 관련 채널',
    keywords: ['패션', '뷰티', 'fashion', 'beauty', '메이크업', '화장', '스타일', '코디', '옷', '헤어', '네일', '스킨케어', '향수', '브랜드'],
  },
  financeInvest: {
    id: 'financeInvest',
    name: '경제/재테크',
    description: '경제, 재테크, 투자, 주식, 부동산, 금융, 저축 관련 채널',
    keywords: ['경제', '재테크', '투자', '주식', '부동산', '금융', '돈', '저축', '파이어족', '월급', '자산', '코인', '펀드', 'ETF', '재무'],
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

// 카테고리 한글명 매핑
export const CATEGORY_NAMES: Record<CategoryId, string> = {
  musicMood: '음악/분위기',
  readingHumanities: '독서/인문학',
  sportsOutdoor: '스포츠/아웃도어',
  entertainmentVlog: '예능/브이로그',
  languageCulture: '언어/다문화',
  lifestyleSpace: '라이프스타일/공간',
  careerBusiness: '커리어/창업',
  healingSpirituality: '힐링/영성',
  fashionBeauty: '패션/뷰티',
  financeInvest: '경제/재테크',
};
