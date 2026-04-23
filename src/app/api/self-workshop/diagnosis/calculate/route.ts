import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { calculateDiagnosisScores } from "@/lib/self-workshop/diagnosis";

/**
 * POST /api/self-workshop/diagnosis/calculate
 * 진단 20문항 응답 → 점수 계산 → workshop_progress 저장 + Step 3으로 이동
 *
 * Body: { workshopId, answers: { "1": 3, "2": 5, ... } }
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const body = await req.json();
  const { workshopId, answers } = body;

  if (!workshopId || !answers) {
    return NextResponse.json(
      { error: "workshopId와 answers가 필요합니다" },
      { status: 400 }
    );
  }

  // 20문항 모두 응답했는지 확인
  const answerKeys = Object.keys(answers);
  if (answerKeys.length < 20) {
    return NextResponse.json(
      { error: "20문항 모두 응답해야 합니다" },
      { status: 400 }
    );
  }

  // 본인 확인 + 기존 답과 비교하기 위해 diagnosis_answers/current_step 함께 조회
  const { data: progress } = await supabase
    .from("workshop_progress")
    .select("id, user_id, diagnosis_answers, current_step")
    .eq("id", workshopId)
    .single();

  if (!progress || progress.user_id !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  // 점수 계산
  const scores = calculateDiagnosisScores(answers);

  // 기존 답변과 동일한지 확인 — 같으면 current_step을 건드리지 않아
  // 이후 단계(Step 3~8)의 진행도가 유지되도록 함.
  const prevAnswers = progress.diagnosis_answers as Record<string, number> | null;
  const answersUnchanged =
    prevAnswers !== null &&
    Object.keys(prevAnswers).length === Object.keys(answers).length &&
    Object.entries(answers as Record<string, number>).every(
      ([k, v]) => prevAnswers[k] === v
    );

  const updatePayload: Record<string, unknown> = {
    diagnosis_answers: answers,
    diagnosis_scores: scores,
  };

  if (!answersUnchanged) {
    // 답이 바뀌었을 때만 진행도를 2로 되돌려 이후 단계를 재검토하도록.
    // (DB의 mechanism_analysis 등 원본 데이터는 보존되므로 Step 3~로 진행하면 다시 볼 수 있음)
    updatePayload.current_step = 2;
  }

  const { error } = await supabase
    .from("workshop_progress")
    .update(updatePayload)
    .eq("id", workshopId);

  if (error) {
    return NextResponse.json(
      { error: "저장에 실패했습니다" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    scores,
    answersUnchanged,
    previousStep: progress.current_step ?? null,
  });
}
