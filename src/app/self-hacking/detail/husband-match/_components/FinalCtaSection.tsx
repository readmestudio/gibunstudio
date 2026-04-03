import Link from "next/link";

export default function FinalCtaSection() {
  return (
    <section className="py-24 text-center">
      <h2
        className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] leading-snug mb-6 whitespace-pre-line"
        style={{ wordBreak: "keep-all" }}
      >
        {"결혼이라는 결정 앞에서\n나를 먼저 알아야 합니다"}
      </h2>
      <p
        className="text-base text-[var(--foreground)]/60 max-w-md mx-auto mb-10 leading-relaxed whitespace-pre-line"
        style={{ wordBreak: "keep-all" }}
      >
        {"유튜브 구독 채널을 붙여넣는 데 1분이면 됩니다.\n인생에서 가장 중요한 결정을 앞두고 있다면\n절대 이 검사가 아깝지 않을 거예요."}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/husband-match/birth-info"
          className="inline-flex items-center gap-2 px-8 py-3 text-base font-medium text-[var(--foreground)] bg-[var(--accent)] border-2 border-[var(--accent)] rounded-lg transition-all hover:bg-[var(--accent-hover)]"
        >
          무료 분석 시작하기 →
        </Link>
        <a
          href="#pricing"
          className="inline-flex items-center px-5 py-3 text-sm font-medium text-[var(--foreground)]/60 border-2 border-[var(--foreground)]/20 rounded-lg hover:border-[var(--foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          요금 보기
        </a>
      </div>

      <p className="mt-8 text-xs text-[var(--foreground)]/40">
        ✦ 결제 없이 9장 무료 · 유튜브 채널만 있으면 시작
      </p>
    </section>
  );
}
