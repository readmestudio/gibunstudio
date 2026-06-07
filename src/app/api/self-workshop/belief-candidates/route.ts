import { NextResponse } from "next/server";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import { requireWorkshopAccess } from "@/lib/self-workshop/api-guard";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { IFS_TERM_BAN_RULES } from "@/lib/self-workshop/ifs-parts-data";
import type { ConversationTranscript } from "@/lib/self-workshop/conversation";

/**
 * POST /api/self-workshop/belief-candidates
 *
 * Step 4(핵심 신념 찾기) 대화가 끝난 직후, done 화면에서 사용자가 *고를* 자동사고·핵심신념
 * 후보를 LLM이 생성한다. 사용자는 이 중 자신에게 해당하는 것을 다중 선택(+직접 추가)하고,
 * 그 선택이 Step 6(대안 자동사고)·Step 7(새 신념) 수정 실습의 대상이 된다.
 *
 * Body: { transcript, prior_automatic_thought? }
 * Resp: { recap_summary, candidate_thoughts: string[], candidate_beliefs: string[] }
 *
 * 어떤 실패든 200 + 빈 배열로 흐름을 막지 않는다(클라이언트는 직접 입력으로 진행 가능).
 */

interface CandidatesResult {
  recap_summary: string;
  candidate_thoughts: string[];
  candidate_beliefs: string[];
}

function empty(): CandidatesResult {
  return { recap_summary: "", candidate_thoughts: [], candidate_beliefs: [] };
}

export async function POST(req: Request) {
  const guard = await requireWorkshopAccess(req, {
    rateLimit: RATE_LIMITS.conversation,
  });
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  const transcript = body?.transcript as ConversationTranscript | undefined;
  const priorThought =
    typeof body?.prior_automatic_thought === "string"
      ? body.prior_automatic_thought.trim()
      : "";

  if (
    !transcript ||
    !Array.isArray(transcript.turns) ||
    transcript.turns.length === 0
  ) {
    return NextResponse.json(empty());
  }

  try {
    const result = await generate(transcript, priorThought);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[belief-candidates] 실패, 폴백:", err);
    return NextResponse.json(empty());
  }
}

async function generate(
  transcript: ConversationTranscript,
  priorThought: string
): Promise<CandidatesResult> {
  const conv = transcript.turns
    .filter((t) => t.answer.trim().length > 0)
    .map((t) => `Q: ${t.question}\nA: ${t.answer}`)
    .join("\n\n");

  const priorLine = priorThought
    ? `\n\n## Step 3에서 포착한 자동사고\n${priorThought}`
    : "";

  const systemPrompt = `당신은 성취 중독을 다루는 따뜻한 CBT/IFS 진행자입니다. 직장인 3~15년차 내담자가 "성취 압박 아래 깔린 핵심 신념"을 함께 탐색했어요. 대화를 바탕으로, 이 사람이 **실제로 보고했거나 갖고 있을 법한** 자동사고·핵심신념 *후보*를 뽑아 주세요. 사용자는 이 후보 중 자신에게 해당하는 것을 골라, 뒤 단계에서 그 생각·신념을 직접 수정하게 됩니다.

## recap_summary (2~3문장, 200자 이내)
이번 대화에서 함께 따라온 흐름을 부드럽게 요약. "성취가 흔들릴 때 ~한 생각이 올라오고, 그 아래엔 ~한 믿음이 있는 것 같아요" 류. 단정 금지·가설 톤.

## candidate_thoughts (4~6개)
그 순간 자동으로 떠오르는 **자동사고**(상황 해석·자기 평가의 짧은 문장). 대화에 **직접 나온 표현을 우선** 인용하고, 부족하면 이 사람에게 있을 법한 자동사고를 1~2개 보탠다. 각 1문장, 25자 내외. 예: "나는 안 될 것 같다", "성과가 없으면 끝이다", "남들은 다 잘하는데 나만 뒤처진다"

## candidate_beliefs (4~6개)
자동사고 아래 깔린 **핵심신념**(자기·타인·세계에 대한 근원적 믿음). 가설형. 각 1문장, 20자 내외. 예: "나는 부족하다", "성과로만 내 가치가 증명된다", "쉬면 도태된다", "인정받지 못하면 사랑받을 수 없다"

## 규칙
- 모든 항목은 사용자 답에 근거하거나 가까운 paraphrase. 없는 내용 과하게 지어내기 금지.
- 자동사고(상황 속 즉각적 생각) vs 핵심신념(삶 전반의 근원 믿음)을 구분.
- 단정·진단·평가 금지. "당신은 ___입니다" 금지.
- 부정/긍정 어느 쪽이든 사용자의 실제 결을 따른다.

## 응답 형식 (JSON 단일 객체로만, 다른 텍스트 금지)
{"recap_summary":"...","candidate_thoughts":["...","..."],"candidate_beliefs":["...","..."]}

${IFS_TERM_BAN_RULES}`;

  const userMessage = `## 대화 기록\n${conv}${priorLine}\n\n위 대화를 바탕으로 recap_summary · candidate_thoughts · candidate_beliefs를 JSON으로 응답하세요.`;

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    {
      model: "gemini-2.5-flash",
      temperature: 0.6,
      max_tokens: 2048,
      thinking_budget: 0,
      response_format: { type: "json_object" },
    }
  );

  const parsed = safeJsonParse<unknown>(response);
  const raw = (parsed ?? {}) as {
    recap_summary?: unknown;
    candidate_thoughts?: unknown;
    candidate_beliefs?: unknown;
  };

  return {
    recap_summary:
      typeof raw.recap_summary === "string" ? raw.recap_summary.trim() : "",
    candidate_thoughts: cleanList(raw.candidate_thoughts),
    candidate_beliefs: cleanList(raw.candidate_beliefs),
  };
}

/** 문자열 배열 정리 — 트림·빈값 제거·중복 제거·최대 8개. */
function cleanList(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const x of v) {
    if (typeof x !== "string") continue;
    const s = x.trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= 8) break;
  }
  return out;
}
