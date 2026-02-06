import { TCIScores, EnneagramCenter, ChannelCategories } from '../types';

/**
 * Create 18-dimensional user vector for matching
 * 문서 명세 기준 18차원 벡터 구조
 *
 * Vector structure:
 * [0-6]:   TCI 7차원 (NS, HA, RD, P, SD, CO, ST)
 * [7-9]:   Enneagram 3차원 (head, heart, body)
 * [10-17]: Content 8차원:
 *   - sensory_sensitivity (감각적 민감성): 음악+패션뷰티
 *   - intellectual_curiosity (지적 호기심): 독서+경제재테크
 *   - cultural_openness (문화적 개방성): 언어다문화
 *   - sociability (사회성): 예능브이로그
 *   - nurturing (돌봄 관심): 힐링영성
 *   - adventurousness (모험성): 스포츠아웃도어
 *   - stability_orientation (안정 지향): 라이프스타일+경제재테크
 *   - achievement_orientation (성취 지향): 커리어창업
 */
export function createVector(
  tci: TCIScores,
  enneagram: EnneagramCenter,
  categories: ChannelCategories
): number[] {
  const total = Object.values(categories).reduce((sum, count) => sum + count, 0);

  // Normalize categories (0-1)
  const norm = total > 0 ? {
    musicMood: categories.musicMood / total,
    readingHumanities: categories.readingHumanities / total,
    sportsOutdoor: categories.sportsOutdoor / total,
    entertainmentVlog: categories.entertainmentVlog / total,
    languageCulture: categories.languageCulture / total,
    lifestyleSpace: categories.lifestyleSpace / total,
    careerBusiness: categories.careerBusiness / total,
    healingSpirituality: categories.healingSpirituality / total,
    fashionBeauty: categories.fashionBeauty / total,
    financeInvest: categories.financeInvest / total,
  } : {
    musicMood: 0, readingHumanities: 0, sportsOutdoor: 0, entertainmentVlog: 0,
    languageCulture: 0, lifestyleSpace: 0, careerBusiness: 0, healingSpirituality: 0,
    fashionBeauty: 0, financeInvest: 0,
  };

  // TCI dimensions (already 0-100) [0-6]
  const tciVector = [
    tci.NS,
    tci.HA,
    tci.RD,
    tci.P,
    tci.SD,
    tci.CO,
    tci.ST,
  ];

  // Enneagram centers (already 0-100) [7-9]
  const enneagramVector = [
    enneagram.head,
    enneagram.heart,
    enneagram.body,
  ];

  // Content 8차원 (normalize to 0-100) [10-17]
  const contentVector = [
    // sensory_sensitivity (감각적 민감성): 음악+패션뷰티
    (norm.musicMood + norm.fashionBeauty) * 50,
    // intellectual_curiosity (지적 호기심): 독서+경제재테크
    (norm.readingHumanities + norm.financeInvest) * 50,
    // cultural_openness (문화적 개방성): 언어다문화
    norm.languageCulture * 100,
    // sociability (사회성): 예능브이로그
    norm.entertainmentVlog * 100,
    // nurturing (돌봄 관심): 힐링영성
    norm.healingSpirituality * 100,
    // adventurousness (모험성): 스포츠아웃도어
    norm.sportsOutdoor * 100,
    // stability_orientation (안정 지향): 라이프스타일+경제재테크
    (norm.lifestyleSpace + norm.financeInvest) * 50,
    // achievement_orientation (성취 지향): 커리어창업
    norm.careerBusiness * 100,
  ];

  // Combine all vectors
  const vector = [
    ...tciVector,
    ...enneagramVector,
    ...contentVector,
  ];

  // Ensure all values are in 0-100 range
  return vector.map(v => Math.min(100, Math.max(0, Math.round(v))));
}
