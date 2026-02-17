import type { SupabaseClient } from '@supabase/supabase-js';
import { categorizeChannels } from '@/lib/husband-match/analysis/categorize-channels';
import { calculateTCI } from '@/lib/husband-match/analysis/calculate-tci';
import { estimateEnneagram } from '@/lib/husband-match/analysis/estimate-enneagram';
import { estimateMBTI } from '@/lib/husband-match/analysis/estimate-mbti';
import { createVector } from '@/lib/husband-match/analysis/create-vector';
import { matchHusbandType } from '@/lib/husband-match/analysis/match-husband-type';
import { calculateSaju, getSajuRelationshipInsights, type BirthInfo, type SajuResult } from '@/lib/husband-match/analysis/saju-calculator';
import {
  runYouTubeAnalysis,
  generateBarChart,
} from '@/lib/husband-match/analysis/youtube-analysis';
import { chatCompletion, safeJsonParse } from '@/lib/gemini-client';
import { SYSTEM_PROMPT } from '@/lib/husband-match/prompts/system-prompt';
import type { Phase1CardData } from '@/lib/husband-match/prompts/card-prompts';
import {
  ENNEAGRAM_NAMES,
  TCI_NAMES,
  getSortedCategories,
  getTopTCIScores,
  getBottomTCIScores,
  getTCICharacteristics,
} from '@/lib/husband-match/prompts/card-prompts';
import type { ReportCard, ChannelData, ChannelCategories, TCIScores, BirthInfo as TypesBirthInfo } from '@/lib/husband-match/types';
import type { YouTubeCategoryResult, RarityAnalysis, YouTubeTCIScores } from '@/lib/husband-match/data/youtube-categories';
import { YOUTUBE_CATEGORY_NAMES, YOUTUBE_AVERAGE_RATIOS } from '@/lib/husband-match/data/youtube-categories';

// 카드 1 고정 텍스트 (항상 동일한 내용)
const CARD_1_FIXED_CONTENT = `새벽 두 시, 아무도 모르게 재생한 그 영상. 습관처럼 누른 구독 버튼, 알고리즘이 슬쩍 건넨 추천 한 줄.

거기엔 당신도 의식하지 못한 욕구와 결핍, 끌림의 방향이 고스란히 기록되어 있습니다.

유튜브는 생각보다 사적인 공간입니다. 타인 앞에서는 쉽게 포장하지만, 혼자 보는 화면 앞에서만큼은 누구나 꽤 정직해지니까요.

지금부터 당신의 구독 채널과 시청 패턴을 찬찬히 들여다보겠습니다. 그 안에서 당신의 성격 구조와 관계 욕구를 읽어내고, 평생의 동반자가 될 사람의 유형과 구체적인 프로필, 그리고 절대 참을 수 없는 상대의 단점까지 짚어드리겠습니다.

준비되셨다면, 시작합니다.`;

// 카드 9 고정 텍스트 (CTA — LLM이 가격/블러 힌트를 누락하므로 고정)
function getCard9FixedContent(channelCount: number): string {
  return `여기까지가 무료 분석이에요.

당신의 구독 채널 ${channelCount}개를 분석해 9장의 카드로 당신의 내면을 들여다보았어요.


**Phase 2에서 알 수 있는 것**

더 깊은 이야기가 기다리고 있어요.

✦ 애인이 생각하는 당신
  → "조용한 바다 같은 사람 — 깊이를..." [블러 처리]

✦ 당신이 결혼을 확신하게 되는 순간
  → "당신에게 결혼의 확신은..." [블러 처리]

✦ 연애에서 결혼으로 못 가는 진짜 이유
  → "반복되는 패턴이..." [블러 처리]

✦ 만약 이혼한다면, 그 이유는...
  → "위험 요인 분석 결과..." [블러 처리]


**Phase 2 진행 방식**

1. 9개의 심층 질문에 답변
2. YouTube 데이터와 교차 검증
3. 8장의 심층 리포트 카드 제공


**[ 심층 분석 시작하기 — ₩9,900 ]**


* 분석 결과는 심리학적 연구를 기반으로 하지만,
  실제 심리 검사를 대체하지 않습니다.
* 재미와 자기 이해를 위한 콘텐츠로 즐겨주세요.`;
}

// 9장 카드 타이틀
const CARD_TITLES: Record<number, { title: string; subtitle?: string; card_type: ReportCard['card_type'] }> = {
  1: { title: '당신이 몰래 본 영상이, 당신을 말하고 있다', subtitle: 'INTRO', card_type: 'intro' },
  2: { title: '', subtitle: '구독 데이터 개요', card_type: 'intro' },
  3: { title: '', subtitle: '', card_type: 'personality' },
  4: { title: '당신은 스트레스를 받으면 이렇게 행동해요', subtitle: '스트레스 반응', card_type: 'personality' },
  5: { title: '추구하는 미래', subtitle: '미래상', card_type: 'values' },
  6: { title: '견디기 힘든 상대방의 단점', subtitle: '관계 인사이트', card_type: 'values' },
  7: { title: '당신의 완벽한 파트너', subtitle: '매칭 결과', card_type: 'matching' },
  8: { title: '파트너 상세 프로필', subtitle: '파트너 프로필', card_type: 'matching' },
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

// MBTI 특성 텍스트 생성
function getMBTITraits(scores: Phase1CardData['mbti_scores']): string[] {
  const traits: string[] = [];
  traits.push(scores.E > scores.I ? '사람들과의 교류에서 에너지를 얻는' : '혼자만의 시간에서 에너지를 충전하는');
  traits.push(scores.S > scores.N ? '현실적이고 구체적인 것을 선호하는' : '가능성과 아이디어를 탐구하는 것을 좋아하는');
  traits.push(scores.T > scores.F ? '논리적이고 객관적인 판단을 중시하는' : '사람과 가치를 중심으로 결정하는');
  traits.push(scores.J > scores.P ? '계획적이고 체계적인 것을 선호하는' : '유연하고 즉흥적인 것을 즐기는');
  return traits;
}

// 애니어그램 특성 텍스트
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

// Extended card data with YouTube analysis
interface ExtendedCardData extends Phase1CardData {
  youtubeCategories: YouTubeCategoryResult[];
  rarity: RarityAnalysis;
  youtubeTCI: YouTubeTCIScores;
  topBottom: {
    top1: { axis: string; score: number; name: string };
    top2: { axis: string; score: number; name: string };
    bottom: { axis: string; score: number; name: string };
  };
  sajuResult?: SajuResult;
  birthInfo?: BirthInfo;
}

// 카드 2 전용 컨텍스트 — 채널명, TCI 점수, 카테고리 포함
function buildCard2Context(data: ExtendedCardData): string {
  const ennea = data.enneagram_type ?? 9;
  const enneaName = ENNEAGRAM_NAMES[ennea];
  const h = data.matched_husband;
  const scorePercent = Math.round(data.match_score * 100);
  const mbtiTraits = getMBTITraits(data.mbti_scores);
  const ytCats = data.youtubeCategories;
  const rarity = data.rarity;
  const topBottom = data.topBottom;
  const tci = data.youtubeTCI;

  const nameLabel = data.userName ? `${data.userName}님` : '당신';

  let context = `## 분석 데이터
${data.userName ? `\n- 사용자 이름: ${data.userName}` : ''}

### 구독 채널 정보
- 총 채널 수: ${data.channelCount}개
- YouTube 카테고리 분포:
${ytCats.map(c => `  · ${c.name}: ${c.count}개 (${c.percent}%)`).join('\n')}

### 카테고리별 채널 목록
${ytCats.map(c => `  · ${c.name}: ${c.channels.join(', ')}`).join('\n')}

### 희소성 분석
- 상위 ${rarity.percentile}% (코사인 유사도: ${rarity.cosineSimilarity.toFixed(2)})
- 가장 희귀한 카테고리: ${rarity.rarestCategoryName} (사용자 비율 ${rarity.rarestCategoryPercent}%)
- 해당 채널: ${rarity.rarestCategoryChannels.join(', ')}

### 심리 분석 6축 (정규화 0-100점)
- 1위: ${topBottom.top1.name} ${topBottom.top1.score}점
- 2위: ${topBottom.top2.name} ${topBottom.top2.score}점
- 최저: ${topBottom.bottom.name} ${topBottom.bottom.score}점
- 전체: 자기초월(ST)=${tci.ST}, 자율성(SD)=${tci.SD}, 자극추구(NS)=${tci.NS}, 위험회피(HA)=${tci.HA}, 인내력(P)=${tci.P}, 연대감(CO)=${tci.CO}

### 성격 유형
- 애니어그램: ${ennea}번 (${enneaName})
- MBTI: ${data.mbti_type}
- MBTI 특성: ${mbtiTraits.join(', ')}

### 매칭된 파트너 유형
- 유형명: ${h.name}
- 카테고리: ${h.category} > ${h.subcategory}
- 성향: ${h.variant === 'extrovert' ? '외향형' : '내향형'}
- 성격 설명: ${h.description}
- 비유(외향): ${h.metaphor_e || '없음'}
- 비유(내향): ${h.metaphor_i || '없음'}
- 매칭 점수: ${scorePercent}%`;

  // 사주 분석 (있을 때만)
  if (data.sajuResult) {
    const s = data.sajuResult;
    context += `

### 사주 분석
- 사주: ${s.fourPillars.year} ${s.fourPillars.month} ${s.fourPillars.day} ${s.fourPillars.hour || '(시간 미입력)'}
- 일간: ${s.dayMaster} (${s.dayMasterElement})
- 오행 분포: 목=${s.fiveElements.wood} 화=${s.fiveElements.fire} 토=${s.fiveElements.earth} 금=${s.fiveElements.metal} 수=${s.fiveElements.water}
- 주요 오행: ${s.dominantElement} / 부족 오행: ${s.weakElement}
- 일간 성격: ${s.personality}`;
  }

  context += `

### 작성 톤 가이드라인
- 이 카드에서는 채널명, TCI 점수, 카테고리를 적극 인용하세요.
- MBTI 유형명(INFP 등), 애니어그램 번호(4번 유형 등)를 직접 언급하지 마세요.
- "왕자님" 대신 "완벽한 파트너"를 사용하세요.
${data.userName ? `- 사용자 이름이 "${data.userName}"이므로 제목과 본문 첫 문장에 "${data.userName}님" 형태로 1회 사용하고, 이후 "당신"으로 전환하세요.` : ''}`;

  return context;
}

// 카드 3-8 전용 컨텍스트 — 채널명 제거, 사주 심화 인사이트 추가
function buildPersonalityContext(data: ExtendedCardData): string {
  const h = data.matched_husband;
  const scorePercent = Math.round(data.match_score * 100);
  const mbtiTraits = getMBTITraits(data.mbti_scores);
  const ytCats = data.youtubeCategories;
  const rarity = data.rarity;
  const topBottom = data.topBottom;

  // 사주 심화 인사이트 (있을 때만)
  const sajuInsights = data.sajuResult ? getSajuRelationshipInsights(data.sajuResult, data.birthInfo) : '';

  return `## 이 사람의 분석 결과
${data.userName ? `\n- 사용자 이름: ${data.userName}` : ''}

### 성격 구조 (구독 패턴에서 도출)
- 가장 강한 특성: ${topBottom.top1.name} — 이 영역에 대한 욕구가 매우 강함
- 두 번째 특성: ${topBottom.top2.name} — 삶의 방향을 주도하는 힘
- 가장 약한 특성: ${topBottom.bottom.name} — 이 영역에 대한 두려움이 적거나, 결핍을 느끼는 영역
- 관심 분포: ${ytCats.map(c => `${c.name}(${c.percent}%)`).join(' > ')}
- 취향 희소성: 상위 ${rarity.percentile}% (매우 독특한 관심사 조합)

### 행동 특성
- ${mbtiTraits.join('\n- ')}

${sajuInsights}

### 매칭된 파트너 유형
- 유형명: ${h.name}
- 카테고리: ${h.category} > ${h.subcategory}
- 성향: ${h.variant === 'extrovert' ? '외향형' : '내향형'}
- 성격 설명: ${h.description}
- 비유: ${h.variant === 'extrovert' ? (h.metaphor_e || '') : (h.metaphor_i || '')}
- 매칭 점수: ${scorePercent}%

### ⚠️ 절대 금지 (카드 3~8 공통)
- 유튜브 채널명 언급 금지 (카드 2에서 이미 다룸)
- 사주 용어 금지 (화, 토, 목, 금, 수, 오행, 일간, 사주, 천간, 지지, 상생, 상극 등)
- 별자리 용어 금지 (양자리, 황소자리 등 12별자리명, "별자리", "zodiac", "성좌" 등)
- TCI 점수(숫자) 직접 언급 금지
- MBTI 유형명, 애니어그램 번호 금지
- "왕자님" 대신 "완벽한 파트너" 사용
- 이전 카드 내용 반복 금지
${data.userName ? `- 사용자 이름이 "${data.userName}"이므로 본문 첫 문장에 "${data.userName}님은" 형태로 1회 사용하고, 이후 "당신"으로 전환하세요.` : ''}`;
}

// ─────────────────────────────────────────────────────────────
// 4배치 카드 생성 (max_tokens 16384)
// ─────────────────────────────────────────────────────────────

const LLM_OPTIONS = { model: 'gpt-4o-mini', temperature: 0.7, max_tokens: 16384, response_format: { type: 'json_object' as const } };

// 배치 A: 카드 2 (구독 개요 + 희소성 통합) — contextCard2 사용
async function generateBatchA(data: ExtendedCardData, context: string): Promise<Record<string, string>> {
  const ytCats = data.youtubeCategories;
  const rarity = data.rarity;
  const topBottom = data.topBottom;

  const prompt = `아래 분석 데이터를 바탕으로 리포트 카드 내용을 JSON으로 생성해주세요.

## ⚠️ 필수: 2,000자 이상 2,500자 이하로 작성하세요.

${context}

## 카드 2: 구독 데이터 개요 + 희소성 분석
- "2_title": ${data.userName ? `"${data.userName}님은 ..."으로 시작하는` : '사용자의'} 구독 패턴을 한 줄로 요약하는 마케팅 카피
- "2": 본문 (2000-2500자) — 아래 구조를 반드시 포함:
  1) **"당신의 구독 리스트가 말해주는 것"** — 총 채널 수, 카테고리 수, 상위 3개 카테고리와 대표 채널명 분석
  2) **"육각형 밸런스에서 드러난 당신의 특성"** — 6축 점수를 각각 한 줄씩 설명 (점수 인용 필수, 이 카드에서만 점수를 상세히 씀)
  3) **"가장 두드러진 축: {1위 축명} ({점수}점)"** — 왜 이 축이 높은지 구독 카테고리/채널과 연결하여 자연스럽게 설명
  4) **"당신의 취향은 상위 ${rarity.percentile}%"** — 코사인 유사도 기반 희소성 해석, 가장 희귀한 카테고리 "${rarity.rarestCategoryName}" 소개, 해당 채널 ${rarity.rarestCategoryChannels.join(', ')} 언급. 이 취향이 말해주는 당신의 심리 2-3문장.

## 응답 형식 (JSON만)
{
  "2_title": "타이틀 문자열",
  "2": "본문 2000자 이상"
}`;

  const response = await chatCompletion(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    LLM_OPTIONS
  );
  return safeJsonParse(response ?? '{}');
}

// 배치 B1: 카드 3 — "당신은 누구인가" (핵심 정체성) — contextPersonality 사용
async function generateBatchB1(data: ExtendedCardData, context: string): Promise<Record<string, string>> {
  const topBottom = data.topBottom;

  const prompt = `아래 분석 데이터를 바탕으로 리포트 카드 내용을 JSON으로 생성해주세요.

## ⚠️ 필수: 1,800자 이상 2,500자 이하로 작성하세요.
## ⚠️ 유튜브 채널명을 절대 쓰지 마세요. 사주 용어(화, 토, 오행 등)를 절대 쓰지 마세요. TCI 점수(숫자)를 절대 쓰지 마세요.
## ⚠️ "소름 끼칠 정도로 정확한" 분석을 목표로 합니다. 일반적 칭찬이 아닌, 이 사람만의 구체적 행동과 내면 묘사를 하세요.

${context}

## 카드 3: 당신은 누구인가 — 핵심 정체성
이 카드는 "근본 정체성"과 "내면의 모순"에 집중합니다.

- "3_subtitle": 영어 타입명 3-5단어 (예: "Quiet Storm, Steady Ground")
- "3_title": "${data.userName ? `${data.userName}님은` : '당신은'} {한국어 한 줄 정의} 타입이에요"
  · ${topBottom.top1.name}(1위)과 ${topBottom.top2.name}(2위) 조합 기반
- "3": 본문 (1800-2500자) — 아래 구조를 반드시 포함:
  1) **해시태그 3개**
  2) **"당신의 근본 성격"** — 3문단. 겉으로 보이는 모습과 속마음의 차이. 구체적 장면 최소 2개.
  3) **"아무도 모르는 당신의 습관"** — 불릿 3개. 시간대, 장소, 행동을 특정.
  4) **"내면의 모순"** — 2문단. "~하고 싶으면서도 ~도 원하는" 형태의 갈등.
  5) **"관계에서의 당신"** — 2문단. 연애에서 구체적으로 어떤 패턴이 나타나는지.

## 응답 형식 (JSON만)
{
  "3_subtitle": "English Type Name",
  "3_title": "${data.userName ? `${data.userName}님은` : '당신은'} {타입} 타입이에요",
  "3": "본문 1800자 이상"
}`;

  const response = await chatCompletion(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    LLM_OPTIONS
  );
  return safeJsonParse(response ?? '{}');
}

// 배치 B2: 카드 4 — "한계를 넘는 순간" (스트레스 반응) — contextPersonality 사용
async function generateBatchB2(data: ExtendedCardData, context: string): Promise<Record<string, string>> {
  const prompt = `아래 분석 데이터를 바탕으로 리포트 카드 내용을 JSON으로 생성해주세요.

## ⚠️ 필수: 1,800자 이상 2,500자 이하로 작성하세요.
## ⚠️ 유튜브 채널명 금지. 사주 용어 금지. TCI 점수 금지.
## ⚠️ 카드 3에서 이미 "근본 성격"과 "내면의 모순"을 다뤘습니다. "스트레스 반응"과 "감정 표현 패턴"에만 집중하세요.
## ⚠️ "따뜻한", "포용력", "깊은 연결" 같은 표현을 사용하지 마세요.

${context}

## 카드 4: 한계를 넘는 순간 — 스트레스 반응

- "4": 본문 (1800-2500자) — 아래 구조를 반드시 포함:
  1) **한 줄 정의** — 스트레스 반응 핵심
  2) **"당신이 화가 나면"** — 3문단. 감정 억제 → 행동 변화 → 폭발 패턴. 구체적 행동 3가지.
  3) **"이런 상황에서 한계가 온다"** — 불릿 3개. 트리거 상황을 매우 구체적으로.
  4) **"당신만의 회복법"** — ✓ 체크리스트 5개. 행동 묘사만 (채널명 없음).
  5) **"리프레이밍"** — 1-2문단. 이 스트레스 반응이 강점인 이유.

## 응답 형식 (JSON만)
{
  "4": "본문 1800자 이상"
}`;

  const response = await chatCompletion(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    LLM_OPTIONS
  );
  return safeJsonParse(response ?? '{}');
}

// 배치 C: 카드 5 + 6 — contextPersonality 사용
async function generateBatchC(data: ExtendedCardData, context: string): Promise<Record<string, string>> {
  const prompt = `아래 분석 데이터를 바탕으로 2개의 리포트 카드 내용을 JSON으로 생성해주세요.

## ⚠️ 필수: 각 카드는 반드시 1,800자 이상 2,500자 이하로 작성하세요.
## ⚠️ 유튜브 채널명 금지. 사주 용어 금지. TCI 점수 금지.
## ⚠️ 카드 3에서 "근본 성격/내면의 모순"을, 카드 4에서 "스트레스 반응/감정 표현"을 이미 다뤘습니다. 같은 내용을 반복하지 마세요.
## ⚠️ "따뜻한", "포용력", "깊은 연결", "든든한" 같은 이전 카드에서 쓴 표현을 피하세요.

${context}

## 카드 5: 시간의 흐름 — 과거, 현재, 미래의 당신 (1800-2500자)
- "5": 아래 구조를 반드시 포함:
  1) **미래상 한 줄 정의**
  2) **"과거의 당신"** — 2문단. 어린 시절, 학창 시절에 이런 성격이 어떻게 나타났을지. 구체적 장면.
  3) **"지금의 당신"** — 2문단. 안정과 모험 사이의 줄타기. 현재 고민.
  4) **"앞으로의 당신"** — 2-3문단. 구체적 장면 3개 (5년 후, 10년 후, 이상적인 하루).

## 카드 6: 관계 지뢰 — 도저히 참을 수 없는 단점 (1800-2500자)
- "6": 아래 구조를 반드시 포함:
  1) **한 줄 요약** — "당신은 ○○한 사람을 만나면 숨이 막힙니다"
  2) **"이런 사람 만나면 도망치고 싶다"** — 불릿 3개. 구체적 행동 묘사.
  3) **"실제로 이런 일이 있었을 거예요"** — 2개의 과거 경험 추측. 매우 구체적 장면.
  4) **"하지만 이것이 당신의 강점"** — 1-2문단. 리프레이밍.

## 응답 형식 (JSON만)
{
  "5": "본문 1800자 이상",
  "6": "본문 1800자 이상"
}`;

  const response = await chatCompletion(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    LLM_OPTIONS
  );
  return safeJsonParse(response ?? '{}');
}

// 배치 D: 카드 7 + 8 — contextPersonality 사용
async function generateBatchD(data: ExtendedCardData, context: string): Promise<Record<string, string>> {
  const h = data.matched_husband;
  const scorePercent = Math.round(data.match_score * 100);

  const prompt = `아래 분석 데이터를 바탕으로 2개의 리포트 카드 내용을 JSON으로 생성해주세요.

## ⚠️ 필수: 각 카드는 반드시 1,800자 이상 2,500자 이하로 작성하세요.
## ⚠️ "왕자님" 대신 반드시 "완벽한 파트너"를 사용하세요.
## ⚠️ 유튜브 채널명 금지. 사주 용어 금지. TCI 점수 금지.
## ⚠️ 카드 3-6에서 이미 다룬 성격 특성을 재설명하지 마세요. "파트너"에 대해서만 이야기합니다.
## ⚠️ "따뜻한", "포용력", "깊은 연결", "든든한", "안정감" 등 이전 카드에서 반복된 표현을 피하세요.

${context}

## 카드 7: 당신의 완벽한 파트너 — 왜 이 사람인가 (1800-2500자)
- "7": 아래 구조를 반드시 포함:
  1) **비유 문구** — "${h.variant === 'extrovert' ? (h.metaphor_e || '') : (h.metaphor_i || '')}" 활용
  2) **유형 소개** — "${h.category} - ${h.subcategory}". "${h.description}" 기반 1문단.
  3) **"처음 만난 날"** — 영화의 한 장면처럼 묘사 (3문단). 오감 동원.
  4) **"왜 하필 이 사람인가"** — 2문단. 당신이 서투른 영역을 이 사람이 어떻게 보완하는지.

## 카드 8: 파트너와의 일상 — 함께하는 삶 (1800-2500자)
- "8": 아래 구조를 반드시 포함:
  1) **"기본 정보"** — 유형명: ${h.name}, 카테고리: ${h.category} > ${h.subcategory}, 성향: ${h.variant === 'extrovert' ? '외향형' : '내향형'}, 매칭 점수: ${scorePercent}%
  2) **"이런 분이에요"** — 2문단 (카드 7에서 안 다룬 새로운 측면만)
  3) **3개 장면** — 매우 구체적으로 (대화 포함):
     · **【장면 1】 주말 오후**
     · **【장면 2】 싸운 날** — 갈등 후 화해 과정
     · **【장면 3】 10년 후**
  4) **"이 사람과 잘 지내려면"** — 구체적 팁 3개 (불릿).

## 응답 형식 (JSON만)
{
  "7": "본문 1800자 이상",
  "8": "본문 1800자 이상"
}`;

  const response = await chatCompletion(
    [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }],
    LLM_OPTIONS
  );
  return safeJsonParse(response ?? '{}');
}

/** 재시도 래퍼 — 실패 시 최대 maxRetries번 재시도 (간격 1초) */
async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries = 2
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      if (attempt > 0) console.log(`[Phase 1] ${label} 재시도 ${attempt}회 만에 성공`);
      return result;
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxRetries) {
        console.warn(`[Phase 1] ${label} 실패 (시도 ${attempt + 1}/${maxRetries + 1}): ${lastError.message} → 재시도...`);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  console.error(`[Phase 1] ${label} 최종 실패:`, lastError?.message);
  return {} as T;
}

// 5배치 병렬 호출로 카드 콘텐츠 생성 (각 배치 재시도 포함)
async function generateAllCardsAtOnce(data: ExtendedCardData): Promise<Record<string, string>> {
  const card2Ctx = buildCard2Context(data);
  const personalityCtx = buildPersonalityContext(data);

  const [batchA, batchB1, batchB2, batchC, batchD] = await Promise.all([
    withRetry(() => generateBatchA(data, card2Ctx), 'Batch A (card 2)'),
    withRetry(() => generateBatchB1(data, personalityCtx), 'Batch B1 (card 3)'),
    withRetry(() => generateBatchB2(data, personalityCtx), 'Batch B2 (card 4)'),
    withRetry(() => generateBatchC(data, personalityCtx), 'Batch C (cards 5-6)'),
    withRetry(() => generateBatchD(data, personalityCtx), 'Batch D (cards 7-8)'),
  ]);

  return { ...batchA, ...batchB1, ...batchB2, ...batchC, ...batchD };
}

// 폴백: 템플릿 기반 카드 생성 (9장)
function generateFallbackCards(data: ExtendedCardData): Record<string, string> {
  const t = data.tci_scores;
  const h = data.matched_husband;
  const scorePercent = Math.round(data.match_score * 100);
  const topTCI = getTopTCIScores(t, 3);
  const bottomTCI = getBottomTCIScores(t, 2);
  const sortedCats = getSortedCategories(data.channel_categories);
  const characteristics = getTCICharacteristics(t);
  const mbtiTraits = getMBTITraits(data.mbti_scores);
  const enneaTrait = getEnneagramTrait(data.enneagram_type ?? 9);

  // YouTube 분석 데이터
  const ytCats = data.youtubeCategories;
  const rarity = data.rarity;
  const topBottom = data.topBottom;
  const ytTCI = data.youtubeTCI;

  // 타입명 생성
  const typeNameMap: Record<string, Record<string, string>> = {
    'NS': { 'CO': '거침없는 사교형 탐험가', 'SD': '자유로운 개척자', 'ST': '호기심 많은 지식 탐험가' },
    'ST': { 'SD': '고독한 지적 방랑자', 'CO': '따뜻한 철학자', 'NS': '호기심 많은 지식 탐험가' },
    'SD': { 'ST': '독립적인 사색가', 'NS': '자유로운 개척자', 'CO': '균형 잡힌 리더' },
    'CO': { 'NS': '활발한 연결자', 'ST': '따뜻한 철학자', 'SD': '균형 잡힌 리더' },
    'P': { 'HA': '묵묵한 안정 추구자', 'SD': '끈기 있는 성취자', 'CO': '헌신적인 돌봄이' },
    'HA': { 'P': '신중한 계획가', 'CO': '안전한 품', 'ST': '조심스러운 탐구자' },
  };
  const typeName = typeNameMap[topBottom.top1.axis]?.[topBottom.top2.axis] || '균형 잡힌 탐험가';
  const englishType = `${topBottom.top1.name.replace(/[가-힣]/g, '')} ${topBottom.top2.name.replace(/[가-힣]/g, '')} Type`;

  return {
    "1": CARD_1_FIXED_CONTENT,

    "2_title": `${data.userName ? `${data.userName}님은` : '당신은'} ${ytCats[0]?.name || '다양한 경험'}을 통해 세상을 탐험하는 취향을 지니셨군요`,

    "2": `**당신의 구독 리스트가 말해주는 것**

총 ${data.channelCount}개의 채널을 분석한 결과, ${ytCats.length}개의 서로 다른 카테고리에 관심을 가지고 계신 것으로 나타났어요. 이 숫자가 의미하는 바가 있습니다.

가장 많은 비중을 차지하는 분야는 "${ytCats[0]?.name || '다양함'}"으로, 전체의 ${ytCats[0]?.percent || 0}%를 차지하고 있어요.${ytCats[0]?.channels?.[0] ? ` 대표적으로 ${ytCats[0].channels.slice(0, 2).join(', ')} 같은 채널이 여기 속해요.` : ''} 두 번째는 "${ytCats[1]?.name || '기타'}"(${ytCats[1]?.percent || 0}%), 세 번째는 "${ytCats[2]?.name || '기타'}"(${ytCats[2]?.percent || 0}%)입니다.

이 조합은 단순히 "이런 영상을 좋아한다"는 것을 넘어, 당신이 무의식적으로 추구하는 가치와 욕구를 보여줍니다. 구독 버튼은 생각보다 정직하거든요.


**육각형 밸런스에서 드러난 당신의 특성**

저희는 당신의 구독 데이터를 6가지 심리적 축으로 분석해보았어요:

• 자기초월: ${ytTCI.ST}점 - 삶의 의미와 깊이를 추구하는 정도
• 자율성: ${ytTCI.SD}점 - 스스로 결정하고 이끌어가려는 성향
• 자극추구: ${ytTCI.NS}점 - 새로운 경험과 자극에 대한 욕구
• 위험회피: ${ytTCI.HA}점 - 안전과 안정을 추구하는 정도
• 인내력: ${ytTCI.P}점 - 목표를 향해 꾸준히 나아가는 힘
• 연대감: ${ytTCI.CO}점 - 타인과의 연결을 중시하는 정도


**가장 두드러진 축: ${topBottom.top1.name} (${topBottom.top1.score}점)**

당신에게서 가장 강하게 나타나는 특성은 "${topBottom.top1.name}"이에요. 이 특성이 ${ytCats[0]?.name || '주요 카테고리'} 채널을 ${ytCats[0]?.percent || 0}%나 구독하게 만든 이유이기도 해요.

두 번째로 높은 "${topBottom.top2.name}"(${topBottom.top2.score}점)과 함께 시너지를 만들어내요. 이 조합은 흔하지 않아요.


**당신의 취향은 상위 ${rarity.percentile}%**

코사인 유사도 분석 결과, 당신의 구독 패턴은 평균에서 ${rarity.cosineSimilarity < 0.7 ? '상당히' : rarity.cosineSimilarity < 0.85 ? '꽤' : '다소'} 벗어나 있어요. 가장 눈에 띄는 건 "${rarity.rarestCategoryName}" 카테고리예요. ${rarity.rarestCategoryChannels.join(', ')} 같은 채널을 구독하는 사용자는 많지 않거든요.

이 희귀한 취향은 당신이 대중적인 콘텐츠에 만족하지 않고 자신만의 관심사를 깊이 파고드는 사람이라는 뜻이에요. 이런 독특한 구독 패턴이 당신만의 시그니처를 만들어내고 있어요.`,

    "3_subtitle": englishType.replace(/\s+/g, ' ').trim() || "Balanced Explorer Type",

    "3_title": `${data.userName ? `${data.userName}님은` : '당신은'} ${typeName} 타입이에요`,

    "3": `#${topBottom.top1.name} #${topBottom.top2.name} #자기이해


**당신의 핵심 특성**

당신의 구독 리스트를 분석한 결과, "${topBottom.top1.name}"과 "${topBottom.top2.name}"이 가장 두드러지는 특성으로 나타났어요.

당신이 구독한 ${ytCats[0]?.channels?.[0] || ytCats[0]?.name || '주요'} 같은 채널들은 ${
topBottom.top1.axis === 'NS' ? '새로운 경험과 자극을 추구하고, 변화를 즐기며, 호기심이 넘치는' :
topBottom.top1.axis === 'ST' ? '삶의 의미와 깊이를 추구하고, 영적이거나 철학적인 사고를 즐기는' :
topBottom.top1.axis === 'SD' ? '스스로 결정하고 이끌어가며, 독립적으로 행동하는 것을 중요시하는' :
topBottom.top1.axis === 'CO' ? '타인과의 연결을 중요시하고, 공동체 의식이 강하며 배려심이 깊은' :
topBottom.top1.axis === 'P' ? '목표를 향해 꾸준히 나아가며, 어려움에도 포기하지 않는 끈기 있는' :
'안정적이고 예측 가능한 환경을 선호하며, 신중하게 행동하는'
} 욕구를 반영하고 있어요.

${ytCats[1]?.channels?.[0] ? `${ytCats[1].channels[0]} 같은 채널의 구독은 두 번째 특성인 "${topBottom.top2.name}"과도 연결돼요.` : `두 번째로 높은 "${topBottom.top2.name}"과 함께하면 당신만의 독특한 조합이 완성돼요.`} 이 조합은 서로를 보완하며 당신만의 독특한 시선을 만들어내요.


**관계에서 보이는 패턴**

당신은 ${mbtiTraits[0]} 특성이 있어요. 관계에서도 이 특성이 그대로 드러나요.

${data.mbti_scores.E > data.mbti_scores.I ?
'사람들 속에서 빛나는 타입이에요. 새로운 사람을 만나는 것을 두려워하지 않고, 대화를 이끌어가는 능력도 있어요. 하지만 그렇다고 아무나 가까이하는 건 아니에요. 많은 사람과 교류하면서도 진정으로 마음을 여는 사람은 소수예요.' :
'깊은 관계를 선호하는 타입이에요. 많은 사람과 피상적으로 어울리기보다, 소수의 사람과 진정한 연결을 맺는 것을 더 가치 있게 여겨요.'}


**숨겨진 욕구**

${enneaTrait} 특성이 두드러지는 당신, 이 특성 뒤에는 숨겨진 욕구가 있어요. ${
topBottom.bottom.axis === 'HA' ? '안전함보다 자유와 모험을 추구해요. 하지만 가끔은 안정감을 느끼고 싶을 때도 있죠. 그래서 당신의 구독 리스트에서도 때때로 안정적인 콘텐츠를 찾는 모습이 보여요.' :
topBottom.bottom.axis === 'CO' ? '독립적이지만, 마음 깊은 곳에서는 진정한 연결을 원하고 있어요. 혼자서도 잘 지내지만, 깊이 공감해주는 사람이 곁에 있으면 더 행복해질 거예요.' :
topBottom.bottom.axis === 'NS' ? '안정을 추구하지만, 가끔은 새로운 자극이 필요할 때가 있어요. 익숙한 것에서 벗어나 모험을 시도할 때 의외의 에너지를 발견할 수 있어요.' :
'당신만의 방식으로 세상과 소통하고 있지만, 더 깊은 이해를 원하고 있어요.'}`,

    "4": `**"${t.RD >= 50 ? '마음을 나누며 힐링하는 사람' : '조용히 정리하며 힐링하는 사람'}"**


**스트레스를 받으면**

당신은 힘들 때 ${t.RD >= 50 ? '신뢰하는 사람과 이야기를 나누며' : '혼자만의 시간을 가지며'} 감정을 처리하는 편이에요.

${t.HA >= 50 ? '감정을 신중하게 다루고, 섣불리 표현하기보다 충분히 정리한 후에 나누는' : '감정에 솔직하고, 즉각적으로 표현하는'} 경향이 있어요. 이건 당신만의 자연스러운 방식이에요.

특히 당신의 구독 리스트를 보면, ${ytCats.find(c => c.category === 'music') ? `${ytCats.find(c => c.category === 'music')?.channels?.[0] || '음악'} 같은 음악 관련 채널이 있어서 음악으로 감정을 조절하는` : ytCats.find(c => c.category === 'asmr') ? 'ASMR 채널이 있어서 조용한 자극으로 안정을 찾는' : '다양한 콘텐츠로 기분 전환을 하는'} 패턴이 보여요. 스트레스 상황에서 무의식적으로 이런 콘텐츠를 찾게 되는 거예요.

또한 ${ytCats[0]?.name || '주요 카테고리'} 카테고리의 채널들을 집중적으로 시청하면서 일상의 긴장을 풀어내고 있어요. 이것은 당신에게 가장 효과적인 스트레스 해소법이기도 해요.


**당신만의 힐링 패턴**

✓ ${t.HA >= 50 ? '힘들 때 먼저 혼자 정리하는 시간이 필요함' : '힘들 때 바로 누군가와 이야기하고 싶어함'}
✓ ${t.RD >= 50 ? '공감 받으면 크게 위로가 됨' : '조언보다 그냥 들어주는 게 더 좋음'}
✓ ${t.ST >= 50 ? '의미를 찾으며 상황을 이해하려 함' : '실용적인 해결책을 먼저 찾음'}
✓ ${ytCats.find(c => c.category === 'music') ? `${ytCats.find(c => c.category === 'music')?.channels?.[0] || '음악 채널'} 같은 채널로 감정을 조절함` : '취미 활동으로 기분 전환함'}
✓ ${t.CO >= 50 ? '사랑하는 사람과 함께 있는 것만으로 힐링됨' : '혼자만의 취미 시간이 최고의 힐링'}


**이건 약점이 아니에요**

${t.RD >= 50 ? '감정에 민감한' : '혼자 시간이 필요한'} 당신의 특성은 약점이 아니에요. ${t.RD >= 50 ? '오히려 깊은 공감 능력과 따뜻한 마음을 가졌다는 의미예요. 당신은 다른 사람의 감정을 빠르게 읽어내고, 진심으로 공감할 수 있는 귀한 능력을 지녔어요.' : '오히려 자기 자신을 잘 돌볼 줄 안다는 의미예요. 충전이 필요할 때를 스스로 인식하고, 적절한 방법으로 에너지를 회복하는 건 매우 건강한 패턴이에요.'}`,

    "5": `**"${t.SD >= 50 ? '자유롭게 일하며 의미 있는 삶' : '안정적이고 따뜻한 일상'}"**


**어떻게 살아왔을지**

당신의 구독 리스트를 보면, 과거부터 꾸준히 관심을 가져온 분야가 보여요. ${ytCats[0]?.name || '다양한 분야'}에 대한 관심이 가장 크고, ${ytCats[0]?.channels?.slice(0, 2).join(', ') || '여러 채널'}을 구독하고 있는 것으로 보아, 어릴 때부터 이 분야에 자연스럽게 끌려왔을 거예요.

${ytCats[1] ? `${ytCats[1].name}에도 관심이 있는 것은, 성장하면서 다양한 경험을 통해 세상을 넓혀가려는 욕구가 있었다는 뜻이에요.` : '하나의 분야에만 집중하기보다 다양한 관심사를 탐색해왔을 거예요.'}

이런 경험들이 쌓이면서 지금의 당신이 만들어진 거예요. 구독 버튼 하나하나에 당신의 성장 과정이 담겨 있어요.


**현재의 당신**

지금 당신이 구독 중인 채널들에서 드러나는 것은, ${
topBottom.top1.axis === 'ST' ? '삶의 깊은 의미를 탐구하려는 욕구예요. 단순한 재미를 넘어 자기 이해와 성장에 진심인 분이에요.' :
topBottom.top1.axis === 'SD' ? '스스로의 길을 개척하려는 강한 의지예요. 남들이 정한 기준보다 자신만의 기준으로 인생을 설계하고 있어요.' :
topBottom.top1.axis === 'NS' ? '새로운 것에 대한 끊임없는 호기심이에요. 지루함을 견디지 못하고, 항상 새로운 자극과 경험을 찾고 있어요.' :
topBottom.top1.axis === 'CO' ? '사람과의 연결을 소중히 여기는 따뜻한 마음이에요. 혼자보다 함께할 때 더 큰 에너지를 느끼는 분이에요.' :
'자신만의 가치관에 따라 꾸준히 나아가는 모습이에요.'}


**미래의 당신**

${t.SD >= 50 && t.ST >= 50 ?
`넓지 않아도 좋은, 작지만 아늑한 공간. 창밖으로는 해가 지는 풍경이 보이고, 당신은 오늘 하루 의미 있게 보낸 시간을 되돌아보고 있어요.

테이블 위에는 좋아하는 음료와 아직 다 읽지 못한 책이 놓여 있어요. 조용한 음악이 흐르고, 당신은 이 순간의 평화로움을 온전히 느끼고 있어요.

하지만 그 옆에는 함께 이 시간을 나눌 수 있는 사람이 있으면 더 좋겠죠.` :
t.CO >= 50 ?
`따뜻한 조명 아래, 사랑하는 사람들과 함께하는 저녁 시간. 맛있는 음식과 함께 나누는 소소한 일상 이야기.

웃음소리가 끊이지 않고, 가끔은 진지한 대화도 나눠요. 이 순간의 연결감이 당신에게는 가장 큰 행복이에요.

당신이 꿈꾸는 미래는 거창한 성공이 아니라, 진심으로 연결된 사람들과 함께하는 따뜻한 일상이에요.` :
`자유롭고 활기찬 분위기의 공간. 새로운 프로젝트에 대한 아이디어가 떠오르고, 당신은 그것을 메모하고 있어요.

내일은 또 어떤 새로운 일이 기다리고 있을까요? 그 기대감이 당신을 설레게 해요.

당신이 추구하는 미래는 끊임없이 성장하고 도전하는 삶이에요. 그 여정 자체가 당신에게는 가장 큰 보상이에요.`}`,

    "6": `**당신이 가장 힘들어하는 상대방의 모습**

⚠️ "${t.ST >= 50 ? '피상적이고 깊이 없는 대화' : t.HA >= 50 ? '급작스럽고 예측 불가능한 변화' : '지나친 감정 표현'}"


**왜 이것이 힘든가요?**

${t.ST >= 50 ?
`당신은 깊이 있는 대화와 의미 있는 연결을 중요하게 여기는 분이에요. ${ytCats[0]?.channels?.[0] || ytCats[0]?.name || '다양한'} 같은 채널을 구독하는 것에서도 알 수 있듯이, 피상적인 것에 만족하지 못하는 성향이 있어요.

그래서 "오늘 뭐 했어?" "별일 없어"로 끝나는 대화가 반복되면, 마음이 점점 멀어지는 걸 느끼시죠. 당신에게 대화는 단순한 정보 교환이 아니에요. 서로의 내면을 나누고, 더 깊이 알아가는 과정이거든요.

이런 성향은 당신의 구독 패턴에서도 고스란히 드러나요. 깊이 있는 콘텐츠를 선호하고, 얕은 자극보다 의미 있는 메시지에 끌리는 모습이니까요.` :
t.HA >= 50 ?
`당신은 안정적이고 예측 가능한 환경을 선호하는 분이에요. 계획을 세우고 그대로 실행하는 것에서 안정감을 느끼죠.

그래서 갑자기 계획이 바뀌거나, 예상치 못한 상황이 생기면 스트레스를 받으시죠. 이건 당신이 유연하지 못해서가 아니에요. 충분한 준비와 계획을 통해 최선의 결과를 내고 싶은 마음이 큰 거예요.

당신의 구독 채널에서도 체계적이고 정돈된 콘텐츠를 선호하는 패턴이 보여요. 이것은 당신의 내면이 안정과 질서를 추구한다는 자연스러운 표현이에요.` :
`당신은 독립적이고 자기 주관이 뚜렷한 분이에요. ${ytCats[0]?.channels?.[0] || '다양한'} 같은 채널에서도 자신만의 관점을 키워가는 모습이 보여요.

그래서 상대방이 지나치게 감정에 호소하거나, 의존적인 모습을 보이면 부담을 느끼시죠.

이것은 당신이 냉정해서가 아니에요. 각자의 독립성을 존중하면서도 깊은 연결을 맺고 싶은 건강한 관계관을 가지고 있기 때문이에요.`}


**구체적 상황 예시**

• 힘든 상황: ${t.ST >= 50 ? '"별일 없어"로 대화 마무리' : t.HA >= 50 ? '갑자기 약속 취소' : '매일 감정 토로'} → 당신의 내면: ${t.ST >= 50 ? '"더 알고 싶은데..."' : t.HA >= 50 ? '"미리 말해줬으면..."' : '"나도 쉬고 싶어..."'}
• 힘든 상황: ${t.ST >= 50 ? '항상 같은 주제의 대화' : t.HA >= 50 ? '즉흥적인 계획 제안' : '의존적인 결정 요청'} → 당신의 내면: ${t.ST >= 50 ? '"더 깊이 나누고 싶어"' : t.HA >= 50 ? '"생각할 시간이 필요해"' : '"스스로 결정해봐"'}


**이건 약점이 아니에요**

${t.ST >= 50 ? '깊이 있는 관계를 원하는 것' : t.HA >= 50 ? '안정을 추구하는 것' : '독립성을 중시하는 것'}은 당신의 강점이에요.

상대방에게 당신의 필요를 부드럽게 알려주세요. 좋은 관계는 서로의 차이를 이해하는 것에서 시작해요. 당신이 이 점을 불편해한다는 것 자체가, 관계에 진심이라는 뜻이니까요.`,

    "7": `**당신의 완벽한 파트너**

"${h.variant === 'extrovert' ? h.metaphor_e : h.metaphor_i}"


**${h.category} - ${h.subcategory}**

이 유형은 ${h.description}


**처음 만났을 때**

처음 만났을 때 ${h.variant === 'extrovert' ? '따뜻하고 친근한 에너지가 느껴질 거예요. 대화를 이끌어가고, 당신을 편안하게 만들어주는 사람.' : '조용하지만 깊이 있는 인상을 받을 거예요. 말은 많지 않지만, 한마디 한마디에 무게감이 있는 사람.'}

대화를 나눌수록 "이 사람, ${h.variant === 'extrovert' ? '생각보다 깊은 면이 있구나' : '알수록 매력 있는 사람이구나'}"라는 걸 느끼게 될 거예요.

공통의 관심사를 발견했을 때의 반짝임, 서로의 가치관이 맞닿는 순간의 설렘... 그런 것들이 조금씩 쌓여갈 거예요.


**왜 이 파트너인가요?**

당신의 구독 패턴에서 드러나는 성격 특성은 ${h.variant === 'extrovert' ? '함께 성장하고 서로를 자극하는' : '깊이 이해하고 서로의 공간을 존중하는'} 파트너와 잘 맞아요.

${h.name}은 당신이 가장 강하게 추구하는 가치를 인정해주고, 상대적으로 부족한 영역을 보완해줄 수 있는 유형이에요. 당신의 구독 채널들이 보여주는 취향과 가치관이 이 유형과 자연스럽게 어울리는 거예요.`,

    "8": `**파트너 상세 프로필**


**기본 정보**

유형: ${h.name}
카테고리: ${h.category} - ${h.subcategory}
성향: ${h.variant === 'extrovert' ? '외향형' : '내향형'}
매칭 점수: ${scorePercent}%


**이런 분이에요**

${h.description}

${h.variant === 'extrovert' ?
'활발하고 에너지가 넘치는 분이에요. 새로운 사람을 만나고, 새로운 경험을 하는 것을 좋아해요. 하지만 그 안에 깊이도 있어서, 진지한 대화도 충분히 나눌 수 있는 분이죠.' :
'조용하지만 내면이 풍부한 분이에요. 깊은 생각과 풍부한 감성을 가지고 있어요. 처음에는 다가가기 어려워 보일 수 있지만, 알면 알수록 매력이 있는 분이죠.'}


**함께하면 이런 모습이에요**

【장면 1】 주말 오후
${h.variant === 'extrovert' ?
'새로운 카페나 맛집을 함께 탐험하며 즐거운 시간을 보내요.' :
'각자 좋아하는 책을 읽거나, 조용히 함께 있는 시간.'}

【장면 2】 힘든 날
${h.variant === 'extrovert' ?
'당신의 기분을 금방 알아채고, 함께 맛있는 것을 먹으러 가자고 해요.' :
'조용히 옆에 있어줘요. 그 존재만으로 위로가 돼요.'}

【장면 3】 특별한 날
${h.variant === 'extrovert' ?
'깜짝 이벤트나 서프라이즈를 좋아해요.' :
'작지만 의미 있는 선물이나 편지를 준비해요.'}


**알아두세요**

${h.variant === 'extrovert' ?
'이 유형은 혼자만의 시간보다 함께하는 시간을 선호해요.' :
'이 유형은 자기만의 시간과 공간이 필요해요.'}`,

    "9": getCard9FixedContent(data.channelCount),
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
  birthInfo?: BirthInfo;
  userName?: string;
}

/**
 * Run full Phase 1 pipeline from ChannelData[] and insert result.
 */
export async function runPhase1FromChannels(
  supabase: SupabaseClient,
  userId: string,
  channels: ChannelData[],
  birthInfo?: BirthInfo,
  userName?: string
): Promise<{ phase1_id: string }> {
  const channel_categories = await categorizeChannels(channels);
  const tci_scores = calculateTCI(channel_categories);
  const enneagram = estimateEnneagram(tci_scores, channel_categories);
  const mbti = estimateMBTI(tci_scores, channel_categories);
  const user_vector = createVector(tci_scores, enneagram.center, channel_categories);
  const channelCount = channels.length;

  // YouTube 분석 실행
  const youtubeAnalysis = await runYouTubeAnalysis(channels);

  return runPhase1FromPrecomputed(supabase, userId, {
    channel_categories,
    tci_scores,
    enneagram_center: enneagram.center,
    enneagram_type: enneagram.type,
    mbti_scores: mbti.scores,
    mbti_type: mbti.type,
    user_vector,
    channelCount,
    birthInfo,
    userName,
  }, youtubeAnalysis);
}

/**
 * Run Phase 1 card generation + insert from precomputed analysis.
 */
export async function runPhase1FromPrecomputed(
  supabase: SupabaseClient,
  userId: string,
  data: Phase1Precomputed,
  youtubeAnalysis?: {
    categoryResults: YouTubeCategoryResult[];
    rarity: RarityAnalysis;
    tciScores: YouTubeTCIScores;
    topBottom: ReturnType<typeof import('@/lib/husband-match/analysis/youtube-analysis').getTopBottomAxes>;
  }
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

  // 사주 계산 (생년월일 정보가 있을 때만)
  const sajuResult = data.birthInfo ? calculateSaju(data.birthInfo) : undefined;

  // YouTube 분석 데이터 (없으면 기본값)
  const ytAnalysis = youtubeAnalysis || {
    categoryResults: [
      { category: 'entertainment' as const, name: '예능/버라이어티', count: 5, percent: 30, color: '#FF6B6B', channels: [] as string[] },
      { category: 'vlog' as const, name: '브이로그/일상', count: 3, percent: 20, color: '#4ECDC4', channels: [] as string[] },
    ] as YouTubeCategoryResult[],
    rarity: {
      percentile: 25,
      rarestCategory: 'travel' as const,
      rarestCategoryName: '여행',
      rarestCategoryPercent: 10,
      rarestCategoryChannels: ['채널1'],
      cosineSimilarity: 0.8,
    },
    tciScores: { ST: 50, SD: 50, NS: 50, HA: 50, P: 50, CO: 50 },
    topBottom: {
      top1: { axis: 'NS' as const, score: 60, name: '자극추구' },
      top2: { axis: 'CO' as const, score: 55, name: '연대감' },
      bottom: { axis: 'HA' as const, score: 30, name: '위험회피' },
    },
  };

  const extendedCardData: ExtendedCardData = {
    channelCount,
    channel_categories,
    tci_scores,
    enneagram_center,
    enneagram_type,
    mbti_scores,
    mbti_type,
    matched_husband: matchResult.type,
    match_score: matchResult.score,
    userName: data.userName,
    youtubeCategories: ytAnalysis.categoryResults,
    rarity: ytAnalysis.rarity,
    youtubeTCI: ytAnalysis.tciScores,
    topBottom: ytAnalysis.topBottom,
    sajuResult,
    birthInfo: data.birthInfo,
  };

  // 카드 콘텐츠 생성
  let cardContents: Record<string, string>;
  try {
    cardContents = await generateAllCardsAtOnce(extendedCardData);
    // LLM이 생성해야 할 카드: 2,3,4,5,6,7,8 = 7장 (+ 타이틀 키 2개 = 최소 9개 키)
    if (!cardContents || Object.keys(cardContents).length < 7) {
      console.log('[Phase 1] Incomplete AI response, using fallback');
      cardContents = generateFallbackCards(extendedCardData);
    }
  } catch (err) {
    console.error('[Phase 1] Card generation failed, using fallback:', err);
    cardContents = generateFallbackCards(extendedCardData);
  }

  // 9장 카드 생성
  const cards: ReportCard[] = [];
  for (let cardNumber = 1; cardNumber <= 9; cardNumber++) {
    const meta = CARD_TITLES[cardNumber];
    const cardKey = String(cardNumber);

    let content: string;
    if (cardNumber === 1) {
      content = CARD_1_FIXED_CONTENT;
    } else if (cardNumber === 9) {
      content = getCard9FixedContent(channelCount);
    } else {
      content = cardContents[cardKey] || '분석 결과를 불러오는 중 문제가 발생했습니다.';
    }

    let title: string;
    if (cardNumber === 2) {
      title = cardContents['2_title'] || '당신의 취향을 분석해보았어요';
    } else if (cardNumber === 3) {
      title = cardContents['3_title'] || '당신은 균형 잡힌 탐험가 타입이에요';
    } else {
      title = meta.title;
    }

    let subtitle: string | undefined;
    if (cardNumber === 3) {
      subtitle = cardContents['3_subtitle'] || 'Balanced Explorer Type';
    } else {
      subtitle = meta.subtitle;
    }

    cards.push({
      card_number: cardNumber,
      title,
      subtitle,
      content: String(content).slice(0, 5000),
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
    user_name: data.userName || null,
    birth_date: data.birthInfo ? `${data.birthInfo.year}-${String(data.birthInfo.month).padStart(2,'0')}-${String(data.birthInfo.day).padStart(2,'0')}` : null,
    cards,
  };

  const { data: result, error: insertError } = await supabase
    .from('phase1_results')
    .upsert(payload, { onConflict: 'user_id' })
    .select('id')
    .single();

  if (insertError) {
    console.error('Failed to store Phase 1 results:', insertError);
    throw new Error('Failed to store analysis results');
  }

  return { phase1_id: result.id };
}
