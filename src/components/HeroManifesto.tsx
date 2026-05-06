"use client";

import { useEffect, useRef } from "react";

/**
 * 풀-블리드 매니페스토 히어로.
 * 스펙: untitled/project/design_handoff_manifesto/manifesto.{html,css}
 *
 * 동작:
 *  - Line 2 ("Freedom begins.") 초기 회색 → 섹션 40% 노출 시 잉크로 1.2s 트랜지션
 *  - 각 헤드라인 라인은 마스크 안에서 translateY(110%) → 0 (스태거 0.08s/0.16s)
 *  - eyebrow / subtitle 은 fade + 24px translateY (스태거 0/0.24s)
 *  - prefers-reduced-motion: reduce → 모션 없이 즉시 최종 상태
 */
export function HeroManifesto() {
  const stageRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealEls = stage.querySelectorAll(".mf-mask, .mf-eyebrow");

    if (reduced) {
      stage.classList.add("mf-in");
      revealEls.forEach((el) => el.classList.add("mf-in"));
      return;
    }

    // (1) Line 2 색상 전환 — 섹션의 ~40%가 보이면 트리거, 한 번만 발화.
    const stageIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            stage.classList.add("mf-in");
            stageIo.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    stageIo.observe(stage);

    // (2)(3) 라인 마스크 + eyebrow/sub 페이드 — 좀 더 빠른 임계값.
    const revealIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("mf-in");
            revealIo.unobserve(e.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => revealIo.observe(el));

    return () => {
      stageIo.disconnect();
      revealIo.disconnect();
    };
  }, []);

  return (
    <>
      <section
        ref={stageRef}
        className="mf-stage mf-stage--hero"
        aria-labelledby="mf-headline"
      >
        <div className="mf-wrap">
          <span className="mf-eyebrow">
            <span className="mf-dot" aria-hidden="true" />
            AI 시대의 심리 상담 스튜디오
          </span>
          <h1 id="mf-headline" className="mf-headline">
            <span className="mf-mask">
              <span className="mf-line mf-line-1">Hack yourself.</span>
            </span>
            <span className="mf-mask">
              <span className="mf-line mf-line-2">Stay in good vibes.</span>
            </span>
          </h1>
        </div>
      </section>

      <style jsx global>{`
        /* ── 매니페스토 블록 (prefix mf-) ──
           스펙: design_handoff_manifesto/manifesto.css */
        .mf-stage {
          padding: 200px 0;
          background: #fff;
        }
        .mf-stage .mf-wrap {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 40px;
          text-align: center;
        }

        /* 히어로 변형 — 뷰포트 풀-하이트, 콘텐츠 수직 중앙정렬 */
        .mf-stage--hero {
          min-height: 100svh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 120px 0;
        }

        @media (max-width: 720px) {
          .mf-stage { padding: 120px 0; }
          .mf-stage .mf-wrap { padding: 0 24px; }
          .mf-stage--hero { padding: 96px 0; }
        }

        /* Eyebrow */
        .mf-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          font-family: "JetBrains Mono", ui-monospace, "SF Mono", Consolas, monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #8a8a92;
          margin-bottom: 28px;
        }
        .mf-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ff5a1f;
          box-shadow: 0 0 12px rgba(255, 90, 31, 0.45);
        }

        /* Headline */
        .mf-headline {
          font-family: "Inter", system-ui, sans-serif;
          font-size: clamp(72px, 11.5vw, 184px);
          font-weight: 800;
          letter-spacing: -0.055em;
          line-height: 0.94;
          margin: 0;
        }
        .mf-mask {
          display: block;
          overflow: hidden;
        }
        .mf-line { display: inline-block; }
        .mf-line-1 { color: #0a0a0b; }
        .mf-line-2 {
          color: #d8d8dc;
          transition: color 1.2s cubic-bezier(0.2, 0.7, 0.2, 1);
        }
        .mf-stage.mf-in .mf-line-2 { color: #0a0a0b; }

        /* ── 진입 애니메이션 ── */
        .mf-mask .mf-line {
          transform: translateY(110%);
          transition: transform 1s cubic-bezier(0.2, 0.7, 0.2, 1);
        }
        .mf-mask.mf-in .mf-line { transform: none; }
        .mf-headline .mf-mask:nth-child(1) .mf-line { transition-delay: 0.08s; }
        .mf-headline .mf-mask:nth-child(2) .mf-line { transition-delay: 0.16s; }

        .mf-eyebrow {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 0.9s cubic-bezier(0.2, 0.7, 0.2, 1),
            transform 0.9s cubic-bezier(0.2, 0.7, 0.2, 1);
        }
        .mf-eyebrow.mf-in { opacity: 1; transform: none; }

        @media (prefers-reduced-motion: reduce) {
          .mf-mask .mf-line { transform: none; transition: none; }
          .mf-eyebrow { opacity: 1; transform: none; transition: none; }
          .mf-line-2 { color: #0a0a0b; transition: none; }
        }
      `}</style>
    </>
  );
}
