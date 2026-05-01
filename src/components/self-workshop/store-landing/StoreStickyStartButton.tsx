"use client";

import { useEffect, useState } from "react";

/**
 * 플로팅 "출시 알림신청하고 할인받기" 버튼.
 *
 * - 히어로 영역 지난 후 표시 (스크롤 400px 이상).
 * - href="#waitlist" anchor — 추후 알림 신청 폼/카카오 채널로 hook-up.
 */
export function StoreStickyStartButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 400);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      }`}
      aria-hidden={!visible}
    >
      <a
        href="#waitlist"
        className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--foreground)] bg-[var(--foreground)] px-7 py-4 text-sm sm:text-base font-bold text-white shadow-[4px_4px_0_rgba(0,0,0,0.15)] hover:shadow-[6px_6px_0_rgba(0,0,0,0.2)] hover:-translate-y-0.5 transition-all"
      >
        <span>출시 알림신청하고 할인받기</span>
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
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </a>
    </div>
  );
}
