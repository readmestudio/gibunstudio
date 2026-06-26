import { NextResponse } from "next/server";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import {
  DIMENSIONS,
  DIAGNOSIS_QUESTIONS,
  LIKERT_OPTIONS,
  calculateDiagnosisScores,
  type DimensionKey,
} from "@/lib/self-workshop/diagnosis";
import {
  COGNITIVE_ERRORS,
  COGNITIVE_ERROR_IDS,
  isCognitiveErrorId,
  type CognitiveErrorId,
} from "@/lib/self-workshop/cognitive-errors";

/**
 * 성취 중독 *무료 테스트* 결과 화면의 LLM 상황 진단.
 *
 * 무료 리드 마그넷이라 로그인·DB 없이 동작한다(워크북 결제 전 단계).
 * 클라이언트에서 푼 20문항 답변(answers)만 받아:
 *   1) 지금 어떤 상태인지(거울처럼)
 *   2) 자주 떠오르는 자동사고 2~3개(1인칭)
 *   3) 빠지기 쉬운 인지 오류 2~3개(카탈로그에서 선택)
 *   4) "성취 중독 워크북으로 반복되는 패턴을 분석 받아 보세요" 자연스러운 연결
 * 을 생성해, 결과 화면이 워크북 구매로 자연스럽게 이어지게 한다.
 *
 * 점수 계산·문항·인지오류는 워크북과 동일 출처를 공유하므로 한쪽을 고치면
 * 양쪽이 함께 정렬된다.
 */

const LIKERT_LABEL: Record<number, string> = Object.fromEntries(
  LIKERT_OPTIONS.map((o) => [o.value, o.label])
);

interface DiagnoseOutput {
  state_summary: string;
  frequent_thoughts: string[];
  cognitive_errors: { id: CognitiveErrorId; name: string; why: string }[];
  bridge: string;
}

export async function POST(req: Request) {
  let answers: Record<string, number>;
  try {
    const body = await req.json();
    answers = body?.answers;
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (
    !answers ||
    typeof answers !== "object" ||
    Object.keys(answers).length === 0
  ) {
    return NextResponse.json(
      { error: "답변 데이터가 필요합니다." },
      { status: 400 }
    );
  }

  const scores = calculateDiagnosisScores(answers);

  /* ─── 입력 직렬화: 영역별 점수 + 강하게 동의한 문항 ─── */

  const dimensionLines = DIMENSIONS.map((dim) => {
    const score = scores.dimensions[dim.key as DimensionKey];
    return `- ${dim.jargonLabel}(${dim.label}): ${score}/25 — ${dim.description}`;
  }).join("\n");

  // 사용자가 4점(그렇다)·5점(매우 그렇다)으로 강하게 동의한 문항 = 가장 또렷한 신호.
  const strongItems = DIAGNOSIS_QUESTIONS.filter(
    (q) => (answers[String(q.id)] ?? 0) >= 4
  )
    .sort((a, b) => (answers[String(b.id)] ?? 0) - (answers[String(a.id)] ?? 0))
    .map((q) => {
      const v = answers[String(q.id)] ?? 0;
      const dim = DIMENSIONS.find((d) => d.key === q.dimension);
      return `- "${q.text}" → ${LIKERT_LABEL[v]}(${v}점) [${dim?.jargonLabel ?? ""}]`;
    });
  const strongItemsText =
    strongItems.length > 0
      ? strongItems.join("\n")
      : "(강하게 동의한 문항 없음 — 전반적으로 낮은 동의)";

  const errorCatalog = COGNITIVE_ERRORS.map(
    (e) => `  - ${e.id} | "${e.label}"(${e.englishLabel}): ${e.definition} 예: "${e.example}"`
  ).join("\n");

  /* ─── 프롬프트 ─── */

  const systemPrompt = `# ROLE
당신은 1급 심리상담사이자 인지행동치료(CBT) 전문가입니다. 사용자가 성취 중독 자가 진단(리커트 5점 20문항)에 답한 결과를 바탕으로, 결과 화면에 보여줄 "지금 당신의 상태" 짧은 진단을 작성합니다.

이 진단은 진단명을 붙이는 게 아니라, 사용자가 자기 패턴과 거리를 둘 수 있게 비춰주는 거울입니다. 그리고 마지막에 "성취 중독 워크북으로 반복되는 패턴을 직접 분석해 보자"는 제안으로 자연스럽게 이어져야 합니다.

# WRITING GUIDELINES (반드시 준수)
- 따뜻하되 모호하지 않게, 단정하지 않되 흐릿하지 않게. "~일 수 있어요", "~가능성이 높아요" 같은 추정 표현 사용.
- '내담자', '환자' 같은 거리감 있는 표현 금지.
- **'당신은' 직접 호칭 주어를 남발하지 말 것.** 한국어답게 주어를 생략하거나 '스스로', '자기 자신을' 같은 자기지칭 사용. '당신의', '당신에게' 정도의 소유/처소격은 절제해서 가능.
- **극존칭 금지**("~하시며", "~느끼시는"). 평이한 '~해요'체로 따뜻하게.
- **정의식 종결 금지**("~한 믿음입니다"). 관찰·기술식으로("~하는 경향이 보여요", "~하기 쉬워요").
- 점수 숫자를 그대로 읊지 말 것. 점수가 드러내는 '패턴'을 사람의 언어로 번역.
- 진단 결과에 없는 사실(구체적 사건·관계 등)을 지어내지 말 것. 자기보고 패턴에 근거.

# OUTPUT — 아래 단일 JSON 객체로만 응답. JSON 외 텍스트(설명·코드펜스) 절대 금지.
{
  "state_summary": "지금 어떤 상태인지 2~3문장. 가장 두드러진 영역(점수가 높은 축)을 중심으로, 사용자가 '맞아, 내가 이래' 하고 알아챌 수 있게. '~해요'체.",
  "frequent_thoughts": [
    "자주 머릿속을 스치는 자동사고를 1인칭 따옴표 문장으로. 예: \\"이 정도로는 부족해\\"",
    "두 번째 자동사고",
    "세 번째 자동사고"
  ],
  "cognitive_errors": [
    {
      "id": "[아래 카탈로그의 snake_case id 중 하나]",
      "name": "[카탈로그의 한글명 그대로]",
      "why": "이 사람의 응답 패턴상 왜 이 오류에 빠지기 쉬운지 1문장. 관찰·기술식 종결."
    }
  ],
  "bridge": "'성취 중독 워크북으로 반복되는 이 패턴을 직접 따라가며 분석해 볼 수 있어요' 같은 톤으로, 위 진단에서 워크북 내용으로 자연스럽게 이어지는 1~2문장. 단, '성취 중독 워크북'이라는 표현을 자연스럽게 포함."
}

# 규칙
- frequent_thoughts 는 정확히 3개, 모두 1인칭 따옴표 인용형.
- cognitive_errors 는 2~3개. 반드시 아래 카탈로그의 id만 사용하고, 점수가 높은 영역과 실제로 연결되는 것만 고를 것(짜맞추지 말 것).
- 모든 출력은 한국어.

# 인지 오류 카탈로그 (cognitive_errors[].id 는 반드시 이 목록에서만 선택)
${errorCatalog}`;

  const userMessage = `## 성취 중독 자가 진단 결과
- 총점: ${scores.total}/100
- 레벨: ${scores.level} (${scores.levelName})

## 4개 영역별 점수 (각 /25, 높을수록 강한 패턴)
${dimensionLines}

## 강하게 동의한 문항 (가장 또렷한 신호)
${strongItemsText}

위 결과를 바탕으로 "지금 당신의 상태" 진단을 OUTPUT 형식의 JSON으로 작성하세요.`;

  try {
    const response = await chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      {
        model: "gemini-2.5-pro",
        temperature: 0.6,
        max_tokens: 4096,
        response_format: { type: "json_object" },
      }
    );

    const parsed = safeJsonParse<Partial<DiagnoseOutput>>(response);

    // ── 검증 + 정규화 ──
    const stateSummary =
      typeof parsed.state_summary === "string" ? parsed.state_summary.trim() : "";
    const frequentThoughts = Array.isArray(parsed.frequent_thoughts)
      ? parsed.frequent_thoughts
          .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
          .map((t) => t.trim())
          .slice(0, 3)
      : [];
    const bridge =
      typeof parsed.bridge === "string" ? parsed.bridge.trim() : "";

    const seen = new Set<CognitiveErrorId>();
    const cognitiveErrors = (
      Array.isArray(parsed.cognitive_errors) ? parsed.cognitive_errors : []
    )
      .map((e) => {
        if (!e || !isCognitiveErrorId(e.id)) return null;
        if (seen.has(e.id)) return null;
        seen.add(e.id);
        const catalog = COGNITIVE_ERRORS.find((c) => c.id === e.id)!;
        return {
          id: e.id,
          // 한글명은 카탈로그를 정본으로(모델 오타 방지).
          name: catalog.label,
          why:
            typeof e.why === "string" && e.why.trim().length > 0
              ? e.why.trim()
              : catalog.definition,
        };
      })
      .filter(
        (e): e is { id: CognitiveErrorId; name: string; why: string } =>
          e !== null && COGNITIVE_ERROR_IDS.includes(e.id)
      )
      .slice(0, 3);

    if (!stateSummary || frequentThoughts.length === 0 || !bridge) {
      console.error("achievement-test/diagnose: 필수 필드 누락", parsed);
      return NextResponse.json(
        { error: "분석 결과 형식이 올바르지 않습니다. 다시 시도해 주세요." },
        { status: 500 }
      );
    }

    const result: DiagnoseOutput = {
      state_summary: stateSummary,
      frequent_thoughts: frequentThoughts,
      cognitive_errors: cognitiveErrors,
      bridge,
    };

    return NextResponse.json({ diagnosis: result });
  } catch (err) {
    console.error("achievement-test/diagnose: Gemini 분석 실패", err);
    return NextResponse.json(
      { error: "AI 분석에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
