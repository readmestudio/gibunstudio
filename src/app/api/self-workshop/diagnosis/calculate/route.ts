import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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

  // 답이 바뀌었을 때는 step 2로 다운그레이드해 이후 단계를 재검토하도록.
  // 답이 그대로면 기존 진행도 유지하되, 최소한 step 2(진단 리포트)는 보장.
  // (이렇게 하지 않으면 current_step이 1로 남은 사용자가 step 2에서 redirect됨)
  const baseStep = !answersUnchanged ? 2 : (progress.current_step ?? 1);
  updatePayload.current_step = Math.max(2, baseStep);

  // admin client로 update — RLS와 무관하게 current_step까지 확실히 갱신.
  // (본인 확인은 위에서 progress.user_id === user.id로 이미 끝냄)
  const admin = createAdminClient();
  const { error } = await admin
    .from("workshop_progress")
    .update(updatePayload)
    .eq("id", workshopId);

  if (error) {
    return NextResponse.json(
      { error: "저장에 실패했습니다" },
      { status: 500 }
    );
  }

  // 서버 캐시 무효화 — diagnosis_scores 갱신을 step/2 페이지가 반드시 새로 읽도록
  revalidatePath("/dashboard/self-workshop/step/2");
  revalidatePath("/dashboard/self-workshop");

  return NextResponse.json({
    scores,
    answersUnchanged,
    previousStep: progress.current_step ?? null,
  });
}
