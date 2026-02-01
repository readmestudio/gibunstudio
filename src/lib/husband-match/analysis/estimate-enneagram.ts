import { TCIScores, ChannelCategories, EnneagramCenter } from '../types';

/**
 * Estimate Enneagram type from TCI scores and channel categories
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

  // Calculate center scores
  const center: EnneagramCenter = {
    // Head center: High SD, P, education/tech content
    head: Math.round(
      (tci.SD * 0.4 + tci.P * 0.3 + (total > 0 ? ((categories.education + categories.tech) / total) * 100 * 0.3 : 0))
    ),
    
    // Heart center: High RD, CO, music/art/entertainment content
    heart: Math.round(
      (tci.RD * 0.4 + tci.CO * 0.3 + (total > 0 ? ((categories.music + categories.art + categories.entertainment) / total) * 100 * 0.3 : 0))
    ),
    
    // Body center: High NS, low HA, sports/travel content
    body: Math.round(
      (tci.NS * 0.4 + (100 - tci.HA) * 0.3 + (total > 0 ? ((categories.sports + categories.travel) / total) * 100 * 0.3 : 0))
    ),
  };

  // Determine primary type (1-9) based on TCI profile
  let type = 9; // Default to Type 9 (Peacemaker)

  if (center.head > center.heart && center.head > center.body) {
    // Head center types: 5, 6, 7
    if (tci.NS > 65) {
      type = 7; // Enthusiast (high NS)
    } else if (tci.HA > 65) {
      type = 6; // Loyalist (high HA)
    } else {
      type = 5; // Investigator (high SD)
    }
  } else if (center.heart > center.head && center.heart > center.body) {
    // Heart center types: 2, 3, 4
    if (tci.CO > 70) {
      type = 2; // Helper (high CO)
    } else if (tci.P > 70) {
      type = 3; // Achiever (high P)
    } else {
      type = 4; // Individualist (high ST)
    }
  } else {
    // Body center types: 8, 9, 1
    if (tci.NS > 70 && tci.HA < 40) {
      type = 8; // Challenger (high NS, low HA)
    } else if (tci.P > 75) {
      type = 1; // Perfectionist (high P)
    } else {
      type = 9; // Peacemaker (balanced)
    }
  }

  return { center, type };
}
