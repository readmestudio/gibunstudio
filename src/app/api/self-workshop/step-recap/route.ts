import { NextResponse } from "next/server";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import { requireWorkshopAccess } from "@/lib/self-workshop/api-guard";
import { RATE_LIMITS } from "@/lib/rate-limit";
import {
  type ConversationTranscript,
  type CoreWishData,
  type PartProfileData,
  type StepKey,
  type StepRecap,
  type SurfaceCardData,
  type TruthCardData,
} from "@/lib/self-workshop/conversation";
import { IFS_TERM_BAN_RULES } from "@/lib/self-workshop/ifs-parts-data";

/**
 * POST /api/self-workshop/step-recap
 *
 * 한 단계 대화가 끝난 직후 done 화면 시각화 3카드 데이터를 LLM이 생성한다.
 * Body: { step_key, transcript }
 * Resp: { recap: StepRecap }
 *
 * 시각화 필드(surface_card·truth_card·core_wish·next_step_bridge)는 모두 optional.
 * LLM이 못 뽑은 카드는 undefined로 두고 UI가 폴백 처리. 어떤 실패든 200 응답으로
 * 흐름을 막지 않는다.
 *
 * narrative·motive·emotion·closing_line은 2026-06-03 시각화 도입으로 폐기되었지만
 * 옛 dialogue_recap 호환을 위해 응답 인터페이스에는 빈 값으로 살려둔다.
 */

const FALLBACK_CLOSING = "여기까지 함께 와줘서 고마워요.";

const STEP_FOCUS: Record<StepKey, string> = {
  // legacy CBT
  mechanism: "성취 압박이 올라온 한 순간 (상황·감정·자동사고·몸·행동)",
  core_belief: "성취 중독 아래 깔린 핵심 신념 (자기가치·성취·관계·통제)",
  new_belief: "낡은 신념을 대신할 새 신념",
  belief_evidence: "새 신념을 뒷받침하는 근거",
  // IFS 재설계
  parts_discovery:
    "한 사건 안에서 활성화된 마음 안의 여러 목소리·움직임을 하나씩 알아본 시간",
  schema_inquiry:
    "삶 전반에 자주 나타나는 마음의 패턴을 5개 영역에서 살펴본 시간",
  parts_integration:
    "내담자 안에서 보호하는 마음들의 본래 바람·긍정 의도를 발견한 시간",
};

/** step별 다음 단계 안내문 폴백 — LLM이 next_step_bridge를 못 뽑았을 때 사용. */
const NEXT_STEP_BRIDGE_FALLBACK: Record<StepKey, string> = {
  mechanism: "다음 단계에서는 이 흐름 아래의 핵심 신념을 살펴볼 거예요.",
  core_belief: "다음 단계에서는 이 신념을 대신할 새 신념을 만들어볼 거예요.",
  new_belief: "다음 단계에서는 새 신념을 뒷받침할 근거를 모아볼 거예요.",
  belief_evidence: "다음 단계로 함께 넘어가요.",
  parts_discovery:
    "다음 단계에서는 이 마음에 영향을 준 더 깊은 패턴을 함께 살펴볼 거예요.",
  schema_inquiry:
    "다음 단계에서는 이 패턴이 어떤 마음들을 빚어왔는지 함께 들여다볼 거예요.",
  parts_integration:
    "다음 단계에서는 이 마음을 더 건강하게 활용하는 길을 함께 그려볼 거예요.",
};

export async function POST(req: Request) {
  const guard = await requireWorkshopAccess(req, {
    rateLimit: RATE_LIMITS.conversation,
  });
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  const stepKey = body?.step_key as StepKey | undefined;
  const transcript = body?.transcript as ConversationTranscript | undefined;
  const userName =
    typeof body?.user_name === "string" ? body.user_name.trim() : "";

  if (
    !stepKey ||
    !transcript ||
    !Array.isArray(transcript.turns) ||
    transcript.turns.length === 0
  ) {
    return NextResponse.json({ recap: emptyRecap() });
  }

  try {
    const recap = await generateRecap(stepKey, transcript, userName);
    return NextResponse.json({ recap });
  } catch (err) {
    console.error("[step-recap] 실패, 폴백:", err);
    return NextResponse.json({ recap: emptyRecap(stepKey) });
  }
}

function emptyRecap(stepKey?: StepKey): StepRecap {
  return {
    // 옛 호환 필드 — 빈 값
    narrative: "",
    motive: { headline: "", body: "" },
    emotion: { headline: "", body: "" },
    closing_line: FALLBACK_CLOSING,
    // 신규 시각화 필드는 미정 (UI가 폴백 안내문)
    next_step_bridge: stepKey ? NEXT_STEP_BRIDGE_FALLBACK[stepKey] : undefined,
  };
}

async function generateRecap(
  stepKey: StepKey,
  transcript: ConversationTranscript,
  userName: string
): Promise<StepRecap> {
  const focus = STEP_FOCUS[stepKey];
  // 이름이 있으면 코멘트 호칭에 "○○님"을 자연스럽게. 없으면 주어 생략 톤.
  const nameRule = userName
    ? `- **호칭 (이름 있음)**: counselor_comment·comment·part_profile.narrative에서 내담자를 "${userName}님"으로 1~2회 자연스럽게 불러주세요 (매 문장 반복 금지). 그 외 필드(thought·inner_voices 등 인용)에는 이름을 넣지 마세요.`
    : `- **호칭 (이름 없음)**: "당신" 또는 주어 생략. 극존칭 금지.`;

  // Step 3(parts_discovery)에서만 "마음 프로필" 임상 카드를 추가 추출.
  const userRef = userName ? `${userName}님` : "당신";
  const partProfileSection =
    stepKey === "parts_discovery"
      ? `

## 카드 0 — part_profile (마음 프로필 · 가장 먼저 보여줄 임상 카드)

내담자가 한 마음에 *이름*을 붙이고 깊이 탐색했어요. 그 마음이 *무엇이고·왜 생겼고·어떤 상황에·어떤 역할로 발현되며·어떤 자동사고를 만드는지*를 정확히 짚어 명명합니다. 대화의 각 지점(name_part=이름, part_dialogue=그 마음의 대사, real_want=진짜 바람, origin=생긴 계기, self_compassion=소중한 사람에게 할 말)을 활용하세요. 필드:
- **name**: 내담자가 #3에서 붙인 마음 이름 *그대로*. 예: "다그치는 나"
- **origin** (1문장, 50자 이내): 그 마음이 언제·왜 생겼는지(계기). origin 답 기반 가설형. 답이 없으면 빈 문자열. 예: "성과로만 인정받던 시절부터"
- **trigger_situation** (1문장, 40자 이내): 어떤 상황에 이 마음이 발현되는지. situation 답을 일반화한 한 줄. 예: "성과가 기대만큼 안 나올 때"
- **role** (1문장, 40자 이내): 이 마음이 *무엇을 하려고* 나타나는지(역할). real_want·active_minds에서 추론. 예: "더 망치지 않게 미리 다그치는 역할"
- **automatic_thought** (1문장, 50자 이내): 이 마음이 만들어내는 자동사고. **part_dialogue(대사) 답을 원문 그대로 인용** 우선. 예: "나는 어떻게 할 수 있을지 막막하고 못 할 것 같다"
- **self_compassion** (1문장, 60자 이내): self_compassion 답을 부드럽게 정리. 답이 없으면 빈 문자열.
- **narrative** (2~3문장, 200자 이내): 위를 잇는 임상 한 문단. 다음 형태를 따르되 자연스럽게: "${userRef}이 '\${name}'을(를) 만났어요. 이 마음은 \${origin}에서 비롯된 것으로 보이고, \${trigger_situation} 같은 상황에 처할 때마다 \${role}을(를) 하려고 나타나며, '\${automatic_thought}'라는 자동사고를 만들어내고 있어요." 단정 금지·가설 톤.`
      : "";

  const systemPrompt = `당신은 IFS 기법에 능숙한 따뜻한 진행자입니다. 직장인 3~15년차 페르소나의 내담자가 "${focus}" 주제를 함께 탐색했어요. 흩어진 답들을 종합·해석해서 **시각적 인포그래픽 3장 + 다음 단계 한 줄**의 데이터를 만들어 부드럽게 되돌려주세요.

전체 흐름: *그때의 표면(생각·몸·소리·감정)* → *그 마음이 진짜 바랐던 것* → *모든 마음의 가장 깊은 곳* → *다음 단계로 자연스럽게*.
${partProfileSection}

## 카드 1 — surface_card (표면 · 그때 든 생각)

사용자가 답에서 묘사한 그 순간의 *내면 표면*. 필드:
- **situation** (1문장, 45자 이내): 사용자가 첫 질문에서 답한 *그 상황*을 짧게 짚어주는 리마인드. "그때"가 어떤 순간이었는지 카드 맨 위에서 다시 떠올리게 한다. 사용자 답에서 시간·장소·계기를 뽑아 자연스러운 한 문장으로. 예: "마감을 앞두고 매출이 안 나오던 그 밤", "팀 회의에서 내 제안이 묻혔던 순간". 답에 상황 정보가 없으면 빈 문자열.
- **thought** (1문장, 50자 이내): 자동으로 떠오른 그때 그 생각. 사용자가 인용한 말 그대로 또는 가장 가까운 paraphrase. 예: "큰일났다. 내가 하는 게 틀렸다"
- **body_signal**: 몸에서 느껴진 신호.
  - headline (15자 이내): "목이 조이는 느낌"
  - description (25자 이내): "가슴까지 번지는 답답함"
- **inner_voices** (3~5개, 각 12자 이내): 내면에서 들렸던 짧은 말·생각. 사용자 답에 직접 나온 표현 우선. 예: ["넌 안돼", "창피하다", "매출 안 나오는데 어떡하지"]. 사용자 답에 안 나왔으면 빈 배열.
- **emotions** (1~3개): 그때 올라온 감정. 각 항목 \`{label: 15자이내, intensity: 0~100}\`. intensity는 *사용자 답의 강조·반복·연쇄 표현 기준의 시각적 비율*이며 정량 진단이 아님. 예: [{"label":"계속되는 실패감","intensity":80},{"label":"무능함을 들킬까 봐 두려움","intensity":70}]
- **counselor_comment** (2~3문장, 120자 이내): 카드 맨 아래에 놓을 *상담사의 따뜻한 코멘트*. "이런 상황에서 이런 마음이 들었고, 그 마음이 자연스러웠다" 톤으로 표면을 비춰준다. 상황(situation)→생각·감정을 자연스럽게 잇고, 평가·진단·교정 없이 그 반응이 이해된다는 메시지만. 예: "마감 앞에서 매출이 안 나올 때, '나는 못 할 것 같다'는 생각이 먼저 올라왔어요. 몸까지 조여올 만큼 절박했던 거예요. 그만큼 잘 해내고 싶었던 마음이었겠죠."

## 카드 2 — truth_card (진심 · 사실, 그 마음이 *바란 것*)

표면 너머의 *진짜 바람·긍정 의도*. 필드:
- **true_wish**:
  - quote (20자 이내): 사용자가 자기 진짜 바람을 표현한 한 구절을 큰따옴표 안에 넣을 인용. 예: "주체적으로 살라"
  - body (60자 이내): 그 바람을 풀어쓴 본문. 예: "내가 할 일을 세우고, 덤덤하게 해나가고, 결과에 책임지는 나"
- **reason**:
  - keywords (2~3개, 각 12자 이내): 그 마음이 지키려 했던 것. 예: ["우리 가족의 평화", "나의 자존감"]
  - body (60자 이내): "지키려고 ~며 애써왔다" 류 한 문장. 예: "내가 다 해야 한다며 애써왔다"
- **thanks_to** (한 줄, 50자 이내): "그 마음으로 ~ 덕분에 ~할 수 있었다" 류. 예: "그 마음으로 버텨온 덕분에, 여기까지 올 수 있었다"
- **counselor_comment** (2~3문장, 120자 이내): 진심 도식 *아래*에 놓을 *상담사 코멘트*. 표면의 불안 너머에 사실은 이런 바람이 있었다는 걸 인정해주는 톤. 그 마음의 긍정 의도를 존중하고, 그동안 애써온 것을 알아준다. 예: "겉으론 불안했지만, 그 아래엔 '잘 해내고 싶다'는 바람이 있었어요. 그 마음이 있었기에 여기까지 버텨온 거예요. 충분히 애써왔어요."

## 카드 3 — core_wish (CORE WISH · 가장 깊은 곳)

모든 마음의 가장 깊은 곳에 있는 *근원적 바람*을 1~2문장으로 명명.
- **text**: 1~2문장. 각 문장 30자 이내. 예: "인정받고 싶다. 사랑받고 싶다."
- 가설형으로. 단정 금지. 부정 욕구("실패하지 않고 싶다") 대신 *긍정 욕구*("인정받고 싶다") 우선.
- **comment** (2~3문장, 130자 이내): 배너 아래에 풀어쓸 *친절한 설명*. "결국 마음 깊은 곳엔 이런 마음이 있어요. 이 마음이 잘못된 게 아니에요. 이 마음을 다음 단계에서 함께 더 들여다봐요" 톤. core_wish.text를 부드럽게 풀어 설명하고, 다음 단계로 자연스럽게 잇는다. 예: "결국 마음 가장 깊은 곳엔 '인정받고 함께 반짝이고 싶다'는 바람이 있었어요. 이건 누구나 가진 자연스러운 마음이에요. 이 마음이 어떤 패턴을 만들어왔는지, 다음 단계에서 천천히 함께 살펴볼게요."

## next_step_bridge (한 줄, 45자 이내)

이번 단계의 발견을 다음 단계로 자연스럽게 잇는 한 문장. 정확한 step 정보:
${stepBridgeHint(stepKey)}

## 절대 규칙 (어기면 무효)

- **원문 인용 의무**: 모든 텍스트 필드는 사용자 transcript에서 인용하거나 가까운 paraphrase. 없는 내용 지어내기 금지.
- **inner_voices·keywords**: 사용자 답에 직접 등장한 표현만. 답에 없으면 빈 배열.
- **단정·진단 금지**: "당신은 ___입니다"·"당신의 문제는 ___" 금지. 가설·발견 톤만.
${nameRule}
- 평가·가르침 금지.
- **counselor_comment·comment**: 위로·인정·이해의 톤만. 충고·교정·"~해야 한다" 금지. 사용자 답에 근거한 내용만 풀어서 비춰주기.
- "부분/관리자/소방관/추방자/참자기" 같은 IFS 전문 용어 금지.
- intensity는 시각적 비율일 뿐 정량 진단이 아님.
- 카드 1은 *부정 흐름* 그대로, 카드 2는 *전환·긍정 바람*, 카드 3은 *근원 욕구*.

## 응답 형식 (JSON 단일 객체로만, 다른 텍스트 금지)
{"recap": {${stepKey === "parts_discovery" ? `"part_profile": {...}, ` : ""}"surface_card": {...}, "truth_card": {...}, "core_wish": {...}, "next_step_bridge": "..."}}

${IFS_TERM_BAN_RULES}`;

  const conv = transcript.turns
    .filter((t) => t.answer.trim().length > 0)
    .map((t) => `Q: ${t.question}\nA: ${t.answer}`)
    .join("\n\n");

  const fields =
    stepKey === "parts_discovery"
      ? "part_profile · surface_card · truth_card · core_wish · next_step_bridge"
      : "surface_card · truth_card · core_wish · next_step_bridge";
  const userMessage = `## 대화 기록\n${conv}\n\n위 대화를 바탕으로 ${fields}를 JSON으로 응답하세요. 모든 텍스트는 사용자 답을 인용하거나 가깝게 paraphrase해야 합니다.`;

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    {
      model: "gemini-2.5-flash",
      temperature: 0.6,
      // 시각화 필드 + 상담사 코멘트 + (Step 3) 마음 프로필 카드가 더해져 토큰 상향.
      // thinking_budget:0으로 reasoning이 출력 토큰을 잠식하지 않도록 (한국어 토큰 비효율 대응).
      max_tokens: 4096,
      thinking_budget: 0,
      response_format: { type: "json_object" },
    }
  );

  const parsed = safeJsonParse<{ recap?: unknown } | unknown>(response);
  const rawWrapped =
    parsed && typeof parsed === "object" && "recap" in parsed
      ? (parsed as { recap?: unknown }).recap
      : parsed;
  const raw = (rawWrapped ?? {}) as {
    surface_card?: unknown;
    truth_card?: unknown;
    core_wish?: unknown;
    part_profile?: unknown;
    next_step_bridge?: unknown;
  };

  return {
    // 옛 호환 필드 — 빈 값으로 채움
    narrative: "",
    motive: { headline: "", body: "" },
    emotion: { headline: "", body: "" },
    closing_line: FALLBACK_CLOSING,
    // 신규 시각화 필드
    surface_card: parseSurfaceCard(raw.surface_card),
    truth_card: parseTruthCard(raw.truth_card),
    core_wish: parseCoreWish(raw.core_wish),
    // 마음 프로필 — Step 3에서만 LLM이 생성. 다른 단계는 undefined.
    part_profile:
      stepKey === "parts_discovery"
        ? parsePartProfile(raw.part_profile)
        : undefined,
    next_step_bridge:
      typeof raw.next_step_bridge === "string" && raw.next_step_bridge.trim()
        ? raw.next_step_bridge.trim()
        : NEXT_STEP_BRIDGE_FALLBACK[stepKey],
  };
}

function parsePartProfile(v: unknown): PartProfileData | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as Record<string, unknown>;
  const str = (x: unknown) => (typeof x === "string" ? x.trim() : "");
  const name = str(o.name);
  const narrative = str(o.narrative);
  // 이름·내러티브 둘 다 없으면 의미 없는 프로필 → 숨김.
  if (!name && !narrative) return undefined;
  return {
    name,
    origin: str(o.origin),
    trigger_situation: str(o.trigger_situation),
    role: str(o.role),
    automatic_thought: str(o.automatic_thought),
    self_compassion: str(o.self_compassion),
    narrative,
  };
}

function stepBridgeHint(stepKey: StepKey): string {
  switch (stepKey) {
    case "parts_discovery":
      return "다음 단계는 *Step 4 — 마음의 패턴 발견하기* (이 마음들을 빚어낸 더 깊은 패턴·도식을 5개 영역에서 함께 살펴봄)";
    case "schema_inquiry":
      return "다음 단계는 *Step 5 — 마음과 패턴 잇기* (발견된 패턴이 어떻게 마음들을 형성했는지 통합 리포트)";
    case "parts_integration":
      return "다음 단계는 *Step 9 — 마음들의 이야기* (각 마음에 이름을 붙이고 본래 역할을 정리)";
    default:
      return "다음 단계로 자연스럽게 잇는 한 줄.";
  }
}

function parseSurfaceCard(v: unknown): SurfaceCardData | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as {
    situation?: unknown;
    thought?: unknown;
    body_signal?: unknown;
    inner_voices?: unknown;
    emotions?: unknown;
    counselor_comment?: unknown;
  };
  const situation = typeof o.situation === "string" ? o.situation.trim() : "";
  const thought = typeof o.thought === "string" ? o.thought.trim() : "";
  const body_signal = parseBodySignal(o.body_signal);
  const inner_voices = Array.isArray(o.inner_voices)
    ? o.inner_voices
        .filter((x): x is string => typeof x === "string")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : [];
  const emotions = Array.isArray(o.emotions)
    ? o.emotions
        .map((e) => {
          if (!e || typeof e !== "object") return null;
          const ee = e as { label?: unknown; intensity?: unknown };
          const label = typeof ee.label === "string" ? ee.label.trim() : "";
          const intensity =
            typeof ee.intensity === "number"
              ? Math.max(0, Math.min(100, ee.intensity))
              : 50;
          return label ? { label, intensity } : null;
        })
        .filter((x): x is { label: string; intensity: number } => x !== null)
    : [];
  const counselor_comment =
    typeof o.counselor_comment === "string" ? o.counselor_comment.trim() : "";
  if (
    !thought &&
    !body_signal.headline &&
    inner_voices.length === 0 &&
    emotions.length === 0
  ) {
    return undefined;
  }
  return {
    situation,
    thought,
    body_signal,
    inner_voices,
    emotions,
    counselor_comment,
  };
}

function parseBodySignal(v: unknown): { headline: string; description: string } {
  if (!v || typeof v !== "object") return { headline: "", description: "" };
  const o = v as { headline?: unknown; description?: unknown };
  return {
    headline: typeof o.headline === "string" ? o.headline.trim() : "",
    description:
      typeof o.description === "string" ? o.description.trim() : "",
  };
}

function parseTruthCard(v: unknown): TruthCardData | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as {
    true_wish?: unknown;
    reason?: unknown;
    thanks_to?: unknown;
    counselor_comment?: unknown;
  };
  const true_wish = parseQuoteBody(o.true_wish);
  const reason = parseReason(o.reason);
  const thanks_to =
    typeof o.thanks_to === "string" ? o.thanks_to.trim() : "";
  const counselor_comment =
    typeof o.counselor_comment === "string" ? o.counselor_comment.trim() : "";
  if (
    !true_wish.quote &&
    !true_wish.body &&
    reason.keywords.length === 0 &&
    !reason.body &&
    !thanks_to
  ) {
    return undefined;
  }
  return { true_wish, reason, thanks_to, counselor_comment };
}

function parseQuoteBody(v: unknown): { quote: string; body: string } {
  if (!v || typeof v !== "object") return { quote: "", body: "" };
  const o = v as { quote?: unknown; body?: unknown };
  return {
    quote: typeof o.quote === "string" ? o.quote.trim() : "",
    body: typeof o.body === "string" ? o.body.trim() : "",
  };
}

function parseReason(v: unknown): { keywords: string[]; body: string } {
  if (!v || typeof v !== "object") return { keywords: [], body: "" };
  const o = v as { keywords?: unknown; body?: unknown };
  const keywords = Array.isArray(o.keywords)
    ? o.keywords
        .filter((x): x is string => typeof x === "string")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : [];
  return {
    keywords,
    body: typeof o.body === "string" ? o.body.trim() : "",
  };
}

function parseCoreWish(v: unknown): CoreWishData | undefined {
  if (!v || typeof v !== "object") return undefined;
  const o = v as { text?: unknown; vol_label?: unknown; comment?: unknown };
  const text = typeof o.text === "string" ? o.text.trim() : "";
  if (!text) return undefined;
  return {
    text,
    vol_label:
      typeof o.vol_label === "string" && o.vol_label.trim()
        ? o.vol_label.trim()
        : undefined,
    comment:
      typeof o.comment === "string" && o.comment.trim()
        ? o.comment.trim()
        : undefined,
  };
}
