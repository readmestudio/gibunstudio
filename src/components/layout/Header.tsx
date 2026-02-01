"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { signOut } from "@/app/actions/auth";
import { OpenNotifyModal } from "@/components/OpenNotifyModal";

export function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [showOpenNotify, setShowOpenNotify] = useState(false);

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
          <Image src="/logo.png" alt="GIBUN" width={36} height={36} className="h-9 w-auto" />
          <span className="text-xl font-semibold text-[var(--foreground)]">GIBUN</span>
        </Link>
        <nav className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setShowOpenNotify(true)}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${pathname === "/programs/7day" ? "text-[var(--foreground)]" : "text-[var(--foreground)]/80 hover:text-[var(--foreground)]"}`}
          >
            상담 부트캠프
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
              오픈 예정
            </span>
          </button>
          <Link
            href="/programs/counseling"
            className={`text-sm font-medium transition-colors ${pathname === "/programs/counseling" ? "text-[var(--foreground)]" : "text-[var(--foreground)]/80 hover:text-[var(--foreground)]"}`}
          >
            1:1 상담
          </Link>
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
      <OpenNotifyModal isOpen={showOpenNotify} onClose={() => setShowOpenNotify(false)} />
    </header>
  );
}
