import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { chatCompletion } from "@/lib/gemini-client";
import {
  DIAGNOSIS_LEVELS,
  DIMENSIONS,
  type DiagnosisScores,
} from "@/lib/self-workshop/diagnosis";
import { buildFallbackReport } from "@/lib/self-workshop/report-fallback";

/**
 * POST /api/self-workshop/personalize-report
 * Step 3 상단에 보여줄 개인화 줄글 리포트 생성 (LLM 1회 + 캐시)
 *
 * Body: { workshopId }
 * Response: { report: string, source: "cache" | "llm" | "fallback" }
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
  if (!workshopId) {
    return NextResponse.json(
      { error: "workshopId가 필요합니다" },
      { status: 400 }
    );
  }

  const { data: progress } = await supabase
    .from("workshop_progress")
    .select("id, user_id, diagnosis_scores, personalized_report")
    .eq("id", workshopId)
    .single();

  if (!progress || progress.user_id !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  if (progress.personalized_report) {
    return NextResponse.json({
      report: progress.personalized_report,
      source: "cache",
    });
  }

  const scores = progress.diagnosis_scores as DiagnosisScores | null;
  if (!scores) {
    return NextResponse.json(
      { error: "진단 결과가 없습니다" },
      { status: 400 }
    );
  }

  const userName =
    (user.user_metadata?.name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    null;

  try {
    const report = await generateWithLLM(scores, userName);
    const admin = createAdminClient();
    await admin
      .from("workshop_progress")
      .update({ personalized_report: report })
      .eq("id", workshopId);

    return NextResponse.json({ report, source: "llm" });
  } catch (err) {
    console.error("[personalize-report] LLM 실패, 폴백 사용:", err);
    const fallback = buildFallbackReport(scores, userName);
    return NextResponse.json({ report: fallback, source: "fallback" });
  }
}

async function generateWithLLM(
  scores: DiagnosisScores,
  userName: string | null
): Promise<string> {
  const level =
    DIAGNOSIS_LEVELS.find((l) => l.level === scores.level) ??
    DIAGNOSIS_LEVELS[DIAGNOSIS_LEVELS.length - 1];

  const sorted = [...DIMENSIONS].sort(
    (a, b) => scores.dimensions[b.key] - scores.dimensions[a.key]
  );
  const top1 = sorted[0];
  const top2 = sorted[1];

  const addressee = userName ? `${userName}님` : "이 분(호칭: 당신)";
  const dimLines = DIMENSIONS.map(
    (d) => `  • ${d.label}: ${scores.dimensions[d.key]}/25`
  ).join("\n");

  const userPrompt =
    `다음은 한 직장인의 성취 중독 자가진단 결과입니다.\n` +
    `- 호칭: ${addressee}\n` +
    `- 총점: ${scores.total}/100 (Level ${scores.level}: ${level.name})\n` +
    `- 레벨 설명: ${level.description}\n` +
    `- 영역별 점수 (각 25점 만점):\n${dimLines}\n` +
    `- 두드러지는 영역 1순위: ${top1.label} (${scores.dimensions[top1.key]}/25)\n` +
    `- 두드러지는 영역 2순위: ${top2.label} (${scores.dimensions[top2.key]}/25)\n\n` +
    `이 결과를 바탕으로 2~3개 문단의 줄글 리포트를 작성해주세요.\n` +
    `- 첫 문단: "${addressee}"으로 시작해, 총점/레벨의 의미를 자연스러운 문장으로 환기\n` +
    `- 두 번째 문단: 1·2순위 영역에서 실제로 어떤 생각/행동 패턴이 나타날지 구체적으로 묘사\n` +
    `- 세 번째 문단: 판단 없이 수용하며, 다음 단계(메커니즘 이해)로의 연결 문장\n` +
    `- 4~6문장/문단, 총 400자 내외\n` +
    `- 호칭("${userName ? `${userName}님` : "당신"}") 유지, 과잉 공감체·감탄사 지양\n` +
    `- 응답은 순수 본문 텍스트만 반환. 제목·머리글·마크다운·불릿 금지.`;

  const text = await chatCompletion(
    [
      {
        role: "system",
        content:
          "당신은 직장인(3~15년차)을 위한 따뜻하고 통찰력 있는 심리 상담사입니다. " +
          "격려하되 미화하지 않으며, 예측형 어조('~할 가능성이 높아요', '~일 수 있어요')를 사용합니다. " +
          "내담자의 패턴을 비난 없이 드러내고, 다음 단계로 자연스럽게 연결하는 글을 씁니다.",
      },
      { role: "user", content: userPrompt },
    ],
    { model: "gemini-2.5-flash", temperature: 0.7, max_tokens: 1500 }
  );

  const trimmed = text.trim();
  if (trimmed.length < 100) {
    throw new Error(`리포트 길이 부족: ${trimmed.length}자`);
  }
  return trimmed;
}
