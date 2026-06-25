import Link from "next/link";
import SampleCardSlider from "./SampleCardSlider";

export default function HeroSection() {
  return (
    <section className="py-24 text-center">
      <p className="mb-6 text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/50">
        내 성향 + 남편 성향 분석
      </p>
      <h1
        className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] leading-snug whitespace-pre-line"
        style={{ wordBreak: "keep-all" }}
      >
        {"유튜브 구독 리스트만 넣으면\n미래의 내 남편 성향을 알려드려요"}
      </h1>

      {/* 샘플 카드 슬라이드 — 히어로 중앙 */}
      <SampleCardSlider />

      <p
        className="text-base sm:text-lg leading-relaxed text-[var(--foreground)]/60 max-w-md mx-auto whitespace-pre-line"
        style={{ wordBreak: "keep-all" }}
      >
        {"내가 어떤 사람인지, 어떤 남편이 잘 맞는지\n궁금하다면 지금 리포트를 받아보세요"}
      </p>
      <Link
        href="/husband-match/birth-info"
        className="mt-8 inline-flex items-center gap-2 px-8 py-3 text-base font-medium text-[var(--foreground)] bg-[var(--accent)] border-2 border-[var(--accent)] rounded-lg transition-all hover:bg-[var(--accent-hover)]"
      >
        테스트 시작하기 →
      </Link>
    </section>
  );
}
