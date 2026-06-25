import Link from "next/link";

export default function FinalCtaSection() {
  return (
    <section className="py-24 text-center">
      <h2
        className="text-2xl sm:text-3xl font-bold text-[var(--foreground)] leading-snug mb-6 whitespace-pre-line"
        style={{ wordBreak: "keep-all" }}
      >
        {"어떤 남편이 잘 맞을지 알려면\n나를 먼저 알아야 합니다"}
      </h2>
      <p
        className="text-base text-[var(--foreground)]/60 max-w-md mx-auto mb-10 leading-relaxed whitespace-pre-line"
        style={{ wordBreak: "keep-all" }}
      >
        {"유튜브 구독 리스트를 올리는 데 1분이면 됩니다.\n내 성향과 어울리는 남편 성향이 궁금하다면\n지금 바로 받아보세요."}
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          href="/husband-match/birth-info"
          className="inline-flex items-center gap-2 px-8 py-3 text-base font-medium text-[var(--foreground)] bg-[var(--accent)] border-2 border-[var(--accent)] rounded-lg transition-all hover:bg-[var(--accent-hover)]"
        >
          테스트 시작하기 →
        </Link>
      </div>
    </section>
  );
}
