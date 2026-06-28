/**
 * /minds/r/[id] — 저장된 마음 배역 결과 다시보기 (로그인 없이, 링크로 접근).
 *
 * [id] 는 minds_leads 의 leadId(UUID). 서버에서 저장본을 읽어 그대로 렌더하므로
 * 새로고침·북마크·공유 링크 어디서든 같은 결과를 다시 볼 수 있다. 결과가 없으면
 * 클라이언트 뷰가 친절한 안내를 보여준다.
 */

import type { Metadata } from "next";
import { getSavedPartsMap } from "@/lib/minds/result-store";
import { MindsResultView } from "./MindsResultView";

export const metadata: Metadata = {
  title: "내 마음 배역 결과 · 기분",
  robots: { index: false, follow: false },
};

export default async function MindsResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const partsMap = await getSavedPartsMap(id);
  return <MindsResultView leadId={id} partsMap={partsMap} />;
}
