import { WorkbookSlideshow } from "./WorkbookSlideshow";

/**
 * 성취 중독 워크북 랜딩 HERO 섹션
 *
 * - 데스크탑: 좌측 텍스트 / 우측 워크북 슬라이드쇼 2분할, min-h 90vh
 * - 모바일: 텍스트 → 슬라이드쇼 상하 배치
 * - 3초 내 "이거 내 얘기다" 반응을 유도하는 풀 카피
 */
export function HeroSection() {
  return (
    <section className="mx-auto max-w-5xl px-4 md:min-h-[90vh] flex items-center py-16 md:py-20">
      <div className="grid w-full items-center gap-10 md:grid-cols-2 md:gap-12">
        {/* 좌측 텍스트 */}
        <div>
          {/* 카테고리 태그 (세리프) */}
          <p
            className="mb-6 text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/50"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Mindfulness Workbook Vol.01
          </p>

          {/* 메인 헤드라인 */}
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.3] text-[var(--foreground)] break-keep"
          >
            성취해도 불안하고,
            <br />
            멈추면 죄책감이 드는
            <br className="hidden sm:inline" />{" "}
            당신에게
          </h1>

          {/* 서브 리드 */}
          <div className="mt-8 space-y-4 text-base sm:text-lg leading-relaxed text-[var(--foreground)]/70 break-keep">
            <p>
              마음이 힘들어서 회사를 그만두기엔,
              <br />
              당신의 재능이 너무 아깝습니다.
            </p>
            <p>
              성과보다 먼저 챙겨야 하는 건 마음입니다.
              <br />
              마음을 챙기면, 성과는 따라옵니다.
            </p>
          </div>

          {/* 메타 인포 */}
          <ul className="mt-10 flex flex-wrap gap-x-5 gap-y-2 text-xs sm:text-sm text-[var(--foreground)]/60">
            <li className="inline-flex items-center gap-1.5">
              <span aria-hidden>⏱</span>
              <span>60분 소요</span>
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span aria-hidden>💻</span>
              <span>PC 전용</span>
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span aria-hidden>📊</span>
              <span>심리학 기반 진단 테스트 포함</span>
            </li>
          </ul>
        </div>

        {/* 우측 워크북 슬라이드쇼 */}
        <div className="flex items-center justify-center">
          <WorkbookSlideshow />
        </div>
      </div>
    </section>
  );
}
