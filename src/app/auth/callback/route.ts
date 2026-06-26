import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);
      // 사용한 쿠키 삭제
      response.cookies.set("auth_redirect", "", { path: "/", maxAge: 0 });
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
