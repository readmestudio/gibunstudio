import { getDemoWorkshopResult } from "@/lib/self-workshop/getDemoWorkshopResult";
import { RedesignLandingPage } from "./redesign-landing/RedesignLandingPage";

/**
 * 마음 챙김 워크북 마케팅 랜딩 페이지 (`/payment/self-workshop`).
 *
 * 디자인 리뱀프 — Apple-style 마케팅 톤 + 오렌지 액센트.
 * 슬라이드쇼는 기존 StoreHeroWorkbookSlideshow(실제 페이지 스크린샷)를 재사용.
 */
export async function WorkbookStorePage() {
  const demoResult = await getDemoWorkshopResult();
  return <RedesignLandingPage demoResult={demoResult} />;
}
