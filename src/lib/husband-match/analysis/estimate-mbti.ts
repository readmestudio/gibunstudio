import { TCIScores, ChannelCategories, MBTIScores } from '../types';

/**
 * Estimate MBTI type from TCI scores and channel categories
 * 문서 명세 기준 MBTI 추정 로직
 *
 * MBTI has 4 axes:
 * - E/I (Extraversion/Introversion)
 * - S/N (Sensing/Intuition)
 * - T/F (Thinking/Feeling)
 * - J/P (Judging/Perceiving)
 */
export function estimateMBTI(
  tci: TCIScores,
  categories: ChannelCategories
): { scores: MBTIScores; type: string } {
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

  // 카테고리 수 (채널 다양성 지표)
  const activeCategories = Object.values(categories).filter(v => v > 0).length;
  const channelDiversity = activeCategories / 10;

  // 문서 명세 기준:
  // E/I = 예능 많음 + 채널수 많음 vs 독서/음악 중심 + 채널수 적음
  const extraversionSignal = norm.entertainmentVlog * 0.5 + channelDiversity * 0.5;
  const introversionSignal = (norm.readingHumanities + norm.musicMood) * 0.5 + (1 - channelDiversity) * 0.5;
  const E = Math.round(clamp(extraversionSignal * 100));
  const I = Math.round(clamp(introversionSignal * 100));

  // S/N = 라이프스타일(실용) vs 힐링영성+독서(추상)
  const sensingSignal = norm.lifestyleSpace * 0.6 + norm.sportsOutdoor * 0.4;
  const intuitionSignal = (norm.healingSpirituality + norm.readingHumanities) * 0.5 + norm.languageCulture * 0.3;
  const S = Math.round(clamp(sensingSignal * 100));
  const N = Math.round(clamp(intuitionSignal * 100));

  // T/F = 경제재테크+커리어(분석) vs 음악+힐링영성(감성)
  const thinkingSignal = (norm.financeInvest + norm.careerBusiness) * 0.5 + norm.readingHumanities * 0.3;
  const feelingSignal = (norm.musicMood + norm.healingSpirituality) * 0.5 + norm.fashionBeauty * 0.3;
  const T = Math.round(clamp(thinkingSignal * 100));
  const F = Math.round(clamp(feelingSignal * 100));

  // J/P = 카테고리 집중 + 라이프스타일 vs 카테고리 분산
  const judgingSignal = (1 - channelDiversity) * 0.5 + norm.lifestyleSpace * 0.3 + norm.financeInvest * 0.2;
  const perceivingSignal = channelDiversity * 0.5 + norm.entertainmentVlog * 0.3 + norm.sportsOutdoor * 0.2;
  const J = Math.round(clamp(judgingSignal * 100));
  const P_score = Math.round(clamp(perceivingSignal * 100));

  const scores: MBTIScores = {
    E,
    I,
    S,
    N,
    T,
    F,
    J,
    P: P_score,
  };

  // Determine 4-letter type
  const type = [
    E > I ? 'E' : 'I',
    S > N ? 'S' : 'N',
    T > F ? 'T' : 'F',
    J > P_score ? 'J' : 'P',
  ].join('');

  return { scores, type };
}

/**
 * Clamp value between 0 and 100
 */
function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}
