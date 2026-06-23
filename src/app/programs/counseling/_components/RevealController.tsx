"use client";

import { useEffect } from "react";

/**
 * 스크롤 진입 애니메이션 컨트롤러.
 *
 * `.counseling-page` 안의 `.f-up`/`.f-blur` 요소가 뷰포트에 들어오면 `.in`을
 * 붙여 한 번 등장시킨다(핸드오프의 useFadeIn 대응).
 *
 * - IntersectionObserver 사용, 한 번 등장 후 관찰 해제.
 * - 안전장치: 마운트 직후 화면에 이미 보이는 요소 즉시 등장 + 1.2초 폴백으로
 *   관찰이 실패해도 콘텐츠가 영영 숨지 않도록 보장.
 * - prefers-reduced-motion 존중: 모두 즉시 표시.
 */
export function RevealController() {
  useEffect(() => {
    const root = document.querySelector(".counseling-page");
    if (!root) return;

    const targets = Array.from(
      root.querySelectorAll<HTMLElement>(".f-up:not(.in), .f-blur:not(.in)"),
    );
    if (targets.length === 0) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      targets.forEach((el) => el.classList.add("in", "shown"));
      return;
    }

    const reveal = (el: HTMLElement) => {
      el.classList.add("in");
      // 애니메이션 종료 후 완료 상태 고정(0프레임 멈춤 방지)
      window.setTimeout(() => el.classList.add("shown"), 1300);
    };

    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            reveal(entry.target as HTMLElement);
            obs.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -40px 0px", threshold: 0.01 },
    );

    targets.forEach((el) => io.observe(el));

    // 폴백: 1.2초 뒤에도 남아 있는 요소는 강제로 보이게(관찰 실패 대비)
    const fallback = window.setTimeout(() => {
      targets.forEach((el) => {
        if (!el.classList.contains("in")) reveal(el);
      });
    }, 1200);

    return () => {
      io.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return null;
}
