import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import {
  type BeliefNarrativeReport,
  computeNarrativeSourceHash,
  formatSctQuotesForPrompt,
  isBeliefNarrativeReport,
  pickTopSctQuotes,
} from "@/lib/self-workshop/belief-narrative-report";
import {
  type BeliefEvidenceEntry,
  type CopingPlanV2,
  CATEGORY_LABEL,
  isEntryComplete,
} from "@/lib/self-workshop/coping-plan";

/**
 * POST /api/self-workshop/belief-narrative-report
 *
 * Step 8 정리 보기(AllDone)에서 보여줄 "상담사 5단계 narrative 리포트" 생성/조회.
 *
 * 캐시 정책 (하이브리드 무효화):
 *   1) coping_plan.narrative_report 가 형식 통과면 즉시 반환
 *   2) entries 기반 source_hash 비교는 stale 판정용 → isStale 플래그로만 알림
 *   3) 자동 재생성은 안 함. 사용자가 force:true 보낼 때만 LLM 재호출
 *
 * Body: { workshopId: string; force?: boolean }
 * Resp 200: { report: BeliefNarrativeReport; isStale: boolean }
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
  const workshopId = typeof body?.workshopId === "string" ? body.workshopId : "";
  const force = body?.force === true;

  if (!workshopId) {
    return NextResponse.json(
      { error: "workshopId가 필요합니다" },
      { status: 400 }
    );
  }

  const { data: progress } = await supabase
    .from("workshop_progress")
    .select("*")
    .eq("id", workshopId)
    .single();

  if (!progress || progress.user_id !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  const copingPlan = (progress.coping_plan ?? null) as
    | (CopingPlanV2 & { narrative_report?: BeliefNarrativeReport })
    | null;

  const entries = Array.isArray(copingPlan?.entries)
    ? (copingPlan!.entries as BeliefEvidenceEntry[])
    : [];
  const completed = entries.filter(isEntryComplete);

  if (completed.length === 0) {
    return NextResponse.json(
      { error: "정리할 신념이 아직 없어요. 먼저 한 신념 이상을 끝까지 채워 주세요." },
      { status: 400 }
    );
  }

  const currentHash = computeNarrativeSourceHash(completed);

  /* ─── 캐시 hit: 형식 통과 + force 아님 ─── */
  const saved = copingPlan?.narrative_report;
  if (!force && isBeliefNarrativeReport(saved)) {
    return NextResponse.json({
      report: saved,
      isStale: saved.source_hash !== currentHash,
    });
  }

  /* ─── LLM 호출 ─── */
  const mechanism = (progress.mechanism_analysis ?? {}) as Record<string, unknown>;
  const excavation = (progress.core_belief_excavation ?? {}) as Record<string, unknown>;
  const beliefAnalysis = (excavation.belief_analysis ?? {}) as Record<string, unknown>;
  const synthesis = (excavation.synthesis ?? {}) as Record<string, unknown>;
  const sctResponses = (excavation.sct_responses ?? {}) as Parameters<typeof pickTopSctQuotes>[0];

  if (!mechanism || !mechanism.recent_situation) {
    return NextResponse.json(
      { error: "이전 단계 자료가 부족해요. Step 3부터 먼저 채워 주세요." },
      { status: 400 }
    );
  }

  const userName =
    (user.user_metadata?.name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    "당신";

  const sctBlock = formatSctQuotesForPrompt(pickTopSctQuotes(sctResponses, 7));
  const entriesBlock = completed.map((e) => formatEntryForPrompt(e)).join("\n");
  const beliefAxisBlock = [
    isStr(beliefAnalysis.belief_about_self)
      ? `- 자기에 대해: "${beliefAnalysis.belief_about_self}"`
      : null,
    isStr(beliefAnalysis.belief_about_others)
      ? `- 타인에 대해: "${beliefAnalysis.belief_about_others}"`
      : null,
    isStr(beliefAnalysis.belief_about_world)
      ? `- 세계에 대해: "${beliefAnalysis.belief_about_world}"`
      : null,
    isStr(synthesis.belief_line)
      ? `- 통합 한 줄: "${synthesis.belief_line}"`
      : null,
    isStr(synthesis.how_it_works)
      ? `- 작동 방식: "${synthesis.how_it_works}"`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt = buildSystemPrompt(userName);
  const userMessage = buildUserMessage({
    userName,
    mechanism,
    beliefAxisBlock,
    sctBlock,
    entriesBlock,
  });

  try {
    const response = await chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      {
        model: "gemini-2.5-pro",
        temperature: 0.7,
        max_tokens: 12288,
        response_format: { type: "json_object" },
      }
    );

    const parsed = safeJsonParse<BeliefNarrativeReport>(response);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      (parsed as BeliefNarrativeReport).generated_at = new Date().toISOString();
      (parsed as BeliefNarrativeReport).source_hash = currentHash;
    }

    if (!isBeliefNarrativeReport(parsed)) {
      console.error(
        "[belief-narrative-report] 스키마 검증 실패",
        parsed
      );
      return NextResponse.json(
        { error: "리포트 형식이 올바르지 않아요. 잠시 후 다시 시도해 주세요." },
        { status: 500 }
      );
    }

    // coping_plan에 nested 저장 (DB 마이그레이션 0건)
    const nextCopingPlan = {
      ...(copingPlan ?? {}),
      narrative_report: parsed,
    };

    await supabase
      .from("workshop_progress")
      .update({ coping_plan: nextCopingPlan })
      .eq("id", workshopId);

    return NextResponse.json({ report: parsed, isStale: false });
  } catch (err) {
    console.error("[belief-narrative-report] 생성 실패:", err);
    return NextResponse.json(
      { error: "리포트 생성에 실패했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}

/* ─────────────────────────── 헬퍼 ─────────────────────────── */

function isStr(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function formatEntryForPrompt(e: BeliefEvidenceEntry): string {
  const answerLines = e.questions
    .map((q) => {
      const a = (e.answers?.[q.id] || "").trim();
      if (!a) return null;
      const cat = CATEGORY_LABEL[q.category] ?? q.category;
      return `    · [${cat}] "${a}"`;
    })
    .filter((s): s is string => s !== null);
  const freeLines = (e.free_evidence || [])
    .map((s) => (s || "").trim())
    .filter(Boolean)
    .map((s) => `    · [자유 근거] "${s}"`);
  const allEvidenceLines = [...answerLines, ...freeLines];
  const evidenceBlock =
    allEvidenceLines.length > 0 ? allEvidenceLines.join("\n") : "    (아직 적은 근거 없음)";

  return `### [${e.classification}] source="${e.source}"
- 옛 신념(원문 그대로): "${e.old_belief_text}"
- 새 신념(원문 그대로): "${e.new_belief_text}"
- 새 신념을 떠받치는 사용자 자기보고:
${evidenceBlock}
- 새 신념의 단단함: ${e.reinforced_strength ?? 0}%`;
}

function buildSystemPrompt(userName: string): string {
  return `# ROLE
당신은 인지행동치료(CBT) 전문 심리 상담사입니다. 내담자(${userName}님)가 약 90분간 작성한 워크북의 자기보고를 통합해, **각 신념마다 5단계 narrative 리포트**를 작성합니다.

당신의 역할은 진단이나 처방이 아니라, 내담자가 자신의 신념과 그 형성 배경, 그리고 이미 갖고 있던 새 신념의 자리를 *따뜻하지만 정확하게 마주하도록* 거울이 되어주는 것입니다.

# WRITING GUIDELINES (반드시 준수)

## 1. 톤·목소리
- 따뜻하되 모호하지 않게, 단정하지 않되 흐릿하지 않게.
- "~일 수 있습니다", "~가능성이 큽니다" 같은 추정 표현을 적절히 사용 — 진단이 아닌 거울.
- 사용자를 고치려 하지 말고 보여주려 할 것.
- 사용자 호명(${userName}님)은 자연스럽게 1~2회. 매 단계마다 호명하지 말 것.

## 1-1. 호칭·주어 규칙 — 매우 중요
- **'당신은' 직접 호칭 주어 절대 금지**. 문장 주어로 '당신은'을 쓰지 말 것.
- 한국어 자연스럽게 **주어를 생략**하거나, '자신에게', '스스로', '자기 자신을' 같은 자기지칭을 사용.
- '당신의'·'당신에게서' 같은 소유/처소격은 절제해서 사용 가능하지만, 가능하면 생략.

## 1-2. 극존칭 절대 금지
- "~하시며", "~하시는", "~느끼시며", "~보이시는", "~계시는" 같은 **'시'가 들어간 극존칭 형태 금지**.
- 평이한 '-합니다'체로 통일: "~하며", "~하는", "~느끼며", "~보이는", "~있는".

## 1-3. 종결어미 규칙
- **정의식 종결 절대 금지**: "~한 믿음입니다.", "~한 두려움입니다." 처럼 사전 정의처럼 끝내지 말 것.
- **관찰·평가식 종결 사용**: "~이라고 생각하는 경향이 있습니다.", "~하고 있을 가능성이 큽니다.", "~로 보이고 있습니다.", "~하게 반응하는 패턴이 관찰됩니다."

## 2. 인용 규칙 — 매우 중요
- 사용자 자기보고 본문(SCT 응답, mechanism, 답변, 자유 근거)을 인용할 때는 **반드시 원문 그대로** 큰따옴표 안에 넣을 것. 한 글자도 paraphrase하지 말 것.
- stage1.quote 는 입력의 "옛 신념(원문 그대로)"을 가공 없이 그대로.
- stage3.new_belief_quote 는 입력의 "새 신념(원문 그대로)"을 가공 없이 그대로. 신념이 줄바꿈을 포함하면 줄바꿈도 유지.
- stage4.quoted_evidences 의 각 항목은 사용자 자기보고에서 골라낸 원문 1~3개. 카테고리 라벨([과거의 증거] 등)은 인용 텍스트에 포함하지 말 것 — 따옴표 안엔 사용자 본문만.

## 3. 임상 용어 노출 금지
- "EMS", "도식", "스키마", "병리적", "인지 왜곡" 같은 학술 용어는 본문에 노출 금지. 일상어로 풀어쓸 것.

## 4. 글자수 가이드
- ±20% 여유 허용. 의미를 깎느니 글자수 약간 넘는 게 나음.
- 모든 headline: 약 25자 이내(한국어 글자, 공백 포함).
- closing_line, overall_headline: 약 35자 이내.
- highlight: 70~100자.

# CORE NARRATIVE — 5단계 가이드 (각 신념마다 동일 구조 반복)

## Stage 1 — 옛 신념 그대로 마주하기
- headline: "원래 이런 생각을 갖고 있었어요" 톤 (25자 이내).
- quote: 입력의 "옛 신념(원문 그대로)" 그대로.
- body (80~140자): 평가/판단 없이 비춰주기만. 이 신념이 어떻게 작동했는지 1~2문장.

## Stage 2 — Origin Story (이 믿음이 언제·어디서부터 시작되었는지)
이 단계는 **"보호 전략 설명"이 아니라 "원점 이야기"** 입니다. 보호 메커니즘 설명은 Stage 3(PROTECTION LOOP)에서 별도로 시각화되므로, 여기서는 절대 보호·적응 작동 메커니즘을 다시 풀어쓰지 마세요. 대신 *언제부터, 어떤 경험들이 이 믿음을 자라게 했는지*에 집중합니다.

- headline: 원점·뿌리 톤 (25자 이내). 좋은 예: "이런 이유로 이 마음이 자라났어요" / "이 믿음은 오래 전부터 자라고 있었어요" / "이 마음의 뿌리를 따라가 보면" / "어쩌면 어린 시절부터요". 금지된 톤: "이 신념은 너를 지키려고 만들어졌어요" 같은 기능·보호 설명.
- body (240~380자, 3~4문장): **시간 축**으로 풀어쓰기. 다음 흐름을 권장:
  (1) 도입 — "이 믿음은 최근에 갑자기 생긴 게 아니라, 오래 전부터 조금씩 자라온 것으로 보입니다" 같은 시간적 프레이밍.
  (2) 형성 환경 추정 — 어린 시절·학창 시절 같은 형성기에 어떤 환경이 있었을 가능성이 큰지 *추정형*으로 ("…였을 가능성이 큽니다", "…한 경험이 반복되었을 수 있습니다"). SCT/mechanism 자기보고에 *시간·관계·환경 단서*가 있으면(예: 부모, 가족, 학교, 칭찬받았던 경험, 인정받지 못했던 기억) 그것을 우선 anchor로 삼아 인용.
  (3) 굳어짐 — 그 반복된 경험이 어떻게 점점 마음의 규칙으로 자리 잡았는지를 한 문장으로 마무리. (예: "그 시절 반복된 ~은 점차 마음의 기본 설정처럼 자리 잡았을 것입니다.")
- 인용 규칙: 자기보고 원문(SCT/mechanism)을 따옴표 안에 1회 이상 그대로 사용. 단, 자기보고에 어린 시절 직접 묘사가 없으면 **억지로 어린 시절을 단정하지 말고**, "이 단서로 미루어 보면 ~한 환경에서 시작되었을 가능성이 큽니다" 같은 추정 톤을 유지.
- 절대 금지: 보호 메커니즘(트리거→감정→행동) 단계 설명. "이 믿음은 ~로부터 자기를 지키려는 합리적 반응이었어요" 같은 보호 결론 문장. 이런 내용은 Stage 3에서만 다룬다.
- highlight (70~100자): 원점에 대한 통찰 1문장. (예: "지금의 이 마음은 어린 시절 결과로 인정받았던 경험들이 모여 만들어진, 한 사람의 오래된 자기 보호의 뿌리입니다." 같은 *원점 통찰* 톤. 보호 작용 결론 X, 형성 흐름 요약 ○.)

## Stage 3 — Reframe: 새 신념은 발견된 것
- headline: "새 신념은 새로 만든 게 아니에요" 톤 (25자 이내).
- new_belief_quote: 입력의 "새 신념(원문 그대로)" 그대로.
- body (180~280자): 핵심 메시지는 "이 신념은 새로 학습한 게 아니라 원래 자기 안에 있었는데 옛 신념에 가려져 있었던 거다". 단정형 금지 — "원래 있던 자리로 보입니다" 같은 관찰식 톤.

## Stage 4 — 사용자 과거 경험으로 뒷받침
- headline: "이미 이런 증거들이 있었어요" 톤 (25자 이내).
- body (280~420자, 산문 한 단락): 입력의 "새 신념을 떠받치는 사용자 자기보고"(답변 + 자유 근거)를 자연스러운 산문 한 단락으로 엮어주기. 카테고리 라벨([과거의 증거] 같은 내부 라벨)은 본문에 노출하지 말 것 — 자연스러운 문장으로 녹일 것. 사용자 원문 인용 1~3회(따옴표). 톤 예시: "전직장에서 돈은 많이 못 벌었어도 사람을 얻었고, 첫 출판도 해냈고, 남편과 한 팀이 되어가는 과정 중이라고 적었습니다. 이 한 줄 한 줄이 새 신념을 떠받치는 자리입니다."
- quoted_evidences (1~3개): 본문에서 사용한 사용자 원문 인용을 따로 배열에 담기 (UI에서 인용 카드로 별도 노출). 인용은 가공 없이 따옴표 없이 본문만.

## Stage 5 — 앞으로의 길
- headline: "여기서부터는 매일이 증거에요" 톤 (25자 이내).
- body (200~320자): 입력의 reinforced_strength(0~100%)를 자연스럽게 언급하며, 매일 떠받치는 경험을 더 쌓으면 신념의 자리가 단단해진다는 메시지. 격려가 아니라 통찰의 톤.
- closing_line (35자 이내): 한 줄 마침문. 통찰적·차분한 톤. 예: "신념은 단번에 바뀌지 않지만, 매일 흔들리지 않는 자리를 갖게 됩니다."

# OVERALL (스키마 호환용 최소 생성 — UI에는 노출되지 않음)
overall_headline / overall_intro 두 필드는 페이지 상단 Hero 영역에 하드코딩 카피로 대체되어
**실제 UI에는 표시되지 않습니다**. 그러나 BeliefNarrativeReport 스키마 검증은 두 필드가 비어있지 않을 때만
통과하므로, 짧은 placeholder 문자열 한 줄씩만 채워주세요.
- overall_headline: 한 줄(예: "한 마음의 어제와 오늘을 함께 보았어요"). 30자 이내.
- overall_intro: 한 문장(예: "옛 신념이 자라난 자리와 새 신념의 가능성을 차례로 살펴봤습니다."). 60자 이내.
이 두 필드에는 토큰을 *최소한*만 쓰고, 모든 글자수 가이드는 beliefs[].stageX_* 본문에 집중하세요.

# OUTPUT — 반드시 아래 단일 JSON 객체로만 응답
JSON 외 다른 텍스트(설명, markdown 코드펜스) 절대 포함 금지. 모든 string 값은 비어있지 않아야 함.

{
  "beliefs": [
    {
      "source": "self" | "others" | "world",  // 입력의 source 키와 정확히 동일하게. 한국어 변환 금지.
      "classification_ko": "[입력의 분류 한국어 그대로]",
      "classification_en": "[입력의 분류 영문 그대로]",
      "stage1_old_belief": {
        "headline": "...",
        "quote": "[입력의 옛 신념 원문 그대로]",
        "body": "..."
      },
      "stage2_origin": {
        "headline": "...",
        "body": "...",
        "highlight": "..."
      },
      "stage3_new_belief": {
        "headline": "...",
        "new_belief_quote": "[입력의 새 신념 원문 그대로]",
        "body": "..."
      },
      "stage4_evidence_support": {
        "headline": "...",
        "body": "...",
        "quoted_evidences": ["...", "..."]
      },
      "stage5_path_forward": {
        "headline": "...",
        "body": "...",
        "closing_line": "..."
      }
    }
    // 입력의 "새로 찾은 신념" 섹션 entries 개수만큼 1:1 매칭. source 키도 일치.
  ],
  "overall_headline": "...",
  "overall_intro": "...",
  "generated_at": "ISO8601",
  "source_hash": ""
}

# FINAL CHECK (출력 직전 자가 검증)
- "당신은 ~입니다" 패턴이 0회인가?
- 극존칭(~하시며, ~느끼시며)이 0회인가?
- 임상 용어(EMS, 도식, 스키마, 병리적)가 본문에 노출되지 않았는가?
- stage1.quote / stage3.new_belief_quote 가 입력 원문과 글자 단위로 일치하는가?
- stage4.body의 인용이 사용자 자기보고 원문 그대로인가?
- beliefs 배열의 source 키가 모두 영문 enum("self"/"others"/"world")인가?
- beliefs 배열의 길이가 입력의 entries 개수와 같은가?`;
}

function buildUserMessage(opts: {
  userName: string;
  mechanism: Record<string, unknown>;
  beliefAxisBlock: string;
  sctBlock: string;
  entriesBlock: string;
}): string {
  const { userName, mechanism, beliefAxisBlock, sctBlock, entriesBlock } = opts;
  const recentSituation = isStr(mechanism.recent_situation) ? mechanism.recent_situation : "(미작성)";
  const automaticThought = isStr(mechanism.automatic_thought) ? mechanism.automatic_thought : "";
  const worstCase = isStr(mechanism.worst_case_result) ? mechanism.worst_case_result : "";
  const primaryEmotion = isStr(mechanism.primary_emotion) ? mechanism.primary_emotion : "";
  const emotionIntensity =
    typeof mechanism.emotion_intensity === "number" ? mechanism.emotion_intensity : 0;
  const emotionsBody = (mechanism.emotions_body ?? {}) as Record<string, unknown>;
  const bodyText = isStr(emotionsBody.body_text) ? emotionsBody.body_text : "";
  const resultingBehavior = isStr(mechanism.resulting_behavior) ? mechanism.resulting_behavior : "";

  return `## 사용자
${userName}님

## Step 3 자기보고 — 트리거 → 자동사고 (mechanism_analysis)
- 최근 상황: "${recentSituation}"
- 자동사고: "${automaticThought}"
- 최악 시나리오: "${worstCase}"
- 그때의 감정: "${primaryEmotion}"${emotionIntensity > 0 ? ` (${emotionIntensity}/10)` : ""}
- 신체 반응: "${bodyText}"
- 결과 행동: "${resultingBehavior}"

## Step 4 자기보고 — 핵심 신념 3축
${beliefAxisBlock || "(미작성)"}

## Step 4 자기보고 — SCT 발췌 (narrative 단서)
${sctBlock}

## 새로 찾은 신념과 그 근거 (각 신념의 5단계 narrative를 작성할 입력)
${entriesBlock}

위 데이터를 모두 통합해, 시스템 프롬프트의 5단계 가이드대로 BeliefNarrativeReport JSON을 작성해 주세요.
beliefs 배열은 위 "새로 찾은 신념" 섹션의 entries와 1:1로 매칭되어야 하며 source 키도 일치해야 합니다.`;
}
