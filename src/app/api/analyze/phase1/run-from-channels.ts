import type { SupabaseClient } from '@supabase/supabase-js';
import { categorizeChannels } from '@/lib/husband-match/analysis/categorize-channels';
import { calculateTCI } from '@/lib/husband-match/analysis/calculate-tci';
import { estimateEnneagram } from '@/lib/husband-match/analysis/estimate-enneagram';
import { estimateMBTI } from '@/lib/husband-match/analysis/estimate-mbti';
import { createVector } from '@/lib/husband-match/analysis/create-vector';
import { matchHusbandType, estimatePartnerCategories, type PartnerCategory } from '@/lib/husband-match/analysis/match-husband-type';
import { calculateSaju, getSajuRelationshipInsights, type BirthInfo, type SajuResult } from '@/lib/husband-match/analysis/saju-calculator';
import {
  runYouTubeAnalysis,
  generateBarChart,
} from '@/lib/husband-match/analysis/youtube-analysis';
import { chatCompletion, safeJsonParse } from '@/lib/gemini-client';
import { SYSTEM_PROMPT } from '@/lib/husband-match/prompts/system-prompt';
import { getWritingToneDirective } from '@/lib/writing-guide';
import { PARTNER_JOBS } from '@/lib/husband-match/data/partner-jobs';
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

// 카드 1 고정 텍스트 (브릿지 카드 A — 화학 반응 인트로)
const CARD_1_FIXED_CONTENT = `서로 다른 두 사람이 만나서 함께 살아간다는 건, 전혀 다른 분자 두 개가 만나 화학 반응을 일으키는 것과 비슷해요.

연애할 때는 괜찮았던 것들이, 함께 사는 환경에서는 반응하기 시작해요. 생각지 못한 곳에서. 예상 못한 타이밍에.

그때 영향을 주는 것들이 있어요. 기본 성격과 기질. 세상을 바라보는 시선. 관계에서 반복되는 패턴. 갈등을 마주하는 방식. 압력을 받았을 때의 반응. 도저히 참을 수 없는 것. 그리고 행복의 정의.

이 모든 게 반응의 조건이에요.

YouTube 구독 목록은 아무도 보지 않을 때의 당신이에요. 타인 앞에서는 꽤 잘 포장하지만, 혼자 보는 화면 앞에서만큼은 정직해지니까요. 세상을 바라보는 시선을 가장 솔직하게 보여주는 데이터예요.

이 리포트는 당신이 어떤 분자인지 알려줄 거예요. 함께 살아가는 환경에서 어떤 반응을 일으키는 사람인지.

왜 그런 반응을 일으키는지는, 조금 더 깊이 들어가야 알 수 있어요. 우선은, 당신이 어떤 분자인지부터 알아볼게요. 다음 장에서 시작합니다.`;

// 카드 9 고정 텍스트 (브릿지 카드 B — Phase 2 CTA)
function getCard9FixedContent(channelCount: number): string {
  return `여기까지가 1단계였어요.

구독 채널 ${channelCount}개로 당신에 대해 이런 것들을 알아봤어요.

• 당신의 기본 성격과 기질
• 세상을 바라보는 시선
• 관계에서 반복되는 패턴과 갈등 해결 방식
• 스트레스를 받았을 때의 반응
• 참을 수 없는 것과 행복하게 만드는 것
• 그리고 당신에게 맞는 파트너

이게 1단계예요. 나는 어떤 사람을 만났을 때 어떻게 반응하는 사람인가.


2단계에서는 한 걸음 더 들어가요.

나의 이 성격, 이 반응 패턴은 어디서부터 비롯된 걸까.
내가 인생에서 진짜 추구하는 가치는 뭘까.
무의식에 잠들어 있는 욕구가 뭘까.
매번 같은 지점에서 멈추게 하는 생각 패턴은 뭘까.
그 생각 패턴을 만들어낸 핵심 신념은 뭘까.
그게 지금 내 관계에 어떤 영향을 미치고 있을까.
내가 가장 두려워하는 것은 뭘까.
누구와도 잘 살기 위해 내가 성장할 수 있는 포인트는 뭘까.

이런 것들을 알아보는 게 2단계예요.


**진행 방식**

1. 18개의 심층 질문에 답변
2. YouTube 데이터와 교차 검증
3. 10장의 심층 리포트 카드 제공


**[ 심층 분석 시작하기 — ₩9,900 ]**


* 심리학적 연구를 기반으로 하지만, 전문 심리 검사를 대체하지 않아요.
* 자기 이해를 위한 콘텐츠로 즐겨주세요.`;
}

// 9장 카드 타이틀
const CARD_TITLES: Record<number, { title: string; subtitle?: string; card_type: ReportCard['card_type'] }> = {
  1: { title: '서로 다른 두 분자가 만나면', subtitle: 'INTRO', card_type: 'intro' },
  2: { title: '', subtitle: '구독 데이터 개요', card_type: 'intro' },
  3: { title: '', subtitle: '', card_type: 'personality' },
  4: { title: '같은 상황, 같은 반응 — 이유가 있어요', subtitle: '관계 패턴', card_type: 'personality' },
  5: { title: '압력을 받으면 당신은 이렇게 반응해요', subtitle: '스트레스 반응', card_type: 'personality' },
  6: { title: '견디기 힘든 것, 그리고 행복하게 만드는 것', subtitle: '관계 인사이트', card_type: 'values' },
  7: { title: '당신의 완벽한 파트너', subtitle: '매칭 결과', card_type: 'matching' },
  8: { title: '당신의 배우자는 이런 사람이에요', subtitle: '매칭 결론', card_type: 'matching' },
  9: { title: '여기까지가 1단계였어요', subtitle: 'Phase 2 안내', card_type: 'result' },
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
  partnerCategories?: PartnerCategory[];
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

## ⚠️ 문체: "깊은" 최대 1회. "~합니다" 금지 → "~예요". 파편 문장 8개+.
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

## ⚠️ 문체: "깊은" 최대 1회. "~합니다" 금지 → "~예요". 파편 문장 8개+.
## ⚠️ 필수: 1,500자 이상 1,750자 이하로 작성하세요. 1,500자 미만은 불합격입니다!
## ⚠️ 분량이 부족하면: 보편적으로 공명하는 행동 패턴 + 인사이트를 추가하세요. 틀릴 수 있는 구체적 상황(시간대, 장소, 직업 등)을 특정하지 마세요.
## ⚠️ 유튜브 채널명을 절대 쓰지 마세요. 사주 용어(화, 토, 오행 등)를 절대 쓰지 마세요. TCI 점수(숫자)를 절대 쓰지 마세요.
## ⚠️ 행동 패턴을 보여준 뒤, "왜 이런 행동을 하는지" 인사이트 한 줄로 꿰뚫으세요.
## ⚠️ 각 볼드 섹션 타이틀 바로 아래에 "→ 핵심 요약 한 줄"을 넣으세요.

${getWritingToneDirective('balanced')}

${context}

## 카드 3: 기본 성격과 기질 — 핵심 정체성 + 세계관
이 카드는 "근본 정체성", "세계관", "내면의 모순"에 집중합니다.

- "3_subtitle": 영어 타입명 3-5단어 (예: "Quiet Storm, Steady Ground")
- "3_title": "${data.userName ? `${data.userName}님은` : '당신은'} {한국어 한 줄 정의} 타입이에요"
  · ${topBottom.top1.name}(1위)과 ${topBottom.top2.name}(2위) 조합 기반
- "3": 본문 (1500-1750자) — 아래 구조를 반드시 포함:
  1) **해시태그 3개**
  2) **"당신의 기본 성격"** — → 요약 한 줄 + 2문단. 겉으로 보이는 모습(표면)과 속마음(내면)의 차이. 행동 패턴 1개 + 인사이트 1줄.
  3) **"세상을 바라보는 렌즈"** — → 요약 한 줄 + 1문단. YouTube 구독에서 드러나는 세계관. 어떤 콘텐츠에 끌리는가 = 어떤 시선으로 세상을 보는가. TCI 상위 축과 카테고리 분포에서 추론. (채널명 직접 언급 금지, 카테고리 특징으로만)
  4) **"내면의 모순"** — → 요약 한 줄 + 1문단. "~하고 싶으면서도 ~도 원하는" 형태의 갈등.
  5) **"관계에서의 당신"** — → 요약 한 줄 + 1문단. 관계에서 반복되는 기본 행동 패턴 + 왜 그런지 인사이트.

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

// 배치 B2: 카드 4 — "관계 패턴과 갈등 해결" — contextPersonality 사용
async function generateBatchB2(data: ExtendedCardData, context: string): Promise<Record<string, string>> {
  const prompt = `아래 분석 데이터를 바탕으로 리포트 카드 내용을 JSON으로 생성해주세요.

## ⚠️ 문체: "깊은" 최대 1회. "~합니다" 금지 → "~예요". 파편 문장 8개+.
## ⚠️ 필수: 1,500자 이상 1,750자 이하로 작성하세요. 1,500자 미만은 불합격입니다!
## ⚠️ 분량이 부족하면: 보편적으로 공명하는 행동 패턴 + 인사이트를 추가하세요. 틀릴 수 있는 구체적 상황(시간대, 장소, 직업 등)을 특정하지 마세요.
## ⚠️ 유튜브 채널명 금지. 사주 용어 금지. TCI 점수 금지.
## ⚠️ 카드 3에서 이미 "기본 성격", "세계관", "내면의 모순"을 다뤘습니다. "관계 패턴"과 "갈등 해결 방식"에만 집중하세요.
## ⚠️ 행동 패턴을 보여준 뒤, "왜 이런 행동을 하는지" 인사이트 한 줄로 꿰뚫으세요.
## ⚠️ 각 볼드 섹션 타이틀 바로 아래에 "→ 핵심 요약 한 줄"을 넣으세요.

${getWritingToneDirective('balanced')}

${context}

## 카드 4: 관계 패턴과 갈등 해결 — 같은 상황, 같은 반응

- "4": 본문 (1500-1750자) — 아래 구조를 반드시 포함:
  1) **"평소 관계에서의 당신"** — → 요약 한 줄(비유/상징 표현 사용. "~하는 사람" 금지. 예: "관객에게 박수를 보내면서 자기 마이크는 꺼두는 사람", "모두의 우산이 되어주지만 정작 자기는 비를 맞는 사람") + 일상적 관계 행동 패턴 2개 + 각각에 인사이트. RD/CO 조합에서 도출: 관계에서 어떤 역할을 맡는지, 어떤 방식으로 사람을 대하는지.
  2) **"갈등이 오면"** — → 요약 한 줄(비유 사용) + 1문단. 갈등 해결 방식(HA/SD/CO 조합). 회피형/직면형/타협형 중 이 사람의 패턴. 행동으로 묘사.
  3) **"이 패턴이 반복되는 방식"** — → 요약 한 줄(비유 사용) + 1문단. 관계에서 반복되는 행동 사이클. "처음엔 ~하다가, ~하게 되고, 결국 ~하는 패턴"
  4) **"이렇게 생각할 수도 있어요"** — → 요약 한 줄(비유 사용) + 1문단. 이 반복 패턴이 사실은 관계에서 이 사람이 중요하게 여기는 것을 보호하려는 전략이라는 인사이트. ("리프레이밍" 단어 사용 금지)

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

// 배치 C: 카드 5(스트레스 반응) + 6(참을 수 없는 것 + 행복 공식) — contextPersonality 사용
async function generateBatchC(data: ExtendedCardData, context: string): Promise<Record<string, string>> {
  const prompt = `아래 분석 데이터를 바탕으로 2개의 리포트 카드 내용을 JSON으로 생성해주세요.

## ⚠️ 문체: "깊은" 최대 1회. "~합니다" 금지 → "~예요". 파편 문장 8개+.
## ⚠️ 필수: 각 카드는 반드시 1,500자 이상 1,750자 이하로 작성하세요. 1,500자 미만은 불합격입니다!
## ⚠️ 분량이 부족하면: 보편적으로 공명하는 행동 패턴 + 인사이트를 추가하세요. 틀릴 수 있는 구체적 상황(시간대, 장소, 직업 등)을 특정하지 마세요.
## ⚠️ 유튜브 채널명 금지. 사주 용어 금지. TCI 점수 금지.
## ⚠️ 카드 3에서 "기본 성격/세계관/내면의 모순"을, 카드 4에서 "관계 패턴/갈등 해결"을 이미 다뤘습니다. 같은 내용을 반복하지 마세요.
## ⚠️ 행동 패턴을 보여준 뒤, "왜 이런 행동을 하는지" 인사이트 한 줄로 꿰뚫으세요.
## ⚠️ 각 볼드 섹션 타이틀 바로 아래에 "→ 핵심 요약 한 줄"을 넣으세요.

${getWritingToneDirective('balanced')}

${context}

## 카드 5: 스트레스 반응 — 압력을 받으면 당신은 이렇게 반응해요 (1500-1750자)
- "5": 아래 구조를 반드시 포함:
  1) **한 줄 정의** — 스트레스 반응 핵심
  2) **"당신이 화가 나면"** — → 요약 한 줄(비유/상징 표현 사용. "~하는 사람" 금지. 예: "폭풍 속에서 닻을 내리는 배", "혼자 방에 들어가 마음의 서랍을 정리한 뒤에야 문을 여는 사람") + 2문단. 감정 억제/폭발 패턴. 행동 패턴 2가지 + 각각에 인사이트. (HA/RD/ST 조합 기반)
  3) **"한계가 오는 순간"** — → 요약 한 줄(비유 사용) + 불릿 2개. 트리거 행동 패턴을 구체적으로. (시간/장소 특정 금지)
  4) **"당신만의 회복법"** — → 요약 한 줄(비유 사용) + ✓ 체크리스트 3개. 행동 묘사만 (채널명 없음).
  5) **"하지만 이렇게 볼 수도 있어요"** — → 요약 한 줄(비유 사용) + 1문단. 이 스트레스 반응이 사실은 자기를 보호하는 메커니즘이라는 인사이트. ("리프레이밍" 단어 사용 금지)

## 카드 6: 참을 수 없는 것 + 행복 공식 — 견디기 힘든 것, 그리고 행복하게 만드는 것 (1500-1750자)
- "6": 아래 구조를 반드시 포함:
  1) **"이런 사람 만나면 숨이 막혀요"** — → 요약 한 줄 + 딜브레이커 패턴 2개 + 각각에 인사이트.
  2) **"이 패턴이 관계에서 나타나는 방식"** — → 요약 한 줄 + 1문단. 보편적 행동 패턴으로 묘사. ★ 과거 경험 추측 금지.
  3) **"당신을 행복하게 만드는 것"** — → 요약 한 줄 + 1문단. TCI 상위 축에서 도출한 행복의 조건. "당신에게 행복이란 ___한 상태예요." 구체적 행동/감각으로 묘사.
  4) **"강점으로 읽기"** — → 요약 한 줄(비유 사용) + 1문단. 참을 수 없는 것과 행복의 조건이 사실 같은 뿌리라는 인사이트. ("리프레이밍" 단어 사용 금지)

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
  const topBottom = data.topBottom;

  // 배우자 추정 구독 카테고리 + 채널 (카드 8 "이 사람의 유튜브에는" 섹션용)
  const partnerCats = data.partnerCategories || [];
  const partnerChannelsPrompt = partnerCats.length > 0
    ? partnerCats.map((pc, i) => `  ${i + 1}. ${pc.categoryName}: ${pc.channels.join(', ')} — "${pc.description}"`).join('\n')
    : '  (추정 카테고리 없음)';

  const prompt = `아래 분석 데이터를 바탕으로 2개의 리포트 카드 내용을 JSON으로 생성해주세요.

## ⚠️ 문체: "깊은" 최대 1회. "~합니다" 금지 → "~예요".
## ⚠️ 필수: 각 카드는 반드시 1,500자 이상 1,750자 이하로 작성하세요. 1,500자 미만은 불합격입니다!
## ⚠️ 분량이 부족하면: 보편적으로 공명하는 행동 패턴 + 인사이트를 추가하세요. 틀릴 수 있는 구체적 상황(시간대, 장소, 직업 등)을 특정하지 마세요.
## ⚠️ "왕자님" 대신 반드시 "완벽한 파트너"를 사용하세요.
## ⚠️ 유튜브 채널명 금지. 사주 용어 금지. TCI 점수 금지.
## ⚠️ 카드 3-6에서 이미 다룬 성격/관계/스트레스/행복 특성을 재설명하지 마세요. "파트너"에 대해서만 이야기합니다.
## ⚠️ 행동 패턴을 보여준 뒤, "왜 이런 행동을 하는지" 인사이트 한 줄로 꿰뚫으세요.
## ⚠️ 각 볼드 섹션 타이틀 바로 아래에 "→ 핵심 요약 한 줄"을 넣으세요.

### 카드 7 톤
${getWritingToneDirective('balanced')}

### 카드 8 톤 (별도 적용)
${getWritingToneDirective('persuasive')}

${context}

## 카드 7: 당신의 완벽한 파트너 — 왜 이 사람인가 (1500-1750자)
## ⚠️ 카드 7은 파편 문장 8개+.
- "7": 아래 구조를 반드시 포함:
  1) **비유 문구** — "${h.variant === 'extrovert' ? (h.metaphor_e || '') : (h.metaphor_i || '')}" 활용
  2) **유형 소개** — → 요약 한 줄 + "${h.category} - ${h.subcategory}". "${h.description}" 기반 1문단.
  3) **"이 사람이 옆에 있으면"** — → 요약 한 줄 + 2문단. 소설적 장면이 아니라, 이 파트너와 함께할 때 느껴지는 것/달라지는 패턴을 묘사. (구체적 장소/시간 특정 금지)
  4) **"왜 하필 이 사람인가"** — → 요약 한 줄 + 1문단. 당신이 서투른 영역을 이 사람이 어떻게 보완하는지 + 인사이트.

## 카드 8: 당신의 배우자는 이런 사람이에요 — 매칭 결론 (1500-1750자)

### 핵심 메시지
조곤조곤 설명하듯 "왜 이 사람인지" 논리적으로 설득하세요. 단문 나열이 아니라, 2~3문장이 이어지는 설명체로 쓰세요.

### 추천 직업군/만남 장소 데이터 (카드 8에 삽입)
${(() => {
    const jobData = PARTNER_JOBS[h.category];
    if (!jobData) return '(데이터 없음)';
    return `- 추천 직업군: ${jobData.jobs.join(', ')}\n- 만남 장소: ${jobData.meetingPlaces.join(', ')}`;
  })()}

- "8": 아래 4섹션 구조를 반드시 포함:

  1) **"당신의 배우자는 이런 사람이에요"**
     → 요약 한 줄
     · 배우자 유형명(${h.name}), 카테고리(${h.category} > ${h.subcategory}), 성향(${h.variant === 'extrovert' ? '외향형' : '내향형'}) 소개
     · 이 파트너의 핵심 특성을 2~3문단으로 설명 (단문 나열 금지)
     · 톤: "이 파트너는 ~한 경향이 있어요. ~할 때 ~하는 타입이에요."

  2) **"당신이 이 사람을 만나야 하는 이유"**
     → 요약 한 줄
     · 사용자의 TCI 분석 결과를 근거로 매칭 이유를 논리적으로 설명
     · ${topBottom.top1.name}(1위, ${topBottom.top1.score}점) + ${topBottom.top2.name}(2위, ${topBottom.top2.score}점) 축 활용
     · ${topBottom.bottom.name}(최하위, ${topBottom.bottom.score}점) 축이 이 파트너에 의해 보완되는 이유
     · 각 축을 행동 패턴으로 풀어서 설명 (점수 직접 언급 금지)
     · ⚠️ 주어 혼동 방지 규칙:
       - 사용자 설명은 반드시 "당신은"으로 시작: "당신은 ~한 사람이에요"
       - 배우자 설명은 반드시 "이 파트너는"으로 시작: "이 파트너는 ~한 사람이에요"
       - 한 문단 안에서 사용자 설명과 배우자 설명을 섞지 마세요
       - 사용자 → 배우자로 전환할 때 "그래서 당신의 배우자는" 전환 문장을 반드시 넣으세요
     · 2~3문단, 논리적 흐름: "당신은 ~한 사람이에요 → 그래서 당신의 배우자는 ~한 사람이어야 해요 → 이 파트너가 바로 그런 사람이에요"

  3) **"당신의 배우자가 하고 있을 일"**
     → 요약 한 줄
     · 추천 직업군 데이터를 기반으로 각 직업이 이 파트너의 성향과 어떻게 연결되는지 한 줄씩 설명
     · 만남 장소를 자연스럽게 안내 (1문단)

  4) **"이 사람이 구독하고 있을 유튜브 채널"**
     → 요약 한 줄
     · 배우자 타입의 추정 구독 카테고리 TOP 3:
${partnerChannelsPrompt}
     · 각 카테고리별로 대표 채널 2~3개를 소개
     · 마무리: 운명의 한 줄 (15~25자, 인스타 바이럴용)

- "8_destiny_line": 운명의 한 줄 (15~25자) — 본문에도 포함하되, 별도 JSON 필드로도 반환

## 응답 형식 (JSON만)
{
  "7": "본문 1500자 이상",
  "8": "본문 1500자 이상",
  "8_destiny_line": "운명의 한 줄 15~25자"
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


**세상을 바라보는 렌즈**
→ ${
topBottom.top1.axis === 'ST' ? '의미를 찾는 렌즈. 콘텐츠도 관계도, "왜?"라는 질문을 통과해야 와닿는 사람.' :
topBottom.top1.axis === 'NS' ? '새로움을 찾는 렌즈. 다양한 콘텐츠를 탐색하는 것 자체가 세상을 이해하는 방식.' :
topBottom.top1.axis === 'SD' ? '자기만의 기준으로 바라보는 렌즈. 남들이 다 본다고 따라 보지 않는 사람.' :
topBottom.top1.axis === 'CO' ? '사람을 통해 바라보는 렌즈. 콘텐츠의 가치도 "누군가와 나눌 수 있는가"로 판단하는 사람.' :
'꾸준함의 렌즈. 한번 좋다고 느낀 건 끝까지 따라가는 사람.'}

${
topBottom.top1.axis === 'ST' ? '구독 목록에 자기계발이나 심리, 철학 관련 콘텐츠가 섞여 있어요. 단순한 재미보다 의미를 찾는 사람이에요. "이게 나한테 뭘 말해주지?"라는 질문이 자동으로 따라붙는 거예요.' :
topBottom.top1.axis === 'NS' ? '카테고리가 다양한 편이에요. 하나에 정착하지 않고 여러 분야를 넘나드는 건 호기심이 강한 거예요. 세상을 넓게 보고 싶은 사람.' :
topBottom.top1.axis === 'SD' ? '주류가 아닌 콘텐츠를 구독하는 경향이 있어요. 유행을 따르기보다 자기 기준으로 선택하는 사람. 그래서 취향이 독특한 거예요.' :
topBottom.top1.axis === 'CO' ? '사람 이야기에 끌리는 편이에요. 브이로그, 일상, 관계 콘텐츠. 정보보다 감정과 연결에 반응하는 사람이에요.' :
'한 분야를 오래 파고드는 편이에요. 구독한 채널을 쉽게 바꾸지 않아요. 꾸준함이 곧 신뢰인 사람.'}`,

    "4": `**${t.CO >= 50 ? '사람 사이에서 자기를 찾는 사람' : t.SD >= 50 ? '자기 영역을 지키며 사랑하는 사람' : '조용히 맞춰가며 관계를 만드는 사람'}**


**평소 관계에서의 당신**
→ ${t.CO >= 50 ? '무대 위에서 모두에게 박수를 보내지만, 정작 자기 마이크는 꺼두고 있는 사람' : t.SD >= 50 ? '자기만의 울타리를 세워두고, 그 안에서만 문을 여는 정원사 같은 사람' : '모두의 리모컨을 쥐고 있지만, 자기 채널은 한 번도 틀어본 적 없는 사람'}

${t.CO >= 50
? '• 상대의 감정을 빠르게 읽어요. "괜찮아"라고 말해도 표정이 다르면 알아채는 사람이에요. 공감이 자연스럽게 나오는 거예요. 다만 이 민감함이 에너지를 많이 써요.\n• 관계에서 먼저 연락하고, 먼저 안부를 물어요. 자연스러운 거예요. 다만 상대가 같은 정도로 돌려주지 않으면 서운함이 쌓이기 시작해요.'
: t.SD >= 50
? '• 관계에서도 자기 방식이 있어요. "이건 양보할 수 있지만, 저건 안 돼"라는 선이 분명한 사람. 이 선이 관계를 보호하기도, 갈등을 만들기도 해요.\n• 상대가 자기 결정을 존중해주면 마음이 열려요. 반대로 "왜 그래?"라는 반응이 오면 문이 닫혀요. 존중이 곧 사랑의 언어인 거예요.'
: '• 상대가 원하는 걸 먼저 파악하는 편이에요. 맞춰주는 게 자연스러운 사람. 다만 그게 오래되면 "나는 뭘 원하지?"라는 질문이 찾아와요.\n• 갈등을 피하는 편이에요. 참는 게 아니라, 부딪히는 게 에너지가 더 드는 거예요. 다만 참는 게 쌓이면 한 번에 터져요.'}


**갈등이 오면**
→ ${t.HA >= 50 ? '폭풍이 오면 먼저 닻을 내리는 배. 흔들리는 채로는 항해할 수 없는 사람.' : t.SD >= 50 ? '전쟁터에서도 자기 검을 고집하는 기사. 남의 무기로는 싸울 수 없는 사람.' : '전쟁터에서 상대의 갑옷부터 챙기는 기사. 자기 방패는 늘 뒤에 놓는 사람.'}

${t.HA >= 50
? '갈등이 오면 먼저 물러나요. 도망치는 게 아니에요. 감정이 정리되지 않은 상태에서 말하면 후회할 걸 아니까요. 경험으로 배운 거예요. 충분히 정리된 다음에 꺼내는 거예요. 다만 상대 입장에서는 "왜 말을 안 해?"로 보일 수 있어요. 그 시간이 당신에게는 준비인데, 상대에게는 침묵으로 느껴지는 거예요.'
: t.SD >= 50
? '갈등을 피하지는 않아요. 다만 자기 방식대로 풀고 싶은 마음이 강해요. 상대가 "일단 사과해"라고 하면 반발이 올라와요. 납득이 되어야 움직이는 사람이에요. 이건 고집이 아니에요. 자기 기준 없이 움직이면 오히려 더 혼란스러워지는 사람이에요.'
: '갈등 앞에서 한 발 물러서는 편이에요. 먼저 상대의 감정을 살펴요. "내가 잘못한 건 아닐까?"라는 생각이 먼저 찾아오는 거예요. 이게 관계를 부드럽게 만들기도 하지만, 그 과정에서 자기 감정은 자꾸 뒤로 밀려나요. 그래서 나중에 "내 감정은 언제 다루지?"라는 순간이 찾아오는 거예요.'}


**이 패턴이 반복되는 방식**
→ ${t.CO >= 50 ? '물을 계속 붓다가, 컵이 넘치는 줄 모르고, 어느 날 테이블이 젖어 있는 걸 발견하는 패턴' : t.SD >= 50 ? '성벽을 세우고 기다리다가, 누군가 넘으면 다리를 끊어버리는 패턴' : '고무줄처럼 늘어나다가, 어느 날 갑자기 끊어지는 패턴'}

${t.CO >= 50
? '처음엔 기꺼이 줘요. 자연스러운 거예요. 그런데 돌아오지 않으면 서운함이 조금씩 쌓여요. 말하지 않아요. "이 정도는 알아서 해주겠지"라고 생각하니까요. 그러다 어느 날 갑자기 터져요. 상대는 뜬금없다고 느껴요. 하지만 당신에게는 오래 쌓인 거예요.'
: t.SD >= 50
? '관계에서 선이 있어요. 이 선을 존중해주면 괜찮은데, 넘는 순간 태도가 변해요. 따뜻했던 사람이 갑자기 차가워지는 거예요. 상대는 혼란스러워요. 하지만 당신에게는 자기 보호예요.'
: '맞춰주고, 참고, 그러다 지치는 패턴이에요. 상대는 모를 수 있어요. 당신이 참고 있다는 걸. 그래서 어느 날 "나 지쳤어"라고 말했을 때 상대가 놀라는 거예요.'}


**이렇게 생각할 수도 있어요**
→ ${t.CO >= 50 ? '물을 주는 손이 마르기 전에, 누군가 그 손에도 물을 부어줄 수 있어요' : t.SD >= 50 ? '성벽은 관계를 지키는 힘이에요. 가끔 문을 열어두는 연습만 더하면 돼요.' : '나침반이 남쪽만 가리키고 있었을 뿐이에요. 북쪽도 있다는 걸 아는 것만으로 달라져요.'}

${t.CO >= 50
? '이 패턴은 결국 관계를 소중히 여기기 때문에 생기는 거예요. 많이 준다는 건, 그만큼 관계에 진심이라는 뜻이에요. 사랑하는 방식이 "주는 것"인 사람이에요. 다만 한 가지만 기억하면 돼요. 받는 것도 허락해야 균형이 잡힌다는 거예요. "나도 필요해"라고 말하는 게 관계를 약하게 만드는 게 아니에요. 오히려 그 한마디가 관계를 더 단단하게 만들어요.'
: t.SD >= 50
? '선을 긋는 건 관계를 안전하게 유지하려는 전략이에요. 자기를 잃지 않으면서 사랑하는 법을 아는 거예요. 그 자체로 이미 큰 능력이에요. 다만 가끔은 선 안으로 상대를 초대하는 연습이 필요해요. 선이 있다는 건 나쁜 게 아니에요. 다만 선 안에 누군가를 들이는 경험이 쌓이면, 선의 의미도 달라져요.'
: '맞추는 건 상대를 편안하게 만드는 능력이에요. 관계를 부드럽게 만드는 힘이 있는 사람이에요. 많은 사람이 갖고 싶어하는 능력이에요. 다만 자기 감정도 관계의 일부라는 걸 잊지 않았으면 해요. 당신의 목소리도 관계 안에서 들려야 해요. 그래야 오래 갈 수 있어요.'}`,

    "5": `**${t.RD >= 50 ? '마음을 나누며 회복하는 사람' : '조용히 정리하며 회복하는 사람'}**


**당신이 화가 나면**
→ ${t.RD >= 50 ? '다른 사람이라는 충전기에 연결해야 비로소 불이 들어오는 사람' : '혼자 방에 들어가 마음의 서랍을 정리한 뒤에야 문을 여는 사람'}

${t.RD >= 50
? '힘든 날, 일단 누군가에게 연락해요. 대단한 조언이 필요한 게 아니에요. "그랬구나"라는 한마디면 돼요. 그 한마디가 마음의 무게를 나눠주는 거예요. 혼자 버티는 게 더 무거운 사람이에요. 그래서 사람이 곧 약이에요.'
: '힘든 날, 먼저 혼자가 돼요. 정리가 되면 그때 말해요. 감정을 정리하지 않은 채 꺼내면 통제력을 잃을까봐 두려운 거예요. 정리되지 않은 말이 상대를 다치게 할 수도 있다는 걸 아는 사람이에요. 그래서 시간이 필요한 거예요.'}

${t.HA >= 50
? '감정을 꺼내는 데 시간이 걸려요. 충분히 정리되기 전에는 입을 열기 어려운 사람이에요. 틀린 말을 할까봐 두려운 거예요. 그래서 침묵하는 시간이 필요한 거예요.'
: '감정이 올라오면 바로 얼굴에 나타나는 편이에요. 숨기려고 해도 잘 안 돼요. 솔직한 게 아니에요. 숨기는 데 에너지가 더 드는 사람인 거예요.'}


**한계가 오는 순간**
→ ${t.HA >= 50 ? '탄탄하게 쌓아올린 블록 탑이 한순간에 무너지는 순간. 그게 이 사람의 한계점이에요.' : '용기를 내서 건넨 편지가 읽히지도 않고 돌아오는 순간. 그게 이 사람의 한계점이에요.'}

• ${t.HA >= 50 ? '갑자기 계획이 바뀌는 상황이에요. 유연하지 못한 게 아니에요. 준비한 만큼 좋은 시간을 만들고 싶은 마음이 큰 거예요. 그 준비가 무너지면 허탈한 거예요.' : '상대가 당신의 말을 가볍게 넘길 때예요. "별거 아닌데"라는 반응이 돌아오면, 말한 자체를 후회하게 돼요. 내 마음이 가볍게 취급받았다고 느끼는 거예요.'}
• ${t.ST >= 50 ? '"왜?"라는 질문에 "그냥"이라는 답이 돌아올 때예요. 이해하려는 노력이 벽에 부딪히는 거예요. 그 벽 앞에서 무력감이 밀려와요.' : '내 감정을 표현했는데 상대가 방어적으로 나올 때예요. 용기를 내서 열어놓은 문이 갑자기 닫히는 거예요. 다시 열기가 어려워져요.'}


**당신만의 회복법**
→ ${t.HA >= 50 ? '글을 다 쓴 뒤에야 보여줄 수 있는 작가 같은 마음. 초고 상태로는 아무에게도 보여주지 않는 사람.' : '멈춰 있으면 오히려 더 아픈 사람. 움직이는 게 곧 치유인 사람.'}

✓ ${t.HA >= 50 ? '먼저 혼자 정리하는 시간이에요. 그게 있어야 다음 단계로 갈 수 있어요. 정리 없이 움직이면 더 혼란스러워지는 사람이에요.' : '당신은 말로 꺼내야 비로소 형태가 보이는 사람이에요. 혼자 끙끙대면 오히려 더 꼬이는 거예요. 누군가와 이야기하는 게 가장 빠른 회복법이에요.'}
✓ ${t.RD >= 50 ? '"그랬구나"라는 한마디가 당신에게는 약보다 잘 들어요. 판단이 아니라 수용이 필요한 거예요. 공감이 곧 치료인 사람이에요.' : '그냥 옆에 있어주는 것이에요. 말 안 해도 괜찮은 시간이 필요해요. 존재 자체가 위로인 관계를 원하는 거예요.'}
✓ ${t.ST >= 50 ? '"이게 왜 힘들었지?" 이유를 찾으면 마음이 놓여요. 원인을 알면 통제할 수 있다는 안도감이 드는 거예요.' : '몸을 움직이는 게 효과 있어요. 생각을 멈추는 방법이 행동인 사람이에요. 움직이면 마음도 따라 움직여요.'}


**하지만 이렇게 볼 수도 있어요**
→ ${t.RD >= 50 ? '레이더가 예민한 만큼, 관계의 기상 변화를 가장 먼저 감지하는 기상캐스터 같은 사람' : '혼자 충전하는 시간이 있어야 다시 빛나는, 태양광 패널 같은 사람'}

${t.RD >= 50
? '감정을 잘 느끼는 건, 다른 사람의 감정도 잘 읽는다는 뜻이에요. 괜찮다고 말해도 표정이 다르면 알아채는 사람이에요. 이 민감함이 때로는 힘들 수 있어요. 하지만 이 능력이 관계에서 가장 빨리 문제를 발견하게 해줘요. 스트레스 반응은 자기를 보호하는 메커니즘이에요. 이걸 알고 있으면 달라져요.'
: '혼자 시간이 필요한 건, 자기 자신을 돌볼 줄 안다는 뜻이에요. 충전이 필요한 순간을 정확히 아는 거예요. 많은 사람이 이걸 몰라서 관계에서 지치는 거예요. 당신은 그걸 알고 있어요. 이 자기 인식이 오히려 관계를 오래 가게 하는 힘이에요. 스트레스 반응은 자기를 보호하는 메커니즘이에요.'}`,

    "6": `**이런 사람 만나면 숨이 막혀요**
→ ${t.ST >= 50 ? '"별일 없어"로 끝나는 대화가 반복되면 숨이 막히는 사람.' : t.HA >= 50 ? '갑자기 바뀌는 계획 앞에서 숨이 막히는 사람.' : '매일 쏟아지는 감정 앞에서 숨이 막히는 사람.'}

${t.ST >= 50 ?
`• "별일 없어"가 반복되면, 마음이 멀어지는 걸 느껴요. 대화가 단순한 정보 교환이 아니거든요. 서로의 안쪽을 꺼내는 시간이에요. 그게 안 되면 같은 공간에 있어도 혼자인 거예요.\n• "왜 그렇게까지 파고들어?"라는 반응이 오면, 더 이상 시도하지 않게 돼요. 거절당한 게 아니라 이해받지 못한 느낌.` :
t.HA >= 50 ?
`• 갑자기 계획이 바뀌면, 당신 안에서는 작은 지진이 일어나요. 충분히 준비해서 좋은 시간을 만들고 싶은 마음이 큰 거예요.\n• 약속을 가볍게 바꾸는 사람 앞에서 점점 기대를 줄이게 돼요. 기대를 줄이는 게 자기 보호인 거예요.` :
`• 상대가 매일 감정을 쏟아내면, 슬쩍 뒷걸음질 치게 돼요. 냉정한 게 아니에요. 각자의 공간이 있어야 관계가 숨 쉴 수 있다는 걸 아는 거예요.\n• 상대가 힘들 때 온 신경을 쏟지만, 정작 자기가 힘들 때는 말을 못 해요. 이 불균형이 쌓이면 지쳐요.`}


**이 패턴이 관계에서 나타나는 방식**
→ ${t.ST >= 50 ? '상대가 깊이를 원하지 않으면, 먼저 문을 닫게 된다' : t.HA >= 50 ? '변화 앞에서 웃으면서도 속으로는 무너지는 패턴' : '돌봄을 주고도 돌봄을 못 받는 관계의 불균형'}

${t.ST >= 50 ? '깊은 대화를 원하는데 상대가 거기까지 와주지 않으면, 실망이 쌓여요. 그리고 어느 순간 먼저 문을 닫게 돼요.' : t.HA >= 50 ? '계획이 바뀌어도 겉으로는 "그래, 괜찮아"라고 해요. 하지만 속으로는 허탈함이 밀려와요. 이런 일이 반복되면, 점점 기대 자체를 줄이게 돼요.' : '상대를 돌보느라 자기 감정은 후순위가 돼요. "나 지쳤어"라고 말했을 때 상대가 놀라는 이유예요.'}


**당신을 행복하게 만드는 것**
→ ${
topBottom.top1.axis === 'ST' ? '의미 있는 대화가 오가는 시간. 그게 당신에게 행복이에요.' :
topBottom.top1.axis === 'NS' ? '새로운 걸 함께 경험하는 순간. 그게 당신에게 행복이에요.' :
topBottom.top1.axis === 'SD' ? '서로의 영역을 존중하면서도 함께 있는 감각. 그게 당신에게 행복이에요.' :
topBottom.top1.axis === 'CO' ? '별것 아닌 일상을 나누는 시간. 그게 당신에게 행복이에요.' :
'꾸준히 함께 쌓아가는 느낌. 그게 당신에게 행복이에요.'}

${
topBottom.top1.axis === 'ST' ? '당신에게 행복이란 의미 있는 상태예요. 대화가 깊어지는 순간, "이 사람은 나를 이해하려고 하는구나"라고 느끼는 순간. 거창한 이벤트가 아니라 진짜 대화가 오가는 시간이 당신을 충전시켜요.' :
topBottom.top1.axis === 'NS' ? '당신에게 행복이란 새로운 상태예요. 같은 일상의 반복이 아니라, 작은 변화라도 함께 경험하는 것. 여행이 아니어도 돼요. 새로운 식당, 처음 가보는 산책길. 그 새로움을 나누는 게 행복이에요.' :
topBottom.top1.axis === 'SD' ? '당신에게 행복이란 자유로운 상태예요. 옆에 사람이 있지만 구속받지 않는 느낌. 각자의 시간을 존중하면서도 돌아왔을 때 따뜻한 관계. 그 균형이 당신을 행복하게 해요.' :
topBottom.top1.axis === 'CO' ? '당신에게 행복이란 연결된 상태예요. 오늘 있었던 일을 나누고, 별것 아닌 것에 함께 웃는 시간. 거창한 이벤트가 아니라 편안한 일상의 공유가 당신을 충전시켜요.' :
'당신에게 행복이란 안정적인 상태예요. 변하지 않는 것들이 옆에 있는 느낌. 꾸준히 함께 쌓아가는 시간이 당신을 행복하게 해요.'}


**강점으로 읽기**
→ ${t.ST >= 50 ? '깊이를 추구하는 사람은, 진짜 관계를 만들 수 있는 사람' : t.HA >= 50 ? '안정을 만드는 사람은, 관계를 안전하게 지키는 사람' : '경계를 지키는 사람은, 관계를 오래 유지하는 사람'}

${t.ST >= 50 ? '참을 수 없는 것과 행복의 조건이 사실 같은 뿌리예요. 피상적인 대화가 힘든 건, 깊이 있는 연결에서 행복을 느끼기 때문이에요. 이건 약점이 아니라 관계에 진심이라는 증거예요.' : t.HA >= 50 ? '예측 불가능한 게 힘든 건, 안정된 관계에서 행복을 느끼기 때문이에요. 이건 약점이 아니라 관계를 안전하게 지키는 능력이에요.' : '감정적 공간이 필요한 건, 균형 잡힌 관계에서 행복을 느끼기 때문이에요. 이건 약점이 아니라 관계를 오래 가게 하는 자기 인식이에요.'} 불편함을 느낀다는 것 자체가 관계에 진심이라는 뜻이에요.`,

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

    "8": (() => {
      const partnerCats = data.partnerCategories || [];
      const channelSection = partnerCats.length > 0
        ? partnerCats.map(pc => `• ${pc.categoryName}: ${pc.channels.join(', ')}\n  — ${pc.description}`).join('\n\n')
        : '• 다양한 카테고리를 고루 보는 사람이에요.';

      const jobData = PARTNER_JOBS[h.category];
      const jobSection = jobData
        ? jobData.jobs.map(job => `• ${job}`).join('\n')
        : '• 다양한 분야에서 활동하는 사람이에요.';
      const meetingSection = jobData
        ? jobData.meetingPlaces.join(', ')
        : '다양한 모임';

      // top1/top2/bottom 축 기반 매칭 이유 텍스트
      const top1Desc: Record<string, string> = {
        NS: '당신은 새로운 걸 찾아야 직성이 풀리는 사람이에요. 같은 자리에 오래 있으면 답답해지고, 변화 속에서 에너지를 얻는 타입이에요. 이 성향이 당신의 삶을 움직이게 하는 가장 큰 힘이에요.',
        ST: '당신은 의미와 답을 찾아야 마음이 놓이는 사람이에요. "왜?"라는 질문이 멈추지 않고, 표면적인 대화로는 만족하지 못하는 타입이에요. 이 탐구 본능이 당신의 관계에서도 깊이를 만들어요.',
        SD: '당신은 자기 기준으로 살아야 직성이 풀리는 사람이에요. 남이 정한 길은 아무리 좋아도 불편하고, 틀려도 직접 선택해야 납득이 되는 타입이에요. 이 독립심이 당신의 정체성 그 자체예요.',
        CO: '당신은 함께 나눌 때 비로소 완성되는 사람이에요. 좋은 경험을 혼자 하면 아깝고, 옆에 누군가 있어야 그 순간이 진짜가 되는 타입이에요. 이 연결에 대한 욕구가 당신을 관계 안에서 빛나게 해요.',
        P: '당신은 시작한 건 끝을 봐야 하는 사람이에요. 중간에 멈추면 미완의 감각이 계속 따라다니고, 완성했을 때 비로소 안도하는 타입이에요. 이 끈기가 당신의 가장 큰 자산이에요.',
        HA: '당신은 충분히 확인해야 움직이는 사람이에요. 신중한 게 아니라 안전한 거예요. 확인 없이 뛰어드는 건 에너지가 더 드는 타입이에요.',
      };

      const bottomComplement: Record<string, string> = {
        HA: '당신이 가장 약한 영역은 신중함이에요. 흥분해서 달릴 때 브레이크를 밟아줄 사람이 필요해요. 이 파트너는 당신보다 약간 더 신중한 편이라, "잠깐, 이것만 확인하자"라고 말해줄 수 있는 사람이에요. 브레이크가 아니라, 안전벨트 같은 존재예요.',
        NS: '당신이 가장 약한 영역은 변화에 대한 욕구예요. 안정적인 건 좋지만, 가끔 새로운 자극이 필요할 때가 있어요. 이 파트너는 당신이 미처 생각하지 못한 방향을 제안해줄 수 있는 사람이에요. 당신의 세계를 넓혀주는 창문 같은 존재예요.',
        CO: '당신이 가장 약한 영역은 사람과의 연결이에요. 혼자서도 충분히 잘 지내지만, 가끔 외로움이 밀려올 때가 있어요. 이 파트너는 부담 없이 곁에 있어주는 사람이에요. 억지로 끌어당기지 않아도 자연스럽게 함께하게 되는 관계예요.',
        SD: '당신이 가장 약한 영역은 자기 결정이에요. 다른 사람의 의견에 쉽게 흔들리는 편이에요. 이 파트너는 자기 기준이 있는 사람이라, 당신이 흔들릴 때 중심을 잡아줄 수 있어요. 결정을 대신 내려주는 게 아니라, 당신이 결정할 수 있도록 기다려주는 사람이에요.',
        ST: '당신이 가장 약한 영역은 의미 탐구예요. 일상에 묻혀 살다 보면 "이게 맞나?" 싶을 때가 있어요. 이 파트너는 삶의 의미를 함께 고민해줄 수 있는 사람이에요. 답을 주는 게 아니라, 질문을 함께 던져주는 존재예요.',
        P: '당신이 가장 약한 영역은 끈기예요. 시작은 잘하지만 끝까지 가는 게 어려운 편이에요. 이 파트너는 묵묵히 옆에서 함께 걸어줄 수 있는 사람이에요. 재촉하지 않으면서도 포기하지 않게 해주는 존재예요.',
      };

      return `**당신의 배우자는 이런 사람이에요**
→ ${h.variant === 'extrovert' ? '에너지가 있으면서도 방향감각이 있는 사람' : '말이 적지만 비어 있지 않은 사람'}

당신에게 어울리는 파트너는 "${h.name}" 타입이에요.

${h.description} ${h.variant === 'extrovert' ? '에너지가 있으면서도 방향감각이 있는 사람이에요. 충동적으로 보일 수 있지만, 실은 "이게 나를 성장시킬까?"를 기준으로 선택하는 사람이에요.' : '말이 많지 않지만, 한마디를 할 때 무게가 있는 사람이에요. 시간이 지나면 알게 돼요. 이 사람의 조용함이 비어 있는 게 아니라 꽉 차 있다는 걸.'}

혼자서도 충분히 잘 움직이지만, 옆에 누군가 있으면 더 멀리 갈 수 있다는 걸 아는 사람이기도 해요.


**당신이 이 사람을 만나야 하는 이유**
→ 당신의 분석 결과가 이 사람을 가리키고 있어요

${top1Desc[topBottom.top1.axis] || top1Desc['NS']}

당신은 동시에 ${topBottom.top2.name} 성향도 높아요. 이 조합이 의미하는 건, 당신에게는 ${h.variant === 'extrovert' ? '함께 움직이면서도 방향을 잡아줄 수 있는 사람' : '조용히 곁에 있으면서도 흔들리지 않는 사람'}이 필요하다는 거예요.

그래서 당신의 배우자는 가만히 기다려주는 사람이 아니라, ${h.variant === 'extrovert' ? '옆에서 같이 뛰어줄 사람' : '말 없이도 함께 있어주는 사람'}이어야 해요. ${h.category}의 ${h.subcategory} 타입이 바로 그런 사람이에요.

${bottomComplement[topBottom.bottom.axis] || bottomComplement['HA']}


**당신의 배우자가 하고 있을 일**
→ ${h.category} 성향의 사람이 주로 선택하는 분야

${jobSection}

${meetingSection}에서 만날 수 있어요. 이 사람은 자기 분야에서 꾸준히 성장하면서도, 관계에서 균형을 잃지 않는 타입이에요.


**이 사람이 구독하고 있을 유튜브 채널**
→ 당신과 다른 취향이에요. 그게 오히려 좋은 이유가 있어요.

${channelSection}

당신이 안 보는 채널을 보는 사람이에요. 처음엔 낯설 수 있어요. 하지만 다른 세계를 가진 사람이 옆에 있으면, 당신의 세계도 넓어져요. 서로의 취향이 다르다는 건, 서로에게 줄 수 있는 게 많다는 뜻이에요.

${h.variant === 'extrovert' ? '당신의 리듬을 만들어줄 사람이에요.' : '당신의 안전장치가 될 사람이에요.'}`;
    })(),

    "8_destiny_line": h.variant === 'extrovert' ? '당신의 리듬을 만들어줄 사람이에요.' : '당신의 안전장치가 될 사람이에요.',

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

  // 배우자 추정 구독 카테고리 계산
  const partnerCategories = estimatePartnerCategories(matchResult.type);

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
    partnerCategories,
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

    const card: ReportCard = {
      card_number: cardNumber,
      title,
      subtitle,
      content: String(content).slice(0, 5000),
      card_type: meta.card_type,
    };

    // 카드 8: 운명의 한 줄 + 배우자 추정 채널 + 직업군/만남장소 메타데이터 저장
    if (cardNumber === 8) {
      const jobData = PARTNER_JOBS[matchResult.type.category];
      card.metadata = {
        destiny_line: cardContents['8_destiny_line'] || (matchResult.type.variant === 'extrovert' ? '당신의 리듬을 만들어줄 사람이에요.' : '당신의 안전장치가 될 사람이에요.'),
        partner_channels: partnerCategories.map(pc => ({
          category: pc.categoryName,
          channels: pc.channels,
          description: pc.description,
        })),
        partner_jobs: jobData ? {
          jobs: jobData.jobs,
          meetingPlaces: jobData.meetingPlaces,
          category: matchResult.type.category,
        } : undefined,
      };
    }

    cards.push(card);
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
