import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { phase1_id, payment_id, survey_responses } = await request.json();

    if (!phase1_id || !payment_id || !survey_responses) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify payment is confirmed
    const { data: payment, error: paymentError } = await supabase
      .from('husband_match_payments')
      .select('id, status, user_id')
      .eq('id', payment_id)
      .eq('status', 'confirmed')
      .single();

    if (paymentError || !payment || payment.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Invalid or unconfirmed payment' },
        { status: 400 }
      );
    }

    // Store survey responses
    const { data: survey, error: surveyError } = await supabase
      .from('phase2_surveys')
      .insert({
        user_id: user.id,
        phase1_id,
        payment_id,
        survey_responses,
      })
      .select('id')
      .single();

    if (surveyError) {
      console.error('Failed to store survey:', surveyError);
      return NextResponse.json(
        { error: 'Failed to store survey responses' },
        { status: 500 }
      );
    }

    // Trigger Phase 2 analysis
    // Call the Phase 2 analysis endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const analyzeResponse = await fetch(`${baseUrl}/api/analyze/phase2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
      },
      body: JSON.stringify({
        phase1_id,
        survey_id: survey.id,
        payment_id,
      }),
    });

    if (!analyzeResponse.ok) {
      throw new Error('Failed to trigger Phase 2 analysis');
    }

    const { phase2_id } = await analyzeResponse.json();

    return NextResponse.json({
      success: true,
      survey_id: survey.id,
      phase2_id,
      message: 'Survey submitted and Phase 2 analysis completed',
    });
  } catch (error: any) {
    console.error('Survey submission error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit survey' },
      { status: 500 }
    );
  }
}
