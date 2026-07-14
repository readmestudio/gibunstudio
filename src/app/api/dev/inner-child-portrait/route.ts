import { NextRequest, NextResponse } from "next/server";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import { getTypeCard } from "@/lib/minds/inner-child/type-cards";
import {
  FREE_SYSTEM_PROMPT,
  buildFreeUserMessage,
} from "@/lib/minds/inner-child/free-report-prompt";
import { devPersona } from "@/lib/minds/inner-child/dev-personas";
import type { ScoreResult } from "@/lib/minds/inner-child/types";

/**
 * POST /api/dev/inner-child-portrait  ★ 개발 전용 — 프로덕션에서는 404
 *
 * /dev/inner-child-preview 의 "실제 LLM으로 생성" 버튼용. 판매 페이지의 portrait 을 실제
 * 프롬프트·실제 모델로 뽑아 그대로 돌려준다. 목 데이터로는 유형별 필력을 판단할 수 없어서
 * (목은 고정 문장 하나라 유형을 바꿔도 안 바뀐다) 만든 검수 도구다.
 *
 * 실서비스 라우트(/api/inner-child/free-report)는 생성 결과를 리드에 저장하고 {ok, crisis}
 * 만 돌려주므로 화면 검수에 쓸 수 없다. 여기서는 저장하지 않고 본문만 반환한다.
 *
 * 프로덕션 차단: 배포되어도 LLM 을 태울 수 없도록 NODE_ENV 로 막는다(레이트리밋·일일상한 등
 * 비용가드를 태우지 않는 라우트이므로 반드시 닫혀 있어야 한다).
 *
 * Body: { schemaId: string, sct?: Record<string,string> }
 * Resp: { portrait: string } | { error: string }
 */

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const schemaId = typeof b.schemaId === "string" ? b.schemaId : "";
  // sct 를 안 주면 **그 유형의** 페르소나를 쓴다. 예전엔 전 유형이 페르소나 하나를 공유해
  // 어떤 유형을 골라도 같은 사람 얘기가 나왔다(dev-personas.ts 주석 참조).
  const sct =
    b.sct && typeof b.sct === "object"
      ? (b.sct as Record<string, string>)
      : devPersona(schemaId);

  const card = getTypeCard(schemaId);
  if (!card) {
    return NextResponse.json({ error: `알 수 없는 유형: ${schemaId}` }, { status: 400 });
  }

  // 채점 결과는 프롬프트가 읽는 필드만 채운 최소 목 — 실서비스 computeScore 를 대신한다.
  const score = {
    test_version: "v2.0",
    crisis_flag: false,
    areas: {},
    primary_child: {
      schema_id: schemaId,
      child_name: card.child_name,
      score: 20,
      conditional: false,
      top_item_text: card.typical_scenes?.[0] ?? "",
    },
    secondary_children: [],
    entitlement_score: 0,
    guardian: { type: "avoidance", label: "피하는 지킴이", answers: [] },
    sct,
  } as unknown as ScoreResult;

  try {
    const res = await chatCompletion(
      [
        { role: "system", content: FREE_SYSTEM_PROMPT },
        { role: "user", content: buildFreeUserMessage(card, score) },
      ],
      {
        // 실서비스와 동일 설정 — 검수 의미가 있으려면 같아야 한다.
        // ⚠️ max_tokens 를 내리면 thinking 이 예산을 다 써 빈 응답이 온다(free-report 라우트 주석 참조).
        model: "gemini-2.5-pro",
        temperature: 0.7,
        max_tokens: 8192,
        response_format: { type: "json_object" },
      },
    );
    const portrait = safeJsonParse<{ portrait?: string }>(res)?.portrait?.trim();
    if (!portrait) {
      return NextResponse.json({ error: "생성 실패(빈 응답)" }, { status: 502 });
    }
    return NextResponse.json({ portrait });
  } catch (err) {
    console.error("[dev/inner-child-portrait] 생성 실패:", err);
    return NextResponse.json({ error: "생성 중 오류가 발생했어요." }, { status: 500 });
  }
}
