import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { visionCompletion, type VisionImageInput } from '@/lib/gemini-client';
import { runPhase1FromChannels } from '../run-from-channels';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import type { ChannelData } from '@/lib/husband-match/types';

const MIN_IMAGES = 3;
const MAX_IMAGES = 5; // 최대 5장만 처리하여 토큰 절약

// 모든 이미지를 한 번에 처리하는 프롬프트
const CHANNEL_EXTRACTION_PROMPT = `이 이미지들은 YouTube 구독 목록 화면 캡처입니다.
모든 이미지에서 보이는 채널 이름(채널 타이틀)을 추출해주세요.

규칙:
1. 채널 이름만 추출 (UI 텍스트 "구독", "전체", "관련성 순" 등 제외)
2. 중복 채널은 한 번만 출력
3. 한 줄에 채널 이름 하나씩 출력
4. 번호나 기호 없이 채널 이름만 출력`;

function parseChannelNamesFromText(text: string): string[] {
  const lines = text
    .split(/\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const line of lines) {
    const name = line.replace(/^[\d.)\s\-•·]+/, '').trim();
    if (name && name.length > 1 && !seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase());
      result.push(name);
    }
  }
  return result;
}

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

    // 프로필 정보 (이름 + 생년월일)
    const userName = formData.get('user_name');
    const birthYear = formData.get('birth_year');
    const birthMonth = formData.get('birth_month');
    const birthDay = formData.get('birth_day');
    const birthInfo = birthYear && birthMonth && birthDay
      ? {
          year: Number(birthYear),
          month: Number(birthMonth),
          day: Number(birthDay),
        }
      : undefined;

    // 최대 MAX_IMAGES장만 처리 (토큰 절약)
    const filesToProcess = files.slice(0, MAX_IMAGES);

    // 모든 이미지를 한 번에 Vision API로 전송
    const imageInputs: VisionImageInput[] = await Promise.all(
      filesToProcess.map(async (file) => {
        const buf = await file.arrayBuffer();
        const base64 = Buffer.from(buf).toString('base64');
        const mediaType = file.type || 'image/png';
        return { type: 'base64' as const, mediaType, data: base64 };
      })
    );

    // 1회의 Vision API 호출로 모든 채널 추출
    console.log(`[from-screenshots] Processing ${imageInputs.length} images for user ${user.id}`);
    let text: string;
    try {
      text = await visionCompletion(
        imageInputs,
        CHANNEL_EXTRACTION_PROMPT,
        { model: 'gpt-4o-mini', max_tokens: 2048 } // gpt-4o-mini 사용으로 비용 절감
      );
      console.log(`[from-screenshots] Vision API returned: ${text.slice(0, 200)}...`);
    } catch (visionError) {
      console.error('[from-screenshots] Vision API error:', visionError);
      throw new Error(`Vision API 오류: ${visionError instanceof Error ? visionError.message : 'Unknown error'}`);
    }

    const allChannelNames = parseChannelNamesFromText(text);

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

    console.log(`[from-screenshots] Extracted ${channels.length} channels, running Phase1 analysis...`);
    let phase1_id: string;
    try {
      const result = await runPhase1FromChannels(supabase, user.id, channels, birthInfo, userName ? String(userName).trim() : undefined);
      phase1_id = result.phase1_id;
      console.log(`[from-screenshots] Phase1 completed with id: ${phase1_id}`);
    } catch (phase1Error) {
      console.error('[from-screenshots] Phase1 error:', phase1Error);
      throw new Error(`분석 처리 오류: ${phase1Error instanceof Error ? phase1Error.message : 'Unknown error'}`);
    }

    return NextResponse.json({
      success: true,
      phase1_id,
      message: 'Phase 1 analysis completed',
    });
  } catch (error: unknown) {
    console.error('Phase 1 from-screenshots error:', error);
    // 상세 에러 로깅
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    const message = error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
