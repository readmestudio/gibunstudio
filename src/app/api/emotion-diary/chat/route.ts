import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { STEP_PROMPTS } from "@/lib/emotion-diary/prompts";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { messages, currentStep, day } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const stepLimits: Record<number, number> = { 2: 9, 3: 10, 4: 12, 5: 13, 6: 15 };
    const stepLimit = day ? (stepLimits[day] ?? 15) : 15;
    const stepHint = STEP_PROMPTS[currentStep] ?? STEP_PROMPTS[1];

    const systemContent = `당신은 GIBUN 감정일기 도구의 상담사입니다.
현재 단계 ${currentStep}의 핵심 질문/안내: ${stepHint}
Warm CBT와 핵심 믿음 자각 기반 사고 탐색 프레임을 따릅니다.
현재 단계: ${currentStep} / 최대 ${stepLimit}단계까지 진행 가능합니다.
한 번에 한 단계만 진행하며, 사용자의 응답이 있기 전에는 절대 다음 단계로 넘어가지 않습니다.
판단이나 교정이 아닌, 관찰과 자각 중심으로 탐색합니다.
자연스럽고 따뜻한 톤으로 응답하세요.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemContent },
        ...messages.map((m: { role: string; content: string }) => ({
          role: m.role as "user" | "assistant" | "system",
          content: m.content,
        })),
      ],
    });

    const content = completion.choices[0]?.message?.content ?? "";

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Emotion diary chat error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Chat failed" },
      { status: 500 }
    );
  }
}
