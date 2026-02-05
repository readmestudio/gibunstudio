import type { SupabaseClient } from '@supabase/supabase-js';
import { categorizeChannels } from '@/lib/husband-match/analysis/categorize-channels';
import { calculateTCI } from '@/lib/husband-match/analysis/calculate-tci';
import { estimateEnneagram } from '@/lib/husband-match/analysis/estimate-enneagram';
import { estimateMBTI } from '@/lib/husband-match/analysis/estimate-mbti';
import { createVector } from '@/lib/husband-match/analysis/create-vector';
import { matchHusbandType } from '@/lib/husband-match/analysis/match-husband-type';
import { chatCompletion } from '@/lib/openai-client';
import { SYSTEM_PROMPT } from '@/lib/husband-match/prompts/system-prompt';
import {
  PHASE1_CARD_PROMPTS,
  Phase1CardData,
} from '@/lib/husband-match/prompts/card-prompts';
import { generateMetaphor } from '@/lib/husband-match/prompts/metaphor-generator';
import type { ReportCard } from '@/lib/husband-match/types';
import type { ChannelData } from '@/lib/husband-match/types';

const CARD_TITLES: Record<number, { title: string; subtitle?: string; card_type: ReportCard['card_type'] }> = {
  1: { title: '당신의 YouTube, 당신의 마음', subtitle: '분석을 시작합니다', card_type: 'intro' },
  2: { title: '성격 프로필', subtitle: 'TCI 기반', card_type: 'personality' },
  3: { title: '애니어그램 분석', subtitle: '내면의 동기', card_type: 'personality' },
  4: { title: 'MBTI 추정', subtitle: '사고와 소통 스타일', card_type: 'personality' },
  5: { title: 'YouTube 콘텐츠 취향', subtitle: '당신이 선택한 채널', card_type: 'values' },
  6: { title: '추론된 가치관', subtitle: '당신이 소중히 여기는 것', card_type: 'values' },
  7: { title: '관계 스타일', subtitle: '연애와 결혼에서의 당신', card_type: 'values' },
  8: { title: '당신과 맞는 남편상', subtitle: '매칭 결과', card_type: 'matching' },
  9: { title: '비유와 인사이트', subtitle: '관계의 이미지', card_type: 'matching' },
  10: { title: '더 깊은 분석이 궁금하신가요?', subtitle: 'Phase 2 안내', card_type: 'result' },
};

async function generateCardContent(
  cardKey: keyof typeof PHASE1_CARD_PROMPTS,
  data: Phase1CardData
): Promise<string> {
  const prompt = PHASE1_CARD_PROMPTS[cardKey](data);
  const response = await chatCompletion(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    { model: 'gpt-4-turbo', temperature: 0.7, max_tokens: 600 }
  );
  return (response ?? '').trim().slice(0, 2000);
}

export interface Phase1Precomputed {
  channel_categories: Awaited<ReturnType<typeof categorizeChannels>>;
  tci_scores: ReturnType<typeof calculateTCI>;
  enneagram_center: ReturnType<typeof estimateEnneagram>['center'];
  enneagram_type: number;
  mbti_scores: ReturnType<typeof estimateMBTI>['scores'];
  mbti_type: string;
  user_vector: number[];
  channelCount: number;
}

/**
 * Run full Phase 1 pipeline from ChannelData[] and insert result.
 */
export async function runPhase1FromChannels(
  supabase: SupabaseClient,
  userId: string,
  channels: ChannelData[]
): Promise<{ phase1_id: string }> {
  const channel_categories = await categorizeChannels(channels);
  const tci_scores = calculateTCI(channel_categories);
  const enneagram = estimateEnneagram(tci_scores, channel_categories);
  const mbti = estimateMBTI(tci_scores, channel_categories);
  const user_vector = createVector(tci_scores, enneagram.center, channel_categories);
  const channelCount = channels.length;

  return runPhase1FromPrecomputed(supabase, userId, {
    channel_categories,
    tci_scores,
    enneagram_center: enneagram.center,
    enneagram_type: enneagram.type,
    mbti_scores: mbti.scores,
    mbti_type: mbti.type,
    user_vector,
    channelCount,
  });
}

/**
 * Run Phase 1 card generation + insert from precomputed analysis (e.g. survey result).
 */
export async function runPhase1FromPrecomputed(
  supabase: SupabaseClient,
  userId: string,
  data: Phase1Precomputed
): Promise<{ phase1_id: string }> {
  const {
    channel_categories,
    tci_scores,
    enneagram_center,
    enneagram_type,
    mbti_scores,
    mbti_type,
    user_vector,
    channelCount,
  } = data;

  const matchResult = matchHusbandType(
    user_vector,
    mbti_scores,
    enneagram_type
  );

  const cardData: Phase1CardData = {
    channelCount,
    channel_categories,
    tci_scores,
    enneagram_center,
    enneagram_type,
    mbti_scores,
    mbti_type,
    matched_husband: matchResult.type,
    match_score: matchResult.score,
  };

  try {
    cardData.metaphor = await generateMetaphor(
      `MBTI ${mbti_type}, 애니어그램 ${enneagram_type}번, 남편상 ${matchResult.type.name}. ${matchResult.type.description}`
    );
  } catch {
    cardData.metaphor = matchResult.type.variant === 'extrovert'
      ? matchResult.type.metaphor_e
      : matchResult.type.metaphor_i;
  }

  const cardKeys: (keyof typeof PHASE1_CARD_PROMPTS)[] = [
    'card_01_intro',
    'card_02_personality',
    'card_03_enneagram',
    'card_04_mbti',
    'card_05_content',
    'card_06_values',
    'card_07_relationship',
    'card_08_match_result',
    'card_09_metaphor',
    'card_10_cta',
  ];

  const cards: ReportCard[] = [];

  for (let i = 0; i < cardKeys.length; i++) {
    const key = cardKeys[i];
    const cardNumber = i + 1;
    const meta = CARD_TITLES[cardNumber];
    let content: string;
    try {
      content = await generateCardContent(key, cardData);
    } catch (err) {
      console.error(`[Phase 1] Card ${cardNumber} generation failed:`, err);
      content = '분석 결과를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
    }
    cards.push({
      card_number: cardNumber,
      title: meta.title,
      subtitle: meta.subtitle,
      content,
      card_type: meta.card_type,
    });
  }

  const payload = {
    user_id: userId,
    channel_categories,
    tci_scores,
    enneagram_center,
    enneagram_type,
    mbti_scores,
    mbti_type,
    user_vector,
    matched_husband_type: matchResult.type.id,
    match_score: matchResult.score,
    match_method: matchResult.method,
    cards,
  };

  const { data: result, error: insertError } = await supabase
    .from('phase1_results')
    .insert(payload)
    .select('id')
    .single();

  if (insertError) {
    console.error('Failed to store Phase 1 results:', insertError);
    throw new Error('Failed to store analysis results');
  }

  return { phase1_id: result.id };
}
