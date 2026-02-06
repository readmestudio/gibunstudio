/**
 * YouTube 구독 분석용 16개 카테고리 시스템
 * Spotify Wrapped 스타일의 시각적 분석을 위한 카테고리 분류
 */

// 16개 YouTube 카테고리
export const YOUTUBE_CATEGORIES = [
  'entertainment',      // 예능/버라이어티
  'vlog',              // 브이로그/일상
  'music',             // 음악
  'gaming',            // 게임
  'food',              // 먹방/요리
  'beauty',            // 뷰티/패션
  'education',         // 교육/자기계발
  'news',              // 시사/뉴스
  'tech',              // 기술/IT
  'sports',            // 스포츠/운동
  'pets',              // 반려동물
  'kids',              // 키즈
  'asmr',              // ASMR
  'finance',           // 투자/재테크
  'travel',            // 여행
  'other',             // 기타
] as const;

export type YouTubeCategory = typeof YOUTUBE_CATEGORIES[number];

// 카테고리 한글명
export const YOUTUBE_CATEGORY_NAMES: Record<YouTubeCategory, string> = {
  entertainment: '예능/버라이어티',
  vlog: '브이로그/일상',
  music: '음악',
  gaming: '게임',
  food: '먹방/요리',
  beauty: '뷰티/패션',
  education: '교육/자기계발',
  news: '시사/뉴스',
  tech: '기술/IT',
  sports: '스포츠/운동',
  pets: '반려동물',
  kids: '키즈',
  asmr: 'ASMR',
  finance: '투자/재테크',
  travel: '여행',
  other: '기타',
};

// 한국 유튜브 평균 구독 비율 (희소성 계산용)
export const YOUTUBE_AVERAGE_RATIOS: Record<YouTubeCategory, number> = {
  entertainment: 0.18,  // 18%
  music: 0.15,          // 15%
  gaming: 0.12,         // 12%
  vlog: 0.10,           // 10%
  food: 0.09,           // 9%
  beauty: 0.08,         // 8%
  news: 0.07,           // 7%
  education: 0.06,      // 6%
  tech: 0.04,           // 4%
  sports: 0.04,         // 4%
  finance: 0.03,        // 3%
  travel: 0.02,         // 2%
  pets: 0.01,           // 1%
  asmr: 0.005,          // 0.5%
  kids: 0.005,          // 0.5%
  other: 0.00,          // 기타 (희소성 계산에서 제외)
};

// TCI 6축 타입
export type TCIAxis = 'ST' | 'SD' | 'NS' | 'HA' | 'P' | 'CO';

// 카테고리별 6축 가중치 매트릭스
// 자기초월(ST), 자율성(SD), 자극추구(NS), 위험회피(HA), 인내력(P), 연대감(CO)
export const CATEGORY_TCI_WEIGHTS: Record<YouTubeCategory, Record<TCIAxis, number>> = {
  entertainment: { ST: 0, SD: 1, NS: 3, HA: 0, P: 0, CO: 2 },  // 예능: 자극추구+3, 연대감+2, 자율성+1
  vlog:          { ST: 1, SD: 2, NS: 0, HA: 0, P: 0, CO: 3 },  // 브이로그: 연대감+3, 자율성+2, 자기초월+1
  music:         { ST: 3, SD: 1, NS: 2, HA: 0, P: 0, CO: 0 },  // 음악: 자기초월+3, 자극추구+2, 자율성+1
  gaming:        { ST: 0, SD: 2, NS: 3, HA: 0, P: 1, CO: 0 },  // 게임: 자극추구+3, 자율성+2, 인내력+1
  education:     { ST: 3, SD: 1, NS: 0, HA: 0, P: 2, CO: 0 },  // 교육: 자기초월+3, 인내력+2, 자율성+1
  news:          { ST: 2, SD: 0, NS: 0, HA: 2, P: 0, CO: 2 },  // 시사뉴스: 자기초월+2, 연대감+2, 위험회피+2
  food:          { ST: 0, SD: 0, NS: 2, HA: 0, P: 1, CO: 2 },  // 먹방: 자극추구+2, 연대감+2, 인내력+1
  beauty:        { ST: 1, SD: 3, NS: 2, HA: 0, P: 0, CO: 0 },  // 뷰티: 자율성+3, 자극추구+2, 자기초월+1
  tech:          { ST: 2, SD: 3, NS: 0, HA: 0, P: 2, CO: 0 },  // 기술IT: 자율성+3, 자기초월+2, 인내력+2
  sports:        { ST: 0, SD: 0, NS: 2, HA: 0, P: 3, CO: 1 },  // 스포츠: 인내력+3, 자극추구+2, 연대감+1
  finance:       { ST: 0, SD: 2, NS: 0, HA: 2, P: 3, CO: 0 },  // 투자: 인내력+3, 위험회피+2, 자율성+2
  travel:        { ST: 2, SD: 2, NS: 3, HA: 0, P: 0, CO: 0 },  // 여행: 자극추구+3, 자기초월+2, 자율성+2
  pets:          { ST: 0, SD: 0, NS: 0, HA: 2, P: 1, CO: 3 },  // 반려동물: 연대감+3, 위험회피+2, 인내력+1
  asmr:          { ST: 2, SD: 0, NS: 0, HA: 3, P: 1, CO: 0 },  // ASMR: 위험회피+3, 자기초월+2, 인내력+1
  kids:          { ST: 0, SD: 0, NS: 0, HA: 2, P: 2, CO: 3 },  // 키즈: 연대감+3, 위험회피+2, 인내력+2
  other:         { ST: 1, SD: 1, NS: 1, HA: 1, P: 1, CO: 1 },  // 기타: 균등 분배
};

// 카테고리별 컬러 (바 차트용)
export const CATEGORY_COLORS: Record<YouTubeCategory, string> = {
  entertainment: '#FF6B6B',  // 빨강
  vlog: '#4ECDC4',           // 청록
  music: '#A78BFA',          // 보라
  gaming: '#10B981',         // 초록
  food: '#F59E0B',           // 주황
  beauty: '#EC4899',         // 핑크
  education: '#3B82F6',      // 파랑
  news: '#6B7280',           // 회색
  tech: '#14B8A6',           // 틸
  sports: '#EF4444',         // 레드
  finance: '#84CC16',        // 라임
  travel: '#06B6D4',         // 시안
  pets: '#F97316',           // 오렌지
  asmr: '#8B5CF6',           // 바이올렛
  kids: '#FBBF24',           // 노랑
  other: '#9CA3AF',          // 그레이
};

// 카테고리 분류 결과 타입
export interface YouTubeCategoryResult {
  category: YouTubeCategory;
  name: string;
  count: number;
  percent: number;
  color: string;
}

// 희소성 분석 결과 타입
export interface RarityAnalysis {
  percentile: number;           // 상위 N%
  rarestCategory: YouTubeCategory;
  rarestCategoryName: string;
  rarestCategoryPercent: number;
  rarestCategoryChannels: string[];
  cosineSimilarity: number;
}

// TCI 6축 점수 계산 결과
export interface YouTubeTCIScores {
  ST: number;  // 자기초월
  SD: number;  // 자율성
  NS: number;  // 자극추구
  HA: number;  // 위험회피
  P: number;   // 인내력
  CO: number;  // 연대감
}
