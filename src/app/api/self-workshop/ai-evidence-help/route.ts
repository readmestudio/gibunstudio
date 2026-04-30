import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";

/**
 * Stage 03 EVIDENCE — AI 도움 받기.
 * 핵심 신념 1개 + kind(support|counter)를 받아 4개 사실 후보를 반환.
 *
 * 사용 제한 정책(클라이언트 책임): 신념 × phase 조합당 1회.
 * 서버는 호출마다 응답을 만들어주되, 사용 카운트는 클라이언트 state(stage_03_evidence)에 기록.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    belief?: unknown;
    kind?: unknown;
  };
  const belief = typeof body.belief === "string" ? body.belief.trim() : "";
  const kind = body.kind === "counter" ? "counter" : "support";
  if (!belief) {
    return NextResponse.json({ error: "belief_required" }, { status: 400 });
  }

  const direction =
    kind === "support"
      ? "이 신념을 사실로 받아들일 만한 근거·사건의 *예시 후보* 4개"
      : "이 신념과 다르게 보일 수 있는 *반대 근거·사건*의 예시 후보 4개";

  const systemPrompt = `당신은 인지행동치료(CBT) 워크북을 함께 진행하는 부드럽고 따뜻한 진행자입니다.
사용자가 자기 검증 작업 중 막혔을 때, 사실에 가까운 후보를 4개 제안하는 역할입니다.

원칙:
- 각 항목은 한 문장. 감정/해석이 아닌 '사실'에 가깝게.
- 사용자가 직접 자기 삶에서 떠올릴 단서가 되도록, 너무 일반적이지 않게 구체적인 정황을 포함.
- 비난·평가·교훈 어조 금지. 부드러운 관찰 어조.
- 한국어로만 응답.`;

  const userPrompt = `사용자의 핵심 신념: "${belief}"

다음을 만들어주세요: ${direction}.

응답 형식 — 반드시 아래 JSON 단일 객체로만 응답하세요. 다른 텍스트 절대 포함 금지.
{
  "candidates": ["문장1", "문장2", "문장3", "문장4"]
}`;

  try {
    const response = await chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      {
        model: "gemini-2.5-flash",
        temperature: 0.7,
        max_tokens: 1024,
        response_format: { type: "json_object" },
      }
    );

    const parsed = safeJsonParse<{ candidates?: unknown }>(response);
    const raw = Array.isArray(parsed?.candidates) ? parsed.candidates : [];
    const candidates = raw
      .filter((s): s is string => typeof s === "string")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 4);

    if (candidates.length === 0) {
      return NextResponse.json(
        { error: "empty_response" },
        { status: 502 }
      );
    }

    return NextResponse.json({ candidates });
  } catch (err) {
    console.error("[ai-evidence-help] error:", err);
    return NextResponse.json(
      { error: "ai_failed" },
      { status: 502 }
    );
  }
}
