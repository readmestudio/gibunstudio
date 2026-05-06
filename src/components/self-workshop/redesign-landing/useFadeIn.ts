"use client";

import { useEffect } from "react";

/**
 * 스크롤 진입 시 .lr-f-up / .lr-f-blur 요소에 .lr-in 클래스를 붙여 등장시킨다.
 * 페이지 마운트 후 한 번만 IntersectionObserver를 등록하면 모든 자식이 자동 트리거.
 */
export function useFadeIn() {
  useEffect(() => {
    const root = document.querySelector(".lr");
    if (!root) return;
    const els = root.querySelectorAll<HTMLElement>(
      ".lr-f-up:not(.lr-in), .lr-f-blur:not(.lr-in)",
    );
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("lr-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}
