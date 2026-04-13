import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";

/**
 * POST /api/self-workshop/generate-summary
 * Step 8: 전체 워크북 데이터를 Gemini가 통합 정리
 *
 * Body: { workshopId }
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const { workshopId } = await req.json();

  const { data: progress } = await supabase
    .from("workshop_progress")
    .select("*")
    .eq("id", workshopId)
    .single();

  if (!progress || progress.user_id !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  // 이미 써머리가 있으면 그대로 반환
  if (progress.summary_cards?.length) {
    return NextResponse.json({ cards: progress.summary_cards });
  }

  const {
    diagnosis_scores,
    mechanism_analysis,
    mechanism_insights,
    coping_plan,
  } = progress;

  const systemPrompt = `당신은 CBT 기반 셀프 워크북의 마지막 단계를 정리하는 심리학자입니다.
사용자가 워크북 전체에서 작성한 내용을 통합 요약하여, 한눈에 볼 수 있는 써머리 카드를 만들어 주세요.

응답은 반드시 아래 JSON 배열 형식으로만 작성하세요:
[
  { "card_type": "summary", "title": "나의 진단 요약", "content": "..." },
  { "card_type": "summary", "title": "나의 순환 패턴", "content": "..." },
  { "card_type": "summary", "title": "나의 대처 계획", "content": "..." },
  { "card_type": "summary", "title": "앞으로의 한 걸음", "content": "..." }
]

각 카드:
1. 진단 요약: 점수, 레벨, 가장 높은 영역 + AI 인사이트 핵심
2. 순환 패턴: 핵심 신념→자동적 사고→행동 순환을 1-2문장으로
3. 대처 계획: 인지 재구조화 + 행동 실험 + 자기 돌봄의 핵심 내용 요약
4. 앞으로의 한 걸음: 격려 + 실천 가능한 제안 1개

어조: 따뜻하고 격려하는 톤, 전문적이되 쉬운 언어
content는 각 100-200자 내외`;

  const aiInsightSummary = mechanism_insights
    ?.map(
      (c: { title: string; content: string }) => `[${c.title}] ${c.content}`
    )
    .join("\n") ?? "없음";

  const userMessage = `## 진단 결과
총점: ${diagnosis_scores?.total}/100, 레벨: ${diagnosis_scores?.level} (${diagnosis_scores?.levelName})
영역별: 자기가치 ${diagnosis_scores?.dimensions?.conditional_self_worth}/25, 과잉추동 ${diagnosis_scores?.dimensions?.compulsive_striving}/25, 실패공포 ${diagnosis_scores?.dimensions?.fear_of_failure}/25, 정서회피 ${diagnosis_scores?.dimensions?.emotional_avoidance}/25

## AI 분석 인사이트
${aiInsightSummary}

## 유저 메커니즘 분석
핵심 신념: ${mechanism_analysis?.my_core_belief ?? "미작성"}
자동적 사고: ${mechanism_analysis?.my_automatic_thoughts ?? "미작성"}
행동: ${mechanism_analysis?.my_behaviors ?? "미작성"}

## 대처 계획
인지 재구조화: 원래 사고 "${coping_plan?.cognitive_restructuring?.original_thought ?? ""}" → 대안 "${coping_plan?.cognitive_restructuring?.alternative_thought ?? ""}"
행동 실험: "${coping_plan?.behavioral_experiment?.experiment_situation ?? ""}"
자기 돌봄: "${coping_plan?.self_compassion?.self_compassion_letter ?? ""}"
경계 설정: "${coping_plan?.self_compassion?.boundary_setting ?? ""}"`;

  try {
    const response = await chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      {
        model: "gemini-2.5-flash",
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: "json_object" },
      }
    );

    const cards = safeJsonParse<
      { card_type: string; title: string; content: string }[]
    >(response);

    // 결과 저장 + Step 8으로 이동
    await supabase
      .from("workshop_progress")
      .update({
        summary_cards: cards,
        current_step: 8,
      })
      .eq("id", workshopId);

    return NextResponse.json({ cards });
  } catch (err) {
    console.error("써머리 생성 실패:", err);
    return NextResponse.json(
      { error: "써머리 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
