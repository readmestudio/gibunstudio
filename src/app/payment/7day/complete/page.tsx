import Link from "next/link";

export default function PaymentCompletePage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          입금 신청이 접수되었습니다
        </h1>
        <p className="mt-4 text-[var(--foreground)]/80">
          코치가 입금을 확인하면 7일 내면 아이 찾기 프로그램이 시작됩니다.
          입금 확인 시점이 1일차(D1) 시작일이며, 대시보드에서 미션을 진행할 수 있습니다.
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
