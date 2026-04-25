import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import {
  isProfessionalReport,
  type ProfessionalReport,
} from "@/lib/self-workshop/professional-report";

/**
 * POST /api/self-workshop/generate-summary
 * SUMMARY · 1단계 (Step 9): 전문 상담사 리포트 생성
 *
 * 모든 진행 데이터(진단 / mechanism / 핵심신념 / belief_destroy / new_belief / 대처계획)를
 * 통합하여 ProfessionalReport(intro / analysis / transformation / DO&DONT 5+5) 생성.
 *
 * Body: { workshopId }
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const { workshopId } = await req.json();

  const { data: progress } = await supabase
    .from("workshop_progress")
    .select("*")
    .eq("id", workshopId)
    .single();

  if (!progress || progress.user_id !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }

  // 이미 ProfessionalReport 형식으로 저장되어 있으면 그대로 반환 (캐시)
  if (isProfessionalReport(progress.summary_cards)) {
    return NextResponse.json({ report: progress.summary_cards });
  }

  const {
    diagnosis_scores,
    diagnosis_profile,
    mechanism_analysis,
    mechanism_insights,
    core_belief_excavation,
    belief_destroy,
    new_belief,
    coping_plan,
  } = progress;

  if (!diagnosis_scores || !mechanism_analysis) {
    return NextResponse.json(
      { error: "진단/실습 자료가 부족합니다" },
      { status: 400 }
    );
  }

  const userName =
    (user.user_metadata?.name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    "당신";

  /* ─────────── 시스템 프롬프트 ─────────── */

  const systemPrompt = `당신은 CBT(인지행동치료) 전문 심리 상담사입니다. 내담자가 약 90분에 걸쳐 작성한 "성취 중독을 위한 마음 챙김 워크북"의 모든 데이터를 통합해, **심리 상담사가 작성한 따뜻하지만 전문적인 통합 리포트**를 작성합니다.

## 톤 규칙
- 일상 언어로 풀어쓰되, 분석의 깊이를 유지하세요. (전문 용어는 풀어쓰기. 인지 오류 이름만 그대로 사용 가능)
- 따뜻하지만 전문적. 격려·낙인·과도한 칭찬 금지. 관찰자 관점.
- 사용자 이름(${userName})을 자연스럽게 한두 번 호명.
- 모든 분석 문단에 사용자 원문 표현을 **직접 인용(따옴표)** 1~2회 포함.

## 응답 형식 (JSON 단일 객체, JSON 외 텍스트·마크다운 펜스 금지)

{
  "intro": {
    "greeting": "${userName}님께 보내는 1~2문단 인사. 이 워크북 여정의 의미를 짚고, 무엇을 발견했는지 짧게 예고. 200~350자.",
    "diagnosis_summary": "진단 점수/레벨/4영역의 임상적 의미를 일상어로 풀어쓴 3~5문장. 가장 높은 영역과 가장 낮은 영역을 짚어, 사용자의 강점과 취약점을 균형 있게 짚을 것."
  },
  "analysis": {
    "headline": "이 사람의 핵심 패턴 한 줄. 35자 이내. '~패턴이에요' 말투.",
    "body": "자동사고 → 핵심 신념 → 6-Part 사이클이 어떻게 굴러가는지 3~5문단(문단 사이 \\n\\n 두 줄 띄움). 사용자 표현 1~2회 직접 인용.",
    "cognitive_error_quotes": ["사용자 자동사고 원문 직접 인용 1~3개. 따옴표 포함하지 말 것 (UI에서 따옴표 처리)"]
  },
  "transformation": {
    "headline": "변화의 핵심 한 줄. 35자 이내. 격려보다는 통찰.",
    "body": "새 핵심 신념 + 대체 사고 + 실천 계획이 사이클을 어떻게 끊는지 3~5문단(\\n\\n 분리). 새 핵심 신념을 따옴표로 직접 인용. 옛 믿음과 어떻게 다른지 대비."
  },
  "do_donts": {
    "dos":  [{ "title": "12자 이내", "description": "60~120자. 새 핵심 신념과 일관된, 이 사람의 일상에서 즉시 실천 가능한 구체적 행동 1개. 일반론 금지." }, ...정확히 5개],
    "donts":[{ "title": "12자 이내", "description": "60~120자. 옛 핵심 신념을 강화하던 행동 패턴. 이 사람이 실제로 하던 행동을 짚을 것 (mechanism_analysis.resulting_behavior, behavior_experiment.experiment_situation 등 참조)." }, ...정확히 5개]
  },
  "generated_at": "ISO8601 (예: 2026-04-25T...)"
}

## 규칙
- DO/DONT 각 **정확히 5개**. 4개도 6개도 아님.
- DO와 DONT는 짝을 이루지 않아도 됨. 각각 독립적인 5개 항목.
- title 12자 이내. description 60~120자. 일반 처방 금지("운동하세요", "쉬세요" 같은 무차별적 조언 금지). 이 사람의 데이터에서만 도출된 행동.
- "이 사람만의" 처방을 위해, mechanism_analysis.resulting_behavior, coping_plan.behavioral_experiment.experiment_situation, belief_destroy의 4기법 응답을 적극 인용·활용.
- DO는 새 핵심 신념(new_belief.new_core_belief)과 일관된 행동.
- DONT는 옛 핵심 신념(synthesis.belief_line)을 강화하던 행동.
- 사용자가 belief_destroy / new_belief / coping_plan 일부를 비웠어도 데이터가 있는 부분만으로 작성. 비어있다고 명시하지 말 것.`;

  /* ─────────── 사용자 메시지 (입력 데이터 통합) ─────────── */

  const synthesis =
    (core_belief_excavation as {
      synthesis?: {
        belief_line?: string;
        how_it_works?: string;
        reframe_invitation?: string;
      };
    } | null)?.synthesis ?? null;

  const beliefLine = synthesis?.belief_line?.trim() ?? "";
  const howItWorks = synthesis?.how_it_works?.trim() ?? "";
  const reframeInvitation = synthesis?.reframe_invitation?.trim() ?? "";

  const cognitiveErrorsBlock = (() => {
    if (!mechanism_insights || typeof mechanism_insights !== "object") {
      return "(없음)";
    }
    const r = mechanism_insights as {
      cognitive_errors?: {
        items?: Array<{ name?: string; interpretation?: string }>;
      };
      pattern_cycle?: { headline?: string };
    };
    const items = r.cognitive_errors?.items ?? [];
    if (items.length === 0) return "(없음)";
    return items
      .map((it) => `- ${it.name ?? ""}: ${it.interpretation ?? ""}`)
      .join("\n");
  })();

  const patternHeadline = (() => {
    if (!mechanism_insights || typeof mechanism_insights !== "object") {
      return "(없음)";
    }
    const r = mechanism_insights as {
      pattern_cycle?: { headline?: string };
    };
    return r.pattern_cycle?.headline ?? "(없음)";
  })();

  const beliefDestroyBlock = (() => {
    const bd = belief_destroy as {
      triple_column?: { rational_response?: string };
      double_standard?: { letter_to_friend?: string };
      evidence_review?: { supporting?: string; refuting?: string };
      cost_benefit?: { benefits?: string; costs?: string };
    } | null;
    if (!bd) return "(작성 안 함)";
    const lines: string[] = [];
    if (bd.triple_column?.rational_response?.trim()) {
      lines.push(`- 합리적 반응: "${bd.triple_column.rational_response}"`);
    }
    if (bd.double_standard?.letter_to_friend?.trim()) {
      lines.push(`- 친구에게 해줄 말: "${bd.double_standard.letter_to_friend}"`);
    }
    if (bd.evidence_review?.refuting?.trim()) {
      lines.push(`- 반박 증거: "${bd.evidence_review.refuting}"`);
    }
    if (bd.cost_benefit?.costs?.trim()) {
      lines.push(`- 이 믿음의 비용: "${bd.cost_benefit.costs}"`);
    }
    return lines.length > 0 ? lines.join("\n") : "(작성 안 함)";
  })();

  const newBeliefBlock = (() => {
    const nb = new_belief as {
      new_core_belief?: string;
      why_this_works?: string;
    } | null;
    if (!nb || !nb.new_core_belief?.trim()) return "(작성 안 함)";
    const lines = [`- 새 핵심 믿음: "${nb.new_core_belief}"`];
    if (nb.why_this_works?.trim()) {
      lines.push(`- 왜 이 믿음이 맞는가: "${nb.why_this_works}"`);
    }
    return lines.join("\n");
  })();

  const copingBlock = (() => {
    const cp = coping_plan as {
      cognitive_restructuring?: {
        alternative_thought?: string;
        evidence_against?: string;
      };
      behavioral_experiment?: {
        experiment_situation?: string;
        coping_plan?: string;
      };
      self_compassion?: {
        self_compassion_letter?: string;
        rest_permission?: string;
        boundary_setting?: string;
      };
    } | null;
    if (!cp) return "(작성 안 함)";
    const lines: string[] = [];
    if (cp.cognitive_restructuring?.alternative_thought?.trim()) {
      lines.push(
        `- 대체 사고: "${cp.cognitive_restructuring.alternative_thought}"`
      );
    }
    if (cp.behavioral_experiment?.experiment_situation?.trim()) {
      lines.push(
        `- 행동 실험 상황: "${cp.behavioral_experiment.experiment_situation}"`
      );
    }
    if (cp.behavioral_experiment?.coping_plan?.trim()) {
      lines.push(`- 대처 계획: "${cp.behavioral_experiment.coping_plan}"`);
    }
    if (cp.self_compassion?.boundary_setting?.trim()) {
      lines.push(`- 경계 설정: "${cp.self_compassion.boundary_setting}"`);
    }
    if (cp.self_compassion?.rest_permission?.trim()) {
      lines.push(`- 쉼 허락: "${cp.self_compassion.rest_permission}"`);
    }
    return lines.length > 0 ? lines.join("\n") : "(작성 안 함)";
  })();

  const profile = diagnosis_profile as {
    character_line?: string;
    character_description?: string;
  } | null;

  const userMessage = `## 사용자
${userName}님

## 진단 결과
- 총점: ${diagnosis_scores.total}/100
- 레벨: ${diagnosis_scores.level} (${diagnosis_scores.levelName})
- 영역별 (각 /25):
  · 자기 가치의 조건화: ${diagnosis_scores.dimensions.conditional_self_worth}
  · 과잉 추동: ${diagnosis_scores.dimensions.compulsive_striving}
  · 실패 공포/완벽주의: ${diagnosis_scores.dimensions.fear_of_failure}
  · 정서적 회피: ${diagnosis_scores.dimensions.emotional_avoidance}
- 캐릭터라인: ${profile?.character_line ?? "(미생성)"}
- 캐릭터 설명: ${profile?.character_description ?? "(미생성)"}

## FIND_OUT 1: 트리거 → 자동사고
- 최근 상황: ${mechanism_analysis.recent_situation ?? "(미작성)"}
- 자동사고: "${mechanism_analysis.automatic_thought ?? ""}"
- 결과(최악 시나리오): "${mechanism_analysis.worst_case_result ?? ""}"
- 감정: ${mechanism_analysis.primary_emotion ?? ""} (${mechanism_analysis.emotion_intensity ?? 0}/10)
- 신체 반응: ${mechanism_analysis.emotions_body?.body_text ?? "(없음)"}
- 실제 행동(behavior 축): "${mechanism_analysis.resulting_behavior ?? ""}"

## FIND_OUT 2: 핵심 신념
- 한 줄: "${beliefLine}"
- 작동 방식: ${howItWorks ? `"${howItWorks}"` : "(없음)"}
- 리프레임 초대: ${reframeInvitation ? `"${reframeInvitation}"` : "(없음)"}

## FIND_OUT 3: 통합 패턴 분석
- 패턴 헤드라인: ${patternHeadline}
- 인지 오류 해석:
${cognitiveErrorsBlock}

## DESTROY 1: 핵심 믿음 반박 (4기법)
${beliefDestroyBlock}

## SOLUTION 1: 새 핵심 신념
${newBeliefBlock}

## SOLUTION 2: 대체 사고 + 행동 실험 + 자기 돌봄
${copingBlock}

위 데이터를 모두 통합해, 시스템 프롬프트의 응답 형식대로 ProfessionalReport JSON을 작성해 주세요. DO 5개와 DONT 5개를 각각 정확히 채우는 것에 특별히 주의하세요.`;

  /* ─────────── LLM 호출 ─────────── */

  try {
    const response = await chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      {
        model: "gemini-2.5-pro",
        temperature: 0.6,
        max_tokens: 8192,
        response_format: { type: "json_object" },
      }
    );

    const parsed = safeJsonParse<ProfessionalReport>(response);

    // generated_at 자동 보정 (LLM이 누락하거나 잘못 채울 수 있음)
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      (parsed as ProfessionalReport).generated_at =
        new Date().toISOString();
    }

    if (!isProfessionalReport(parsed)) {
      console.error(
        "generate-summary: ProfessionalReport 스키마 검증 실패",
        parsed
      );
      return NextResponse.json(
        { error: "리포트 형식이 올바르지 않습니다. 다시 시도해 주세요." },
        { status: 500 }
      );
    }

    // 새 흐름: SUMMARY 1(step 10) 완료 → SUMMARY 2 마무리 성찰(step 11)
    await supabase
      .from("workshop_progress")
      .update({
        summary_cards: parsed,
        current_step: Math.max(11, progress.current_step ?? 10),
      })
      .eq("id", workshopId);

    return NextResponse.json({ report: parsed });
  } catch (err) {
    console.error("써머리 생성 실패:", err);
    return NextResponse.json(
      { error: "써머리 생성에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
