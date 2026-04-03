/**
 * Phase 1 + Phase 2 통합 테스트 스크립트
 *
 * 실행: npx tsx scripts/test-full-pipeline.ts
 *
 * 1. 유저 YouTube 구독 채널 37개 → Phase 1 전체 파이프라인
 * 2. Phase 1 결과 + 서베이 응답 → Phase 2 교차검증 + 9장 카드
 * 3. 결과를 phase2-test-output.md로 저장
 *
 * 예상 소요 시간: 3~5분 (Phase 1 LLM 5배치 + Phase 2 LLM 3배치)
 */

// ──────────────────────────────────────────
// 0. @/ path alias 해결 (tsx 환경에서 필수)
// ──────────────────────────────────────────

import { resolve } from 'path';
import Module from 'module';

const origResolve = (Module as any)._resolveFilename;
(Module as any)._resolveFilename = function (req: string, ...args: any[]) {
  if (req.startsWith('@/')) {
    req = resolve(process.cwd(), 'src', req.slice(2));
  }
  return origResolve.call(this, req, ...args);
};

// ──────────────────────────────────────────
// 1. 환경변수 로드
// ──────────────────────────────────────────

import { config } from 'dotenv';
config({ path: resolve(process.cwd(), '.env.local') });

// ──────────────────────────────────────────
// 2. 프로젝트 모듈 임포트
// ──────────────────────────────────────────

// Phase 1 분석
import { categorizeChannels } from '../src/lib/husband-match/analysis/categorize-channels';
import { calculateTCI } from '../src/lib/husband-match/analysis/calculate-tci';
import { estimateEnneagram } from '../src/lib/husband-match/analysis/estimate-enneagram';
import { estimateMBTI } from '../src/lib/husband-match/analysis/estimate-mbti';
import { createVector } from '../src/lib/husband-match/analysis/create-vector';
import { runYouTubeAnalysis } from '../src/lib/husband-match/analysis/youtube-analysis';
import { runPhase1FromPrecomputed } from '../src/app/api/analyze/phase1/run-from-channels';

// Phase 2 분석
import { buildDeepCrossValidation } from '../src/lib/husband-match/analysis/deep-cross-validation';
import {
  PHASE2_CARD_PROMPTS,
  type Phase2CardData,
} from '../src/lib/husband-match/prompts/phase2-prompts';
import { PHASE2_SYSTEM_PROMPT } from '../src/lib/husband-match/prompts/phase2-system-prompt';
import { chatCompletion, safeJsonParse } from '../src/lib/gemini-client';
import { getAllHusbandTypes } from '../src/lib/husband-match/data/husband-types';

// 타입
import type { ChannelData, ReportCard } from '../src/lib/husband-match/types';

import { writeFileSync } from 'fs';

// 문체 검증
import { checkStyleViolations } from '../src/lib/writing-guide';

// ──────────────────────────────────────────
// 3. YouTube 구독 채널 목록 (37개) — 실제 사용자 스크린샷 기반
// ──────────────────────────────────────────

const CHANNELS: ChannelData[] = [
  // ── IMG_5926 (13개) ──
  { channel_id: 'ch01', channel_title: 'KIYU_TV', channel_description: '라이프스타일, 일상 브이로그' },
  { channel_id: 'ch02', channel_title: '윤쥬르 YOONJOUR 장윤주', channel_description: '패션, 뷰티, 라이프스타일' },
  { channel_id: 'ch03', channel_title: '너진뚝 NJT BOOK', channel_description: '독서 리뷰, 책 추천, 인문학' },
  { channel_id: 'ch04', channel_title: '윤그린', channel_description: '일상 브이로그, 라이프스타일' },
  { channel_id: 'ch05', channel_title: '단커피', channel_description: '커피, 카페 투어, 라이프스타일' },
  { channel_id: 'ch06', channel_title: '부산영어방송 BeFM', channel_description: '영어 학습, 라디오, 부산 문화' },
  { channel_id: 'ch07', channel_title: '최고의1분', channel_description: '자기계발, 동기부여, 짧은 인사이트' },
  { channel_id: 'ch08', channel_title: 'English Speaking Success', channel_description: '영어 회화, 영어 학습' },
  { channel_id: 'ch09', channel_title: 'EBS 컬렉션 - 라이프스타일', channel_description: '교양, 다큐멘터리, 라이프스타일' },
  { channel_id: 'ch10', channel_title: '최마태의 POST IT', channel_description: '자기계발, 인사이트, 동기부여' },
  { channel_id: 'ch11', channel_title: 'Christian Dior', channel_description: '패션, 럭셔리 브랜드, 하이패션' },
  { channel_id: 'ch12', channel_title: 'English Fluency Builder', channel_description: '영어 회화, 유창성 훈련' },
  { channel_id: 'ch13', channel_title: 'The Sunday Times Style', channel_description: '패션, 뷰티, 라이프스타일 매거진' },
  // ── IMG_5924 (11개) ──
  { channel_id: 'ch14', channel_title: '소울정', channel_description: '영성, 힐링, 마음 치유' },
  { channel_id: 'ch15', channel_title: '낮잠 NZ Ambience', channel_description: '뉴질랜드 자연 소리, ASMR, 앰비언스' },
  { channel_id: 'ch16', channel_title: '던워리비햇님', channel_description: '자기계발, 힐링, 긍정 마인드' },
  { channel_id: 'ch17', channel_title: 'Stone Soup Grimoire', channel_description: '영성, 타로, 마법, 위치크래프트' },
  { channel_id: 'ch18', channel_title: 'hostless', channel_description: '공간 디자인, 인테리어' },
  { channel_id: 'ch19', channel_title: '매니악룸 Maniac Room', channel_description: '인테리어, 공간 디자인, 원룸 꾸미기' },
  { channel_id: 'ch20', channel_title: 'JuJu healing Music&Yoga', channel_description: '힐링 음악, 요가, 명상' },
  { channel_id: 'ch21', channel_title: '라이브 아카데미 토들러', channel_description: '영어 학습, 영어 회화' },
  { channel_id: 'ch22', channel_title: '이종범의 스토리캠프', channel_description: '인문학, 스토리텔링, 역사' },
  { channel_id: 'ch23', channel_title: 'oneness', channel_description: '영성, 명상, 의식 확장' },
  { channel_id: 'ch24', channel_title: 'Beautiful Chorus', channel_description: '힐링 음악, 명상 음악, 합창' },
  // ── IMG_5925 (13개) ──
  { channel_id: 'ch25', channel_title: 'CuriousBrainLab', channel_description: '심리학, 뇌과학, 자기이해' },
  { channel_id: 'ch26', channel_title: '지식은 날리지', channel_description: '지식, 교양, 인문학' },
  { channel_id: 'ch27', channel_title: 'mina in york 미나', channel_description: '뉴욕 해외 생활 브이로그' },
  { channel_id: 'ch28', channel_title: '정리마켓', channel_description: '정리정돈, 미니멀 라이프, 수납' },
  { channel_id: 'ch29', channel_title: 'Essie Jain', channel_description: '음악, 싱어송라이터, 포크 음악' },
  { channel_id: 'ch30', channel_title: 'Turbo832 TV', channel_description: '라이프스타일, 일상 콘텐츠' },
  { channel_id: 'ch31', channel_title: '존이나박이나', channel_description: '커플 브이로그, 일상' },
  { channel_id: 'ch32', channel_title: '김주환의 내면소통', channel_description: '심리학, 내면 성장, 소통' },
  { channel_id: 'ch33', channel_title: '노홍철', channel_description: '예능, 토크, 유머' },
  { channel_id: 'ch34', channel_title: '유 퀴즈 온 더 튜브', channel_description: '토크, 예능, 인터뷰' },
  { channel_id: 'ch35', channel_title: 'Mei-lan', channel_description: '라이프스타일, 뷰티' },
  { channel_id: 'ch36', channel_title: 'Ch.염미솔', channel_description: '음악, 노래, 보컬' },
  { channel_id: 'ch37', channel_title: '우엉ueong', channel_description: '일상 브이로그, 라이프스타일' },
];

// ──────────────────────────────────────────
// 4. 서베이 응답 (phase2-survey-input.md 실제 응답)
// ──────────────────────────────────────────

const SURVEY_RESPONSES = {
  q1_together_time: 6,
  q2_anxiety_influence: 9,
  q3_logic_vs_emotion: 10,
  q4_independence: 2,
  q5_emotional_expression: 8,
  q6_conflict_pattern:
    '일단 감정을 가라앉히고 나서, 생각 정리를 하고 이야기하는 시간을 가져요 내 마음이 왜 그랬는지 내 안의 어떤 부분을 건드렸는지를 설명해요',
  q7_partner_distance:
    '정말 그런지 물어봐요',
  q8_recurring_issue:
    '상대방의 단호한 태도에 화가 나고 겁이 나요 불만이 있어도 말하지 않아요 상대가 기분이 안좋으면 나때문인 것 같고 어떻게 해야할지 모르겠어요',
  q9_stress_response:
    '혼자 생각 정리를 해요 사우나나 명상을 통해 내면을 들여다봐요',
  q10_body_signal:
    '가슴이 답답해지고 손이 차가워져요. 심장이 빨리 뛰면서 머리가 멍해지는 느낌이에요.',
  q11_comfort_source:
    '나에 대해 좋게 생각하고 나의 도전을 응원해주는 친구들, 나를 판단 평가하지 않는 친구들이 좋아요',
  q12_deepest_fear:
    '결국 상대에게 소중한 사람이 아니었다는 걸 깨닫고 상처받을까봐 두려워요',
  q13_want_to_change:
    '상대에게 계속 져주는 것, 상대의 기분에 눈치를 많이 보는 것',
  q14_ideal_day:
    '아침에 같이 산책하고, 각자 일하다가, 저녁에 요리하며 수다 떠는 하루. 서로의 성장을 가장 응원하는 사이 특별하지 않아도, 같이 있는 것 자체가 편안한 그런 하루.',
  q15_core_desire:
    '서로 성장시킬 수 있는 관계를 원해요.',
  q16_hot_scenario:
    '"혹시 헤어지자는 건 아니겠지?" 가슴이 철렁하면서 내가 뭘 잘못했나 빠르게 되짚어봐요.',
  q17_relationship_rules: {
    rules: '서로의 하루를 공유해야 한다',
    positive_assumption: '내 이야기를 끝까지 들어줄 것이다',
    negative_assumption: '실망하거나 부담스러워할 것이다',
  },
  q18_core_belief_choice: '내가 완벽하지 않으면 사랑받을 수 없다',
};

// ──────────────────────────────────────────
// 5. Phase 2 카드 설정
// ──────────────────────────────────────────

const LLM_OPTIONS = {
  model: 'gpt-4o-mini' as const,
  temperature: 0.75,
  max_tokens: 16384,
};

const PHASE2_CARD_KEYS: (keyof typeof PHASE2_CARD_PROMPTS)[] = [
  'card_01_bridge',
  'card_02_life_meaning',
  'card_03_unconscious_desires',
  'card_04_chain_reaction',
  'card_05_invisible_rules',
  'card_06_relationship_impact',
  'card_07_deepest_fear',
  'card_08_growth',
  'card_09_deep_match',
  'card_10_letter',
];

const PHASE2_CARD_META: Record<
  number,
  { title: string; subtitle?: string; card_type: ReportCard['card_type'] }
> = {
  1: { title: "'어떤 사람인지' 알았으니, 이제 '왜'를 찾아갑니다", subtitle: '교차 검증', card_type: 'personality' },
  2: { title: '당신이 삶에서 진짜 추구하는 것', subtitle: '가치관', card_type: 'values' },
  3: { title: '말하지 않았지만, 데이터가 말하고 있는 것', subtitle: '숨겨진 욕구', card_type: 'values' },
  4: { title: '마음의 연쇄 반응', subtitle: '감정 도미노', card_type: 'personality' },
  5: { title: '보이지 않는 규칙', subtitle: '관계 규칙', card_type: 'values' },
  6: { title: '핵심 신념이 만드는 관계의 모양', subtitle: '관계 패턴', card_type: 'values' },
  7: { title: '가장 두려워하는 것', subtitle: '두려움', card_type: 'values' },
  8: { title: '누구와도 잘 살기 위해 넘어야 할 문턱', subtitle: '성장 포인트', card_type: 'result' },
  9: { title: '설문이 확인한 당신의 파트너', subtitle: '심층 매칭', card_type: 'matching' },
  10: { title: '마무리 편지', subtitle: '마무리 편지', card_type: 'result' },
};

// ──────────────────────────────────────────
// 6. 유틸리티
// ──────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries = 2
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      if (attempt > 0) console.log(`  \u2713 ${label} 재시도 ${attempt}회 만에 성공`);
      return result;
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxRetries) {
        console.warn(
          `  \u26a0 ${label} 실패 (시도 ${attempt + 1}/${maxRetries + 1}): ${lastError.message}`
        );
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }
  throw lastError ?? new Error(`${label} 최종 실패`);
}

async function generatePhase2CardContent(
  cardKey: keyof typeof PHASE2_CARD_PROMPTS,
  data: Phase2CardData
): Promise<string> {
  const prompt = PHASE2_CARD_PROMPTS[cardKey](data);
  const wrappedPrompt = `${prompt}\n\n위 지침에 따라 카드 본문을 작성하세요. JSON 형식으로 응답하세요: {"content": "카드 본문 전체 텍스트"}`;

  const response = await chatCompletion(
    [
      { role: 'system', content: PHASE2_SYSTEM_PROMPT },
      { role: 'user', content: wrappedPrompt },
    ],
    {
      ...LLM_OPTIONS,
      response_format: { type: 'json_object' as const },
    }
  );

  const raw = response ?? '';
  try {
    const parsed = safeJsonParse<{ content?: string }>(raw);
    if (parsed.content) return parsed.content.trim().slice(0, 5000);
  } catch {
    // fallback
  }
  return raw.trim().slice(0, 5000);
}

// ──────────────────────────────────────────
// 7. 메인
// ──────────────────────────────────────────

async function main() {
  const totalStart = Date.now();

  console.log('');
  console.log('='.repeat(55));
  console.log(' Phase 1 + Phase 2 통합 테스트');
  console.log('='.repeat(55));
  console.log(`\n 채널 수: ${CHANNELS.length}개`);
  console.log(` 서베이: 18문항 (스케일 5 + SCT 10 + CBT 3)`)
  console.log(` 문체 검증: checkStyleViolations() 활성화`);
  console.log('');

  // ════════════════════════════════════════
  // PHASE 1: YouTube 구독 → 심리 프로필 → 9장 카드
  // ════════════════════════════════════════

  console.log('-'.repeat(55));
  console.log(' PHASE 1: YouTube 분석 + 9장 카드 생성');
  console.log('-'.repeat(55));

  // 1a. 채널 카테고리 분류 + YouTube 분석 (LLM 병렬)
  console.log('\n[1/5] 채널 카테고리 분류 + YouTube 분석 (LLM 병렬)...');
  const phase1AnalysisStart = Date.now();

  const [channel_categories, youtubeAnalysis] = await Promise.all([
    withRetry(() => categorizeChannels(CHANNELS), '채널 카테고리 분류'),
    withRetry(() => runYouTubeAnalysis(CHANNELS), 'YouTube 분석'),
  ]);

  const analysisTime = Math.round((Date.now() - phase1AnalysisStart) / 1000);
  console.log(`   \u2713 완료 (${analysisTime}초)`);
  console.log(`   카테고리 분류: ${Object.entries(channel_categories).filter(([, v]) => v > 0).length}개 활성`);
  console.log(`   YouTube 16카테고리: ${youtubeAnalysis.categoryResults.length}개`);
  console.log(`   희소성: 상위 ${youtubeAnalysis.rarity.percentile}%`);

  // 1b. TCI / Enneagram / MBTI / Vector (동기)
  console.log('\n[2/5] TCI 6축 / Enneagram / MBTI / 18차원 벡터 계산...');
  const tci_scores = calculateTCI(channel_categories);
  const enneagram = estimateEnneagram(tci_scores, channel_categories);
  const mbti = estimateMBTI(tci_scores, channel_categories);
  const user_vector = createVector(tci_scores, enneagram.center, channel_categories);

  console.log(`   TCI: NS=${tci_scores.NS} HA=${tci_scores.HA} RD=${tci_scores.RD} P=${tci_scores.P} SD=${tci_scores.SD} CO=${tci_scores.CO} ST=${tci_scores.ST}`);
  console.log(`   MBTI: ${mbti.type}`);
  console.log(`   Enneagram: ${enneagram.type}번 (head=${enneagram.center.head} heart=${enneagram.center.heart} body=${enneagram.center.body})`);
  console.log(`   벡터: [${user_vector.slice(0, 5).map((v) => v.toFixed(1)).join(', ')}... ] (18D)`);

  // 1c. 카드 생성 (Mock Supabase로 runPhase1FromPrecomputed 호출)
  console.log('\n[3/5] Phase 1 카드 9장 생성 (LLM 5배치 병렬)...');
  const cardGenStart = Date.now();

  // Mock Supabase: upsert 호출 시 payload를 캡처
  let capturedPayload: any = null;
  const mockSupabase = {
    from: (_table: string) => ({
      upsert: (payload: any, _opts?: any) => {
        capturedPayload = payload;
        return {
          select: (_cols: string) => ({
            single: () =>
              Promise.resolve({ data: { id: 'test-phase1-id' }, error: null }),
          }),
        };
      },
    }),
  } as any;

  await runPhase1FromPrecomputed(
    mockSupabase,
    'test-user-id',
    {
      channel_categories,
      tci_scores,
      enneagram_center: enneagram.center,
      enneagram_type: enneagram.type,
      mbti_scores: mbti.scores,
      mbti_type: mbti.type,
      user_vector,
      channelCount: CHANNELS.length,
      birthInfo: { year: 1991, month: 2, day: 18 },
    },
    youtubeAnalysis
  );

  const cardGenTime = Math.round((Date.now() - cardGenStart) / 1000);

  if (!capturedPayload) {
    console.error('Phase 1 카드 생성 실패: payload가 캡처되지 않았습니다.');
    process.exit(1);
  }

  const phase1Cards: ReportCard[] = capturedPayload.cards;
  const matchedHusbandTypeId: string = capturedPayload.matched_husband_type;
  const matchScore: number = capturedPayload.match_score;

  console.log(`   \u2713 완료 (${cardGenTime}초)`);
  console.log(`   카드 ${phase1Cards.length}장 생성`);
  console.log(`   매칭 타입: ${matchedHusbandTypeId}`);
  console.log(`   매칭 점수: ${Math.round(matchScore * 100)}%`);

  // ════════════════════════════════════════
  // PHASE 2: 서베이 → 교차검증 → 9장 카드
  // ════════════════════════════════════════

  console.log('\n' + '-'.repeat(55));
  console.log(' PHASE 2: 교차검증 + 9장 카드 생성');
  console.log('-'.repeat(55));

  // 2a. 남편 타입 상세 정보
  console.log('\n[4/5] 남편 타입 + 교차검증...');
  const allHusbandTypes = getAllHusbandTypes();
  const husbandType = allHusbandTypes.find((t) => t.id === matchedHusbandTypeId);
  const husbandTypeData = husbandType
    ? {
        id: husbandType.id,
        name: husbandType.name,
        category: husbandType.category,
        subcategory: husbandType.subcategory,
        description: husbandType.description,
        metaphor:
          husbandType.variant === 'extrovert'
            ? husbandType.metaphor_e
            : husbandType.metaphor_i,
      }
    : {
        id: matchedHusbandTypeId,
        name: matchedHusbandTypeId,
        category: '',
        subcategory: '',
        description: 'Phase 1에서 매칭된 파트너 유형입니다.',
        metaphor: undefined,
      };

  console.log(`   남편 타입: ${husbandTypeData.name} (${husbandTypeData.category})`);

  // 2b. 교차검증
  const deepCrossValidation = buildDeepCrossValidation(
    {
      tci_scores,
      mbti_scores: mbti.scores,
      mbti_type: mbti.type,
      enneagram_type: enneagram.type,
      enneagram_center: enneagram.center,
      channel_categories,
      matched_husband_type: matchedHusbandTypeId,
      match_score: matchScore,
      cards: phase1Cards,
    },
    SURVEY_RESPONSES
  );

  console.log(`   자기일치도: ${Math.round(deepCrossValidation.authenticityScore * 100)}%`);
  console.log(`   숨겨진 욕구: ${deepCrossValidation.hiddenDesires.length}개`);
  console.log(
    `   주요 불일치: ${deepCrossValidation.dimensions.filter((d) => Math.abs(d.diff) >= 20).length}개 차원`
  );

  // 2c. Phase2CardData 조립
  const phase2CardData: Phase2CardData = {
    phase1: {
      tci_scores,
      channel_categories,
      enneagram_center: enneagram.center,
      enneagram_type: enneagram.type,
      mbti_scores: mbti.scores,
      mbti_type: mbti.type,
      matched_husband_type: matchedHusbandTypeId,
      match_score: matchScore,
      cards: phase1Cards,
    },
    survey: SURVEY_RESPONSES,
    deepCrossValidation,
    husbandType: husbandTypeData,
  };

  // 2d. 10장 카드 생성 (3배치 병렬)
  console.log('\n[5/5] Phase 2 카드 10장 생성 (LLM 3배치 병렬)...');
  const phase2Start = Date.now();
  const phase2ContentMap = new Map<number, string>();

  const batchA = async () => {
    console.log('   배치 A: 카드 1-3 (도입부)');
    const [c1, c2, c3] = await Promise.all([
      withRetry(() => generatePhase2CardContent('card_01_bridge', phase2CardData), 'P2 카드 1'),
      withRetry(() => generatePhase2CardContent('card_02_life_meaning', phase2CardData), 'P2 카드 2'),
      withRetry(() => generatePhase2CardContent('card_03_unconscious_desires', phase2CardData), 'P2 카드 3'),
    ]);
    phase2ContentMap.set(1, c1);
    phase2ContentMap.set(2, c2);
    phase2ContentMap.set(3, c3);
    console.log('   \u2713 배치 A 완료');
  };

  const batchB = async () => {
    console.log('   배치 B: 카드 4-6 (분석)');
    const [c4, c5, c6] = await Promise.all([
      withRetry(() => generatePhase2CardContent('card_04_chain_reaction', phase2CardData), 'P2 카드 4'),
      withRetry(() => generatePhase2CardContent('card_05_invisible_rules', phase2CardData), 'P2 카드 5'),
      withRetry(() => generatePhase2CardContent('card_06_relationship_impact', phase2CardData), 'P2 카드 6'),
    ]);
    phase2ContentMap.set(4, c4);
    phase2ContentMap.set(5, c5);
    phase2ContentMap.set(6, c6);
    console.log('   \u2713 배치 B 완료');
  };

  const batchC = async () => {
    console.log('   배치 C: 카드 7-10 (마무리)');
    const [c7, c8, c9, c10] = await Promise.all([
      withRetry(() => generatePhase2CardContent('card_07_deepest_fear', phase2CardData), 'P2 카드 7'),
      withRetry(() => generatePhase2CardContent('card_08_growth', phase2CardData), 'P2 카드 8'),
      withRetry(() => generatePhase2CardContent('card_09_deep_match', phase2CardData), 'P2 카드 9'),
      withRetry(() => generatePhase2CardContent('card_10_letter', phase2CardData), 'P2 카드 10'),
    ]);
    phase2ContentMap.set(7, c7);
    phase2ContentMap.set(8, c8);
    phase2ContentMap.set(9, c9);
    phase2ContentMap.set(10, c10);
    console.log('   \u2713 배치 C 완료');
  };

  await Promise.all([batchA(), batchB(), batchC()]);
  const phase2Time = Math.round((Date.now() - phase2Start) / 1000);
  console.log(`   Phase 2 카드 소요 시간: ${phase2Time}초`);

  // ════════════════════════════════════════
  // 결과 파일 생성
  // ════════════════════════════════════════

  console.log('\n' + '-'.repeat(55));
  console.log(' 결과 파일 생성');
  console.log('-'.repeat(55));

  const totalTime = Math.round((Date.now() - totalStart) / 1000);
  const o: string[] = [];

  // 헤더
  o.push('# 전체 분석 테스트 결과\n');
  o.push(`> 생성 시각: ${new Date().toLocaleString('ko-KR')}`);
  o.push(`> 채널 수: ${CHANNELS.length}개`);
  o.push(`> 총 소요 시간: ${totalTime}초 (Phase 1 분석 ${analysisTime}초 + 카드 ${cardGenTime}초 + Phase 2 ${phase2Time}초)\n`);

  // ── 입력 데이터 ──
  o.push('---\n');
  o.push('## 입력 데이터\n');

  o.push(`### YouTube 채널 목록 (${CHANNELS.length}개)\n`);
  o.push('| # | 채널명 | 설명 |');
  o.push('|---|--------|------|');
  CHANNELS.forEach((ch, i) => {
    o.push(`| ${i + 1} | ${ch.channel_title} | ${ch.channel_description} |`);
  });

  o.push('\n### 서베이 응답 (18문항)\n');
  o.push('| 문항 | 응답 |');
  o.push('|------|------|');
  o.push(`| q1 함께 시간 | ${SURVEY_RESPONSES.q1_together_time}/10 |`);
  o.push(`| q2 불안 영향 | ${SURVEY_RESPONSES.q2_anxiety_influence}/10 |`);
  o.push(`| q3 논리/감정 | ${SURVEY_RESPONSES.q3_logic_vs_emotion}/10 |`);
  o.push(`| q4 독립성 | ${SURVEY_RESPONSES.q4_independence}/10 |`);
  o.push(`| q5 감정표현 | ${SURVEY_RESPONSES.q5_emotional_expression}/10 |`);
  o.push(`| q6 갈등패턴 | ${SURVEY_RESPONSES.q6_conflict_pattern.slice(0, 50)}... |`);
  o.push(`| q7 거리반응 | ${SURVEY_RESPONSES.q7_partner_distance} |`);
  o.push(`| q8 반복문제 | ${SURVEY_RESPONSES.q8_recurring_issue.slice(0, 50)}... |`);
  o.push(`| q9 스트레스 | ${SURVEY_RESPONSES.q9_stress_response.slice(0, 50)}... |`);
  o.push(`| q10 몸 신호 | ${SURVEY_RESPONSES.q10_body_signal.slice(0, 50)}... |`);
  o.push(`| q11 위안 | ${SURVEY_RESPONSES.q11_comfort_source.slice(0, 50)}... |`);
  o.push(`| q12 두려움 | ${SURVEY_RESPONSES.q12_deepest_fear.slice(0, 50)}... |`);
  o.push(`| q13 변화 | ${SURVEY_RESPONSES.q13_want_to_change.slice(0, 50)}... |`);
  o.push(`| q14 이상하루 | ${SURVEY_RESPONSES.q14_ideal_day.slice(0, 50)}... |`);
  o.push(`| q15 핵심욕구 | ${SURVEY_RESPONSES.q15_core_desire} |`);
  o.push(`| q16 핫시나리오 | ${SURVEY_RESPONSES.q16_hot_scenario.slice(0, 50)}... |`);
  o.push(`| q17 관계규칙 | ${SURVEY_RESPONSES.q17_relationship_rules.rules.slice(0, 50)}... |`);
  o.push(`| q18 핵심신념 | ${SURVEY_RESPONSES.q18_core_belief_choice.slice(0, 50)}... |`);

  // ── Phase 1 분석 결과 ──
  o.push('\n---\n');
  o.push('## Phase 1 분석 결과\n');

  o.push('### YouTube 16카테고리 분포\n');
  o.push('| 카테고리 | 채널 수 | 비율 | 대표 채널 |');
  o.push('|----------|---------|------|-----------|');
  for (const cat of youtubeAnalysis.categoryResults) {
    o.push(
      `| ${cat.name} | ${cat.count}개 | ${cat.percent}% | ${cat.channels.slice(0, 3).join(', ')} |`
    );
  }

  o.push(`\n### 희소성 분석\n`);
  o.push(`- **상위 ${youtubeAnalysis.rarity.percentile}%** (코사인 유사도: ${youtubeAnalysis.rarity.cosineSimilarity.toFixed(3)})`);
  o.push(`- 가장 희귀한 카테고리: **${youtubeAnalysis.rarity.rarestCategoryName}** (사용자 비율 ${youtubeAnalysis.rarity.rarestCategoryPercent}%)`);
  o.push(`- 해당 채널: ${youtubeAnalysis.rarity.rarestCategoryChannels.join(', ')}`);

  o.push('\n### TCI 6축\n');
  o.push('| 축 | 점수 | 정규화 |');
  o.push('|-----|------|--------|');
  const tciLabels: Record<string, string> = {
    NS: '자극추구', HA: '위험회피', RD: '연대감', P: '인내력', SD: '자율성', CO: '협동성', ST: '자기초월',
  };
  const ytTci = youtubeAnalysis.tciScores;
  for (const [key, label] of Object.entries(tciLabels)) {
    const k = key as keyof typeof tci_scores;
    o.push(
      `| ${label}(${key}) | ${tci_scores[k]} | YouTube정규화: ${(ytTci as any)[key] ?? '-'} |`
    );
  }

  o.push(`\n### 주요 축\n`);
  o.push(`- **1위**: ${youtubeAnalysis.topBottom.top1.name} (${youtubeAnalysis.topBottom.top1.score}점)`);
  o.push(`- **2위**: ${youtubeAnalysis.topBottom.top2.name} (${youtubeAnalysis.topBottom.top2.score}점)`);
  o.push(`- **최저**: ${youtubeAnalysis.topBottom.bottom.name} (${youtubeAnalysis.topBottom.bottom.score}점)`);

  o.push(`\n### MBTI / Enneagram\n`);
  o.push(`- **MBTI**: ${mbti.type} (E=${mbti.scores.E} I=${mbti.scores.I} S=${mbti.scores.S} N=${mbti.scores.N} T=${mbti.scores.T} F=${mbti.scores.F} J=${mbti.scores.J} P=${mbti.scores.P})`);
  o.push(`- **Enneagram**: ${enneagram.type}번 (head=${enneagram.center.head} heart=${enneagram.center.heart} body=${enneagram.center.body})`);

  o.push(`\n### 매칭 남편 타입\n`);
  o.push(`- **유형**: ${husbandTypeData.name} (${husbandTypeData.id})`);
  o.push(`- **카테고리**: ${husbandTypeData.category} > ${husbandTypeData.subcategory}`);
  o.push(`- **매칭 점수**: ${Math.round(matchScore * 100)}%`);
  o.push(`- **설명**: ${husbandTypeData.description.slice(0, 200)}`);
  if (husbandTypeData.metaphor) {
    o.push(`- **비유**: ${husbandTypeData.metaphor}`);
  }

  o.push(`\n### 10카테고리 (TCI 분류)\n`);
  o.push('| 카테고리 | 채널 수 |');
  o.push('|----------|---------|');
  for (const [key, value] of Object.entries(channel_categories)) {
    if (value > 0) {
      o.push(`| ${key} | ${value} |`);
    }
  }

  // ── Phase 1 카드 9장 ──
  o.push('\n---\n');
  o.push('## Phase 1 카드 9장\n');

  for (const card of phase1Cards) {
    const charCount = card.content.length;
    o.push(`### 카드 ${card.card_number}: ${card.title}`);
    if (card.subtitle) o.push(`*${card.subtitle}*`);
    o.push(`(${charCount}자)\n`);
    o.push(card.content);
    o.push('\n---\n');
  }

  // ── Phase 2 교차검증 결과 ──
  o.push('## Phase 2 교차검증 결과\n');
  o.push(`**자기일치도**: ${Math.round(deepCrossValidation.authenticityScore * 100)}%\n`);

  o.push('### 8차원 교차검증\n');
  o.push('| 차원 | YouTube | 설문 | 차이 | 해석 |');
  o.push('|------|---------|------|------|------|');
  for (const dim of deepCrossValidation.dimensions) {
    o.push(
      `| ${dim.dimension} | ${dim.youtube_value} | ${dim.survey_value} | ${dim.diff > 0 ? '+' : ''}${dim.diff} | ${dim.interpretation.slice(0, 80)}... |`
    );
  }

  o.push('\n### 숨겨진 욕구\n');
  for (const desire of deepCrossValidation.hiddenDesires) {
    o.push(`**${desire.label}**`);
    o.push(`${desire.description}`);
    o.push(`> 근거: ${desire.source}\n`);
  }

  o.push('### 성격 3층 구조\n');
  o.push(`**겉모습 (YouTube 기반)**`);
  o.push(`${deepCrossValidation.personalityLayers.surface}\n`);
  o.push(`**의식적 자아 (설문 기반)**`);
  o.push(`${deepCrossValidation.personalityLayers.conscious}\n`);
  o.push(`**무의식 (불일치에서 도출)**`);
  o.push(`${deepCrossValidation.personalityLayers.unconscious}\n`);

  o.push('### 감정 청사진\n');
  o.push(`- **스트레스 반응**: ${deepCrossValidation.emotionalBlueprint.stressResponse}`);
  o.push(`- **회복 방식**: ${deepCrossValidation.emotionalBlueprint.healingPattern}`);
  o.push(`- **감정 표현도**: ${deepCrossValidation.emotionalBlueprint.emotionalExpression}/100`);
  o.push(`- **갈등 스타일**: ${deepCrossValidation.emotionalBlueprint.conflictStyle}`);

  // ── Phase 2 카드 9장 ──
  o.push('\n---\n');
  o.push('## Phase 2 카드 9장\n');

  for (let i = 1; i <= 9; i++) {
    const meta = PHASE2_CARD_META[i];
    const content = phase2ContentMap.get(i) ?? '(생성 실패)';
    const charCount = content.length;
    o.push(`### 카드 ${i}: ${meta.title}`);
    o.push(`*${meta.subtitle}*`);
    o.push(`(${charCount}자)\n`);
    o.push(content);
    o.push('\n---\n');
  }

  // ── 문체 검증 ──
  o.push('## 문체 검증 (이슬아 라이팅 가이드)\n');

  // Phase 1 카드 문체 검증
  o.push('### Phase 1 카드 문체 검증\n');
  let p1TotalViolations = 0;
  for (const card of phase1Cards) {
    const violations = checkStyleViolations(card.content);
    p1TotalViolations += violations.length;
    if (violations.length > 0) {
      o.push(`**카드 ${card.card_number}: ${card.title}** — ${violations.length}건 위반`);
      for (const v of violations) {
        o.push(`- ${v}`);
      }
      o.push('');
    }
  }
  if (p1TotalViolations === 0) {
    o.push('모든 카드 통과 (위반 0건)\n');
  } else {
    o.push(`총 ${p1TotalViolations}건 위반\n`);
  }

  // Phase 2 카드 문체 검증
  o.push('### Phase 2 카드 문체 검증\n');
  let p2TotalViolations = 0;
  for (let i = 1; i <= 9; i++) {
    const content = phase2ContentMap.get(i) ?? '';
    const meta = PHASE2_CARD_META[i];
    const violations = checkStyleViolations(content);
    p2TotalViolations += violations.length;
    if (violations.length > 0) {
      o.push(`**카드 ${i}: ${meta.title}** — ${violations.length}건 위반`);
      for (const v of violations) {
        o.push(`- ${v}`);
      }
      o.push('');
    }
  }
  if (p2TotalViolations === 0) {
    o.push('모든 카드 통과 (위반 0건)\n');
  } else {
    o.push(`총 ${p2TotalViolations}건 위반\n`);
  }

  // ── 검증 요약 ──
  o.push('---\n');
  o.push('## 검증 요약\n');

  // 카드 #1(고정 인트로), #9(고정 CTA)는 LLM 미사용이므로 길이 검증에서 제외
  const p1LLMCards = phase1Cards.filter((c) => c.card_number >= 2 && c.card_number <= 8);
  const p1Short = p1LLMCards.filter((c) => c.content.length < 1500);
  const p2Short = Array.from(phase2ContentMap.entries()).filter(([, v]) => v.length < 1800);
  const desireCount = deepCrossValidation.hiddenDesires.length;
  const bigGaps = deepCrossValidation.dimensions.filter((d) => Math.abs(d.diff) >= 20);

  o.push(`| 항목 | 결과 | 기준 |`);
  o.push(`|------|------|------|`);
  o.push(`| Phase 1 카드 수 | ${phase1Cards.length}장 | 9장 |`);
  o.push(`| Phase 1 LLM 카드(#2~#8) 1500자 미달 | ${p1Short.length}장/${p1LLMCards.length}장 (${p1Short.map((c) => `#${c.card_number}`).join(', ') || '없음'}) | 0장 |`);
  o.push(`| Phase 2 카드 수 | ${phase2ContentMap.size}장 | 9장 |`);
  o.push(`| Phase 2 1800자 미달 | ${p2Short.length}장 (${p2Short.map(([n]) => `#${n}`).join(', ') || '없음'}) | 0장 |`);
  o.push(`| 숨겨진 욕구 | ${desireCount}개 | 3개 이상 |`);
  o.push(`| 주요 불일치 차원 | ${bigGaps.length}개 | 확인 |`);
  o.push(`| P1 문체 위반 | ${p1TotalViolations}건 | 최소화 |`);
  o.push(`| P2 문체 위반 | ${p2TotalViolations}건 | 최소화 |`);
  o.push(`| 총 소요 시간 | ${totalTime}초 | - |`);

  // 파일 저장
  const outputPath = resolve(process.cwd(), 'phase2-test-output.md');
  writeFileSync(outputPath, o.join('\n'), 'utf-8');

  // JSON 미리보기 데이터 저장 (dev preview 페이지용)
  const phase2Cards: ReportCard[] = [];
  for (let i = 1; i <= 9; i++) {
    const meta = PHASE2_CARD_META[i];
    phase2Cards.push({
      card_number: i,
      title: meta.title,
      subtitle: meta.subtitle,
      content: phase2ContentMap.get(i) ?? '(생성 실패)',
      card_type: meta.card_type,
    });
  }

  const previewData = {
    phase1: {
      id: 'test-phase1-id',
      user_id: 'test-user-id',
      channel_categories,
      tci_scores,
      enneagram_center: enneagram.center,
      enneagram_type: enneagram.type,
      mbti_scores: mbti.scores,
      mbti_type: mbti.type,
      user_vector,
      matched_husband_type: matchedHusbandTypeId,
      match_score: matchScore,
      match_method: 'vector',
      cards: phase1Cards,
      user_name: null,
      birth_date: '1991-02-18',
      created_at: new Date().toISOString(),
    },
    phase2: {
      id: 'test-phase2-id',
      user_id: 'test-user-id',
      phase1_id: 'test-phase1-id',
      survey_id: 'test-survey-id',
      payment_id: 'test-payment-id',
      cross_validation_insights: {
        discrepancies: deepCrossValidation.dimensions.map((d) => ({
          dimension: d.dimension,
          youtube_value: d.youtube_value,
          survey_value: d.survey_value,
          interpretation: d.interpretation,
        })),
        hidden_desires: deepCrossValidation.hiddenDesires.map((d) => d.description),
        authenticity_score: deepCrossValidation.authenticityScore,
      },
      deep_cards: phase2Cards,
      created_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
    },
  };

  const previewPath = resolve(process.cwd(), 'test-data', 'preview-data.json');
  writeFileSync(previewPath, JSON.stringify(previewData, null, 2), 'utf-8');

  console.log(`\n\u2713 결과 저장: ${outputPath}`);
  console.log(`\u2713 미리보기 데이터: ${previewPath}`);
  console.log(`\n총 소요 시간: ${totalTime}초`);

  // 콘솔 검증 요약
  console.log('\n--- 검증 ---');
  console.log(`Phase 1 카드: ${phase1Cards.length}장 (LLM #2~#8 중 1500자 미달: ${p1Short.length}장/${p1LLMCards.length}장)`);
  console.log(`Phase 2 카드: ${phase2ContentMap.size}장 (1800자 미달: ${p2Short.length}장)`);
  console.log(`숨겨진 욕구: ${desireCount}개`);
  console.log(`주요 불일치: ${bigGaps.length}개`);
  console.log(`P1 문체 위반: ${p1TotalViolations}건`);
  console.log(`P2 문체 위반: ${p2TotalViolations}건`);
  console.log('='.repeat(55) + '\n');
}

main().catch((err) => {
  console.error('\n테스트 실패:', err);
  process.exit(1);
});
