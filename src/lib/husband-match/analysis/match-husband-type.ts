import { MBTIScores, HusbandType } from '../types';
import { getAllHusbandTypes } from '../data/husband-types';
import { CATEGORY_TCI_WEIGHTS, YOUTUBE_CATEGORIES, type YouTubeCategory, type TCIAxis } from '../data/youtube-categories';
import { RECOMMENDED_CHANNELS, CATEGORY_DESCRIPTIONS } from '../data/recommended-channels';

/**
 * Match user to husband type using hybrid algorithm
 * 
 * Matching weights:
 * - 60% Cosine similarity (vector matching)
 * - 20% MBTI compatibility
 * - 20% Enneagram compatibility
 */
export function matchHusbandType(
  userVector: number[],
  mbtiScores: MBTIScores,
  enneagramType: number
): { type: HusbandType; score: number; method: string } {
  const allTypes = getAllHusbandTypes();
  
  if (allTypes.length === 0) {
    throw new Error('No husband types defined');
  }

  let bestMatch: HusbandType | null = null;
  let bestScore = -1;

  // Determine E/I preference for variant selection
  const isExtrovert = mbtiScores.E > mbtiScores.I;

  for (const type of allTypes) {
    // Skip if variant doesn't match E/I preference
    if (
      (isExtrovert && type.variant === 'introvert') ||
      (!isExtrovert && type.variant === 'extrovert')
    ) {
      continue;
    }

    // Calculate cosine similarity (60% weight)
    const cosineSim = cosineSimilarity(userVector, type.idealVector);
    const vectorScore = cosineSim * 0.6;

    // Calculate MBTI compatibility (20% weight)
    const mbtiCompat = calculateMBTICompatibility(mbtiScores, type);
    const mbtiScore = mbtiCompat * 0.2;

    // Calculate Enneagram compatibility (20% weight)
    const enneagramCompat = calculateEnneagramCompatibility(enneagramType, type);
    const enneagramScore = enneagramCompat * 0.2;

    // Total score
    const totalScore = vectorScore + mbtiScore + enneagramScore;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      bestMatch = type;
    }
  }

  if (!bestMatch) {
    // Fallback to first type if no match found
    bestMatch = allTypes[0];
    bestScore = 0.5;
  }

  return {
    type: bestMatch,
    score: Math.min(1, Math.max(0, bestScore)),
    method: 'hybrid (60% vector + 20% MBTI + 20% enneagram)',
  };
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }

  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);

  if (mag1 === 0 || mag2 === 0) {
    return 0;
  }

  return dotProduct / (mag1 * mag2);
}

/**
 * Calculate MBTI compatibility
 * Some dimensions are complementary, others should match
 */
function calculateMBTICompatibility(userMBTI: MBTIScores, type: HusbandType): number {
  // Extract MBTI from type's ideal vector (simplified heuristic)
  // In a real implementation, you might store MBTI preferences in HusbandType
  
  // For now, use a simple compatibility score based on type characteristics
  // This is a placeholder - you might want to enhance this logic
  
  const categoryScores: Record<string, number> = {
    '성장파트너형': userMBTI.N / 100, // Intuitive types
    '안정추구형': userMBTI.S / 100, // Sensing types
    '모험가형': userMBTI.E / 100, // Extroverted types
    '감성교감형': userMBTI.F / 100, // Feeling types
    '리더십형': userMBTI.J / 100, // Judging types
    '자유영혼형': userMBTI.P / 100, // Perceiving types
  };

  return categoryScores[type.category] || 0.5;
}

/**
 * Calculate Enneagram compatibility
 */
function calculateEnneagramCompatibility(userType: number, husbandType: HusbandType): number {
  // Enneagram compatibility matrix (simplified)
  // Some types are naturally compatible, others complement each other
  
  // Extract dominant enneagram center from husband type's vector
  const enneagramVector = husbandType.idealVector.slice(7, 10);
  const maxCenter = Math.max(...enneagramVector);
  const dominantCenter = enneagramVector.indexOf(maxCenter);
  
  // Map user type to center
  const userCenter = getUserEnneagramCenter(userType);
  
  // Complementary centers score higher
  if (userCenter === dominantCenter) {
    return 0.7; // Same center - good compatibility
  } else {
    return 0.9; // Different center - complementary
  }
}

/**
 * Map enneagram type (1-9) to center (0: head, 1: heart, 2: body)
 */
function getUserEnneagramCenter(type: number): number {
  if ([5, 6, 7].includes(type)) return 0; // Head
  if ([2, 3, 4].includes(type)) return 1; // Heart
  return 2; // Body (8, 9, 1)
}

/**
 * 배우자 타입의 idealVector에서 TCI를 역산하여
 * 추정 구독 카테고리 TOP 3 + 대표 채널을 반환합니다.
 *
 * idealVector[0:7]이 TCI 7축(NS, HA, RD, P, SD, CO, ST) 값이므로
 * 각 카테고리의 TCI 가중치와 내적하여 "이 카테고리에 얼마나 적합한지" 점수를 계산합니다.
 */
export interface PartnerCategory {
  category: YouTubeCategory;
  categoryName: string;
  channels: string[];
  description: string;
  score: number;
}

export function estimatePartnerCategories(husbandType: HusbandType): PartnerCategory[] {
  // idealVector의 처음 7개가 TCI 7축: NS(0), HA(1), RD(2), P(3), SD(4), CO(5), ST(6)
  // CATEGORY_TCI_WEIGHTS의 축 순서: ST, SD, NS, HA, P, CO
  // idealVector → TCI 축 매핑
  const tciFromVector: Record<TCIAxis, number> = {
    NS: husbandType.idealVector[0] ?? 50,
    HA: husbandType.idealVector[1] ?? 50,
    P:  husbandType.idealVector[3] ?? 50,
    SD: husbandType.idealVector[4] ?? 50,
    CO: husbandType.idealVector[5] ?? 50,
    ST: husbandType.idealVector[6] ?? 50,
  };

  // 각 카테고리별 적합도 점수 계산 (TCI 값 × 카테고리 가중치의 내적)
  const categoryScores: { category: YouTubeCategory; score: number }[] = [];

  for (const cat of YOUTUBE_CATEGORIES) {
    if (cat === 'other') continue; // 기타 제외

    const weights = CATEGORY_TCI_WEIGHTS[cat];
    let score = 0;
    for (const axis of Object.keys(weights) as TCIAxis[]) {
      score += (tciFromVector[axis] / 100) * weights[axis];
    }
    categoryScores.push({ category: cat, score });
  }

  // 점수 내림차순 정렬 후 상위 3개
  categoryScores.sort((a, b) => b.score - a.score);

  return categoryScores.slice(0, 3).map(({ category, score }) => ({
    category,
    categoryName: getCategoryName(category),
    channels: RECOMMENDED_CHANNELS[category] || [],
    description: CATEGORY_DESCRIPTIONS[category] || '',
    score,
  }));
}

function getCategoryName(cat: YouTubeCategory): string {
  const names: Record<YouTubeCategory, string> = {
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
  return names[cat];
}
