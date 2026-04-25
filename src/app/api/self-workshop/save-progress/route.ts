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

  if (!workshopId) {
    return NextResponse.json(
      { error: "workshopId가 필요합니다" },
      { status: 400 }
    );
  }

  // field만 화이트리스트로 제한 — 존재하지 않는 컬럼으로의 UPDATE는 Supabase 500.
  // step 이동/완료 처리만 하는 호출(field 없음)도 허용.
  const ALLOWED_FIELDS = new Set([
    "diagnosis_answers",
    "diagnosis_scores",
    "mechanism_analysis",
    "mechanism_insights",
    "core_belief_excavation",
    "belief_destroy",
    "alternative_thought_simulation",
    "new_belief",
    "coping_plan",
    "summary_cards",
    "reflections",
  ]);

  if (field !== undefined && !ALLOWED_FIELDS.has(field)) {
    return NextResponse.json(
      { error: `알 수 없는 field: ${field}` },
      { status: 400 }
    );
  }

  if (field === undefined && advanceStep === undefined && !complete) {
    return NextResponse.json(
      { error: "저장할 내용이 없습니다" },
      { status: 400 }
    );
  }

  // 본인 확인 (current_step도 함께 읽어 advanceStep을 monotonic하게 처리)
  const { data: progress } = await supabase
    .from("workshop_progress")
    .select("id, user_id, current_step")
    .eq("id", workshopId)
    .single();

  if (!progress || progress.user_id !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  // 업데이트 객체 구성
  const updateObj: Record<string, unknown> = {};

  if (field !== undefined) {
    updateObj[field] = data;
  }

  if (advanceStep) {
    // 이미 뒤쪽 단계에 있는 사용자가 앞 단계에서 "다음"을 눌러도
    // 진행도가 뒤로 밀리지 않도록 기존 값과 max 비교.
    const nextStep = Math.max(progress.current_step ?? 1, advanceStep);
    updateObj.current_step = nextStep;
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
