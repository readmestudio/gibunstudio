"use client";

import Link from "next/link";
import { WORKBOOK_CATALOG, type WorkbookInfo } from "@/lib/self-workshop/workbook-catalog";
import { NotifyButton } from "@/components/NotifyButton";
import { PROGRAM_BG } from "@/lib/self-hacking/test-catalog";

/**
 * 마음 챙김 워크북 선택 페이지
 *
 * /payment/self-workshop — 워크북 종류를 카드로 선택하는 페이지.
 * 여기서는 결제하지 않고, 카드 클릭 시 해당 워크북의 상세 페이지로 이동.
 */
export function WorkbookStorePage() {
  return (
    <div className="min-h-screen bg-white px-4 py-16">
      <div className="mx-auto max-w-3xl">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-[var(--foreground)] md:text-4xl">
            직장인을 위한 마음 챙김 워크북
          </h1>
          <p className="mt-4 text-base text-[var(--foreground)]/70 max-w-lg mx-auto break-keep">
            마음이 힘들어 회사를 그만둘까 고민이라면.
            <br />
            재능이 아깝기 전에, 마음부터 챙기면 성과는 따라옵니다.
          </p>
          <p className="mt-3 text-sm text-[var(--foreground)]/50 max-w-md mx-auto break-keep">
            진단에서 끝나지 않고, 실습과 실전 DO&DONT&apos;S까지. 성취 중독을 극복하고 퍼포먼스를 극대화해드려요.
          </p>
        </div>

        {/* 카드 그리드 */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {WORKBOOK_CATALOG.map((wb, index) => (
            <WorkbookCard key={wb.id} workbook={wb} bgIndex={index} />
          ))}
        </div>

        {/* 홈 링크 */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:underline"
          >
            ← 홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── 워크북 카드 ── */

function WorkbookCard({
  workbook,
  bgIndex,
}: {
  workbook: WorkbookInfo;
  bgIndex: number;
}) {
  const bg = PROGRAM_BG[bgIndex % PROGRAM_BG.length];
  const priceLabel =
    workbook.originalPrice && workbook.originalPrice > workbook.price
      ? `${workbook.originalPrice.toLocaleString()}원 → ${workbook.price.toLocaleString()}원`
      : `${workbook.price.toLocaleString()}원`;

  // Coming Soon 워크북: 링크 없이 알림 신청만
  if (workbook.comingSoon) {
    return (
      <div className="relative flex flex-col h-full overflow-hidden bg-white border-2 border-[var(--foreground)] rounded-2xl opacity-75">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url('${bg}')` }}
        />
        <div className="relative z-10 flex flex-col h-full p-6">
          <span className="self-start mb-2 px-2 py-0.5 text-xs font-semibold rounded border border-[var(--foreground)] text-[var(--foreground)]">
            Coming Soon
          </span>
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1">
            {workbook.title}
          </h3>
          <p className="text-xs text-[var(--foreground)]/60 mb-3">
            {workbook.subtitle}
          </p>
          <p className="text-sm leading-relaxed text-[var(--foreground)]/70 flex-grow mb-4 break-keep">
            {workbook.description}
          </p>
          <p className="text-xs text-[var(--foreground)]/50 mb-3">
            {priceLabel}
          </p>
          <NotifyButton
            programId={workbook.id}
            programTitle={`마음 챙김 워크북 - ${workbook.title}`}
          />
        </div>
      </div>
    );
  }

  // 활성 워크북: 상세 페이지로 이동
  return (
    <Link href={`/payment/self-workshop/${workbook.id}`}>
      <div className="relative flex flex-col h-full overflow-hidden bg-white border-2 border-[var(--foreground)] rounded-2xl transition-shadow hover:shadow-[4px_4px_0_var(--foreground)]">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url('${bg}')` }}
        />
        <div className="relative z-10 flex flex-col h-full p-6">
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-1">
            {workbook.title}
          </h3>
          <p className="text-xs text-[var(--foreground)]/60 mb-3">
            {workbook.subtitle}
          </p>
          <p className="text-sm leading-relaxed text-[var(--foreground)]/70 flex-grow mb-4 break-keep">
            {workbook.description}
          </p>
          <p className="text-xs text-[var(--foreground)]/50 mb-3">
            {priceLabel}
          </p>
          <span className="inline-flex items-center text-sm font-semibold text-[var(--foreground)]">
            자세히 보기 →
          </span>
        </div>
      </div>
    </Link>
  );
}
