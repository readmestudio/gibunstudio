import Link from "next/link";
import Image from "next/image";

const CARDS = [
  {
    title: "7일간의 상담 부트캠프",
    description: "7일간 매일 미션을 달성하며 내면 아이 분석 리포트를 받아보세요",
    href: "/programs/7day",
    doodle: "/doodles/heart-doodle.svg",
  },
  {
    title: "1:1 심리 상담(Zoom)",
    description: "1급 심리 상담사와 함께 심리 검사 및 검사 해석, 내면 상담을 진행합니다.",
    href: "/programs/counseling",
    doodle: "/doodles/chat-bubble.svg",
  },
  {
    title: "어른들을 위한 금쪽 상담소",
    description: "고민이 생길 때마다 고민을 상담받고 분석 리포트를 받아 보세요.",
    href: "#",
    doodle: "/doodles/star-sparkle.svg",
  },
] as const;

export function ProgramCards() {
  return (
    <section className="border-t border-[var(--border)] py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {CARDS.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group relative flex flex-col rounded-2xl border-2 border-[var(--foreground)] bg-white overflow-hidden transition-all hover:shadow-lg"
            >
              {/* 일러스트 영역 */}
              <div className="relative aspect-[4/3] shrink-0 bg-white flex items-center justify-center">
                <div className="relative w-2/3 h-2/3 opacity-20 group-hover:opacity-30 transition-opacity">
                  <Image
                    src={card.doodle}
                    alt=""
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              {/* 텍스트 영역 */}
              <div className="flex flex-1 flex-col p-5 border-t-2 border-[var(--foreground)]">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm text-[var(--foreground)]/70 flex-1">
                  {card.description}
                </p>
                <span className="mt-3 inline-flex items-center text-sm font-medium text-[var(--foreground)] group-hover:underline">
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
