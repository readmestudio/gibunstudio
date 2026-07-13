/**
 * /inner-child/en/r/[id] — saved English free report (no login, link access).
 *
 * [id] 는 minds_leads 의 leadId(UUID). 서버에서 admin 으로 parts_map(FreeReportBlob)을 읽어
 * 그대로 렌더한다. 저장 스토어는 언어 중립적이라 한국어와 공유한다(영어 라우트가 영어 텍스트를
 * 채워 넣었을 뿐). 유료 결제가 없으므로 KR 판의 paidPurchaseId 복구 브릿지는 없다.
 */

import type { Metadata } from "next";
import { getSavedFreeReport } from "@/lib/minds/inner-child/free-report-store";
import { InnerChildEnResultView } from "./InnerChildEnResultView";

export const metadata: Metadata = {
  title: "Your Inner Child · GIBUN",
  robots: { index: false, follow: false },
};

export default async function InnerChildEnResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const blob = await getSavedFreeReport(id);
  return <InnerChildEnResultView leadId={id} blob={blob} />;
}
