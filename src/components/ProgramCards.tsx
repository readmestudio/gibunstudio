import Link from "next/link";

const FEATURES = [
  {
    title: "7일간의 상담 부트캠프",
    description:
      "7일간 매일 미션을 달성하며 내면 아이 분석 리포트를 받아보세요",
    href: "/programs/7day",
    icon: (
      <svg
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        className="w-6 h-6"
        viewBox="0 0 24 24"
      >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    title: "1:1 심리 상담(Zoom)",
    description:
      "1급 심리 상담사와 함께 심리 검사 및 검사 해석, 내면 상담을 진행합니다.",
    href: "/programs/counseling",
    icon: (
      <svg
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        className="w-6 h-6"
        viewBox="0 0 24 24"
      >
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" />
      </svg>
    ),
  },
  {
    title: "어른들을 위한 금쪽 상담소",
    description:
      "고민이 생길 때마다 고민을 상담받고 분석 리포트를 받아 보세요.",
    href: "#",
    icon: (
      <svg
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        className="w-6 h-6"
        viewBox="0 0 24 24"
      >
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
] as const;

export function ProgramCards() {
  return (
    <section id="features">
      <div className="container px-5 py-32 mx-auto lg:px-24">
        <div className="flex flex-col w-full mb-20 text-center">
          <h2 className="mb-6 text-4xl font-bold tracking-tighter text-[var(--foreground)] md:text-8xl lg:text-6xl">
            당신을 위한 프로그램
          </h2>
          <p className="mx-auto text-lg leading-snug text-[var(--foreground)]/70">
            나를 이해하고 성장하는 여정을 시작하세요.
          </p>
        </div>
        <div className="flex flex-wrap -mx-4 -mt-4 -mb-10 space-y-6 sm:-m-4 md:space-y-0">
          {FEATURES.map((feature) => (
            <div key={feature.href} className="flex p-4 lg:w-1/3">
              <div className="inline-flex items-center justify-center flex-shrink-0 w-12 h-12 mb-4 text-[var(--foreground)] rounded-full bg-[var(--surface)]">
                {feature.icon}
              </div>
              <div className="flex-grow pl-6">
                <h3 className="text-2xl font-semibold text-[var(--foreground)]">
                  {feature.title}
                </h3>
                <p className="mt-6 text-lg text-[var(--foreground)]/70">
                  {feature.description}
                </p>
                <Link
                  href={feature.href}
                  className="mt-4 inline-flex items-center text-sm font-medium text-[var(--foreground)] hover:underline"
                >
                  자세히 보기 →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
