import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import {
  DIAGNOSIS_LEVELS,
  DIMENSIONS,
  type DiagnosisScores,
} from "@/lib/self-workshop/diagnosis";
import {
  isDiagnosisProfile,
  type DiagnosisProfile,
} from "@/lib/self-workshop/diagnosis-profile";

/**
 * POST /api/self-workshop/personalize-report
 * Step 3 상단에 보여줄 "진단 결과 기반 캐릭터 프로필" JSON 생성 (LLM 1회 + 캐시)
 *
 * Body: { workshopId }
 * Response: { profile: DiagnosisProfile, source: "cache" | "llm" }
 *
 * - 과거에는 plain text 줄글을 `personalized_report`(TEXT) 컬럼에 캐시했으나,
 *   이번 개편으로 `diagnosis_profile`(JSONB) 컬럼에 DiagnosisProfile JSON을 저장.
 * - diagnosis_scores 만으로 생성 가능하므로 Step 3 진입 시점(실습 이전)에 호출됨.
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
    .select("id, user_id, diagnosis_scores, diagnosis_profile")
    .eq("id", workshopId)
    .single();

  if (!progress || progress.user_id !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  if (isDiagnosisProfile(progress.diagnosis_profile)) {
    return NextResponse.json({
      profile: progress.diagnosis_profile,
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

  try {
    const profile = await generateProfileWithLLM(scores);
    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from("workshop_progress")
      .update({ diagnosis_profile: profile })
      .eq("id", workshopId);

    if (updateError) {
      console.error(
        "[personalize-report] DB 저장 실패:",
        updateError.message
      );
      return NextResponse.json({
        profile,
        source: "llm",
        saved: false,
        saveError: updateError.message,
      });
    }

    return NextResponse.json({ profile, source: "llm", saved: true });
  } catch (err) {
    console.error("[personalize-report] LLM 생성 실패:", err);
    return NextResponse.json(
      { error: "프로필 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}

async function generateProfileWithLLM(
  scores: DiagnosisScores
): Promise<DiagnosisProfile> {
  const level =
    DIAGNOSIS_LEVELS.find((l) => l.level === scores.level) ??
    DIAGNOSIS_LEVELS[DIAGNOSIS_LEVELS.length - 1];

  const sorted = [...DIMENSIONS].sort(
    (a, b) => scores.dimensions[b.key] - scores.dimensions[a.key]
  );
  const top1 = sorted[0];
  const top2 = sorted[1];

  const dimLines = DIMENSIONS.map(
    (d) => `  • ${d.label} (${d.jargonLabel}): ${scores.dimensions[d.key]}/25`
  ).join("\n");

  const systemPrompt = `당신은 직장인(3~15년차)을 위한 따뜻하고 통찰력 있는 CBT 기반 심리 상담사입니다. 사용자의 성취 중독 자가진단 결과만을 근거로, **실습 이전 단계의 첫 인상 프로필**을 작성합니다.

**톤 규칙**
- 예측형 어조 사용: "~할 가능성이 높아요", "~일 수 있어요", "~처럼 느껴져요".
- 전문 용어는 풀어쓰기. "과잉 추동", "정서적 회피" 같은 원어 사용 금지. 대신 "멈추지 못하고 달리는 습관", "불편한 감정을 일로 덮는 패턴" 같은 일상 언어로.
- 판단·비난·과잉 공감 금지. 미화도 금지.
- 호칭은 사용하지 말고 자연스러운 주어 생략체로(영어 you 느낌).

**반드시 아래 JSON 스키마를 그대로 따라 단일 객체로 응답하세요. 배열·코드펜스·주석 금지.**

{
  "character_line": "따옴표로 감싼 12자 이내의 은유적 캐릭터 한 줄. 예: '\\'뒤처짐\\'에 쫓기는 경주자' / '쉼 없이 증명하는 완벽주의자' / '불안을 연료로 달리는 러너'. 반드시 따옴표 포함.",
  "character_description": "캐릭터 네이밍의 의미를 풀어내는 2~3문장(총 180자 내외). 상위 2개 영역의 점수가 실제로 어떤 심리 구조로 작동하는지 서술. 진단의 '심각성'을 말하지 말고 '구조'를 설명.",
  "life_impact": {
    "work": "일·업무 영역에서 이 패턴이 드러날 가능성이 높은 모습 1~2문장. 예측형으로.",
    "relationship": "사람·관계 영역에서 드러날 가능성이 높은 모습 1~2문장. 인정 갈망·비교·거리두기 등.",
    "rest": "쉼·여가·빈 시간에 드러날 가능성이 높은 모습 1~2문장. 죄책감·공허함·불안 등.",
    "body": "몸·신체 감각에 드러날 가능성이 높은 모습 1~2문장. 긴장·수면·피로 신호 등."
  }
}

규칙:
- character_line은 반드시 따옴표 포함, 12자 이내. "프로필", "타입" 같은 분류명 금지.
- life_impact 4영역 모두 비어있지 않아야 하며, 서로 다른 장면을 묘사할 것.
- 전문 용어 원어 직접 사용 금지.
- JSON 외 텍스트 절대 포함 금지.`;

  const userMessage = `## 진단 결과 (리커트 5점 척도 20문항)
- 총점: ${scores.total}/100
- 레벨: ${scores.level} (${level.name} · ${level.keyword})
- 레벨 설명: ${level.description}
- 영역별 점수 (각 /25):
${dimLines}
- 두드러지는 영역 1순위: ${top1.label} (${scores.dimensions[top1.key]}/25)
- 두드러지는 영역 2순위: ${top2.label} (${scores.dimensions[top2.key]}/25)`;

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    {
      model: "gemini-2.5-flash",
      temperature: 0.6,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    }
  );

  const parsed = safeJsonParse<DiagnosisProfile>(response);
  if (!isDiagnosisProfile(parsed)) {
    console.error("[personalize-report] 스키마 검증 실패:", parsed);
    throw new Error("프로필 스키마 검증 실패");
  }
  return parsed;
}
