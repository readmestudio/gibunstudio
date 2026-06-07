import { NextResponse } from "next/server";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import { requireWorkshopAccess } from "@/lib/self-workshop/api-guard";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { IFS_TERM_BAN_RULES } from "@/lib/self-workshop/ifs-parts-data";

/**
 * POST /api/self-workshop/parts-extract
 *
 * Step 3의 "여러 마음" 자유서술 답에서 *마음 후보 카드들*을 추출한다.
 * 내담자가 막연히 "그 마음"이 어떤 마음인지 모르는 문제를 해결 —
 * LLM이 답에서 3~5개의 또렷한 마음을 카드로 뽑아 보여주고, 사용자가
 * 하나를 골라 그 마음을 가지고 워크북을 이어가게.
 *
 * Body: { situation, active_minds }
 * Resp: { candidates: [{ id, nickname, short_description, evidence_quote }] }
 *
 * 어떤 실패든 폴백(빈 배열 또는 단일 카드)으로 차단하지 않음.
 */

interface PartCandidate {
  id: string;
  /** 사용자에게 보여줄 짧은 닉네임 (예: "다그치는 마음"). IFS 용어 금지. */
  nickname: string;
  /** 1~2줄 짧은 묘사. 사용자 원문 인용 포함. */
  short_description: string;
  /** 이 마음을 끌어낸 사용자 원문 한 구절. */
  evidence_quote: string;
}

export async function POST(req: Request) {
  const guard = await requireWorkshopAccess(req, {
    rateLimit: RATE_LIMITS.conversation,
  });
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  const situation =
    typeof body?.situation === "string" ? body.situation.trim() : "";
  const activeMinds =
    typeof body?.active_minds === "string" ? body.active_minds.trim() : "";

  if (!activeMinds) {
    return NextResponse.json({ candidates: [] });
  }

  try {
    const candidates = await extractCandidates(situation, activeMinds);
    return NextResponse.json({ candidates });
  } catch (err) {
    console.error("[parts-extract] 실패, 폴백:", err);
    // 폴백: 사용자 원문 자체를 하나의 카드로 (선택 가능)
    return NextResponse.json({
      candidates: [
        {
          id: "fallback",
          nickname: "방금 떠올린 마음",
          short_description: activeMinds.slice(0, 80),
          evidence_quote: activeMinds.slice(0, 60),
        },
      ],
    });
  }
}

async function extractCandidates(
  situation: string,
  activeMinds: string
): Promise<PartCandidate[]> {
  const systemPrompt = `당신은 IFS 상담 기법에 능숙한 따뜻한 진행자입니다. 내담자가 한 사건을 떠올리며 그 안에서 활성화된 여러 마음들을 자유서술로 적었어요. 그 답을 읽고, 또렷한 마음들을 **2~4개의 카드**로 정리해주세요. 내담자가 한 카드를 골라 그 마음을 깊이 알아갈 거예요.

## 작업
각 카드는:
- **nickname** (10자 이내): 이 마음의 짧은 별명. "다그치는 마음"·"무력한 마음"·"두려운 마음" 같은 자연어. *반드시 "○○하는 마음" 또는 "○○한 마음"* 형식으로.
- **short_description** (60자 이내): 이 마음이 어떻게 작동하는지 한 줄 묘사. 사용자 원문 단어를 자연스럽게 활용.
- **evidence_quote** (50자 이내): 사용자 원문에서 이 카드를 끌어낸 한 구절을 직접 인용.

## 규칙
- 2~4개. 너무 잘게 쪼개지 말고, 가장 또렷한 마음 위주.
- 사용자가 표현한 *원문에서* 끌어낸다. 지어내지 말 것.
- 단정 금지. "어떤 마음인 것 같다" 같은 가설형 묘사.
- IFS 전문 용어 금지 (부분·관리자·소방관 등).
- id는 "p1", "p2", ... 순서대로.

## 응답 형식 (JSON 단일 객체로만)
{"candidates":[{"id":"p1","nickname":"...","short_description":"...","evidence_quote":"..."}]}

${IFS_TERM_BAN_RULES}`;

  const userMessage = `## 사건
${situation || "(상황 없음)"}

## 내담자가 적은 여러 마음
${activeMinds}

위 내용에서 또렷한 마음을 2~4개의 카드로 뽑아 JSON으로 응답하세요.`;

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    {
      model: "gemini-2.5-flash",
      temperature: 0.5,
      max_tokens: 1024,
      thinking_budget: 0,
      response_format: { type: "json_object" },
    }
  );

  const parsed = safeJsonParse<{ candidates?: unknown }>(response);
  const rawArr = Array.isArray(parsed?.candidates) ? parsed.candidates : [];
  const out: PartCandidate[] = [];
  for (let i = 0; i < rawArr.length && out.length < 4; i++) {
    const c = rawArr[i] as Record<string, unknown>;
    const nickname =
      typeof c?.nickname === "string" ? c.nickname.trim().slice(0, 16) : "";
    const desc =
      typeof c?.short_description === "string"
        ? c.short_description.trim().slice(0, 100)
        : "";
    if (!nickname || !desc) continue;
    out.push({
      id: typeof c?.id === "string" ? c.id : `p${i + 1}`,
      nickname,
      short_description: desc,
      evidence_quote:
        typeof c?.evidence_quote === "string"
          ? c.evidence_quote.trim().slice(0, 80)
          : "",
    });
  }
  return out;
}
