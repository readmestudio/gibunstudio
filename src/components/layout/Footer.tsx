import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-[var(--foreground)]">
              7일 내면 아이 찾기
            </p>
            <p className="mt-1 text-sm text-[var(--foreground)]/60">
              내면 아이를 만나 반복되는 패턴을 찾아보세요
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
            <Link
              href="/programs/7day"
              className="text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
            >
              7일 프로그램
            </Link>
            <Link
              href="/programs/counseling"
              className="text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
            >
              1:1 상담
            </Link>
            <Link
              href="/login"
              className="text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
            >
              로그인
            </Link>
          </div>
        </div>
        <p className="mt-8 text-xs text-[var(--foreground)]/50">
          © {new Date().getFullYear()} 7일 내면 아이 찾기. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
