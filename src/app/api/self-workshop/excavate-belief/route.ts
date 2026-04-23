import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import {
  isAnalysisReport,
  type AnalysisReport,
} from "@/lib/self-workshop/analysis-report";

interface Answers {
  selected_hot_thought: string;
  q1_consequence: string;
  q2_fear: string;
  q3_identity: string;
  q4_origin: string;
  q5_compassion: string;
}

interface HypothesizeResult {
  core_belief: string;
}

interface SynthesizeResult {
  belief_line: string;
  how_it_works: string;
  reframe_invitation: string;
}

interface CandidatesResult {
  candidates: string[];
}

interface MechanismAnalysis {
  automatic_thought?: string;
  common_thoughts_checked?: string[];
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const body = await req.json();
  const {
    workshopId,
    phase,
    answers,
    hotThought: hotThoughtInput,
    q1Answer,
    q2Answer,
  } = body as {
    workshopId: string;
    phase:
      | "generate-candidates"
      | "generate-options-q1"
      | "generate-options-q2"
      | "generate-options-q3"
      | "hypothesize"
      | "synthesize";
    answers?: Answers;
    hotThought?: string;
    q1Answer?: string;
    q2Answer?: string;
  };

  if (!workshopId || !phase) {
    return NextResponse.json(
      { error: "요청 파라미터가 부족합니다" },
      { status: 400 }
    );
  }

  const { data: progress } = await supabase
    .from("workshop_progress")
    .select("*")
    .eq("id", workshopId)
    .single();

  if (!progress || progress.user_id !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const insights: AnalysisReport | null = isAnalysisReport(
    progress.mechanism_insights
  )
    ? progress.mechanism_insights
    : null;

  if (!insights) {
    return NextResponse.json(
      { error: "Step 4 리포트가 필요합니다" },
      { status: 400 }
    );
  }

  const aiThoughtLabel =
    insights.pattern_cycle.nodes.find((n) => n.stage === "thought")?.label ??
    "";

  const existing =
    (progress.core_belief_excavation as {
      answers?: Answers;
      mid_hypothesis?: {
        hot_thought: string;
        core_belief: string;
        generated_at: string;
      };
      synthesis?: SynthesizeResult;
    } | null) ?? null;

  try {
    if (phase === "generate-candidates") {
      const mechanism = (progress.mechanism_analysis ?? {}) as MechanismAnalysis;
      const result = await runGenerateCandidates(
        mechanism.automatic_thought ?? "",
        mechanism.common_thoughts_checked ?? [],
        aiThoughtLabel,
        insights.pattern_cycle.headline
      );
      return NextResponse.json({ candidates: result.candidates });
    }

    if (
      phase === "generate-options-q1" ||
      phase === "generate-options-q2" ||
      phase === "generate-options-q3"
    ) {
      const hotThought =
        (hotThoughtInput && hotThoughtInput.trim()) ||
        existing?.answers?.selected_hot_thought ||
        aiThoughtLabel;

      if (!hotThought) {
        return NextResponse.json(
          { error: "뜨거운 생각이 필요합니다" },
          { status: 400 }
        );
      }

      const options = await runGenerateQuestionOptions(
        phase,
        hotThought,
        q1Answer ?? "",
        q2Answer ?? ""
      );
      return NextResponse.json({ options });
    }

    if (!answers) {
      return NextResponse.json(
        { error: "answers가 필요합니다" },
        { status: 400 }
      );
    }

    const hotThought = answers.selected_hot_thought || aiThoughtLabel;

    if (phase === "hypothesize") {
      const result = await runHypothesize(hotThought, answers);
      const mid_hypothesis = {
        hot_thought: hotThought,
        core_belief: result.core_belief,
        generated_at: new Date().toISOString(),
      };

      // answers는 프론트엔드의 auto-save가 원본 구조(q1_selected/q1_custom 등)로
      // 이미 관리하므로 여기서는 덮어쓰지 않고 mid_hypothesis만 갱신.
      const merged = {
        ...(existing ?? {}),
        mid_hypothesis,
      };

      await supabase
        .from("workshop_progress")
        .update({ core_belief_excavation: merged })
        .eq("id", workshopId);

      return NextResponse.json({ hypothesis: mid_hypothesis });
    }

    if (phase === "synthesize") {
      const result = await runSynthesize(
        hotThought,
        answers,
        existing?.mid_hypothesis?.core_belief
      );

      const merged = {
        ...(existing ?? {}),
        synthesis: result,
      };

      await supabase
        .from("workshop_progress")
        .update({
          core_belief_excavation: merged,
          current_step: Math.max(6, progress.current_step ?? 5),
        })
        .eq("id", workshopId);

      return NextResponse.json({ synthesis: result });
    }

    return NextResponse.json({ error: "알 수 없는 phase" }, { status: 400 });
  } catch (err) {
    console.error("excavate-belief 실패:", err);
    return NextResponse.json(
      { error: "AI 처리에 실패했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}

/* ─────────────── Phase 0: Generate Candidates ─────────────── */

async function runGenerateCandidates(
  automaticThought: string,
  commonThoughtsChecked: string[],
  aiThoughtLabel: string,
  patternHeadline: string
): Promise<CandidatesResult> {
  const rawInputs = [
    automaticThought,
    aiThoughtLabel,
    ...commonThoughtsChecked,
  ].filter((t) => t.trim().length > 0);

  const systemPrompt = `당신은 CBT 전문 심리학자입니다.

## 작업
유저가 스트레스 상황에서 경험한 자동적 사고 원본들을 분석해서, **서로 다른 심리적 주제의 핵심 생각 3~5개**를 추출해 주세요.

## 핵심 규칙: 주제 중복 절대 금지

아래 6가지 심리 카테고리를 기준으로 분류하세요. **같은 카테고리에서 2개 이상 뽑지 마세요.**

| 카테고리 | 핵심 감정 | 예시 |
|----------|-----------|------|
| 비교/열등감 | 나만 못하다 | "남들은 다 잘하는데 나만..." |
| 무능감 | 능력이 없다 | "나는 못한다", "애써도 안 된다" |
| 무력감/체념 | 통제 불가 | "나는 할 수 없다", "어차피 안 돼" |
| 조바심/압박 | 빨리 해야 한다 | "더 해야 해", "시간이 없어" |
| 자기비난 | 내 잘못이다 | "왜 나는 이것밖에 안 될까" |
| 두려움/불안 | 나쁜 일이 올 것 | "다 망할 거야", "버림받을 거야" |

**중복 판단 기준**: "나만 뒤처져", "내가 지금 뒤쳐지고 있어", "나 빼고 다 앞서가고 있다", "남들은 다 잘하고 있는데 나만…"은 모두 **비교/열등감** 카테고리이므로 이 중 **딱 1개만** 남기세요.

## 추출 규칙
1. **장문 분리**: 유저가 한 문장에 여러 생각을 이어 쓴 경우(예: "나만 뒤쳐지고 있다 나 빼고 다 앞서가고 있다 애도했는데 나는 못한다 나는 할 수 없다"), 의미 단위로 분리한 뒤 카테고리를 배정하세요.
2. **카테고리당 1개**: 같은 카테고리의 생각이 여러 개이면 가장 강렬한 표현 1개만 남기세요.
3. 원본에서 3개 미만의 서로 다른 카테고리만 나온 경우, 패턴 맥락에서 자연스럽게 나올 수 있는 **다른 카테고리의** 생각 1~2개를 추가하세요.
4. 각 생각은 15자 이내, 1인칭 내면의 목소리 톤.

## 응답 형식
반드시 아래 JSON 단일 객체로 응답하세요.
{
  "candidates": ["생각1", "생각2", "생각3"]
}
- 3~5개. JSON 외 텍스트 절대 포함 금지.`;

  const userMessage = `## 패턴 맥락
${patternHeadline}

## 유저의 자동적 사고 원본
${rawInputs.map((t, i) => `${i + 1}. "${t}"`).join("\n")}

위 원본들을 카테고리별로 분류하고, 카테고리당 1개씩만 남겨서 서로 다른 주제의 핵심 생각 3~5개를 추출해 주세요.`;

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    {
      model: "gemini-2.5-flash",
      temperature: 0.4,
      max_tokens: 512,
      response_format: { type: "json_object" },
    }
  );

  const parsed = safeJsonParse<{ candidates: string[] }>(response);
  const result = (parsed?.candidates ?? []).filter(
    (t) => typeof t === "string" && t.trim().length > 0
  );

  if (result.length === 0) {
    const fallback = [...new Set(rawInputs)].slice(0, 4);
    return { candidates: fallback.length > 0 ? fallback : ["나는 부족하다"] };
  }

  return { candidates: result.slice(0, 5) };
}

/* ─────────────── Phase 1: Hypothesize ─────────────── */

async function runHypothesize(
  hotThought: string,
  answers: Answers
): Promise<HypothesizeResult> {
  const systemPrompt = `당신은 CBT 전문 심리학자입니다. 유저가 Downward Arrow 기법(결과→두려움→정체성)으로 적은 Q1~Q3 답변을 바탕으로, 그 사람이 믿고 있는 **핵심 믿음 한 줄**을 정제해 제시합니다.

규칙:
- 결과는 반드시 아래 JSON 단일 객체로 응답하세요. 배열로 감싸지 마세요.

{
  "core_belief": "유저가 자기 자신에 대해 믿고 있는 핵심 명제 1문장. 반드시 '나는 ~한 사람이다' 또는 '나의 가치는 ~에 달려 있다' 같은 **완성형 문장** 1줄. 60자 이내."
}

- 유저의 Q3(정체성 언명)을 기반으로 하되, Q1(예상 결과)과 Q2(핵심 두려움)의 맥락을 반영해 다듬을 것.
- '나는 성과가 없으면 가치 없는 사람이다' 같은 **자기 정체성 언명** 톤.
- 판단·비난 금지. '(인지적 오류)' 같은 임상 용어 금지.
- JSON 외 텍스트 절대 포함 금지.`;

  const userMessage = `## 유저가 선택한 뜨거운 생각
"${hotThought}"

## 유저의 Downward Arrow 답변
Q1. 이 생각이 사실이라면, 어떤 일이 벌어지나요? (예상 결과)
→ ${answers.q1_consequence}

Q2. 그게 진짜 일어난다면, 가장 두려운 건 뭔가요? (핵심 두려움)
→ ${answers.q2_fear}

Q3. 그 두려움은 결국, 당신이 어떤 사람이라고 말하고 있나요? (자기 정체성)
→ 나는 ${answers.q3_identity}

위 세 답변을 종합해서, 유저가 자신에 대해 믿고 있는 핵심 믿음 1줄을 JSON으로 응답하세요.`;

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    {
      model: "gemini-2.5-pro",
      temperature: 0.5,
      max_tokens: 512,
      response_format: { type: "json_object" },
    }
  );

  const parsed = safeJsonParse<HypothesizeResult>(response);
  if (
    !parsed ||
    typeof parsed.core_belief !== "string" ||
    parsed.core_belief.trim().length === 0
  ) {
    throw new Error("hypothesize 결과 형식이 올바르지 않습니다");
  }
  return { core_belief: parsed.core_belief.trim() };
}

/* ─────────────── Phase 2: Synthesize ─────────────── */

async function runSynthesize(
  hotThought: string,
  answers: Answers,
  midBelief: string | undefined
): Promise<SynthesizeResult> {
  const systemPrompt = `당신은 CBT + 자기 연민 치료 전문 심리학자입니다. 유저가 Q1~Q5 + 중간 가설까지 작성한 재료를 바탕으로, 리포트의 **마지막 종합 카드**를 작성합니다.

규칙:
- 결과는 반드시 아래 JSON 단일 객체.

{
  "belief_line": "유저가 최종적으로 마주한 핵심 믿음 1줄. Q3과 중간 가설을 통합해 완성형 문장으로 60자 이내. 예: '나는 쉬면 뒤쳐지는 사람이다.'",
  "how_it_works": "이 믿음이 유저 삶에서 어떻게 작동하는지 2~3문장. 유저의 뜨거운 생각과 Q4(뿌리) 내용을 녹여 서술. 전문 용어 금지.",
  "reframe_invitation": "다시 바라보기 1~2문장. '이것은 진실이 아니라 ___에서 배운 오래된 믿음일 수 있어요' 형식을 기본으로 하되, Q5(친구에게 해줄 말)을 참고해 **친구처럼 따뜻한 어조**로. 유저가 스스로에게 할 말이 되도록."
}

- 전문 용어(인지적 오류, 자동적 사고 등) 금지, 일상 언어.
- 판단·비난 금지.
- JSON 외 텍스트 절대 포함 금지.`;

  const userMessage = `## 유저가 선택한 뜨거운 생각
"${hotThought}"

## 중간 가설 핵심 믿음 (Part 1 후 AI가 제안)
${midBelief ? `"${midBelief}"` : "(없음)"}

## 유저 답변 전체
Q1. 이 생각이 사실이라면, 어떤 일이 벌어지나요? (예상 결과):
→ ${answers.q1_consequence}

Q2. 그게 진짜 일어난다면, 가장 두려운 건? (핵심 두려움):
→ ${answers.q2_fear}

Q3. 그 두려움이 말하는 나는 어떤 사람? (자기 정체성):
→ 나는 ${answers.q3_identity}

Q4. 이 믿음의 뿌리 (언제/어디서 배웠는지):
→ ${answers.q4_origin}

Q5. 사랑하는 친구가 같은 믿음을 갖고 있다면 내가 해줄 말:
→ ${answers.q5_compassion}

위를 종합해 belief_line / how_it_works / reframe_invitation JSON을 작성하세요.`;

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    {
      model: "gemini-2.5-pro",
      temperature: 0.6,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    }
  );

  const parsed = safeJsonParse<SynthesizeResult>(response);
  if (
    !parsed ||
    typeof parsed.belief_line !== "string" ||
    typeof parsed.how_it_works !== "string" ||
    typeof parsed.reframe_invitation !== "string" ||
    parsed.belief_line.trim().length === 0 ||
    parsed.how_it_works.trim().length === 0 ||
    parsed.reframe_invitation.trim().length === 0
  ) {
    throw new Error("synthesize 결과 형식이 올바르지 않습니다");
  }
  return {
    belief_line: parsed.belief_line.trim(),
    how_it_works: parsed.how_it_works.trim(),
    reframe_invitation: parsed.reframe_invitation.trim(),
  };
}

/* ─────────────── Phase: Q1/Q2/Q3 객관식 보기 생성 ─────────────── */

const Q1_FALLBACK = [
  "결국 아무도 나를 필요로 하지 않게 돼요",
  "중요한 기회를 놓치게 돼요",
  "관계에서 점점 밀려나게 돼요",
  "스스로를 더 몰아붙이게 돼요",
];

const Q2_FALLBACK = [
  "혼자 남겨지는 것",
  "쓸모없는 사람이 되는 것",
  "아무에게도 인정받지 못하는 것",
  "내 존재 자체가 가치 없게 느껴지는 것",
];

const Q3_FALLBACK = [
  "증명하지 않으면 사랑받을 수 없는 사람이다",
  "쉬면 뒤쳐지는 사람이다",
  "완벽하지 않으면 가치 없는 사람이다",
  "혼자서는 충분하지 않은 사람이다",
];

async function runGenerateQuestionOptions(
  phase:
    | "generate-options-q1"
    | "generate-options-q2"
    | "generate-options-q3",
  hotThought: string,
  q1Answer: string,
  q2Answer: string
): Promise<string[]> {
  const { systemPrompt, userMessage, fallback } = buildQuestionOptionsPrompt(
    phase,
    hotThought,
    q1Answer,
    q2Answer
  );

  try {
    const response = await chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      {
        model: "gemini-2.5-flash",
        temperature: 0.6,
        max_tokens: 512,
        response_format: { type: "json_object" },
      }
    );

    const parsed = safeJsonParse<{ options: string[] }>(response);
    const cleaned = (parsed?.options ?? [])
      .filter((t) => typeof t === "string" && t.trim().length > 0)
      .map((t) => t.trim())
      .slice(0, 5);

    if (cleaned.length === 0) return fallback;
    return cleaned;
  } catch (err) {
    console.error(`${phase} LLM 실패, fallback 사용:`, err);
    return fallback;
  }
}

function buildQuestionOptionsPrompt(
  phase:
    | "generate-options-q1"
    | "generate-options-q2"
    | "generate-options-q3",
  hotThought: string,
  q1Answer: string,
  q2Answer: string
): { systemPrompt: string; userMessage: string; fallback: string[] } {
  const baseSystem = `당신은 CBT 전문 심리학자입니다. 유저가 한국어로 Downward Arrow 기법을 따라가며 핵심 믿음에 접근하는 것을 돕고 있어요.

공통 규칙:
- 유저의 뜨거운 생각 맥락에 꼭 맞는, 자연스러운 1인칭 내면의 목소리로 쓰세요.
- 문어체 금지. 친구에게 속마음을 털어놓듯 일상적인 말투.
- 임상 용어, '인지 왜곡' 같은 전문 용어 금지.
- 각 보기는 12~28자 사이. 너무 짧지도, 길지도 않게.
- 서로 다른 결/뉘앙스로 **정확히 4개** 보기를 만드세요. 중복·유사 표현 금지.

응답 형식: 반드시 아래 JSON 단일 객체.
{ "options": ["보기1", "보기2", "보기3", "보기4"] }
JSON 외 텍스트 절대 포함 금지.`;

  if (phase === "generate-options-q1") {
    return {
      systemPrompt: `${baseSystem}

## 이 질문의 성격
유저가 고른 뜨거운 생각이 '만약 100% 사실이라면 내 인생에 어떤 일이 벌어질까?' 에 대한 **구체적이고 관찰 가능한 결과** 4가지.
- 관계 결과(사람들이 어떻게 반응할지), 기회 결과(일/커리어에서 무엇을 잃을지), 자기 이미지 결과(스스로를 어떻게 볼지) 등 서로 다른 차원에서 뽑아주세요.
- "~하게 돼요", "~이 일어나요" 같은 '결과 서술' 톤.`,
      userMessage: `유저가 고른 뜨거운 생각:
"${hotThought}"

이 생각이 100% 사실이라면, 유저의 삶에 어떤 일이 벌어질까요?
서로 다른 결의 결과 4가지를 JSON으로 응답하세요.`,
      fallback: Q1_FALLBACK,
    };
  }

  if (phase === "generate-options-q2") {
    return {
      systemPrompt: `${baseSystem}

## 이 질문의 성격
Q1에서 예상한 결과들이 **진짜 일어난다고 상상했을 때**, 유저가 가슴으로 느끼는 가장 근본적인 두려움 4가지.
- '~되는 것', '~당하는 것' 처럼 **명사형 두려움 대상** 톤.
- 관계/고립, 정체성 상실, 존재 가치, 통제 상실 등 서로 다른 실존적 층위에서 뽑아주세요.
- 사건보다 감정·실존에 가까운 표현 (예: "혼자 남겨지는 것" > "친구가 끊기는 것").`,
      userMessage: `유저가 고른 뜨거운 생각:
"${hotThought}"

Q1(결과) 답변:
${q1Answer || "(답변이 아직 없음 — 뜨거운 생각 맥락에서 추론)"}

이 결과들이 진짜 일어난다면, 유저가 가장 두려워할 4가지를 JSON으로 응답하세요.`,
      fallback: Q2_FALLBACK,
    };
  }

  // q3
  return {
    systemPrompt: `${baseSystem}

## 이 질문의 성격
Q2에서 드러난 두려움은 결국 "나는 어떤 사람이다"라는 자기 정체성을 말하고 있어요. 그 **'나'에 대한 믿음 문장**의 서술부 4가지를 뽑아주세요.
- 중요: 응답 옵션은 **"나는"으로 시작하지 마세요**. UI에서 "나는 " 접두어를 자동으로 붙여주므로, 옵션 자체는 서술부만. 예: "쉬면 뒤쳐지는 사람이다", "증명해야만 사랑받는 사람이다".
- 각 옵션은 반드시 "…사람이다" 혹은 "…존재다" 로 끝나도록.
- 수치심·무가치감·완벽주의·관계적 의존 등 서로 다른 정체성 축에서 뽑아주세요.
- 핵심 믿음(core belief) 톤으로, 너무 부드럽지 않게 — 유저가 실제로 자신에 대해 내리는 가혹한 선언.`,
    userMessage: `유저가 고른 뜨거운 생각:
"${hotThought}"

Q1(결과) 답변:
${q1Answer || "(없음)"}

Q2(두려움) 답변:
${q2Answer || "(없음)"}

이 두려움이 말하고 있는 '나는 ~한 사람이다'의 서술부 4가지를 JSON으로 응답하세요. "나는"으로 시작하지 마세요.`,
    fallback: Q3_FALLBACK,
  };
}
