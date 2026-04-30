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
  type CognitiveErrorId,
} from "@/lib/self-workshop/cognitive-errors";
import { composeAutomaticThought } from "@/lib/self-workshop/compose-automatic-thought";
import {
  SCT_CATEGORIES,
  SCT_QUESTIONS,
  SCT_MIN_FOR_ANALYSIS,
  type SctCategoryCode,
} from "@/lib/self-workshop/sct-questions";
import {
  countAnsweredResponses,
  type BeliefAnalysis,
  type SctResponses,
  type Synthesis as BeliefSynthesis,
} from "@/lib/self-workshop/core-belief-excavation";

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

  const { diagnosis_scores, mechanism_analysis, core_belief_excavation } =
    progress;

  if (!diagnosis_scores || !mechanism_analysis) {
    return NextResponse.json(
      { error: "진단 결과와 실습 자료가 필요합니다" },
      { status: 400 }
    );
  }

  const existingExcavation =
    (core_belief_excavation as {
      sct_responses?: SctResponses;
      synthesis?: BeliefSynthesis;
      legacy_downward_arrow?: unknown;
      belief_analysis?: BeliefAnalysis;
    } | null) ?? null;
  const sctResponses: SctResponses = existingExcavation?.sct_responses ?? {};
  const sctAnsweredCount = countAnsweredResponses(sctResponses);

  if (sctAnsweredCount < SCT_MIN_FOR_ANALYSIS) {
    return NextResponse.json(
      {
        error: `핵심 신념 찾기(Step 4)에서 최소 ${SCT_MIN_FOR_ANALYSIS}문항 이상 작성이 필요해요`,
      },
      { status: 400 }
    );
  }

  /* ─── 입력 데이터 직렬화 ─── */

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

  const errorCatalog = COGNITIVE_ERRORS.map(
    (e) => `  - ${e.id} | 한글명: "${e.label}" | 영문명: "${e.englishLabel}" | ${e.definition}`
  ).join("\n");

  const sctSections = formatSctResponsesForPrompt(sctResponses);

  /* ─── 시스템 프롬프트 ─── */

  const systemPrompt = `# ROLE
당신은 1급 심리상담사이자 인지행동치료(CBT) 전문가, 그리고 정신분석학적 통찰을 갖춘 임상가입니다. 사용자가 Step 3(자동사고 자기보고)와 Step 4(핵심 신념 자기보고 — SCT 14문항)에서 자기보고한 데이터를 바탕으로, "Step 5 인지 패턴 통합 분석 리포트"를 생성합니다.

당신의 분석은 따뜻하지만 정확해야 하며, 진단하듯 단정짓지 않고 사용자가 자신의 패턴과 거리를 둘 수 있도록 돕는 거울 역할을 합니다.

# WRITING GUIDELINES (반드시 준수)
1. **톤 & 목소리**
   - '내담자', '환자' 같은 거리감 있는 표현 금지.
   - 따뜻하되 모호하지 않게, 단정하지 않되 흐릿하지 않게.
   - "~일 수 있습니다", "~가능성이 높습니다" 같은 추정 표현을 적절히 사용 — 진단이 아닌 거울.
   - 사용자를 고치려 하지 말고 보여주려 할 것.

1-1. **호칭 & 주어 규칙 — 매우 중요**
   - **'당신은' 직접 호칭 주어 절대 금지**. 문장 주어로 '당신은'을 쓰지 말 것.
   - 한국어 자연스럽게 **주어를 생략**하거나, '자신에게', '스스로', '자기 자신을' 같은 자기지칭을 사용.
   - **'당신의'·'당신에게서' 같은 소유/처소격은 절제해서 사용 가능**하지만, 가능하면 생략.

1-2. **극존칭 절대 금지**
   - "~하시며", "~하시는", "~느끼시며", "~보이시는", "~계시는" 같은 **'시'가 들어간 극존칭 형태 금지**.
   - 평이한 '-합니다'체로 통일: "~하며", "~하는", "~느끼며", "~보이는", "~있는".

1-3. **종결어미 규칙 — 매우 중요 (특히 belief_keywords[].explanation, insight_close, flow_insight 에 적용)**
   - **정의식 종결 절대 금지**: "~한 믿음입니다.", "~한 두려움입니다.", "~인 것입니다.", "~한 사고입니다." 처럼 사전 정의처럼 끝내지 말 것.
   - **관찰·평가식 종결 사용**: 사용자의 패턴을 임상가가 관찰·기술하는 톤으로.
     - 예시 종결: "~이라고 생각하는 경향이 있습니다.", "~하고 있을 가능성이 큽니다.", "~로 보이고 있습니다.", "~로 작동하고 있는 것 같습니다.", "~하게 반응하는 패턴이 관찰됩니다.", "~로 자기 자신을 인식하고 있는 것으로 보입니다."
   - **잘못된 예 vs 올바른 예** (belief_keywords[].explanation):
     - ❌ (정의식) "자신의 가치를 내면의 고유한 존재감이 아닌, 눈에 보이는 성과나 경제적 성공과 직접적으로 연결하는 믿음입니다."
     - ❌ (당신은 사용) "당신은 자신의 가치를 내면의 고유한 존재감이 아닌, 눈에 보이는 성과나 경제적 성공과 직접적으로 연결하는 경향을 보이고 있습니다."
     - ❌ (극존칭) "자신에게 근본적인 결함이 있다고 느끼시며, 이것이 타인에게 알려지면 혹독한 평가와 관계의 단절로 이어질 것이라고 생각하시는 경향이 있습니다."
     - ✅ "자신의 가치를 내면의 고유한 존재감이 아닌, 눈에 보이는 성과나 경제적 성공과 직접적으로 연결하는 경향을 보이고 있습니다."
     - ✅ "자신에게 근본적인 결함이 있다고 느끼며, 이것이 타인에게 알려지면 혹독한 평가와 관계의 단절로 이어질 것이라고 생각하는 경향이 있습니다."

2. **인용 규칙**
   - 사용자 응답을 인용할 때는 반드시 원문 그대로 큰따옴표 안에 넣을 것.
   - Step 4 응답은 문항 코드(A1~D3)를 source_code에 명시.
   - Step 3 응답은 어떤 필드인지 source_code에 명시 (예: "최악의 시나리오", "추가질문 체크", "자기 정의").

3. **분석의 깊이**
   - 단순 요약 금지. 사용자가 스스로 미처 알아채지 못한 연결고리를 발견해 보여줄 것.
   - 표면적 행동(behavior)과 그 아래 동기(핵심 신념)를 반드시 연결시킬 것.

4. **핵심 신념 키워드 추출 원칙**
   - 4개 카테고리(A/B/C/D)를 그대로 4개 키워드로 만들지 말 것.
   - 14개 응답 전체를 가로지르는 **반복되는 주제**를 발견해 정확히 3개로 응축할 것.
   - 각 키워드는 사용자가 "아, 이게 내 안에 있었구나"라고 알아챌 수 있도록 그 사람의 언어로 번역할 것.

5. **자동사고 한 문장 요약 원칙**
   - automatic_thoughts 리스트를 그대로 이어붙이지 말 것.
   - 그 사고들이 가리키는 하나의 핵심 명제로 응축할 것.
   - 형식: "나는 [상태]이고, [결과 예측]이다" 또는 "나는 [정체성]이며, 그래서 ~ 해야 한다".

6. **인지 왜곡 선택 원칙**
   - 11개 표준 중 실제 데이터에서 관찰되는 것만 3~6개 선택. 짜맞추지 말 것.
   - 각 왜곡마다 사용자 응답에서 직접 인용한 증거 1개 제시.

7. **행동 패턴 Loop 작성 원칙**
   - stages의 'name'은 일반화된 성취 중독 사이클의 단계 이름을 따를 것 (불안 신호 / 자기 비난 / 압박 가속 / 일시적 안도 / 새 과제 추가 / 결과 지연).
   - 'user_case'는 단계의 일반적 의미와 이 사용자의 구체적 응답을 **한 문장에 통합**해서 작성. 사용자 응답의 표현·단어를 자연스럽게 녹여 넣되, 단계 이름과 의미가 함께 전달되도록.
   - 별도의 일반 description은 출력하지 말 것 — user_case 한 줄로 통합.

8. **금지사항**
   - "당신은 ~입니다"라고 단정하지 말 것. "~로 보입니다", "~로 작동하고 있을 가능성이 큽니다"로 표현.
   - 응답 데이터에 없는 내용을 추측해서 추가하지 말 것. 분석은 반드시 자기보고에 근거.
   - 임상 용어(EMS, 도식, 스키마, 병리적 등)를 키워드 명제·설명에 노출 금지. clinical_name 한 곳에만 학술적 명명을 허용.

# OUTPUT — 반드시 아래 단일 JSON 객체로만 응답
JSON 외 다른 텍스트(설명, markdown 코드펜스) 절대 포함 금지.

{
  "situation_summary": {
    "trigger_quote": "Step 3의 recent_situation을 가공 없이 그대로 인용",
    "automatic_thought_summary": "automatic_thought + self_definition + worst_case를 통합한 한 문장. 사용자가 '내 마음 속에 이 한 문장이 있었구나'라고 알아챌 수 있는 핵심 명제. 형식: '나는 ~이고, ~이다' 또는 '나는 ~이며, 그래서 ~해야 한다'.",
    "cascade": [
      { "label": "트리거", "content": "(situation 요약 한 줄)", "transition": "(이 인식이 어떤 인지적 점프를 일으켰는지 한 줄)" },
      { "label": "1차 자동사고", "content": "(automatic_thought 또는 candidate_thoughts[0] 직접 인용)", "transition": "(예: '즉시 미래로 점프', '과거 결합', '행동 명령')" },
      { "label": "2차 자동사고", "content": "(다음 자동사고 인용)", "transition": "(인지적 전환의 성격)" },
      { "label": "자기 정의", "content": "(self_definition 인용 또는 사용자 표현)", "transition": "(...)" },
      { "label": "신체 신호", "content": "(body_response 인용)", "transition": "(신경계 해석 한 줄 — 예: '교감신경 각성')" },
      { "label": "행동", "content": "(resulting_behavior 인용)" }
    ],
    "flow_insight": "💡 이 흐름의 핵심을 1~2문장으로. 단순 요약이 아니라 패턴의 이름을 부여할 것 — '~로 자동 설정되어 있다' 같은 문법으로."
  },
  "belief_keywords": [
    {
      "proposition": "[1인칭 명제 — 그 사람의 언어로. 예: '멈추면 무가치해진다']",
      "clinical_name": "[임상적 명명. 예: '조건부 자기 가치(Conditional Self-Worth)']",
      "explanation": "이 신념이 사용자에게서 어떻게 작동하고 있는지 1~2문장. **반드시 관찰·평가식 종결로** ('~하는 경향이 있습니다', '~로 보이고 있습니다', '~하고 있을 가능성이 큽니다' 등). 사전 정의처럼 '~한 믿음입니다' / '~한 두려움입니다' 로 끝내지 말 것. **'당신은' 직접 호칭 주어 금지** — 주어 생략하거나 '자신에게', '스스로'를 사용. **극존칭('~하시며', '~느끼시며') 금지** — 평이한 '~하며', '~느끼며'를 사용.",
      "evidence": [
        { "source_code": "[A1~D3 SCT 코드 또는 'Step 3:최악의 시나리오' 같은 필드명]", "id": "[2~6자 짧은 라벨. SCT면 코드 그대로(B2), Step 3 필드면 첫 글자 약자(S3, Q14 등). 카드의 ID 셀 배지에 표시]", "stage": "[자기보고 단계명. 예: 'Stage B', 'Step 3 · 추가질문', 'Step 3 · 자기 정의'. 임상 리포트의 SOURCE 셀에 표시]", "quote": "[사용자 원문 그대로 인용]", "reasoning": "[그것이 이 키워드를 시사하는 이유 한 줄]" },
        { "source_code": "...", "id": "...", "stage": "...", "quote": "...", "reasoning": "..." },
        { "source_code": "...", "id": "...", "stage": "...", "quote": "...", "reasoning": "..." }
      ],
      "insight_close": "→ 이 키워드가 사용자의 삶에서 어떻게 작동하는지 통찰적 한 문장 마무리. 관찰·평가식 종결('~하고 있는 것으로 보입니다', '~하게 만들고 있을 가능성이 큽니다'). '당신은' 주어 금지 / 극존칭 금지."
    },
    { "proposition": "...", "clinical_name": "...", "explanation": "...", "evidence": [...최소 3개, 각 항목에 id·stage 포함...], "insight_close": "..." },
    { "proposition": "...", "clinical_name": "...", "explanation": "...", "evidence": [...최소 3개, 각 항목에 id·stage 포함...], "insight_close": "..." }
  ],
  "achievement_loop": {
    "intro": "세 가지 핵심 신념(키워드1 압축 + 키워드2 압축 + 키워드3 압축)이 합쳐지면서, 당신의 행동에는 다음과 같은 순환 고리(loop)가 반복될 가능성이 큽니다. 형식의 한 문단.",
    "stages": [
      { "step": 1, "name": "불안 신호",  "name_en": "ANXIETY SIGNAL",  "source": "[A1~D3 또는 비움]", "intensity": 0.86, "user_case": "[단계의 일반적 의미와 사용자의 구체적 응답에서 가져온 표현·단어를 자연스럽게 녹인 한 문장. 별도 description 없이 이 한 문장만으로 단계가 무엇인지 + 사용자에게서 어떻게 나타나는지를 함께 설명. 관찰·평가식 종결 사용]" },
      { "step": 2, "name": "자기 비난",  "name_en": "SELF-CRITICISM",  "source": "...", "intensity": 0.0~1.0, "user_case": "..." },
      { "step": 3, "name": "압박 가속",  "name_en": "PRESSURE",        "source": "...", "intensity": 0.0~1.0, "user_case": "..." },
      { "step": 4, "name": "일시적 안도","name_en": "RELIEF",          "source": "...", "intensity": 0.0~1.0, "user_case": "..." },
      { "step": 5, "name": "새 과제 추가","name_en": "TASK ESCALATION", "source": "...", "intensity": 0.0~1.0, "user_case": "..." },
      { "step": 6, "name": "결과 지연",  "name_en": "OUTCOME DELAY",   "source": "...", "intensity": 0.0~1.0, "user_case": "..." }
    ],
    "core_mechanism": {
      "safe_action": "[사용자가 무의식적으로 안전하게 머무르는 행동 — 1~2단어]",
      "avoided_action": "[그래서 회피되는 행동 — 1~2단어]",
      "avoidance_mechanism": "[회피의 메커니즘 — '결과를 내지 않음으로써' 같은 동명사형 한 줄]",
      "strongest_fear": "[Step 4에서 가장 강한 두려움 — 원문 인용 + (코드) 표기. 예: '타인의 가십거리가 됨(C2)']",
      "second_fear": "[두 번째로 강한 두려움 — 원문 인용 + (코드) 표기]",
      "core_behavior": "[사용자의 핵심 행동 — 1~2단어. 예: '바쁜 노력']"
    },
    "cycle_time": "[추정 사이클 길이 한 줄. 예: '~3.2 days' 또는 '~수 시간'. 사용자 응답에서 단서가 약하면 '~며칠 단위' 같은 모호한 표현 가능]",
    "observed_text": "[빈도 묘사 한 줄. 예: '14d 동안 4.4× 관찰됨' 또는 '응답 전반에서 반복 관찰됨'. 단정적 수치가 어색하면 일반 표현으로]",
    "loopback_text": "[06 → 01로 돌아가는 한 줄. 예: '더 큰 불안과 함께 다시 시작'. 마지막 단계가 첫 단계 강도를 더 키우는 메시지로 작성]"
  },
  "cognitive_distortions": [
    {
      "id": "[아래 11개 화이트리스트의 snake_case id 중 하나]",
      "name_ko": "[한글명 — 카탈로그 그대로]",
      "name_en": "[영문명 — 카탈로그 그대로]",
      "quote": "[사용자 응답에서 가장 분명한 증거 직접 인용]",
      "interpretation": "이 왜곡이 어떻게 작동하고 있는지 1~2문장 해석",
      "severity": 0.0,
      "frequency": 0.0
    }
    // 3~6개 (실제 관찰된 것만). severity=개입 우선도(0~1), frequency=응답 전반에서 관찰된 빈도(0~1).
    // severity는 인용의 강도·자기파괴성 기준, frequency는 비슷한 패턴이 다른 응답에서도 반복되는 정도.
  ],
  "cognitive_distortions_meta": {
    "observed": "[관찰된 왜곡 개수 정수 — cognitive_distortions 배열 길이와 일치]",
    "total_known": 12,
    "cooccurrence": "[동시 발생 지수 0~1 한 자리 소수. 위 왜곡들이 서로 얼마나 자주 함께 나타나는지 추정. 1.0에 가까울수록 한 사고 흐름에서 동시에 작동]",
    "implication": "[1~2문장 결론. 가장 효과적인 개입 우선순위 또는 이 왜곡 조합의 함축. 예: 'SEVERITY가 가장 높은 재앙화·명명하기부터 검증과 재구성에 들어가는 것이 가장 효과적입니다.']"
  },
  "destroy_rebuild_preview": {
    "keyword_propositions": ["[키워드1 명제]", "[키워드2 명제]", "[키워드3 명제]"],
    "target_automatic_thought": "[사용자의 자동사고 중 가장 강한 것 — 직접 인용]",
    "target_checklist_item": "[사용자가 체크한 추가질문 항목 중 하나 — 없으면 빈 문자열]"
  },

  // ─── 다운스트림(Step 6/9) 호환 — 반드시 함께 채울 것 ───
  "cognitive_errors": {
    "intro": "사용자의 자동사고 한 문장 요약과 이번 섹션의 흐름을 1~2문장으로 여는 말. (위 cognitive_distortions의 인트로 역할)",
    "items": [
      // cognitive_distortions와 동일한 항목을 내려보내되, 이 형식으로:
      { "id": "[snake_case id]", "name": "[한글명]", "definition": "[강의 톤 한 줄 정의]", "interpretation": "[해석 1~2문장]" }
    ],
    "closing": "1~2문장 마무리. 다음 섹션으로 자연스러운 연결."
  },
  "pattern_cycle": {
    "headline": "사용자 패턴에 이름을 붙이는 한 줄. '패턴이에요'로 끝나는 35자 이내. 화살표(→) 금지.",
    "overview": "2~3문장. 왜 이 패턴이 반복 강화되는지. 사용자 원문 1~2개 직접 인용.",
    "nodes": [
      { "stage": "trigger",     "label": "6글자 이내", "description": "1~2문장" },
      { "stage": "thought",     "label": "6글자 이내", "description": "1~2문장" },
      { "stage": "emotion",     "label": "6글자 이내", "description": "1~2문장" },
      { "stage": "body",        "label": "6글자 이내", "description": "1~2문장" },
      { "stage": "behavior",    "label": "6글자 이내", "description": "1~2문장" },
      { "stage": "core_belief", "label": "6글자 이내 — keyword_propositions[0]을 압축", "description": "2~3문장. 닫힌 고리 설명." }
    ]
  }
}

# 인지 왜곡 카탈로그 (cognitive_distortions[].id 와 cognitive_errors.items[].id는 반드시 이 목록에서만 선택)
${errorCatalog}

# 추가 규칙
- belief_keywords는 정확히 3개. 4 이상도, 2 이하도 안 됨.
- belief_keywords[].evidence 는 최소 3개. 각 evidence는 source_code 외에 id(짧은 라벨)·stage(단계명)도 함께 채워야 합니다.
- achievement_loop.stages 는 정확히 6개, step 1~6 순서대로. 각 stage는 name·name_en·intensity·user_case를 모두 포함. source는 가장 강한 단서가 있는 SCT 코드를 넣고, 단서가 약하면 빈 문자열.
- achievement_loop.cycle_time/observed_text/loopback_text 는 추정 한 줄로 채웁니다. 단정적 수치가 어색하면 일반 표현으로 (예: '~수 시간', '응답 전반에서 반복 관찰됨').
- cognitive_distortions[].severity 는 개입 우선도(인용의 강도·자기파괴성). frequency 는 같은 패턴이 다른 응답에서도 반복되는 정도. 둘 다 0.0~1.0 범위 한 자리 소수.
- cognitive_distortions_meta.observed 는 cognitive_distortions 배열 길이와 정확히 일치해야 합니다.
- pattern_cycle.nodes 는 정확히 6개, 순서: trigger → thought → emotion → body → behavior → core_belief.
- pattern_cycle.nodes[].label 은 6글자(한글) 이내. stage 이름을 label 앞에 붙이지 마세요. 콜론(:) 금지.
- cognitive_errors.items 는 cognitive_distortions와 같은 id를 사용하되, name은 한글명(name_ko 그대로), definition은 카탈로그의 톤으로 짧게.
- 사용자가 건너뛴(skipped) SCT 문항은 무시.
- 위기 신호(자해/자살 사고)가 감지되면 분석 대신 즉시 전문가 연결 안내로 응답을 전환하지 말고, 일단 본 JSON으로 응답하되 flow_insight에 "전문가 상담 권유"를 포함.

# FINAL CHECK (출력 직전 자가 검증)
- 모든 인용이 사용자 원문 그대로인가?
- 핵심 신념 키워드 3개가 4개 카테고리를 가로지르는 통합적 추출인가?
- 자동사고 한 문장 요약이 진짜로 '한 문장'으로 응축되었는가?
- 인지 왜곡이 짜맞춤이 아니라 데이터에서 관찰된 것인가?
- pattern_cycle.nodes[5].label 이 belief_keywords[0].proposition을 6글자로 압축한 것인가?`;

  const userMessage = `## 진단 결과 (리커트 5점 척도 20문항)
- 총점: ${diagnosis_scores.total}/100
- 레벨: ${diagnosis_scores.level} (${diagnosis_scores.levelName})
- 영역별 점수 (각 /25):
  - conditional_self_worth (자기 가치의 조건화): ${diagnosis_scores.dimensions.conditional_self_worth}
  - compulsive_striving (과잉 추동): ${diagnosis_scores.dimensions.compulsive_striving}
  - fear_of_failure (실패 공포/완벽주의): ${diagnosis_scores.dimensions.fear_of_failure}
  - emotional_avoidance (정서적 회피): ${diagnosis_scores.dimensions.emotional_avoidance}

## Step 3 자기보고 — 자동사고 5-Part (사건 단위)
- 최근 불편했던 상황(트리거): ${mechanism_analysis.recent_situation ?? "미작성"}
- 가장 강했던 감정·강도: ${emotionStrengthLine}
- 머릿속에 스쳐 지나간 생각들(후보 전체): ${candidatesText}
- 상황에 대한 생각(감정과 가장 직접 연결): "${primaryThought || "미작성"}"
- 생각으로 인한 결과(최악의 시나리오): "${worstCaseResult || "미작성"}"
- 완성된 자동사고(상황에 대한 생각 + 그로 인한 결과): "${composedThought || "미완성"}"
- 그때 떠오른 장면·이미지: ${thoughtImage ? `"${thoughtImage}"` : "비움"}
- 남들에게 내가 어떤 사람으로 보여질까: ${socialPerception ? `"${socialPerception}"` : "비움"}
- 추가질문 체크(자주 떠오르는 비슷한 생각들): ${checkedText}
- 감정 전체(핵심 + 동반): ${eb.emotions?.join(", ") ?? "없음"}
- 신체 반응: ${eb.body_text ?? "미작성"}
- 그 생각으로 인한 실제 행동: ${resultingBehavior ? `"${resultingBehavior}"` : "미작성"}
- 자기 정의(자유텍스트): ${cb.about_self ?? "미작성"}

## Step 4 자기보고 — SCT 14문항 (삶 전반의 패턴)
사용자가 미완성 문장에 짧게 채운 응답입니다. (건너뜀) 표시는 무시하세요.

${sctSections}

## 통합 분석 지침
- belief_keywords 는 위 SCT 14개 응답 + Step 3의 자기 정의/추가질문 체크/최악의 시나리오 등을 통합해 가장 강하게 작동하는 3개 키워드로 응축하세요.
- destroy_rebuild_preview.target_automatic_thought 는 이 사용자의 가장 강한 자동사고 — 다음 우선순위로 선택: ① 완성된 자동사고("${composedThought}"), ② primary 자동사고, ③ candidate_thoughts[0].
- destroy_rebuild_preview.target_checklist_item 은 추가질문 체크 항목 중 가장 강렬한 1개. 체크된 항목이 없으면 빈 문자열.
- core_mechanism.strongest_fear / second_fear 는 SCT C/D 카테고리에서 두려움 관련 응답을 우선 인용 (C2, C3, D3 등) — 형식: "원문 인용 (코드)".
- pattern_cycle.nodes[5] 의 label 은 belief_keywords[0].proposition을 6글자 이내로 압축. description은 keyword_propositions의 닫힌 고리를 설명.`;

  try {
    const response = await chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      {
        model: "gemini-2.5-pro",
        temperature: 0.6,
        max_tokens: 16384,
        response_format: { type: "json_object" },
      }
    );

    const parsed = safeJsonParse<unknown>(response);

    if (!isAnalysisReport(parsed)) {
      console.error("analyze-mechanism: AnalysisReport 스키마 검증 실패", parsed);
      return NextResponse.json(
        { error: "분석 결과 형식이 올바르지 않습니다. 다시 시도해 주세요." },
        { status: 500 }
      );
    }
    const report: AnalysisReport = parsed;

    /* ─── 후처리: pattern_cycle.label 길이 보정 + cognitive_errors id 화이트리스트 + 중복 제거 ─── */

    report.pattern_cycle.nodes = report.pattern_cycle.nodes.map((n) => {
      const stripped = n.label
        .replace(
          /^(촉발 상황|자동 사고|자동적 사고|감정|신체 반응|행동|핵심 신념|핵심신념)\s*[:：]\s*/u,
          ""
        )
        .trim();
      const trimmed = Array.from(stripped).slice(0, 8).join("");
      return { ...n, label: trimmed };
    });

    const seenErrorIds = new Set<CognitiveErrorId>();
    report.cognitive_errors.items = report.cognitive_errors.items.filter(
      (item) => {
        if (!COGNITIVE_ERROR_IDS.includes(item.id)) return false;
        if (seenErrorIds.has(item.id)) return false;
        seenErrorIds.add(item.id);
        return true;
      }
    );

    const seenDistortionIds = new Set<CognitiveErrorId>();
    report.cognitive_distortions = report.cognitive_distortions.filter(
      (item) => {
        if (!COGNITIVE_ERROR_IDS.includes(item.id)) return false;
        if (seenDistortionIds.has(item.id)) return false;
        seenDistortionIds.add(item.id);
        return true;
      }
    );

    if (
      report.cognitive_errors.items.length < 1 ||
      report.cognitive_distortions.length < 3
    ) {
      console.error(
        "analyze-mechanism: 후처리 후 인지 왜곡 항목이 부족합니다"
      );
      return NextResponse.json(
        { error: "분석 결과 형식이 올바르지 않습니다. 다시 시도해 주세요." },
        { status: 500 }
      );
    }

    /* ─── core_belief_excavation 호환 필드 동기화 (Step 6/8 prefill) ─── */

    const beliefLine = report.belief_keywords[0].proposition.trim();
    const synthesis: BeliefSynthesis = {
      belief_line: beliefLine,
      how_it_works: report.belief_keywords[0].insight_close.trim(),
      reframe_invitation:
        report.destroy_rebuild_preview.target_automatic_thought.trim().length > 0
          ? `"${report.destroy_rebuild_preview.target_automatic_thought.trim()}" — 이것이 진실이 아니라 ${report.belief_keywords[0].clinical_name}에서 자라난 오래된 믿음일 수 있어요.`
          : `이것은 진실이 아니라 ${report.belief_keywords[0].clinical_name}에서 자라난 오래된 믿음일 수 있어요.`,
    };

    const beliefAnalysisPublic: BeliefAnalysis = {
      belief_about_self: beliefLine,
      belief_about_others:
        report.belief_keywords[1]?.proposition?.trim() ||
        "(아직 충분한 단서가 없어요)",
      belief_about_world:
        report.belief_keywords[2]?.proposition?.trim() ||
        "(아직 충분한 단서가 없어요)",
      dominant_schemas: report.belief_keywords.slice(0, 2).map((k) => ({
        ems_code: "AS",
        natural_label_ko: `${k.proposition}는 ${k.clinical_name}의 안경`,
        strength: "strong" as const,
      })),
      evidence_quotes: report.belief_keywords
        .flatMap((k) =>
          k.evidence.slice(0, 2).map((e) => ({
            sct_code: e.source_code,
            category_ko: resolveCategoryFromSourceCode(e.source_code),
            quote: e.quote,
          }))
        )
        .slice(0, 6),
      generated_at: new Date().toISOString(),
    };

    const mergedExcavation = {
      ...(existingExcavation ?? {}),
      sct_responses: sctResponses,
      belief_analysis: beliefAnalysisPublic,
      synthesis,
    };

    /* ─── DB 저장 ─── */

    await supabase
      .from("workshop_progress")
      .update({
        mechanism_insights: report,
        core_belief_excavation: mergedExcavation,
        current_step: Math.max(6, progress.current_step ?? 5),
      })
      .eq("id", workshopId);

    return NextResponse.json({
      report,
      belief_analysis: beliefAnalysisPublic,
    });
  } catch (err) {
    console.error("Gemini 분석 실패:", err);
    return NextResponse.json(
      { error: "AI 분석에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}

/* ─────────────────────────── 헬퍼 ─────────────────────────── */

function formatSctResponsesForPrompt(responses: SctResponses): string {
  const grouped: Record<SctCategoryCode, string[]> = {
    A: [],
    B: [],
    C: [],
    D: [],
  };
  for (const q of SCT_QUESTIONS) {
    const r = responses[q.code];
    const value =
      r && !r.skipped && r.answer.trim().length > 0
        ? `"${r.answer.trim()}"`
        : "(건너뜀)";
    grouped[q.category].push(`${q.code}. ${q.prompt} → ${value}`);
  }
  return (Object.keys(grouped) as SctCategoryCode[])
    .map(
      (code) =>
        `[${code}. ${SCT_CATEGORIES[code].labelKo}]\n${grouped[code].join("\n")}`
    )
    .join("\n\n");
}

/**
 * BeliefEvidence.source_code(예: "A1", "B3", "Step 3:최악의 시나리오") 에서
 * Step 4 카테고리 한국어 라벨을 역추적. 매칭 안 되면 일반 라벨로 폴백.
 */
function resolveCategoryFromSourceCode(code: string): string {
  const trimmed = code.trim();
  const first = trimmed.charAt(0).toUpperCase();
  if (first === "A" || first === "B" || first === "C" || first === "D") {
    return SCT_CATEGORIES[first as SctCategoryCode].labelKo;
  }
  return "Step 3 자기보고";
}
