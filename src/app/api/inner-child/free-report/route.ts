import { NextRequest, NextResponse } from "next/server";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { computeScore, type ScoreInput } from "@/lib/minds/inner-child/scoring";
import { getTypeCard } from "@/lib/minds/inner-child/type-cards";
import {
  FREE_SYSTEM_PROMPT,
  buildFreeUserMessage,
} from "@/lib/minds/inner-child/free-report-prompt";
import { getSavedFreeReport } from "@/lib/minds/inner-child/free-report-store";
import type { FreeReportGenerated, TypeCard } from "@/lib/minds/inner-child/report-types";
import type { ScoreResult } from "@/lib/minds/inner-child/types";
import {
  SCREENING_ITEMS,
  COMMON_ITEM,
  DRILLDOWN_ITEMS,
  GUARDIAN_ITEMS,
  SCT_ITEMS,
} from "@/lib/minds/inner-child/questions";

/**
 * POST /api/inner-child/free-report  (공개 — 로그인 불필요)
 *
 * 내면 아이 테스트 *원응답*(ScoreInput)을 받아 서버가 computeScore 로 권위 채점을
 * 재수행하고(클라 값 불신), 유형카드 고정필드 + LLM 생성 2필드(gap·relation_pattern)로
 * 무료 리포트 블롭을 만들어 리드 행(minds_leads)에 저장한다.
 *
 * /api/minds/parts-map 의 비용방어 3겹(리드당 1회 캐시 · IP 레이트리밋 · 일일 예산)을
 * 그대로 재사용한다. 유료가 아닌 무료 산출물이므로 LLM 실패 시 결정론적 폴백으로 항상
 * 유효한 리포트를 보장한다.
 *
 * Body: { input: ScoreInput, leadId?: string }
 * Resp: { ok: true, crisis: boolean, cached?: true }
 */

/** 내면 아이 무료 LLM 분석의 전역 일일 호출 상한(비용 천장). /minds 와 카운터 공유. */
const DAILY_LIMIT = Number(process.env.MINDS_LLM_DAILY_LIMIT ?? 500);

/** 오늘 LLM 호출이 일일 상한 안인지 확인 + 원자적 증가. DB 오류 시 fail-open. */
async function withinDailyBudget(): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("minds_llm_bump", {
      p_limit: DAILY_LIMIT,
    });
    if (error) {
      console.error("[inner-child/free-report] 일일 카운터 RPC 오류:", error);
      return true; // fail-open
    }
    if (typeof data === "number" && data > DAILY_LIMIT) {
      console.warn(`[inner-child/free-report] 일일 상한(${DAILY_LIMIT}) 도달 — 폴백 사용`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[inner-child/free-report] 일일 카운터 확인 실패:", err);
    return true; // fail-open
  }
}

interface FlatAnswer {
  id: string;
  question: string;
  answer: string;
}

/**
 * 채점 입력(ScoreInput)을 사람이 읽을 수 있는 평탄화 배열로 변환한다.
 * 배열로 저장하는 이유: ⓐ 결제 create 라우트의 "무료 테스트 완료" 검증이
 * Array.isArray(answers)&&length>0 이라 무수정 통과 ⓑ 운영자가 원답을 읽을 수 있게 보존.
 */
function flattenAnswers(input: ScoreInput): FlatAnswer[] {
  const out: FlatAnswer[] = [];

  for (const item of SCREENING_ITEMS) {
    const v = input.screening?.[item.id];
    if (v != null) out.push({ id: item.id, question: item.text, answer: String(v) });
  }
  if (input.common != null) {
    out.push({ id: COMMON_ITEM.id, question: COMMON_ITEM.text, answer: String(input.common) });
  }
  for (const item of DRILLDOWN_ITEMS) {
    const v = input.drilldown?.[item.id];
    if (v != null) out.push({ id: item.id, question: item.text, answer: String(v) });
  }
  for (const g of GUARDIAN_ITEMS) {
    const chosen = input.guardian?.[g.id];
    if (!chosen) continue;
    const opt = g.options.find((o) => o.value === chosen);
    out.push({ id: g.id, question: g.prompt, answer: opt?.text ?? String(chosen) });
  }
  for (const s of SCT_ITEMS) {
    const text = input.sct?.[s.slot] ?? "";
    out.push({ id: s.id, question: s.text, answer: String(text) });
  }

  return out;
}

/** 요청 본문이 최소한의 ScoreInput 형태인지 가볍게 확인. */
function isScoreInput(v: unknown): v is ScoreInput {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.screening === "object" &&
    typeof o.guardian === "object" &&
    typeof o.sct === "object"
  );
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
  const leadId = typeof b.leadId === "string" ? b.leadId : "";

  if (!isScoreInput(b.input)) {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }
  const input = b.input;

  // [0] 리드당 1회 — 이미 분석한 리드면 저장본 기준으로 응답(LLM 재호출 없음).
  if (leadId) {
    const cached = await getSavedFreeReport(leadId);
    if (cached) {
      return NextResponse.json({
        ok: true,
        crisis: cached.score_result.crisis_flag,
        cached: true,
      });
    }
  }

  // 서버 권위 채점 — 클라 값이 아니라 원응답으로 다시 계산한다.
  let score: ScoreResult;
  try {
    score = computeScore(input);
  } catch (err) {
    console.error("[inner-child/free-report] 채점 실패:", err);
    return NextResponse.json({ error: "채점에 실패했어요." }, { status: 500 });
  }

  const answers = flattenAnswers(input);
  const admin = createAdminClient();

  // 위기 응답 — LLM 을 건너뛰고 free_report 없이 블롭만 저장한다. 페이지가 전문기관
  // 안내를 렌더하고 페이월을 숨긴다.
  if (score.crisis_flag) {
    if (leadId) {
      try {
        await admin
          .from("minds_leads")
          .update({ answers, parts_map: { test_version: "v2.0", score_result: score } })
          .eq("id", leadId);
      } catch (err) {
        console.error("[inner-child/free-report] 위기 블롭 저장 실패:", err);
      }
    }
    return NextResponse.json({ ok: true, crisis: true });
  }

  const card = getTypeCard(score.primary_child.schema_id);

  // 생성 2필드 — 유형카드가 있고 예산이 남았을 때만 LLM. 실패 시 결정론적 폴백.
  let free: FreeReportGenerated | null = null;
  if (card && (await withinDailyBudget())) {
    for (let attempt = 0; attempt < 2 && !free; attempt++) {
      try {
        free = await generateFreeReport(card, score);
      } catch (err) {
        console.error(`[inner-child/free-report] LLM 시도 ${attempt + 1} 실패:`, err);
      }
    }
  }
  if (!free) free = buildFallbackFreeReport(card, score);

  if (leadId) {
    try {
      await admin
        .from("minds_leads")
        .update({
          answers,
          parts_map: { test_version: "v2.0", score_result: score, free_report: free },
        })
        .eq("id", leadId);
    } catch (err) {
      console.error("[inner-child/free-report] 리드 UPDATE 실패:", err);
    }
  }

  return NextResponse.json({ ok: true, crisis: false });
}

/* ─────────────── LLM 생성 (gap · relation_pattern) ─────────────── */

async function generateFreeReport(
  card: TypeCard,
  score: ScoreResult,
): Promise<FreeReportGenerated | null> {
  const response = await chatCompletion(
    [
      { role: "system", content: FREE_SYSTEM_PROMPT },
      { role: "user", content: buildFreeUserMessage(card, score) },
    ],
    {
      // 무료라도 개인화 필력을 최우선 — pro + thinking 허용(파운더 지시). 비용은 상단
      // 비용가드(IP 레이트리밋 + 일일 상한 withinDailyBudget)로 천장이 잡혀 있다.
      // portrait+insight+gap+relation 4필드라 토큰 넉넉히.
      model: "gemini-2.5-pro",
      temperature: 0.7,
      max_tokens: 8192,
      response_format: { type: "json_object" },
    },
  );

  const parsed = safeJsonParse<Record<string, unknown>>(response);
  if (!parsed || typeof parsed !== "object") return null;
  const portrait = typeof parsed.portrait === "string" ? parsed.portrait.trim() : "";
  const insight = typeof parsed.insight === "string" ? parsed.insight.trim() : "";
  const daily = typeof parsed.daily_prediction === "string" ? parsed.daily_prediction.trim() : "";
  const gap = typeof parsed.gap === "string" ? parsed.gap.trim() : "";
  const relation = typeof parsed.relation_pattern === "string" ? parsed.relation_pattern.trim() : "";
  // gap/relation 은 안정 검증용 필수 필드 — 없으면 실패로 보고 재시도/폴백.
  // portrait·insight·daily_prediction 은 무료 개인화 옵션 — 있으면 싣고, 없으면 렌더러가 정적 대체.
  if (!gap || !relation) return null;
  return {
    gap,
    relation_pattern: relation,
    ...(portrait ? { portrait } : {}),
    ...(insight ? { insight } : {}),
    ...(daily ? { daily_prediction: daily } : {}),
  };
}

/* ─────────────── 결정론적 폴백 (무료라 항상 결과 보장) ─────────────── */

function buildFallbackFreeReport(
  card: TypeCard | null,
  score: ScoreResult,
): FreeReportGenerated {
  // 개인화 도입부·통찰(polyfill) — LLM 이 없을 때의 결정론적 대체. 유저 응답을 되풀이하지
  // 않는 게 원칙이므로(고정 리포트 인상 방지) 여기서는 유형카드 필드만으로 조립한다.
  const portrait = card
    ? `${card.one_liner}. ${card.traits}\n\n마음 깊은 곳에는 '${card.core_belief}'는 믿음이 자리 잡고 있어요. 그래서 남들에겐 사소해 보이는 순간에도, 당신은 먼저 반응하게 됩니다. 이 아이가 어떤 아이인지, 지금부터 하나씩 만나볼게요.`
    : `당신 안에는 오래 자리를 지켜온 내면 아이가 있어요. 이 아이가 어떤 아이인지, 지금부터 함께 만나볼게요.`;

  const insight = card
    ? `평소엔 조용하던 이 아이는 특정한 순간에 유독 크게 깨어나요. 그때 당신은 ‘${card.surface_reaction}’ 모습으로 먼저 나서곤 합니다. 겉으로는 ${card.key_emotion}처럼 보여도, 그 밑에는 스스로를 지키려는 오래된 마음이 있어요. 그건 나약함이 아니라, 예전엔 실제로 당신을 지켜주던 방식이었습니다. 그런데 ‘왜’ 하필 그 순간이고, 여기서 어떻게 벗어날 수 있는지는 아직 남아 있어요.`
    : `당신의 반응에는 스스로를 지키려는 오래된 마음이 담겨 있어요. 그것이 왜 그런지, 어떻게 달라질 수 있는지는 지금부터 함께 살펴볼게요.`;

  // 일상 예측(polyfill) — 유형카드 domains 를 예측형 어조로. 유저 응답은 되풀이하지 않는다.
  const daily_prediction = card
    ? `아마 이런 순간, 꽤 있지 않나요. 관계에서는 ${card.domains["관계"]} 일에서는 ${card.domains["일"]} 그리고 혼자 있을 때조차 ${card.domains["자기관리"]} 매번 상황은 달라 보여도, 그 밑에서 움직이는 건 같은 아이예요.`
    : `상황은 매번 달라 보여도, 그 밑에서 움직이는 건 늘 같은 아이예요. 관계에서도, 일에서도, 혼자 있을 때조차 비슷한 결이 반복됩니다.`;

  const gap = card
    ? `${card.gap_hint}. 겉으로 보이는 모습과 속의 상태 사이에는 이런 간극이 있지만, 정작 그 간극을 알아채는 사람은 드뭅니다. 지금 이 리포트가 그 간극을 읽어냈습니다.`
    : "겉으로 보이는 모습과 속의 상태 사이에는 좀처럼 알아채기 어려운 간극이 있습니다. 지금 이 리포트가 그 간극을 읽어냈습니다.";

  const top = score.primary_child.top_item_text ?? "";
  const sctQuote =
    score.sct.childhood_self?.trim() ||
    score.sct.regression_trigger?.trim() ||
    score.sct.inner_voice?.trim() ||
    "";
  const relation_pattern = `${top ? `'${top}'라는 패턴이 관계 안에서 반복되는 경향이 있습니다. ` : ""}${
    sctQuote ? `"${sctQuote}"라는 응답은 이 패턴과 일치합니다. ` : ""
  }이 아이는 관계 안에서 같은 신호에 반복적으로 반응합니다.`;

  return { gap, relation_pattern, portrait, insight, daily_prediction };
}
