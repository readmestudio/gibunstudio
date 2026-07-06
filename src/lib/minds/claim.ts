import { createAdminClient } from "@/lib/supabase/admin";

/**
 * 로그인한 사용자에게 같은 이메일의 익명 /minds 리드를 귀속(claim)한다.
 *
 * claim 라우트(결제 관문)의 이메일 기반 귀속 로직을 재사용 가능한 서버 헬퍼로 뽑은 것.
 * 대시보드·/minds/my 진입 시 호출하면, 결제를 안 한 무료 유저도 로그인만 하면 자기
 * 리포트가 계정에 붙어 대시보드에서 보인다(트리거를 "결제 관문"에서 "로그인"으로 확장).
 *
 *  1) 같은 이메일의 과거 익명 리드(user_id IS NULL)를 내 계정에 귀속.
 *  2) 내 리드들에 달린 결제(minds_relationship_purchases)의 user_id 도 보강.
 *
 * 멱등(idempotent) — 이미 묶인 건은 0행 매칭으로 no-op. RLS admin-only 테이블이라
 * service role(admin) 클라이언트로 수행한다. 신원(userId/email)은 호출부에서 서버
 * 세션으로 확정한 값만 넘길 것.
 *
 * 참고: 이 기기에만 있는 익명 리드(이메일 없이 진행)는 이메일로 못 찾으므로, leadId
 * 기반 귀속은 클라이언트(localStorage)에서 claim 라우트를 호출해 보완한다.
 */
export async function claimMindsLeadsByEmail(
  userId: string,
  email: string | null | undefined
): Promise<void> {
  const mail = (email ?? "").trim().toLowerCase();
  if (!mail) return;

  const admin = createAdminClient();

  // [1] 같은 이메일의 익명 리드 귀속.
  await admin
    .from("minds_leads")
    .update({ user_id: userId })
    .eq("email", mail)
    .is("user_id", null);

  // [2] 내 리드들에 달린 결제의 user_id 보강.
  const { data: myLeads } = await admin
    .from("minds_leads")
    .select("id")
    .eq("user_id", userId);
  const leadIds = (myLeads ?? []).map((l) => l.id as string);
  if (leadIds.length > 0) {
    await admin
      .from("minds_relationship_purchases")
      .update({ user_id: userId })
      .in("lead_id", leadIds)
      .is("user_id", null);
  }
}
