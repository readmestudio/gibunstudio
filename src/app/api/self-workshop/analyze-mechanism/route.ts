import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import {
  isAnalysisReport,
  type AnalysisReport,
} from "@/lib/self-workshop/analysis-report";

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

  const systemPrompt = `당신은 CBT(인지행동치료) 전문 심리학자입니다. 사용자가 작성한 "성취 중독 진단 결과"와 "Mind Over Mood 흐름의 자기 기술 자료"를 바탕으로, 임상 리포트 형식의 구조화된 분석을 제공합니다.

반드시 아래 JSON 스키마를 그대로 따라 **단일 객체**로 응답하세요. 배열로 감싸지 마세요. 필드명과 enum 값은 한 글자도 어기지 마세요.

{
  "pattern_cycle": {
    "headline": "한 줄 요약 — 유저의 상황→생각→감정→행동 흐름을 축약한 화살표 문장 (예: '월말 평가 직전 불안 → \"부족해\" 자동사고 → 긴장·두통 → 주말 과몰두 → 일시 안도 → 만성 피로')",
    "overview": "2~3문장으로 이 순환이 왜 반복되는지 서술. 유저 표현 1~2개 인용.",
    "nodes": [
      { "stage": "trigger",       "label": "짧은 라벨", "description": "1~2문장 부연" },
      { "stage": "thought",       "label": "...",      "description": "..." },
      { "stage": "emotion",       "label": "...",      "description": "..." },
      { "stage": "body",          "label": "...",      "description": "..." },
      { "stage": "behavior",      "label": "...",      "description": "..." },
      { "stage": "reinforcement", "label": "...",      "description": "..." }
    ]
  },
  "cross_validation": {
    "summary": "진단 점수와 유저의 말이 어떻게 이어지는지 1~2문장. '교차검증' 같은 전문 용어 금지. '점수가 당신의 말에서 어떻게 드러나는지' 톤으로.",
    "rows": [
      {
        "dimension_key": "conditional_self_worth",
        "score": 0,
        "match_level": "잘 맞아요",
        "evidence_quote": "유저가 실제 쓴 표현 1문장 발췌 (따옴표 없이, 원문 그대로)",
        "interpretation": "이 차원이 유저의 말에서 어떻게 나타나는지 1문장 해석"
      },
      { "dimension_key": "compulsive_striving", ... },
      { "dimension_key": "fear_of_failure", ... },
      { "dimension_key": "emotional_avoidance", ... }
    ]
  },
  "hidden_patterns": {
    "summary": "유저가 인식하지 못했을 생각의 함정에 대한 1~2문장 소개. '인지적 오류'라는 단어 대신 '생각의 함정'이라는 표현을 사용.",
    "errors": [
      {
        "id": "dichotomous | overgeneralization | should_statements | emotional_reasoning | mind_reading | catastrophizing 중 하나",
        "label": "해당 오류의 한국어 이름 (예: 이분법적 사고)",
        "evidence": "유저 발화 인용 + 어떻게 드러났는지 1~2문장"
      }
    ]
  },
  "key_question": {
    "headline": "다음 단계로 이어지는 성찰 질문의 제목",
    "question": "열린 질문 1문장 — 따옴표로 감싸지 말고 원문 그대로",
    "rationale": "왜 지금 이 질문이 필요한지 2문장"
  }
}

규칙:
- pattern_cycle.nodes 는 정확히 5개 또는 6개.
- cross_validation.rows 는 정확히 4개 (차원 4개 모두 포함, 위 순서 유지).
- hidden_patterns.errors 는 1~3개. 유저 자료에 실제로 드러난 것만.
- 모든 description/interpretation/evidence는 150자 이내로 간결하게.
- 어조: 임상적이지만 따뜻함. 판단·비난 금지. 유저의 표현을 구체적으로 인용.
- JSON 외에 다른 텍스트(설명, markdown 코드펜스) 절대 포함하지 마세요.`;

  const cb = mechanism_analysis.core_beliefs ?? {};
  const checked: string[] =
    mechanism_analysis.common_thoughts_checked ?? [];
  const checkedText =
    checked.length > 0 ? checked.map((t: string) => `"${t}"`).join(", ") : "없음";
  const eb = mechanism_analysis.emotions_body ?? {};

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
    if (nodeCount < 5 || nodeCount > 6) {
      console.error("analyze-mechanism: nodes 개수 이상", nodeCount);
      return NextResponse.json(
        { error: "분석 결과 형식이 올바르지 않습니다. 다시 시도해 주세요." },
        { status: 500 }
      );
    }
    if (report.cross_validation.rows.length !== 4) {
      console.error(
        "analyze-mechanism: rows 개수 이상",
        report.cross_validation.rows.length
      );
      return NextResponse.json(
        { error: "분석 결과 형식이 올바르지 않습니다. 다시 시도해 주세요." },
        { status: 500 }
      );
    }

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
