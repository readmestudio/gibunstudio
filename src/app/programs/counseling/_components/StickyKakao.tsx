"use client";

import { useEffect, useState } from "react";
import { KAKAO_CHANNEL_URL } from "../content";
import { ChatIcon } from "./Icons";

/**
 * 우하단에 떠 있는 카카오톡 문의 버튼. scrollY > 700일 때 페이드+슬라이드 인.
 */
export function StickyKakao() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className={`sticky-kakao ${show ? "show" : ""}`}>
      <a href={KAKAO_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="cta-pill accent">
        <ChatIcon /> 카카오톡 문의하기
      </a>
    </div>
  );
}
