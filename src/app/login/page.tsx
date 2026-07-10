"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginContent() {
  const searchParams = useSearchParams();
  // 로그인 후 돌아갈 경로. 앱 전반은 `redirect=`(결제·대시보드·cart 등),
  // husband-match는 `next=`를 쓰므로 둘 다 받아준다. (이름 불일치로 홈으로
  // 튕기던 버그 방지 — 특히 결제 흐름에서 로그인 후 결제 페이지로 복귀)
  const next = searchParams.get("next") ?? searchParams.get("redirect") ?? "";

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  // OAuth 콜백 주소는 쿼리 없는 "깨끗한" /auth/callback 으로 고정한다.
  // Supabase Redirect URLs 허용목록은 쿼리스트링이 붙으면 매칭에 실패해 Site URL(홈)로
  // 튕기는 경우가 많기 때문. 로그인 후 돌아갈 next 경로는 아래 쿠키로만 전달한다.
  const getRedirectTo = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/auth/callback`;
  };

  // 인증 후 돌아올 경로를 쿠키에 저장 (콜백 라우트가 읽어서 복귀시킨다)
  const persistNext = () => {
    if (typeof document !== "undefined" && next && next.startsWith("/")) {
      document.cookie = `auth_redirect=${encodeURIComponent(next)}; path=/; max-age=600; SameSite=Lax`;
    }
  };

  // 소비자 로그인은 카카오 전용이다. 이메일 가입은 연락처를 사용자 입력에 의존해
  // 누락·오탈자가 잦지만, 카카오는 auth/callback 에서 provider_token 으로 검증된
  // 실제 전화번호를 받아온다 — 알림톡(결제·진단 링크) 발송에 반드시 필요하다.
  const handleKakaoLogin = async () => {
    if (!hasSupabase) {
      setMessage({ type: "error", text: "Supabase가 설정되지 않았습니다. .env.local을 확인하세요." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      // OAuth 후 돌아올 경로를 쿠키에 저장 (redirectTo는 쿼리 없는 깨끗한 콜백 주소)
      persistNext();
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: { redirectTo: getRedirectTo() },
      });
      if (error) throw error;
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "로그인에 실패했습니다." });
    } finally {
      setLoading(false);
    }
  };

  const needsLogin = !!next && next.startsWith("/");

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">
        {needsLogin ? "로그인이 필요해요" : "로그인"}
      </h1>
      <p className="mt-2 text-[var(--foreground)]/70">
        카카오로 시작하기를 누르면 인증 후 바로 이용할 수 있어요. 검사 결과지와
        안내는 카카오에 연결된 연락처로 보내드려요.
      </p>

      <div className="mt-8 space-y-6">
        <button
          type="button"
          onClick={handleKakaoLogin}
          disabled={loading || !hasSupabase}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FEE500] px-4 py-3 font-medium text-[#191919] hover:bg-[#FADA0A] disabled:opacity-50"
        >
          카카오로 시작하기
        </button>

        {message && (
          <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {message.text}
          </p>
        )}
      </div>

      <p className="mt-8 text-center text-sm text-[var(--foreground)]/60">
        코치님이라면{" "}
        <Link href="/login/coach" className="font-medium text-[var(--foreground)] hover:underline">
          여기를 클릭해서 로그인하세요
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[var(--surface)] rounded w-1/3"></div>
          <div className="h-4 bg-[var(--surface)] rounded w-2/3"></div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
