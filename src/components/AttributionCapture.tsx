"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution";

// 앱 어디로 진입하든 첫 로드 시 광고 유입 파라미터(UTM/fbclid)를 캡처한다.
// useSearchParams 대신 window.location 을 직접 읽어 Suspense 바운더리가 필요 없다.
export function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);
  return null;
}
