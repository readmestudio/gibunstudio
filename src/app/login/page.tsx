"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Tab = "login" | "signup";

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const next = searchParams.get("next") ?? "";
  const [tab, setTab] = useState<Tab>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  const getRedirectTo = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`;
  };

  const redirectAfterAuth = () => {
    if (next && next.startsWith("/")) {
      router.push(next);
      router.refresh();
    } else {
      router.push("/");
      router.refresh();
    }
  };

  const handleKakaoLogin = async () => {
    if (!hasSupabase) {
      setMessage({ type: "error", text: "Supabase가 설정되지 않았습니다. .env.local을 확인하세요." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSupabase) {
      setMessage({ type: "error", text: "Supabase가 설정되지 않았습니다." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      redirectAfterAuth();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "로그인에 실패했습니다." });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSupabase) {
      setMessage({ type: "error", text: "Supabase가 설정되지 않았습니다." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, phone },
          emailRedirectTo: getRedirectTo(),
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error("가입 응답에 사용자 정보가 없습니다.");
      await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          email,
          name: name || null,
          phone: phone || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
      redirectAfterAuth();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "가입에 실패했습니다." });
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

      <div className="mt-6 flex rounded-lg border border-[var(--border)] p-1">
        <button
          type="button"
          onClick={() => { setTab("login"); setMessage(null); }}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${tab === "login" ? "bg-[var(--accent)] text-[var(--foreground)]" : "text-[var(--foreground)]/70 hover:text-[var(--foreground)]"}`}
        >
          로그인
        </button>
        <button
          type="button"
          onClick={() => { setTab("signup"); setMessage(null); }}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${tab === "signup" ? "bg-[var(--accent)] text-[var(--foreground)]" : "text-[var(--foreground)]/70 hover:text-[var(--foreground)]"}`}
        >
          가입
        </button>
      </div>

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

        {tab === "login" ? (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-[var(--foreground)]">
                이메일
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="example@email.com"
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--foreground)]/50 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-[var(--foreground)]">
                비밀번호
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--foreground)]/50 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !hasSupabase}
              className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 font-semibold text-[var(--foreground)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              이메일로 로그인
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-[var(--foreground)]">
                이메일
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="example@email.com"
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--foreground)]/50 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-[var(--foreground)]">
                비밀번호
              </label>
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="6자 이상"
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--foreground)]/50 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label htmlFor="signup-name" className="block text-sm font-medium text-[var(--foreground)]">
                이름
              </label>
              <input
                id="signup-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="홍길동"
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--foreground)]/50 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <div>
              <label htmlFor="signup-phone" className="block text-sm font-medium text-[var(--foreground)]">
                연락처 (휴대폰)
              </label>
              <input
                id="signup-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                placeholder="010-0000-0000"
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--foreground)]/50 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !hasSupabase}
              className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 font-semibold text-[var(--foreground)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
            >
              가입하기
            </button>
          </form>
        )}

        {message && (
          <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-md px-4 py-16">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
