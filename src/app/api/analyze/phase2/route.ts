import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chatCompletion, safeJsonParse } from '@/lib/gemini-client';
import { PHASE2_SYSTEM_PROMPT } from '@/lib/husband-match/prompts/phase2-system-prompt';
import {
  PHASE2_CARD_PROMPTS,
  Phase2CardData,
} from '@/lib/husband-match/prompts/phase2-prompts';
import { buildDeepCrossValidation } from '@/lib/husband-match/analysis/deep-cross-validation';
import { getAllHusbandTypes } from '@/lib/husband-match/data/husband-types';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import type {
  ReportCard,
  TCIScores,
  MBTIScores,
  ChannelCategories,
  EnneagramCenter,
} from '@/lib/husband-match/types';

// ── Phase 1 DB 행 타입 ──

type Phase1Row = {
  id: string;
  tci_scores: TCIScores;
  channel_categories: ChannelCategories;
  enneagram_center: EnneagramCenter;
  enneagram_type: number | null;
  mbti_scores: MBTIScores;
  mbti_type: string | null;
  user_vector: number[];
  matched_husband_type: string;
  match_score: number;
  cards: ReportCard[];
  user_name?: string;
};

// ── 카드 키 & 메타데이터 (10장 구조) ──

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

const PHASE2_CARD_META: Record<number, { title: string; subtitle?: string; card_type: ReportCard['card_type'] }> = {
  1: { title: "'어떤 사람인지' 알았으니, 이제 '왜'를 찾아갑니다", subtitle: '교차 검증', card_type: 'personality' },
  2: { title: '당신이 삶에서 진짜 추구하는 것', subtitle: '가치관', card_type: 'values' },
  3: { title: '말하지 않았지만, 데이터가 말하고 있는 것', subtitle: '숨겨진 욕구', card_type: 'values' },
  4: { title: '마음의 연쇄 반응', subtitle: '감정 도미노', card_type: 'personality' },
  5: { title: '보이지 않는 규칙', subtitle: '관계 규칙', card_type: 'values' },
  6: { title: '핵심 신념이 만드는 관계의 모양', subtitle: '관계 패턴', card_type: 'values' },
  7: { title: '가장 두려워하는 것', subtitle: '두려움', card_type: 'values' },
  8: { title: '누구와도 잘 살기 위해 넘어야 할 문턱', subtitle: '성장 포인트', card_type: 'result' },
  9: { title: '설문이 확인한 당신의 파트너', subtitle: '심층 매칭', card_type: 'matching' },
  10: { title: 'Dear {userName},', subtitle: '마무리 편지', card_type: 'result' },
};

// ── LLM 호출 설정 ──

const LLM_OPTIONS = {
  model: 'gpt-4o-mini' as const, // gemini-client에서 gemini-2.5-flash로 매핑
  temperature: 0.75,
  max_tokens: 16384,
};

// ── 재시도 래퍼 ──

async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  maxRetries = 2
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      if (attempt > 0) console.log(`[Phase 2] ${label} 재시도 ${attempt}회 만에 성공`);
      return result;
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxRetries) {
        console.warn(`[Phase 2] ${label} 실패 (시도 ${attempt + 1}/${maxRetries + 1}): ${lastError.message} → 재시도...`);
        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }
  console.error(`[Phase 2] ${label} 최종 실패:`, lastError?.message);
  throw lastError ?? new Error(`${label} 최종 실패`);
}

// ── 카드 콘텐츠 생성 ──

async function generateCardContent(
  cardKey: keyof typeof PHASE2_CARD_PROMPTS,
  data: Phase2CardData
): Promise<string> {
  const prompt = PHASE2_CARD_PROMPTS[cardKey](data);

  // JSON 형식으로 응답받아 안정적으로 파싱
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

  // JSON 파싱 시도
  try {
    const parsed = safeJsonParse<{ content?: string }>(raw);
    if (parsed.content) {
      return parsed.content.trim().slice(0, 5000);
    }
  } catch {
    // JSON 파싱 실패 시 원본 텍스트 사용
  }

  // fallback: 원본 텍스트에서 content 추출 또는 그대로 사용
  return raw.trim().slice(0, 5000);
}

// ── 3배치 병렬 생성 (3+3+4장) ──

async function generateAllCardsInBatches(data: Phase2CardData): Promise<Map<number, string>> {
  const results = new Map<number, string>();

  // 배치 A: 카드 1-3 (도입부 — 교차검증 + 가치관 + 숨겨진 욕구)
  const batchA = async () => {
    const [c1, c2, c3] = await Promise.all([
      withRetry(() => generateCardContent('card_01_bridge', data), '카드 1 (교차 검증)'),
      withRetry(() => generateCardContent('card_02_life_meaning', data), '카드 2 (가치관)'),
      withRetry(() => generateCardContent('card_03_unconscious_desires', data), '카드 3 (숨겨진 욕구)'),
    ]);
    results.set(1, c1);
    results.set(2, c2);
    results.set(3, c3);
  };

  // 배치 B: 카드 4-6 (분석 — 감정 도미노/관계 규칙/관계 패턴)
  const batchB = async () => {
    const [c4, c5, c6] = await Promise.all([
      withRetry(() => generateCardContent('card_04_chain_reaction', data), '카드 4 (감정 도미노)'),
      withRetry(() => generateCardContent('card_05_invisible_rules', data), '카드 5 (관계 규칙)'),
      withRetry(() => generateCardContent('card_06_relationship_impact', data), '카드 6 (관계 패턴)'),
    ]);
    results.set(4, c4);
    results.set(5, c5);
    results.set(6, c6);
  };

  // 배치 C: 카드 7-10 (마무리 — 두려움/성장/심층매칭/편지)
  const batchC = async () => {
    const [c7, c8, c9, c10] = await Promise.all([
      withRetry(() => generateCardContent('card_07_deepest_fear', data), '카드 7 (두려움)'),
      withRetry(() => generateCardContent('card_08_growth', data), '카드 8 (성장 포인트)'),
      withRetry(() => generateCardContent('card_09_deep_match', data), '카드 9 (심층 매칭)'),
      withRetry(() => generateCardContent('card_10_letter', data), '카드 10 (편지)'),
    ]);
    results.set(7, c7);
    results.set(8, c8);
    results.set(9, c9);
    results.set(10, c10);
  };

  // 3배치 병렬 실행
  await Promise.all([batchA(), batchB(), batchC()]);

  return results;
}

/**
 * Phase 2 Analysis API
 *
 * 1. Phase 1 전체 데이터 + 서베이 로드
 * 2. 8차원 심층 교차검증 + CBT 분석 (HA/SD 직접 측정 + SCT + Hot Thought/중간신념/핵심신념)
 * 3. 3배치 병렬로 10장 카드 생성 (LLM)
 * 4. phase2_results에 저장
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request, RATE_LIMITS.ai);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { phase1_id, survey_id, payment_id } = body;

    if (!phase1_id || !survey_id || !payment_id) {
      return NextResponse.json(
        { error: 'Missing required fields: phase1_id, survey_id, payment_id' },
        { status: 400 }
      );
    }

    // 기존 결과 확인
    const { data: existing } = await supabase
      .from('phase2_results')
      .select('id')
      .eq('phase1_id', phase1_id)
      .single();

    if (existing) {
      return NextResponse.json({
        phase2_id: existing.id,
        message: 'Phase 2 analysis already exists',
      });
    }

    // ── Phase 1 전체 데이터 fetch (확장) ──
    const { data: phase1, error: phase1Error } = await supabase
      .from('phase1_results')
      .select('id, tci_scores, channel_categories, enneagram_center, enneagram_type, mbti_scores, mbti_type, user_vector, matched_husband_type, match_score, cards, user_name')
      .eq('id', phase1_id)
      .single();

    if (phase1Error || !phase1) {
      return NextResponse.json(
        { error: 'Phase 1 results not found' },
        { status: 404 }
      );
    }

    // 서베이 로드
    const { data: survey, error: surveyError } = await supabase
      .from('phase2_surveys')
      .select('*')
      .eq('id', survey_id)
      .single();

    if (surveyError || !survey) {
      return NextResponse.json(
        { error: 'Survey responses not found' },
        { status: 404 }
      );
    }

    const surveyResponses = (survey.survey_responses ?? {}) as Record<string, unknown>;

    // ── 남편 타입 전체 데이터 조회 ──
    const allHusbandTypes = getAllHusbandTypes();
    const husbandType = allHusbandTypes.find(t => t.id === phase1.matched_husband_type);
    const husbandTypeData = husbandType
      ? {
          id: husbandType.id,
          name: husbandType.name,
          category: husbandType.category,
          subcategory: husbandType.subcategory,
          description: husbandType.description,
          metaphor: husbandType.variant === 'extrovert'
            ? husbandType.metaphor_e
            : husbandType.metaphor_i,
        }
      : {
          id: phase1.matched_husband_type,
          name: phase1.matched_husband_type,
          category: '',
          subcategory: '',
          description: 'Phase 1에서 매칭된 파트너 유형입니다.',
          metaphor: undefined,
        };

    // ── 8차원 심층 교차검증 ──
    const phase1Data = phase1 as unknown as Phase1Row;

    // 설문 응답 매핑 (q1-q5: number, q6-q15: string)
    const mappedSurvey = {
      q1_together_time: surveyResponses['q1_together_time'] as number | undefined,
      q2_anxiety_influence: surveyResponses['q2_anxiety_influence'] as number | undefined,
      q3_logic_vs_emotion: surveyResponses['q3_logic_vs_emotion'] as number | undefined,
      q4_independence: surveyResponses['q4_independence'] as number | undefined,
      q5_emotional_expression: surveyResponses['q5_emotional_expression'] as number | undefined,
      q6_conflict_pattern: surveyResponses['q6_conflict_pattern'] as string | undefined,
      q7_partner_distance: surveyResponses['q7_partner_distance'] as string | undefined,
      q8_recurring_issue: surveyResponses['q8_recurring_issue'] as string | undefined,
      q9_stress_response: surveyResponses['q9_stress_response'] as string | undefined,
      q10_body_signal: surveyResponses['q10_body_signal'] as string | undefined,
      q11_comfort_source: surveyResponses['q11_comfort_source'] as string | undefined,
      q12_deepest_fear: surveyResponses['q12_deepest_fear'] as string | undefined,
      q13_want_to_change: surveyResponses['q13_want_to_change'] as string | undefined,
      q14_ideal_day: surveyResponses['q14_ideal_day'] as string | undefined,
      q15_core_desire: surveyResponses['q15_core_desire'] as string | undefined,
      q16_hot_scenario: surveyResponses['q16_hot_scenario'] as string | undefined,
      q17_relationship_rules: surveyResponses['q17_relationship_rules'] as { rules: string; positive_assumption: string; negative_assumption: string } | undefined,
      q18_core_belief_choice: surveyResponses['q18_core_belief_choice'] as string | undefined,
    };

    const deepCrossValidation = buildDeepCrossValidation(
      {
        tci_scores: phase1Data.tci_scores,
        mbti_scores: phase1Data.mbti_scores,
        mbti_type: phase1Data.mbti_type,
        enneagram_type: phase1Data.enneagram_type,
        enneagram_center: phase1Data.enneagram_center,
        channel_categories: phase1Data.channel_categories,
        matched_husband_type: phase1Data.matched_husband_type,
        match_score: phase1Data.match_score,
        cards: phase1Data.cards,
        user_name: phase1Data.user_name,
      },
      mappedSurvey
    );

    // ── Phase2CardData 조립 ──
    const phase2CardData: Phase2CardData = {
      phase1: {
        tci_scores: phase1Data.tci_scores,
        channel_categories: phase1Data.channel_categories,
        enneagram_center: phase1Data.enneagram_center,
        enneagram_type: phase1Data.enneagram_type,
        mbti_scores: phase1Data.mbti_scores,
        mbti_type: phase1Data.mbti_type,
        matched_husband_type: phase1Data.matched_husband_type,
        match_score: phase1Data.match_score,
        cards: phase1Data.cards,
        user_name: phase1Data.user_name,
      },
      survey: mappedSurvey,
      deepCrossValidation,
      husbandType: husbandTypeData,
    };

    // ── 3배치 병렬로 9장 카드 생성 ──
    console.log('[Phase 2] 카드 생성 시작 (3배치 × 10장 병렬)...');
    const startTime = Date.now();

    let contentMap: Map<number, string>;
    try {
      contentMap = await generateAllCardsInBatches(phase2CardData);
    } catch (err) {
      console.error('[Phase 2] 카드 생성 실패:', err);
      return NextResponse.json(
        { error: '심층 분석 카드 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' },
        { status: 500 }
      );
    }

    const elapsed = Date.now() - startTime;
    console.log(`[Phase 2] 카드 생성 완료 (${elapsed}ms)`);

    // 카드 조립
    const deep_cards: ReportCard[] = PHASE2_CARD_KEYS.map((_, i) => {
      const cardNumber = i + 1;
      const meta = PHASE2_CARD_META[cardNumber];
      const content = contentMap.get(cardNumber) ?? '심층 분석 생성 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
      return {
        card_number: cardNumber,
        title: meta.title,
        subtitle: meta.subtitle,
        content,
        card_type: meta.card_type,
      };
    });

    // ── cross_validation_insights 호환 형식으로 변환 (DB 저장용) ──
    const cross_validation_insights = {
      discrepancies: deepCrossValidation.dimensions.map(d => ({
        dimension: d.dimension,
        youtube_value: d.youtube_value,
        survey_value: d.survey_value,
        interpretation: d.interpretation,
      })),
      hidden_desires: deepCrossValidation.hiddenDesires.map(d => d.label),
      authenticity_score: deepCrossValidation.authenticityScore,
    };

    const payload = {
      user_id: user.id,
      phase1_id,
      survey_id,
      payment_id,
      cross_validation_insights,
      deep_cards,
    };

    const { data: phase2, error: phase2Error } = await supabase
      .from('phase2_results')
      .insert(payload)
      .select('id')
      .single();

    if (phase2Error) {
      console.error('Failed to store Phase 2 results:', phase2Error);
      return NextResponse.json(
        { error: 'Failed to store Phase 2 results' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      phase2_id: phase2.id,
      message: 'Phase 2 analysis completed',
    });
  } catch (error: unknown) {
    console.error('Phase 2 analysis error:', error);
    const message = error instanceof Error ? error.message : 'Phase 2 analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
