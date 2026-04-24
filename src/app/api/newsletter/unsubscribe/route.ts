import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/newsletter/resend-client";

/**
 * GET/POST /api/newsletter/unsubscribe?token=...
 *
 * 구독 해지 엔드포인트. 이메일 내 "구독 해지" 링크에서 호출.
 * POST는 RFC 8058 "List-Unsubscribe-Post"(원클릭 해지) 대응.
 *
 * 처리 후 /unsubscribe 결과 페이지로 리다이렉트.
 */
async function handle(token: string | null) {
  const siteUrl = getSiteUrl();

  if (!token) {
    return NextResponse.redirect(`${siteUrl}/unsubscribe?status=invalid`);
  }

  const admin = createAdminClient();
  const { data: subscriber, error: selectError } = await admin
    .from("newsletter_subscribers")
    .select("id, email, status")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (selectError || !subscriber) {
    return NextResponse.redirect(`${siteUrl}/unsubscribe?status=invalid`);
  }

  if (subscriber.status === "unsubscribed") {
    return NextResponse.redirect(
      `${siteUrl}/unsubscribe?status=already&email=${encodeURIComponent(subscriber.email)}`
    );
  }

  const { error: updateError } = await admin
    .from("newsletter_subscribers")
    .update({ status: "unsubscribed", unsubscribed_at: new Date().toISOString() })
    .eq("id", subscriber.id);

  if (updateError) {
    console.error("[newsletter/unsubscribe] UPDATE 실패:", updateError);
    return NextResponse.redirect(`${siteUrl}/unsubscribe?status=error`);
  }

  return NextResponse.redirect(
    `${siteUrl}/unsubscribe?status=ok&email=${encodeURIComponent(subscriber.email)}`
  );
}

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  return handle(token);
}

export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  return handle(token);
}
