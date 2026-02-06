import { TCIScores, ChannelCategories, EnneagramCenter } from '../types';

/**
 * Estimate Enneagram type from TCI scores and channel categories
 * 문서 명세 기준: 카테고리 기반 센터 점수 + TCI 교차
 *
 * Enneagram has 3 centers:
 * - Head (5, 6, 7): Thinking, analysis, planning
 * - Heart (2, 3, 4): Feeling, relationships, image
 * - Body (8, 9, 1): Instinct, action, control
 */
export function estimateEnneagram(
  tci: TCIScores,
  categories: ChannelCategories
): { center: EnneagramCenter; type: number } {
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

  // 문서 명세 기준 3대 중심 점수
  // Head = 독서인문학 × 0.35 + 경제재테크 × 0.25 + 커리어창업 × 0.25 + 독서인문학 × 0.15
  // (문서에서 독서인문학이 두 번 나옴 → 합쳐서 0.5로 계산)
  const headScore = Math.round(
    (norm.readingHumanities * 0.5 +
     norm.financeInvest * 0.25 +
     norm.careerBusiness * 0.25) * 100
  );

  // Heart = 음악분위기 × 0.3 + 패션뷰티 × 0.25 + 힐링영성 × 0.45
  const heartScore = Math.round(
    (norm.musicMood * 0.3 +
     norm.fashionBeauty * 0.25 +
     norm.healingSpirituality * 0.45) * 100
  );

  // Body = 스포츠아웃도어 × 0.4 + 라이프스타일 × 0.6
  const bodyScore = Math.round(
    (norm.sportsOutdoor * 0.4 +
     norm.lifestyleSpace * 0.6) * 100
  );

  const center: EnneagramCenter = {
    head: clamp(headScore),
    heart: clamp(heartScore),
    body: clamp(bodyScore),
  };

  // 문서 명세 기준 유형 결정 (3대 중심 + TCI 교차)
  let type = 9; // Default to Type 9 (Peacemaker)

  if (center.heart > center.head && center.heart > center.body) {
    // Heart 중심 → ST높음: 4번, CO높음: 2번, SD높음: 3번
    if (tci.ST >= tci.CO && tci.ST >= tci.SD) {
      type = 4; // Individualist (높은 ST - 자기초월)
    } else if (tci.CO >= tci.SD) {
      type = 2; // Helper (높은 CO - 연대감)
    } else {
      type = 3; // Achiever (높은 SD - 자율성)
    }
  } else if (center.head > center.heart && center.head > center.body) {
    // Head 중심 → NS낮음: 5번, HA높음: 6번, NS높음: 7번
    if (tci.NS > 60) {
      type = 7; // Enthusiast (높은 NS - 자극추구)
    } else if (tci.HA > 60) {
      type = 6; // Loyalist (높은 HA - 위험회피)
    } else {
      type = 5; // Investigator (낮은 NS - 신중함)
    }
  } else {
    // Body 중심 → SD높음: 8번, HA높음: 9번, P높음: 1번
    if (tci.SD > 60 && tci.HA < 50) {
      type = 8; // Challenger (높은 SD, 낮은 HA)
    } else if (tci.P > 60) {
      type = 1; // Perfectionist (높은 P - 인내력)
    } else {
      type = 9; // Peacemaker (균형 또는 높은 HA)
    }
  }

  return { center, type };
}

/**
 * Clamp value between 0 and 100
 */
function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}
