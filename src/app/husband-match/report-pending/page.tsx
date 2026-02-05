'use client';

import Link from 'next/link';

export default function ReportPendingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[var(--surface)] to-white px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-3">
          최종 리포트가 작성되었습니다
        </h1>
        <p className="text-[var(--foreground)]/70 mb-8">
          관리자 검토 후 마이페이지에서 확인할 수 있습니다.
        </p>
        <Link
          href="/dashboard"
          className="inline-block rounded-lg bg-[var(--accent)] px-6 py-3 font-medium text-[var(--foreground)] hover:bg-[var(--accent-hover)]"
        >
          마이페이지로 가기
        </Link>
      </div>
    </div>
  );
}
