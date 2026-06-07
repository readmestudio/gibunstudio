/**
 * @deprecated entry 단위 LLM 리포트 페이지는 Freemium 전환으로 폐기.
 * 종합 리포트는 /dashboard/mind-spill/period/[id] 사용.
 */
import { redirect } from "next/navigation";

export default function DeprecatedEntryReportPage() {
  redirect("/dashboard/mind-spill");
}
