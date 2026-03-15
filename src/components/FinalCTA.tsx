import Link from "next/link";

/**
 * 최종 전환 CTA 배너
 * 프라이싱 테이블 아래, 푸터 위에 삽입
 */
export function FinalCTA() {
  return (
    <section className="bg-[var(--surface)]">
      <div className="container px-5 py-24 mx-auto lg:px-24">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
          <h2
            className="mb-6 text-4xl font-bold text-[var(--foreground)] md:text-8xl lg:text-6xl"
            style={{ wordBreak: "keep-all" }}
          >
            잘 모르겠으면, 일단 한번 해보세요
          </h2>
          <p
            className="mb-8 text-lg leading-relaxed text-[var(--foreground)]/70"
            style={{ wordBreak: "keep-all" }}
          >
            3분이면 돼요. 무료이고, 구독 목록만 있으면 됩니다.
          </p>
          <Link
            href="/husband-match/birth-info"
            className="inline-flex items-center gap-2 px-8 py-3 text-lg font-medium text-[var(--foreground)] bg-[var(--accent)] border-2 border-[var(--accent)] rounded-lg transition-all duration-300 hover:bg-[var(--accent-hover)]"
          >
            무료로 남편상 찾기 →
          </Link>
        </div>
      </div>
    </section>
  );
}
