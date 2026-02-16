/**
 * YouTube 구독 분석 함수
 * - 16개 카테고리 분류
 * - 희소성 계산 (코사인 유사도)
 * - 육각형 TCI 스탯 계산
 */

import { chatCompletion } from '@/lib/gemini-client';
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
 * LLM을 사용하여 채널을 16개 카테고리로 분류 (2-pass 전략)
 * 1차: 전체 채널 분류
 * 2차: "other"로 분류된 채널만 모아서 재분류 시도
 */
export async function categorizeChannelsToYouTube(
  channels: ChannelData[]
): Promise<Map<string, YouTubeCategory>> {
  const channelList = channels
    .map((c) => `- ${c.channel_title}: ${c.channel_description?.slice(0, 100) || '설명 없음'}`)
    .join('\n');

  const classificationPrompt = `다음 YouTube 채널들을 아래 16개 카테고리 중 하나로 분류해주세요.
"other"는 정말 어떤 카테고리에도 속하지 않는 경우에만 사용하세요. 최대한 15개 카테고리 중 하나에 배정해주세요.

카테고리 목록과 예시:
- entertainment: 예능, 코미디, 버라이어티, 드라마 클립 (예: 피식대학, 워크맨, 이상한리뷰, 숏박스, 놀면뭐하니)
- vlog: 일상, 브이로그, 라이프스타일 (예: 곽튜브, 빠니보틀, 침착맨)
- music: 음악, 커버, 플레이리스트, 가수 공식채널 (예: 1theK, Dingo Music, 딩고 프리스타일)
- gaming: 게임 플레이, 게임 리뷰, e스포츠 (예: 우왁굳, 풍월량, 침착맨 게임)
- food: 먹방, 요리, 레시피, 맛집 탐방 (예: 쯔양, 백종원, 승우아빠)
- beauty: 뷰티, 패션, 메이크업, 스타일링 (예: 이사배, 회사원A, 디렉터 파이)
- education: 교육, 자기계발, 강의, 학습 (예: 세바시, 체인지그라운드, 김미경TV)
- news: 시사, 뉴스, 정치, 사회 이슈 (예: 뉴스룸, 슈카월드, 삼프로TV)
- tech: 기술, IT, 제품 리뷰, 프로그래밍 (예: 잇섭, 노마드코더, 테크몽)
- sports: 스포츠, 운동, 피트니스, 건강 (예: 캡틴, 핏블리, 말왕)
- pets: 반려동물, 동물 관련 (예: 크림히어로즈, 하루한끼, 고양이산책)
- kids: 키즈, 아동용, 장난감 (예: 캐리와 장난감친구들, 보람튜브)
- asmr: ASMR, 수면 유도, 백색소음 (예: ASMR PPOMO, 낮잠)
- finance: 투자, 재테크, 부동산, 경제 분석 (예: 부읽남, 박곰희TV, 슈카월드)
- travel: 여행, 문화 탐방, 해외 생활 (예: 곽튜브, 빠니보틀, 영국남자)
- other: 위 15개 카테고리 어디에도 속하지 않는 경우만

채널 목록:
${channelList}

JSON 형식으로 응답:
{"채널명1": "카테고리", "채널명2": "카테고리", ...}`;

  const response = await chatCompletion(
    [{ role: 'user', content: classificationPrompt }],
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
    channels.forEach((c) => result.set(c.channel_title, 'other'));
  }

  // 2차 재분류: "other"로 분류된 채널이 전체의 30% 이상이면 재시도
  const otherChannels = channels.filter(
    (c) => result.get(c.channel_title) === 'other'
  );
  if (otherChannels.length > 0 && otherChannels.length / channels.length >= 0.3) {
    console.log(`[YouTube분류] other ${otherChannels.length}개 (${Math.round(otherChannels.length / channels.length * 100)}%) → 2차 재분류 시도`);
    const reclassified = await reclassifyOtherChannels(otherChannels);
    for (const [channelName, category] of reclassified.entries()) {
      result.set(channelName, category);
    }
  }

  return result;
}

/**
 * "other"로 분류된 채널을 2차 재분류
 */
async function reclassifyOtherChannels(
  channels: ChannelData[]
): Promise<Map<string, YouTubeCategory>> {
  const channelList = channels
    .map((c) => `- ${c.channel_title}: ${c.channel_description?.slice(0, 150) || '설명 없음'}`)
    .join('\n');

  const prompt = `아래 YouTube 채널들은 1차 분류에서 카테고리를 특정하지 못했습니다.
채널명과 설명을 더 세밀하게 분석하여, 가장 가까운 카테고리를 다시 선택해주세요.
정말 어떤 카테고리에도 해당하지 않는 경우에만 other로 유지해주세요.

힌트:
- 개인 이름이 채널명인 경우 → 대부분 vlog 또는 entertainment
- "TV"가 붙은 채널 → entertainment 또는 news인 경우가 많음
- 한 분야를 깊게 다루는 채널 → education인 경우가 많음

카테고리: entertainment, vlog, music, gaming, food, beauty, education, news, tech, sports, pets, kids, asmr, finance, travel, other

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
      channels: data.channels,
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
