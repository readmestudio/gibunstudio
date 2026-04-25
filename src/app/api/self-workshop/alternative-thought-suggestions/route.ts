import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";

/**
 * POST /api/self-workshop/alternative-thought-suggestions
 *
 * DESTROY · 2단계 (대안 자동사고 시뮬레이션)에서 사용자가 막혔을 때
 * 같은 상황에 대한 다른 자동사고 후보 2~3개를 제안.
 *
 * Body: { situation: string, original_automatic_thought: string }
 * Resp: { suggestions: string[] }
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
  const situation = typeof body?.situation === "string" ? body.situation.trim() : "";
  const originalThought =
    typeof body?.original_automatic_thought === "string"
      ? body.original_automatic_thought.trim()
      : "";

  if (!situation || !originalThought) {
    return NextResponse.json(
      { error: "상황과 기존 자동사고가 필요합니다" },
      { status: 400 },
    );
  }

  try {
    const suggestions = await runGenerateAlternatives(situation, originalThought);
    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error("alternative-thought-suggestions 실패:", err);
    return NextResponse.json(
      { error: "AI 처리에 실패했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}

async function runGenerateAlternatives(
  situation: string,
  originalThought: string,
): Promise<string[]> {
  const systemPrompt = `당신은 CBT 전문 심리학자입니다. 직장인 3~15년차 페르소나의 워크북 사용자가 같은 상황을 다르게 해석하는 연습을 돕고 있어요.

## 작업
유저가 어떤 상황에서 한 가지 자동사고를 떠올렸어요. **같은 상황을 다르게 해석할 수 있는 대안 자동사고 3개**를 제안하세요.

## 규칙
- 기존 사고와 **반대 결의 해석**을 1개, **중립적 해석**을 1개, **연민/맥락 기반 해석**을 1개로 다양하게 뽑으세요.
- 비현실적인 긍정("다 잘 될 거야") 금지. 현실에서 충분히 가능한 다른 해석.
- 각 사고는 1인칭 내면의 목소리, 12~30자.
- 임상 용어 금지, 일상적인 한국어 말투.

## 응답 형식
반드시 아래 JSON 단일 객체로 응답하세요.
{ "suggestions": ["대안 사고 1", "대안 사고 2", "대안 사고 3"] }
JSON 외 텍스트 절대 포함 금지.`;

  const userMessage = `## 상황
"${situation}"

## 유저의 기존 자동사고
"${originalThought}"

위 상황에 대해 유저가 떠올릴 수 있는 다른 해석 3개를 JSON으로 응답하세요.`;

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    {
      model: "gemini-2.5-flash",
      temperature: 0.7,
      max_tokens: 512,
      response_format: { type: "json_object" },
    },
  );

  const parsed = safeJsonParse<{ suggestions: string[] }>(response);
  const cleaned = (parsed?.suggestions ?? [])
    .filter((s) => typeof s === "string" && s.trim().length > 0)
    .map((s) => s.trim())
    .slice(0, 3);

  if (cleaned.length === 0) {
    throw new Error("LLM이 유효한 후보를 반환하지 않았습니다");
  }

  return cleaned;
}
