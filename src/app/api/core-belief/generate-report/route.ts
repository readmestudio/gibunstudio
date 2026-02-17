import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import { CORE_BELIEF_SENTENCES } from "@/lib/missions/core-belief";

/**
 * 핵심 신념 분석 리포트 생성 API
 *
 * 사용자의 문장완성 25문항 답변을 기반으로
 * AI가 핵심 신념(자기/타인/세상)을 분석하여 리포트를 생성한다.
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request, RATE_LIMITS.ai);
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

    const { submission_id } = await request.json();

    if (!submission_id) {
      return NextResponse.json(
        { error: "submission_id가 필요합니다." },
        { status: 400 }
      );
    }

    /* 검사 답변 조회 */
    const { data: submission, error: fetchError } = await supabase
      .from("core_belief_submissions")
      .select("id, answers, user_id")
      .eq("id", submission_id)
      .single();

    if (fetchError || !submission) {
      return NextResponse.json(
        { error: "검사 결과를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (submission.user_id !== user.id) {
      return NextResponse.json(
        { error: "권한이 없습니다." },
        { status: 403 }
      );
    }

    /* 이미 생성된 리포트가 있는지 확인 */
    const { data: existingReport } = await supabase
      .from("core_belief_reports")
      .select("id")
      .eq("submission_id", submission_id)
      .maybeSingle();

    if (existingReport) {
      return NextResponse.json({
        success: true,
        report_id: existingReport.id,
        message: "이미 생성된 리포트가 있습니다.",
      });
    }

    /* 답변 텍스트 구성 */
    const answers = submission.answers as Record<string, string>;
    const answersText = CORE_BELIEF_SENTENCES.map(
      (sentence, i) =>
        `${i + 1}. "${sentence}" → "${answers[String(i)] || answers[i] || ""}"`
    ).join("\n");

    /* AI 리포트 생성 */
    const reportJson = await generateReport(answersText);

    /* DB 저장 */
    const { data: report, error: insertError } = await supabase
      .from("core_belief_reports")
      .insert({
        submission_id,
        user_id: user.id,
        report: reportJson,
        payment_status: "pending",
        payment_amount: 19900,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("리포트 저장 실패:", insertError);
      return NextResponse.json(
        { error: "리포트 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      report_id: report.id,
    });
  } catch (error: unknown) {
    console.error("리포트 생성 오류:", error);
    return NextResponse.json(
      { error: "리포트 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * Gemini를 사용하여 핵심 신념 분석 리포트 생성
 */
async function generateReport(answersText: string) {
  const systemPrompt = `당신은 임상심리학 전문가이자 인지행동치료(CBT) 전문가입니다.
사용자의 문장완성 검사(Sentence Completion Test) 답변을 분석하여
무의식 속 핵심 신념(Core Beliefs)을 탐색합니다.

분석 시 주의사항:
- 단정적 진단이 아닌 탐색적 분석 톤을 유지하세요
- 부정적 신념도 비난하지 않고 공감하며 리프레이밍하세요
- 한국어로 작성하되, 심리학 용어는 적절히 포함하세요
- 각 섹션은 300~500자 분량으로 작성하세요`;

  const userPrompt = `아래는 사용자의 문장완성 검사 25문항 답변입니다.

${answersText}

위 답변을 분석하여 아래 JSON 형식으로 핵심 신념 분석 리포트를 작성해 주세요.

{
  "selfBelief": {
    "title": "나에 대한 핵심 신념",
    "core_belief": "핵심 신념을 한 문장으로 요약 (예: '나는 충분히 괜찮은 사람이지만, 완벽하지 않으면 사랑받을 수 없다고 느낀다')",
    "analysis": "자기 자신에 대한 무의식적 믿음 분석 (근거가 되는 답변 인용 포함)",
    "pattern": "반복되는 패턴이나 자동적 사고 설명",
    "reframe": "긍정적 리프레이밍 또는 대안적 관점 제시"
  },
  "othersBelief": {
    "title": "타인에 대한 핵심 신념",
    "core_belief": "핵심 신념을 한 문장으로 요약",
    "analysis": "타인(친구, 가족, 이성 등)에 대한 무의식적 믿음 분석",
    "pattern": "대인관계에서 반복되는 패턴 설명",
    "reframe": "긍정적 리프레이밍 또는 대안적 관점 제시"
  },
  "worldBelief": {
    "title": "세상에 대한 핵심 신념",
    "core_belief": "핵심 신념을 한 문장으로 요약",
    "analysis": "세상, 미래, 운명 등에 대한 무의식적 믿음 분석",
    "pattern": "삶을 대하는 태도에서 반복되는 패턴 설명",
    "reframe": "긍정적 리프레이밍 또는 대안적 관점 제시"
  },
  "summary": {
    "title": "종합 분석",
    "overview": "세 가지 핵심 신념의 상호 관계 및 전체적인 심리 패턴 분석",
    "strengths": "답변에서 드러나는 내면의 강점 2~3가지",
    "growth_direction": "성장을 위한 구체적인 방향 제시 (실천 가능한 것 위주)"
  }
}`;

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    {
      model: "gemini-2.5-pro",
      temperature: 0.7,
      max_tokens: 16384,
      response_format: { type: "json_object" },
    }
  );

  return safeJsonParse(response);
}
