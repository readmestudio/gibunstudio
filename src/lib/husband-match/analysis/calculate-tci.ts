import { ChannelCategories, TCIScores } from '../types';

/**
 * Calculate TCI (Temperament and Character Inventory) scores from channel categories
 * 문서 명세 기준 TCI 7차원 산출 공식
 *
 * TCI Dimensions:
 * - NS (Novelty Seeking): 자극추구
 * - HA (Harm Avoidance): 위험회피
 * - RD (Reward Dependence): 사회적민감성/보상의존
 * - P (Persistence): 인내력
 * - SD (Self-Directedness): 자율성
 * - CO (Cooperativeness): 연대감
 * - ST (Self-Transcendence): 자기초월
 */
export function calculateTCI(categories: ChannelCategories): TCIScores {
  const total = Object.values(categories).reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    // Return neutral scores if no channels
    return { NS: 50, HA: 50, RD: 50, P: 50, SD: 50, CO: 50, ST: 50 };
  }

  // Normalize to percentages (0-1)
  const norm = {
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
  };

  // 카테고리 다양성 계산 (0-1): 얼마나 많은 카테고리에 분포되어 있는지
  const activeCategories = Object.values(categories).filter(v => v > 0).length;
  const categoryDiversity = activeCategories / 10;

  // 문서 명세 공식 (대체 방안 포함)

  // NS (자극추구) = 카테고리다양성 × 0.7 + 스포츠아웃도어 × 0.3
  // "최신채널비율"은 접근 불가 → 카테고리다양성으로 대체
  const NS = clamp(
    (categoryDiversity * 0.7 + norm.sportsOutdoor * 0.3) * 100
  );

  // HA (위험회피) = 경제재테크 × 0.3 + 힐링영성 × 0.3 + 라이프스타일 × 0.2 + (1-예능비율) × 0.2
  const HA = clamp(
    (norm.financeInvest * 0.3 +
     norm.healingSpirituality * 0.3 +
     norm.lifestyleSpace * 0.2 +
     (1 - norm.entertainmentVlog) * 0.2) * 100
  );

  // RD (사회적민감성) = 예능브이로그 × 0.3 + 힐링영성 × 0.2 + 음악분위기 × 0.2 + 패션뷰티 × 0.15 + 라이프스타일 × 0.15
  const RD = clamp(
    (norm.entertainmentVlog * 0.3 +
     norm.healingSpirituality * 0.2 +
     norm.musicMood * 0.2 +
     norm.fashionBeauty * 0.15 +
     norm.lifestyleSpace * 0.15) * 100
  );

  // P (인내력) = 커리어창업 × 0.3 + 독서인문학 × 0.5 + (1-카테고리다양성) × 0.2
  // "긴콘텐츠선호도", "구독유지기간"은 접근 불가 → 독서인문학, 카테고리집중도로 대체
  const P = clamp(
    (norm.careerBusiness * 0.3 +
     norm.readingHumanities * 0.5 +
     (1 - categoryDiversity) * 0.2) * 100
  );

  // SD (자율성) = 커리어창업 × 0.35 + 경제재테크 × 0.25 + 독서인문학 × 0.2 + (1-예능비율) × 0.2
  const SD = clamp(
    (norm.careerBusiness * 0.35 +
     norm.financeInvest * 0.25 +
     norm.readingHumanities * 0.2 +
     (1 - norm.entertainmentVlog) * 0.2) * 100
  );

  // CO (연대감) = 라이프스타일 × 0.3 + 힐링영성 × 0.25 + 예능브이로그 × 0.2 + 언어다문화 × 0.25
  const CO = clamp(
    (norm.lifestyleSpace * 0.3 +
     norm.healingSpirituality * 0.25 +
     norm.entertainmentVlog * 0.2 +
     norm.languageCulture * 0.25) * 100
  );

  // ST (자기초월) = 힐링영성 × 0.4 + 독서인문학 × 0.3 + 음악분위기 × 0.3
  const ST = clamp(
    (norm.healingSpirituality * 0.4 +
     norm.readingHumanities * 0.3 +
     norm.musicMood * 0.3) * 100
  );

  return {
    NS: Math.round(NS),
    HA: Math.round(HA),
    RD: Math.round(RD),
    P: Math.round(P),
    SD: Math.round(SD),
    CO: Math.round(CO),
    ST: Math.round(ST),
  };
}

/**
 * Clamp value between 0 and 100
 */
function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}
