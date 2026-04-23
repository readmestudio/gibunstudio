"use client";

import { useState } from "react";

/**
 * 공감 체크리스트 섹션
 *
 * 독자가 자신의 증상을 인식하게 한다. 3개 이상 해당 시 강조 메시지 노출.
 * 체크 상태는 로컬 state만 사용 (서버 저장 없음).
 */

const CHECK_ITEMS = [
  "주말에 쉬고 있으면 왠지 죄책감이 든다",
  "칭찬을 받아도 '운이 좋았을 뿐'이라고 생각한다",
  "상사의 한마디에 며칠씩 마음이 무겁다",
  "완벽하지 않으면 시작조차 두렵다",
  "성과를 내고도 곧바로 '다음은?'을 걱정한다",
  "남들에겐 좋아 보이지만, 속은 늘 불안하다",
  "회사를 그만두고 싶다는 생각을 자주 한다",
  "쉬는 방법을 모른다",
];

export function SelfCheckSection() {
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
  const isSignal = count >= 3;

  return (
    <section className="mx-auto max-w-3xl px-4 py-20">
      {/* 라벨 */}
      <p className="text-center text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/40 mb-3">
        SELF-CHECK
      </p>

      {/* H1 */}
      <h2 className="text-center text-2xl sm:text-3xl font-bold text-[var(--foreground)] break-keep">
        혹시 당신도, 이런 적 있으신가요?
      </h2>

      {/* 리드 */}
      <p className="mt-4 text-center text-sm sm:text-base text-[var(--foreground)]/60 break-keep">
        3개 이상 해당된다면, 지금 당신의 마음이 보내는 신호를 들어야 할 때입니다.
      </p>

      {/* 체크리스트 */}
      <ul className="mt-10 grid gap-3 sm:grid-cols-2">
        {CHECK_ITEMS.map((text, idx) => {
          const isChecked = checked.has(idx);
          return (
            <li key={idx}>
              <button
                type="button"
                onClick={() => toggle(idx)}
                aria-pressed={isChecked}
                className={`group flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                  isChecked
                    ? "border-[var(--foreground)] bg-[var(--foreground)]/5"
                    : "border-[var(--foreground)]/15 bg-white hover:border-[var(--foreground)]/40"
                }`}
              >
                {/* 체크박스 */}
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

      {/* 카운터 */}
      <div className="mt-10 text-center">
        <p className="text-sm text-[var(--foreground)]/60">
          지금{" "}
          <span className="font-bold text-[var(--foreground)]">{count}개</span>{" "}
          체크하셨어요
        </p>
        {isSignal && (
          <p className="mt-3 inline-block rounded-full border-2 border-[var(--foreground)] px-4 py-1.5 text-sm font-semibold text-[var(--foreground)]">
            지금 당신의 마음이 보내는 신호를 들어야 할 때입니다.
          </p>
        )}
      </div>
    </section>
  );
}
