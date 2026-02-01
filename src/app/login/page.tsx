"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const supabase = createClient();
  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  const handleKakaoLogin = async () => {
    if (!hasSupabase) {
      setMessage({ type: "error", text: "Supabase가 설정되지 않았습니다. .env.local을 확인하세요." });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "로그인에 실패했습니다." });
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSupabase) {
      setMessage({ type: "error", text: "Supabase가 설정되지 않았습니다." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      setMessage({ type: "success", text: "이메일로 인증 링크를 보냈습니다. 확인 후 로그인하세요." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "이메일 전송에 실패했습니다." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">로그인</h1>
      <p className="mt-2 text-[var(--foreground)]/70">
        가입 시 이메일과 전화번호를 필수로 받습니다. 검사 결과지 전송에 사용됩니다.
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

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--border)]" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-[var(--foreground)]/60">또는</span>
          </div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)]">
            이메일
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="example@email.com"
            className="w-full rounded-lg border border-[var(--border)] px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--foreground)]/50 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
          <button
            type="submit"
            disabled={loading || !hasSupabase}
            className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 font-semibold text-[var(--foreground)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            이메일로 로그인
          </button>
        </form>

        {message && (
          <p
            className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}
          >
            {message.text}
          </p>
        )}
      </div>

      <p className="mt-8 text-center text-sm text-[var(--foreground)]/60">
        코치님이라면{" "}
        <Link href="/login/coach" className="font-medium text-[var(--accent)] hover:underline">
          여기를 클릭해서 로그인하세요
        </Link>
      </p>
    </div>
  );
}
