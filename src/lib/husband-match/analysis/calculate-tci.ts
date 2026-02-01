import { ChannelCategories, TCIScores } from '../types';

/**
 * Calculate TCI (Temperament and Character Inventory) scores from channel categories
 * 
 * TCI Dimensions:
 * - NS (Novelty Seeking): 새로움 추구
 * - HA (Harm Avoidance): 위험 회피
 * - RD (Reward Dependence): 보상 의존
 * - P (Persistence): 인내력
 * - SD (Self-Directedness): 자율성
 * - CO (Cooperativeness): 협력성
 * - ST (Self-Transcendence): 자기초월
 */
export function calculateTCI(categories: ChannelCategories): TCIScores {
  const total = Object.values(categories).reduce((sum, count) => sum + count, 0);
  
  if (total === 0) {
    // Return neutral scores if no channels
    return { NS: 50, HA: 50, RD: 50, P: 50, SD: 50, CO: 50, ST: 50 };
  }

  // Normalize to percentages (0-100)
  const norm = {
    music: (categories.music / total) * 100,
    reading: (categories.reading / total) * 100,
    sports: (categories.sports / total) * 100,
    cooking: (categories.cooking / total) * 100,
    travel: (categories.travel / total) * 100,
    gaming: (categories.gaming / total) * 100,
    tech: (categories.tech / total) * 100,
    art: (categories.art / total) * 100,
    education: (categories.education / total) * 100,
    entertainment: (categories.entertainment / total) * 100,
  };

  // TCI formulas based on content preferences
  // These are heuristic mappings based on psychological research
  
  // NS (Novelty Seeking): High for travel, gaming, entertainment
  const NS = clamp(
    40 +
      norm.travel * 0.8 +
      norm.gaming * 0.5 +
      norm.entertainment * 0.3 -
      norm.reading * 0.2
  );

  // HA (Harm Avoidance): Low for sports, travel; High for reading
  const HA = clamp(
    60 -
      norm.sports * 0.5 -
      norm.travel * 0.4 +
      norm.reading * 0.3 +
      norm.art * 0.2
  );

  // RD (Reward Dependence): High for music, cooking, entertainment
  const RD = clamp(
    50 +
      norm.music * 0.5 +
      norm.cooking * 0.4 +
      norm.entertainment * 0.3 +
      norm.art * 0.2
  );

  // P (Persistence): High for education, reading, sports
  const P = clamp(
    50 +
      norm.education * 0.7 +
      norm.reading * 0.5 +
      norm.sports * 0.3 +
      norm.tech * 0.2
  );

  // SD (Self-Directedness): High for education, tech, reading
  const SD = clamp(
    50 +
      norm.education * 0.5 +
      norm.tech * 0.4 +
      norm.reading * 0.3 +
      norm.art * 0.2
  );

  // CO (Cooperativeness): High for cooking, music, entertainment
  const CO = clamp(
    50 +
      norm.cooking * 0.5 +
      norm.music * 0.3 +
      norm.entertainment * 0.4 +
      norm.sports * 0.2
  );

  // ST (Self-Transcendence): High for art, music, reading
  const ST = clamp(
    50 +
      norm.art * 0.7 +
      norm.music * 0.5 +
      norm.reading * 0.3 +
      norm.travel * 0.2
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
