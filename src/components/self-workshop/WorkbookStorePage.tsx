"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { WORKBOOK_CATALOG, type WorkbookInfo } from "@/lib/self-workshop/workbook-catalog";
import { NotifyButton } from "@/components/NotifyButton";

/* ──────────────────────────────────────────────
   수채화 배경 이미지
   ────────────────────────────────────────────── */
const WORKBOOK_BG = [
  "/program-bg/program-bg-1.png",
  "/program-bg/program-bg-2.png",
  "/program-bg/program-bg-3.png",
];

/* ──────────────────────────────────────────────
   갤러리 카드 컴포넌트
   ────────────────────────────────────────────── */
function WorkbookGalleryCard({
  workbook,
  bgIndex,
  isActive,
  onClick,
}: {
  workbook: WorkbookInfo;
  bgIndex: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const bg = WORKBOOK_BG[bgIndex % WORKBOOK_BG.length];

  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 w-[280px] md:w-[320px] snap-start rounded-2xl border-2 overflow-hidden text-left transition-all ${
        isActive
          ? "border-[var(--foreground)] shadow-[4px_4px_0_var(--foreground)]"
          : "border-[var(--foreground)]/30 hover:border-[var(--foreground)]"
      } ${workbook.comingSoon ? "opacity-75" : ""}`}
    >
      {/* 수채화 배경 이미지 영역 */}
      <div
        className="relative h-44 bg-cover bg-center"
        style={{ backgroundImage: `url('${bg}')` }}
      >
        <div className="absolute inset-0 bg-white/30" />
      </div>

      {/* 텍스트 + 버튼 영역 */}
      <div className="p-5 bg-white">
        <h3 className="text-base font-bold text-[var(--foreground)]">
          {workbook.title}
        </h3>
        <p className="mt-1 text-sm text-[var(--foreground)]/60 line-clamp-2">
          {workbook.subtitle}
        </p>

        {/* CTA 버튼 */}
        <div className="mt-4">
          {workbook.comingSoon ? (
            <span className="inline-block w-full text-center px-4 py-2.5 rounded-lg border border-[var(--foreground)]/20 text-sm text-[var(--foreground)]/40">
              Coming Soon
            </span>
          ) : (
            <span className="inline-block w-full text-center px-4 py-2.5 rounded-lg border-2 border-[var(--foreground)] text-sm font-semibold text-[var(--foreground)]">
              시작하기
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ──────────────────────────────────────────────
   메인 WorkbookStorePage
   ────────────────────────────────────────────── */
export function WorkbookStorePage() {
  const [activeId, setActiveId] = useState(WORKBOOK_CATALOG[0].id);
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = WORKBOOK_CATALOG.find((w) => w.id === activeId)!;

  function scrollLeft() {
    scrollRef.current?.scrollBy({ left: -340, behavior: "smooth" });
  }
  function scrollRight() {
    scrollRef.current?.scrollBy({ left: 340, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 페이지 헤더 */}
      <div className="px-4 pt-16 pb-8 text-center">
        <h1 className="text-3xl font-bold text-[var(--foreground)] md:text-4xl">
          마음 챙김 워크북
        </h1>
        <p className="mt-3 text-base text-[var(--foreground)]/70">
          나의 마음 패턴을 이해하고, 스스로 대처법을 찾아가는 셀프 워크북
        </p>
      </div>

      {/* 갤러리 헤더 */}
      <div className="mx-auto max-w-2xl px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[var(--foreground)]">
            워크북 둘러보기
          </h2>
          <div className="hidden md:flex gap-2">
            <button
              onClick={scrollLeft}
              className="w-8 h-8 rounded-full border-2 border-[var(--foreground)] flex items-center justify-center text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition-colors"
              aria-label="이전"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button
              onClick={scrollRight}
              className="w-8 h-8 rounded-full border-2 border-[var(--foreground)] flex items-center justify-center text-[var(--foreground)] hover:bg-[var(--foreground)]/5 transition-colors"
              aria-label="다음"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>

        {/* 가로 스크롤 갤러리 */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide"
        >
          {WORKBOOK_CATALOG.map((wb, i) => (
            <WorkbookGalleryCard
              key={wb.id}
              workbook={wb}
              bgIndex={i}
              isActive={activeId === wb.id}
              onClick={() => setActiveId(wb.id)}
            />
          ))}
        </div>
      </div>

      {/* 상세 콘텐츠 */}
      <div key={activeId} className="mx-auto max-w-xl px-4 py-12">
        {/* 타이틀 영역 */}
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-[var(--foreground)] md:text-3xl">
            {active.title}
          </h2>
          <p className="mt-2 text-base text-[var(--foreground)]/60">
            {active.subtitle}
          </p>
          <div className="mx-auto mt-4 h-[3px] w-8 bg-[var(--foreground)]/30 rounded-full" />
        </div>

        {/* 설명 */}
        <p className="text-sm leading-relaxed text-[var(--foreground)]/80 text-center mb-10">
          {active.description}
        </p>

        {/* 포함 내용 카드 */}
        <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6 mb-6">
          <p className="text-sm text-[var(--foreground)]/60 mb-1">결제 금액</p>
          <p className="text-3xl font-bold text-[var(--foreground)]">
            {active.price.toLocaleString()}원
          </p>

          <ul className="mt-5 space-y-2.5">
            {active.features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2 text-sm text-[var(--foreground)]/80"
              >
                <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--foreground)]" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 flex items-center justify-between border-t border-[var(--border)] pt-4 text-xs text-[var(--foreground)]/50">
            <span>소요 시간: {active.estimatedMinutes}</span>
            <span>컨텐츠 조회 기간: 결제 후 90일</span>
          </div>
        </div>

        {/* CTA */}
        {active.comingSoon ? (
          <div className="text-center">
            <NotifyButton programId={active.id} programTitle={`마음 챙김 워크북 - ${active.title}`} />
            <p className="mt-3 text-xs text-[var(--foreground)]/50">
              오픈 시 알림을 받으실 수 있어요
            </p>
          </div>
        ) : (
          <Link
            href={`/payment/self-workshop/${active.id}`}
            className="block w-full rounded-xl border-2 border-[var(--foreground)] bg-white px-6 py-4 text-center text-base font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
          >
            자세히 보기
          </Link>
        )}

        {/* 돌아가기 */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-[var(--foreground)]/60 underline hover:text-[var(--foreground)]"
          >
            돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
