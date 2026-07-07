import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/minds/my-reports  (로그인 필요)
 *
 * 로그인한 사용자에게 귀속(claim)된 /minds 리포트를 한 번에 돌려준다 — 기기/브라우저가
 * 달라도 로그인만 하면 내 무료·유료 리포트를 모두 찾을 수 있게 하는 조회 엔드포인트.
 *
 *  · freeReports  — parts_map 이 채워진 리드(= 무료 분석 완료). /minds/r/[leadId] 로 본다.
 *  · paidReports  — status=confirmed 결제(= 유료 리포트). /minds/relationship/[id] 로 본다.
 *  · latestLeadId — 가장 최근 리드 id(랜딩 자동 복원용).
 *
 * Resp: { freeReports[], paidReports[], latestLeadId } | { error }
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const admin = createAdminClient();

  // 퍼널 분리 — /minds(무파라미터)는 내면 아이 리드를 제외하고, ?product=inner_child 는
  // 반대로 내면 아이 리드만 조회한다. 두 퍼널이 서로의 리드를 자동복원하지 않게 한다.
  const isInnerChild =
    request.nextUrl.searchParams.get("product") === "inner_child";

  let leadQuery = admin
    .from("minds_leads")
    .select("id, created_at, parts_map")
    .eq("user_id", user.id);
  leadQuery = isInnerChild
    ? leadQuery.eq("channel", "inner_child")
    : leadQuery.neq("channel", "inner_child");

  const { data: leads } = await leadQuery.order("created_at", {
    ascending: false,
  });

  const freeReports = (leads ?? [])
    .filter((l) => !!l.parts_map)
    .map((l) => ({ leadId: l.id as string, createdAt: l.created_at as string }));

  const { data: purchases } = await admin
    .from("minds_relationship_purchases")
    .select("id, created_at, paid_at")
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .order("created_at", { ascending: false });

  const paidReports = (purchases ?? []).map((p) => ({
    purchaseId: p.id as string,
    paidAt: (p.paid_at ?? p.created_at) as string,
  }));

  // 자동 복원은 "분석을 마친" 리드 우선, 없으면 최신 리드.
  const latestLeadId =
    freeReports[0]?.leadId ?? (leads?.[0]?.id as string | undefined) ?? null;

  return NextResponse.json({ freeReports, paidReports, latestLeadId });
}
