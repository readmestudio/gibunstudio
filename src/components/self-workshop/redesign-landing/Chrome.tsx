"use client";

import { useEffect, useState } from "react";
import { WorkshopNotifyButton } from "./WorkshopNotifyButton";

/* ── 최상단 띠 배너 ── */
export function SoftLaunchBanner() {
  return (
    <div className="lr-softlaunch">
      <span className="lr-pulse" />
      <span>
        <b>SOFT LAUNCH</b> · 정식 오픈 시 알림과 함께 특별가를
        보내드려요.
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
        <WorkshopNotifyButton className="lr-cta-mini">
          알림 신청
        </WorkshopNotifyButton>
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
      <WorkshopNotifyButton className="lr-cta-pill lr-accent">
        대기자 등록하기
        <span className="lr-arrow">→</span>
      </WorkshopNotifyButton>
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
