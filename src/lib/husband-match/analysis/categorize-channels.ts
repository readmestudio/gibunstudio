import { chatCompletion } from '@/lib/openai-client';
import { ChannelData, ChannelCategories } from '../types';
import { getAllCategories } from '../data/categories';

/**
 * Categorize YouTube channels into 10 predefined categories using LLM
 */
export async function categorizeChannels(
  channels: ChannelData[]
): Promise<ChannelCategories> {
  if (channels.length === 0) {
    return {
      music: 0,
      reading: 0,
      sports: 0,
      cooking: 0,
      travel: 0,
      gaming: 0,
      tech: 0,
      art: 0,
      education: 0,
      entertainment: 0,
    };
  }

  const categories = getAllCategories();

  const prompt = `다음 YouTube 채널들을 10개 카테고리로 분류해주세요.

카테고리 정의:
${categories.map(c => `- ${c.name}: ${c.description}`).join('\n')}

채널 목록 (${channels.length}개):
${channels.slice(0, 100).map((ch, i) => `${i + 1}. ${ch.channel_title}${ch.channel_description ? `: ${ch.channel_description.slice(0, 100)}` : ''}`).join('\n')}

각 채널을 가장 적합한 카테고리 하나에 배정하고, 카테고리별 채널 수를 JSON 형식으로 반환해주세요.
모든 카테고리를 포함해야 하며, 해당 카테고리에 채널이 없으면 0으로 표시하세요.

응답 형식:
{
  "music": 5,
  "reading": 3,
  "sports": 2,
  "cooking": 4,
  "travel": 6,
  "gaming": 1,
  "tech": 8,
  "art": 2,
  "education": 7,
  "entertainment": 12
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
      music: result.music || 0,
      reading: result.reading || 0,
      sports: result.sports || 0,
      cooking: result.cooking || 0,
      travel: result.travel || 0,
      gaming: result.gaming || 0,
      tech: result.tech || 0,
      art: result.art || 0,
      education: result.education || 0,
      entertainment: result.entertainment || 0,
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
    music: 0,
    reading: 0,
    sports: 0,
    cooking: 0,
    travel: 0,
    gaming: 0,
    tech: 0,
    art: 0,
    education: 0,
    entertainment: 0,
  };

  const keywords = {
    music: ['music', '음악', 'song', 'singer', '노래', 'kpop', 'jazz', 'classical'],
    reading: ['book', '책', 'reading', '독서', 'literature', '문학', 'novel', 'author'],
    sports: ['sport', '스포츠', 'fitness', '운동', 'gym', 'soccer', 'basketball', 'baseball'],
    cooking: ['cook', '요리', 'recipe', '레시피', 'food', '음식', 'baking', 'chef'],
    travel: ['travel', '여행', 'tour', '관광', 'trip', 'vacation', 'world', 'explore'],
    gaming: ['game', '게임', 'gaming', 'play', 'esports', 'stream', 'twitch'],
    tech: ['tech', '기술', 'technology', 'coding', '코딩', 'programming', 'developer', 'ai'],
    art: ['art', '예술', 'design', '디자인', 'drawing', '그림', 'painting', 'creative'],
    education: ['education', '교육', 'learn', '학습', 'tutorial', '강의', 'lecture', 'course'],
    entertainment: ['entertainment', '엔터', 'comedy', '코미디', 'variety', '예능', 'show', 'fun'],
  };

  channels.forEach((channel) => {
    const text = `${channel.channel_title} ${channel.channel_description}`.toLowerCase();
    let categorized = false;

    for (const [category, words] of Object.entries(keywords)) {
      if (words.some((word) => text.includes(word))) {
        counts[category as keyof ChannelCategories]++;
        categorized = true;
        break;
      }
    }

    if (!categorized) {
      counts.entertainment++;
    }
  });

  return counts;
}
