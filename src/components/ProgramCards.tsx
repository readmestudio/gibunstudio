import Link from "next/link";

const CARDS = [
  {
    title: "7일간의 상담 부트캠프",
    description: "7일간 매일 미션을 달성하며 내면 아이 분석 리포트를 받아보세요",
    href: "/programs/7day",
    gradient: "from-violet-200/90 via-purple-100/80 to-pink-200/90",
    accent: "from-violet-400/30 to-fuchsia-400/20",
  },
  {
    title: "1:1 심리 상담(Zoom)",
    description: "1급 심리 상담사와 함께 심리 검사 및 검사 해석, 내면 상담을 진행합니다.",
    href: "/programs/counseling",
    gradient: "from-sky-200/90 via-blue-100/80 to-indigo-200/90",
    accent: "from-sky-400/30 to-indigo-400/20",
  },
  {
    title: "어른들을 위한 금쪽 상담소",
    description: "고민이 생길 때마다 고민을 상담받고 분석 리포트를 받아 보세요.",
    href: "#",
    gradient: "from-amber-200/90 via-yellow-100/80 to-orange-200/90",
    accent: "from-amber-400/30 to-orange-400/20",
  },
] as const;

function DreamyIllustration({ gradient, accent }: { gradient: string; accent: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      <div className={`absolute inset-0 bg-gradient-to-tr ${accent} opacity-60`} />
      <svg className="absolute bottom-0 right-0 w-2/3 h-2/3 text-white/20" viewBox="0 0 200 200" fill="currentColor" aria-hidden>
        <circle cx="160" cy="160" r="80" />
        <circle cx="80" cy="100" r="50" />
        <circle cx="40" cy="160" r="30" />
      </svg>
      <svg className="absolute top-2 left-1/4 w-24 h-24 text-white/15" viewBox="0 0 100 100" fill="currentColor" aria-hidden>
        <circle cx="50" cy="50" r="45" />
      </svg>
      <svg className="absolute top-1/3 right-4 w-16 h-16 text-white/10" viewBox="0 0 64 64" fill="currentColor" aria-hidden>
        <ellipse cx="32" cy="32" rx="28" ry="32" />
      </svg>
    </div>
  );
}

export function ProgramCards() {
  return (
    <section className="border-t border-[var(--border)] py-16 sm:py-24 bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group flex flex-col rounded-2xl border border-[var(--border)] bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-[var(--accent)]/50 transition-all"
            >
              <div className="relative aspect-[4/3] shrink-0">
                <DreamyIllustration gradient={card.gradient} accent={card.accent} />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg font-semibold text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--foreground)]/70 flex-1">
                  {card.description}
                </p>
                <span className="mt-3 inline-flex items-center text-sm font-medium text-[var(--accent)] group-hover:underline">
                  자세히 보기 →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
