import { THERAPY_PAIN_POINTS, type TherapyPainPointIcon } from "./content";
import { StoreHeroWorkbookSlideshow } from "./StoreHeroWorkbookSlideshow";

/**
 * [01] Hero + 1:1 심리 상담의 한계 카드 그리드
 *
 * 타겟이 "이거 내 얘기다" 느끼도록 페인 포인트 중심.
 * 4개의 한계(가격·반복·미스매치·잔존감 부재)를 아이콘 + 제목 + 설명 카드로 제시.
 */
export function StoreHeroSection() {
  return (
    <section className="mx-auto max-w-5xl px-4 pt-16 pb-20 md:pt-24">
      {/* 카테고리 태그 */}
      <p
        className="text-center text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/50 mb-6"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
      >
        Mindfulness Workbook
      </p>

      {/* 히어로 헤드라인 */}
      <h1 className="text-center text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.25] text-[var(--foreground)] break-keep">
        직장인을 위한
        <br />
        마음 챙김 워크북
      </h1>

      <p className="mt-6 text-center text-base sm:text-lg leading-relaxed text-[var(--foreground)]/70 break-keep">
        비즈니스 퍼포먼스를 위한 라이팅 테라피
      </p>

      {/* 키워드 chip — 검색·태그 메타 */}
      <ul className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {["#인지행동치료", "#셀프심리상담", "#소프트런칭특가"].map((kw) => (
          <li
            key={kw}
            className="rounded-full border border-[var(--foreground)]/20 px-3 py-1 text-[11px] sm:text-xs font-medium text-[var(--foreground)]/65"
          >
            {kw}
          </li>
        ))}
      </ul>

      {/* 출시 알림 신청 CTA */}
      <div className="mt-10 sm:mt-12 flex justify-center">
        <a
          href="#waitlist"
          className="inline-flex items-center justify-center rounded-full bg-[var(--foreground)] text-white px-7 sm:px-8 py-4 text-sm sm:text-base font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          출시 알림신청하고 할인받기
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-2 h-4 w-4"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </a>
      </div>

      {/* 워크북 슬라이드쇼 — Hero 와 페인 포인트 사이 transition 띠 (풀폭) */}
      <div
        className="mt-14 sm:mt-16 relative"
        style={{ width: "100vw", marginLeft: "calc(50% - 50vw)" }}
      >
        <StoreHeroWorkbookSlideshow />
      </div>

      {/* 1:1 심리 상담의 한계 — 카드 그리드 */}
      <div className="mt-20">
        {/* 헤드라인 */}
        <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold leading-[1.3] text-[var(--foreground)] break-keep">
          1:1 심리 상담의
          <br className="sm:hidden" /> 이런 문제를
          <br />
          해결하고 싶었습니다
        </h2>

        {/* 카드 그리드 */}
        <ul className="mt-12 grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {THERAPY_PAIN_POINTS.map((point, idx) => (
            <li
              key={idx}
              className="flex flex-col items-start gap-4 rounded-2xl border-2 border-[var(--foreground)]/10 bg-white p-6 sm:p-7 transition-colors hover:border-[var(--foreground)]/30"
            >
              <span
                className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-[var(--foreground)] text-[var(--foreground)]"
                aria-hidden
              >
                <PainPointIcon name={point.icon} />
              </span>

              <h3 className="text-base sm:text-lg font-bold leading-snug text-[var(--foreground)] break-keep">
                {point.title}
              </h3>

              <p className="text-sm leading-relaxed text-[var(--foreground)]/65 break-keep">
                {point.description}
              </p>
            </li>
          ))}
        </ul>

        {/* 카드 그리드 결론 — 흰 배경 강조 한 줄 */}
        <p className="mt-12 sm:mt-14 text-center text-base sm:text-lg md:text-xl leading-relaxed text-[var(--foreground)]/85 break-keep">
          문제는 상담사가 아니라,{" "}
          <span className="font-bold text-[var(--foreground)] underline underline-offset-4 decoration-2">
            상담의 구조와 도구
          </span>
          에 있었습니다.
        </p>
      </div>

      {/* 별도 영역 — 검정 박스: 워크북의 출발점 */}
      <div className="mt-14 sm:mt-20 rounded-2xl bg-[var(--foreground)] px-6 py-14 sm:px-10 sm:py-20 md:py-24 text-center text-white">
        <p className="text-xl sm:text-2xl md:text-3xl font-bold leading-[1.45] break-keep">
          심리 상담사 없이도 인지 행동 치료에 기반하여
          <br className="hidden sm:block" />
          {" "}상담을 대신할 수 있는 워크북은 없을까?
        </p>
        <p className="mt-6 sm:mt-7 text-sm sm:text-base leading-relaxed text-white/60 break-keep">
          마음 챙김 워크북은 이 질문으로부터 시작되었습니다.
        </p>
      </div>
    </section>
  );
}

function PainPointIcon({ name }: { name: TherapyPainPointIcon }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-6 w-6",
  };

  switch (name) {
    case "coin":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5 1-2.5 2s1 1.8 2.5 2 2.5 1 2.5 2-1 2-2.5 2c-1 0-2-.5-2.5-1.5" />
          <path d="M12 6.5v1.5M12 16v1.5" />
        </svg>
      );
    case "loop":
      return (
        <svg {...common}>
          <path d="M4 12a8 8 0 0 1 13.7-5.7L20 8" />
          <path d="M20 4v4h-4" />
          <path d="M20 12a8 8 0 0 1-13.7 5.7L4 16" />
          <path d="M4 20v-4h4" />
        </svg>
      );
    case "mismatch":
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="3" />
          <path d="M2.5 19c.5-2.5 2.8-4.5 5.5-4.5s5 2 5.5 4.5" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M14 13.5 20 19.5M20 13.5 14 19.5" />
        </svg>
      );
    case "empty":
      return (
        <svg {...common}>
          <path d="M4 8h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" strokeDasharray="3 2" />
          <path d="M4 8 6 4h12l2 4" />
          <path d="M9 12h6" />
        </svg>
      );
  }
}
