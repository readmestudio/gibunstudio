/**
 * Mind Spill — 워크북 PATCH 자동 저장.
 * 생성(POST)은 더 이상 직접 호출하지 않음 (서버 페이지가 처리).
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { WorkbookPatch } from "@/lib/mind-spill/types";

const ALLOWED_FIELDS = new Set<keyof WorkbookPatch>([
  "weekly_scan",
  "brain_dump",
  "classification",
  "released",
  "actions",
  "moments",
  "current_step",
  "status",
  "week_label",
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
  const patch = body?.patch as WorkbookPatch | undefined;
  if (typeof id !== "string" || !patch || typeof patch !== "object") {
    return NextResponse.json(
      { error: "id/patch 가 필요합니다" },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("mind_spill_workbooks")
    .select("id, user_id, current_step")
    .eq("id", id)
    .maybeSingle();
  if (!existing || existing.user_id !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const update: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (!ALLOWED_FIELDS.has(k as keyof WorkbookPatch)) continue;
    update[k] = v;
  }

  if (patch.current_step !== undefined) {
    const next = patch.current_step;
    if (typeof next !== "number" || next < 1 || next > 3) {
      return NextResponse.json(
        { error: "current_step 값 오류" },
        { status: 400 }
      );
    }
    update.current_step = Math.max(existing.current_step ?? 1, next);
  }

  if (patch.status === "completed") {
    update.status = "completed";
    update.completed_at = new Date().toISOString();
  }

  if (patch.week_label === null) {
    update.week_label = null;
  } else if (typeof patch.week_label === "string") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(patch.week_label)) {
      return NextResponse.json(
        { error: "week_label 형식 오류" },
        { status: 400 }
      );
    }
    update.week_label = patch.week_label;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ success: true, noop: true });
  }

  const { error } = await supabase
    .from("mind_spill_workbooks")
    .update(update)
    .eq("id", id);
  if (error) {
    return NextResponse.json({ error: "저장에 실패했습니다" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
