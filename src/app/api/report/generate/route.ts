import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: NextRequest) {
  try {
    const { rawData, userName } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemContent = `당신은 1급 심리상담사입니다. 
사용자의 7일 내면 아이 찾기 로우데이터를 분석하여 리포트를 작성합니다.
리포트는 "당신은 이런 사람이다"가 아닌 "요즘의 당신은 ~" 톤으로 작성합니다.
각 섹션을 따뜻하고 이해하기 쉬운 문체로 작성하세요.`;

    const userContent = `다음 로우데이터를 분석하여 리포트의 각 섹션을 작성해 주세요.

회원명: ${userName || "회원"}

로우데이터:
${JSON.stringify(rawData, null, 2)}

다음 JSON 형식으로 응답해 주세요 (각 필드는 해당 섹션의 내용):
{
  "profile": "유형 설명 (동물 비유 + 친근한 이름 예: 눈치 빠른 고양이)",
  "emotionChart": "감정 분포 설명 (일자별 요약)",
  "frequentThoughts": "자주 하는 사고 (불릿 포인트, 400자 이내)",
  "coreBeliefs": "핵심 믿음 (나/타인/세상에 대한 믿음, 불릿 포인트, 5600자 이내)",
  "originStory": "이 내면 아이가 왜 생겨났는지",
  "lifeImpact": "건강할 때 vs 스트레스 받을 때의 영향",
  "counselorSummary": "상담사 총평 (직접 작성할 예정이므로 빈 문자열)"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content ?? "{}";

    try {
      const report = JSON.parse(content);
      return NextResponse.json(report);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse report" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Report generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Report generation failed" },
      { status: 500 }
    );
  }
}
