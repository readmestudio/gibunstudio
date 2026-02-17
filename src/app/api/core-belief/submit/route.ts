import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { CORE_BELIEF_SENTENCES } from "@/lib/missions/core-belief";

export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { answers } = await request.json();

    if (!answers || typeof answers !== "object") {
      return NextResponse.json(
        { error: "답변 데이터가 올바르지 않습니다." },
        { status: 400 }
      );
    }

    /* 모든 문항에 답변했는지 검증 */
    const total = CORE_BELIEF_SENTENCES.length;
    for (let i = 0; i < total; i++) {
      const answer = answers[String(i)] ?? answers[i];
      if (!answer || String(answer).trim().length === 0) {
        return NextResponse.json(
          { error: `${i + 1}번 문항의 답변이 비어 있습니다.` },
          { status: 400 }
        );
      }
    }

    /* DB 저장 */
    const { data: submission, error: insertError } = await supabase
      .from("core_belief_submissions")
      .insert({
        user_id: user.id,
        answers,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("핵심 신념 검사 저장 실패:", insertError);
      return NextResponse.json(
        { error: "답변 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      submission_id: submission.id,
    });
  } catch (error: unknown) {
    console.error("핵심 신념 검사 제출 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
