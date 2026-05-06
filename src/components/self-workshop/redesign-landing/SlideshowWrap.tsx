"use client";

import type { DemoWorkshopResult } from "@/lib/self-workshop/getDemoWorkshopResult";
import { StoreHeroWorkbookSlideshow } from "../store-landing/StoreHeroWorkbookSlideshow";

/**
 * 새 디자인 안에서 기존 슬라이드쇼(실제 스크린샷 사용)를 그대로 사용하기 위한 래퍼.
 * 핸드오프 디자인 원본은 placeholder 카드(.pv-circle/.pv-line)로 만들었지만,
 * 사용자 요청에 따라 우리가 만든 실제 워크북 페이지 스크린샷 슬라이드쇼를 유지한다.
 *
 * 위 아래 여백을 디자인 의도(.lr-slideshow padding 60/120)와 비슷하게 맞춘다.
 */
export function SlideshowWrap({
  demoResult,
}: {
  demoResult: DemoWorkshopResult | null;
}) {
  return (
    <div style={{ padding: "60px 0 120px" }}>
      <StoreHeroWorkbookSlideshow demoResult={demoResult} />
    </div>
  );
}
