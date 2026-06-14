import { OverviewLandingPage } from "./redesign-landing/OverviewLandingPage";

/**
 * 마음 챙김 워크북 *전반* 상세 페이지 (`/payment/self-workshop`).
 *
 * 단일 주제(성취 중독)가 아니라 워크북 시리즈 전반의 접근법(IFS+CBT)과
 * 공통 커리큘럼을 안내한다. 개별 워크북 상세는 하위 경로에서 다룬다.
 *  - 성취 중독 → `/payment/self-workshop/achievement-addiction`
 */
export function WorkbookOverviewPage() {
  return <OverviewLandingPage />;
}
