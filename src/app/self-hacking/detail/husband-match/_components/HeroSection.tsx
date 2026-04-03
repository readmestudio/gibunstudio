import Link from "next/link";
import SampleCardSlider from "./SampleCardSlider";

export default function HeroSection() {
  return (
    <section className="py-24 text-center">
      <p className="mb-6 text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/50">
        YouTube × TCI × 결혼 적합성 분석
      </p>
      <h1
        className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] leading-snug whitespace-pre-line"
        style={{ wordBreak: "keep-all" }}
      >
        {"결혼은 하고 싶은데\n어떤 사람과 해야할지 모르겠어요"}
      </h1>

      {/* 샘플 카드 슬라이드 */}
      <SampleCardSlider />

      <p
        className="text-base sm:text-lg leading-relaxed text-[var(--foreground)]/60 max-w-md mx-auto whitespace-pre-line"
        style={{ wordBreak: "keep-all" }}
      >
        {"유튜브 구독 리스트만 넣어보세요\n당신의 결혼 적합성부터 배우자 타입까지\n모두 분석해드려요"}
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
