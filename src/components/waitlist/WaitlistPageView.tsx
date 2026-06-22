"use client";

import { useEffect } from "react";
import { trackMetaEvent } from "@/lib/meta-pixel";

// 워크북 대기신청 페이지 진입을 전용 이벤트(ViewContent)로 기록한다.
// 전역 PageView 는 사이트 모든 페이지에서 발화되므로, 이 페이지만 따로 보려면
// content_name 으로 식별 가능한 표준 이벤트를 한 번 더 쏜다.
// 마운트 시 1회만 — StrictMode 이중 호출은 의미상 무해(같은 진입 1회로 간주).
export function WaitlistPageView() {
  useEffect(() => {
    trackMetaEvent("ViewContent", {
      content_name: "워크북 대기신청",
      content_category: "waitlist",
    });
  }, []);
  return null;
}
