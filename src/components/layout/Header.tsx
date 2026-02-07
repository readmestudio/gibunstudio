"use client";

import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { signOut } from "@/app/actions/auth";

export function Header() {
  const [user, setUser] = useState<{ email?: string } | null>(null);

  useEffect(() => {
    const client = createClient();
    client.auth.getUser().then(({ data: { user } }) => setUser(user ?? null));
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="GIBUN" width={40} height={40} className="h-10 w-10" />
          <span className="text-sm font-medium text-[var(--foreground)]">기분 스튜디오</span>
        </Link>
        <nav className="flex items-center gap-6">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-[var(--foreground)]/80 hover:text-[var(--foreground)] transition-colors"
              >
                대시보드
              </Link>
              <form action={signOut}>
                <button type="submit" className="text-sm font-medium text-[var(--foreground)]/80 hover:text-[var(--foreground)] transition-colors">
                  로그아웃
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-[var(--foreground)]/80 hover:text-[var(--foreground)] transition-colors"
              >
                로그인
              </Link>
              <Link
                href="/login/coach"
                className="text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)]/80 transition-colors"
              >
                코치님이라면 여기
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
