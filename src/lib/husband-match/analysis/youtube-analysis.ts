/**
 * YouTube 구독 분석 함수
 * - 16개 카테고리 분류
 * - 희소성 계산 (코사인 유사도)
 * - 육각형 TCI 스탯 계산
 */

import { chatCompletion } from '@/lib/openai-client';
import {
  YouTubeCategory,
  YOUTUBE_CATEGORIES,
  YOUTUBE_CATEGORY_NAMES,
  YOUTUBE_AVERAGE_RATIOS,
  CATEGORY_TCI_WEIGHTS,
  CATEGORY_COLORS,
  YouTubeCategoryResult,
  RarityAnalysis,
  YouTubeTCIScores,
  TCIAxis,
} from '../data/youtube-categories';
import type { ChannelData } from '../types';

/**
 * LLM을 사용하여 채널을 16개 카테고리로 분류
 */
export async function categorizeChannelsToYouTube(
  channels: ChannelData[]
): Promise<Map<string, YouTubeCategory>> {
  const channelList = channels
    .map((c) => `- ${c.channel_title}: ${c.channel_description?.slice(0, 100) || '설명 없음'}`)
    .join('\n');

  const prompt = `다음 YouTube 채널들을 아래 16개 카테고리 중 하나로 분류해주세요.

카테고리 목록:
entertainment (예능/버라이어티), vlog (브이로그/일상), music (음악), gaming (게임),
food (먹방/요리), beauty (뷰티/패션), education (교육/자기계발), news (시사/뉴스),
tech (기술/IT), sports (스포츠/운동), pets (반려동물), kids (키즈),
asmr (ASMR), finance (투자/재테크), travel (여행), other (기타)

채널 목록:
${channelList}

JSON 형식으로 응답:
{"채널명1": "카테고리", "채널명2": "카테고리", ...}`;

  const response = await chatCompletion(
    [{ role: 'user', content: prompt }],
    { model: 'gpt-4o-mini', temperature: 0.3, response_format: { type: 'json_object' } }
  );

  const result = new Map<string, YouTubeCategory>();
  try {
    const parsed = JSON.parse(response || '{}');
    for (const [channelName, category] of Object.entries(parsed)) {
      if (YOUTUBE_CATEGORIES.includes(category as YouTubeCategory)) {
        result.set(channelName, category as YouTubeCategory);
      } else {
        result.set(channelName, 'other');
      }
    }
  } catch {
    // 파싱 실패 시 모두 other로 분류
    channels.forEach((c) => result.set(c.channel_title, 'other'));
  }

  return result;
}

/**
 * 카테고리별 채널 수 집계
 */
export function aggregateCategoryResults(
  channels: ChannelData[],
  categoryMap: Map<string, YouTubeCategory>
): YouTubeCategoryResult[] {
  const counts: Record<YouTubeCategory, { count: number; channels: string[] }> = {} as any;

  // 초기화
  YOUTUBE_CATEGORIES.forEach((cat) => {
    counts[cat] = { count: 0, channels: [] };
  });

  // 집계
  channels.forEach((channel) => {
    const category = categoryMap.get(channel.channel_title) || 'other';
    counts[category].count++;
    counts[category].channels.push(channel.channel_title);
  });

  const total = channels.length;

  // 정렬 및 변환
  return Object.entries(counts)
    .filter(([, data]) => data.count > 0)
    .sort(([, a], [, b]) => b.count - a.count)
    .map(([cat, data]) => ({
      category: cat as YouTubeCategory,
      name: YOUTUBE_CATEGORY_NAMES[cat as YouTubeCategory],
      count: data.count,
      percent: total > 0 ? Math.round((data.count / total) * 100) : 0,
      color: CATEGORY_COLORS[cat as YouTubeCategory],
    }));
}

/**
 * 코사인 유사도 계산
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * 희소성 분석
 */
export function calculateRarity(
  categoryResults: YouTubeCategoryResult[],
  channels: ChannelData[],
  categoryMap: Map<string, YouTubeCategory>
): RarityAnalysis {
  const total = channels.length;

  // 사용자 비율 벡터 생성 (other 제외)
  const userVector: number[] = [];
  const avgVector: number[] = [];
  const categories = YOUTUBE_CATEGORIES.filter((c) => c !== 'other');

  categories.forEach((cat) => {
    const result = categoryResults.find((r) => r.category === cat);
    const userRatio = result ? result.count / total : 0;
    userVector.push(userRatio);
    avgVector.push(YOUTUBE_AVERAGE_RATIOS[cat]);
  });

  // 코사인 유사도 계산
  const similarity = cosineSimilarity(userVector, avgVector);

  // 백분위 변환
  let percentile: number;
  if (similarity >= 0.95) {
    percentile = 50;  // 상위 50% (평범)
  } else if (similarity >= 0.85) {
    percentile = 20 + (similarity - 0.85) * 300;  // 20~50%
  } else if (similarity >= 0.70) {
    percentile = 5 + (similarity - 0.70) * 100;  // 5~20%
  } else {
    percentile = Math.max(1, similarity * 7);  // 상위 5% 이하
  }
  percentile = Math.round(percentile);

  // 가장 희귀한 카테고리 찾기 (평균 대비 양의 편차가 가장 큰 것)
  let maxDeviation = -Infinity;
  let rarestCategory: YouTubeCategory = 'other';

  categories.forEach((cat, i) => {
    const userRatio = userVector[i];
    const avgRatio = avgVector[i];
    // 사용자가 구독하고 있고, 평균보다 많이 구독하는 경우
    if (userRatio > 0 && avgRatio > 0) {
      const deviation = (userRatio - avgRatio) / avgRatio;  // 상대적 편차
      if (deviation > maxDeviation) {
        maxDeviation = deviation;
        rarestCategory = cat;
      }
    }
  });

  // 희귀 카테고리가 없으면 가장 적은 평균 비율의 카테고리 중 사용자가 구독한 것
  if (rarestCategory === 'other') {
    const userCategories = categoryResults.map((r) => r.category);
    const sortedByRarity = categories
      .filter((c) => userCategories.includes(c))
      .sort((a, b) => YOUTUBE_AVERAGE_RATIOS[a] - YOUTUBE_AVERAGE_RATIOS[b]);
    rarestCategory = sortedByRarity[0] || 'other';
  }

  // 희귀 카테고리에 속한 채널 목록
  const rarestChannels: string[] = [];
  channels.forEach((channel) => {
    if (categoryMap.get(channel.channel_title) === rarestCategory) {
      rarestChannels.push(channel.channel_title);
    }
  });

  const rarestResult = categoryResults.find((r) => r.category === rarestCategory);

  return {
    percentile,
    rarestCategory,
    rarestCategoryName: YOUTUBE_CATEGORY_NAMES[rarestCategory],
    rarestCategoryPercent: rarestResult?.percent || 0,
    rarestCategoryChannels: rarestChannels,
    cosineSimilarity: Math.round(similarity * 100) / 100,
  };
}

/**
 * 육각형 TCI 스탯 계산 (강화된 로직)
 */
export function calculateYouTubeTCI(
  categoryResults: YouTubeCategoryResult[]
): YouTubeTCIScores {
  // Step 1 & 2: 가중 합산
  const rawScores: YouTubeTCIScores = { ST: 0, SD: 0, NS: 0, HA: 0, P: 0, CO: 0 };
  const axes: TCIAxis[] = ['ST', 'SD', 'NS', 'HA', 'P', 'CO'];

  categoryResults.forEach((result) => {
    const weights = CATEGORY_TCI_WEIGHTS[result.category];
    axes.forEach((axis) => {
      rawScores[axis] += result.count * weights[axis];
    });
  });

  // Step 3: 정규화 (최대값 100, 최소값 10)
  const maxRaw = Math.max(...Object.values(rawScores));
  const normalized: YouTubeTCIScores = { ST: 0, SD: 0, NS: 0, HA: 0, P: 0, CO: 0 };

  if (maxRaw > 0) {
    axes.forEach((axis) => {
      normalized[axis] = Math.max(10, Math.round((rawScores[axis] / maxRaw) * 100));
    });
  } else {
    // 모든 값이 0인 경우 기본값
    axes.forEach((axis) => {
      normalized[axis] = 50;
    });
  }

  // Step 4: 분포 보정
  const values = axes.map((axis) => normalized[axis]);
  const maxValue = Math.max(...values);
  const minValues = values.filter((v) => v < 15);

  // 한 축이 80 이상으로 돌출될 경우, 나머지 축에 보정 가산점 +5~10
  if (maxValue >= 80) {
    axes.forEach((axis) => {
      if (normalized[axis] < maxValue) {
        normalized[axis] = Math.min(100, normalized[axis] + 7);
      }
    });
  }

  // 두 축 이상이 15 미만일 경우, 해당 축에 보정 가산점 +5
  if (minValues.length >= 2) {
    axes.forEach((axis) => {
      if (normalized[axis] < 15) {
        normalized[axis] = Math.min(100, normalized[axis] + 5);
      }
    });
  }

  return normalized;
}

/**
 * TCI 스코어에서 상위/하위 축 추출
 */
export function getTopBottomAxes(scores: YouTubeTCIScores): {
  top1: { axis: TCIAxis; score: number; name: string };
  top2: { axis: TCIAxis; score: number; name: string };
  bottom: { axis: TCIAxis; score: number; name: string };
} {
  const axisNames: Record<TCIAxis, string> = {
    ST: '자기초월',
    SD: '자율성',
    NS: '자극추구',
    HA: '위험회피',
    P: '인내력',
    CO: '연대감',
  };

  const sorted = (Object.entries(scores) as [TCIAxis, number][])
    .sort(([, a], [, b]) => b - a);

  return {
    top1: { axis: sorted[0][0], score: sorted[0][1], name: axisNames[sorted[0][0]] },
    top2: { axis: sorted[1][0], score: sorted[1][1], name: axisNames[sorted[1][0]] },
    bottom: { axis: sorted[5][0], score: sorted[5][1], name: axisNames[sorted[5][0]] },
  };
}

/**
 * 바 차트용 ASCII 생성
 */
export function generateBarChart(percent: number, maxBars: number = 12): string {
  const filledBars = Math.round((percent / 100) * maxBars);
  return '█'.repeat(filledBars) + '░'.repeat(maxBars - filledBars);
}

/**
 * 전체 YouTube 분석 실행
 */
export async function runYouTubeAnalysis(channels: ChannelData[]): Promise<{
  categoryResults: YouTubeCategoryResult[];
  rarity: RarityAnalysis;
  tciScores: YouTubeTCIScores;
  topBottom: ReturnType<typeof getTopBottomAxes>;
}> {
  // 채널 카테고리 분류
  const categoryMap = await categorizeChannelsToYouTube(channels);

  // 카테고리별 집계
  const categoryResults = aggregateCategoryResults(channels, categoryMap);

  // 희소성 분석
  const rarity = calculateRarity(categoryResults, channels, categoryMap);

  // TCI 스코어 계산
  const tciScores = calculateYouTubeTCI(categoryResults);

  // 상위/하위 축
  const topBottom = getTopBottomAxes(tciScores);

  return {
    categoryResults,
    rarity,
    tciScores,
    topBottom,
  };
}
