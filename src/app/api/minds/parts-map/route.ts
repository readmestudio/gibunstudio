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
 *  3) 저가 모델(gemini-2.5-flash) + thinking 끔 (단일 패스, 속도 우선)
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
      "name": "다그치는 나",           // 표면 이름 — 본인도 이미 아는 익숙한 마음 (10자 내외)
      "tagline": "무너질까 봐 끊임없이 채찍질하는 마음", // ★표면 아래 '진짜 마음'(해석). name보다 한 겹 더 들어간, 본인이 미처 몰랐던 속마음 (18자 내외)
      "traits": ["완벽주의", "통제"],  // 특성 키워드 2~3개
      "catchphrase": "더 해야 해, 이대론 부족해", // 이 마음이 자주 하는 말 한 줄 (20자 내외)
      "description": "...",            // 이 마음이 어떤 마음인지 (상담가가 써 준 분석 톤). leader 는 4~6문장, 나머지는 2~3문장
      "insight": "...",                // ★"아하 모먼트" — 왜 이 마음을 *반복하는지*의 인과(원인/기원) + 반전 재해석. leader 는 2~3문장, 나머지는 1~2문장. (아래 규칙 5-2 참조)
      "wants": "...",                  // 이 마음이 진짜 바라는 것. leader 는 3~5문장, 나머지는 1~2문장
      "sayings": ["...", "...", "..."], // 이 마음이 자주 내뱉는 대사 (leader 는 3개)
      "fears": "...",                  // 이 마음이 가장 두려워하는 것. leader 는 3~5문장, 나머지는 1~2문장
      "triggers": "...",               // 이 마음이 언제 깨어나는지. leader 는 3~5문장, 나머지는 1~2문장
      "evidence_quote": "...",         // 답변 원문에서 그대로 인용 (없으면 빈 문자열)
      "role": "manager"               // manager|firefighter|exile|self_critic|unclear 중 1개
    }
  ],
  "leader_id": "p1",                  // 지금 가장 앞에 나서는 마음의 id
  "conflicts": [
    { "a": "p1", "b": "p2", "reason": "한 마음은 더 몰아붙이려 하고, 다른 마음은 멈추고 쉬려 해서" }
  ],
  "summary": "..."                    // IFS 통찰: 겉의 마음이 안쪽 여린 마음을 지키려는 보호 논리·인과 (3~4문장)
}

## 규칙
1. parts는 **최대한 3개를 답변에서 끌어내라(최대 3개).** 한 사건 안에도 서로 다른 마음(예: 상처받은 마음 · 따지고 싶은 마음 · 이해하려는 마음)이 동시에 있으니, 답변을 꼼꼼히 읽고 **되도록 3개**를 만든다. 단, 답변에 근거가 전혀 없는 마음을 지어내진 말 것 — 정말 2개만 또렷하면 2개도 괜찮다(부족분은 화면에서 '가정' 카드로 보완된다).
2. name·catchphrase·evidence_quote는 **답변에 근거**하거나 가까운 paraphrase. 없는 내용 지어내기 금지.
2-1. **name 과 tagline 은 일부러 '겉 → 속' 두 겹으로 나눠 쓴다.** name 은 본인도 이미 알아챌 만한 *표면의 마음*("서운해하는 나", "비난하는 나", "다그치는 나")이고, tagline 은 그 표면 아래에서 진짜로 작동하는 *속마음을 해석*해 짚어 준다("기대했다가 실망한 어린 마음", "무시당할까 봐 먼저 날을 세우는 마음"처럼). tagline 은 카드 헤드라인으로 크게 노출되니, name 을 그대로 풀어 쓴 동어반복이나 막연한 별명이 아니라 "아, 사실 내 마음이 이거였구나" 싶은 *한 겹 더 깊은 통찰*이어야 한다. 가능하면 '~하는 마음'으로 끝맺는다.
3. leader_id는 답변에서 *가장 자주·강하게 전면에 나서는* 마음.
4. conflicts는 **0~3개**. 진짜 방향이 반대인 두 마음만. 억지 연결 금지.
5. summary는 단순 요약이 아니라 **IFS 관점의 통찰**을 담는다(3~4문장, '당신' 2인칭, 따뜻한 가설 톤). 마음들을 그냥 나란히 늘어놓지 말고, 다음 (a)→(b)→(c) 흐름을 **반드시** 따라 "왜 이 사람이 이렇게 반응하게 됐는지"의 경위·논리·인과를 짚어준다:
   (a) 지금 가장 앞에 선 마음(leader 또는 보호하는 마음)이 *겉으로* 무엇을 하고 있는지.
   (b) 그런데 그 마음이 *사실은* 안쪽의 더 여리고 상처받기 쉬운 마음(서운함·외로움·상처받은 어린 마음 등 exile 성격)을 지키려고 그렇게 행동한다는 **보호의 논리**. 즉 "겉의 마음 = 안의 마음을 지키려는 방패"라는 연결을 드러낸다.
   (c) 그래서 이 사람이 왜 이런 방식(단호함·다그침·거리두기·무시 등)을 *무기처럼* 꺼내 들게 됐는지 그 **인과**를 한 문장으로 짚는다.
   형식 예: "당신은 서운한 마음을 잠깐 내비쳤다가도, 더는 상처받고 싶지 않아서 〈단호하게 끊어내는 마음〉을 방패처럼 앞세우고 있는 듯해요. 겉으론 쿨하게 정리하는 것 같지만, 그 단호함은 사실 안쪽의 〈상처받은 어린 마음〉이 또 다치지 않게 지키려는 안간힘으로 보여요. 그래서 마음이 약해지려는 순간마다 더 세게 단호함을 꺼내 들게 되는 것 같아요." 단정·진단·평가 금지, "~인 듯해요/~로 보여요/~인 것 같아요"의 가설 톤 유지.
5-2. **insight 는 이 리포트의 핵심 — "아하 모먼트"다.** 유저가 자기 답변을 다시 읽는 수준을 넘어 "아, 내가 *이래서* 그랬구나!" 하고 무릎을 치게 만드는 한 조각이다. description(이 마음이 뭔지 묘사)·wants·fears 를 다른 말로 되풀이하면 실패다. insight 는 반드시 **두 박자**를 담는다:
   (박자1 — 원인/기원) 유저가 *의식하지 못한 인과*를 짚는다. "당신이 이걸 자꾸 반복하는 건, 언젠가 〈…하면 …해진다〉고 익힌 마음이 아직 당신을 지키려 들어서인 것 같아요"처럼, 지금의 반응을 *한때 그를 버티게 해준 학습된 논리/보호 장치*로 연결한다. — 단, 없는 유년 기억·사건을 지어내지 마라("어릴 때 부모님이…" 식 창작 금지). 답변에서 읽히는 *마음의 논리*를 가설로 짚는 데 그친다.
   (박자2 — 반전) 그래서 이 마음이 유저가 여겨온 것과 *다르게* 보인다는 재해석을 준다. "그러니 이건 〈게으름/예민함/못남〉이 아니라, 사실은 〈…를 지키려는 안간힘〉이었던 거예요"처럼, 유저가 자책하던 특성을 *보호 적응*으로 뒤집어 준다.
   ⚠️ **위 두 박자의 예시 문구·〈…〉 자리는 구조를 보여주는 뼈대일 뿐이다.** 반드시 이 사람 *답변의 실제 단어·상황*으로 새로 채워 써라. 예시 문장을 토씨까지 베끼거나, 답변이 성취·번아웃 주제가 아닌데 '성과·증명·게으름·채찍질' 같은 예시 어휘를 끌어오면 실패다(관계 고민이면 관계 언어로, 일 고민이면 그 언어로). 가설 톤(~같아요/~인 셈이에요) 유지, 단정·진단 금지. leader 는 2~3문장으로 밀도 있게, 나머지 마음은 1~2문장으로 간결히.
6. role은 내부 분류용이며 화면에 노출되지 않으니 위 단서로 가장 가까운 1개를 고른다.
7. **description·wants·fears·triggers·sayings 는 이 사람의 *실제 답변 내용*에 맞춰 쓴다.** 답변이 관계 고민이면 관계 언어로, 일/성취 고민이면 성취 언어로, 자기 자신에 대한 고민이면 그 언어로 — 특정 주제(예: 성취·번아웃)로 미리 몰아가지 말 것. 사람마다 다른 결과가 나와야 한다.
8. 본문(description·wants·fears·triggers)은 단답이 아니라 *풀어쓴 문장*으로, "사람이 나를 읽고 있구나" 싶은 따뜻한 상담가 톤(~에요/~습니다). 어떤 마음도 나쁜 마음으로 단정하지 말고, "겉으론 이렇지만 사실은 나를 지키려는 마음"이라는 비판단적 시선을 유지한다.
9. **leader_id 로 지정한 마음은 무료 리포트에서 유일하게 전부 공개되는 '대표 마음'이다.** 이 마음만은 아주 정성껏, 길게 쓴다:
   - description 4~6문장, insight 2~3문장(위 5-2 의 '아하 모먼트' 밀도로), wants·fears·triggers 각 3~5문장, sayings 3개.
   - 이 사람 답변의 **구체적 장면·단어·표현을 짚어** 녹여 넣어(그대로 인용하거나 가까이 paraphrase), "여러 번 읽고 나만을 위해 눌러 쓴 글" 같은 밀도를 준다. 일반론·뜬구름 금지, 이 사람에게만 맞는 디테일로 채운다.
   - 한 문장짜리 단답은 절대 금지. 한 호흡으로 읽히되 문장을 이어 붙여 서사처럼 흐르게 한다.
   - **나머지 parts 는 반대로 간결하게**(위 문장 수 하한) 써서 토큰을 leader 에 몰아준다.

${IFS_TERM_BAN_RULES}`;

  const userMessage = `## 유저가 보고한 답변 (진단)
${userContent}

[읽는 법] 앞부분(상황·몸과 마음의 신호·첫 반응)은 보기에서 고른 *맥락*이고, 큰따옴표로 옮긴 뒤쪽 답변(가장 큰 목소리·다른 목소리·진짜 바란 것)은 유저가 직접 쓴 *실제 속말*이다. name·catchphrase·evidence_quote 는 이 직접 쓴 말에서 우선 인용하고, 앞부분 선택지는 그 마음들이 놓인 상황·감정 배경으로 활용하라.

위 답변을 바탕으로 parts · leader_id · conflicts · summary를 JSON으로 응답하세요.`;

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    {
      // 무료 깔때기 — 비용 절감을 위해 flash + thinking 끔. (유료 워크북은 pro 유지)
      // 대표 마음(leader)만 길고 정성스럽게 서술하고 나머지는 간결히 — 그 leader 프로즈가
      // 잘리지 않게 토큰을 넉넉히. temperature 는 서술형 표현을 위해 살짝 높인다.
      model: "gemini-2.5-flash",
      temperature: 0.7,
      max_tokens: 8192,
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
          insight:
            "당신이 좀처럼 멈추지 못하는 건 게을러질까 봐가 아니라, '멈추는 순간 나를 증명할 게 사라진다'고 배운 마음이 아직 당신을 지키고 있어서인 것 같아요. 그래서 그 다그침은 결함이 아니라, 무너지지 않으려고 오래 붙들어 온 생존 방식이었던 셈이에요.",
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
        "당신은 지금도 스스로를 더 몰아붙이며 다그치고 있는 듯해요. 하지만 그 다그침은 사실, 멈추는 순간 무너질까 봐 두려운 〈지치고 쉬고 싶은 여린 마음〉이 더 아프지 않게 지키려는 안간힘으로 보여요. 그래서 마음이 약해지려 할 때마다 더 세게 '더 해야 한다'를 꺼내 드는 것 같아요.",
      source: "dialogue",
      generated_at: new Date().toISOString(),
    },
  };

  // readPartsMap 은 항상 유효(파츠 2개)한 지도를 반환한다.
  return readPartsMap(raw) as PartsMap;
}
