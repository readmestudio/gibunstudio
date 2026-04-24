"use client";

import { useEffect, useState } from "react";

/**
 * 플로팅 "워크북 시작하기" 버튼.
 *
 * - 클릭 시 id="workbooks" 섹션으로 부드럽게 스크롤.
 * - 스크롤이 일정 이상 내려가야 표시 (히어로에서는 숨김).
 * - 이미 "워크북 종류" 섹션 안에 들어와 있으면 자동으로 숨김
 *   (같은 위치로 스크롤하는 중복 CTA 방지).
 */
export function StoreStickyStartButton({
  targetId = "workbooks",
}: {
  targetId?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      const scrollY = window.scrollY;
      const afterHero = scrollY > 400;

      const target = document.getElementById(targetId);
      let insideTarget = false;
      if (target) {
        const rect = target.getBoundingClientRect();
        // 뷰포트와 섹션이 많이 겹치면 숨김 (사용자가 이미 그 섹션에 있는 상태)
        insideTarget =
          rect.top < window.innerHeight * 0.3 &&
          rect.bottom > window.innerHeight * 0.3;
      }

      setVisible(afterHero && !insideTarget);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [targetId]);

  function handleClick() {
    const el = document.getElementById(targetId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      aria-hidden={!visible}
    >
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--foreground)] bg-[var(--foreground)] px-7 py-4 text-sm sm:text-base font-bold text-white shadow-[4px_4px_0_rgba(0,0,0,0.15)] hover:shadow-[6px_6px_0_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all"
      >
        <span>워크북 시작하기</span>
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>
  );
}
