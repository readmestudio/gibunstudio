import { after, NextResponse } from "next/server";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidKrMobile, normalizePhone } from "@/lib/solapi/client";
import { notifySignupWelcomeForUser } from "@/lib/solapi/signup-notify";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // 1) URL query param에서 next 확인 (앱 전반의 `redirect=`도 함께 받는다)
  let next = searchParams.get("next") ?? searchParams.get("redirect") ?? "";

  // 2) query param이 없으면 쿠키에서 확인 (OAuth가 query param을 유실하는 경우 대비)
  if (!next) {
    const cookies = request.headers.get("cookie") ?? "";
    const match = cookies.match(/auth_redirect=([^;]+)/);
    if (match) next = decodeURIComponent(match[1]);
  }

  if (!next || !next.startsWith("/")) next = "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);
      // 사용한 쿠키 삭제
      response.cookies.set("auth_redirect", "", { path: "/", maxAge: 0 });
      // 소셜(카카오) 로그인 사후처리: 전화번호 확보 + profiles 보강 + 가입 환영 알림톡(멱등).
      // 리다이렉트 응답을 지연시키지 않도록 백그라운드(after)로 돌린다.
      after(() => afterSocialLogin(data));
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}

/**
 * 소셜 로그인 사후처리.
 *
 * 카카오 로그인은 phone_number 동의항목(필수)으로 전화번호를 준다. 단, Supabase 는 이
 * 값을 세션에 영구 저장하지 않으므로(콜백 시점에만 접근 가능), 여기서 provider_token 으로
 * 카카오 API 를 직접 호출해 번호를 확보하고 profiles.phone 에 저장한다. 그 뒤 '가입 환영'
 * 알림톡을 멱등 발송한다(재로그인해도 1회만).
 *
 * 실패해도 로그인 흐름에는 영향이 없다(이미 리다이렉트된 뒤 백그라운드 실행).
 */
async function afterSocialLogin(data: {
  user: User | null;
  session: Session | null;
}) {
  try {
    const { user, session } = data;
    if (!user) return;

    const provider = user.app_metadata?.provider;
    if (provider !== "kakao") return; // 전화번호를 주는 건 카카오뿐.

    // 전화번호 확보 — user_metadata 에 담겨 오면 사용, 없으면 카카오 API 로 조회.
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    let rawPhone =
      (meta.phone_number as string | undefined) ||
      (meta.phone as string | undefined) ||
      null;
    if (!rawPhone && session?.provider_token) {
      rawPhone = await fetchKakaoPhone(session.provider_token);
    }
    const phone = rawPhone ? normalizePhone(rawPhone) : "";
    const validPhone = isValidKrMobile(phone) ? phone : null;

    const name =
      (meta.name as string | undefined) ||
      (meta.full_name as string | undefined) ||
      (meta.nickname as string | undefined) ||
      null;

    // profiles 보강 — 기존 유저의 실제 email 을 덮지 않도록 insert/update 를 분기한다.
    // (profiles.email 은 NOT NULL 이고 카카오는 이메일 미동의 시 email 이 없을 수 있다.)
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("profiles")
      .select("id, phone")
      .eq("id", user.id)
      .maybeSingle();

    if (existing) {
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      // 저장된 번호가 없거나 무효일 때만 카카오 번호로 채운다(기존 번호 보존).
      if (validPhone && !isValidKrMobile((existing.phone ?? "").trim())) {
        patch.phone = validPhone;
      }
      await admin.from("profiles").update(patch).eq("id", user.id);
    } else {
      await admin.from("profiles").insert({
        id: user.id,
        // email 미동의 카카오도 profiles 를 만들 수 있도록 placeholder 를 넣는다(NOT NULL 충족).
        email: user.email || `kakao_${user.id}@kakao.local`,
        name,
        phone: validPhone,
      });
    }

    // 가입 환영 알림톡(멱등). 방금 저장한 번호를 hint 로 함께 넘긴다.
    await notifySignupWelcomeForUser(user.id, { phoneHint: validPhone, name });
  } catch (e) {
    console.error("[auth/callback] 소셜 로그인 사후처리 실패:", e);
  }
}

/** 카카오 사용자 정보 API 로 전화번호(kakao_account.phone_number)를 조회한다. */
async function fetchKakaoPhone(providerToken: string): Promise<string | null> {
  try {
    const res = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${providerToken}` },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as {
      kakao_account?: { phone_number?: string };
    };
    return body?.kakao_account?.phone_number ?? null;
  } catch {
    return null;
  }
}
