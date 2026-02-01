import { TCIScores, EnneagramCenter, ChannelCategories } from '../types';

/**
 * Create 18-dimensional user vector for matching
 * 
 * Vector structure:
 * [0-6]: TCI 7 dimensions (NS, HA, RD, P, SD, CO, ST)
 * [7-9]: Enneagram 3 centers (head, heart, body)
 * [10-17]: Content 8 categories (normalized)
 */
export function createVector(
  tci: TCIScores,
  enneagram: EnneagramCenter,
  categories: ChannelCategories
): number[] {
  const total = Object.values(categories).reduce((sum, count) => sum + count, 0);

  // TCI dimensions (already 0-100)
  const tciVector = [
    tci.NS,
    tci.HA,
    tci.RD,
    tci.P,
    tci.SD,
    tci.CO,
    tci.ST,
  ];

  // Enneagram centers (already 0-100)
  const enneagramVector = [
    enneagram.head,
    enneagram.heart,
    enneagram.body,
  ];

  // Content categories (normalize to 0-100)
  // Combine similar categories into 8 dimensions
  const contentVector = total > 0 ? [
    (categories.music / total) * 100, // Music
    (categories.reading / total) * 100, // Intellectual
    (categories.sports / total) * 100, // Physical
    (categories.cooking / total) * 100, // Creative/Lifestyle
    (categories.tech / total) * 100, // Tech
    (categories.travel / total) * 100, // Adventure
    (categories.education / total) * 100, // Learning
    ((categories.entertainment + categories.gaming + categories.art) / total) * 100, // Entertainment
  ] : [0, 0, 0, 0, 0, 0, 0, 0];

  // Combine all vectors
  const vector = [
    ...tciVector,
    ...enneagramVector,
    ...contentVector,
  ];

  // Ensure all values are in 0-100 range
  return vector.map(v => Math.min(100, Math.max(0, Math.round(v))));
}
