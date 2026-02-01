"use client";

import Link from "next/link";

type Counseling = {
  id: string;
  type: string;
  title: string;
  status: string;
};

type Props = { purchasedCounseling: Counseling[] };

export function CounselingBookingContent({ purchasedCounseling }: Props) {
  if (purchasedCounseling.length === 0) {
    return (
      <div className="mt-8 rounded-xl border-2 border-[var(--accent)] bg-[var(--accent-muted)] p-8 text-center">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          상담을 구매해 주세요
        </h2>
        <p className="mt-2 text-[var(--foreground)]/70">
          1:1 상담 프로그램을 구매하면 예약이 가능합니다.
        </p>
        <Link
          href="/programs/counseling"
          className="mt-6 inline-flex rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--foreground)] hover:bg-[var(--accent-hover)]"
        >
          상담 프로그램 보기
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <h2 className="text-lg font-semibold text-[var(--foreground)]">
        예약 현황
      </h2>
      {purchasedCounseling.map((c) => (
        <div
          key={c.id}
          className="rounded-xl border border-[var(--border)] bg-white p-6"
        >
          <h3 className="font-semibold text-[var(--foreground)]">{c.title}</h3>
          <p className="mt-2 text-sm text-[var(--foreground)]/70">
            상태: {c.status}
          </p>
          <Link
            href={`/dashboard/counseling/booking/${c.id}`}
            className="mt-4 inline-flex rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--accent-hover)]"
          >
            예약 요청하기
          </Link>
        </div>
      ))}
      <p className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--foreground)]/60">
        Supabase 연동 후 캘린더, 서베이, 줌 링크 기능이 표시됩니다.
      </p>
    </div>
  );
}
