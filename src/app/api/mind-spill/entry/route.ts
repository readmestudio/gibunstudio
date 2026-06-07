/**
 * Mind Spill Daily Entry CRUD.
 *
 *   PATCH { id, patch } — daily_scan / brain_dump / moments 부분 업데이트.
 *
 * 생성(POST)은 서버 페이지가 entry-date 기반으로 자동 처리하므로 별도 라우트 없음.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { DailyEntryPatch } from "@/lib/mind-spill/types";

const ALLOWED_FIELDS = new Set<keyof DailyEntryPatch>([
  "daily_scan",
  "brain_dump",
  "classification",
  "released",
  "actions",
  "moments",
]);

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const id = body?.id;
  const patch = body?.patch as DailyEntryPatch | undefined;
  if (typeof id !== "string" || !patch || typeof patch !== "object") {
    return NextResponse.json(
      { error: "id/patch 가 필요합니다" },
      { status: 400 }
    );
  }

  // 소유권 검증 — RLS도 막아주지만 명시적으로 확인해서 403 응답.
  const { data: existing } = await supabase
    .from("mind_spill_daily_entries")
    .select("id, user_id")
    .eq("id", id)
    .maybeSingle();
  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (!ALLOWED_FIELDS.has(k as keyof DailyEntryPatch)) continue;
    update[k] = v;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ success: true, noop: true });
  }

  const { error } = await supabase
    .from("mind_spill_daily_entries")
    .update(update)
    .eq("id", id);
  if (error) {
    console.error("[mind-spill] entry PATCH 실패:", error);
    return NextResponse.json({ error: "저장에 실패했습니다" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
