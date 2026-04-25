"use client";

import { useEffect, useMemo, useRef } from "react";

/**
 * 트리거가 나선을 따라 내려가 핵심 믿음을 점화하는 6초 사이클 모션.
 * 우상단(트리거) → 3.5바퀴 나선 → 중앙 하단(핵심 믿음) → shockwave → 리셋.
 *
 * 이 컴포넌트는 monotone 룰의 예외 영역. 시각적 임팩트(점화 = 강화의 순간)를
 * 살리기 위해 다크 스테이지 + 골드 글로우를 사용한다.
 * prefers-reduced-motion 시 정적 도식만 표시한다.
 */
export function AchievementCycleMotion() {
  const ballRef = useRef<SVGCircleElement>(null);
  const ballMidRef = useRef<SVGCircleElement>(null);
  const ballOuterRef = useRef<SVGCircleElement>(null);
  const trailRef = useRef<SVGGElement>(null);
  const triHaloRef = useRef<SVGPolygonElement>(null);
  const triangleRef = useRef<SVGPolygonElement>(null);
  const triLabelRef = useRef<SVGTextElement>(null);
  const ringsRef = useRef<SVGGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const activePathRef = useRef<SVGPathElement>(null);

  const spiralD = useMemo(() => {
    const turns = 3.5;
    const totalAngle = turns * 2 * Math.PI;
    const startY = 95;
    const endY = 395;
    const cx = 300;
    const startR = 180;
    const steps = 320;
    let d = "";
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = t * totalAngle;
      const r = startR * Math.pow(1 - t, 1.05);
      const baseY = startY + (endY - startY) * t;
      const x = cx + r * Math.cos(angle);
      const y = baseY + r * Math.sin(angle) * 0.32;
      d += (i === 0 ? "M" : " L") + x.toFixed(2) + "," + y.toFixed(2);
    }
    return d;
  }, []);

  // 결정적 별 좌표 (SSR-CSR 일치)
  const stars = useMemo(() => {
    return Array.from({ length: 36 }).map((_, i) => ({
      x: (i * 137 + 53) % 600,
      y: (i * 89 + 23) % 600,
      r: i % 4 === 0 ? 1.4 : 0.7,
      delay: (i % 8) * 0.5,
    }));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const path = pathRef.current;
    const ball = ballRef.current;
    const ballMid = ballMidRef.current;
    const ballOuter = ballOuterRef.current;
    const trail = trailRef.current;
    const triHalo = triHaloRef.current;
    const triangle = triangleRef.current;
    const triLabel = triLabelRef.current;
    const rings = ringsRef.current;
    const activePath = activePathRef.current;
    if (
      !path ||
      !ball ||
      !ballMid ||
      !ballOuter ||
      !trail ||
      !triHalo ||
      !triangle ||
      !triLabel ||
      !rings ||
      !activePath
    )
      return;

    const length = path.getTotalLength();
    const p0 = path.getPointAtLength(0);

    activePath.setAttribute("stroke-dasharray", `${length}`);
    activePath.setAttribute("stroke-dashoffset", `${length}`);

    const SVGNS = "http://www.w3.org/2000/svg";
    const ease = (t: number) =>
      t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    let raf = 0;
    let stopped = false;
    let loopTimeout: number | undefined;

    function setBall(x: number, y: number, opacity: number, r: number) {
      ball!.setAttribute("cx", x.toFixed(2));
      ball!.setAttribute("cy", y.toFixed(2));
      ball!.setAttribute("opacity", opacity.toFixed(3));
      ball!.setAttribute("r", r.toFixed(2));
      ballMid!.setAttribute("cx", x.toFixed(2));
      ballMid!.setAttribute("cy", y.toFixed(2));
      ballMid!.setAttribute("opacity", (opacity * 0.55).toFixed(3));
      ballMid!.setAttribute("r", (r * 1.7).toFixed(2));
      ballOuter!.setAttribute("cx", x.toFixed(2));
      ballOuter!.setAttribute("cy", y.toFixed(2));
      ballOuter!.setAttribute("opacity", (opacity * 0.32).toFixed(3));
      ballOuter!.setAttribute("r", (r * 3.2).toFixed(2));
    }

    function play() {
      if (stopped) return;
      trail!.innerHTML = "";
      triHalo!.setAttribute("opacity", "0");
      triangle!.setAttribute("fill", "#181d27");
      triangle!.setAttribute("stroke", "#3a4150");
      triLabel!.setAttribute("fill", "#a4abb8");
      activePath!.setAttribute("stroke-dashoffset", `${length}`);
      rings!.querySelectorAll("circle").forEach((c) => {
        c.setAttribute("opacity", "0");
        c.setAttribute("r", "60");
      });

      setBall(p0.x, p0.y, 0.5, 9);

      const T1 = 700;
      const T2 = 4000;
      const T3 = 1300;
      const TAIL = 800;
      const TOTAL = T1 + T2 + T3 + TAIL;
      let start = 0;
      let lastTrail = -1;

      function frame(now: number) {
        if (stopped) return;
        if (!start) start = now;
        const e = now - start;

        if (e < T1) {
          const t = e / T1;
          setBall(p0.x, p0.y, 0.5 + 0.5 * t, 9 + 5 * Math.sin(t * Math.PI));
        } else if (e < T1 + T2) {
          const rt = (e - T1) / T2;
          const t = ease(rt);
          const pt = path!.getPointAtLength(t * length);
          setBall(pt.x, pt.y, 1, 9 - 4 * t);
          activePath!.setAttribute(
            "stroke-dashoffset",
            (length * (1 - t)).toFixed(2),
          );

          if (rt - lastTrail > 0.014) {
            lastTrail = rt;
            const c = document.createElementNS(SVGNS, "circle");
            c.setAttribute("cx", pt.x.toFixed(2));
            c.setAttribute("cy", pt.y.toFixed(2));
            c.setAttribute("r", "3");
            c.setAttribute("fill", "#ffd166");
            c.setAttribute("filter", "url(#acm-trail-glow)");
            c.setAttribute("opacity", "0.7");
            trail!.appendChild(c);
            const t0 = performance.now();
            const fade = () => {
              if (stopped) {
                c.remove();
                return;
              }
              const ef = performance.now() - t0;
              const op = Math.max(0, 0.7 - ef / 1500);
              const r = Math.max(0.4, 3 - ef / 700);
              c.setAttribute("opacity", op.toFixed(3));
              c.setAttribute("r", r.toFixed(2));
              if (op > 0.01) requestAnimationFrame(fade);
              else c.remove();
            };
            requestAnimationFrame(fade);
          }
        } else if (e < T1 + T2 + T3) {
          const t = (e - T1 - T2) / T3;
          triHalo!.setAttribute("opacity", (t * 0.85).toFixed(3));

          const k = Math.min(1, t * 1.3);
          const rr = Math.round(24 + (255 - 24) * k);
          const gg = Math.round(29 + (209 - 29) * k);
          const bb = Math.round(39 + (102 - 39) * k);
          triangle!.setAttribute("fill", `rgb(${rr},${gg},${bb})`);
          triangle!.setAttribute("stroke", `rgb(${rr},${gg},${bb})`);

          const lk = Math.min(1, t * 1.5);
          const lr = Math.round(164 + (255 - 164) * lk);
          const lg = Math.round(171 + (235 - 171) * lk);
          const lb = Math.round(184 + (180 - 184) * lk);
          triLabel!.setAttribute("fill", `rgb(${lr},${lg},${lb})`);

          setBall(0, 0, Math.max(0, 1 - t * 1.6), Math.max(0.5, 9 - 8 * t));

          const ringEls = rings!.querySelectorAll("circle");
          ringEls.forEach((ringEl, i) => {
            const offset = i * 0.18;
            const rt = t - offset;
            if (rt > 0 && rt < 1) {
              const r = 60 + 200 * rt;
              const op = Math.max(0, 0.55 * (1 - rt));
              ringEl.setAttribute("r", r.toFixed(2));
              ringEl.setAttribute("opacity", op.toFixed(3));
            } else if (rt >= 1) {
              ringEl.setAttribute("opacity", "0");
            }
          });
        } else {
          setBall(0, 0, 0, 0);
          rings!.querySelectorAll("circle").forEach((c) => {
            c.setAttribute("opacity", "0");
          });
        }

        if (e < TOTAL) {
          raf = requestAnimationFrame(frame);
        } else {
          loopTimeout = window.setTimeout(play, 600);
        }
      }
      raf = requestAnimationFrame(frame);
    }

    const startDelay = window.setTimeout(play, 250);

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(startDelay);
      if (loopTimeout !== undefined) window.clearTimeout(loopTimeout);
    };
  }, [spiralD]);

  return (
    <div className="acm-stage relative mx-auto w-full max-w-[560px] aspect-square overflow-hidden rounded-xl">
      <svg
        viewBox="0 0 600 600"
        className="h-full w-full"
        role="img"
        aria-label="트리거에서 시작된 자동사고가 나선을 따라 핵심 믿음을 점화하는 모션"
      >
        <defs>
          <radialGradient id="acm-ball">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#ffe9a3" />
            <stop offset="100%" stopColor="#e8a02d" />
          </radialGradient>
          <radialGradient id="acm-bg-vignette" cx="50%" cy="50%" r="70%">
            <stop offset="55%" stopColor="rgba(20,26,40,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.6)" />
          </radialGradient>
          <filter
            id="acm-ball-glow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter
            id="acm-soft-glow"
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <filter
            id="acm-trail-glow"
            x="-200%"
            y="-200%"
            width="500%"
            height="500%"
          >
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
        </defs>

        {/* 다크 배경 + 비네트 */}
        <rect x="0" y="0" width="600" height="600" fill="#0a0d14" />
        <rect
          x="0"
          y="0"
          width="600"
          height="600"
          fill="url(#acm-bg-vignette)"
        />

        {/* 별 입자 */}
        <g className="acm-stars" fill="#ffffff">
          {stars.map((s, i) => (
            <circle
              key={i}
              cx={s.x}
              cy={s.y}
              r={s.r}
              style={{ animationDelay: `${s.delay}s` }}
            />
          ))}
        </g>

        {/* 나선 base */}
        <path
          ref={pathRef}
          d={spiralD}
          fill="none"
          stroke="#2a313e"
          strokeWidth={1.3}
          strokeLinecap="round"
        />
        {/* 활성화된 나선 자취 */}
        <path
          ref={activePathRef}
          d={spiralD}
          fill="none"
          stroke="#ffd166"
          strokeWidth={1.7}
          strokeLinecap="round"
          opacity={0.55}
          filter="url(#acm-trail-glow)"
        />

        {/* shockwave rings */}
        <g ref={ringsRef}>
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={300}
              cy={460}
              r={60}
              fill="none"
              stroke="#ffd166"
              strokeWidth={1.4}
              opacity={0}
            />
          ))}
        </g>

        {/* 핵심 믿음 halo */}
        <polygon
          ref={triHaloRef}
          points="245,485 355,485 300,395"
          fill="#ffd166"
          filter="url(#acm-soft-glow)"
          opacity="0"
        />
        {/* 핵심 믿음 삼각형 */}
        <polygon
          ref={triangleRef}
          points="245,485 355,485 300,395"
          fill="#181d27"
          stroke="#3a4150"
          strokeWidth={1.4}
        />

        {/* 라벨 */}
        <text
          x={510}
          y={98}
          fill="#a4abb8"
          fontSize={14}
          fontFamily="Pretendard, sans-serif"
          fontWeight={600}
        >
          트리거
        </text>
        <text
          x={510}
          y={117}
          fill="#6c7280"
          fontSize={11}
          fontFamily="Pretendard, sans-serif"
        >
          자동사고 시작점
        </text>
        <text
          x={372}
          y={272}
          fill="#6c7280"
          fontSize={13}
          fontFamily="Pretendard, sans-serif"
        >
          성취 중독 패턴
        </text>
        <text
          ref={triLabelRef}
          x={300}
          y={540}
          textAnchor="middle"
          fill="#a4abb8"
          fontSize={14}
          fontFamily="Pretendard, sans-serif"
          fontWeight={700}
        >
          핵심 믿음
        </text>

        {/* trail group */}
        <g ref={trailRef} />

        {/* 트리거 공 — 3겹 글로우 */}
        <circle
          ref={ballOuterRef}
          cx={480}
          cy={95}
          r={29}
          fill="url(#acm-ball)"
          filter="url(#acm-soft-glow)"
          opacity={0.16}
        />
        <circle
          ref={ballMidRef}
          cx={480}
          cy={95}
          r={15}
          fill="url(#acm-ball)"
          filter="url(#acm-ball-glow)"
          opacity={0.28}
        />
        <circle
          ref={ballRef}
          cx={480}
          cy={95}
          r={9}
          fill="url(#acm-ball)"
          filter="url(#acm-ball-glow)"
          opacity={0.5}
        />
      </svg>

      <style>{`
        .acm-stage { background: #0a0d14; }
        .acm-stars circle {
          opacity: 0.18;
          animation: acm-star-twinkle 4s ease-in-out infinite;
        }
        @keyframes acm-star-twinkle {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.42; }
        }
        @media (prefers-reduced-motion: reduce) {
          .acm-stars circle { animation: none; opacity: 0.28; }
        }
      `}</style>
    </div>
  );
}
