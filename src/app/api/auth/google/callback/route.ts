import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

/**
 * Google OAuth callback - YouTube 연동 전용
 * Supabase 가입/로그인은 하지 않음. 카카오/이메일로 로그인한 사용자가
 * YouTube 구독 데이터만 가져오기 위해 연동하는 경우 사용.
 * code → access_token 교환 후 loading 페이지로 토큰 전달.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

  if (error) {
    return NextResponse.redirect(
      `${baseUrl}/husband-match/onboarding?error=access_denied`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${baseUrl}/husband-match/onboarding?error=no_code`
    );
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${baseUrl}/api/auth/google/callback`
    );

    const { tokens } = await oauth2Client.getToken(code);

    const tokenData = Buffer.from(
      JSON.stringify({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
      })
    ).toString('base64');

    return NextResponse.redirect(
      `${baseUrl}/husband-match/loading?tokens=${tokenData}`
    );
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(
      `${baseUrl}/husband-match/onboarding?error=auth_failed`
    );
  }
}
