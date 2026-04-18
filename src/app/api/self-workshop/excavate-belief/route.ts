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
  const { workshopId, phase, answers } = body as {
    workshopId: string;
    phase: "generate-candidates" | "hypothesize" | "synthesize";
    answers?: Answers;
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

      const merged = {
        answers,
        mid_hypothesis,
        synthesis: existing?.synthesis,
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
        answers,
        mid_hypothesis: existing?.mid_hypothesis,
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
유저가 스트레스 상황에서 경험한 자동적 사고 원본들을 분석해서, **서로 다른 주제/각도의 핵심 생각 3~5개**를 추출해 주세요.

## 중요 규칙
1. **장문 분리**: 유저가 한 문장에 여러 생각을 섞어 쓴 경우(예: "나만 뒤쳐지고 있다 나 빼고 다 앞서가고 있다 애도했는데 나는 못한다 나는 할 수 없다"), 이를 의미 단위로 분리하세요.
2. **중복 제거**: 같은 뜻의 다른 표현은 하나만 남기세요. "나만 뒤처져"와 "내가 지금 뒤쳐지고 있어"는 같은 생각입니다.
3. **다양한 각도**: 추출된 생각들이 서로 **다른 심리적 주제**를 담아야 합니다. 예시:
   - 비교/열등감: "남들은 다 잘하는데 나만…"
   - 무능감/자기비하: "나는 못한다"
   - 무력감: "나는 할 수 없다"
   - 조바심/압박: "더 해야 해"
   - 자기비난: "왜 나는 이것밖에 안 될까"
   이처럼 각 생각이 **서로 다른 감정적 뿌리**를 가져야 합니다.
4. 각 생각은 15자 이내, 1인칭 내면의 목소리 톤 ("~해", "~야", "나는 ~" 등).
5. 원본에 없는 생각을 새로 만들지 마세요. 원본을 정리하고 분리하는 것이 핵심입니다.
6. 단, 원본에서 3개 미만의 서로 다른 주제만 추출된 경우에 한해, 패턴 맥락에서 자연스럽게 나올 수 있는 **다른 각도의** 생각 1개를 추가할 수 있습니다.

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

위 원본들을 분석해서 서로 다른 주제의 핵심 생각 3~5개를 추출해 주세요.`;

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
