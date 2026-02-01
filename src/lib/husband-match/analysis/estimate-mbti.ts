import { TCIScores, ChannelCategories, MBTIScores } from '../types';

/**
 * Estimate MBTI type from TCI scores and channel categories
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

  // E/I axis: Based on NS, RD, and social content
  const socialContent = total > 0 ? ((categories.entertainment + categories.sports) / total) * 100 : 0;
  const E = Math.round(
    (tci.NS * 0.4 + tci.RD * 0.3 + socialContent * 0.3)
  );
  const I = 100 - E;

  // S/N axis: Based on SD, ST, and abstract content
  const abstractContent = total > 0 ? ((categories.education + categories.art + categories.reading) / total) * 100 : 0;
  const N = Math.round(
    (tci.SD * 0.3 + tci.ST * 0.4 + abstractContent * 0.3)
  );
  const S = 100 - N;

  // T/F axis: Based on CO, RD, and emotional content
  const emotionalContent = total > 0 ? ((categories.music + categories.art + categories.cooking) / total) * 100 : 0;
  const F = Math.round(
    (tci.CO * 0.4 + tci.RD * 0.3 + emotionalContent * 0.3)
  );
  const T = 100 - F;

  // J/P axis: Based on P, HA, and structured content
  const structuredContent = total > 0 ? ((categories.education + categories.tech) / total) * 100 : 0;
  const J = Math.round(
    (tci.P * 0.4 + tci.HA * 0.3 + structuredContent * 0.3)
  );
  const P_score = 100 - J;

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
