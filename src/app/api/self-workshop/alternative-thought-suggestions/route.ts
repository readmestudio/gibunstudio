import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import type {
  AltThoughtCard,
  AltThoughtCardId,
} from "@/lib/self-workshop/alternative-thought-simulation";

/**
 * POST /api/self-workshop/alternative-thought-suggestions
 *
 * Stage 07 (대안 자동사고 시뮬레이션) — PART B 진입 시 사용자 사례에 맞춰
 * SOFTEN / REFRAME / DECOUPLE 3개 카드(text + why)를 생성.
 *
 * Body: { situation: string, original_automatic_thought: string }
 * Resp: { cards: AltThoughtCard[] }   // 3개 (id 순서: soften, reframe, decouple)
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
  const situation =
    typeof body?.situation === "string" ? body.situation.trim() : "";
  const originalThought =
    typeof body?.original_automatic_thought === "string"
      ? body.original_automatic_thought.trim()
      : "";

  if (!situation || !originalThought) {
    return NextResponse.json(
      { error: "상황과 기존 자동사고가 필요합니다" },
      { status: 400 }
    );
  }

  try {
    const cards = await runGenerateCards(situation, originalThought);
    return NextResponse.json({ cards });
  } catch (err) {
    console.error("[alt-thought-suggestions] 생성 실패:", err);
    return NextResponse.json(
      { error: "AI 처리에 실패했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}

const CARD_META: ReadonlyArray<Pick<AltThoughtCard, "id" | "code" | "label">> = [
  { id: "soften", code: "A · SOFTEN", label: "작은 한 걸음" },
  { id: "reframe", code: "B · REFRAME", label: "중간" },
  { id: "decouple", code: "C · DECOUPLE", label: "큰 한 걸음" },
];

interface RawCardNode {
  id?: unknown;
  text?: unknown;
  why?: unknown;
}

async function runGenerateCards(
  situation: string,
  originalThought: string
): Promise<AltThoughtCard[]> {
  const systemPrompt = `당신은 인지행동치료(CBT) 워크북을 함께 진행하는 부드럽고 따뜻한 진행자입니다. 직장인 3~15년차 페르소나의 사용자가 "같은 상황을 다른 자동사고로 다시 보는" 연습을 돕고 있어요.

## 작업
사용자의 상황과 기존 자동사고를 받아, **세 단계 강도(SOFTEN/REFRAME/DECOUPLE)**의 대안 자동사고 카드 3개를 만들어 주세요.

## 단계 정의
- SOFTEN (작은 한 걸음): 기존 사고의 표현을 부드럽게 다듬는 수준. 예) "못한다 → 신중하다" 같은 re-reading.
- REFRAME (중간): 사실과 결론을 분리. 예) "X가 일어났다는 게 곧 내가 Y한 사람이라는 뜻은 아니다".
- DECOUPLE (큰 한 걸음): 결과와 자기 가치를 완전히 분리. 가장 멀리 가는 시선.

## 규칙
- 각 카드의 text는 사용자가 1인칭으로 떠올릴 수 있는 자연스러운 내면 발화. 큰 따옴표·별표(*) 등 마크다운 없이 본문만. 25~70자.
- 각 카드의 why는 "왜 이게 더 정확할까" 한 문장 (15~45자).
- 비현실적 긍정 ("다 잘 될 거야") 금지. 임상 용어 금지.
- 일상적 한국어, 따뜻하지만 가르치지 않는 톤.

## 응답 형식
반드시 아래 JSON 단일 객체로만 응답하세요. 키 이름·순서·구조를 그대로 지켜주세요. 다른 텍스트 절대 포함 금지.
{
  "cards": [
    { "id": "soften",   "text": "...", "why": "..." },
    { "id": "reframe",  "text": "...", "why": "..." },
    { "id": "decouple", "text": "...", "why": "..." }
  ]
}`;

  const userMessage = `## 상황
"${situation}"

## 사용자의 기존 자동사고
"${originalThought}"

위 상황에 대해 SOFTEN / REFRAME / DECOUPLE 강도별 대안 자동사고 카드 3개를 위 JSON 형식으로 응답하세요.`;

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    {
      model: "gemini-2.5-flash",
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    }
  );

  const parsed = safeJsonParse<unknown>(response);
  const candidates = collectCandidates(parsed);

  const cards: AltThoughtCard[] = [];
  for (let i = 0; i < CARD_META.length; i++) {
    const meta = CARD_META[i];
    const node =
      candidates.find((c) => normalizeId(c.id) === meta.id) ?? candidates[i];
    const text = typeof node?.text === "string" ? node.text.trim() : "";
    const why = typeof node?.why === "string" ? node.why.trim() : "";
    if (!text || !why) {
      console.error(
        `[alt-thought-suggestions] 카드 ${meta.id} 누락. raw 응답:`,
        response
      );
      throw new Error(`카드 ${meta.id} 응답이 비었습니다`);
    }
    cards.push({ ...meta, text, why });
  }

  return cards;
}

/**
 * Gemini가 응답을 wrapper에 감싸거나 키 이름을 살짝 다르게 주는 경우가 있음.
 * - 평면 객체: { soften: {...}, reframe: {...}, decouple: {...} }
 * - 배열 wrapper: { cards: [{ id, text, why }, ...] } (우리가 요청한 형식)
 * - 평면 wrapper: { cards: { soften: ..., ... } }
 * - 키 변형: { "A · SOFTEN": ..., a: ..., 0: ... }
 *
 * 가능한 모든 형태를 평탄화해 후보 리스트로 반환.
 */
function collectCandidates(parsed: unknown): RawCardNode[] {
  if (!parsed || typeof parsed !== "object") return [];

  // 1) 직접 cards 배열인 경우
  if (Array.isArray(parsed)) {
    return parsed as RawCardNode[];
  }

  const obj = parsed as Record<string, unknown>;

  // 2) cards 필드 안에 배열 또는 객체
  if (obj.cards !== undefined) {
    if (Array.isArray(obj.cards)) return obj.cards as RawCardNode[];
    if (obj.cards && typeof obj.cards === "object") {
      return objectToList(obj.cards as Record<string, unknown>);
    }
  }

  // 3) 객체 자체가 soften/reframe/decouple 키를 직접 가짐
  return objectToList(obj);
}

function objectToList(obj: Record<string, unknown>): RawCardNode[] {
  const out: RawCardNode[] = [];
  for (const key of Object.keys(obj)) {
    const v = obj[key];
    if (!v || typeof v !== "object") continue;
    const node = v as RawCardNode;
    // 키에서 id를 추론 (객체 안에 id가 없을 때)
    const inferredId = node.id ?? key;
    out.push({ ...node, id: inferredId });
  }
  return out;
}

function normalizeId(raw: unknown): AltThoughtCardId | null {
  if (typeof raw !== "string") return null;
  const lower = raw.trim().toLowerCase();
  if (lower.includes("soften") || lower === "a") return "soften";
  if (lower.includes("reframe") || lower === "b") return "reframe";
  if (lower.includes("decouple") || lower === "c") return "decouple";
  return null;
}
