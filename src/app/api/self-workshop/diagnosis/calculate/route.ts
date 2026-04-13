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

  // 본인 확인
  const { data: progress } = await supabase
    .from("workshop_progress")
    .select("id, user_id")
    .eq("id", workshopId)
    .single();

  if (!progress || progress.user_id !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  // 점수 계산
  const scores = calculateDiagnosisScores(answers);

  // 저장 + Step 3으로 이동
  const { error } = await supabase
    .from("workshop_progress")
    .update({
      diagnosis_answers: answers,
      diagnosis_scores: scores,
      current_step: 2,
    })
    .eq("id", workshopId);

  if (error) {
    return NextResponse.json(
      { error: "저장에 실패했습니다" },
      { status: 500 }
    );
  }

  return NextResponse.json({ scores });
}
