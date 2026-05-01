import SampleCardSlider from "./SampleCardSlider";

export default function HeroSection() {
  return (
    <section className="py-24 text-center">
      <p className="mb-6 text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/50">
        배우자 기질 적합성 검사
      </p>
      <h1
        className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] leading-snug whitespace-pre-line"
        style={{ wordBreak: "keep-all" }}
      >
        {"유튜브 구독 리스트만 넣으면\n운명의 배우자 타입을 분석해드려요"}
      </h1>

      {/* 샘플 카드 슬라이드 — 히어로 중앙 */}
      <SampleCardSlider />

      <p
        className="text-base sm:text-lg leading-relaxed text-[var(--foreground)]/60 max-w-md mx-auto whitespace-pre-line"
        style={{ wordBreak: "keep-all" }}
      >
        {"결혼은 하고 싶은데\n어떤 사람과 해야할지 모르겠다면 지금 리포트를 받아보세요"}
      </p>
      <button
        type="button"
        disabled
        className="mt-8 inline-flex items-center gap-2 px-8 py-3 text-base font-medium rounded-lg cursor-not-allowed border-2 border-[var(--foreground)]/30 text-[var(--foreground)]/50"
      >
        알림 신청
      </button>
    </section>
  );
}
