import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";

/**
 * POST /api/self-workshop/analyze-mechanism
 * Step 5: Gemini가 진단 결과(Step 2)와 유저 작성(Step 4)을 교차검증 분석
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

  // 워크북 데이터 조회
  const { data: progress } = await supabase
    .from("workshop_progress")
    .select("*")
    .eq("id", workshopId)
    .single();

  if (!progress || progress.user_id !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  // 이미 분석 결과가 있으면 그대로 반환
  if (progress.mechanism_insights?.length) {
    return NextResponse.json({ cards: progress.mechanism_insights });
  }

  const { diagnosis_scores, mechanism_analysis } = progress;

  if (!diagnosis_scores || !mechanism_analysis) {
    return NextResponse.json(
      { error: "진단 결과와 메커니즘 분석이 필요합니다" },
      { status: 400 }
    );
  }

  // Gemini 프롬프트
  const systemPrompt = `당신은 CBT(인지행동치료) 전문 심리학자입니다.
사용자가 Dennis Greenberger의 'Mind Over Mood' 프로토콜에 따라 점진적으로 수집한 "성취 중독 진단 결과"와 "상황-자동사고-감정-핵심신념 자료"를 교차검증하여 개인화된 인사이트를 제공합니다.

응답은 반드시 아래 JSON 배열 형식으로만 작성하세요:
[
  { "card_type": "pattern_summary", "title": "...", "content": "..." },
  { "card_type": "cross_validation", "title": "...", "content": "..." },
  { "card_type": "hidden_pattern", "title": "...", "content": "..." },
  { "card_type": "key_question", "title": "...", "content": "..." }
]

각 카드 설명:
1. pattern_summary: **유저가 직접 적어내지 못한 성취 중독 순환 고리**를 유저의 재료(상황→자동사고→감정→핵심신념)를 엮어 한 문장으로 짚어준다. 유저가 스스로 "아, 내가 이런 흐름이구나" 알아차릴 수 있도록 구체적 인용 포함. (예: "월말 평가 때 '부족해'라는 자동 사고 → 불안 → 주말 과몰두로 이어지는 순환")
2. cross_validation: 진단 점수와 유저 자기 기술의 일치/불일치 분석. 구체적 숫자와 인용 포함
3. hidden_pattern: 유저가 인식하지 못했을 수 있는 연결고리. 인지적 오류(이분법적 사고, 과잉 일반화, 당위적 사고, 감정적 추론, 독심술, 파국화) 중 해당하는 것을 명시
4. key_question: 다음 단계(대처법)로의 연결 질문. 성찰적이고 열린 질문

어조: 따뜻하지만 전문적, 비판하지 않고 호기심을 자극하는 방식
content는 각 150-300자 내외로 작성`;

  const cb = mechanism_analysis.core_beliefs ?? {};
  const checked: string[] =
    mechanism_analysis.common_thoughts_checked ?? [];
  const checkedText =
    checked.length > 0 ? checked.map((t: string) => `"${t}"`).join(", ") : "없음";
  const eb = mechanism_analysis.emotions_body ?? {};

  const userMessage = `## 진단 결과 (리커트 5점 척도 20문항)
- 총점: ${diagnosis_scores.total}/100
- 레벨: ${diagnosis_scores.level} (${diagnosis_scores.levelName})
- 영역별 점수:
  - 자기 가치의 조건화: ${diagnosis_scores.dimensions.conditional_self_worth}/25
  - 과잉 추동: ${diagnosis_scores.dimensions.compulsive_striving}/25
  - 실패 공포/완벽주의: ${diagnosis_scores.dimensions.fear_of_failure}/25
  - 정서적 회피: ${diagnosis_scores.dimensions.emotional_avoidance}/25

## 유저가 수집한 재료 (Mind Over Mood 흐름)
- 최근 불편했던 상황: ${mechanism_analysis.recent_situation ?? "미작성"}
- 그때 자동으로 떠오른 생각: ${mechanism_analysis.automatic_thought ?? "미작성"}
- 최근에 자주 한 생각(체크리스트): ${checkedText}
- 이 생각이 주로 드는 맥락: ${mechanism_analysis.trigger_context ?? "미작성"}
- 감정: ${eb.emotions?.join(", ") ?? "없음"}
- 신체 반응: ${eb.body_text ?? "미작성"}
- 핵심 신념 — 나에 대해: ${cb.about_self ?? "미작성"}
- 핵심 신념 — 남에 대해: ${cb.about_others ?? "미작성"}
- 핵심 신념 — 세상에 대해: ${cb.about_world ?? "미작성"}`;

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

    // 결과 저장 + Step 5으로 이동
    await supabase
      .from("workshop_progress")
      .update({
        mechanism_insights: cards,
        current_step: 5,
      })
      .eq("id", workshopId);

    return NextResponse.json({ cards });
  } catch (err) {
    console.error("Gemini 분석 실패:", err);
    return NextResponse.json(
      { error: "AI 분석에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
