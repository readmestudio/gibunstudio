"use client";

import type { DemoWorkshopResult } from "@/lib/self-workshop/getDemoWorkshopResult";
import { StoreHeroWorkbookSlideshow } from "../store-landing/StoreHeroWorkbookSlideshow";

/**
 * 새 디자인 안에서 워크북 단계 슬라이드쇼를 사용하기 위한 래퍼.
 * 카드 콘텐츠는 외부 스크린샷이 아니라 코드 미니어처(목업)로 그려서,
 * 워크북이 바뀌면 컴포넌트 코드에서 곧바로 반영된다.
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
