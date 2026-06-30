import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * POST /api/minds/lead/claim  (로그인 필요)
 *
 * 비로그인으로 진행한 /minds 리드(minds_leads)를 방금 로그인/가입한 계정에 귀속(claim)한다.
 * "무료 리포트 후 결제 직전 로그인" 관문에서 로그인 직후 호출 → 이후 결제·리포트가 user_id 에
 * 묶이고, 기기/브라우저가 달라도 로그인하면 내 리포트를 다시 찾을 수 있다.
 *
 *  1) body.leadId(이 브라우저의 리드)를 user_id 에 바인딩.
 *     - 이미 "다른 사람" 소유면 거부(남의 기록 탈취 방지).
 *  2) 같은 이메일의 과거 익명 리드(user_id IS NULL)도 함께 귀속(기기/세션 통합).
 *  3) 그 리드들에 달린 결제(minds_relationship_purchases)의 user_id 도 보강.
 *
 * 신원은 클라이언트 값이 아니라 서버 세션에서 확정한다(위조 방지). RLS admin-only 테이블이라
 * 바인딩은 service role(admin) 클라이언트로 수행한다.
 *
 * Body: { leadId?: string }
 * Resp: { ok: true, claimedLeadId } | { error }
 */
export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, RATE_LIMITS.general);
  if (limited) return limited;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const leadId = typeof body?.leadId === "string" ? body.leadId.trim() : "";
  const email = (user.email ?? "").trim().toLowerCase();

  const admin = createAdminClient();

  // [1] 이 브라우저의 리드를 내 계정에 바인딩.
  let claimedLeadId: string | null = null;
  if (leadId) {
    const { data: lead } = await admin
      .from("minds_leads")
      .select("id, user_id")
      .eq("id", leadId)
      .maybeSingle();

    if (lead) {
      // 이미 다른 계정 소유면 거부 — 남의 기록을 가져가지 못하게.
      if (lead.user_id && lead.user_id !== user.id) {
        return NextResponse.json(
          { error: "이미 다른 계정에 연결된 기록이에요." },
          { status: 403 }
        );
      }
      if (!lead.user_id) {
        await admin
          .from("minds_leads")
          .update({ user_id: user.id })
          .eq("id", leadId)
          .is("user_id", null); // 경합 방지 — 아직 비어 있을 때만.
      }
      claimedLeadId = lead.id;
    }
  }

  // [2] 같은 이메일의 과거 익명 리드도 함께 귀속(기기/세션이 달랐던 과거 기록 통합).
  if (email) {
    await admin
      .from("minds_leads")
      .update({ user_id: user.id })
      .eq("email", email)
      .is("user_id", null);
  }

  // [3] 내 리드들에 달린 결제의 user_id 보강(비로그인으로 결제했던 과거 건 포함).
  const { data: myLeads } = await admin
    .from("minds_leads")
    .select("id")
    .eq("user_id", user.id);
  const leadIds = (myLeads ?? []).map((l) => l.id as string);
  if (leadIds.length > 0) {
    await admin
      .from("minds_relationship_purchases")
      .update({ user_id: user.id })
      .in("lead_id", leadIds)
      .is("user_id", null);
  }

  return NextResponse.json({ ok: true, claimedLeadId });
}
