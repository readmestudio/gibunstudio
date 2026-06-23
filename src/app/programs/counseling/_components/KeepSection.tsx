"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { KEEPS, REPORT_PAGES } from "../content";
import { ChevronLeftIcon, ChevronRightIcon } from "./Icons";

/**
 * 리포트 플립 캐러셀 — 브라우저 창 프레임 + 1:1 스테이지.
 * 3.6초 자동 전환(호버 일시정지), ←/→·도트로 수동 제어.
 */
function ReportFlip() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = REPORT_PAGES.length;

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((p) => (p + 1) % n), 3600);
    return () => clearInterval(t);
  }, [paused, n]);

  return (
    <div
      className="report-flip"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="rf-window">
        <div className="rf-bar">
          <span className="rf-tl" />
          <span className="rf-tl" />
          <span className="rf-tl" />
          <span className="rf-name">기분 리포트 · Vol.01</span>
        </div>
        <div className="rf-stage">
          <Image
            key={i}
            src={REPORT_PAGES[i].src}
            alt={REPORT_PAGES[i].cap}
            className="rf-page"
            fill
            sizes="(max-width: 860px) 100vw, 620px"
            priority={i === 0}
          />
        </div>
      </div>
      <div className="rf-ctrl">
        <button
          type="button"
          className="rf-arrow"
          onClick={() => setI((i - 1 + n) % n)}
          aria-label="이전 장"
        >
          <ChevronLeftIcon />
        </button>
        <div className="rf-dots">
          {REPORT_PAGES.map((p, idx) => (
            <button
              key={p.src}
              type="button"
              className={`rf-d ${idx === i ? "on" : ""}`}
              onClick={() => setI(idx)}
              aria-label={`${idx + 1}장 보기`}
            />
          ))}
        </div>
        <button
          type="button"
          className="rf-arrow"
          onClick={() => setI((i + 1) % n)}
          aria-label="다음 장"
        >
          <ChevronRightIcon />
        </button>
      </div>
      <div className="rf-cap">{REPORT_PAGES[i].cap}</div>
    </div>
  );
}

/**
 * [8] WHAT YOU KEEP — 상담이 끝나도 남는 것. 좌 번호 리스트 + 우 리포트 캐러셀.
 */
export function KeepSection() {
  return (
    <section className="section">
      <div className="wrap-5">
        <div className="s-header">
          <span className="eyebrow f-up">
            <span className="dot" />
            WHAT YOU KEEP
          </span>
          <h2 className="f-up delay-1">
            상담이 끝나도,
            <br />
            <em>남는 것이</em> 있습니다
          </h2>
        </div>
        <div className="keep f-up">
          <div className="keep-list">
            {KEEPS.map((k, i) => (
              <div className="keep-item" key={k.title}>
                <span className="kn">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h4>{k.title}</h4>
                  <p>{k.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="keep-visual">
            <ReportFlip />
          </div>
        </div>
      </div>
    </section>
  );
}
