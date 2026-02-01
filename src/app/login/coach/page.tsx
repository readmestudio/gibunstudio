"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

export default function CoachLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();

  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  const handleCoachLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasSupabase) {
      setMessage({ type: "error", text: "Supabase가 설정되지 않았습니다. .env.local을 확인하세요." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // 코치 여부는 서버에서 검증 (COACH_EMAILS)
      router.push("/coach");
      router.refresh();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "로그인에 실패했습니다." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">코치 로그인</h1>
      <p className="mt-2 text-[var(--foreground)]/70">
        관리자가 지정한 코치 계정만 이메일로 로그인할 수 있습니다.
      </p>

      <form onSubmit={handleCoachLogin} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)]">
            이메일
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="coach@example.com"
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--foreground)]/50 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[var(--foreground)]">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-4 py-2.5 text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !hasSupabase}
          className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 font-semibold text-[var(--foreground)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
        >
          로그인
        </button>
        {message && (
          <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {message.text}
          </p>
        )}
      </form>

      <p className="mt-8 text-center text-sm text-[var(--foreground)]/60">
        <Link href="/login" className="font-medium hover:underline">
          일반 로그인으로 돌아가기
        </Link>
      </p>
    </div>
  );
}
