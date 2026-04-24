import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import {
  isAnalysisReport,
  type AnalysisReport,
} from "@/lib/self-workshop/analysis-report";
import {
  COGNITIVE_ERRORS,
  COGNITIVE_ERROR_IDS,
} from "@/lib/self-workshop/cognitive-errors";
import { composeAutomaticThought } from "@/lib/self-workshop/compose-automatic-thought";

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

  if (isAnalysisReport(progress.mechanism_insights)) {
    return NextResponse.json({ report: progress.mechanism_insights });
  }

  const { diagnosis_scores, mechanism_analysis } = progress;

  if (!diagnosis_scores || !mechanism_analysis) {
    return NextResponse.json(
      { error: "진단 결과와 실습 자료가 필요합니다" },
      { status: 400 }
    );
  }

  const errorCatalog = COGNITIVE_ERRORS.map(
    (e) => `  - ${e.id} (${e.label}): ${e.definition} 예시: "${e.example}"`
  ).join("\n");

  const systemPrompt = `당신은 CBT(인지행동치료) 전문 심리학자이자, 유저에게 친근하게 말을 거는 작가입니다. 유저의 "성취 중독 진단 결과"와 "Mind Over Mood 자기 기술 자료"를 바탕으로, 따뜻하지만 예리한 리포트를 씁니다.

**매우 중요 — 톤 규칙**
- **전문 용어 금지**: "과잉 추동", "정서적 회피", "자기 가치의 조건화", "촉발" 같은 임상 용어를 그대로 쓰지 마세요. 대신 일상 언어로 풀어쓰세요 (예: "쉬지 못하고 달리는 습관", "불편한 감정을 일로 덮는 패턴", "머릿속에 훅 스치는 말").
- 단, **인지 오류 이름(items[].name)은 강의 용어 그대로** 사용합니다 (예: "명명하기", "재앙화", "당위 진술").

**구조 규칙**: pattern_cycle은 Step 3에서 유저가 학습한 5단계 순환(촉발 상황 → 자동적 사고 → 감정 → 신체 반응 → 행동)에 정확히 일치해야 합니다.

**인지 오류 카탈로그 (items[].id는 반드시 이 목록에서만 선택)**
${errorCatalog}

반드시 아래 JSON 스키마를 그대로 따라 **단일 객체**로 응답하세요. 배열로 감싸지 마세요.

**핵심 자동사고란?**: 유저는 여러 후보 생각을 적은 뒤, 그중 **감정(primary_emotion + intensity)과 가장 직접 연결된다고 스스로 고른 한 문장**을 "상황에 대한 생각(automatic_thought)"으로 선정했습니다.

**자동사고 합성 공식**: 완성된 자동사고는 **"상황에 대한 생각 + 생각으로 인한 결과(worst_case_result)"** 의 합으로 정의됩니다. 인용과 근거는 **이 완성된 자동사고를 우선**하세요. 후보 생각(candidate_thoughts)은 보조 재료로만 참고하세요.

{
  "cognitive_errors": {
    "intro": "유저의 핵심 자동사고('${'\\"자동사고 원문\\"'}' 형태로 인용)와 이번 섹션이 어떤 얘기를 할지 1~2문장으로 여는 말. 가능하면 감정 강도(예: '불안 7점')를 한 번 언급해 '그때의 온도'를 살짝 짚어주세요. 강의 톤: '오늘은 당신의 자동사고 속에 어떤 함정이 숨어있는지 짚어볼게요.' 같은 예측형.",
    "items": [
      {
        "id": "위 카탈로그의 snake_case id 중 하나 (예: labeling, catastrophizing, mind_reading)",
        "name": "강의에서 쓰는 한글명 그대로 (예: '명명하기', '재앙화', '독심술')",
        "definition": "강의 톤으로 쓴 이 오류의 한 줄 정의(60자 내외).",
        "interpretation": "유저의 자동사고·체크리스트·핵심신념에서 이 오류가 어떻게 드러나는지 2~3문장. 유저 원문 표현을 **직접 인용(따옴표)** 하여 근거로 삼을 것. 판단·비난 없이 관찰자 관점으로."
      }
    ],
    "closing": "1~2문장 마무리. 오류를 '틀렸다'고 낙인찍지 말고, 이것이 감정을 유발하는 스위치임을 짚으며 다음 섹션(패턴 사이클)로 자연스럽게 연결."
  },
  "pattern_cycle": {
    "headline": "유저가 보이는 패턴에 이름을 붙이는 **한 줄 문장**. 화살표·단계 나열 **금지**. '패턴이에요'로 끝나는 35자 이내 문장. 예: '타인의 성공 경험이 과잉 노력의 연료가 되는 패턴이에요' / '휴식이 생기면 곧바로 불안으로 갈아타는 패턴이에요'.",
    "overview": "2~3문장으로 왜 이 패턴이 반복 강화되는지 서술. 유저 원문 표현 1~2개 직접 인용. 전문 용어 금지.",
    "nodes": [
      { "stage": "trigger",  "label": "핵심 키워드 **6글자 이내**. stage 이름(촉발 상황 등) 포함 금지. 예: '타인의 성공', '빈 주말', '평가 직전'", "description": "1~2문장. 이 상황이 유저에게 어떤 의미로 다가오는지 쓰고, 이것이 어떤 생각을 자동으로 불러오는지 다음 단계로 연결." },
      { "stage": "thought",  "label": "예: '나만 뒤처져', '더 해야 해'", "description": "1~2문장. 앞 단계(상황)가 왜 이 생각을 만들어내는지 이어서 쓰고, 이 생각이 어떤 감정을 일으키는지 다음 단계로 연결." },
      { "stage": "emotion",  "label": "예: '불안·자책', '초조'",          "description": "1~2문장. 앞 단계(생각)가 이 감정을 어떻게 키우는지 이어서 쓰고, 이 감정이 몸에서 어떻게 느껴지는지 다음 단계로 연결." },
      { "stage": "body",     "label": "예: '가슴 답답', '불면'",          "description": "1~2문장. 앞 단계(감정)가 몸에서 어떻게 나타나는지 이어서 쓰고, 이 불편감이 어떤 행동을 하게 만드는지 다음 단계로 연결." },
      { "stage": "behavior", "label": "예: '주말 과몰두', '새 목표'. 유저가 '실제 행동' 을 적었다면 그 표현을 6글자로 압축해 우선 반영.", "description": "1~2문장. 앞 단계(신체 불편)가 이 행동을 어떻게 유발하는지 이어서 쓰고, 이 행동이 잠깐의 안도 뒤에 다시 1단계(촉발 상황)를 만들어내는 순환 고리까지 포함. 유저가 적은 '실제 행동' 원문을 따옴표로 직접 인용." }
    ]
  }
}

규칙:
- **cognitive_errors.items 는 3~4개가 기본**. 유저의 자동사고·체크리스트·핵심신념이 매우 비어있을 때만 1~2개 허용. 4개 초과 금지.
- **items[].id 는 반드시 위 카탈로그의 snake_case id** (dichotomous / catastrophizing / labeling / magnification_minimization / emotional_reasoning / mental_filter / mind_reading / overgeneralization / personalization / should_statements) 중에서 선택.
- **items[].interpretation 은 유저 원문을 따옴표로 인용**해야 합니다. 일반론 금지.
- 같은 id를 중복 선택 금지.
- pattern_cycle.nodes 는 **정확히 5개** (stage 순서: trigger → thought → emotion → body → behavior).
- **nodes[].label 은 반드시 6글자(한글 기준) 이내**. stage 이름을 label 앞에 붙이지 마세요. 콜론(:)도 금지.
- **headline 은 35자 이내 한 문장**, '패턴이에요'로 끝남. 화살표(→) 금지.
- 모든 description은 150자 이내로 간결하게.
- **도미노 서술**: 각 nodes[].description은 **앞 단계에서 이어받고 → 다음 단계로 넘기는** 흐름으로. 5개를 순서대로 읽으면 하나의 이야기처럼 자연스럽게 이어져야 합니다.
- 어조: 따뜻하면서도 예리함. 판단·비난 금지. 유저 표현을 구체적으로 인용.
- JSON 외에 다른 텍스트(설명, markdown 코드펜스) 절대 포함하지 마세요.`;

  const cb = mechanism_analysis.core_beliefs ?? {};
  const checked: string[] =
    mechanism_analysis.common_thoughts_checked ?? [];
  const checkedText =
    checked.length > 0 ? checked.map((t: string) => `"${t}"`).join(", ") : "없음";
  const eb = mechanism_analysis.emotions_body ?? {};

  const candidates: string[] = (
    mechanism_analysis.candidate_thoughts ?? []
  ).filter((t: string) => typeof t === "string" && t.trim().length > 0);
  const candidatesText =
    candidates.length > 0
      ? candidates.map((t) => `"${t}"`).join(" / ")
      : "없음";
  const primaryEmotion: string = mechanism_analysis.primary_emotion ?? "";
  const emotionIntensity: number =
    typeof mechanism_analysis.emotion_intensity === "number"
      ? mechanism_analysis.emotion_intensity
      : 0;
  const emotionStrengthLine =
    primaryEmotion && emotionIntensity > 0
      ? `${primaryEmotion} (${emotionIntensity}/10)`
      : primaryEmotion || "미체크";

  const primaryThought: string =
    typeof mechanism_analysis.automatic_thought === "string"
      ? mechanism_analysis.automatic_thought
      : "";
  const worstCaseResult: string =
    typeof mechanism_analysis.worst_case_result === "string"
      ? mechanism_analysis.worst_case_result
      : "";
  const thoughtImage: string =
    typeof mechanism_analysis.thought_image === "string"
      ? mechanism_analysis.thought_image
      : "";
  const socialPerception: string =
    typeof mechanism_analysis.social_perception === "string"
      ? mechanism_analysis.social_perception
      : "";
  const resultingBehavior: string =
    typeof mechanism_analysis.resulting_behavior === "string"
      ? mechanism_analysis.resulting_behavior
      : "";
  const composedThought = composeAutomaticThought(
    primaryThought,
    worstCaseResult
  );

  const userMessage = `## 진단 결과 (리커트 5점 척도 20문항)
- 총점: ${diagnosis_scores.total}/100
- 레벨: ${diagnosis_scores.level} (${diagnosis_scores.levelName})
- 영역별 점수 (각 /25):
  - conditional_self_worth (자기 가치의 조건화): ${diagnosis_scores.dimensions.conditional_self_worth}
  - compulsive_striving (과잉 추동): ${diagnosis_scores.dimensions.compulsive_striving}
  - fear_of_failure (실패 공포/완벽주의): ${diagnosis_scores.dimensions.fear_of_failure}
  - emotional_avoidance (정서적 회피): ${diagnosis_scores.dimensions.emotional_avoidance}

## 유저가 수집한 재료 (Mind Over Mood 흐름)
- 최근 불편했던 상황: ${mechanism_analysis.recent_situation ?? "미작성"}
- 그 상황에서 가장 강했던 감정·강도: ${emotionStrengthLine}
- 그때 머릿속에 스쳐 지나간 생각들(후보 전체): ${candidatesText}
- 상황에 대한 생각(감정과 가장 직접 연결): "${primaryThought || "미작성"}"
- 생각으로 인한 결과(최악 시나리오): "${worstCaseResult || "미작성"}"
- **완성된 자동사고(③상황에 대한 생각 + ④생각으로 인한 결과)**: "${composedThought || "미완성"}"
- 그때 떠오른 장면·이미지: ${thoughtImage ? `"${thoughtImage}"` : "비움"}
- 남들에게 내가 어떤 사람으로 보여질까: ${socialPerception ? `"${socialPerception}"` : "비움"}
- 최근에 자주 한 생각(체크리스트): ${checkedText}
- 이 생각이 주로 드는 맥락: ${mechanism_analysis.trigger_context ?? "미작성"}
- 감정 전체(핵심 + 동반): ${eb.emotions?.join(", ") ?? "없음"}
- 신체 반응: ${eb.body_text ?? "미작성"}
- 그 생각으로 인한 실제 행동(5-Part Model의 behavior 축): ${resultingBehavior ? `"${resultingBehavior}"` : "미작성"}
- 핵심 신념 — 나에 대해: ${cb.about_self ?? "미작성"}`;

  try {
    const response = await chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      {
        model: "gemini-2.5-pro",
        temperature: 0.6,
        max_tokens: 8192,
        response_format: { type: "json_object" },
      }
    );

    const report = safeJsonParse<AnalysisReport>(response);

    if (!isAnalysisReport(report)) {
      console.error("analyze-mechanism: 스키마 검증 실패", report);
      return NextResponse.json(
        { error: "분석 결과 형식이 올바르지 않습니다. 다시 시도해 주세요." },
        { status: 500 }
      );
    }

    const nodeCount = report.pattern_cycle.nodes.length;
    if (nodeCount !== 5) {
      console.error("analyze-mechanism: nodes 개수 이상", nodeCount);
      return NextResponse.json(
        { error: "분석 결과 형식이 올바르지 않습니다. 다시 시도해 주세요." },
        { status: 500 }
      );
    }
    const expectedStages: ReadonlyArray<string> = [
      "trigger",
      "thought",
      "emotion",
      "body",
      "behavior",
    ];
    const stageMismatch = report.pattern_cycle.nodes.some(
      (n, i) => n.stage !== expectedStages[i]
    );
    if (stageMismatch) {
      console.error(
        "analyze-mechanism: nodes stage 순서/명칭 불일치",
        report.pattern_cycle.nodes.map((n) => n.stage)
      );
      return NextResponse.json(
        { error: "분석 결과 형식이 올바르지 않습니다. 다시 시도해 주세요." },
        { status: 500 }
      );
    }

    // cognitive_errors.items id 중복 제거 (같은 id가 들어온 경우 첫 항목만 유지)
    const seenIds = new Set<string>();
    report.cognitive_errors.items = report.cognitive_errors.items.filter(
      (item) => {
        if (seenIds.has(item.id)) return false;
        seenIds.add(item.id);
        return COGNITIVE_ERROR_IDS.includes(item.id);
      }
    );
    if (report.cognitive_errors.items.length < 1) {
      console.error(
        "analyze-mechanism: 중복 제거 후 cognitive_errors.items 비어있음"
      );
      return NextResponse.json(
        { error: "분석 결과 형식이 올바르지 않습니다. 다시 시도해 주세요." },
        { status: 500 }
      );
    }

    // label 6글자 초과 시 자동 축약 (LLM이 프롬프트를 어긴 경우 안전망)
    report.pattern_cycle.nodes = report.pattern_cycle.nodes.map((n) => {
      const stripped = n.label
        .replace(/^(촉발 상황|자동 사고|자동적 사고|감정|신체 반응|행동)\s*[:：]\s*/u, "")
        .trim();
      const trimmed = Array.from(stripped).slice(0, 8).join("");
      return { ...n, label: trimmed };
    });
    await supabase
      .from("workshop_progress")
      .update({
        mechanism_insights: report,
        current_step: Math.max(5, progress.current_step ?? 4),
      })
      .eq("id", workshopId);

    return NextResponse.json({ report });
  } catch (err) {
    console.error("Gemini 분석 실패:", err);
    return NextResponse.json(
      { error: "AI 분석에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
