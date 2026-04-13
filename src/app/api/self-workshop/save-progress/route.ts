import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * PATCH /api/self-workshop/save-progress
 * 워크북 단계별 자동 저장 + step 이동
 *
 * Body: { workshopId, field, data, advanceStep?, complete? }
 */
export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const body = await req.json();
  const { workshopId, field, data, advanceStep, complete } = body;

  if (!workshopId || !field) {
    return NextResponse.json(
      { error: "workshopId와 field가 필요합니다" },
      { status: 400 }
    );
  }

  // 본인 확인
  const { data: progress } = await supabase
    .from("workshop_progress")
    .select("id, user_id")
    .eq("id", workshopId)
    .single();

  if (!progress || progress.user_id !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  // 업데이트 객체 구성
  const updateObj: Record<string, unknown> = {
    [field]: data,
  };

  if (advanceStep) {
    updateObj.current_step = advanceStep;
  }

  if (complete) {
    updateObj.status = "completed";
    updateObj.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("workshop_progress")
    .update(updateObj)
    .eq("id", workshopId);

  if (error) {
    return NextResponse.json(
      { error: "저장에 실패했습니다" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
