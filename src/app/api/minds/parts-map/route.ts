import { NextRequest, NextResponse } from "next/server";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  IFS_TERM_BAN_RULES,
  PART_TYPE_REFERENCE,
} from "@/lib/self-workshop/ifs-parts-data";
import {
  readPartsMap,
  type PartsMap,
} from "@/lib/self-workshop/core-belief-excavation";
import { getSavedPartsMap } from "@/lib/minds/result-store";

/**
 * POST /api/minds/parts-map  (공개 — 로그인 불필요)
 *
 * 무료 /minds 축약 대화(5문항) 답변을 받아, 그 사람 안에서 작동하는 여러 마음을
 * 캐릭터화한 마음 지도(PartsMap)를 생성한다. 유료 워크북의 parts-map 분석과 같은
 * 역할 추정 단서·용어 가드를 재사용하되, 입력은 서버 DB가 아니라 *요청 본문*에서
 * 직접 받는다(무료 흐름엔 workshop_progress 가 없으므로).
 *
 * leadId 가 함께 오면 같은 리드 행(minds_leads)에 answers·parts_map 을 붙인다.
 *
 * 비용 방어(무료 깔때기라 호출 폭주 시 비용 위험):
 *  0) **리드당 1회 캐시** — leadId 가 이미 parts_map 을 가졌으면 저장본을 돌려주고
 *     LLM 을 재호출하지 않는다. "테스트 1인 1회(재분석 불가)" 정책과도 일치.
 *  1) IP 레이트리밋(ai: 5회/분)
 *  2) 전역 일일 상한(MINDS_LLM_DAILY_LIMIT, 기본 500) — 초과 시 LLM 미호출, 폴백
 *  3) 저가 모델(gemini-2.5-flash) + thinking 끔
 *
 * Body: { answers: {id,question,answer}[], leadId?: string }
 * Resp: { parts_map: PartsMap }  — 어떤 실패든 폴백으로 항상 유효한 지도를 돌려준다.
 */

/** 무료 /minds LLM 분석의 전역 일일 호출 상한(비용 천장). 환경변수로 조절. */
const DAILY_LIMIT = Number(process.env.MINDS_LLM_DAILY_LIMIT ?? 500);

/**
 * 오늘 LLM 분석 호출이 일일 상한 안인지 확인하고, 안이면 카운터를 1 올린다(원자적).
 * 상한 초과면 false → 호출 측이 LLM 을 건너뛰고 폴백을 쓴다. DB 오류 시에는
 * fail-open(평소처럼 LLM 진행) — 일시적 DB 장애로 서비스가 폴백 전용이 되지 않도록.
 */
async function withinDailyBudget(): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("minds_llm_bump", {
      p_limit: DAILY_LIMIT,
    });
    if (error) {
      console.error("[minds/parts-map] 일일 카운터 RPC 오류:", error);
      return true; // fail-open
    }
    if (typeof data === "number" && data > DAILY_LIMIT) {
      console.warn(`[minds/parts-map] 일일 상한(${DAILY_LIMIT}) 도달 — 폴백 사용`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[minds/parts-map] 일일 카운터 확인 실패:", err);
    return true; // fail-open
  }
}

interface InAnswer {
  id: string;
  question: string;
  answer: string;
}

function cleanAnswers(value: unknown): InAnswer[] {
  if (!Array.isArray(value)) return [];
  const out: InAnswer[] = [];
  for (const a of value) {
    if (!a || typeof a !== "object") continue;
    const o = a as Record<string, unknown>;
    const answer = typeof o.answer === "string" ? o.answer.trim() : "";
    if (!answer) continue;
    out.push({
      id: typeof o.id === "string" ? o.id : "",
      question: typeof o.question === "string" ? o.question.slice(0, 300) : "",
      answer: answer.slice(0, 2000),
    });
  }
  return out;
}

/**
 * GET /api/minds/parts-map?leadId=...  — 저장된 결과 다시보기(읽기 전용, LLM 미호출).
 * 결과 페이지(/minds/r/[id])·재방문 자동 복원이 사용한다.
 */
export async function GET(req: NextRequest) {
  const leadId = req.nextUrl.searchParams.get("leadId")?.trim() ?? "";
  if (!leadId) {
    return NextResponse.json({ error: "leadId가 필요합니다." }, { status: 400 });
  }
  const partsMap = await getSavedPartsMap(leadId);
  if (!partsMap) {
    return NextResponse.json({ error: "결과를 찾을 수 없어요." }, { status: 404 });
  }
  return NextResponse.json({ parts_map: partsMap });
}

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, RATE_LIMITS.ai);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const b = (body ?? {}) as Record<string, unknown>;

  const answers = cleanAnswers(b.answers);
  const leadId = typeof b.leadId === "string" ? b.leadId : "";

  // [0] 리드당 1회 — 이미 분석한 리드면 저장본을 돌려주고 LLM 재호출을 막는다(비용 보호).
  if (leadId) {
    const cached = await getSavedPartsMap(leadId);
    if (cached) return NextResponse.json({ parts_map: cached, cached: true });
  }

  const userContent = answers
    .map((a) => `Q: ${a.question}\nA: ${a.answer}`)
    .join("\n\n");
  const userQuotes = answers.map((a) => a.answer);

  // 입력이 비면 그릴 게 없음 — 그래도 빈 폴백으로 최소 캐릭터는 보장.
  let partsMap: PartsMap | null = null;
  if (userContent.trim() && (await withinDailyBudget())) {
    // LLM 분석 — 일시적 실패(타임아웃·JSON 깨짐)에 대비해 최대 2회 재시도.
    for (let attempt = 0; attempt < 2 && !partsMap; attempt++) {
      try {
        partsMap = await analyzePartsMap(userContent);
      } catch (err) {
        console.error(`[minds/parts-map] LLM 시도 ${attempt + 1} 실패:`, err);
      }
    }
  }

  // LLM 실패/빈 입력 → 사용자 답변 기반 결정론적 폴백(항상 유효한 지도).
  if (!partsMap) partsMap = buildFallbackPartsMap(userQuotes);

  // 리드가 있으면 답변·결과를 같은 행에 저장한다. 응답 전에 동기로 저장해, 다음
  // 호출(새로고침·재시도)이 [0] 캐시에 확실히 걸리도록 — 리드당 LLM 1회를 보장.
  if (leadId && partsMap) {
    try {
      const admin = createAdminClient();
      await admin
        .from("minds_leads")
        .update({ answers, parts_map: partsMap })
        .eq("id", leadId);
    } catch (err) {
      console.error("[minds/parts-map] 리드 UPDATE 실패:", err);
    }
  }

  return NextResponse.json({ parts_map: partsMap });
}

/* ─────────────── LLM 분석 ─────────────── */

function buildPartTypeReference(): string {
  return PART_TYPE_REFERENCE.map(
    (t) => `- ${t.role} (${t.user_facing_label}): ${t.signals.join(", ")}`
  ).join("\n");
}

async function analyzePartsMap(userContent: string): Promise<PartsMap | null> {
  const systemPrompt = `당신은 따뜻한 IFS(내면가족체계) 진행자입니다. 내담자가 보고한 답변을 바탕으로, 그 사람 안에서 작동하는 **여러 마음(파츠)을 캐릭터화**하고 그들의 관계를 짚어 주세요. 한 사람 안에는 서로 다른 목소리를 내는 여러 마음이 있고, 그중 어떤 마음이 지금 가장 앞에 나서 있으며, 어떤 두 마음이 서로 자주 부딪치는지를 보여줍니다.

## 마음 역할 추정 단서 (role 필드용, 내부 분류 — 화면 비노출)
${buildPartTypeReference()}

## 출력 스키마 (JSON 단일 객체로만, 다른 텍스트 금지)
{
  "parts": [
    {
      "id": "p1",                     // "p1","p2"… 안정적 식별자
      "name": "다그치는 나",           // 마음 이름 (10자 내외, 답변에 이름이 있으면 우선)
      "tagline": "한순간도 봐주지 않는 내면의 감독관", // 한 줄 별명/직함 (15자 내외)
      "traits": ["완벽주의", "통제"],  // 특성 키워드 2~3개
      "catchphrase": "더 해야 해, 이대론 부족해", // 이 마음이 자주 하는 말 한 줄 (20자 내외)
      "description": "...",            // 이 마음이 어떤 마음인지 2~3문장 (상담가가 써 준 분석 톤)
      "wants": "...",                  // 이 마음이 진짜 바라는 것 1~2문장
      "sayings": ["...", "...", "..."], // 이 마음이 자주 내뱉는 대사 2~3개
      "fears": "...",                  // 이 마음이 가장 두려워하는 것 1~2문장
      "triggers": "...",               // 이 마음이 언제 깨어나는지 1~2문장
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
1. parts는 **최대한 3개를 답변에서 끌어내라(최대 3개).** 한 사건 안에도 서로 다른 마음(예: 상처받은 마음 · 따지고 싶은 마음 · 이해하려는 마음)이 동시에 있으니, 답변을 꼼꼼히 읽고 **되도록 3개**를 만든다. 단, 답변에 근거가 전혀 없는 마음을 지어내진 말 것 — 정말 2개만 또렷하면 2개도 괜찮다(부족분은 화면에서 '가정' 카드로 보완된다).
2. name·catchphrase·evidence_quote는 **답변에 근거**하거나 가까운 paraphrase. 없는 내용 지어내기 금지.
3. leader_id는 답변에서 *가장 자주·강하게 전면에 나서는* 마음.
4. conflicts는 **0~3개**. 진짜 방향이 반대인 두 마음만. 억지 연결 금지.
5. summary는 유저의 답변과 위 마음들을 **한 문단으로 종합**한다(2~3문장, '당신' 2인칭). 가장 앞에 나선 마음(leader)과 그와 부딪치는 마음을 엮어준다. 형식 예: "당신의 마음 속에는 지금 ~한 마음이 크게 자리하고 있어요. 하지만 동시에 ~한 마음도 함께 있어서, ~." 단정·진단·평가 금지, 따뜻한 가설 톤.
6. role은 내부 분류용이며 화면에 노출되지 않으니 위 단서로 가장 가까운 1개를 고른다.
7. **description·wants·fears·triggers·sayings 는 이 사람의 *실제 답변 내용*에 맞춰 쓴다.** 답변이 관계 고민이면 관계 언어로, 일/성취 고민이면 성취 언어로, 자기 자신에 대한 고민이면 그 언어로 — 특정 주제(예: 성취·번아웃)로 미리 몰아가지 말 것. 사람마다 다른 결과가 나와야 한다.
8. 본문(description·wants·fears·triggers)은 단답이 아니라 *풀어쓴 문장*으로, "사람이 나를 읽고 있구나" 싶은 따뜻한 상담가 톤(~에요/~습니다). 어떤 마음도 나쁜 마음으로 단정하지 말고, "겉으론 이렇지만 사실은 나를 지키려는 마음"이라는 비판단적 시선을 유지한다.

${IFS_TERM_BAN_RULES}`;

  const userMessage = `## 유저가 보고한 답변 (상담 대화)
${userContent}

위 답변을 바탕으로 parts · leader_id · conflicts · summary를 JSON으로 응답하세요.`;

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    {
      // 무료 깔때기 — 비용 절감을 위해 flash + thinking 끔. (유료 워크북은 pro 유지)
      // 캐릭터 카드 본문(설명·원하는 것·두려움 등)을 풀로 생성하므로 토큰을 넉넉히.
      model: "gemini-2.5-flash",
      temperature: 0.6,
      max_tokens: 6144,
      thinking_budget: 0,
      response_format: { type: "json_object" },
    }
  );

  const parsed = safeJsonParse<Record<string, unknown>>(response);
  if (!parsed || typeof parsed !== "object") return null;

  const raw = {
    parts_map: {
      ...parsed,
      source: "dialogue",
      generated_at: new Date().toISOString(),
    },
  };
  return readPartsMap(raw);
}

/* ─────────────── 폴백: 사용자 답변 기반 마음 캐릭터 ─────────────── */

/**
 * LLM 분석이 실패했을 때, 사용자 답변에서 최소한의 "마음 캐릭터"를 구성하는
 * 결정론적 폴백. 성취 중독의 전형적 긴장(더 하라고 다그치는 마음 ↔ 멈추고 쉬고
 * 싶은 마음)을 골격으로 삼고, evidence_quote만 사용자의 실제 답변으로 개인화한다.
 */
function buildFallbackPartsMap(userQuotes: string[]): PartsMap {
  const quotes = userQuotes
    .map((q) => q.trim())
    .filter((q) => q.length > 0);

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
      source: "dialogue",
      generated_at: new Date().toISOString(),
    },
  };

  // readPartsMap 은 항상 유효(파츠 2개)한 지도를 반환한다.
  return readPartsMap(raw) as PartsMap;
}
