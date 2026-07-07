/**
 * /inner-child/r/[id] — 저장된 내면 아이 무료 리포트 다시보기 (로그인 없이, 링크 접근).
 *
 * [id] 는 minds_leads 의 leadId(UUID). 서버에서 admin 으로 parts_map(FreeReportBlob)을
 * 읽어 그대로 렌더하므로 새로고침·북마크·공유 어디서든 같은 결과를 다시 볼 수 있다.
 * 결과가 없으면 클라이언트 뷰가 친절한 안내를 보여주고 저장키를 정리한다.
 */

import type { Metadata } from "next";
import { getSavedFreeReport } from "@/lib/minds/inner-child/free-report-store";
import { InnerChildResultView } from "./InnerChildResultView";

export const metadata: Metadata = {
  title: "내 내면 아이 결과 · 기분",
  robots: { index: false, follow: false },
};

export default async function InnerChildResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const blob = await getSavedFreeReport(id);
  return <InnerChildResultView leadId={id} blob={blob} />;
}
