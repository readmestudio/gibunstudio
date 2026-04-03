import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center min-h-[80vh] py-24 text-center">
      <p className="mb-6 text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/50">
        YouTube × TCI × 결혼 적합성 분석
      </p>
      <h1
        className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] leading-snug whitespace-pre-line"
        style={{ wordBreak: "keep-all" }}
      >
        {"결혼은 하고 싶은데\n어떤 사람과 해야할지 모르겠어요"}
      </h1>
      <p
        className="mt-6 text-base sm:text-lg leading-relaxed text-[var(--foreground)]/60 max-w-md whitespace-pre-line"
        style={{ wordBreak: "keep-all" }}
      >
        {"연애할 때엔 보이지 않던 것들이\n결혼이라는 환경에서 반응하기 시작합니다.\n당신의 유튜브 구독 목록이 그 답을 알고 있습니다."}
      </p>
      <Link
        href="/husband-match/birth-info"
        className="mt-10 inline-flex items-center gap-2 px-8 py-3 text-base font-medium text-[var(--foreground)] bg-[var(--accent)] border-2 border-[var(--accent)] rounded-lg transition-all hover:bg-[var(--accent-hover)]"
      >
        무료 리포트 받아보기 →
      </Link>
    </section>
  );
}
