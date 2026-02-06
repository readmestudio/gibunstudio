import type { SupabaseClient } from '@supabase/supabase-js';
import { categorizeChannels } from '@/lib/husband-match/analysis/categorize-channels';
import { calculateTCI } from '@/lib/husband-match/analysis/calculate-tci';
import { estimateEnneagram } from '@/lib/husband-match/analysis/estimate-enneagram';
import { estimateMBTI } from '@/lib/husband-match/analysis/estimate-mbti';
import { createVector } from '@/lib/husband-match/analysis/create-vector';
import { matchHusbandType } from '@/lib/husband-match/analysis/match-husband-type';
import { chatCompletion } from '@/lib/openai-client';
import { SYSTEM_PROMPT } from '@/lib/husband-match/prompts/system-prompt';
import type { Phase1CardData } from '@/lib/husband-match/prompts/card-prompts';
import type { ReportCard, ChannelData, ChannelCategories } from '@/lib/husband-match/types';

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

const ENNEAGRAM_NAMES: Record<number, string> = {
  1: '완벽주의자', 2: '조력자', 3: '성취자', 4: '개인주의자', 5: '탐구자',
  6: '충성주의자', 7: '열정가', 8: '도전자', 9: '조정자',
};

function formatCategories(categories: ChannelCategories): string {
  return Object.entries(categories)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([k, v]) => `${k}(${v}개)`)
    .join(', ') || '없음';
}

// 한 번의 API 호출로 모든 카드 콘텐츠 생성
async function generateAllCardsAtOnce(data: Phase1CardData): Promise<Record<string, string>> {
  const t = data.tci_scores;
  const ennea = data.enneagram_type ?? 9;
  const enneaName = ENNEAGRAM_NAMES[ennea];
  const mbti = data.mbti_type ?? 'INFP';
  const h = data.matched_husband;
  const scorePercent = Math.round(data.match_score * 100);
  const categories = formatCategories(data.channel_categories);
  const metaphor = h.variant === 'extrovert' ? h.metaphor_e : h.metaphor_i;

  const prompt = `당신은 심리 분석 전문가입니다. 아래 분석 데이터를 바탕으로 10개의 리포트 카드 내용을 JSON 형식으로 생성해주세요.

## 분석 데이터
- 채널 수: ${data.channelCount}개
- 채널 카테고리: ${categories}
- TCI 점수: NS=${t.NS}, HA=${t.HA}, RD=${t.RD}, P=${t.P}, SD=${t.SD}, CO=${t.CO}, ST=${t.ST}
- 애니어그램: ${ennea}번 (${enneaName})
- MBTI: ${mbti}
- 매칭된 남편상: ${h.name} (${h.category})
- 매칭 점수: ${scorePercent}%
- 비유: ${metaphor}

## 카드 생성 지침
각 카드는 2-3문단, 따뜻하고 공감적인 톤으로 작성해주세요.

반드시 아래 JSON 형식으로만 응답해주세요:
{
  "1": "카드1 내용 (환영 메시지, YouTube 분석 시작)",
  "2": "카드2 내용 (TCI 성격 프로필 설명)",
  "3": "카드3 내용 (애니어그램 분석)",
  "4": "카드4 내용 (MBTI 분석)",
  "5": "카드5 내용 (YouTube 콘텐츠 취향 분석)",
  "6": "카드6 내용 (추론된 가치관)",
  "7": "카드7 내용 (연애/관계 스타일)",
  "8": "카드8 내용 (매칭된 남편상 소개)",
  "9": "카드9 내용 (비유와 인사이트)",
  "10": "카드10 내용 (Phase 2 안내)"
}`;

  const response = await chatCompletion(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    { model: 'gpt-4o-mini', temperature: 0.7, max_tokens: 4000, response_format: { type: 'json_object' } }
  );

  try {
    const parsed = JSON.parse(response ?? '{}');
    return parsed;
  } catch {
    console.error('Failed to parse card JSON:', response);
    return {};
  }
}

// 폴백: 템플릿 기반 카드 생성 (API 실패 시)
function generateFallbackCards(data: Phase1CardData): Record<string, string> {
  const t = data.tci_scores;
  const ennea = data.enneagram_type ?? 9;
  const enneaName = ENNEAGRAM_NAMES[ennea];
  const mbti = data.mbti_type ?? 'INFP';
  const h = data.matched_husband;
  const scorePercent = Math.round(data.match_score * 100);
  const categories = formatCategories(data.channel_categories);

  return {
    "1": `${data.channelCount}개의 YouTube 구독 채널을 분석했습니다. 당신이 선택한 콘텐츠에는 당신의 성격, 가치관, 관계 스타일이 담겨 있습니다. 지금부터 10장의 카드로 당신의 내면을 탐색해보겠습니다.`,
    "2": `TCI 분석 결과, 새로움 추구(${t.NS}), 위험 회피(${t.HA}), 보상 의존(${t.RD}), 인내력(${t.P}), 자율성(${t.SD}), 협력성(${t.CO}), 자기초월(${t.ST}) 점수가 나왔습니다. 이 조합은 당신만의 독특한 성격 패턴을 보여줍니다.`,
    "3": `애니어그램 ${ennea}번 유형(${enneaName})으로 분석되었습니다. 이 유형은 특유의 동기와 강점을 가지고 있으며, 관계에서도 독특한 패턴을 보입니다.`,
    "4": `MBTI ${mbti} 유형으로 추정됩니다. 이 유형은 특유의 사고방식과 소통 스타일을 가지며, 연애와 결혼에서 특별한 강점을 발휘합니다.`,
    "5": `주로 ${categories} 카테고리의 콘텐츠를 구독하고 계시네요. 이런 콘텐츠 취향은 당신의 관심사와 가치관을 반영합니다.`,
    "6": `분석 결과를 종합하면, 당신은 관계에서 진정성과 깊이를 중요하게 여기는 것으로 보입니다. 표면적인 것보다 내면의 연결을 추구하는 성향이 있습니다.`,
    "7": `${mbti} 유형과 애니어그램 ${ennea}번의 조합은 연애에서 특유의 스타일을 만들어냅니다. 당신만의 애정 표현 방식과 관계 패턴이 있습니다.`,
    "8": `당신과 ${scorePercent}% 매칭되는 남편상은 "${h.name}"입니다. ${h.description}`,
    "9": `당신과 파트너의 관계는 "${h.variant === 'extrovert' ? h.metaphor_e : h.metaphor_i}"에 비유할 수 있습니다. 서로의 강점이 조화를 이루며 함께 성장하는 관계가 될 수 있습니다.`,
    "10": `지금까지의 분석은 YouTube 구독 데이터를 기반으로 했습니다. Phase 2 서베이에 참여하시면 더 정교한 교차검증을 통해 깊이 있는 인사이트를 얻으실 수 있습니다.`,
  };
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

  // 한 번의 API 호출로 모든 카드 생성 (또는 폴백 사용)
  let cardContents: Record<string, string>;
  try {
    cardContents = await generateAllCardsAtOnce(cardData);
    // 파싱 실패 또는 불완전한 응답 시 폴백
    if (!cardContents || Object.keys(cardContents).length < 10) {
      console.log('[Phase 1] Incomplete AI response, using fallback');
      cardContents = generateFallbackCards(cardData);
    }
  } catch (err) {
    console.error('[Phase 1] Card generation failed, using fallback:', err);
    cardContents = generateFallbackCards(cardData);
  }

  const cards: ReportCard[] = [];
  for (let cardNumber = 1; cardNumber <= 10; cardNumber++) {
    const meta = CARD_TITLES[cardNumber];
    const cardKey = String(cardNumber);
    const content = cardContents[cardKey] || '분석 결과를 불러오는 중 문제가 발생했습니다.';
    cards.push({
      card_number: cardNumber,
      title: meta.title,
      subtitle: meta.subtitle,
      content: String(content).slice(0, 2000),
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
