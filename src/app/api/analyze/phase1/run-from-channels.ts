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
import {
  ENNEAGRAM_NAMES,
  TCI_NAMES,
  getSortedCategories,
  getTopTCIScores,
} from '@/lib/husband-match/prompts/card-prompts';
import type { ReportCard, ChannelData, ChannelCategories, TCIScores } from '@/lib/husband-match/types';

// 문서 명세 기준 12장 카드 타이틀
const CARD_TITLES: Record<number, { title: string; subtitle?: string; card_type: ReportCard['card_type'] }> = {
  1: { title: '당신의 YouTube, 당신의 마음', subtitle: '커버', card_type: 'intro' },
  2: { title: '구독 데이터 개요', subtitle: '분석 시작', card_type: 'intro' },
  3: { title: '당신은 ___ 타입', subtitle: '성격 유형', card_type: 'personality' },
  4: { title: '구독 리스트 특징 & 패턴', subtitle: '패턴 분석', card_type: 'personality' },
  5: { title: '주 카테고리 분류', subtitle: '카테고리 분석', card_type: 'values' },
  6: { title: '종합 유형 카드', subtitle: 'MBTI · 애니어그램 · TCI', card_type: 'personality' },
  7: { title: '당신의 감성', subtitle: '감정 스타일', card_type: 'values' },
  8: { title: '추구하는 미래', subtitle: '미래상', card_type: 'values' },
  9: { title: '견디기 힘든 상대방의 단점', subtitle: '관계 인사이트', card_type: 'values' },
  10: { title: '당신의 왕자님은', subtitle: '매칭 결과', card_type: 'matching' },
  11: { title: '왕자님 상세 프로필', subtitle: '파트너 프로필', card_type: 'matching' },
  12: { title: '더 깊은 분석이 궁금하신가요?', subtitle: 'Phase 2 안내', card_type: 'result' },
};

function formatCategoriesForPrompt(categories: ChannelCategories): string {
  const sorted = getSortedCategories(categories);
  return sorted.slice(0, 5).map(c => `${c.name}(${c.count}개, ${c.percent}%)`).join(', ') || '없음';
}

function formatTCIScores(tci: TCIScores): string {
  return Object.entries(tci)
    .map(([key, value]) => `${TCI_NAMES[key as keyof TCIScores]}(${key})=${value}`)
    .join(', ');
}

// 한 번의 API 호출로 모든 카드 콘텐츠 생성 (12장)
async function generateAllCardsAtOnce(data: Phase1CardData): Promise<Record<string, string>> {
  const t = data.tci_scores;
  const ennea = data.enneagram_type ?? 9;
  const enneaName = ENNEAGRAM_NAMES[ennea];
  const mbti = data.mbti_type ?? 'INFP';
  const h = data.matched_husband;
  const scorePercent = Math.round(data.match_score * 100);
  const categories = formatCategoriesForPrompt(data.channel_categories);
  const topTCI = getTopTCIScores(t, 2);
  const metaphor = h.variant === 'extrovert' ? h.metaphor_e : h.metaphor_i;

  const prompt = `당신은 심리 분석 전문가입니다. 아래 분석 데이터를 바탕으로 12개의 리포트 카드 내용을 JSON 형식으로 생성해주세요.

## 분석 데이터
- 채널 수: ${data.channelCount}개
- 채널 카테고리 분포: ${categories}
- TCI 7차원: ${formatTCIScores(t)}
- TCI 상위: ${topTCI.map(x => `${x.name}(${x.score})`).join(', ')}
- 애니어그램: ${ennea}번 (${enneaName})
- 3대 중심: Head=${data.enneagram_center.head}, Heart=${data.enneagram_center.heart}, Body=${data.enneagram_center.body}
- MBTI: ${mbti} (E/I: ${data.mbti_scores.E}/${data.mbti_scores.I}, S/N: ${data.mbti_scores.S}/${data.mbti_scores.N}, T/F: ${data.mbti_scores.T}/${data.mbti_scores.F}, J/P: ${data.mbti_scores.J}/${data.mbti_scores.P})
- 매칭된 남편상: ${h.name} (${h.category} - ${h.subcategory})
- 매칭 점수: ${scorePercent}%
- 비유: ${metaphor}

## 카드 생성 지침
- 각 카드는 300-500자, 따뜻하고 공감적인 톤
- 문체: "~해요", "~합니다" 혼용
- 2-3문장마다 단락 분리
- 비유 필수: 모든 분석에 1개 이상 비유적 표현
- 금지 표현: "약점", "문제가 있는", "부족한" → "소중히 여기는", "당신만의 방식으로" 사용

## 12장 카드 구조
1. 커버: 한 문장 비유 + 환영 메시지
2. 구독 데이터 개요: 통계 요약 + 의미 설명
3. 당신은 ___ 타입: 타입명 + 해시태그 + 특성
4. 구독 리스트 특징 & 패턴: 2-3개 패턴 분석
5. 주 카테고리 분류: 상위 3개 카테고리 설명
6. 종합 유형 카드: MBTI/애니어그램/TCI 명시 + 심리학적 해석
7. 당신의 감성: 감정 처리 방식 + 힐링 패턴
8. 추구하는 미래: 미래상 비유 + 구체적 장면
9. 견디기 힘든 상대방의 단점: 힘든 특성 + 리프레이밍
10. 당신의 왕자님은: 대형 비유 + 유형 설명
11. 왕자님 상세 프로필: 기본 정보 + 함께하는 장면 3개
12. 결제 유도: Phase 2 미리보기 + CTA

반드시 아래 JSON 형식으로만 응답해주세요:
{
  "1": "카드1 내용",
  "2": "카드2 내용",
  "3": "카드3 내용",
  "4": "카드4 내용",
  "5": "카드5 내용",
  "6": "카드6 내용",
  "7": "카드7 내용",
  "8": "카드8 내용",
  "9": "카드9 내용",
  "10": "카드10 내용",
  "11": "카드11 내용",
  "12": "카드12 내용"
}`;

  const response = await chatCompletion(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    { model: 'gpt-4o-mini', temperature: 0.7, max_tokens: 6000, response_format: { type: 'json_object' } }
  );

  try {
    const parsed = JSON.parse(response ?? '{}');
    return parsed;
  } catch {
    console.error('Failed to parse card JSON:', response);
    return {};
  }
}

// 폴백: 템플릿 기반 카드 생성 (API 실패 시) - 12장
function generateFallbackCards(data: Phase1CardData): Record<string, string> {
  const t = data.tci_scores;
  const ennea = data.enneagram_type ?? 9;
  const enneaName = ENNEAGRAM_NAMES[ennea];
  const mbti = data.mbti_type ?? 'INFP';
  const h = data.matched_husband;
  const scorePercent = Math.round(data.match_score * 100);
  const topTCI = getTopTCIScores(t, 2);
  const sortedCats = getSortedCategories(data.channel_categories);

  return {
    "1": `YouTube 구독 기반 성격 & 남편상 분석 리포트\n\n당신의 구독 채널 ${data.channelCount}개를 분석해 숨겨진 마음의 지도를 그려보았어요. 지금부터 12장의 카드로 당신의 내면을 탐색해볼게요.`,
    "2": `📊 분석 개요\n\n구독 채널 수: ${data.channelCount}개\n사용 카테고리: ${sortedCats.length}개\n가장 많은 분야: ${sortedCats[0]?.name || '다양함'}\n\n당신의 YouTube는 단순한 엔터테인먼트가 아니에요. 마치 개인 도서관처럼, 관심사와 가치관이 켜켜이 쌓여 있어요.`,
    "3": `채널을 분석해보았더니 당신은\n\n"${mbti} · ${ennea}번 ${enneaName}"\n\n타입이에요.\n\n#${topTCI[0]?.name || '성장지향'} #${topTCI[1]?.name || '깊은대화'} #자기이해\n\n이 타입은 특유의 깊이와 통찰력을 가진 분이에요.`,
    "4": `구독 리스트에서 발견한 특별한 패턴이에요.\n\n✦ 주요 카테고리: ${sortedCats.slice(0, 3).map(c => c.name).join(', ')}\n\n이런 조합은 당신만의 독특한 관심사를 보여줍니다. ${sortedCats[0]?.name || '다양한'} 콘텐츠를 많이 보시는 분들은 ${sortedCats[0]?.id === 'healingSpirituality' ? '내면의 평화를 중요하게 여기는' : '성장과 발전을 추구하는'} 경향이 있어요.`,
    "5": `📊 카테고리 분포\n\n${sortedCats.slice(0, 5).map((c, i) => `${i + 1}위: ${c.name} (${c.percent}%)`).join('\n')}\n\n당신의 구독 리스트는 ${sortedCats[0]?.name || '다양한'} 분야에 가장 관심이 많다는 걸 보여주네요.`,
    "6": `종합 분석 결과\n\n당신의 유형은\n\n${mbti} · 애니어그램 ${ennea}번\nTCI: ${topTCI[0]?.name}(${topTCI[0]?.score}), ${topTCI[1]?.name}(${topTCI[1]?.score})\n\n📋 TCI 7차원 상세\n${Object.entries(t).map(([k, v]) => `${TCI_NAMES[k as keyof TCIScores]}(${k}): ${v}`).join('\n')}\n\n${mbti}와 애니어그램 ${ennea}번의 조합은 ${enneaName}의 특성을 가진 유형이에요.`,
    "7": `당신의 감성\n\n"감정을 환경으로 표현하는 사람"\n\n당신은 힘들 때 사람을 찾기보다 공간과 분위기를 바꾸시는 분이에요. 그건 당신이 냉정해서가 아니에요. 오히려 감정에 민감하기 때문이에요.\n\n💡 당신만의 힐링 패턴\n✓ 힘들 때 혼자만의 시간이 필요함\n✓ 음악이나 공간의 분위기에 민감함`,
    "8": `당신이 꿈꾸는 미래\n\n"의미 있는 일상이 있는 저녁"\n\n라이프스타일: ●●●●○ 안정적\n커리어: ●●●●● 성취형\n관계: ●●●○○ 독립적\n\nTCI 자율성(SD) ${t.SD}과 자기초월(ST) ${t.ST}이 말해주는 건, 당신이 "의미 있는 성취"와 "내면의 평화"를 동시에 원한다는 거예요.`,
    "9": `당신이 가장 힘들어하는 상대방의 모습이에요.\n\n⚠️ "${t.ST > 60 ? '피상적 대화' : '급작스러운 변화'}"\n\n${t.ST > 60 ? '당신에게 가장 견디기 힘든 건 깊이 없는 대화예요.' : '당신은 예측 가능한 환경을 선호해요.'}\n\n💚 이건 약점이 아니에요\n그만큼 관계에서 진정한 연결을 원하기 때문이에요.`,
    "10": `당신의 왕자님은\n\n"${h.variant === 'extrovert' ? h.metaphor_e : h.metaphor_i}"\n\n📖 ${h.category} - ${h.subcategory}\n\n처음 만났을 때 눈에 띄는 타입은 아닐 수 있지만, 대화를 나눌수록 "이 사람, 깊이가 있다"는 걸 느끼게 될 거예요.`,
    "11": `당신의 왕자님 프로필\n\n📋 기본 정보\n유형: ${h.name}\n카테고리: ${h.category}\n매칭 점수: ${scorePercent}%\n\n💝 이런 분이에요\n${h.description}\n\n🌙 함께하면 이런 모습이에요\n【장면 1】 편안한 침묵 속에서 각자의 일을 하다 눈을 마주치고 미소 짓는 시간\n【장면 2】 깊은 대화가 밤늦게까지 이어지는 순간\n【장면 3】 서로에게 작은 선물 같은 일상을 나누는 시간`,
    "12": `여기까지가 무료 분석이에요.\n\n더 깊은 이야기가 기다리고 있어요.\n\n🔮 Phase 2에서 알 수 있는 것\n✦ 애인이 생각하는 당신 → [블러 처리]\n✦ 당신이 결혼을 확신하게 되는 순간 → [블러 처리]\n✦ 연애에서 결혼으로 못 가는 진짜 이유 → [블러 처리]\n✦ 만약 이혼한다면, 그 이유는... → [블러 처리]\n\n📝 Phase 2 진행 방식\n1. 9개의 심층 질문에 답변\n2. YouTube 데이터와 교차 검증\n3. 8장의 심층 리포트 카드 제공\n\n[ 💎 심층 분석 시작하기 — ₩4,900 ]\n\n* 분석 결과는 심리학적 연구를 기반으로 하지만, 실제 심리 검사를 대체하지 않습니다.`,
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
    if (!cardContents || Object.keys(cardContents).length < 12) {
      console.log('[Phase 1] Incomplete AI response, using fallback');
      cardContents = generateFallbackCards(cardData);
    }
  } catch (err) {
    console.error('[Phase 1] Card generation failed, using fallback:', err);
    cardContents = generateFallbackCards(cardData);
  }

  // 12장 카드 생성
  const cards: ReportCard[] = [];
  for (let cardNumber = 1; cardNumber <= 12; cardNumber++) {
    const meta = CARD_TITLES[cardNumber];
    const cardKey = String(cardNumber);
    const content = cardContents[cardKey] || '분석 결과를 불러오는 중 문제가 발생했습니다.';
    cards.push({
      card_number: cardNumber,
      title: meta.title,
      subtitle: meta.subtitle,
      content: String(content).slice(0, 3000),
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
