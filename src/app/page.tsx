import Link from "next/link";

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[var(--surface)]">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl lg:text-5xl">
              나는 왜 관계가 힘들까?
            </h1>
            <p className="mt-6 text-lg text-[var(--foreground)]/70 sm:text-xl">
              내면 아이를 만나 반복되는 패턴을 찾아보세요
            </p>
            <div className="mt-10">
              <Link
                href="/onboarding"
                className="inline-flex items-center justify-center rounded-lg bg-[var(--accent)] px-8 py-3 text-base font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--accent-hover)]"
              >
                카카오로 시작하기
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* WHO WE ARE - placeholder */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">
            WHO WE ARE
          </h2>
          <p className="mt-4 text-[var(--foreground)]/70">
            추후 디벨롭 예정
          </p>
        </div>
      </section>

      {/* 7일 프로그램 섹션 */}
      <section className="border-t border-[var(--border)] bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">
            7일 내면 아이 찾기
          </h2>
          <p className="mt-4 text-[var(--foreground)]/70">
            7일간 데일리 미션을 수행하고 7일차에 분석 리포트를 받는 프로그램
          </p>
          <Link
            href="/programs/7day"
            className="mt-6 inline-flex items-center text-[var(--accent)] font-medium hover:underline"
          >
            자세히 보기 →
          </Link>
        </div>
      </section>

      {/* 1:1 상담 섹션 */}
      <section className="border-t border-[var(--border)] py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-[var(--foreground)]">
            1:1 심리 상담
          </h2>
          <p className="mt-4 text-[var(--foreground)]/70">
            7일 내면 아이 찾기 결과 리포트를 해석해주는 상담
          </p>
          <Link
            href="/programs/counseling"
            className="mt-6 inline-flex items-center text-[var(--accent)] font-medium hover:underline"
          >
            자세히 보기 →
          </Link>
        </div>
      </section>

      {/* 유의사항 */}
      <section className="border-t border-[var(--border)] bg-[var(--surface)] py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            유의사항
          </h3>
          <ul className="mt-3 space-y-1 text-sm text-[var(--foreground)]/70">
            <li>• 가입 시 이메일과 전화번호를 필수로 받습니다. 검사 결과지 전송에 사용됩니다.</li>
            <li>• 리포트는 1일~6일차 미션을 모두 완료한 경우에 작성됩니다.</li>
            <li>• 구매 후 14일 내에 미션을 수행하지 못하면 리포트가 제공되지 않습니다.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
