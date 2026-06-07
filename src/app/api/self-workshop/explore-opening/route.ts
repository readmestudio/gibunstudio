import { NextResponse } from "next/server";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import { requireWorkshopAccess } from "@/lib/self-workshop/api-guard";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { type StepKey } from "@/lib/self-workshop/conversation";
import { IFS_TERM_BAN_RULES } from "@/lib/self-workshop/ifs-parts-data";

/**
 * POST /api/self-workshop/explore-opening
 *
 * 한 주제 답을 마친 내담자에게, 다음 주제로 자연스럽게 잇는 시작 질문을 LLM이 생성한다.
 * 직전 답에서 쓰인 장면·단어·감정을 받아서 다음 주제로 흐름.
 *
 * Body: { step_key, next_point_id, next_point_topic, recent_context?, prior_summary? }
 * Resp: { question: string }  // 빈 문자열이면 클라이언트가 폴백 opening 사용
 *
 * 어떤 실패든 question:"" 로 응답 (차단 금지 — 클라가 폴백 opening 사용).
 */
export async function POST(req: Request) {
  const guard = await requireWorkshopAccess(req, {
    rateLimit: RATE_LIMITS.conversation,
  });
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  const stepKey = body?.step_key as StepKey | undefined;
  const nextPointId =
    typeof body?.next_point_id === "string" ? body.next_point_id.trim() : "";
  const topic =
    typeof body?.next_point_topic === "string"
      ? body.next_point_topic.trim()
      : "";
  const recentContext =
    typeof body?.recent_context === "string" ? body.recent_context.trim() : "";
  const priorSummary =
    typeof body?.prior_summary === "string" ? body.prior_summary.trim() : "";

  if (!stepKey || !nextPointId || !topic) {
    return NextResponse.json({ question: "" });
  }

  try {
    const question = await generateOpening(
      stepKey,
      topic,
      recentContext,
      priorSummary
    );
    return NextResponse.json({ question });
  } catch (err) {
    console.error("[explore-opening] 실패, 폴백 신호:", err);
    return NextResponse.json({ question: "" });
  }
}

async function generateOpening(
  stepKey: StepKey,
  topic: string,
  recentContext: string,
  priorSummary: string
): Promise<string> {
  const persona = (() => {
    switch (stepKey) {
      case "core_belief":
        return "성취 중독 아래 깔린 핵심 신념을 함께 탐색하는 중";
      case "parts_discovery":
        return "한 사건 안에서 활성화된 마음 안의 여러 목소리·움직임을 하나씩 알아가는 중";
      case "schema_inquiry":
        return "삶 전반에 자주 나타나는 마음의 패턴을 5개 영역에서 가볍게 살펴보는 중";
      case "parts_integration":
        return "내담자 안에서 보호하거나 통제하는 마음들의 본래 바람·긍정 의도를 발견하는 중";
      default:
        return "성취 압박이 올라온 한 순간의 상황·생각·감정·몸·행동을 함께 살펴보는 중";
    }
  })();

  const systemPrompt = `당신은 IFS(내면가족체계) 상담 기법에 능숙한 따뜻한 진행자입니다. 직장인 3~15년차 페르소나의 내담자와 ${persona}이에요.

내담자가 직전 주제에 답을 마쳤습니다. 이제 다음 주제로 자연스럽게 넘어가야 해요. 다음 주제는 아래에 안내되어 있습니다.

## 작업
내담자의 직전 답에서 쓰인 장면·단어·감정·사람·시간 중 1~2개를 자연스럽게 받아서, 다음 주제를 묻는 질문 한 문장을 만들어 주세요.

## 예시 (참고)
- 직전 답: "인스타그램 콘텐츠 반응이 별로였어요" / 다음 주제: 감정
- 좋은 질문: "그 결과를 확인했을 때 가장 먼저 올라온 감정은 뭐였나요?"
- 직전 답: "회의에서 내 의견이 묻혔어요" / 다음 주제: 자동사고
- 좋은 질문: "묻혔다고 느낀 그 순간, 머릿속에 가장 먼저 스친 말은 뭐였나요?"

## 직전 답 톤 감지 (오프닝 톤 결정)
직전 답에서 다음 신호가 *2개 이상*이면 "취약 모드"로 간주:
- 고립·무가치 표현 (혼자, 남겨, 초라, 끝, 사라지, 작아지)
- 시간 절망 (영원히, 이대로, 안 변할, 끝까지)
- 신체 짓눌림 (가라앉, 숨이, 조여, 무겁)
- 절대화 부사 (다, 항상, 영원히, 아무도, 아무것도)

**취약 모드일 때:**
- 의미·동기·이해·재구성·해결을 묻지 *않는다*. 받아들임 한 문장 깔고 다음 주제로 부드럽게.
- 다음 주제가 "감사"·"긍정 의도"·"보호 의도" 류여도 "결국 너를 위해 하려던 일"·"고마운 점"을 *곧바로* 묻지 말 것. 먼저 "그 [구체 단어]가 지금도 이 자리에 함께 있는 것 같나요?" / "그 느낌이 몸 어디쯤에 있나요?" 같은 머무름 한 문장으로 진입한 뒤, 자연스레 다음 주제로 흘러가도록 1문장 안에 담는다 (예: "그 초라한 느낌이 지금도 함께인 것 같은데, 그 마음이 끝까지 지키려던 게 있다면 무엇일까요?").
- "고마운"·"감사"·"긍정적"·"좋은 면" 단어 절대 사용 금지.

**취약 모드가 아닐 때:**
- 다음 주제 topic에 충실하게 자연 연결 (현행대로).
- 다음 주제가 "감사" 영역이면 "고마운"이라는 직접 단어 대신 "이 마음이 나를 위해 하려던 일" / "이 마음이 끝까지 지키려고 한 것" 같은 *행위 프레임*을 우선.

## 규칙
- 직전 답의 구체(장면·단어·사람·시간·감정) 1~2개를 자연스럽게 반영. 어색하게 끼워 넣지 말 것.
- 정확히 "다음 주제"에 부합하는 질문 1개. 다른 주제로 새지 말 것.
- 80자 이내. 한국어. 큰따옴표·마크다운·별표 없이 질문 본문만.
- 극존칭 금지. 따뜻하되 가르치지 않는 톤. 주어 생략 가능.
- "부분 / 참자기 / 보호자 / 추방자" 같은 IFS 전문 용어 금지.

## 응답 형식 (JSON 단일 객체로만)
{"question": "여기에 질문 한 문장"}

${IFS_TERM_BAN_RULES}`;

  const parts: string[] = [];
  if (priorSummary) parts.push(`## 참고 맥락\n${priorSummary}`);
  parts.push(`## 직전 대화\n${recentContext || "(없음)"}`);
  parts.push(`## 다음 주제\n${topic}`);
  parts.push(
    `위 직전 답을 자연스럽게 받아 "다음 주제"를 묻는 한 문장 질문을 위 JSON 형식으로 응답하세요.`
  );

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: parts.join("\n\n") },
    ],
    {
      model: "gemini-2.5-flash",
      temperature: 0.6,
      max_tokens: 512,
      thinking_budget: 0,
      response_format: { type: "json_object" },
    }
  );

  const parsed = safeJsonParse<{ question?: unknown }>(response);
  return typeof parsed?.question === "string" ? parsed.question.trim() : "";
}
