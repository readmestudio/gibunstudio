import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";

/**
 * POST /api/self-workshop/new-belief-options
 *
 * Stage 08(새 핵심 신념 찾기) 진입 시 LLM 보조 데이터 생성.
 *
 * mode 파라미터에 따라 응답이 분기된다 (성능을 위한 호출 분할):
 *   - "scenario" (default for fast path): scenario + old_outcome_hint + new_outcome_hint 만
 *   - "options"                         : 균형 신념 후보 3개만
 *   - "all"                             : 위 6개 항목 모두 한 번에 (기존 동작 보존, 롤백/하위호환)
 *
 * Body:
 *   { mode?: "scenario"|"options"|"all", belief_text, classification?, source? }
 * Resp(scenario):
 *   { scenario, old_outcome_hint, new_outcome_hint }
 * Resp(options):
 *   { options: string[] }   // 길이 3
 * Resp(all):
 *   { scenario, old_outcome_hint, new_outcome_hint, options }
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
  const mode: "scenario" | "options" | "all" =
    body?.mode === "scenario" || body?.mode === "options"
      ? body.mode
      : "all";

  const beliefText =
    typeof body?.belief_text === "string" ? body.belief_text.trim() : "";
  const classification =
    typeof body?.classification === "string"
      ? body.classification.trim()
      : "";
  const source =
    body?.source === "self" || body?.source === "others" || body?.source === "world"
      ? (body.source as "self" | "others" | "world")
      : null;

  if (!beliefText) {
    return NextResponse.json(
      { error: "belief_text가 필요합니다" },
      { status: 400 }
    );
  }

  try {
    if (mode === "scenario") {
      const result = await runScenario({ beliefText, classification, source });
      return NextResponse.json(result);
    }
    if (mode === "options") {
      const result = await runOptions({ beliefText, classification, source });
      return NextResponse.json(result);
    }
    const result = await runAll({ beliefText, classification, source });
    return NextResponse.json(result);
  } catch (err) {
    console.error(`[new-belief-options:${mode}] 생성 실패:`, err);
    return NextResponse.json(
      { error: "AI 처리에 실패했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}

interface GenerateInput {
  beliefText: string;
  classification: string;
  source: "self" | "others" | "world" | null;
}

interface ScenarioOutput {
  scenario: string;
  old_outcome_hint: string;
  new_outcome_hint: string;
}

interface OptionsOutput {
  options: string[];
}

type AllOutput = ScenarioOutput & OptionsOutput;

/* ─────────────────────────────────────────────
 * runScenario — 시나리오 1문장 + 결과 힌트 2개
 *   짧은 프롬프트, max_tokens 768. critical path.
 * ───────────────────────────────────────────── */
async function runScenario({
  beliefText,
  classification,
  source,
}: GenerateInput): Promise<ScenarioOutput> {
  const sourceLabel = sourceLabelOf(source);

  const systemPrompt = `당신은 인지행동치료(CBT) 워크북을 함께 진행하는 부드럽고 따뜻한 진행자입니다. 직장인 3~15년차 페르소나의 사용자가 자기 신념을 살펴보고 있어요.

## 작업
사용자의 옛 핵심 신념(${sourceLabel})을 받아, 다음 3가지를 생성합니다.

### 1) scenario — 이 신념이 가장 강하게 작동하는 가상 *상황* 한 줄
- 사용자의 실제 사례가 아니라, 이 핵심 신념이 *가장 강하게 발동될 법한 일상 상황*을 한 문장으로 *간결히 요약*.
- 직장인 3~15년차 페르소나에 맞는 구체적 디테일(역할·장소·시점·구체 사건)을 한 문장 안에 압축.
- **상황 자체만**: 인물의 *감정·반응·결과·자동사고는 절대 포함하지 말 것.* "불안에 휩싸인다", "지쳐버린다", "이번에도 역시" 같은 내적 반응 묘사 금지. 그건 사용자가 다음 단계에서 직접 적어볼 영역.
- 좋은 예: "오랫동안 공들여 준비한 신규 프로젝트의 팀장으로 선정되었지만, 첫 주차 회의록 작성에서 작은 실수를 발견한 상황."
- 나쁜 예(반응 묘사 포함): "팀장으로 선정되었지만 회의록 실수를 발견하고 불안에 휩싸이며 다음 회의 준비를 시작하기도 전에 지쳐버립니다."
- **반드시 한국어 40자 이상 ~ 110자 이하. 한 문장.** 마지막은 마침표(.)로 정상 종료. 줄임표(..., …) 금지.

### 2) old_outcome_hint — 옛 신념대로 행동했을 때 따라올 "행동 결과" 예시
- 사용자가 "어떤 결과가 따라올 것 같나요?"라는 질문에 답할 때 참고할 placeholder.
- 결과란 자동사고나 감정 진술이 아니라 **관찰 가능한 outcome** — 행동, 일정 변경, 관계 영향, 신체·생활 패턴의 변화.
- 자동사고/감정 토로만으로 끝내면 안 됨. 그 생각으로 인해 **무엇을 하게 될지·하지 않게 될지**까지 반드시 포함.
- 형식: "예) [그 생각·감정 → 짧게] [구체적 행동/일정/관계 변화 → 길게]"
- **반드시 한국어 80자 이상 ~ 160자 이하. 160자를 절대 초과하지 말 것.**
- **마지막은 반드시 완전한 문장으로 마침표(.)로 종결.** 줄임표(..., …) 절대 금지.

### 3) new_outcome_hint — 새 신념대로 행동했을 때 따라올 "행동 결과" 예시
- 같은 시나리오에서 균형잡힌 새 신념을 가졌을 때 **실제로 어떤 다른 행동/선택**을 하게 될지의 1인칭 placeholder.
- "다 잘 풀릴 거야" 같은 비현실적 긍정 금지. 감정/생각만 바뀌었다는 진술 금지.
- 작은 한 걸음·재정의 가능한 선택 등 **관찰 가능한 행동** 포함.
- 형식: "예) [새 시선·자기말 → 짧게] [그래서 하게 될 작은 행동/선택 → 길게]"
- **반드시 한국어 80자 이상 ~ 160자 이하. 160자를 절대 초과하지 말 것.**
- **마지막은 반드시 완전한 문장으로 마침표(.)로 종결.** 줄임표(..., …) 절대 금지.

## 공통 규칙
- 큰따옴표·별표(*) 등 마크다운 없이 본문만.
- "반박/부수기/잘못된 신념" 같은 공격적·판단적 단어 금지.
- 따뜻하지만 가르치지 않는 톤.

## 응답 형식
반드시 아래 JSON 단일 객체로만 응답. 키 이름·순서·구조 그대로. 다른 텍스트 절대 금지.
{
  "scenario": "...",
  "old_outcome_hint": "예) ...",
  "new_outcome_hint": "예) ..."
}`;

  const classificationLine = classification
    ? `## 분류\n${classification}\n\n`
    : "";
  const userMessage = `${classificationLine}## 옛 핵심 신념\n"${beliefText}"\n\n위 신념에 대해 시나리오·두 결과 힌트를 위 JSON 형식으로 응답하세요.`;

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    {
      model: "gemini-2.5-flash",
      temperature: 0.75,
      // 2048 — 짧은 응답인데도 thinking 토큰을 끄지 않으면 reasoning이 한도를 잠식.
      // thinking_budget: 0으로 reasoning을 끄고 출력 토큰만 사용하도록 강제.
      max_tokens: 2048,
      thinking_budget: 0,
      response_format: { type: "json_object" },
    }
  );

  const parsed = safeJsonParse<unknown>(response);
  // scenario는 상황 한 줄 요약(40~110자), 힌트는 행동 결과 예시(80~170자).
  const scenario = clampSentence(readString(parsed, "scenario"), 120);
  const oldHint = clampSentence(readString(parsed, "old_outcome_hint"), 170);
  const newHint = clampSentence(readString(parsed, "new_outcome_hint"), 170);

  if (!scenario) {
    console.error("[new-belief-options:scenario] scenario 빔. raw:", response);
    throw new Error("scenario 응답이 형식을 만족하지 못했습니다");
  }

  return {
    scenario,
    old_outcome_hint: oldHint || "예) ",
    new_outcome_hint: newHint || "예) ",
  };
}

/* ─────────────────────────────────────────────
 * runOptions — 균형 신념 후보 3개만
 *   짧은 프롬프트, max_tokens 1024. 시나리오와 독립.
 *   사용자 메시지에 시나리오를 의도적으로 빼서 호출 간 의존성 제거.
 * ───────────────────────────────────────────── */
async function runOptions({
  beliefText,
  classification,
  source,
}: GenerateInput): Promise<OptionsOutput> {
  const sourceLabel = sourceLabelOf(source);

  const systemPrompt = `당신은 인지행동치료(CBT) 워크북을 함께 진행하는 부드럽고 따뜻한 진행자입니다. 직장인 3~15년차 페르소나의 사용자가 옛 핵심 신념 옆에 균형잡힌 새 신념을 함께 두는 연습을 돕고 있어요.

## 작업
사용자의 옛 핵심 신념(${sourceLabel})을 받아, **균형잡힌 새 신념 후보 3개**를 만들어 주세요. 사용자는 이 중 여러 개를 함께 골라 자기 신념으로 삼을 수 있습니다.

## 후보의 각도
- 1번째: 옛 신념의 핵심 욕구·진실은 인정하면서, **나의 전부는 아니라는 점**을 함께 담는 양가적 표현.
- 2번째: 결과·성취·평가가 아닌 **과정·태도·관계** 같은 다른 축에서 자기 가치를 다시 보는 표현.
- 3번째: 옛 신념을 **상황·맥락 의존적**으로 좁혀, 절대 명제처럼 보이지 않게 다시 쓰는 표현.

## 어미 규칙 (매우 중요)
- 종결어미는 반드시 **신념 명제체**: "~이다", "~다", "~할 것이다", "~수 있다", "~지 않다".
- **금지** 어미(자기 발화체): "~이야", "~할 거야", "~사람이야", "~잖아", "~겠지".
- 이유: 신념은 일시적 자기 위안이 아니라 핵심 신념으로 장착되는 명제이므로, 단정적 어미로 끝내야 사용자가 *받아들일 신념*으로 인식한다.
- 좋은 예: "직업적 성과는 중요하지만, 나라는 사람의 가치를 결정하는 절대적 기준은 아니다."
- 나쁜 예: "직업적 성과는 중요하지만, 나라는 사람의 가치를 결정하는 절대적 기준은 아니야." ← 자기 발화체

## 톤·길이
- 1인칭 자기 발화. 한 문장 또는 두 문장.
- **각 후보 반드시 한국어 50자 이상 ~ 120자 이하. 120자를 절대 초과하지 말 것.** 마지막 문장은 반드시 마침표(.)로 정상 종료.
- 큰따옴표·별표(*) 등 마크다운 없이 본문만.
- "반박/부수기/잘못된 신념" 같은 공격적·판단적 단어 금지. 자기계발서 클리셰·임상 용어 금지.
- 세 후보가 서로 의미가 겹치지 않도록 각도가 명확히 달라야 함.

## 응답 형식
반드시 아래 JSON 단일 객체로만 응답. 키 이름·순서·구조 그대로. 다른 텍스트 절대 금지.
{
  "options": ["...", "...", "..."]
}`;

  const classificationLine = classification
    ? `## 분류\n${classification}\n\n`
    : "";
  const userMessage = `${classificationLine}## 옛 핵심 신념\n"${beliefText}"\n\n위 신념에 대해 "균형잡힌 새 신념 후보 3개"를 위 JSON 형식으로 응답하세요.`;

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    {
      model: "gemini-2.5-flash",
      temperature: 0.75,
      // 2048 — 신념체 후보 3개(각 50~120자). thinking 끄고 충분한 출력 마진.
      max_tokens: 2048,
      thinking_budget: 0,
      response_format: { type: "json_object" },
    }
  );

  const parsed = safeJsonParse<unknown>(response);
  const options = collectOptions(parsed);
  if (options.length < 3) {
    console.error(
      "[new-belief-options:options] 후보 부족. raw:",
      response,
      "parsed:",
      parsed
    );
    throw new Error("후보가 3개 미만으로 생성되었습니다");
  }
  return {
    options: options.slice(0, 3).map((s) => clampSentence(s, 130)),
  };
}

/* ─────────────────────────────────────────────
 * runAll — 기존 동작 (롤백/하위호환)
 *   시나리오·힌트·옵션 6개를 한 호출에 묶음.
 *   max_tokens 4096. 느린 경로.
 * ───────────────────────────────────────────── */
async function runAll({
  beliefText,
  classification,
  source,
}: GenerateInput): Promise<AllOutput> {
  const sourceLabel = sourceLabelOf(source);

  const systemPrompt = `당신은 인지행동치료(CBT) 워크북을 함께 진행하는 부드럽고 따뜻한 진행자입니다. 직장인 3~15년차 페르소나의 사용자가 "옛 핵심 신념을 부수지 않고, 그 옆에 균형잡힌 새 신념을 함께 두는" 연습을 돕고 있어요.

## 작업
사용자의 옛 핵심 신념(${sourceLabel})을 받아, 아래 4가지를 함께 만들어 주세요.

### 1) scenario — 이 신념이 가장 강하게 작동하는 가상 시나리오
- 사용자의 실제 사례가 아니라, 이 핵심 신념을 갖고 있을 때 **가장 괴로워질 만한 일상 시나리오**를 1~2문장으로 생생하게 묘사.
- 직장인 3~15년차 페르소나에 맞는 구체적인 시간·장면·인물 디테일.
- 평가·진단·요약문이 아니라 "그 순간의 장면". 한국어 60~140자.

### 2) old_outcome_hint — 옛 신념대로 행동했을 때 따라올 "행동 결과" 예시
- **관찰 가능한 outcome** — 행동, 일정 변경, 관계 영향. 자동사고/감정 진술만 X.
- 형식: "예) [그 생각·감정 → 짧게] [구체적 행동/일정 변화 → 길게]"
- 1~2문장. 한국어 70~140자.

### 3) new_outcome_hint — 새 신념대로 행동했을 때 따라올 "행동 결과" 예시
- 같은 시나리오에서 균형잡힌 새 신념을 가졌을 때 **실제로 어떤 다른 행동/선택**을 하게 될지의 1인칭 placeholder.
- 비현실적 긍정 금지. 감정/생각만 바뀌었다는 진술 금지.
- 형식: "예) [새 시선·자기말 → 짧게] [그래서 하게 될 작은 행동/선택 → 길게]"
- 1~2문장. 한국어 70~140자.

### 4) options — 균형잡힌 새 신념 후보 3개
- 사용자가 자기 핵심 신념으로 **장착할 수 있는 명제 형태**.
- 1번째: 옛 신념의 핵심 욕구·진실은 인정하면서, **나의 전부는 아니라는 점**을 함께 담는 양가적 표현.
- 2번째: 결과·성취·평가가 아닌 **과정·태도·관계** 같은 다른 축에서 자기 가치를 다시 보는 표현.
- 3번째: 옛 신념을 **상황·맥락 의존적**으로 좁혀, 절대 명제처럼 보이지 않게 다시 쓰는 표현.

#### 어미 규칙 (매우 중요)
- 종결어미는 반드시 **신념 명제체**: "~이다", "~다", "~할 것이다", "~수 있다", "~지 않다".
- **금지** 어미: "~이야", "~할 거야", "~사람이야", "~잖아", "~겠지".

## 공통 규칙
- 큰따옴표·별표(*) 등 마크다운 없이 본문만.
- "반박/부수기/잘못된 신념" 같은 공격적·판단적 단어 금지.
- 따뜻하지만 가르치지 않는 톤. 한 문장 또는 두 문장. 한국어 50~140자.
- 세 옵션 후보의 각도가 명확히 달라야 함.

## 응답 형식
반드시 아래 JSON 단일 객체로만 응답. 키 이름·순서·구조 그대로. 다른 텍스트 절대 금지.
{
  "scenario": "...",
  "old_outcome_hint": "예) ...",
  "new_outcome_hint": "예) ...",
  "options": ["...", "...", "..."]
}`;

  const classificationLine = classification
    ? `## 분류\n${classification}\n\n`
    : "";
  const userMessage = `${classificationLine}## 옛 핵심 신념\n"${beliefText}"\n\n위 신념에 대해 시나리오·두 결과 힌트·균형잡힌 새 신념 후보 3개를 위 JSON 형식으로 응답하세요.`;

  const response = await chatCompletion(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
    {
      model: "gemini-2.5-flash",
      temperature: 0.75,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    }
  );

  const parsed = safeJsonParse<unknown>(response);
  const scenario = readString(parsed, "scenario");
  const oldHint = readString(parsed, "old_outcome_hint");
  const newHint = readString(parsed, "new_outcome_hint");
  const options = collectOptions(parsed);

  if (!scenario || options.length < 3) {
    console.error(
      "[new-belief-options:all] 응답 부족. raw:",
      response,
      "parsed:",
      parsed
    );
    throw new Error("응답이 형식을 만족하지 못했습니다");
  }

  return {
    scenario,
    old_outcome_hint: oldHint || "예) ",
    new_outcome_hint: newHint || "예) ",
    options: options.slice(0, 3),
  };
}

/* ─────────────────────────── 헬퍼 ─────────────────────────── */

function sourceLabelOf(source: "self" | "others" | "world" | null): string {
  if (source === "self") return "자기 자신에 대한 신념";
  if (source === "others") return "타인에 대한 신념";
  if (source === "world") return "세계에 대한 신념";
  return "핵심 신념";
}

function readString(parsed: unknown, key: string): string {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return "";
  const v = (parsed as Record<string, unknown>)[key];
  return typeof v === "string" ? v.trim() : "";
}

function collectOptions(parsed: unknown): string[] {
  if (!parsed) return [];
  if (Array.isArray(parsed)) {
    return parsed.filter(
      (s): s is string => typeof s === "string" && s.trim().length > 0
    );
  }
  if (typeof parsed !== "object") return [];
  const obj = parsed as Record<string, unknown>;
  if (Array.isArray(obj.options)) {
    return obj.options.filter(
      (s): s is string => typeof s === "string" && s.trim().length > 0
    );
  }
  if (obj.options && typeof obj.options === "object") {
    return Object.values(obj.options as Record<string, unknown>).filter(
      (s): s is string => typeof s === "string" && s.trim().length > 0
    );
  }
  return Object.values(obj).filter(
    (s): s is string => typeof s === "string" && s.trim().length > 0
  );
}

/**
 * 응답을 *완성된 문장*으로 정리한다.
 * - LLM이 글자 한도에 맞추려고 줄임표(..., …)로 트레일 오프하는 경우가 있어
 *   *트레일링 줄임표를 자동으로 제거*하고 마침표로 대체한다.
 * - 글자 수가 maxLen을 넘으면 *마지막 종결 부호*까지로 자르고, 종결 부호가
 *   없으면 어절 경계에서 자르고 마침표를 보충해 어색한 잘림 방지.
 */
function clampSentence(raw: string, maxLen: number): string {
  if (!raw) return "";
  let text = raw.trim();

  // 1) 트레일링 줄임표 정리 — LLM이 의미를 흐리려고 끝에 붙인 경우 흔함.
  //    "..." → "."  /  "…" → "."  /  ".." → "."
  text = text.replace(/[…]+$/g, ".");
  text = text.replace(/\.{2,}$/g, ".");
  // 인용 부호 안에 들어간 줄임표(예: "이번에도 역시...")도 한 번 정리
  text = text.replace(/[…]+(?=['"'')\s]*$)/, ".");
  text = text.replace(/\.{2,}(?=['"'')\s]*$)/, ".");

  if (text.length <= maxLen) return text;

  const slice = text.slice(0, maxLen);
  // 2) 종결 부호 마지막 위치 (줄임표는 위에서 처리됐으므로 여기선 단일 부호)
  const sentenceEndRegex = /[.!?。!?](?=[^.!?。!?]*$)/;
  const m = slice.match(sentenceEndRegex);
  if (m && typeof m.index === "number") {
    return slice.slice(0, m.index + 1).trim();
  }
  // 3) 종결 부호가 없으면 마지막 공백/어절 경계로 자르고 마침표 보충
  const lastSpace = slice.lastIndexOf(" ");
  if (lastSpace > maxLen * 0.6) {
    return slice.slice(0, lastSpace).trim() + ".";
  }
  // 4) 그것도 없으면 단순 슬라이스 + 마침표
  return slice.trim() + ".";
}
