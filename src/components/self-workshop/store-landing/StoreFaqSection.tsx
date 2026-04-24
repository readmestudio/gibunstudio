"use client";

import { useState } from "react";
import { LANDING_FAQ } from "./content";

/**
 * [09] FAQ (아코디언)
 *
 * 한 번에 하나만 펼쳐지는 단일 활성 인덱스 패턴.
 */
export function StoreFaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="mx-auto max-w-3xl px-4 py-20">
      <p className="text-center text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-3">
        FAQ
      </p>
      <h2 className="text-center text-2xl sm:text-3xl font-bold text-[var(--foreground)] break-keep mb-10">
        자주 묻는 질문
      </h2>

      <ul className="space-y-3">
        {LANDING_FAQ.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <li
              key={item.question}
              className="rounded-xl border-2 border-[var(--foreground)]/15 bg-white overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-3 p-5 text-left"
              >
                <span className="text-sm sm:text-base font-semibold text-[var(--foreground)] break-keep">
                  Q. {item.question}
                </span>
                <span
                  aria-hidden
                  className={`flex-shrink-0 text-[var(--foreground)]/50 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </button>
              {isOpen && (
                <div className="px-5 pb-5 -mt-2">
                  <div className="border-t border-[var(--foreground)]/10 pt-4">
                    <p className="text-sm sm:text-base leading-relaxed text-[var(--foreground)]/70 break-keep">
                      {item.answer}
                    </p>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="mt-8 text-center text-xs text-[var(--foreground)]/50 break-keep">
        * 마음 챙김 워크북은 치료 목적이 아니며, 진단을 받은 경우 전문의 상담을 병행하시길
        권합니다.
      </p>
    </section>
  );
}
