import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import {
  type EvidenceQuestion,
  buildFullFallback,
  normalizeQuestionsWithFallback,
} from "@/lib/self-workshop/coping-plan";

/**
 * POST /api/self-workshop/belief-evidence-questions
 *
 * Stage 09(새 핵심 신념 떠받치기) 진입 시, 각 신념별로
 * 6 카테고리(과거 경험·친구 비유·작은 일상·제3자 시선·옛 신념의 반례·몸 감각)에서
 * 4~6개의 유도 질문을 LLM으로 생성한다.
 *
 * 실패해도 화면이 비지 않도록 normalize에서 폴백으로 부족분을 채운다.
 *
 * Body: { new_belief_text, old_belief_text?, classification?, source? }
 * Resp: { questions: EvidenceQuestion[] }   // 길이 4~6
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const newBeliefText =
    typeof body?.new_belief_text === "string"
      ? body.new_belief_text.trim()
      : "";
  const oldBeliefText =
    typeof body?.old_belief_text === "string"
      ? body.old_belief_text.trim()
      : "";
  const classification =
    typeof body?.classification === "string"
      ? body.classification.trim()
      : "";
  const source =
    body?.source === "self" || body?.source === "others" || body?.source === "world"
      ? (body.source as "self" | "others" | "world")
      : null;

  if (!newBeliefText) {
    return NextResponse.json(
      { error: "new_belief_text가 필요합니다" },
      { status: 400 }
    );
  }

  try {
    const questions = await runGenerate({
      newBeliefText,
      oldBeliefText,
      classification,
      source,
    });
    return NextResponse.json({ questions });
  } catch (err) {
    console.error("[belief-evidence-questions] 생성 실패:", err);
    // 완전 실패 시도 폴백을 그대로 반환 — UI는 비지 않는다
    return NextResponse.json({ questions: buildFullFallback() });
  }
}

interface GenerateInput {
  newBeliefText: string;
  oldBeliefText: string;
  classification: string;
  source: "self" | "others" | "world" | null;
}

async function runGenerate({
  newBeliefText,
  oldBeliefText,
  classification,
  source,
}: GenerateInput): Promise<EvidenceQuestion[]> {
  const sourceLabel =
    source === "self"
      ? "자기 자신에 대한 신념"
      : source === "others"
      ? "타인에 대한 신념"
      : source === "world"
      ? "세계에 대한 신념"
      : "핵심 신념";

  const sourceToneHint =
    source === "self"
      ? "자기-친구 비유와 자기 자신에 대한 회수에 무게."
      : source === "others"
      ? "타인이 나를 어떻게 대했는지의 사실 회수와 관계성에 무게."
      : source === "world"
      ? "세상이 단일 방향이 아니었다는 작은 일상 사실과 반례에 무게."
      : "균형 있게.";

  const systemPrompt = `당신은 인지행동치료(CBT) 워크북을 함께 진행하는 부드럽고 따뜻한 진행자입니다. 직장인 3~15년차 페르소나의 사용자가 "어제 고른 새 핵심 신념을 오늘의 작은 증거로 떠받치는" 연습을 하고 있어요.

## 작업
사용자의 새 핵심 신념(${sourceLabel}) 본문을 받아, 그 신념을 *반박*하지 않고 *떠받치는* 증거를 사용자가 떠올리도록 돕는 유도 질문 4~6개를 만들어 주세요.

## 카테고리 — 정확히 아래 6개 중 4~6개를 골라 한 카테고리당 1개씩만:
1. past_evidence — 과거 사실 회수: "내가 [신념의 핵심]을 이미 살아본 적이 있나요?" 형식.
2. friend_metaphor — 시점 전환: "사랑하는 친구가 같은 상황에 있다면 어떤 말을 해줄까요?" 형식.
3. small_daily — 작은 일상 증거: "오늘 또는 이번 주에 이 신념이 살짝이라도 맞아 떨어진 작은 순간이 있었나요?"
4. third_person — 제3자 시선: "10년 후의 나/멘토/조용한 관찰자라면 지금 무엇을 알아챌까요?"
5. counter_example — 옛 신념의 반례: "옛 신념이 *항상* 사실이었던 건 아닌, 그 반대 사례 한 가지가 있나요?"
6. embodied — 몸·감각 증거: "이 신념을 따라갔을 때 몸에서 어떤 작은 안도/이완이 느껴졌던 순간이 있나요?"

## 톤·어미 규칙
- 질문은 부드러운 권유체. "~한 적이 있나요?", "~떠올려볼까요?", "~어떨까요?".
- 본문은 *질문체*. 단, 질문 안에 인용되는 신념 자체는 신념체("~이다") 어미 유지.
- "반박/부수기/잘못된 신념" 같은 공격적·판단적 단어 금지.
- 자기계발서 클리셰("당신은 충분히 멋지다" 등) 금지. 임상 용어 금지.
- 한 문장. 한국어 30~80자.
- 사용자가 인용한 톤 예시:
  · "내가 실수해도 나를 지지해준 경험이 있나요?"
  · "사랑하는 친구가 실수한다면 비판할 거냐?"
  이 톤을 표준으로 — 짧고, 직설적이지만 따뜻하고, 답을 강요하지 않는.

## 축별 톤 가이드
${sourceToneHint}

## id 규칙
- 카테고리명_q[1-6] 형식. 예) past_evidence_q1, friend_metaphor_q1.
- 안정적 슬러그여야 하며 한 응답 안에서 중복 금지.

## 응답 형식
반드시 아래 JSON 단일 객체로만 응답. JSON 외 텍스트·마크다운 펜스 금지.
{
  "questions": [
    { "id": "past_evidence_q1", "category": "past_evidence", "text": "..." },
    { "id": "friend_metaphor_q1", "category": "friend_metaphor", "text": "..." }
  ]
}`;

  const classificationLine = classification
    ? `## 분류\n${classification}\n\n`
    : "";
  const oldLine = oldBeliefText
    ? `## 옛 신념(반례 카테고리에서 참조용)\n"${oldBeliefText}"\n\n`
    : "";

  const userMessage = `${classificationLine}${oldLine}## 새 핵심 신념
"${newBeliefText}"

위 신념을 떠받치는 유도 질문 4~6개를 위 JSON 형식으로 응답하세요.`;

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    {
      model: "gemini-2.5-flash",
      temperature: 0.65,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    }
  );

  const parsed = safeJsonParse<unknown>(response);
  return normalizeQuestionsWithFallback(parsed);
}
