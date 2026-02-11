import { chatCompletion } from '@/lib/gemini-client';
import { ChannelData, ChannelCategories } from '../types';
import { getAllCategories, CategoryId } from '../data/categories';

/**
 * Categorize YouTube channels into 10 predefined categories using LLM
 * 문서 명세 기준 10대 카테고리 분류
 */
export async function categorizeChannels(
  channels: ChannelData[]
): Promise<ChannelCategories> {
  const emptyCategories: ChannelCategories = {
    musicMood: 0,
    readingHumanities: 0,
    sportsOutdoor: 0,
    entertainmentVlog: 0,
    languageCulture: 0,
    lifestyleSpace: 0,
    careerBusiness: 0,
    healingSpirituality: 0,
    fashionBeauty: 0,
    financeInvest: 0,
  };

  if (channels.length === 0) {
    return emptyCategories;
  }

  const categories = getAllCategories();

  const prompt = `다음 YouTube 채널들을 10개 카테고리로 분류해주세요.

카테고리 정의:
${categories.map(c => `- ${c.id} (${c.name}): ${c.description}`).join('\n')}

채널 목록 (${channels.length}개):
${channels.slice(0, 100).map((ch, i) => `${i + 1}. ${ch.channel_title}${ch.channel_description ? `: ${ch.channel_description.slice(0, 100)}` : ''}`).join('\n')}

각 채널을 가장 적합한 카테고리 하나에 배정하고, 카테고리별 채널 수를 JSON 형식으로 반환해주세요.
모든 카테고리를 포함해야 하며, 해당 카테고리에 채널이 없으면 0으로 표시하세요.

응답 형식:
{
  "musicMood": 5,
  "readingHumanities": 3,
  "sportsOutdoor": 2,
  "entertainmentVlog": 8,
  "languageCulture": 1,
  "lifestyleSpace": 4,
  "careerBusiness": 6,
  "healingSpirituality": 3,
  "fashionBeauty": 2,
  "financeInvest": 4
}`;

  try {
    const response = await chatCompletion(
      [
        {
          role: 'system',
          content: 'You are a YouTube channel categorization expert. Analyze channel names and descriptions to categorize them accurately. Always respond with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      {
        model: 'gpt-4-turbo',
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }
    );

    const result = JSON.parse(response || '{}');

    // Ensure all categories are present with default 0
    const categoryCounts: ChannelCategories = {
      musicMood: result.musicMood || 0,
      readingHumanities: result.readingHumanities || 0,
      sportsOutdoor: result.sportsOutdoor || 0,
      entertainmentVlog: result.entertainmentVlog || 0,
      languageCulture: result.languageCulture || 0,
      lifestyleSpace: result.lifestyleSpace || 0,
      careerBusiness: result.careerBusiness || 0,
      healingSpirituality: result.healingSpirituality || 0,
      fashionBeauty: result.fashionBeauty || 0,
      financeInvest: result.financeInvest || 0,
    };

    return categoryCounts;
  } catch (error) {
    console.error('Error categorizing channels:', error);
    // Fallback: simple heuristic categorization
    return fallbackCategorization(channels);
  }
}

/**
 * Fallback categorization using simple keyword matching
 */
function fallbackCategorization(channels: ChannelData[]): ChannelCategories {
  const counts: ChannelCategories = {
    musicMood: 0,
    readingHumanities: 0,
    sportsOutdoor: 0,
    entertainmentVlog: 0,
    languageCulture: 0,
    lifestyleSpace: 0,
    careerBusiness: 0,
    healingSpirituality: 0,
    fashionBeauty: 0,
    financeInvest: 0,
  };

  const keywords: Record<CategoryId, string[]> = {
    musicMood: ['music', '음악', 'song', 'singer', '노래', 'kpop', 'jazz', 'playlist', 'lofi', 'asmr', '감성'],
    readingHumanities: ['book', '책', 'reading', '독서', 'literature', '문학', 'novel', 'author', '철학', '역사', '인문'],
    sportsOutdoor: ['sport', '스포츠', 'fitness', '운동', 'gym', 'soccer', '등산', '캠핑', 'travel', '여행', '아웃도어'],
    entertainmentVlog: ['예능', '연예인', 'entertainment', 'vlog', '브이로그', '일상', '먹방', '코미디', '버라이어티'],
    languageCulture: ['english', '영어', '일본어', '중국어', 'language', '언어', '다문화', '해외'],
    lifestyleSpace: ['인테리어', '집', 'home', '라이프', 'lifestyle', '미니멀', '요리', 'cook', '레시피'],
    careerBusiness: ['취업', '이직', '창업', 'business', '커리어', '개발', 'coding', '코딩', 'IT', '스타트업'],
    healingSpirituality: ['명상', 'meditation', '힐링', '심리', '영성', '치유', '상담', '마음', '자존감'],
    fashionBeauty: ['패션', 'fashion', '뷰티', 'beauty', '메이크업', '화장', '스타일', '코디'],
    financeInvest: ['경제', '재테크', '투자', '주식', '부동산', '금융', '돈', '저축', 'money', '자산'],
  };

  channels.forEach((channel) => {
    const text = `${channel.channel_title} ${channel.channel_description}`.toLowerCase();
    let categorized = false;

    for (const [category, words] of Object.entries(keywords)) {
      if (words.some((word) => text.includes(word.toLowerCase()))) {
        counts[category as CategoryId]++;
        categorized = true;
        break;
      }
    }

    if (!categorized) {
      counts.entertainmentVlog++;
    }
  });

  return counts;
}
