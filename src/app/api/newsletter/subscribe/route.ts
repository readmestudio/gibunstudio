import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResend, getFromAddress, getSiteUrl } from "@/lib/newsletter/resend-client";
import { buildWelcomeEmail } from "@/lib/newsletter/email-templates";

/**
 * POST /api/newsletter/subscribe
 *
 * Body: { email: string }
 *
 * 동작:
 * 1. 이메일 형식 검증
 * 2. 기존 구독자 조회
 *    - active: 이미 구독 중 → 200 응답 (조용히 성공 처리, 이메일 재발송 없음)
 *    - unsubscribed: 재활성화 (status='active', unsubscribed_at=null)
 *    - 없음: 새 레코드 생성
 * 3. 환영 메일 발송 (실패해도 구독은 성공 — 이메일 실패로 UX 막지 않음)
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청 형식입니다." },
      { status: 400 }
    );
  }

  const rawEmail =
    typeof body === "object" && body !== null && "email" in body
      ? (body as { email?: unknown }).email
      : undefined;
  if (typeof rawEmail !== "string") {
    return NextResponse.json(
      { error: "이메일을 입력해주세요." },
      { status: 400 }
    );
  }

  const email = rawEmail.trim().toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: "이메일 형식을 확인해주세요." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // 기존 구독자 조회
  const { data: existing, error: selectError } = await admin
    .from("newsletter_subscribers")
    .select("id, email, status, unsubscribe_token")
    .eq("email", email)
    .maybeSingle();

  if (selectError) {
    console.error("[newsletter/subscribe] SELECT 실패:", selectError);
    return NextResponse.json(
      { error: "잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }

  let subscriberToken: string;

  if (existing && existing.status === "active") {
    // 이미 활성 구독 — 조용히 성공 처리
    return NextResponse.json({ ok: true, alreadySubscribed: true });
  }

  if (existing && existing.status === "unsubscribed") {
    // 재활성화
    const { error: updateError } = await admin
      .from("newsletter_subscribers")
      .update({ status: "active", unsubscribed_at: null })
      .eq("id", existing.id);
    if (updateError) {
      console.error("[newsletter/subscribe] UPDATE 실패:", updateError);
      return NextResponse.json(
        { error: "잠시 후 다시 시도해주세요." },
        { status: 500 }
      );
    }
    subscriberToken = existing.unsubscribe_token;
  } else {
    // 신규 등록 (DB가 unsubscribe_token 자동 생성)
    const { data: inserted, error: insertError } = await admin
      .from("newsletter_subscribers")
      .insert({ email })
      .select("unsubscribe_token")
      .single();
    if (insertError || !inserted) {
      console.error("[newsletter/subscribe] INSERT 실패:", insertError);
      return NextResponse.json(
        { error: "잠시 후 다시 시도해주세요." },
        { status: 500 }
      );
    }
    subscriberToken = inserted.unsubscribe_token;
  }

  // 환영 메일 발송 (실패해도 구독은 성공)
  try {
    const unsubscribeUrl = `${getSiteUrl()}/api/newsletter/unsubscribe?token=${subscriberToken}`;
    const mail = buildWelcomeEmail({ email, unsubscribeUrl });
    await getResend().emails.send({
      from: getFromAddress(),
      to: email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
  } catch (err) {
    console.error("[newsletter/subscribe] 환영 메일 발송 실패:", err);
    // 구독 자체는 성공 상태로 응답
  }

  return NextResponse.json({ ok: true });
}
