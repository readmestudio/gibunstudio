import { NextResponse } from "next/server";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import { requireWorkshopAccess } from "@/lib/self-workshop/api-guard";
import { RATE_LIMITS } from "@/lib/rate-limit";
import {
  IFS_TERM_BAN_RULES,
  PART_TYPE_REFERENCE,
} from "@/lib/self-workshop/ifs-parts-data";
import {
  readPartsMap,
  type PartsMap,
  type SctResponses,
} from "@/lib/self-workshop/core-belief-excavation";
import {
  readDialogue,
  readDialogueRecap,
} from "@/lib/self-workshop/conversation";
import {
  SCT_QUESTIONS,
  SCT_CATEGORIES,
  type SctCategoryCode,
} from "@/lib/self-workshop/sct-questions";

/**
 * POST /api/self-workshop/parts-map
 *
 * Step 4(핵심 신념 찾기) 마무리에서, 유저가 보고한 답변(SCT 14문항 또는 IFS 대화)을
 * 분석해 내면의 여러 마음을 캐릭터화하고 그들의 관계를 도식화한다.
 * 결과는 core_belief_excavation.parts_map에 멱등 저장되어 이후 단계(5·9)도 재참조 가능.
 *
 * Body: { workshopId, source: "sct" | "dialogue", force? }
 *  - 입력 데이터(SCT 응답·대화)는 서버가 DB에서 직접 읽는다(신뢰 경계 + 멱등성).
 *
 * Resp: { parts_map: PartsMap | null }
 *  - 어떤 실패든 200 + parts_map:null 로 마무리/진행을 막지 않는다.
 */

interface PartsMapResponse {
  parts_map: PartsMap | null;
}

export async function POST(req: Request) {
  const guard = await requireWorkshopAccess(req, {
    rateLimit: RATE_LIMITS.conversation,
  });
  if (!guard.ok) return guard.response;
  const { user, supabase } = guard;

  const body = await req.json().catch(() => ({}));
  const workshopId =
    typeof body?.workshopId === "string" ? body.workshopId : "";
  const source: "sct" | "dialogue" = body?.source === "sct" ? "sct" : "dialogue";
  const force = body?.force === true;

  if (!workshopId) {
    return NextResponse.json({ parts_map: null } as PartsMapResponse);
  }

  const { data: progress } = await supabase
    .from("workshop_progress")
    .select("*")
    .eq("id", workshopId)
    .single();

  if (!progress || progress.user_id !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const existing =
    (progress.core_belief_excavation as Record<string, unknown> | null) ?? null;

  // 멱등 캐시 — 이미 분석돼 있으면 LLM 미호출.
  if (!force) {
    const cached = readPartsMap(existing);
    if (cached) {
      return NextResponse.json({ parts_map: cached } as PartsMapResponse);
    }
  }

  // 입력 직렬화 — source별로 다르게, Step 3 마음 프로필을 보조 컨텍스트로.
  const partProfile = readDialogueRecap(progress.parts_discovery)?.part_profile;
  const profileContext = partProfile
    ? `\n\n## Step 3에서 만난 마음 (참조용)\n- 이름: ${partProfile.name}\n- 자동사고: ${partProfile.automatic_thought}\n- 역할: ${partProfile.role}`.slice(
        0,
        400
      )
    : "";

  let userContent = "";
  let userQuotes: string[] = [];
  if (source === "sct") {
    const responses = (existing?.sct_responses as SctResponses) ?? {};
    userContent = buildSctInput(responses);
    userQuotes = collectSctQuotes(responses);
  } else {
    const transcript = readDialogue(existing);
    if (transcript) {
      const answered = transcript.turns.filter(
        (t) => t.answer.trim().length > 0
      );
      userContent = answered
        .map((t) => `Q: ${t.question}\nA: ${t.answer}`)
        .join("\n\n");
      userQuotes = answered.map((t) => t.answer.trim());
    }
  }

  // 입력이 비면 그릴 게 없음.
  if (!userContent.trim()) {
    return NextResponse.json({ parts_map: null } as PartsMapResponse);
  }

  // LLM 분석 — 일시적 실패(타임아웃·JSON 깨짐)에 대비해 최대 2회 재시도.
  let partsMap: PartsMap | null = null;
  for (let attempt = 0; attempt < 2 && !partsMap; attempt++) {
    try {
      partsMap = await analyzePartsMap(userContent + profileContext, source);
    } catch (err) {
      console.error(`[parts-map] LLM 시도 ${attempt + 1} 실패:`, err);
    }
  }

  if (partsMap) {
    // 성공한 분석만 캐시 저장(merge). 폴백은 저장하지 않아, 이후 방문 시 LLM이
    // 회복되면 더 정교한 마음 지도로 자동 대체된다.
    const merged = { ...(existing ?? {}), parts_map: partsMap };
    await supabase
      .from("workshop_progress")
      .update({ core_belief_excavation: merged })
      .eq("id", workshopId);
    return NextResponse.json({ parts_map: partsMap } as PartsMapResponse);
  }

  // LLM이 모두 실패해도 — 사용자 답변에서 최소한의 "마음 캐릭터"를 구성해 반드시 노출.
  // (성취 중독 워크북의 전형적 긴장 골격 + evidence_quote는 사용자 실제 답변으로 개인화)
  const fallback = buildFallbackPartsMap(userQuotes, source);
  return NextResponse.json({ parts_map: fallback } as PartsMapResponse);
}

/* ─────────────── SCT 14문항 → LLM 입력 ─────────────── */

function buildSctInput(responses: SctResponses): string {
  const grouped: Record<SctCategoryCode, string[]> = { A: [], B: [], C: [], D: [] };
  for (const q of SCT_QUESTIONS) {
    const r = responses[q.code];
    const value =
      r && !r.skipped && r.answer.trim().length > 0
        ? `"${r.answer.trim()}"`
        : "(건너뜀)";
    grouped[q.category].push(`${q.code}. ${q.prompt} → ${value}`);
  }
  const hasAny = Object.values(grouped).some((arr) =>
    arr.some((line) => !line.endsWith("(건너뜀)"))
  );
  if (!hasAny) return "";

  return (Object.keys(grouped) as SctCategoryCode[])
    .map(
      (code) =>
        `[${code}. ${SCT_CATEGORIES[code].labelKo}]\n${grouped[code].join("\n")}`
    )
    .join("\n\n");
}

/** SCT 응답에서 건너뛰지 않은 사용자 답변 원문만 추려 폴백 인용에 사용. */
function collectSctQuotes(responses: SctResponses): string[] {
  const out: string[] = [];
  for (const q of SCT_QUESTIONS) {
    const r = responses[q.code];
    if (r && !r.skipped && r.answer.trim().length > 0) {
      out.push(r.answer.trim());
    }
  }
  return out;
}

/* ─────────────── 폴백: 사용자 답변 기반 마음 캐릭터 ─────────────── */

/**
 * LLM 분석이 모두 실패했을 때, 사용자 답변에서 최소한의 "마음 캐릭터"를 구성하는
 * 결정론적 폴백. 성취 중독 워크북의 전형적 긴장(더 하라고 다그치는 마음 ↔ 멈추고
 * 쉬고 싶은 마음)을 골격으로 삼고, evidence_quote만 사용자의 실제 답변으로 채워
 * 개인화한다. readPartsMap을 거쳐 항상 유효한(파츠 2개) PartsMap을 반환하므로,
 * 화면의 PartsMapSection이 빈 화면으로 숨는 일이 없다.
 */
function buildFallbackPartsMap(
  userQuotes: string[],
  source: "sct" | "dialogue"
): PartsMap | null {
  const quotes = userQuotes
    .map((q) => q.trim())
    .filter((q) => q.length > 0);

  // 주제에 맞는 인용을 고르고(없으면 첫 답변), 너무 길면 줄임.
  const pick = (prefer: RegExp, exclude?: string): string => {
    const pool = quotes.filter((q) => q !== exclude);
    const chosen = pool.find((q) => prefer.test(q)) ?? pool[0] ?? "";
    return chosen.length > 70 ? `${chosen.slice(0, 68)}…` : chosen;
  };

  const driveQuote = pick(/해야|더|완벽|멈추|쉬면|불안|부족|열심|증명/);
  const restQuote = pick(/지치|힘들|쉬고|피곤|번아웃|그만|버겁|쉼|싫/, driveQuote);

  const raw = {
    parts_map: {
      parts: [
        {
          id: "p1",
          name: "더 해야 한다고 다그치는 마음",
          traits: ["성취 압박", "통제"],
          catchphrase: "더 해야 해, 멈추면 안 돼",
          evidence_quote: driveQuote,
          role: "manager",
        },
        {
          id: "p2",
          name: "이제는 멈추고 쉬고 싶은 마음",
          traits: ["피로", "쉼"],
          catchphrase: "이제 좀 쉬고 싶어",
          evidence_quote: restQuote,
          role: "exile",
        },
      ],
      leader_id: "p1",
      conflicts: [
        {
          a: "p1",
          b: "p2",
          reason:
            "한 마음은 더 몰아붙이려 하고, 다른 마음은 멈추고 쉬고 싶어 해서 자주 부딪쳐요",
        },
      ],
      summary:
        "당신 안에는 끊임없이 더 하라고 다그치는 마음과, 이제는 멈추고 쉬고 싶은 마음이 함께 있어요. 지금은 다그치는 마음이 조금 더 앞에 서 있는 것 같아요.",
      source,
      generated_at: new Date().toISOString(),
    },
  };

  return readPartsMap(raw);
}

/* ─────────────── LLM 분석 ─────────────── */

/** PART_TYPE_REFERENCE를 role 추정 단서로 직렬화. */
function buildPartTypeReference(): string {
  return PART_TYPE_REFERENCE.map(
    (t) => `- ${t.role} (${t.user_facing_label}): ${t.signals.join(", ")}`
  ).join("\n");
}

async function analyzePartsMap(
  userContent: string,
  source: "sct" | "dialogue"
): Promise<PartsMap | null> {
  const systemPrompt = `당신은 성취 중독을 다루는 따뜻한 IFS(내면가족체계) 진행자입니다. 직장인 3~15년차 내담자가 보고한 답변을 바탕으로, 그 사람 안에서 작동하는 **여러 마음(파츠)을 캐릭터화**하고 그들의 관계를 짚어 주세요. 한 사람 안에는 서로 다른 목소리를 내는 여러 마음이 있고, 그중 어떤 마음이 지금 가장 앞에 나서 있으며, 어떤 두 마음이 서로 자주 부딪치는지를 보여줍니다.

## 마음 역할 추정 단서 (role 필드용, 내부 분류 — 화면 비노출)
${buildPartTypeReference()}

## 출력 스키마 (JSON 단일 객체로만, 다른 텍스트 금지)
{
  "parts": [
    {
      "id": "p1",                     // "p1","p2"… 안정적 식별자
      "name": "다그치는 나",           // 마음 이름 (10자 내외, 답변에 이름이 있으면 우선)
      "traits": ["완벽주의", "통제"],  // 특성 키워드 2~3개
      "catchphrase": "더 해야 해",     // 이 마음이 자주 하는 말 한 줄 (20자 내외)
      "evidence_quote": "...",         // 답변 원문에서 그대로 인용 (없으면 빈 문자열)
      "role": "manager"               // manager|firefighter|exile|self_critic|unclear 중 1개
    }
  ],
  "leader_id": "p1",                  // 지금 가장 앞에 나서는 마음의 id
  "conflicts": [
    { "a": "p1", "b": "p2", "reason": "한 마음은 더 몰아붙이려 하고, 다른 마음은 멈추고 쉬려 해서" }
  ],
  "summary": "..."                    // 전체 흐름 요약 2~3문장
}

## 규칙
1. parts는 **2~5개**. 답변에서 또렷이 구분되는 마음만. 억지로 늘리지 말 것.
2. name·catchphrase·evidence_quote는 **답변에 근거**하거나 가까운 paraphrase. 없는 내용 지어내기 금지.
3. leader_id는 답변에서 *가장 자주·강하게 전면에 나서는* 마음. 보통 통제·다그침·성취 압박 계열.
4. conflicts는 **0~3개**. 진짜 방향이 반대인 두 마음만(예: 몰아붙이는 마음 ↔ 쉬고 싶은 마음). 억지 연결 금지.
5. summary는 "당신 안에는 ~한 마음과 ~한 마음이 있고, 지금은 ~한 마음이 앞에 서 있어요" 류. 단정·진단·평가 금지, 따뜻한 가설 톤.
6. role은 내부 분류용이며 화면에 노출되지 않으니 위 단서로 가장 가까운 1개를 고른다.

${IFS_TERM_BAN_RULES}`;

  const userMessage = `## 유저가 보고한 답변 (${source === "sct" ? "문장 완성 14문항" : "상담 대화"})
${userContent}

위 답변을 바탕으로 parts · leader_id · conflicts · summary를 JSON으로 응답하세요.`;

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    {
      model: "gemini-2.5-pro",
      temperature: 0.5,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    }
  );

  const parsed = safeJsonParse<Record<string, unknown>>(response);
  if (!parsed || typeof parsed !== "object") return null;

  // source·generated_at을 주입한 뒤 방어 reader로 정규화(id 참조 무결성 보정).
  const raw = {
    parts_map: {
      ...parsed,
      source,
      generated_at: new Date().toISOString(),
    },
  };
  return readPartsMap(raw);
}
