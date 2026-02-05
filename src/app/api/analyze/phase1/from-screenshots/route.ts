import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { visionCompletion, type VisionImageInput } from '@/lib/openai-client';
import { runPhase1FromChannels } from '../run-from-channels';
import type { ChannelData } from '@/lib/husband-match/types';

const MIN_IMAGES = 3;
const CHANNEL_EXTRACTION_PROMPT = `이 이미지는 YouTube 구독 목록 화면입니다. 보이는 모든 채널 이름(채널 타이틀)만 추출해 한 줄에 하나씩 출력해 주세요. "구독", "전체", "관련성 순" 같은 UI 텍스트나 버튼 이름은 제외하고, 채널 이름만 나열해 주세요.`;

function parseChannelNamesFromText(text: string): string[] {
  const lines = text
    .split(/\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of lines) {
    const name = line.replace(/^[\d.)\s\-]+/, '').trim();
    if (name && !seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase());
      result.push(name);
    }
  }
  return result;
}

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

    const formData = await request.formData();
    const files = formData.getAll('images').filter((f): f is File => f instanceof File);
    if (files.length < MIN_IMAGES) {
      return NextResponse.json(
        { error: `최소 ${MIN_IMAGES}장의 이미지를 업로드해 주세요.` },
        { status: 400 }
      );
    }

    const allChannelNames: string[] = [];
    const seen = new Set<string>();

    for (const file of files) {
      const buf = await file.arrayBuffer();
      const base64 = Buffer.from(buf).toString('base64');
      const mediaType = file.type || 'image/png';

      const imageInput: VisionImageInput = { type: 'base64', mediaType, data: base64 };
      const text = await visionCompletion(
        [imageInput],
        CHANNEL_EXTRACTION_PROMPT,
        { model: 'gpt-4o', max_tokens: 1024 }
      );
      const names = parseChannelNamesFromText(text);
      for (const name of names) {
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          allChannelNames.push(name);
        }
      }
    }

    if (allChannelNames.length === 0) {
      return NextResponse.json(
        { error: '이미지에서 채널 이름을 추출하지 못했습니다. YouTube 구독 목록 화면(구독 > 전체 > 관련성 순) 캡처인지 확인해 주세요.' },
        { status: 400 }
      );
    }

    const channels: ChannelData[] = allChannelNames.map((channel_title, i) => ({
      channel_id: `ocr-${i}`,
      channel_title,
      channel_description: '',
    }));

    const { phase1_id } = await runPhase1FromChannels(supabase, user.id, channels);

    return NextResponse.json({
      success: true,
      phase1_id,
      message: 'Phase 1 analysis completed',
    });
  } catch (error: unknown) {
    console.error('Phase 1 from-screenshots error:', error);
    const message = error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
