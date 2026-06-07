/**
 * @deprecated 워크북 모델은 데일리 엔트리 모델로 대체됨. 캘린더로 리다이렉트.
 * Phase 3 cleanup에서 디렉토리 자체 제거 예정.
 */
import { redirect } from "next/navigation";

export default function DeprecatedWeeklyWorkbookPage() {
  redirect("/dashboard/mind-spill");
}
