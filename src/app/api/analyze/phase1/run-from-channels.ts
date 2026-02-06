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
  TCI_CHARACTERISTICS,
  getSortedCategories,
  getTopTCIScores,
  getBottomTCIScores,
  getTCICharacteristics,
  getHexagonChartData,
} from '@/lib/husband-match/prompts/card-prompts';
import type { ReportCard, ChannelData, ChannelCategories, TCIScores } from '@/lib/husband-match/types';

// 카드 1 고정 텍스트 (항상 동일한 내용)
const CARD_1_FIXED_CONTENT = `새벽 두 시, 아무도 모르게 재생한 그 영상. 습관처럼 누른 구독 버튼, 알고리즘이 슬쩍 건넨 추천 한 줄.

거기엔 당신도 의식하지 못한 욕구와 결핍, 끌림의 방향이 고스란히 기록되어 있습니다.

유튜브는 생각보다 사적인 공간입니다. 타인 앞에서는 쉽게 포장하지만, 혼자 보는 화면 앞에서만큼은 누구나 꽤 정직해지니까요.

지금부터 당신의 구독 채널과 시청 패턴을 찬찬히 들여다보겠습니다. 그 안에서 당신의 성격 구조와 관계 욕구를 읽어내고, 평생의 동반자가 될 사람의 유형과 구체적인 프로필, 그리고 절대 참을 수 없는 상대의 단점까지 짚어드리겠습니다.

준비되셨다면, 시작합니다.`;

// 9장 카드 타이틀 (2026-02-06 개선: 카드 통합)
const CARD_TITLES: Record<number, { title: string; subtitle?: string; card_type: ReportCard['card_type'] }> = {
  1: { title: '당신이 몰래 본 영상이, 당신을 말하고 있다', subtitle: 'INTRO', card_type: 'intro' },
  2: { title: '구독 데이터 개요', subtitle: '분석 시작', card_type: 'intro' },
  3: { title: '당신은 ___ 타입', subtitle: '통합 유형 분석', card_type: 'personality' },
  4: { title: '당신의 감성', subtitle: '감정 스타일', card_type: 'values' },
  5: { title: '추구하는 미래', subtitle: '미래상', card_type: 'values' },
  6: { title: '견디기 힘든 상대방의 단점', subtitle: '관계 인사이트', card_type: 'values' },
  7: { title: '당신의 왕자님은', subtitle: '매칭 결과', card_type: 'matching' },
  8: { title: '왕자님 상세 프로필', subtitle: '파트너 프로필', card_type: 'matching' },
  9: { title: '더 깊은 분석이 궁금하신가요?', subtitle: 'Phase 2 안내', card_type: 'result' },
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

// MBTI 특성 텍스트 생성 (번호 없이)
function getMBTITraits(scores: Phase1CardData['mbti_scores']): string[] {
  const traits: string[] = [];
  traits.push(scores.E > scores.I ? '사람들과의 교류에서 에너지를 얻는' : '혼자만의 시간에서 에너지를 충전하는');
  traits.push(scores.S > scores.N ? '현실적이고 구체적인 것을 선호하는' : '가능성과 아이디어를 탐구하는 것을 좋아하는');
  traits.push(scores.T > scores.F ? '논리적이고 객관적인 판단을 중시하는' : '사람과 가치를 중심으로 결정하는');
  traits.push(scores.J > scores.P ? '계획적이고 체계적인 것을 선호하는' : '유연하고 즉흥적인 것을 즐기는');
  return traits;
}

// 애니어그램 특성 텍스트 (번호 없이)
function getEnneagramTrait(type: number): string {
  const traits: Record<number, string> = {
    1: '완벽을 추구하고 원칙을 중요시하는 성향',
    2: '타인을 돕고 관계를 중요시하는 따뜻한 성향',
    3: '성취와 인정을 추구하며 목표 지향적인 성향',
    4: '자신만의 독특함과 깊은 감정을 중요시하는 성향',
    5: '지식과 이해를 추구하며 독립적인 성향',
    6: '안전과 신뢰를 중요시하며 충성스러운 성향',
    7: '즐거움과 다양한 경험을 추구하는 활발한 성향',
    8: '힘과 통제를 중요시하며 도전적인 성향',
    9: '평화와 조화를 추구하며 수용적인 성향',
  };
  return traits[type] || traits[9];
}

// 한 번의 API 호출로 모든 카드 콘텐츠 생성 (9장, 분량 증가)
async function generateAllCardsAtOnce(data: Phase1CardData): Promise<Record<string, string>> {
  const t = data.tci_scores;
  const ennea = data.enneagram_type ?? 9;
  const enneaName = ENNEAGRAM_NAMES[ennea];
  const h = data.matched_husband;
  const scorePercent = Math.round(data.match_score * 100);
  const sortedCats = getSortedCategories(data.channel_categories);
  const categories = formatCategoriesForPrompt(data.channel_categories);
  const topTCI = getTopTCIScores(t, 3);
  const bottomTCI = getBottomTCIScores(t, 2);
  const characteristics = getTCICharacteristics(t);
  const hexData = getHexagonChartData(t, data.channel_categories);
  const metaphor = h.variant === 'extrovert' ? h.metaphor_e : h.metaphor_i;
  const mbtiTraits = getMBTITraits(data.mbti_scores);
  const enneaTrait = getEnneagramTrait(ennea);

  const prompt = `당신은 심리 분석 전문가입니다. 아래 분석 데이터를 바탕으로 9개의 리포트 카드 내용을 JSON 형식으로 생성해주세요.

## 분석 데이터
- 채널 수: ${data.channelCount}개
- 채널 카테고리 분포: ${categories}
- 상위 카테고리: ${sortedCats.slice(0, 3).map(c => `${c.name}(${c.percent}%)`).join(', ')}
- TCI 7차원: ${formatTCIScores(t)}
- TCI 상위: ${topTCI.map(x => `${x.name}(${x.score}점)`).join(', ')}
- TCI 하위: ${bottomTCI.map(x => `${x.name}(${x.score}점)`).join(', ')}
- TCI 특성 키워드: ${characteristics.slice(0, 3).join(' / ')}
- 애니어그램: ${ennea}번 (${enneaName}) - 특성: ${enneaTrait}
- 3대 중심: Head=${data.enneagram_center.head}, Heart=${data.enneagram_center.heart}, Body=${data.enneagram_center.body}
- MBTI: ${data.mbti_type} (E/I: ${data.mbti_scores.E}/${data.mbti_scores.I}, S/N: ${data.mbti_scores.S}/${data.mbti_scores.N}, T/F: ${data.mbti_scores.T}/${data.mbti_scores.F}, J/P: ${data.mbti_scores.J}/${data.mbti_scores.P})
- MBTI 특성: ${mbtiTraits.join(', ')}
- 매칭된 남편상: ${h.name} (${h.category} - ${h.subcategory})
- 매칭 점수: ${scorePercent}%
- 비유: ${metaphor}

육각형 차트 데이터:
${hexData.labels.map((label, i) => `- ${label}: ${hexData.values[i]}점`).join('\n')}

## ⚠️ 중요 지침
1. 각 카드는 지정된 글자 수를 반드시 지켜주세요
2. 모든 해석에는 "왜 이렇게 해석하는지" 근거를 제시해주세요
3. MBTI 4글자(ENFP 등), 애니어그램 번호(9번 등), TCI 척도명(자극추구 등)을 직접 명시하지 마세요!
   → 대신 그들의 특징만 서술하세요 (신뢰도 문제 방지)
4. 카드 2 제목은 "구독 데이터 개요"가 아닌 마케팅 카피로 작성하세요

## 9장 카드 구조 및 분량

### 카드 1: 커버 (700-1000자)
- 대형 한 줄 카피 (예: "감각을 통해 세상을 바라보는 자유로운 영혼")
- 따뜻한 환영 메시지 (3-4문장)
- 분석 근거 요약 (2-3문장)

### 카드 2: 구독 데이터 개요 (700-1000자)
⚠️ 제목을 마케팅 카피로! (예: "다양한 감각으로 세상을 탐험하는 사람")
- 데이터 요약 + 의미 (3-4문장)
- 육각형 밸런스 분석 (4-5문장) - 6축 중 높은/낮은 영역 해석
- 근거 제시 (3-4문장)

### 카드 3: 당신은 ___ 타입 (1500자) ← 가장 긴 카드!
⚠️ MBTI/애니어그램 번호 명시 금지! 특징만 서술!
- 유형명 제목 (2-4단어, 예: "감성적 탐구자")
- 핵심 키워드 3개 (#해시태그 형식)
- 구독 패턴에서 발견한 특징 (400자) - 상위 카테고리와 연결
- 심리 특성 해석 (400자) - MBTI/애니어그램 특징을 명칭 없이 서술
- 종합 해석 (400자) - 강점, 매력, 타인이 느끼는 인상
- 근거 제시 (300자) - 왜 이 유형으로 진단했는지

### 카드 4: 당신의 감성 (700-1000자)
- 감성 유형 정의 (한 문장)
- 감정 처리 방식 (4-5문장)
- 힐링 패턴 체크리스트 (5개 ✓ 항목)
- 긍정적 리프레이밍 (3-4문장)
- 근거 제시 (2-3문장)

### 카드 5: 추구하는 미래 (700-1000자)
- 미래상 비유 제목
- 3축 분석 (라이프스타일/커리어/관계)
- 미래의 어느 저녁 장면 (5-6문장)
- 심리 특성이 말해주는 욕구 (3-4문장)
- 근거 제시 (2-3문장)

### 카드 6: 견디기 힘든 상대방의 단점 (700-1000자)
⚠️ MBTI/애니어그램 명칭 금지!
- 힘든 특성 정의 (한 문장)
- 왜 힘든지 설명 (4-5문장)
- 구체적 상황 예시 (3개 테이블 형식)
- 긍정적 리프레이밍 (3-4문장)
- 근거 제시 (2-3문장)

### 카드 7: 당신의 왕자님은 (700-1000자)
- 대형 비유 문구 제목
- 유형 정의 (2문장)
- 처음 만났을 때 (4-5문장)
- 왜 이 유형인지 (4-5문장)
- 근거 제시 (2-3문장)

### 카드 8: 왕자님 상세 프로필 (700-1000자)
- 기본 정보
- "이런 분이에요" (5-6문장)
- "함께하면 이런 모습이에요" (3개 장면)
- "알아두세요" (3-4문장)

### 카드 9: 결제 유도 (500-700자)
- 마무리 메시지
- Phase 2 미리보기 4개 (블러 형태)
- CTA: "심층 분석 시작하기 — ₩4,900"
- 면책 조항

## 응답 형식
반드시 아래 JSON 형식으로만 응답:
{
  "1": "카드1 내용 (700자 이상)",
  "2": "카드2 내용 (700자 이상, 제목은 마케팅 카피)",
  "3": "카드3 내용 (1500자 이상, MBTI/애니어그램 번호 없이)",
  "4": "카드4 내용 (700자 이상)",
  "5": "카드5 내용 (700자 이상)",
  "6": "카드6 내용 (700자 이상)",
  "7": "카드7 내용 (700자 이상)",
  "8": "카드8 내용 (700자 이상)",
  "9": "카드9 내용 (500자 이상)"
}`;

  const response = await chatCompletion(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    { model: 'gpt-4o-mini', temperature: 0.7, max_tokens: 10000, response_format: { type: 'json_object' } }
  );

  try {
    const parsed = JSON.parse(response ?? '{}');
    return parsed;
  } catch {
    console.error('Failed to parse card JSON:', response);
    return {};
  }
}

// 폴백: 템플릿 기반 카드 생성 (API 실패 시) - 9장
function generateFallbackCards(data: Phase1CardData): Record<string, string> {
  const t = data.tci_scores;
  const h = data.matched_husband;
  const scorePercent = Math.round(data.match_score * 100);
  const topTCI = getTopTCIScores(t, 3);
  const bottomTCI = getBottomTCIScores(t, 2);
  const sortedCats = getSortedCategories(data.channel_categories);
  const characteristics = getTCICharacteristics(t);
  const mbtiTraits = getMBTITraits(data.mbti_scores);
  const enneaTrait = getEnneagramTrait(data.enneagram_type ?? 9);
  const hexData = getHexagonChartData(t, data.channel_categories);

  return {
    "1": CARD_1_FIXED_CONTENT,

    "2": `${characteristics[0] || '다양한 감각으로 세상을 탐험하는 사람'}

📊 당신의 구독 데이터를 분석했어요.

총 ${data.channelCount}개의 채널에서 ${sortedCats.length}개의 카테고리를 발견했어요. 가장 많은 비중을 차지하는 분야는 ${sortedCats[0]?.name || '다양함'}(${sortedCats[0]?.percent || 0}%)이에요.

이 데이터가 말해주는 건, 당신이 ${sortedCats[0]?.id === 'healingSpirituality' ? '내면의 평화와 성장을' : sortedCats[0]?.id === 'entertainmentVlog' ? '즐거움과 소통을' : '다양한 경험을'} 중요하게 여긴다는 거예요.

🔷 육각형 밸런스 분석

당신의 성향을 6가지 축으로 분석해보았어요:

${hexData.labels.map((label, i) => `• ${label}: ${hexData.values[i]}점 - ${hexData.descriptions[i]}`).join('\n')}

가장 높은 축은 "${hexData.labels[hexData.values.indexOf(Math.max(...hexData.values))]}"이에요. 이는 ${characteristics[0] || '성장을 추구하는'} 당신의 특성과 일치해요.

반면 상대적으로 낮은 축도 있는데, 이건 약점이 아니라 당신이 다른 가치에 더 집중하고 있다는 의미예요.

이 밸런스가 만들어내는 당신만의 독특한 성격, 다음 카드에서 더 자세히 알아볼게요.`,

    "3": `당신은 "${characteristics[0] || '감성적 탐구자'}" 타입이에요

#${topTCI[0]?.name || '성장지향'} #${topTCI[1]?.name || '깊은대화'} #자기이해

━━━━━━━━━━━━━━━━━━━━━━━━━

📌 구독 패턴에서 발견한 특징

당신의 구독 리스트를 분석한 결과, 흥미로운 패턴을 발견했어요.

${sortedCats[0]?.name || '다양한'} 카테고리가 전체의 ${sortedCats[0]?.percent || 0}%를 차지해요. 이런 채널을 많이 구독하시는 분들은 ${sortedCats[0]?.id === 'healingSpirituality' ? '삶의 의미와 내면의 평화를 중요하게 여기는' : sortedCats[0]?.id === 'careerBusiness' ? '성장과 성취를 추구하는' : sortedCats[0]?.id === 'entertainmentVlog' ? '즐거움과 소통을 즐기는' : '다양한 경험을 추구하는'} 경향이 있어요.

두 번째로 많은 ${sortedCats[1]?.name || '기타'}(${sortedCats[1]?.percent || 0}%)와의 조합이 특히 인상적이에요. 이 조합은 ${sortedCats[0]?.name || ''}의 깊이와 ${sortedCats[1]?.name || ''}의 균형을 동시에 추구한다는 걸 보여줘요.

왜 이렇게 해석하냐면, 구독 채널은 무의식적인 관심사를 반영하기 때문이에요. 당신이 의식적으로 선택하지 않았더라도, 알고리즘이 추천하는 채널에 반응한다는 건 그 분야에 내재된 욕구가 있다는 의미예요.

━━━━━━━━━━━━━━━━━━━━━━━━━

🧠 당신의 심리적 특성

분석 결과, 당신은 ${mbtiTraits[0]} 특성이 있어요. 이는 ${data.mbti_scores.E > data.mbti_scores.I ? '타인과의 교류에서 에너지를 얻고, 활발한 소통을 즐기는' : '혼자만의 시간을 통해 에너지를 충전하고, 깊은 생각을 즐기는'} 분이라는 뜻이에요.

또한 ${mbtiTraits[1]} 경향도 보여요. ${data.mbti_scores.S > data.mbti_scores.N ? '현실적이고 구체적인 정보를 선호하며, 실용적인 것에 가치를 두는' : '추상적인 아이디어와 가능성을 탐구하며, 미래지향적인 사고를 하는'} 특성이죠.

${enneaTrait} 특성도 두드러져요. 이런 분들은 ${data.enneagram_type === 4 ? '자신만의 독특함을 중요시하고, 깊은 감정을 경험하는 것을 두려워하지 않아요' : data.enneagram_type === 9 ? '평화로운 환경을 만들고, 갈등을 피하며 조화를 추구해요' : '자신의 방식으로 세상과 소통하고 성장해요'}.

━━━━━━━━━━━━━━━━━━━━━━━━━

✨ 종합 해석

이 모든 특성이 조합되어 만들어진 당신은, "${characteristics[0] || '성장을 추구하는'}" 사람이에요.

당신의 강점은 ${topTCI[0]?.name || '깊이'}에요. ${topTCI[0]?.score || 0}점이라는 높은 점수는 이 영역에서 당신이 특별한 능력을 가지고 있다는 의미예요.

다른 사람들은 당신을 처음 만났을 때 ${data.mbti_scores.E > data.mbti_scores.I ? '따뜻하고 친근한' : '차분하고 신중한'} 인상을 받을 거예요. 하지만 시간이 지날수록 당신의 깊이와 진정성을 발견하게 되죠.

━━━━━━━━━━━━━━━━━━━━━━━━━

📝 왜 이 유형으로 진단했는지

• ${sortedCats[0]?.name || ''} ${sortedCats[0]?.percent || 0}% → ${characteristics[0] || '성장 추구'} 성향
• ${topTCI[0]?.name || ''} ${topTCI[0]?.score || 0}점 → 이 영역에서 뚜렷한 특성
• ${topTCI[1]?.name || ''} ${topTCI[1]?.score || 0}점 → 보완적 강점
• 구독 패턴과 심리 특성의 일관성 확인`,

    "4": `당신의 감성

"${t.RD >= 50 ? '마음을 나누며 힐링하는 사람' : '조용히 정리하며 힐링하는 사람'}"

━━━━━━━━━━━━━━━━━━━━━━━━━

🎧 감정 처리 방식

당신은 힘들 때 ${t.RD >= 50 ? '신뢰하는 사람과 이야기를 나누며' : '혼자만의 시간을 가지며'} 감정을 처리하는 편이에요.

${t.HA >= 50 ? '감정을 신중하게 다루고, 섣불리 표현하기보다 충분히 정리한 후에 나누는' : '감정에 솔직하고, 즉각적으로 표현하는'} 경향이 있어요.

이건 당신만의 자연스러운 방식이에요. ${t.RD >= 50 ? '다른 사람과의 연결을 통해 위로받는' : '자신만의 공간에서 에너지를 충전하는'} 것이 당신에게는 가장 효과적인 힐링 방법이거든요.

특히 음악이나 영상 콘텐츠가 당신의 감정 조절에 중요한 역할을 해요. 구독 리스트를 보면 ${sortedCats.find(c => c.id === 'musicMood')?.percent || 0}%가 음악/분위기 관련 채널이네요.

━━━━━━━━━━━━━━━━━━━━━━━━━

💡 당신만의 힐링 패턴

✓ ${t.HA >= 50 ? '힘들 때 먼저 혼자 정리하는 시간이 필요함' : '힘들 때 바로 누군가와 이야기하고 싶어함'}
✓ ${t.RD >= 50 ? '공감 받으면 크게 위로가 됨' : '조언보다 그냥 들어주는 게 더 좋음'}
✓ ${t.ST >= 50 ? '의미를 찾으며 상황을 이해하려 함' : '실용적인 해결책을 먼저 찾음'}
✓ ${sortedCats.find(c => c.id === 'musicMood') ? '음악이나 분위기로 감정을 조절함' : '활동이나 취미로 기분 전환함'}
✓ ${t.CO >= 50 ? '사랑하는 사람과 함께 있는 것만으로 힐링됨' : '혼자만의 취미 시간이 최고의 힐링'}

━━━━━━━━━━━━━━━━━━━━━━━━━

💚 이건 약점이 아니에요

${t.RD >= 50 ? '감정에 민감한' : '혼자 시간이 필요한'} 당신의 특성은 약점이 아니에요.

${t.RD >= 50 ? '오히려 깊은 공감 능력과 따뜻한 마음을 가졌다는 의미예요. 당신 덕분에 주변 사람들이 위로받고 있을 거예요.' : '오히려 자기 자신을 잘 돌볼 줄 안다는 의미예요. 충전된 에너지로 더 좋은 관계를 만들 수 있어요.'}

━━━━━━━━━━━━━━━━━━━━━━━━━

📝 근거

• 사회적민감성(RD) ${t.RD}점 → ${t.RD >= 50 ? '타인 감정에 민감' : '독립적 감정 처리'}
• 위험회피(HA) ${t.HA}점 → ${t.HA >= 50 ? '신중한 감정 표현' : '솔직한 감정 표현'}
• 음악/분위기 채널 ${sortedCats.find(c => c.id === 'musicMood')?.percent || 0}% → 분위기로 감정 조절`,

    "5": `당신이 꿈꾸는 미래

"${t.SD >= 50 ? '자유롭게 일하며 의미 있는 삶' : '안정적이고 따뜻한 일상'}"

━━━━━━━━━━━━━━━━━━━━━━━━━

📊 3축 분석

라이프스타일: ${t.HA >= 50 ? '●●●●○ 안정적' : '●●●○○ 유연함'}
커리어: ${t.SD >= 50 ? '●●●●● 자기주도적' : '●●●●○ 협력적'}
관계: ${t.CO >= 50 ? '●●●●○ 연결 중시' : '●●●○○ 독립적'}

━━━━━━━━━━━━━━━━━━━━━━━━━

🌙 미래의 어느 저녁

당신이 그리는 미래의 어느 저녁을 상상해볼게요.

${t.SD >= 50 && t.ST >= 50 ? `넓지 않아도 좋은, 작지만 아늑한 공간. 창밖으로는 해가 지는 풍경이 보이고, 당신은 오늘 하루 의미 있게 보낸 시간을 되돌아보고 있어요.

테이블 위에는 좋아하는 음료와 아직 다 읽지 못한 책이 놓여 있어요. 조용한 음악이 흐르고, 당신은 이 순간의 평화로움을 온전히 느끼고 있어요.

하지만 그 옆에는 함께 이 시간을 나눌 수 있는 사람이 있으면 더 좋겠죠. 말없이 각자의 시간을 보내다가도 눈이 마주치면 미소 짓는, 그런 편안한 관계.` :
t.CO >= 50 ? `따뜻한 조명 아래, 사랑하는 사람들과 함께하는 저녁 시간. 맛있는 음식과 함께 나누는 소소한 일상 이야기.

웃음소리가 끊이지 않고, 가끔은 진지한 대화도 나눠요. 이 순간의 연결감이 당신에게는 가장 큰 행복이에요.

특별한 것 없어도 좋아요. 함께 있다는 것 자체가 특별한 거니까.` :
`자유롭고 활기찬 분위기의 공간. 새로운 프로젝트에 대한 아이디어가 떠오르고, 당신은 그것을 메모하고 있어요.

내일은 또 어떤 새로운 일이 기다리고 있을까요? 그 기대감이 당신을 설레게 해요.

당신의 미래는 늘 새로운 가능성으로 가득 차 있어요.`}

━━━━━━━━━━━━━━━━━━━━━━━━━

✨ 심리 특성이 말해주는 욕구

자율성(SD) ${t.SD}점: ${t.SD >= 50 ? '스스로 결정하고 이끌어가는 삶을 원해요' : '안정적인 환경에서 협력하며 성장하고 싶어요'}
자기초월(ST) ${t.ST}점: ${t.ST >= 50 ? '삶의 의미와 깊이를 추구해요' : '현실적이고 구체적인 성취를 중요시해요'}
인내력(P) ${t.P}점: ${t.P >= 50 ? '장기적 목표를 향해 꾸준히 나아가요' : '유연하게 방향을 바꿀 줄 알아요'}

━━━━━━━━━━━━━━━━━━━━━━━━━

📝 근거

• 커리어/창업 채널 ${sortedCats.find(c => c.id === 'careerBusiness')?.percent || 0}% → 성취 욕구
• 라이프스타일 채널 ${sortedCats.find(c => c.id === 'lifestyleSpace')?.percent || 0}% → 공간/환경 관심
• 자율성 ${t.SD}점, 자기초월 ${t.ST}점 → 이런 미래상 형성`,

    "6": `당신이 가장 힘들어하는 상대방의 모습이에요

⚠️ "${t.ST >= 50 ? '피상적이고 깊이 없는 대화' : t.HA >= 50 ? '급작스럽고 예측 불가능한 변화' : '지나친 감정 표현'}"

━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 왜 이것이 힘든가요?

${t.ST >= 50 ? `당신은 깊이 있는 대화와 의미 있는 연결을 중요하게 여기는 분이에요.

그래서 "오늘 뭐 했어?" "별일 없어"로 끝나는 대화가 반복되면, 마음이 점점 멀어지는 걸 느끼시죠.

당신에게 대화는 단순한 정보 교환이 아니에요. 서로의 내면을 나누고, 더 깊이 알아가는 과정이거든요.` :
t.HA >= 50 ? `당신은 안정적이고 예측 가능한 환경을 선호하는 분이에요.

그래서 갑자기 계획이 바뀌거나, 예상치 못한 상황이 생기면 스트레스를 받으시죠.

이건 당신이 유연하지 못해서가 아니에요. 충분한 준비와 계획을 통해 최선의 결과를 내고 싶은 마음이 큰 거예요.` :
`당신은 독립적이고 자기 주관이 뚜렷한 분이에요.

그래서 상대방이 지나치게 감정에 호소하거나, 의존적인 모습을 보이면 부담을 느끼시죠.

이건 당신이 냉정해서가 아니에요. 서로의 영역을 존중하면서 성숙한 관계를 원하는 거예요.`}

━━━━━━━━━━━━━━━━━━━━━━━━━

📝 구체적 상황 예시

| 힘든 상황 | 당신의 내면 |
| ${t.ST >= 50 ? '"별일 없어"로 대화 마무리' : t.HA >= 50 ? '갑자기 약속 취소' : '매일 감정 토로'} | ${t.ST >= 50 ? '"더 알고 싶은데..."' : t.HA >= 50 ? '"미리 말해줬으면..."' : '"나도 쉬고 싶어..."'} |
| ${t.ST >= 50 ? '항상 같은 주제의 대화' : t.HA >= 50 ? '즉흥적인 계획 제안' : '의존적인 결정 요청'} | ${t.ST >= 50 ? '"더 깊이 나누고 싶어"' : t.HA >= 50 ? '"생각할 시간이 필요해"' : '"스스로 결정해봐"'} |
| ${t.ST >= 50 ? '관심사에 무관심' : t.HA >= 50 ? '약속 시간에 늦음' : '과한 애정 표현'} | ${t.ST >= 50 ? '"나를 이해하려 하지 않네"' : t.HA >= 50 ? '"존중받지 못하는 느낌"' : '"부담스러워..."'} |

━━━━━━━━━━━━━━━━━━━━━━━━━

💚 이건 약점이 아니에요

${t.ST >= 50 ? '깊이 있는 관계를 원하는 것' : t.HA >= 50 ? '안정을 추구하는 것' : '독립성을 중시하는 것'}은 당신의 강점이에요.

${t.ST >= 50 ? '피상적 관계에 만족하지 않고 진정한 연결을 추구하는 당신은, 결국 깊고 의미 있는 관계를 만들 수 있는 분이에요.' :
t.HA >= 50 ? '신중하게 판단하고 준비하는 당신은, 결국 더 좋은 결과를 만들어내는 분이에요.' :
'자기 자신을 잘 아는 당신은, 건강한 경계를 유지하며 성숙한 관계를 만들 수 있는 분이에요.'}

상대방에게 당신의 필요를 부드럽게 알려주세요. 좋은 관계는 서로의 차이를 이해하는 것에서 시작해요.

━━━━━━━━━━━━━━━━━━━━━━━━━

📝 근거

• ${topTCI[0]?.name || '상위 특성'} ${topTCI[0]?.score || 0}점 → 이 영역에서 민감함
• ${bottomTCI[0]?.name || '하위 특성'} ${bottomTCI[0]?.score || 0}점 → 반대 특성에 불편함`,

    "7": `당신의 왕자님은

"${h.variant === 'extrovert' ? h.metaphor_e : h.metaphor_i}"

━━━━━━━━━━━━━━━━━━━━━━━━━

📖 ${h.category} - ${h.subcategory}

이 유형은 ${h.description}

━━━━━━━━━━━━━━━━━━━━━━━━━

✨ 처음 만났을 때

처음 만났을 때 ${h.variant === 'extrovert' ? '따뜻하고 친근한 에너지가 느껴질 거예요. 대화를 이끌어가고, 당신을 편안하게 만들어주는 사람.' : '조용하지만 깊이 있는 인상을 받을 거예요. 말은 많지 않지만, 한마디 한마디에 무게감이 있는 사람.'}

대화를 나눌수록 "이 사람, ${h.variant === 'extrovert' ? '생각보다 깊은 면이 있구나' : '알수록 매력 있는 사람이구나'}"라는 걸 느끼게 될 거예요.

공통의 관심사를 발견했을 때의 반짝임, 서로의 가치관이 맞닿는 순간의 설렘... 그런 것들이 조금씩 쌓여갈 거예요.

━━━━━━━━━━━━━━━━━━━━━━━━━

💝 왜 이 유형인가요?

당신의 ${topTCI[0]?.name || '특성'}이 ${topTCI[0]?.score || 0}점으로 높아요. 이런 분에게는 ${h.variant === 'extrovert' ? '함께 성장하고 서로를 자극하는' : '깊이 이해하고 서로의 공간을 존중하는'} 파트너가 잘 맞아요.

${h.name}은 당신의 ${topTCI[0]?.name || '강점'}을 인정해주고, ${bottomTCI[0]?.name || '부족한 부분'}을 보완해줄 수 있는 유형이에요.

함께 있을 때 당신은 더 성장하고, 더 편안해지고, 더 당신다워질 수 있어요.

━━━━━━━━━━━━━━━━━━━━━━━━━

📝 근거

• 매칭 점수: ${scorePercent}%
• ${topTCI[0]?.name || ''} ${topTCI[0]?.score || 0}점 → 이 유형과 높은 상성
• 당신의 구독 패턴과 이 유형의 특성이 조화로움`,

    "8": `당신의 왕자님 프로필

━━━━━━━━━━━━━━━━━━━━━━━━━

📋 기본 정보

유형: ${h.name}
카테고리: ${h.category} - ${h.subcategory}
성향: ${h.variant === 'extrovert' ? '외향형' : '내향형'}
매칭 점수: ${scorePercent}%

━━━━━━━━━━━━━━━━━━━━━━━━━

💝 이런 분이에요

${h.description}

${h.variant === 'extrovert' ?
'활발하고 에너지가 넘치는 분이에요. 새로운 사람을 만나고, 새로운 경험을 하는 것을 좋아해요. 하지만 그 안에 깊이도 있어서, 진지한 대화도 충분히 나눌 수 있는 분이죠.' :
'조용하지만 내면이 풍부한 분이에요. 깊은 생각과 풍부한 감성을 가지고 있어요. 처음에는 다가가기 어려워 보일 수 있지만, 알면 알수록 매력이 있는 분이죠.'}

당신과 함께 있을 때 ${h.variant === 'extrovert' ? '더 활기차고 즐거운 시간을 만들어줄' : '깊고 의미 있는 시간을 나눌 수'} 있을 거예요.

━━━━━━━━━━━━━━━━━━━━━━━━━

🌙 함께하면 이런 모습이에요

【장면 1】 주말 오후
${h.variant === 'extrovert' ?
'새로운 카페나 맛집을 함께 탐험하며 즐거운 시간을 보내요. 서로의 발견에 신나하고, 사진도 찍고, 웃음이 끊이지 않는 시간.' :
'각자 좋아하는 책을 읽거나, 조용히 함께 있는 시간. 말없이도 편안한 공기가 흐르고, 가끔 눈을 마주치며 미소 짓는 순간.'}

【장면 2】 힘든 날
${h.variant === 'extrovert' ?
'당신의 기분을 금방 알아채고, 함께 맛있는 것을 먹으러 가자고 해요. 이야기를 들어주고, 웃게 만들어주고, 어느새 기분이 나아져 있어요.' :
'조용히 옆에 있어줘요. 굳이 말을 많이 하지 않아도, 그 존재만으로 위로가 돼요. "괜찮아"라는 말 한마디가 진심으로 느껴지는 사람.'}

【장면 3】 특별한 날
${h.variant === 'extrovert' ?
'깜짝 이벤트나 서프라이즈를 좋아해요. 당신을 위해 특별한 계획을 세우고, 함께 신나는 시간을 보내요.' :
'작지만 의미 있는 선물이나 편지를 준비해요. 화려하진 않지만, 진심이 담긴 표현이 당신의 마음을 따뜻하게 해요.'}

━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ 알아두세요

${h.variant === 'extrovert' ?
'이 유형은 혼자만의 시간보다 함께하는 시간을 선호해요. 당신이 개인 시간이 필요할 때는 부드럽게 표현해주세요. 이해해줄 거예요.' :
'이 유형은 자기만의 시간과 공간이 필요해요. 혼자 있고 싶어 한다고 해서 당신에게 관심이 없는 게 아니에요. 충전 후에 더 좋은 모습으로 돌아올 거예요.'}

또한 ${h.variant === 'extrovert' ? '표현이 직접적이라 때로는 과하게 느껴질 수 있어요' : '표현이 서툴러서 오해가 생길 수 있어요'}. 서로의 사랑 언어를 이해하는 게 중요해요.`,

    "9": `여기까지가 무료 분석이에요.

당신의 구독 채널 ${data.channelCount}개를 분석해 9장의 카드로 당신의 내면을 들여다보았어요.

━━━━━━━━━━━━━━━━━━━━━━━━━

🔮 Phase 2에서 알 수 있는 것

더 깊은 이야기가 기다리고 있어요.

✦ 애인이 생각하는 당신
  → "조용한 바다 같은 사람 — 깊이를..." [블러 처리]

✦ 당신이 결혼을 확신하게 되는 순간
  → "당신에게 결혼의 확신은..." [블러 처리]

✦ 연애에서 결혼으로 못 가는 진짜 이유
  → "반복되는 패턴이..." [블러 처리]

✦ 만약 이혼한다면, 그 이유는...
  → "위험 요인 분석 결과..." [블러 처리]

━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Phase 2 진행 방식

1. 9개의 심층 질문에 답변
2. YouTube 데이터와 교차 검증
3. 8장의 심층 리포트 카드 제공

━━━━━━━━━━━━━━━━━━━━━━━━━

[ 💎 심층 분석 시작하기 — ₩4,900 ]

━━━━━━━━━━━━━━━━━━━━━━━━━

* 분석 결과는 심리학적 연구를 기반으로 하지만,
  실제 심리 검사를 대체하지 않습니다.
* 재미와 자기 이해를 위한 콘텐츠로 즐겨주세요.`,
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
    if (!cardContents || Object.keys(cardContents).length < 9) {
      console.log('[Phase 1] Incomplete AI response, using fallback');
      cardContents = generateFallbackCards(cardData);
    }
  } catch (err) {
    console.error('[Phase 1] Card generation failed, using fallback:', err);
    cardContents = generateFallbackCards(cardData);
  }

  // 9장 카드 생성
  const cards: ReportCard[] = [];
  for (let cardNumber = 1; cardNumber <= 9; cardNumber++) {
    const meta = CARD_TITLES[cardNumber];
    const cardKey = String(cardNumber);
    // 카드 1은 항상 고정 텍스트 사용
    const content = cardNumber === 1
      ? CARD_1_FIXED_CONTENT
      : (cardContents[cardKey] || '분석 결과를 불러오는 중 문제가 발생했습니다.');
    cards.push({
      card_number: cardNumber,
      title: meta.title,
      subtitle: meta.subtitle,
      content: String(content).slice(0, 5000), // 분량 증가로 max 5000자
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
