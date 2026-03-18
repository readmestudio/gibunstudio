"use client";

import { useState } from "react";
import Link from "next/link";
import {
  type TestCategory,
  type TestInfo,
  CATEGORY_ORDER,
  CATEGORY_LABELS,
  PROGRAM_BG,
  getTestsByCategory,
} from "@/lib/self-hacking/test-catalog";
import { NotifyButton } from "@/components/NotifyButton";

interface CategoryTabsProps {
  completedTests: string[];
}

export default function CategoryTabs({ completedTests }: CategoryTabsProps) {
  const [active, setActive] = useState<TestCategory>("free");
  const completedSet = new Set(completedTests);

  return (
    <>
      {/* 탭 버튼 */}
      <div className="flex gap-2 mb-8">
        {CATEGORY_ORDER.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              active === cat
                ? "bg-[var(--foreground)] text-white"
                : "border-2 border-[var(--foreground)] text-[var(--foreground)] bg-white hover:bg-[var(--foreground)]/5"
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* 카드 그리드 또는 준비중 */}
      {active === "package" ? (
        <div className="flex items-center justify-center rounded-2xl border-2 border-[var(--foreground)] p-12">
          <p className="text-[var(--foreground)]/60 text-center">
            준비중입니다
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {getTestsByCategory(active).map((card, index) => (
            <TestCard
              key={card.id}
              card={card}
              bgIndex={index}
              isCompleted={completedSet.has(card.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}

/* ── 개별 카드 ── */
function TestCard({
  card,
  bgIndex,
  isCompleted,
}: {
  card: TestInfo;
  bgIndex: number;
  isCompleted: boolean;
}) {
  const bg = PROGRAM_BG[bgIndex % PROGRAM_BG.length];

  /* notifyOnly 검사: 링크 없이 알림신청 버튼만 표시 */
  if (card.notifyOnly) {
    return (
      <div className="relative flex flex-col h-full overflow-hidden bg-white border-2 border-[var(--foreground)] rounded-2xl opacity-75">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url('${bg}')` }}
        />
        <div className="relative z-10 flex flex-col h-full p-6">
          {card.category === "paid" && (
            <span className="self-start mb-2 px-2 py-0.5 text-xs font-semibold rounded border border-[var(--foreground)] text-[var(--foreground)]">
              전문가 해석
            </span>
          )}
          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            {card.title}
          </h3>
          <p className="text-sm leading-relaxed text-[var(--foreground)]/70 flex-grow mb-4">
            {card.description}
          </p>
          <p className="text-xs text-[var(--foreground)]/50 mb-3">
            {card.price}
          </p>
          <NotifyButton programId={card.id} programTitle={card.title} />
        </div>
      </div>
    );
  }

  /* 완료된 무료 검사: 결과 페이지로 분기 */
  const completedHrefMap: Record<string, string> = {
    "husband-match": "/husband-match/birth-info",
    "core-belief": "/self-hacking/core-belief/result",
    attachment: "/self-hacking/attachment/result",
  };

  const ctaText = isCompleted ? "결과 보기 →" : "자세히 보기 →";
  const href = isCompleted && completedHrefMap[card.id]
    ? completedHrefMap[card.id]
    : `/self-hacking/detail/${card.id}`;

  return (
    <Link href={href}>
      <div className="relative flex flex-col h-full overflow-hidden bg-white border-2 border-[var(--foreground)] rounded-2xl transition-shadow hover:shadow-[4px_4px_0_var(--foreground)]">
        {/* 수채화 배경 */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url('${bg}')` }}
        />
        <div className="relative z-10 flex flex-col h-full p-6">
          {/* 카테고리 뱃지 */}
          {card.category === "paid" && (
            <span className="self-start mb-2 px-2 py-0.5 text-xs font-semibold rounded border border-[var(--foreground)] text-[var(--foreground)]">
              전문가 해석
            </span>
          )}

          <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            {card.title}
          </h3>
          <p className="text-sm leading-relaxed text-[var(--foreground)]/70 flex-grow mb-4">
            {card.description}
          </p>

          {/* 가격 */}
          <p className="text-xs text-[var(--foreground)]/50 mb-3">
            {card.price}
          </p>

          {/* CTA */}
          <span className="inline-flex items-center text-sm font-semibold text-[var(--foreground)]">
            {ctaText}
          </span>
        </div>
      </div>
    </Link>
  );
}
