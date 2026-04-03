import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import {
  ATTACHMENT_QUESTIONS,
  ATTACHMENT_STYLE_NAMES,
  type AttachmentScores,
} from "@/lib/self-hacking/attachment-questions";

/**
 * 연애 애착 분석 AI 리포트 생성 API
 *
 * ECR-R 24문항 답변 + 채점 결과를 기반으로
 * 전문 상담사 수준의 6섹션 심층 리포트를 생성한다.
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
      .from("attachment_submissions")
      .select("id, answers, scores, user_id")
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

    /* 이미 생성된 리포트 확인 */
    const { data: existingReport } = await supabase
      .from("attachment_reports")
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
    const answers = submission.answers as Record<string, number>;
    const scores = submission.scores as AttachmentScores;

    const answersText = ATTACHMENT_QUESTIONS.map(
      (q) =>
        `${q.id}. [${q.dimension === "anxiety" ? "불안" : "회피"}] "${q.text}" → ${answers[String(q.id)] ?? answers[q.id]}점`
    ).join("\n");

    /* AI 리포트 생성 */
    const reportJson = await generateReport(answersText, scores);

    /* DB 저장 */
    const { data: report, error: insertError } = await supabase
      .from("attachment_reports")
      .insert({
        submission_id,
        user_id: user.id,
        report: reportJson,
        payment_status: "pending",
        payment_amount: 14900,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("애착 리포트 저장 실패:", insertError);
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
    console.error("애착 리포트 생성 오류:", error);
    return NextResponse.json(
      { error: "리포트 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

/**
 * Gemini를 사용하여 연애 애착 분석 리포트 생성
 */
async function generateReport(answersText: string, scores: AttachmentScores) {
  const styleName = ATTACHMENT_STYLE_NAMES[scores.style];

  const systemPrompt = `당신은 애착 이론(Attachment Theory) 전문가이자 임상심리 상담사입니다.
John Bowlby와 Mary Ainsworth의 애착 이론, 그리고 Bartholomew & Horowitz의 성인 애착 4유형 모델에 기반하여 분석합니다.

분석 시 주의사항:
- 전문 상담사처럼 따뜻하면서도 정확한 톤을 유지하세요
- 단정적 진단이 아닌 탐색적 분석 톤을 사용하세요
- 부정적 패턴도 비난하지 않고, 이해와 공감의 관점에서 설명하세요
- 구체적이고 실천 가능한 조언을 제시하세요
- 한국어로 작성하되, 필요한 심리학 용어는 적절히 포함하세요
- 각 섹션은 풍부하고 깊이 있게 작성하세요 (300~600자)`;

  const userPrompt = `아래는 ECR-R(친밀 관계 경험 척도) 24문항에 대한 사용자의 답변입니다.
(1=전혀 아니다 ~ 5=매우 그렇다)

${answersText}

채점 결과:
- 관계 불안 점수: ${scores.anxiety} / 5.0
- 친밀감 회피 점수: ${scores.avoidance} / 5.0
- 판정된 애착 유형: ${styleName}

위 답변과 채점 결과를 분석하여 아래 JSON 형식으로 심층 리포트를 작성해 주세요.

{
  "attachmentStyle": {
    "type": "${scores.style}",
    "typeName": "${styleName}",
    "summary": "이 사람의 애착 유형에 대한 전체적 설명. 어떤 관계 패턴을 보이는지, 왜 이런 유형이 형성되었을 가능성이 있는지 포괄적으로 서술 (400~600자)"
  },
  "anxietyAnalysis": {
    "title": "관계 불안 분석",
    "score": ${scores.anxiety},
    "interpretation": "불안 점수의 의미와 해석. 이 수준의 불안이 실제 관계에서 어떻게 경험되는지 (300~400자)",
    "behavioral_patterns": "높은/낮은 불안이 실제 연애에서 나타나는 구체적 행동 패턴 3~4가지 (300~400자)",
    "origin": "이 불안 패턴이 형성된 가능한 발달적 배경. 초기 양육 경험이나 과거 관계 경험과의 연결 (200~300자)"
  },
  "avoidanceAnalysis": {
    "title": "친밀감 회피 분석",
    "score": ${scores.avoidance},
    "interpretation": "회피 점수의 의미와 해석 (300~400자)",
    "behavioral_patterns": "실제 연애에서 나타나는 회피 행동 패턴 3~4가지 (300~400자)",
    "origin": "회피 패턴의 발달적 배경 (200~300자)"
  },
  "relationshipPatterns": {
    "title": "연애 관계 패턴",
    "attraction": "어떤 유형의 파트너에게 끌리는 경향이 있는지, 그 심리적 이유 (200~300자)",
    "conflict": "갈등 상황에서의 전형적인 반응 패턴과 그 이면의 심리 (200~300자)",
    "needs": "관계에서 충족되지 못하는 핵심 욕구와 그것이 관계에 미치는 영향 (200~300자)"
  },
  "growthGuide": {
    "title": "성장 가이드",
    "awareness": "지금 바로 인식하고 관찰할 수 있는 자신의 패턴들 (200~300자)",
    "practices": "일상과 관계에서 실천할 수 있는 구체적 방법 3~4가지. 각각 왜 도움이 되는지 설명 포함 (400~500자)",
    "ideal_partner": "이 애착 유형이 건강하게 성장할 수 있는 파트너 유형과 관계 방식 제안 (200~300자)"
  },
  "professionalNote": {
    "title": "상담사의 한마디",
    "message": "따뜻하고 전문적인 마무리 메시지. 이 사람의 강점을 인정하고, 변화의 가능성에 대한 희망적 메시지 (200~300자)"
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
