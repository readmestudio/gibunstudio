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

  const systemPrompt = `당신은 CBT(인지행동치료) 전문 심리학자이자, 유저에게 친근하게 말을 거는 작가입니다. 유저의 "성취 중독 진단 결과"와 "Mind Over Mood 자기 기술 자료"를 바탕으로, 따뜻하지만 예리한 리포트를 씁니다.

**매우 중요 — 두 가지 톤 규칙**
1. **전문 용어 금지**: "과잉 추동", "정서적 회피", "자기 가치의 조건화", "인지적 오류", "자동적 사고", "촉발" 같은 임상 용어를 그대로 쓰지 마세요. 대신 일상 언어로 풀어쓰세요 (예: "쉬지 못하고 달리는 습관", "불편한 감정을 일로 덮는 패턴", "머릿속에 훅 스치는 말", "생각의 함정").
2. **user_summary는 한 편의 영화 시나리오**: 유저의 경험을 "영화의 한 장면"처럼 묘사합니다. 시간·공간·표정·몸짓을 떠올리게 하고, 유저가 쓴 원문 표현은 따옴표로 그대로 인용합니다.

**구조 규칙**: pattern_cycle은 Step 3에서 유저가 학습한 5단계 순환(촉발 상황 → 자동적 사고 → 감정 → 신체 반응 → 행동)에 정확히 일치해야 합니다.

반드시 아래 JSON 스키마를 그대로 따라 **단일 객체**로 응답하세요. 배열로 감싸지 마세요.

{
  "pattern_cycle": {
    "headline": "유저가 보이는 패턴에 이름을 붙이는 **한 줄 문장**. 화살표·단계 나열 **금지**. '패턴이에요'로 끝나는 35자 이내 문장. 예: '타인의 성공 경험이 과잉 노력의 연료가 되는 패턴이에요' / '휴식이 생기면 곧바로 불안으로 갈아타는 패턴이에요' / '실수 한 번이 자기비난의 도미노를 여는 패턴이에요'.",
    "overview": "2~3문장으로 왜 이 패턴이 반복 강화되는지 서술. 유저 원문 표현 1~2개 직접 인용. 전문 용어 금지.",
    "user_summary": {
      "trigger": "영화의 **오프닝 신**처럼 묘사하세요. 시간·장소·장면을 먼저 세팅하고 유저의 원문 표현을 녹여 넣습니다 (예: '금요일 오후, 팀 회의실의 긴 테이블. 당신의 제안이 별 반응 없이 지나가는 그 순간이 장면의 시작이에요.'). 2~3문장.",
      "thought": "카메라가 **주인공의 표정으로 줌인**하며 머릿속 내레이션이 흐르는 장면처럼. 유저가 적은 생각을 따옴표로 그대로 인용하세요 (예: '그 순간 당신의 머릿속엔 \"내 아이디어가 별로인가 봐\"라는 말이 스쳐요.'). 2~3문장.",
      "emotion": "표정 클로즈업·배경음으로 **감정이 밀려오는 장면**처럼. 유저가 고른 감정 단어를 그대로 사용 (예: '어깨가 무거워지고, 불안과 초조가 동시에 차오릅니다.'). 1~2문장.",
      "body": "**몸이 보내는 신호**를 장면으로. 유저가 쓴 표현 그대로 담되 살짝 서사화 (예: '가슴이 꽉 조여오고, 그날 밤 잠이 쉽게 오지 않았어요.'). 1~2문장. 유저가 비워둔 경우 '이 장면에서 몸의 신호는 아직 적지 않으셨어요'.",
      "behavior": "**엔딩 시퀀스**처럼 묘사하세요. 주인공이 어떤 루틴으로 움직이고, 잠시 안도가 찾아왔다가, 다시 오프닝 장면으로 되돌아오는 순환을 2~3문장으로. 유저 자료에 없으므로 핵심 신념·자동사고에서 합리적으로 추론."
    },
    "nodes": [
      { "stage": "trigger",  "label": "핵심 키워드 **6글자 이내**. stage 이름(촉발 상황 등) 포함 금지. 예: '타인의 성공', '빈 주말', '평가 직전'", "description": "1~2문장. 이 단계가 유저에게 어떤 역할을 하는지 임상적 해석." },
      { "stage": "thought",  "label": "예: '나만 뒤처져', '더 해야 해'", "description": "..." },
      { "stage": "emotion",  "label": "예: '불안·자책', '초조'",         "description": "..." },
      { "stage": "body",     "label": "예: '가슴 답답', '불면'",         "description": "..." },
      { "stage": "behavior", "label": "예: '주말 과몰두', '새 목표'",    "description": "행동 + 일시적 안도 후 1단계로 복귀되는 강화 고리까지 포함." }
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
- pattern_cycle.nodes 는 **정확히 5개** (stage 순서: trigger → thought → emotion → body → behavior). 더 많거나 적으면 안 됩니다.
- **nodes[].label 은 반드시 6글자(한글 기준) 이내**. stage 이름(촉발 상황/자동 사고/감정/신체 반응/행동)을 label 앞에 붙이지 마세요. 콜론(:)도 금지. 핵심 키워드만.
- pattern_cycle.user_summary 의 5개 필드(trigger/thought/emotion/body/behavior)는 모두 비어있지 않은 문자열이어야 합니다.
- **headline 은 35자 이내 한 문장**, '패턴이에요'로 끝남. 화살표(→)나 단계 나열 금지.
- cross_validation.rows 는 정확히 4개 (차원 4개 모두 포함, 위 순서 유지).
- hidden_patterns.errors 는 1~3개. 유저 자료에 실제로 드러난 것만.
- 모든 description/interpretation/evidence는 150자 이내로 간결하게.
- **전문 용어 금지**: "과잉 추동", "정서적 회피", "자기 가치의 조건화", "인지적 오류", "자동적 사고", "촉발 자극" 등 임상 용어를 텍스트에 그대로 쓰지 마세요. 일상 언어로 풀어쓰기.
- user_summary는 **한 편의 영화 시나리오**처럼 장면·표정·몸짓·내레이션으로 묘사하는 '거울'이고, nodes.description은 임상적 해석의 '분석'입니다. 역할을 섞지 마세요.
- 어조: 따뜻하면서도 예리함. 판단·비난 금지. 유저의 표현을 구체적으로 인용.
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

    // label 6글자 초과 시 자동 축약 (LLM이 프롬프트를 어긴 경우 안전망)
    report.pattern_cycle.nodes = report.pattern_cycle.nodes.map((n) => {
      const stripped = n.label
        .replace(/^(촉발 상황|자동 사고|자동적 사고|감정|신체 반응|행동)\s*[:：]\s*/u, "")
        .trim();
      const trimmed = Array.from(stripped).slice(0, 8).join("");
      return { ...n, label: trimmed };
    });
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
