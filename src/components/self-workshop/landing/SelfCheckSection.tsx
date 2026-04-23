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
  const message = getSignalMessage(count);

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
        {message && (
          <p
            className={`mt-3 inline-block break-keep ${message.className}`}
          >
            {message.text}
          </p>
        )}
      </div>
    </section>
  );
}

/**
 * 체크 개수에 따른 단계별 메시지 & 강도 스타일.
 * 0개: 메시지 없음
 * 1~2개: 중립 힌트
 * 3~4개: 테두리 있는 중간 경고
 * 5~6개: 굵은 테두리 + 살짝 채운 경고
 * 7~8개: 검정 배경 흰 글씨 강한 경고
 */
function getSignalMessage(count: number): { text: string; className: string } | null {
  const pillBase = "rounded-full px-4 py-1.5 text-sm font-semibold";
  const neutral = "text-sm text-[var(--foreground)]/60";

  if (count === 0) return null;
  if (count === 1) {
    return {
      text: "한두 번은 누구에게나 있는 일이에요.",
      className: neutral,
    };
  }
  if (count === 2) {
    return {
      text: "반복되고 있다면, 한번 들여다볼 때입니다.",
      className: neutral,
    };
  }
  if (count === 3) {
    return {
      text: "지금 당신의 마음이 보내는 신호를 들어야 할 때입니다.",
      className: `${pillBase} border-2 border-[var(--foreground)] text-[var(--foreground)]`,
    };
  }
  if (count === 4) {
    return {
      text: "이미 패턴이 만들어져 있어요. 그냥 지나칠 수 없는 단계입니다.",
      className: `${pillBase} border-2 border-[var(--foreground)] text-[var(--foreground)]`,
    };
  }
  if (count === 5) {
    return {
      text: "성취 중독의 악순환에 들어서는 중이에요. 방치하면 더 깊어집니다.",
      className: `${pillBase} border-2 border-[var(--foreground)] bg-[var(--foreground)]/5 text-[var(--foreground)]`,
    };
  }
  if (count === 6) {
    return {
      text: "번아웃의 문턱이에요. 혼자 빠져나오기 어려운 지점에 와 있습니다.",
      className: `${pillBase} border-2 border-[var(--foreground)] bg-[var(--foreground)]/5 text-[var(--foreground)]`,
    };
  }
  if (count === 7) {
    return {
      text: "마음이 한계에 가까워지고 있어요. 지금 멈추고 돌봐야 합니다.",
      className: `${pillBase} bg-[var(--foreground)] text-white`,
    };
  }
  // count === 8
  return {
    text: "회사도, 당신도 지킬 수 없는 상태예요. 지금 행동하지 않으면 너무 늦습니다.",
    className: `${pillBase} bg-[var(--foreground)] text-white`,
  };
}
