import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isCoachEmail } from '@/lib/auth/coach';

/**
 * 코치 전용: Phase 2 결과 퍼블리시
 * POST body: { phase2_id: string }
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

    if (!isCoachEmail(user.email)) {
      return NextResponse.json({ error: 'Coach only' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const phase2_id = body.phase2_id as string | undefined;

    if (!phase2_id) {
      return NextResponse.json({ error: 'phase2_id required' }, { status: 400 });
    }

    const { data: row, error: fetchError } = await supabase
      .from('phase2_results')
      .select('id')
      .eq('id', phase2_id)
      .single();

    if (fetchError || !row) {
      return NextResponse.json({ error: 'Phase 2 result not found' }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from('phase2_results')
      .update({
        published_at: new Date().toISOString(),
        published_by: user.id,
      })
      .eq('id', phase2_id);

    if (updateError) {
      console.error('Phase2 publish update error:', updateError);
      return NextResponse.json({ error: 'Failed to publish' }, { status: 500 });
    }

    return NextResponse.json({ success: true, phase2_id });
  } catch (e) {
    console.error('Phase2 publish error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 }
    );
  }
}
