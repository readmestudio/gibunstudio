/**
 * /minds/relationship/[id] — 유료 "내 마음 속 다섯 가지 배역과 그 관계" 리포트.
 *
 * [id] 는 minds_relationship_purchases 의 결제 레코드 UUID. 결제 직후 이 페이지로
 * 리다이렉트되며, 운영자가 문의 유저에게 전달하는 영구 링크이기도 하다(따로 발송 안 함).
 *
 * 서버에서 결제 상태·캐시된 report_json 을 미리 읽어 넘긴다:
 *  - confirmed + report_json 있음 → 즉시 렌더(재방문·공유 시 대기 0).
 *  - confirmed + report_json 없음 → 클라이언트가 생성 라우트를 호출(최초 1회, ~50초).
 *  - 그 외(미결제/없음) → 클라이언트가 안내.
 */

import type { Metadata } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RelationshipReport } from "@/lib/minds/relationship-report";
import { MindsRelationshipView } from "./MindsRelationshipView";

export const metadata: Metadata = {
  title: "내 마음 속 다섯 가지 배역과 그 관계 · 기분",
  robots: { index: false, follow: false },
};

export default async function MindsRelationshipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let status: string | null = null;
  let initialReport: RelationshipReport | null = null;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("minds_relationship_purchases")
      .select("status, report_json")
      .eq("id", id)
      .maybeSingle();
    if (data) {
      status = data.status;
      initialReport = (data.report_json as RelationshipReport | null) ?? null;
    }
  } catch {
    // 조회 실패 — 클라이언트가 생성 호출로 재시도/안내.
  }

  return (
    <MindsRelationshipView
      purchaseId={id}
      status={status}
      initialReport={initialReport}
    />
  );
}
