import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { notifySignupWelcomeForUser } from "@/lib/solapi/signup-notify";

/**
 * POST /api/notify/signup-welcome  (로그인 세션 필요)
 *
 * 이메일 회원가입 직후 클라이언트가 호출 → 방금 만들어진 세션의 유저에게 '가입 환영'
 * 알림톡을 1회 발송한다. 신원은 서버 세션(getUser)으로 확정한다(클라이언트 신뢰 안 함).
 *
 * 실제 발송/멱등/번호 판단은 notifySignupWelcomeForUser 로 위임 — 카카오 콜백과 로직을
 * 공유한다. 번호가 없는 계정은 조용히 스킵되며, 실패해도 가입 흐름을 깨지 않도록 200 반환.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const result = await notifySignupWelcomeForUser(user.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[signup-welcome] 오류:", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
