import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * 관리자 권한 판별 유틸.
 *
 * `ADMIN_EMAILS` 환경변수에 쉼표로 구분된 이메일 목록을 넣으면 그 이메일들이 관리자.
 * 예: ADMIN_EMAILS=mingle22@hanmail.net,another@example.com
 */

function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().has(email.toLowerCase());
}

/**
 * 서버 컴포넌트/서버 액션에서 호출. 로그인 안 했거나 관리자가 아니면
 * /login?redirect=... 으로 리다이렉트 (throw). 통과 시 user 반환.
 */
export async function requireAdmin(redirectTo = "/admin/essays") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  }
  if (!isAdminEmail(user.email)) {
    redirect("/");
  }
  return user;
}
