import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin/auth";

/**
 * POST /api/admin/workshop-survey/deliver
 *
 * 관리자가 특정 설문 응답에 "맞춤 워크북 링크"를 저장(=전달/공개)하거나 해제한다.
 * - workbookUrl 있음 → workbook_url 저장 + released_at=now + status='delivered'
 * - workbookUrl 빈값 → 전달 취소(workbook_url/released_at NULL + status='submitted')
 *
 * Body: { id: string, workbookUrl?: string }
 * Resp: { ok: true, workbookUrl, releasedAt } | { error }
 */
export async function POST(req: NextRequest) {
  // 관리자 권한 확인 — 세션에서 이메일 확정.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청 형식입니다." },
      { status: 400 }
    );
  }
  const b = (body ?? {}) as Record<string, unknown>;

  const id = typeof b.id === "string" ? b.id : "";
  const url = typeof b.workbookUrl === "string" ? b.workbookUrl.trim() : "";
  if (!id) {
    return NextResponse.json({ error: "대상이 없어요." }, { status: 400 });
  }

  // 링크가 있으면 http(s) 형식만 허용.
  if (url && !/^https?:\/\//i.test(url)) {
    return NextResponse.json(
      { error: "http:// 또는 https:// 로 시작하는 링크를 넣어주세요." },
      { status: 400 }
    );
  }

  const releasedAt = url ? new Date().toISOString() : null;

  const admin = createAdminClient();
  const { error } = await admin
    .from("workshop_survey_responses")
    .update({
      workbook_url: url || null,
      released_at: releasedAt,
      status: url ? "delivered" : "submitted",
    })
    .eq("id", id);

  if (error) {
    console.error("[admin/workshop-survey/deliver] update 실패:", error);
    return NextResponse.json({ error: "저장에 실패했어요." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, workbookUrl: url || null, releasedAt });
}
