import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-semibold text-[var(--foreground)]">
              GIBUN
            </p>
            <p className="mt-1 text-sm text-[var(--foreground)]/60">
              유튜브 알고리즘으로 미래의 남편상 찾기
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
            <Link
              href="/programs/7day"
              className="text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)] transition-colors"
            >
              상담 부트캠프
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
        {/* 고객센터 정보 */}
        <div className="mt-10 pt-8 border-t border-[var(--border)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)] mb-2">고객센터</p>
              <p className="text-lg font-bold text-[var(--foreground)]">070-7954-9188</p>
              <p className="text-xs text-[var(--foreground)]/60 mt-1">
                월-금 10:00 - 18:00<br />
                lunch 12:00 - 13:00<br />
                토,일요일 및 공휴일 OFF
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)] mb-2">COMPANY INFO</p>
              <div className="text-xs text-[var(--foreground)]/60 space-y-1">
                <p>주식회사 원모어스푼 CEO 손창민</p>
                <p>CPO 주식회사 원모어스푼 (2morespoons@gmail.com)</p>
                <p>NETWORK NO. 2025-서울마포-0668</p>
                <p>COMPANY NO. 143-88-03414</p>
                <p>ADD 서울특별시 마포구 마포대로 12 (마포동) 1606-씨13호</p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-xs text-[var(--foreground)]/50">
          © {new Date().getFullYear()} GIBUN. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
