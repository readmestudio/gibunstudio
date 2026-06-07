import { NextResponse } from "next/server";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import { requireWorkshopAccess } from "@/lib/self-workshop/api-guard";
import { RATE_LIMITS } from "@/lib/rate-limit";
import {
  MAX_FOLLOWUP_TURN_INDEX,
  type StepKey,
} from "@/lib/self-workshop/conversation";
import { IFS_TERM_BAN_RULES } from "@/lib/self-workshop/ifs-parts-data";

/**
 * POST /api/self-workshop/explore-followup
 *
 * 적응형 대화의 두뇌. 내담자가 방금 한 질문에 답하면:
 *  - 답이 충분히 깊은지 판정하고
 *  - 얕으면 IFS 기법으로 한 걸음 더 들어가는 후속질문 1개를 돌려준다.
 *
 * Body: { step_key, explore_point_id, question, answer, turn_index,
 *         recent_context?, prior_summary? }
 * Resp: { sufficient: true } | { sufficient: false, followup: string }
 *
 * 설계 원칙:
 *  - turn_index >= 2 면 LLM 호출 없이 단락(sufficient:true) — 토큰·턴 하드캡.
 *  - 어떤 실패(파싱/LLM/타임아웃)든 sufficient:true 로 폴백 — 절대 차단하지 않음.
 *  - flash + thinking_budget:0 (출력이 짧으므로 reasoning 불필요, 잘림 방지).
 */
export async function POST(req: Request) {
  const guard = await requireWorkshopAccess(req, {
    rateLimit: RATE_LIMITS.conversation,
  });
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  const stepKey = body?.step_key as StepKey | undefined;
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  const answer = typeof body?.answer === "string" ? body.answer.trim() : "";
  const turnIndex =
    typeof body?.turn_index === "number" ? body.turn_index : 0;
  const recentContext =
    typeof body?.recent_context === "string" ? body.recent_context.trim() : "";
  const priorSummary =
    typeof body?.prior_summary === "string" ? body.prior_summary.trim() : "";

  // 하드캡: 이미 후속질문을 2번 했으면 더 묻지 않고 진행 (LLM 호출 없음)
  if (turnIndex >= MAX_FOLLOWUP_TURN_INDEX) {
    return NextResponse.json({ sufficient: true });
  }

  // 답이 비어있으면 판정할 게 없음 — 진행
  if (!question || !answer) {
    return NextResponse.json({ sufficient: true });
  }

  try {
    const result = await judgeAndFollowUp(
      stepKey,
      question,
      answer,
      recentContext,
      priorSummary
    );
    return NextResponse.json(result);
  } catch (err) {
    // 어떤 실패든 차단하지 않고 진행시킨다 (graceful degradation).
    console.error("[explore-followup] 실패, 진행 처리:", err);
    return NextResponse.json({ sufficient: true });
  }
}

const STEP_FOCUS: Record<StepKey, string> = {
  // legacy CBT 흐름
  mechanism: "최근 성취 압박이 올라온 한 순간의 상황·생각·감정·행동을 탐색하는 중",
  core_belief: "성취 중독 아래 깔린 핵심 신념(자기 가치·성취·관계·통제)을 탐색하는 중",
  new_belief: "낡은 신념을 대신할 새 신념을 찾는 중",
  belief_evidence: "새 신념을 뒷받침하는 구체적 근거를 모으는 중",
  // IFS 재설계
  parts_discovery:
    "내담자가 한 사건을 떠올리고, 그 순간 마음 안에서 활성화된 여러 목소리·움직임을 하나씩 알아가는 중. 단정 금지, 가설형으로만",
  schema_inquiry:
    "내담자의 삶 전반에 자주 나타나는 마음의 패턴을 5개 영역(관계·자율성·한계·타인 지향·과잉경계)에서 가볍게 살펴보는 중",
  parts_integration:
    "내담자 안에서 통제하거나 보호하려는 마음들의 본래 바람·긍정적 의도를 발견하는 중. 마음에 안 드는 면도 그 안에 어떤 보호 의도가 있는지 함께 봄",
};

interface FollowUpResult {
  sufficient: boolean;
  followup?: string;
}

async function judgeAndFollowUp(
  stepKey: StepKey | undefined,
  question: string,
  answer: string,
  recentContext: string,
  priorSummary: string
): Promise<FollowUpResult> {
  const focus = stepKey ? STEP_FOCUS[stepKey] : "내담자의 내면을 탐색하는 중";

  const systemPrompt = `당신은 IFS(내면가족체계) 상담 기법에 능숙한 따뜻한 진행자입니다. 직장인 3~15년차 페르소나의 내담자가 자기 탐색 워크북을 진행 중이에요. 지금은 ${focus}입니다.

내담자가 방금 한 질문에 답했습니다. 당신의 일은 두 가지예요.
1. 이 답이 "충분히 깊은지" 판정한다.
2. 얕으면, 한 걸음 더 들어가는 후속 질문 1개를 만든다.

## 충분함의 기준 (아래 중 2개 이상이면 sufficient = true)
- (a) 구체성: 특정 장면·사람·시간·신체감각·수치가 담겨 있다.
- (b) 의미/감정: 단순 라벨("불안", "힘들다")을 넘어, 그게 무슨 의미인지·왜 그런지가 드러난다.
- (c) 자기참조: 자신에 대한 신념이나 두려움이 보인다 ("~할까 봐 두렵다", "나는 ~한 사람 같다").
- (d) **자기 동기 인식**: 행동/감정 뒤의 긍정 의도·바람을 본인이 명명한다 ("잘하고 싶었어요", "안 무너지고 싶었어요", "인정받고 싶었어요" 같은 *명시적* 자기 동기 표현. "잘 모르겠어요"·"그냥요" 같은 회피는 해당 안 됨).
- (e) **취약 노출**: 답이 강한 고립감·무가치감·시간 절망·신체 짓눌림 표현을 담고 있다 (예: "초라", "영원히 이대로", "혼자 남겨", "다 사라질 것 같", "아무것도 안 변할", "숨이 막혀", "가라앉"). 이 신호가 2개 이상이면 깊이는 *이미 충분*하다고 본다. **sufficient:true로 마무리하되, 다음 슬롯이 곧장 감사/긍정 의도를 묻는다면 머무름이 먼저 필요하다 — 그 어조는 다음 슬롯 오프닝이 처리하므로 여기서는 sufficient:true만 반환한다.**

## 후속 질문 규칙 (sufficient = false 일 때만)
- 내담자가 쓴 단어를 되비추고(reflect back), 거기서 한 걸음 더 들어가는 질문 1개.
- **추상적 단어는 반드시 풀어서 구체화한다.** "가장 두려운 건 뭔가요?" 같은 막연한 물음 금지. 두려움·불안·답답함·압박감 같은 추상어가 나오면 그것이 "어떤 상황", "어떤 대상", "어떤 장면"인지를 풀어 묻는다.
- **가설형으로 던지기**: 단언하지 말 것. "혹시 ___에서 비롯된 건가요?" / "___을 바라는 마음이었을까요?" 처럼 가설로 던지고, 내담자가 동의하든 다른 명명을 하든 자기가 답을 찾게 한다.
- 쓸 수 있는 탐색 동선(택1):
  - **동기·긍정 의도 발견**: 다음 조건이 *모두* 충족될 때만 던진다.
    (1) 직전 답에 (e) 취약 신호가 0~1개 (취약 모드 아님).
    (2) 사용자가 자기 행동·감정을 어느 정도 거리를 두고 묘사 ("내가 자꾸 ~하는 것 같아요" 같은 메타 인식).
    (3) 동기가 아직 명명되지 않음.
    → 충족 시: "혹시 ___을 바라는 마음에서 시작된 건 아닐까요?" / "그 [구체적 행동]은 어떤 마음에서 비롯됐을까요?" — *구체적 욕구 가설*.
    → 미충족(특히 취약 모드)이면 아래의 머무름·신체·구체 장면 카테고리로.
  - **머무름 (취약 모드 1순위)**: "그 [구체 단어]가 지금도 이 자리에 함께 있는 것 같나요?" / "그 마음이 지금 어디쯤에 있나요? 가깝게 느껴지나요, 조금 거리가 있나요?"
  - 자기 의도 명명 가설(비취약 답에만): "[행동/감정]은 결국 ___을 바라는 마음일까요?" (단언 금지, 가설로만)
  - 구체화: "어떤 상황을 두려워하고 있는 건가요?" / "두려워하는 대상이 구체적으로 뭘까요?" / "그게 떠오를 때 어떤 장면이 보이나요?"
  - 자기 의미: "그게 사실이라면 나에 대해 뭐라고 말하는 걸까요?"
  - 신체: "그게 몸 어디에서 어떻게 느껴지나요?"
  - 보호 의도(행위 프레임): "그 마음이 끝까지 지키려고 한 게 있다면 무엇일까요?" / "이 마음이 나를 위해 하려던 일이 있다면 어떤 일일까요?"
- **피해야 할 추상·메타 질문 (금지)**:
  - ✗ "그 마음이 무엇을 위해 그렇게까지 애쓰고 있다고 느끼나요?" (너무 추상적·메타적, 답하기 어려움)
  - ✗ "그 마음의 본질은 뭘까요?"·"그게 의미하는 게 뭘까요?" (지나치게 철학적)
  - ✗ 한 질문에 두 개 이상 묻기 (예: "어떤 모양이고 어떤 목소리인가요?")
  - → 대신 *구체적 욕구 가설*("혹시 인정받고 싶었던 건가요?") 또는 *구체 장면 질문*으로.
- **취약 답 직후 금지 (특히 중요)**:
  - ✗ "그 마음에 대해 고마운 점이 있다면?" / "이 마음의 좋은 면은 뭘까요?" / "그래도 좋은 점은?" / "감사한 부분은?"
  - ✓ "그 [구체 단어]가 지금도 이 자리에 함께 있나요?" / "그 느낌이 몸 어디쯤에 자리잡고 있나요?" / "그 마음이 끝까지 지키려고 한 게 있다면 무엇일까요?"
  - 사유: 사용자가 방금 노출한 고통이 받아들여지지 않았다는 느낌을 줌. "감사"·"고마운"·"긍정적"·"좋은 면" 단어는 취약 답 직후엔 금지.
- **반복 영역 금지** (중요):
  - 직전 질문이 *욕구·동기·바람*을 명시적으로 물었다면(예: "그 마음이 바라는 게 뭘까요?"·"애쓴 마음 뒤에 무엇이 있을까요?"), 후속질문은 *같은 영역(욕구·동기·바람)에서 다른 표현으로 또 묻기* 금지. 답이 어떤 욕구든 표현됐다면 그 영역은 이미 충분한 것으로 보고 sufficient:true로 마무리하거나, *다른 영역*(구체 장면·신체·자기 의미)으로 전환.
  - 같은 영역의 변형 질문 반복은 내담자에게 "방금 답했는데 또 묻네"라는 어색함을 준다.
- **언제 어느 카테고리를?**:
  - 직전 답에 (e) 취약 신호 2개 이상 → 머무름 카테고리 (다만 취약 답이 (e) 기준을 충족하면 보통 sufficient:true로 마무리하고 다음 슬롯 오프닝에 머무름을 맡긴다).
  - 답이 구체적이고 메타 인식이 있는데 동기가 안 드러나는 경우 → 동기·긍정 의도 카테고리 (위 (1)(2)(3) 조건 모두 충족 시).
  - 그 외 → 구체화·신체·자기 의미·보호 의도(행위 프레임) 중 자연스러운 것.
  - 사용자가 *"잘하고 싶었구나"* 같은 자기인식에 도달하도록 유도하는 게 워크북의 핵심이지만, *취약 답 직후엔 그 도달이 한 턴 늦어져도 괜찮다.* 머무름이 먼저.
- 질문은 정확히 1개.
- "부분 / 참자기 / 보호자 / 추방자" 같은 IFS 전문 용어 절대 금지.
- 극존칭 금지, 따뜻하되 가르치지 않는 톤. 주어 생략 권장.
- 80자 이내. 마크다운·큰따옴표·별표 없이 질문 본문만.

## 응답 형식 (아래 JSON 단일 객체로만, 다른 텍스트 금지)
충분하면: {"sufficient": true}
부족하면: {"sufficient": false, "followup": "여기에 후속 질문 한 문장"}

${IFS_TERM_BAN_RULES}`;

  const parts: string[] = [];
  if (priorSummary) parts.push(`## 참고 맥락\n${priorSummary}`);
  if (recentContext) parts.push(`## 직전 대화\n${recentContext}`);
  parts.push(`## 방금 던진 질문\n"${question}"`);
  parts.push(`## 내담자의 답\n"${answer}"`);
  parts.push(
    `위 답을 기준에 따라 판정하고, 부족하면 후속 질문 1개를 위 JSON 형식으로 응답하세요.`
  );

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: parts.join("\n\n") },
    ],
    {
      model: "gemini-2.5-flash",
      temperature: 0.6,
      // 출력은 boolean + ≤80자 한국어 질문뿐. thinking을 끄지 않으면 reasoning이
      // max_tokens를 잠식해 JSON이 잘린다 (alternative-thought 버그와 동일 부류).
      max_tokens: 512,
      thinking_budget: 0,
      response_format: { type: "json_object" },
    }
  );

  const parsed = safeJsonParse<{ sufficient?: unknown; followup?: unknown }>(
    response
  );
  const sufficient = parsed?.sufficient === true;
  const followup =
    typeof parsed?.followup === "string" ? parsed.followup.trim() : "";

  // 후속질문을 줘야 하는데 비어있으면 안전하게 진행 (차단 금지).
  if (!sufficient && followup) {
    return { sufficient: false, followup };
  }
  return { sufficient: true };
}
