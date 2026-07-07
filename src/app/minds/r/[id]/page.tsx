/**
 * /minds/r/[id] — 저장된 마음 배역 결과 다시보기 (로그인 없이, 링크로 접근).
 *
 * [id] 는 minds_leads 의 leadId(UUID). 서버에서 저장본을 읽어 그대로 렌더하므로
 * 새로고침·북마크·공유 링크 어디서든 같은 결과를 다시 볼 수 있다. 결과가 없으면
 * 클라이언트 뷰가 친절한 안내를 보여준다.
 */

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
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

  // 퍼널 교차 가드 — 내면 아이 블롭(test_version="v2.0")이 이 URL 로 들어오면
  // 다섯 배역 뷰로 렌더하지 않고 내면 아이 결과 페이지로 보낸다. 기존 PartsMap 은
  // test_version 이 없으므로 이 분기를 타지 않는다(무영향).
  // 주의: redirect() 는 제어용 예외를 던지므로 try/catch 밖에서 호출한다.
  let isInnerChildBlob = false;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("minds_leads")
      .select("parts_map")
      .eq("id", id)
      .maybeSingle();
    const pm = data?.parts_map as { test_version?: string } | null;
    isInnerChildBlob = pm?.test_version === "v2.0";
  } catch {
    // 조회 실패는 무시하고 기존 흐름(getSavedPartsMap)로 진행한다.
  }
  if (isInnerChildBlob) {
    redirect(`/inner-child/r/${id}`);
  }

  const partsMap = await getSavedPartsMap(id);
  return <MindsResultView leadId={id} partsMap={partsMap} />;
}
