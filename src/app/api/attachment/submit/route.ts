import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  ATTACHMENT_QUESTIONS,
  calculateAttachmentScores,
} from "@/lib/self-hacking/attachment-questions";

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

    /* 모든 문항에 1~5 범위 답변 검증 */
    for (const q of ATTACHMENT_QUESTIONS) {
      const answer = answers[q.id] ?? answers[String(q.id)];
      if (answer === undefined || answer === null) {
        return NextResponse.json(
          { error: `${q.id}번 문항의 답변이 비어 있습니다.` },
          { status: 400 }
        );
      }
      const num = Number(answer);
      if (!Number.isInteger(num) || num < 1 || num > 5) {
        return NextResponse.json(
          { error: `${q.id}번 문항의 답변이 올바르지 않습니다. (1~5)` },
          { status: 400 }
        );
      }
    }

    /* 채점 */
    const numericAnswers: Record<number, number> = {};
    for (const q of ATTACHMENT_QUESTIONS) {
      numericAnswers[q.id] = Number(answers[q.id] ?? answers[String(q.id)]);
    }
    const scores = calculateAttachmentScores(numericAnswers);

    /* DB 저장 */
    const { data: submission, error: insertError } = await supabase
      .from("attachment_submissions")
      .insert({
        user_id: user.id,
        answers: numericAnswers,
        scores,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("애착 검사 저장 실패:", insertError);
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
    console.error("애착 검사 제출 오류:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
