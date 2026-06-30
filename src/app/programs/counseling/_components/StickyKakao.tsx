"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChatIcon } from "./Icons";

/**
 * 우하단에 떠 있는 상담 시작 버튼. scrollY > 700일 때 페이드+슬라이드 인.
 * 입문가(1회 체험) 결제 페이지로 연결한다.
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
      <Link href="/payment/counseling/trial" className="cta-pill accent">
        <ChatIcon /> 상담 시작하기
      </Link>
    </div>
  );
}
