import { createAdminClient } from "@/lib/supabase/admin";
import { sendSignupWelcomeAlimtalk } from "./messages";
import { isValidKrMobile, normalizePhone } from "./client";

/**
 * 특정 유저에게 '가입 환영' 알림톡을 1회 발송한다(멱등). 이메일 가입 라우트와 카카오
 * 콜백이 공유하는 단일 진입점 — 발송 판단·중복방지·번호 확보 로직을 한곳에 모은다.
 *
 * 동작:
 *   1) profiles.welcome_alimtalk_sent_at 이 있으면 스킵(이미 보냄).
 *   2) 수신번호는 profiles.phone 우선, 비어 있으면 phoneHint(카카오 전화번호 등)로 보강하고
 *      profiles.phone 에 저장해 둔다(다음 조회·발송에 재사용).
 *   3) 유효한 번호가 없으면 스킵(소셜 가입에서 번호 미동의 등).
 *   4) 발송 성공 시에만 sent_at 을 찍어, 일시적 실패는 다음 호출에서 재시도 가능하게 둔다.
 *
 * 실패해도 예외를 던지지 않는다 — 가입/로그인 본 흐름에 곁다리로 붙는 알림이므로.
 */
export async function notifySignupWelcomeForUser(
  userId: string,
  opts?: { phoneHint?: string | null; name?: string | null }
): Promise<{ sent: boolean; reason?: string }> {
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("phone, name, welcome_alimtalk_sent_at")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.welcome_alimtalk_sent_at) {
    return { sent: false, reason: "already_sent" };
  }

  // 번호 결정 — 저장된 번호가 유효하면 그대로, 아니면 hint 로 보강.
  let phone = (profile?.phone ?? "").trim();
  if (!isValidKrMobile(phone) && opts?.phoneHint) {
    const hint = normalizePhone(opts.phoneHint);
    if (isValidKrMobile(hint)) {
      phone = hint;
      // profiles.phone 이 비어/무효였으면 채워 둔다(카카오 번호 저장).
      await admin.from("profiles").update({ phone }).eq("id", userId);
    }
  }

  if (!isValidKrMobile(phone)) {
    return { sent: false, reason: "no_phone" };
  }

  const result = await sendSignupWelcomeAlimtalk({
    phone,
    name: profile?.name ?? opts?.name ?? null,
  });

  if (result.success) {
    await admin
      .from("profiles")
      .update({ welcome_alimtalk_sent_at: new Date().toISOString() })
      .eq("id", userId);
    return { sent: true };
  }

  console.error("[signup-welcome] 알림톡 발송 실패:", result.reason);
  return { sent: false, reason: result.reason };
}
