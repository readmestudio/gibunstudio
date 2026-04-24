"use client";

import { useState } from "react";
import { HERO_CHECK_ITEMS } from "./content";

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
      <h1 className="text-center text-3xl sm:text-4xl md:text-5xl font-bold leading-[1.3] text-[var(--foreground)] break-keep">
        상담은 받고 싶은데,
        <br />
        매주 50분이 부담스러운 당신에게
      </h1>

      <p className="mt-6 text-center text-base sm:text-lg leading-relaxed text-[var(--foreground)]/70 break-keep">
        덮으면 끝나고, 펴면 다시 시작됩니다.
      </p>

      {/* 체크리스트 */}
      <div className="mt-14">
        <p className="text-center text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-3">
          SELF-CHECK
        </p>
        <h2 className="text-center text-xl sm:text-2xl font-bold text-[var(--foreground)] break-keep">
          혹시 이런 장면, 낯설지 않으신가요?
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

      {/* 소문단 */}
      <div className="mt-12 mx-auto max-w-xl rounded-2xl border-2 border-[var(--foreground)]/15 bg-[var(--surface)] p-6">
        <p className="text-sm sm:text-base leading-relaxed text-[var(--foreground)]/80 break-keep">
          &ldquo;상담사 선생님은 좋은 분인데, 이제 혼자 해봐도 될 것 같은데…&rdquo; 하면서도
          차마 말 못 꺼내본 적 있으시죠. 관계가 쌓일수록 끊기 어려워지는 게 상담이기도 합니다.
          <br />
          <br />
          워크북은 그 부담이 없어요. 덮으면 끝나고, 펴면 다시 시작됩니다.
        </p>
      </div>
    </section>
  );
}
