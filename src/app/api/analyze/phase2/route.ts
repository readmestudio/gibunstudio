import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { chatCompletion } from '@/lib/openai-client';
import { SYSTEM_PROMPT } from '@/lib/husband-match/prompts/system-prompt';
import {
  PHASE2_CARD_PROMPTS,
  Phase2CardData,
} from '@/lib/husband-match/prompts/phase2-prompts';
import type { ReportCard } from '@/lib/husband-match/types';

type Phase1Row = {
  id: string;
  mbti_scores: { E: number; I: number; J: number; P: number; F: number; T: number };
  mbti_type: string | null;
  enneagram_type: number | null;
  matched_husband_type: string;
  match_score: number;
};

/**
 * Build cross-validation: compare Phase 1 (YouTube) with survey responses
 */
function buildCrossValidation(
  phase1: Phase1Row,
  surveyResponses: Record<string, unknown>
): {
  discrepancies: Array<{
    dimension: string;
    youtube_value: number;
    survey_value: number;
    interpretation: string;
  }>;
  hidden_desires: string[];
  authenticity_score: number;
} {
  const discrepancies: Array<{
    dimension: string;
    youtube_value: number;
    survey_value: number;
    interpretation: string;
  }> = [];
  const mbti = phase1.mbti_scores ?? { E: 50, I: 50, J: 50, P: 50, F: 50, T: 50 };

  const q1 = surveyResponses['q1_relationship_style'];
  const q3 = surveyResponses['q3_ideal_weekend'];
  const q5 = surveyResponses['q5_future_planning'];

  const youtubeE = mbti.E ?? 50;
  let surveyE = 50;
  if (typeof q1 === 'string') {
    if (q1.includes('매일 연락') || q1.includes('자주 만나')) surveyE = 75;
    else if (q1.includes('각자의 시간') || q1.includes('존중')) surveyE = 30;
    else surveyE = 50;
  }
  if (typeof q3 === 'string') {
    if (q3.includes('친구들과') || q3.includes('활동적')) surveyE = Math.max(surveyE, 80);
    else if (q3.includes('집에서') || q3.includes('혼자만')) surveyE = Math.min(surveyE, 35);
  }
  const eDiff = Math.abs(youtubeE - surveyE);
  if (eDiff >= 20) {
    discrepancies.push({
      dimension: 'E/I (외향성)',
      youtube_value: Math.round(youtubeE),
      survey_value: Math.round(surveyE),
      interpretation:
        youtubeE > surveyE
          ? 'YouTube 시청 패턴은 외향적 성향을 보이지만, 설문에서는 내향적 선호를 선택하셨습니다. 실제 행동과 이상적 자아의 차이를 보여줍니다.'
          : 'YouTube에서는 내향적 성향이 보이지만, 설문에서는 외향적 관계를 원하신다고 답하셨습니다. 숨겨진 친밀감에 대한 욕구를 나타낼 수 있습니다.',
    });
  }

  const youtubeJ = mbti.J ?? 50;
  let surveyJ = 50;
  if (typeof q5 === 'string') {
    if (q5.includes('구체적') || q5.includes('계획')) surveyJ = 80;
    else if (q5.includes('현재에 집중')) surveyJ = 25;
    else surveyJ = 50;
  }
  const jDiff = Math.abs(youtubeJ - surveyJ);
  if (jDiff >= 20) {
    discrepancies.push({
      dimension: 'J/P (계획성)',
      youtube_value: Math.round(youtubeJ),
      survey_value: Math.round(surveyJ),
      interpretation:
        '콘텐츠 선호와 설문에서 말한 계획 스타일이 다르게 나타났습니다. 일상에서는 유연하게 지내고 싶지만, 관계에서는 계획을 원하시는 등 상황에 따른 선호가 있을 수 있습니다.',
    });
  }

  const hidden_desires: string[] = [];
  if (eDiff >= 20 && surveyE > youtubeE) {
    hidden_desires.push('겉으로는 독립적이지만 내면에선 깊은 유대감을 갈망');
  }
  if (eDiff >= 20 && youtubeE > surveyE) {
    hidden_desires.push('혼자만의 시간을 소중히 하면서도 타인의 인정을 원함');
  }
  if (jDiff >= 20) {
    hidden_desires.push('논리적 계획과 감성적 유연함 사이에서 균형을 추구');
  }
  if (hidden_desires.length === 0) {
    hidden_desires.push('YouTube와 설문 응답이 대체로 일치하여, 자기 인식이 높은 편으로 보입니다.');
  }

  const authenticity_score = Math.max(
    0,
    Math.min(1, 1 - discrepancies.length * 0.15 - (eDiff + jDiff) / 200)
  );

  return {
    discrepancies,
    hidden_desires,
    authenticity_score,
  };
}

const PHASE2_CARD_KEYS: (keyof typeof PHASE2_CARD_PROMPTS)[] = [
  'card_01_cross_validation',
  'card_02_hidden_desires',
  'card_03_real_vs_ideal',
  'card_04_deep_values',
  'card_05_patterns',
  'card_06_growth',
  'card_07_final_match',
  'card_08_action_plan',
];

const PHASE2_CARD_META: Record<number, { title: string; subtitle?: string; card_type: ReportCard['card_type'] }> = {
  1: { title: '진짜 당신 vs 설문 속 당신', subtitle: '교차 검증', card_type: 'personality' },
  2: { title: '숨겨진 욕구', subtitle: '교차검증 인사이트', card_type: 'values' },
  3: { title: 'YouTube vs 설문 차이', subtitle: '진짜 나와 이상적 나', card_type: 'personality' },
  4: { title: '심층 가치관', subtitle: '결혼·연애에서 소중한 것', card_type: 'values' },
  5: { title: '관계 패턴', subtitle: '당신의 관계 스타일', card_type: 'values' },
  6: { title: '성장 포인트', subtitle: '관계에서 성장하기', card_type: 'result' },
  7: { title: '최종 남편상', subtitle: 'Phase 1+2 종합', card_type: 'matching' },
  8: { title: '당신을 위한 액션 플랜', subtitle: '다음 단계', card_type: 'result' },
};

async function generatePhase2CardContent(
  cardKey: keyof typeof PHASE2_CARD_PROMPTS,
  data: Phase2CardData
): Promise<string> {
  const prompt = PHASE2_CARD_PROMPTS[cardKey](data);
  const response = await chatCompletion(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    { model: 'gpt-4-turbo', temperature: 0.7, max_tokens: 600 }
  );
  return (response ?? '').trim().slice(0, 2000);
}

/**
 * Phase 2 Analysis API
 *
 * 1. Load Phase 1 results + survey
 * 2. Cross-validate YouTube vs survey
 * 3. Generate 8 deep cards (LLM)
 * 4. Store in phase2_results
 */
export async function POST(request: NextRequest) {
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

    const { data: phase1, error: phase1Error } = await supabase
      .from('phase1_results')
      .select('id, mbti_scores, mbti_type, enneagram_type, matched_husband_type, match_score')
      .eq('id', phase1_id)
      .single();

    if (phase1Error || !phase1) {
      return NextResponse.json(
        { error: 'Phase 1 results not found' },
        { status: 404 }
      );
    }

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
    const cross_validation = buildCrossValidation(
      phase1 as Phase1Row,
      surveyResponses
    );

    const phase2CardData: Phase2CardData = {
      phase1_summary: {
        mbti_type: phase1.mbti_type,
        enneagram_type: phase1.enneagram_type,
        matched_husband_name: phase1.matched_husband_type,
        match_score: phase1.match_score,
      },
      survey_responses: surveyResponses,
      cross_validation,
      final_match: {
        name: phase1.matched_husband_type,
        description: 'Phase 1 YouTube 분석과 Phase 2 설문을 종합한 최종 남편상입니다.',
      },
    };

    const deep_cards: ReportCard[] = [];

    for (let i = 0; i < PHASE2_CARD_KEYS.length; i++) {
      const key = PHASE2_CARD_KEYS[i];
      const cardNumber = i + 1;
      const meta = PHASE2_CARD_META[cardNumber];
      let content: string;
      try {
        content = await generatePhase2CardContent(key, phase2CardData);
      } catch (err) {
        console.error(`[Phase 2] Card ${cardNumber} generation failed:`, err);
        content = '심층 분석 생성 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
      }
      deep_cards.push({
        card_number: cardNumber,
        title: meta.title,
        subtitle: meta.subtitle,
        content,
        card_type: meta.card_type,
      });
    }

    const payload = {
      user_id: user.id,
      phase1_id,
      survey_id,
      payment_id,
      cross_validation_insights: cross_validation,
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
