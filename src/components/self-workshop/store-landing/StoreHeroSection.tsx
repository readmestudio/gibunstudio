"use client";

import { useState } from "react";
import { HERO_CHECK_ITEMS } from "./content";
import { StoreHeroWorkbookCards } from "./StoreHeroWorkbookCards";

/**
 * [01] Hero + 공감 체크리스트
 *
 * 타겟이 "이거 내 얘기다" 느끼도록 페인 포인트 중심.
 * 체크리스트 인터랙션은 로컬 state만 사용 (서버 저장 없음).
 */
export function StoreHeroSection() {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  function toggle(idx: number) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  const count = checked.size;

  return (
    <section className="mx-auto max-w-3xl px-4 pt-16 pb-20 md:pt-24">
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

      {/* 히어로 인라인 워크북 카드 */}
      <StoreHeroWorkbookCards />

      {/* 체크리스트 */}
      <div className="mt-14">
        <h2 className="text-center text-xl sm:text-2xl font-bold text-[var(--foreground)] break-keep">
          1:1 심리 상담의 이런 문제를 해결하고 싶었습니다.
        </h2>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {HERO_CHECK_ITEMS.map((text, idx) => {
            const isChecked = checked.has(idx);
            return (
              <li key={idx}>
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  aria-pressed={isChecked}
                  className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                    isChecked
                      ? "border-[var(--foreground)] bg-[var(--foreground)]/5"
                      : "border-[var(--foreground)]/15 bg-white hover:border-[var(--foreground)]/40"
                  }`}
                >
                  <span
                    className={`mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
                      isChecked
                        ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                        : "border-[var(--foreground)]/30 bg-white"
                    }`}
                    aria-hidden
                  >
                    {isChecked && (
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </span>

                  <span
                    className={`text-sm sm:text-base leading-relaxed break-keep ${
                      isChecked
                        ? "text-[var(--foreground)] font-semibold"
                        : "text-[var(--foreground)]/80"
                    }`}
                  >
                    {text}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {count > 0 && (
          <p className="mt-6 text-center text-sm text-[var(--foreground)]/60">
            지금 <span className="font-bold text-[var(--foreground)]">{count}개</span>{" "}
            체크하셨어요
          </p>
        )}
      </div>
    </section>
  );
}
