import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildVectorFromSurvey } from '@/lib/husband-match/analysis/survey-to-vector';
import { runPhase1FromChannels, runPhase1FromPrecomputed } from './run-from-channels';
import type { ChannelData } from '@/lib/husband-match/types';
import type { Phase1SurveyAnswer } from '@/lib/husband-match/data/phase1-survey-questions';

/**
 * Phase 1 Analysis API
 *
 * - survey_answers 있음: buildVectorFromSurvey → runPhase1FromPrecomputed
 * - survey_answers 없음: YouTube 구독 조회 → runPhase1FromChannels
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

    const { data: existing } = await supabase
      .from('phase1_results')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json({
        phase1_id: existing.id,
        message: 'Analysis already exists',
      });
    }

    const body = await request.json().catch(() => ({}));
    const survey_answers = body.survey_answers as Phase1SurveyAnswer | undefined;

    if (survey_answers && Object.keys(survey_answers).length > 0) {
      const surveyResult = buildVectorFromSurvey(survey_answers);
      const { phase1_id } = await runPhase1FromPrecomputed(supabase, user.id, {
        channel_categories: surveyResult.channel_categories,
        tci_scores: surveyResult.tci_scores,
        enneagram_center: surveyResult.enneagram_center,
        enneagram_type: surveyResult.enneagram_type,
        mbti_scores: surveyResult.mbti_scores,
        mbti_type: surveyResult.mbti_type,
        user_vector: surveyResult.user_vector,
        channelCount: Object.values(surveyResult.channel_categories).reduce((s, v) => s + v, 0) || 1,
      });
      return NextResponse.json({
        success: true,
        phase1_id,
        message: 'Phase 1 analysis completed',
      });
    }

    const { data: subscriptions, error: subsError } = await supabase
      .from('youtube_subscriptions')
      .select('channel_id, channel_title, channel_description')
      .eq('user_id', user.id);

    if (subsError || !subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { error: 'No YouTube subscriptions found. Please connect your YouTube account first.' },
        { status: 400 }
      );
    }

    const channels: ChannelData[] = subscriptions.map((row: { channel_id: string; channel_title: string; channel_description: string }) => ({
      channel_id: row.channel_id,
      channel_title: row.channel_title,
      channel_description: row.channel_description ?? '',
    }));

    const { phase1_id } = await runPhase1FromChannels(supabase, user.id, channels);

    return NextResponse.json({
      success: true,
      phase1_id,
      message: 'Phase 1 analysis completed',
    });
  } catch (error: unknown) {
    console.error('Phase 1 analysis error:', error);
    const message = error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
