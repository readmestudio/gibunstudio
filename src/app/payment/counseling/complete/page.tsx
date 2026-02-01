import Link from "next/link";

export default function CounselingPaymentCompletePage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          입금 신청이 접수되었습니다
        </h1>
        <p className="mt-4 text-[var(--foreground)]/80">
          코치가 입금을 확인하면 상담 예약이 가능합니다.
          대시보드의 1:1 상담 탭에서 예약 요청을 진행해 주세요.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex rounded-lg bg-[var(--accent)] px-8 py-3 font-semibold text-[var(--foreground)] hover:bg-[var(--accent-hover)]"
        >
          대시보드로 이동
        </Link>
      </div>
    </div>
  );
}
