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
import { getWritingToneDirective } from '@/lib/writing-guide';
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
const CARD_1_FIXED_CONTENT = `새벽 두 시. 잠이 안 와서 틀어놓은 영상이 있었을 거예요.

무심코 누른 구독 버튼, 알고리즘이 건넨 추천 한 줄. 그게 전부예요. 별것 아닌 것 같죠.

그런데 그 목록 안에, 당신이 의식하지 못한 것들이 적혀 있어요.

유튜브는 생각보다 사적인 공간이에요. 타인 앞에서는 꽤 잘 포장하지만, 혼자 보는 화면 앞에서만큼은 정직해지니까요.

구독 목록에는 취향만 담긴 게 아니에요. 당신이 어떤 사람인지, 어떤 사람 옆에 있고 싶은지까지.

지금부터 그 이야기를 읽어볼게요.`;

// 카드 9 고정 텍스트 (CTA — LLM이 가격/블러 힌트를 누락하므로 고정)
function getCard9FixedContent(channelCount: number): string {
  return `여기까지가 무료 분석이에요.

구독 채널 ${channelCount}개로 9장의 카드를 만들었어요. 읽으면서 어떤 문장에서 멈칫했는지, 당신이 더 잘 알 거예요.

아직 못 다 한 이야기가 있어요.

✦ 겉으로는 독립적이지만, 마음 깊은 곳에서는... [블러 처리]

✦ 매번 같은 지점에서 멈추는 이유가... [블러 처리]

✦ 넘어야 할 문턱이 하나 있어요... [블러 처리]

✦ YouTube가 보여주는 선택과, 당신이 직접 쓴 답이 만나는 지점... [블러 처리]


**진행 방식**

1. 9개의 심층 질문에 답변
2. YouTube 데이터와 교차 검증
3. 8장의 심층 리포트 카드 제공


**[ 심층 분석 시작하기 — ₩9,900 ]**


* 심리학적 연구를 기반으로 하지만, 전문 심리 검사를 대체하지 않아요.
* 자기 이해를 위한 콘텐츠로 즐겨주세요.`;
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

### 대표 채널 (상위 카테고리에서 각 1개씩)
${ytCats.slice(0, 3).map(c => `  · ${c.name}: ${c.channels[0] || ''}`).join('\n')}

### 희소성 분석
- 상위 ${rarity.percentile}% (코사인 유사도: ${rarity.cosineSimilarity.toFixed(2)})
- 가장 희귀한 카테고리: ${rarity.rarestCategoryName} (사용자 비율 ${rarity.rarestCategoryPercent}%)

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
- 이 카드에서는 카테고리 특징(예: "영어 학습 채널", "자기계발 채널")과 TCI 점수를 적극 인용하세요.
- 채널명은 카드 전체에서 대표 2~3개만 자연스럽게 언급하세요. 나열하거나 반복하지 마세요.
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

## ⚠️ 필수: 1,500자 이상 1,750자 이하로 작성하세요. 1,500자 미만은 불합격입니다!
## ⚠️ 분량이 부족하면: 행동 패턴 + 인사이트를 추가하세요.
## ⚠️ 채널명 규칙: 카드 전체에서 대표 채널명 2~3개만 자연스럽게 언급하세요. 채널명을 나열하거나 5개 이상 쓰지 마세요. 기본은 "영어 학습 채널", "자기계발 채널" 같은 카테고리 특징으로 설명하고, 그 사이에 대표 채널명을 2~3개 섞어 "실제 데이터를 봤다"는 느낌을 주세요.

${getWritingToneDirective('balanced')}

${context}

## 카드 2: 구독 데이터 개요 + 희소성 분석
- "2_title": ${data.userName ? `"${data.userName}님은 ..."으로 시작하는` : '사용자의'} 구독 패턴을 한 줄로 요약하는 마케팅 카피
- "2": 본문 (1500-1750자) — 아래 구조를 반드시 포함 (3개 섹션):
  1) **"당신의 구독 리스트가 말해주는 것"** — 총 채널 수, 카테고리 수, 상위 3개 카테고리의 특징을 "영어 학습 채널", "자기계발 채널" 식으로 설명하되, 대표 채널명 1~2개를 자연스럽게 섞어서 "실제 데이터를 분석했다"는 느낌을 주세요. 희소성도 이 섹션 끝에 자연스럽게 포함: 상위 ${rarity.percentile}% 취향, 가장 희귀한 카테고리 "${rarity.rarestCategoryName}" 특징 설명. ★ 별도 "상위 N%" 섹션으로 분리하지 말 것.
  2) **"육각형 밸런스에서 드러난 당신의 특성"** — 상위 2축과 최하위 1축만 점수와 함께 설명 (각 1줄). 나머지 3축은 점수만 간단히 나열.
  3) **"가장 두드러진 축: {1위 축명} ({점수}점)"** — 왜 이 축이 높은지 구독 카테고리 특징과 연결하여 자연스럽게 설명.

## 응답 형식 (JSON만)
{
  "2_title": "타이틀 문자열",
  "2": "본문 1500자 이상"
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

## ⚠️ 필수: 1,500자 이상 1,750자 이하로 작성하세요. 1,500자 미만은 불합격입니다!
## ⚠️ 분량이 부족하면: 보편적으로 공명하는 행동 패턴 + 인사이트를 추가하세요. 틀릴 수 있는 구체적 상황(시간대, 장소, 직업 등)을 특정하지 마세요.
## ⚠️ 유튜브 채널명을 절대 쓰지 마세요. 사주 용어(화, 토, 오행 등)를 절대 쓰지 마세요. TCI 점수(숫자)를 절대 쓰지 마세요.
## ⚠️ 행동 패턴을 보여준 뒤, "왜 이런 행동을 하는지" 인사이트 한 줄로 꿰뚫으세요.
## ⚠️ 각 볼드 섹션 타이틀 바로 아래에 "→ 핵심 요약 한 줄"을 넣으세요.

${getWritingToneDirective('balanced')}

${context}

## 카드 3: 당신은 누구인가 — 핵심 정체성
이 카드는 "근본 정체성"과 "내면의 모순"에 집중합니다.

- "3_subtitle": 영어 타입명 3-5단어 (예: "Quiet Storm, Steady Ground")
- "3_title": "${data.userName ? `${data.userName}님은` : '당신은'} {한국어 한 줄 정의} 타입이에요"
  · ${topBottom.top1.name}(1위)과 ${topBottom.top2.name}(2위) 조합 기반
- "3": 본문 (1500-1750자) — 아래 구조를 반드시 포함:
  1) **해시태그 3개**
  2) **"당신의 근본 성격"** — → 요약 한 줄 + 2문단. 겉으로 보이는 모습과 속마음의 차이. 행동 패턴 1개 + 인사이트 1줄.
  3) **"아무도 모르는 당신의 습관"** — → 요약 한 줄 + 불릿 2개. 보편적 행동 패턴 + 각각에 인사이트.
  4) **"내면의 모순"** — → 요약 한 줄 + 1문단. "~하고 싶으면서도 ~도 원하는" 형태의 갈등.
  5) **"관계에서의 당신"** — → 요약 한 줄 + 1문단. 연애에서 반복되는 행동 패턴 + 왜 그런지 인사이트.

## 응답 형식 (JSON만)
{
  "3_subtitle": "English Type Name",
  "3_title": "${data.userName ? `${data.userName}님은` : '당신은'} {타입} 타입이에요",
  "3": "본문 1500자 이상"
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

## ⚠️ 필수: 1,500자 이상 1,750자 이하로 작성하세요. 1,500자 미만은 불합격입니다!
## ⚠️ 분량이 부족하면: 보편적으로 공명하는 행동 패턴 + 인사이트를 추가하세요. 틀릴 수 있는 구체적 상황(시간대, 장소, 직업 등)을 특정하지 마세요.
## ⚠️ 유튜브 채널명 금지. 사주 용어 금지. TCI 점수 금지.
## ⚠️ 카드 3에서 이미 "근본 성격"과 "내면의 모순"을 다뤘습니다. "스트레스 반응"과 "감정 표현 패턴"에만 집중하세요.
## ⚠️ 행동 패턴을 보여준 뒤, "왜 이런 행동을 하는지" 인사이트 한 줄로 꿰뚫으세요.
## ⚠️ 각 볼드 섹션 타이틀 바로 아래에 "→ 핵심 요약 한 줄"을 넣으세요.

${getWritingToneDirective('balanced')}

${context}

## 카드 4: 한계를 넘는 순간 — 스트레스 반응

- "4": 본문 (1500-1750자) — 아래 구조를 반드시 포함:
  1) **한 줄 정의** — 스트레스 반응 핵심
  2) **"당신이 화가 나면"** — → 요약 한 줄 + 2문단. 감정 억제 → 폭발 패턴. 행동 패턴 2가지 + 각각에 인사이트.
  3) **"이런 상황에서 한계가 온다"** — → 요약 한 줄 + 불릿 2개. 트리거 행동 패턴을 구체적으로. (시간/장소 특정 금지)
  4) **"당신만의 회복법"** — → 요약 한 줄 + ✓ 체크리스트 3개. 행동 묘사만 (채널명 없음).
  5) **"리프레이밍"** — → 요약 한 줄 + 1문단. 이 스트레스 반응이 강점인 이유.

## 응답 형식 (JSON만)
{
  "4": "본문 1500자 이상"
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

## ⚠️ 필수: 각 카드는 반드시 1,500자 이상 1,750자 이하로 작성하세요. 1,500자 미만은 불합격입니다!
## ⚠️ 분량이 부족하면: 보편적으로 공명하는 행동 패턴 + 인사이트를 추가하세요. 틀릴 수 있는 구체적 상황(시간대, 장소, 직업 등)을 특정하지 마세요.
## ⚠️ 유튜브 채널명 금지. 사주 용어 금지. TCI 점수 금지.
## ⚠️ 카드 3에서 "근본 성격/내면의 모순"을, 카드 4에서 "스트레스 반응/감정 표현"을 이미 다뤘습니다. 같은 내용을 반복하지 마세요.
## ⚠️ 행동 패턴을 보여준 뒤, "왜 이런 행동을 하는지" 인사이트 한 줄로 꿰뚫으세요.
## ⚠️ 각 볼드 섹션 타이틀 바로 아래에 "→ 핵심 요약 한 줄"을 넣으세요.

${getWritingToneDirective('balanced')}

${context}

## 카드 5: 시간의 흐름 — 과거, 현재, 미래의 당신 (1500-1750자)
- "5": 아래 구조를 반드시 포함:
  1) **미래상 한 줄 정의**
  2) **"성격의 뿌리"** — → 요약 한 줄 + 1문단. 이 성격이 어디서 왔는지 추상적으로. ★ 구체적 과거 장면(조별 과제, 반에서 등) 추측 금지. 행동 패턴 + 인사이트.
  3) **"지금의 당신"** — → 요약 한 줄 + 1문단. 안정과 모험 사이의 줄타기. 행동 패턴 + 왜 이런 선택을 하는지.
  4) **"앞으로의 당신"** — → 요약 한 줄 + 2문단. 이 사람이 추구하는 방향과 느낌/패턴. (구체적 시간대/장소 특정 금지)

## 카드 6: 관계 지뢰 — 도저히 참을 수 없는 단점 (1500-1750자)
- "6": 아래 구조를 반드시 포함:
  1) **한 줄 요약** — "당신은 ○○한 사람을 만나면 숨이 막힙니다"
  2) **"이런 사람 만나면 도망치고 싶다"** — → 요약 한 줄 + 불릿 2개. 행동 패턴 + 인사이트.
  3) **"이 패턴이 관계에서 나타나는 방식"** — → 요약 한 줄 + 1문단. 보편적 행동 패턴으로 묘사. ★ 과거 경험 추측 금지.
  4) **"하지만 이것이 당신의 강점"** — → 요약 한 줄 + 1문단. 리프레이밍 + 인사이트.

## 응답 형식 (JSON만)
{
  "5": "본문 1500자 이상",
  "6": "본문 1500자 이상"
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

## ⚠️ 필수: 각 카드는 반드시 1,500자 이상 1,750자 이하로 작성하세요. 1,500자 미만은 불합격입니다!
## ⚠️ 분량이 부족하면: 보편적으로 공명하는 행동 패턴 + 인사이트를 추가하세요. 틀릴 수 있는 구체적 상황(시간대, 장소, 직업 등)을 특정하지 마세요.
## ⚠️ "왕자님" 대신 반드시 "완벽한 파트너"를 사용하세요.
## ⚠️ 유튜브 채널명 금지. 사주 용어 금지. TCI 점수 금지.
## ⚠️ 카드 3-6에서 이미 다룬 성격 특성을 재설명하지 마세요. "파트너"에 대해서만 이야기합니다.
## ⚠️ 행동 패턴을 보여준 뒤, "왜 이런 행동을 하는지" 인사이트 한 줄로 꿰뚫으세요.
## ⚠️ 각 볼드 섹션 타이틀 바로 아래에 "→ 핵심 요약 한 줄"을 넣으세요.

${getWritingToneDirective('balanced')}

${context}

## 카드 7: 당신의 완벽한 파트너 — 왜 이 사람인가 (1500-1750자)
- "7": 아래 구조를 반드시 포함:
  1) **비유 문구** — "${h.variant === 'extrovert' ? (h.metaphor_e || '') : (h.metaphor_i || '')}" 활용
  2) **유형 소개** — → 요약 한 줄 + "${h.category} - ${h.subcategory}". "${h.description}" 기반 1문단.
  3) **"이 사람이 옆에 있으면"** — → 요약 한 줄 + 2문단. 소설적 장면이 아니라, 이 파트너와 함께할 때 느껴지는 것/달라지는 패턴을 묘사. (구체적 장소/시간 특정 금지)
  4) **"왜 하필 이 사람인가"** — → 요약 한 줄 + 1문단. 당신이 서투른 영역을 이 사람이 어떻게 보완하는지 + 인사이트.

## 카드 8: 파트너와의 일상 — 함께하는 삶 (1500-1750자)
- "8": 아래 구조를 반드시 포함:
  1) **"기본 정보"** — 유형명: ${h.name}, 카테고리: ${h.category} > ${h.subcategory}, 성향: ${h.variant === 'extrovert' ? '외향형' : '내향형'}, 매칭 점수: ${scorePercent}%
  2) **"이런 분이에요"** — → 요약 한 줄 + 1문단 (카드 7에서 안 다룬 새로운 측면만) + 인사이트.
  3) **3개 패턴** — 보편적 행동 패턴으로 묘사 (소설적 장면 금지):
     · **【패턴 1】 편안한 시간** — 함께 있을 때의 행동 패턴
     · **【패턴 2】 갈등 후** — 화해 방식의 행동 패턴 + 왜 이런 방식인지
     · **【패턴 3】 오래된 관계** — 시간이 지나면 이 관계가 어떤 모습이 되는지
  4) **"이 사람과 잘 지내려면"** — → 요약 한 줄 + 구체적 팁 2개 (불릿) + 인사이트.

## 응답 형식 (JSON만)
{
  "7": "본문 1500자 이상",
  "8": "본문 1500자 이상"
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

    "2_title": `${data.userName ? `${data.userName}님의` : '당신의'} 구독 목록에는 취향 말고도 적혀 있는 게 있어요`,

    "2": `**구독 리스트가 말해주는 것**

채널 ${data.channelCount}개. ${ytCats.length}개 카테고리. 가장 많이 누른 건 "${ytCats[0]?.name || '다양함'}"(${ytCats[0]?.percent || 0}%)이에요. 그 다음은 "${ytCats[1]?.name || '기타'}"(${ytCats[1]?.percent || 0}%), "${ytCats[2]?.name || '기타'}"(${ytCats[2]?.percent || 0}%).

구독 버튼은 생각보다 정직해요. 누르는 순간엔 아무 생각 없었겠지만, 모아 놓으면 보여요. 당신이 뭘 원하는지.

이 조합은 상위 ${rarity.percentile}%에요. "${rarity.rarestCategoryName}" 쪽 채널이 특히 그래요. 이런 관심사를 가진 사람은 많지 않거든요.


**육각형 밸런스**

구독 데이터를 6가지 심리 축으로 풀어봤어요.

• ${topBottom.top1.name}: ${topBottom.top1.score}점 — 가장 높아요. ${ytCats[0]?.name || '주요 카테고리'}를 ${ytCats[0]?.percent || 0}%나 구독하게 만든 힘이에요.
• ${topBottom.top2.name}: ${topBottom.top2.score}점 — 두 번째. 첫 번째 축과 만나면 흔치 않은 조합이 돼요.
• ${topBottom.bottom.name}: ${topBottom.bottom.score}점 — 가장 낮은 축. 이 영역을 채워줄 사람이 옆에 있으면 좋겠다는 뜻이기도 해요.`,

    "3_subtitle": englishType.replace(/\s+/g, ' ').trim() || "Balanced Explorer Type",

    "3_title": `${data.userName ? `${data.userName}님은` : '당신은'} ${typeName} 타입이에요`,

    "3": `#${topBottom.top1.name} #${topBottom.top2.name} #자기이해


**당신의 근본 성격**
→ ${
topBottom.top1.axis === 'NS' ? '멈춰 있으면 불안한 사람. 움직이는 게 안전장치.' :
topBottom.top1.axis === 'ST' ? '답을 찾아야 마음이 놓이는 사람. 질문이 곧 에너지원.' :
topBottom.top1.axis === 'SD' ? '남이 정한 길이 불편한 사람. 자기 기준이 곧 자기 자신.' :
topBottom.top1.axis === 'CO' ? '혼자서도 괜찮지만, 나누지 않으면 아까운 사람.' :
topBottom.top1.axis === 'P' ? '시작한 건 끝을 봐야 하는 사람. 완성이 곧 안도.' :
'생각이 행동보다 먼저인 사람. 신중한 게 아니라 안전한 거.'
}

${
topBottom.top1.axis === 'NS' ? '새로운 걸 찾아야 직성이 풀리는 사람이에요. 멈춰 있으면 불안한 거예요. 움직이는 게 이 사람의 안전장치.' :
topBottom.top1.axis === 'ST' ? '"왜?"라는 질문을 달고 사는 사람이에요. 답을 찾아야 마음이 놓이는 거예요. 질문이 곧 에너지원.' :
topBottom.top1.axis === 'SD' ? '남이 정해준 길은 불편한 사람이에요. 틀려도 직접 선택해야 납득이 되는 거예요. 자기 기준이 곧 자기 자신.' :
topBottom.top1.axis === 'CO' ? '혼자 밥 먹는 건 괜찮은데, 혼자 좋은 걸 보는 건 아까운 사람이에요. 나눌 때 비로소 완성되는 타입.' :
topBottom.top1.axis === 'P' ? '시작한 건 끝을 봐야 하는 사람이에요. 중간에 멈추면 잠이 안 와요. 완성이 곧 안도.' :
'움직이기 전에 세 번은 생각하는 사람이에요. 신중한 게 아니라, 확인해야 안심이 되는 거예요.'
}

${topBottom.top2.name}이 여기에 더해지면 조합이 독특해져요. 흔하지 않은 조합이에요.


**관계에서 보이는 패턴**
→ ${data.mbti_scores.E > data.mbti_scores.I ? '밝은 사람이라 불리지만, 속마음은 쉽게 꺼내지 않는 사람' : '마음을 여는 데 시간이 걸리지만, 한 번 열면 깊어지는 사람'}

${data.mbti_scores.E > data.mbti_scores.I ?
'사람들 사이에서 에너지를 받는 타입이에요. 대화를 이끌어가는 건 자연스러운데, 정작 속마음을 꺼내는 건 어려워요. "밝은 사람"이라 불리는 게 때로는 짐이 되는 거예요.' :
'소수의 사람과 오래 가는 관계를 만드는 타입이에요. 많은 사람을 만나면 에너지가 빠져요. 대신 한 번 마음을 연 사람에게는 놓지 않아요. 관계의 깊이가 곧 안전감.'}


**아무도 모르는 습관**
→ ${
topBottom.bottom.axis === 'HA' ? '모험을 즐기면서도 은근히 안정을 갈망하는 모순' :
topBottom.bottom.axis === 'CO' ? '혼자 있고 싶으면서도 혼자 남겨지는 건 싫은 마음' :
topBottom.bottom.axis === 'NS' ? '루틴을 좋아하면서도 가끔 전혀 다른 걸 해보고 싶은 충동' :
'표현하고 싶은 마음과 표현할 수 없는 마음 사이의 줄다리기'}

${
topBottom.bottom.axis === 'HA' ? '• 갑자기 여행지 검색을 시작해요. 예약까지는 안 하지만요. 가고 싶은 게 아니라, 떠날 수 있다는 가능성이 필요한 거예요.\n• 안정감을 몰래 찾고 있어요. 익숙한 것에 기대는 순간이 있어요. 모험가의 뒷면.' :
topBottom.bottom.axis === 'CO' ? '• 혼자 있는 시간이 필요하다고 말하면서, 아무도 연락 안 하면 슬쩍 핸드폰을 확인해요. 진짜 혼자가 되는 건 다른 문제.\n• 누군가 "괜찮아?"라고 물어주길 바라면서도, 먼저 말하진 않아요. 먼저 말하면 약해지는 것 같아서.' :
topBottom.bottom.axis === 'NS' ? '• 루틴이 있으면 마음이 놓여요. 예측 가능한 게 편한 거예요.\n• 그러면서도 가끔 전혀 다른 걸 시도하고 싶어져요. 안전한 울타리 안에서 모험을 꿈꾸는 사람.' :
'• 생각이 많은 밤에 메모장을 열어요. 다음 날 보면 의외로 솔직한 글이 적혀 있어요. 글로는 솔직해질 수 있는 사람.\n• 표현하고 싶은 마음과 표현하기 어려운 마음이 동시에 있어요. 이 갈등이 오히려 깊이를 만들어요.'}`,

    "4": `**${t.RD >= 50 ? '마음을 나누며 회복하는 사람' : '조용히 정리하며 회복하는 사람'}**


**스트레스를 받으면**
→ ${t.RD >= 50 ? '연결이 곧 회복인 사람. 혼자 버티는 건 오히려 더 힘들어요.' : '혼자 정리해야 비로소 돌아올 수 있는 사람.'}

${t.RD >= 50
? '힘든 날, 일단 누군가에게 연락해요. 대단한 조언이 필요한 게 아니에요. "그랬구나"라는 한마디면 돼요. 혼자 버티는 게 더 무거운 사람이에요.'
: '힘든 날, 먼저 혼자가 돼요. 정리가 되면 그때 말해요. 감정을 정리하지 않은 채 꺼내면 통제력을 잃을까봐 두려운 거예요.'}

${t.HA >= 50
? '감정을 꺼내는 데 시간이 걸려요. 충분히 정리되기 전에는 입을 열기 어려운 사람이에요. 틀린 말을 할까봐.'
: '감정이 올라오면 바로 얼굴에 나타나는 편이에요. 숨기려고 해도 잘 안 돼요. 솔직한 게 아니라 숨기는 데 에너지가 더 드는 거예요.'}


**당신만의 회복법**
→ ${t.HA >= 50 ? '정리 → 공유 순서가 중요한 사람' : '행동이 곧 회복인 사람'}

✓ ${t.HA >= 50 ? '먼저 혼자 정리하는 시간. 그게 있어야 다음 단계로 갈 수 있어요. 정리 없이 움직이면 더 혼란스러워지니까요.' : '누군가와 이야기하는 것. 혼자 끙끙대면 오히려 더 꼬여요. 말로 꺼내야 비로소 형태가 보이는 타입.'}
✓ ${t.RD >= 50 ? '"그랬구나"라는 한마디. 공감이 약보다 잘 듣는 사람이에요. 판단이 아니라 수용이 필요한 거예요.' : '그냥 옆에 있어주는 것. 말 안 해도 괜찮은 시간. 존재 자체가 위로인 관계를 원하는 거예요.'}
✓ ${t.ST >= 50 ? '"이게 왜 힘들었지?" 이유를 찾으면 마음이 놓여요. 원인을 알면 통제할 수 있다는 안도감.' : '몸을 움직이는 게 효과 있어요. 생각을 멈추는 방법이 행동인 사람.'}


**리프레이밍**
→ ${t.RD >= 50 ? '감정을 잘 느끼는 건, 관계에서 가장 먼저 변화를 알아채는 능력' : '혼자 시간이 필요한 건, 관계를 오래 가게 하는 자기 관리 능력'}

${t.RD >= 50
? '감정을 잘 느끼는 건, 다른 사람의 감정도 잘 읽는다는 뜻이에요. 괜찮다고 말해도 표정이 다르면 알아채는 사람. 이 민감함이 관계에서 가장 빨리 문제를 발견하는 능력이에요.'
: '혼자 시간이 필요한 건, 자기 자신을 돌볼 줄 안다는 뜻이에요. 충전이 필요한 순간을 아는 것. 이 자기 인식이 오히려 관계를 오래 가게 하는 힘이에요.'}`,

    "5": `**${t.SD >= 50 ? '자유롭게, 의미 있게' : '안정적으로, 함께'}**


**성격의 뿌리**
→ ${
topBottom.top1.axis === 'ST' ? '질문이 멈추지 않는 성격. 답을 찾는 과정 자체가 존재 이유.' :
topBottom.top1.axis === 'SD' ? '자기 방식이 있는 성격. 틀려도 직접 선택해야 납득되는 사람.' :
topBottom.top1.axis === 'NS' ? '변화를 두려워하지 않는 성격. 새로움이 곧 에너지원.' :
topBottom.top1.axis === 'CO' ? '함께할 때 비로소 완성되는 성격. 연결이 곧 안전감.' :
'끝까지 해내야 놓이는 성격. 완성이 곧 안도.'
}

${
topBottom.top1.axis === 'ST' ? '어디서부터 이런 사람이 됐는지 정확히는 몰라요. 하지만 분명한 건, 답을 찾아야 마음이 놓이는 패턴이 오래됐다는 거예요. 질문이 멈추지 않는 게 피곤할 때도 있지만, 그게 없으면 삶이 밋밋해져요.' :
topBottom.top1.axis === 'SD' ? '자기 방식이 있는 성격이에요. 누군가 "이렇게 해"라고 하면 일단 반발심이 올라와요. 틀려도 직접 선택해야 납득이 되는 거예요. 독립심이라고 부를 수 있지만, 사실은 통제력을 잃는 게 두려운 거예요.' :
topBottom.top1.axis === 'NS' ? '변화 앞에서 설레는 사람이에요. 새로운 환경, 새로운 사람. 그게 두렵지 않아요. 오히려 같은 자리에 오래 있으면 답답해져요. 움직이는 게 이 사람의 안전장치.' :
topBottom.top1.axis === 'CO' ? '함께할 때 비로소 완성되는 타입이에요. 좋은 걸 혼자 경험하면 아까운 사람. 나누는 게 사치가 아니라 필수인 거예요.' :
'한 가지를 끝까지 해내야 놓이는 성격이에요. 중간에 멈추면 미완의 감각이 계속 따라다녀요. 완성이 곧 안도인 사람.'}


**지금의 당신**
→ ${
topBottom.top1.axis === 'ST' ? '질문이 바뀌었을 뿐, 답을 찾는 사람인 건 변함없다' :
topBottom.top1.axis === 'SD' ? '흔들려도 결국 자기 방식으로 돌아오는 사람' :
topBottom.top1.axis === 'NS' ? '자극이 아니라 의미를 찾는 방향으로 진화 중' :
topBottom.top1.axis === 'CO' ? '아무나가 아니라, 진짜 연결되는 사람을 찾는 중' :
'꾸준히 쌓아온 것들이 조용히 힘이 되고 있는 사람'
}

${
topBottom.top1.axis === 'ST' ? '여전히 답을 찾고 있어요. 다만 질문이 바뀌었을 뿐. "어떻게 살아야 하지?"에서 "누구와 살아야 하지?"로. 혼자 답을 찾는 건 잘하는데, 함께 답을 만들어가는 건 아직 연습 중.' :
topBottom.top1.axis === 'SD' ? '자기 기준이 있는 사람이에요. 흔들릴 때도 있지만, 결국 자기 방식으로 돌아와요. 이 고집이 때로는 외로움을 만들기도 해요. 기준을 낮추면 편할 텐데, 그러면 자기가 아닌 것 같으니까요.' :
topBottom.top1.axis === 'NS' ? '여전히 새로운 걸 찾고 있어요. 다만 이제는 자극이 아니라 의미를 찾는 쪽으로 방향이 바뀌고 있어요. 깊어지는 게 무섭지 않아지기 시작한 거예요.' :
topBottom.top1.axis === 'CO' ? '여전히 사람이 중요해요. 다만 아무나가 아니라, 진짜 연결되는 사람을 찾고 있어요. "많이" 보다 "제대로"가 중요해진 거예요.' :
'꾸준히 쌓아온 것들이 있어요. 눈에 보이지 않아도, 당신은 알고 있죠. 이 묵묵함이 나중에 가장 큰 자산이 될 거예요.'}


**앞으로의 당신**
→ ${t.SD >= 50 && t.ST >= 50 ? '의미 있는 하루의 반복. 그리고 그 옆에 말 없이 함께 있는 사람.' : t.CO >= 50 ? '거창한 성공이 아니라, 편안한 일상의 반복이 이 사람의 행복.' : '멈추지 않는 여정 자체가 보상인 사람.'}

${t.SD >= 50 && t.ST >= 50 ?
`의미 있는 하루가 반복되는 삶을 원해요. 거창한 목표가 아니라, 오늘 하루가 의미 있었다는 감각. 그게 쌓이면 괜찮은 인생이 되는 거예요.

그 옆에 누군가가 있으면 좋겠다는 마음이 있어요. 같이 뭘 하지 않아도 괜찮은 사이. 존재만으로 충분한 관계.` :
t.CO >= 50 ?
`함께하는 일상이 반복되는 삶을 원해요. 거창한 성공이 아니에요. 오늘 있었던 일을 나누고, 별것 아닌 것에 웃는 시간. 그런 게 쌓이면 행복해지는 사람이에요.

이 바람이 소박해 보이지만, 사실은 꽤 어려운 거예요. "편안한 관계"가 가장 어렵다는 걸 아는 사람.` :
`멈추지 않는 삶을 원해요. 새로운 시도, 새로운 방향. 그 여정 자체가 보상인 사람이에요.

다만 혼자 가는 길이 가끔은 외로울 수 있어요. 함께 걸어도 각자의 속도를 존중하는 사람이 옆에 있으면. 그게 이상적인 거예요.`}`,

    "6": `**도저히 참기 힘든 것**

${t.ST >= 50 ? '"별일 없어"로 끝나는 대화.' : t.HA >= 50 ? '갑자기 바뀌는 계획.' : '매일 쏟아지는 감정.'}


**왜 이게 힘든지**
→ ${t.ST >= 50 ? '대화의 깊이가 곧 관계의 깊이인 사람. 표면에서 머무는 건 혼자인 것과 같다.' : t.HA >= 50 ? '예측 가능성이 곧 안전감인 사람. 급변하는 건 통제력을 잃는 느낌.' : '감정적 공간이 필요한 사람. 빼앗기면 자기를 잃어버리는 느낌.'}

${t.ST >= 50 ?
`"별일 없어"가 반복되면, 마음이 멀어지는 걸 느껴요. 대화가 단순한 정보 교환이 아니거든요. 서로의 안쪽을 꺼내는 시간이에요. 그게 안 되면 같은 공간에 있어도 혼자인 거예요. 깊이가 곧 연결인 사람.` :
t.HA >= 50 ?
`갑자기 계획이 바뀌면, 당신 안에서는 작은 지진이 일어나요. 유연하지 못한 게 아니에요. 충분히 준비해서 좋은 시간을 만들고 싶은 마음이 큰 거예요. 예측 가능성이 곧 안전감인 사람.` :
`상대가 매일 감정을 쏟아내면, 슬쩍 뒷걸음질 치게 돼요. 냉정한 게 아니에요. 각자의 공간이 있어야 관계가 숨 쉴 수 있다는 걸 아는 거예요. 감정적 공간이 곧 자기 보호.`}


**이 패턴이 관계에서 나타나는 방식**
→ ${t.ST >= 50 ? '상대가 깊이를 원하지 않으면, 먼저 문을 닫게 된다' : t.HA >= 50 ? '변화 앞에서 웃으면서도 속으로는 무너지는 패턴' : '돌봄을 주고도 돌봄을 못 받는 관계의 불균형'}

${t.ST >= 50 ? '깊은 대화를 원하는데 상대가 거기까지 와주지 않으면, 실망이 쌓여요. 그리고 어느 순간 먼저 문을 닫게 돼요. "왜 깊이 파고들어?"라는 반응이 나오면, 더 이상 시도하지 않는 거예요. 거절당한 게 아니라 이해받지 못한 느낌.' : t.HA >= 50 ? '계획이 바뀌어도 겉으로는 "그래, 괜찮아"라고 해요. 하지만 속으로는 허탈함이 밀려와요. 이런 일이 반복되면, 점점 기대 자체를 줄이게 돼요. 기대를 줄이는 게 자기 보호인 거예요.' : '상대가 힘들 때 온 신경을 쏟아요. 그런데 정작 자기가 힘들 때는 말을 못 해요. 도움을 요청하면 짐이 될 것 같으니까요. 이 불균형이 오래되면 지쳐요.'}


**하지만 이것이 강점이에요**
→ ${t.ST >= 50 ? '깊이를 추구하는 사람은, 진짜 관계를 만들 수 있는 사람' : t.HA >= 50 ? '안정을 만드는 사람은, 관계를 안전하게 지키는 사람' : '경계를 지키는 사람은, 관계를 오래 유지하는 사람'}

${t.ST >= 50 ? '깊이를 원하는 사람은 피상적인 관계에서 시간을 낭비하지 않아요. 진짜 연결을 만들 수 있는 능력이에요.' : t.HA >= 50 ? '안정을 만드는 사람은, 옆에 있으면 편안해지는 사람이에요. 이 안정감이 관계의 토대가 돼요.' : '경계를 지킬 줄 아는 사람은, 관계를 오래 유지할 수 있는 사람이에요. 자기를 잃지 않으면서 사랑하는 법을 아는 거예요.'} 불편함을 느낀다는 것 자체가 관계에 진심이라는 뜻이에요.`,

    "7": `**당신의 완벽한 파트너**

"${h.variant === 'extrovert' ? h.metaphor_e : h.metaphor_i}"


**${h.category} — ${h.subcategory}**
→ ${h.variant === 'extrovert' ? '에너지가 있지만 가볍지 않은 사람. 함께 있으면 리듬이 생기는 타입.' : '말이 적지만 비어 있지 않은 사람. 알수록 놓치기 싫어지는 타입.'}

${h.description}


**이 사람이 옆에 있으면**
→ ${h.variant === 'extrovert' ? '편안함이 먼저 오고, 그 다음에 깊이가 보이는 관계' : '조용함 속에서 무게감을 느끼는 관계'}

${h.variant === 'extrovert'
? '처음에는 편안함이 와요. 말이 잘 통한다는 느낌. 그런데 시간이 지나면 알게 돼요. 이 사람이 밝기만 한 게 아니라는 걸. 진지한 대화도 할 수 있는 사람이에요. 가벼움과 깊이를 동시에 가진 사람.'
: '처음에는 말이 많지 않아서 잘 모르겠어요. 그런데 한마디를 할 때 무게가 있어요. 시간이 지나면 알게 돼요. 이 사람의 침묵이 비어 있는 게 아니라 꽉 차 있다는 걸.'}

같이 있으면 달라지는 게 있어요. ${h.variant === 'extrovert' ? '혼자 있을 때보다 웃는 일이 많아져요. 그게 자연스러운 거예요.' : '혼자 있을 때보다 마음이 놓여요. 말을 안 해도 괜찮다는 감각.'}


**왜 이 사람인가**
→ 당신이 서투른 영역을 이 사람이 자연스럽게 채워주는 구조

당신이 잘하는 것과 서투른 것. 이 사람은 그 서투른 쪽을 채워줄 수 있는 유형이에요. 의도한 게 아니라, 데이터가 그렇게 말하고 있어요. 서로의 빈 곳을 채우는 게 아니라, 서로의 빈 곳을 인정하는 관계.`,

    "8": `**파트너 프로필**

유형: ${h.name}
카테고리: ${h.category} — ${h.subcategory}
성향: ${h.variant === 'extrovert' ? '외향형' : '내향형'}
매칭 점수: ${scorePercent}%


**이런 사람이에요**
→ ${h.variant === 'extrovert' ? '에너지가 있지만 시끄럽지 않은 사람. 함께 있으면 자연스럽게 리듬이 생겨요.' : '말이 적지만 안이 꽉 찬 사람. 알수록 놓치기 싫어지는 타입.'}

${h.variant === 'extrovert'
? '에너지가 있는 사람이에요. 시끄러운 게 아니라, 옆에 있으면 리듬이 생기는 느낌. 진지한 대화도 잘 해요. 가벼움 뒤에 깊이가 있는 사람.'
: '말이 적은 사람이에요. 비어 있는 게 아니라, 안이 꽉 찬 사람. 알면 알수록 놓치기 싫어져요. 침묵이 불편하지 않은 사이를 만들 수 있는 사람.'}


**함께하면 이런 패턴이에요**

【패턴 1】 편안한 시간
→ ${h.variant === 'extrovert' ? '함께 움직이는 게 이 사람의 사랑 표현' : '같은 공간에서 각자의 시간을 보내는 게 이 사람의 사랑 표현'}
${h.variant === 'extrovert'
? '같이 뭔가를 하자고 해요. 대단한 게 아니어도 돼요. 같이 걷는 것, 같이 먹는 것. 함께 움직이는 게 이 사람의 연결 방식이에요.'
: '같은 공간에 있으면서 각자의 시간을 보내요. 가끔 좋은 문장을 읽어주는 정도. 이 거리감이 이 사람의 사랑 방식이에요.'}

【패턴 2】 갈등 후
→ ${h.variant === 'extrovert' ? '행동으로 화해하는 타입. 말보다 먼저 움직여요.' : '말 대신 행동으로 사과하는 타입. 조용하지만 확실해요.'}
${h.variant === 'extrovert'
? '당신 표정이 바뀐 걸 금방 알아채요. 말보다 먼저 움직이는 타입이에요. 이 사람에게 화해란 "같이 뭔가 하자"는 거예요. 감정을 말로 정리하기보다 행동으로 풀어내는 사람.'
: '먼저 말 걸진 않아요. 대신 당신이 좋아하는 걸 슬쩍 챙겨놓아요. 말 없는 사과. 이 사람의 미안함은 행동으로 나와요. 말로 표현하면 어색해지니까요.'}

【패턴 3】 오래된 관계
→ ${h.variant === 'extrovert' ? '시간이 지나도 서로에게 가장 재밌는 사람이 될 수 있는 관계' : '시간이 지나면 말 없이도 통하는 관계가 될 수 있어요'}
${h.variant === 'extrovert'
? '시간이 지나도 함께하는 게 재밌는 사이가 돼요. 새로운 걸 같이 찾으려는 에너지가 관계를 신선하게 유지해요.'
: '시간이 지나면 말 없이도 통하는 사이가 돼요. 서로의 침묵을 이해하는 데까지 도달한 관계.'}


**같이 잘 지내려면**
→ 서로에게 기대는 것도 사랑의 일부

• ${h.variant === 'extrovert'
? '이 사람에게는 함께하는 시간이 사랑의 언어예요. 가끔은 같이 움직여주세요. 그게 이 사람에게 "사랑해"와 같은 말이에요.'
: '이 사람에게는 혼자만의 시간이 필요해요. 거리두기가 아니에요. 충전이에요. 이걸 이해하면 관계가 편해져요.'}
• 당신이 서투른 부분을 이 사람이 채워주듯, 이 사람도 당신에게 기대고 싶은 순간이 있어요. 기대게 해주는 것도 사랑이에요.`,

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
  const fallbackCards = generateFallbackCards(extendedCardData);
  try {
    cardContents = await generateAllCardsAtOnce(extendedCardData);
    // LLM이 생성해야 할 카드: 2,3,4,5,6,7,8 = 7장 (+ 타이틀 키 2개 = 최소 9개 키)
    if (!cardContents || Object.keys(cardContents).length < 7) {
      console.log('[Phase 1] Incomplete AI response, using fallback');
      cardContents = fallbackCards;
    } else {
      // 누락된 카드 키를 fallback으로 채우기 (배치 JSON 파싱 실패 대비)
      for (const key of Object.keys(fallbackCards)) {
        if (!cardContents[key] || cardContents[key].length < 50) {
          console.log(`[Phase 1] 카드 키 "${key}" 누락/부족 → fallback 사용`);
          cardContents[key] = fallbackCards[key];
        }
      }
    }
  } catch (err) {
    console.error('[Phase 1] Card generation failed, using fallback:', err);
    cardContents = fallbackCards;
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
