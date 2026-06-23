"use client";

import { useEffect, useState } from "react";

/* ── 워크북 시작 경로 (무료 진단 → 결제) ── */
export const WORKBOOK_START_HREF = "/dashboard/self-workshop";

/* ── 최상단 띠 배너 ── */
export function SoftLaunchBanner() {
  return (
    <div className="lr-softlaunch">
      <span className="lr-pulse" />
      <span>
        지금 <b>무료 자가 진단</b>으로 시작하고 바로 워크북을 받아보세요.
      </span>
    </div>
  );
}

/* ── Sticky 상단 내비게이션 ── */
export function TopBar() {
  return (
    <header className="lr-topbar">
      <div className="lr-topbar-inner">
        <a href="/" className="lr-logo">
          <span className="lr-logo-mark" />
          gibun
        </a>
        <nav>
          <a href="#features">기능</a>
          <a href="#workbooks">워크북</a>
          <a href="#points">실제 동작</a>
          <a href="#price">가격</a>
          <a href="#faq">FAQ</a>
        </nav>
        <a href={WORKBOOK_START_HREF} className="lr-cta-mini">
          시작하기
        </a>
      </div>
    </header>
  );
}

/* ── 플로팅 CTA — Hero 통과 후 노출 ── */
export function StickyCTA() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 800);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className={`lr-sticky-cta ${show ? "lr-show" : ""}`}>
      <a href={WORKBOOK_START_HREF} className="lr-cta-pill lr-accent">
        워크북 시작하기
        <span className="lr-arrow">→</span>
      </a>
    </div>
  );
}

/* ── 푸터 — 홈 링크만 ── */
export function Footer() {
  return (
    <div className="lr-foot">
      <a href="/">← 홈으로 돌아가기</a>
    </div>
  );
}

/* ── 섹션 사이 디바이더 ── */
export function Divider() {
  return <div className="lr-divider" />;
}
