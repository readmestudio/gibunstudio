import { NextRequest, NextResponse } from "next/server";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { consumeDailyBudget, clampInput } from "@/lib/llm-budget";
import { computeScore, type ScoreInput } from "@/lib/minds/inner-child/scoring";
import { getEnTypeCard } from "@/lib/minds/inner-child/en/type-cards";
import {
  FREE_SYSTEM_PROMPT,
  buildFreeUserMessage,
} from "@/lib/minds/inner-child/en/free-report-prompt";
import { getSavedFreeReport } from "@/lib/minds/inner-child/free-report-store";
import { detectCrisisEn } from "@/lib/minds/inner-child/en/crisis-words";
import type { FreeReportGenerated, TypeCard } from "@/lib/minds/inner-child/report-types";
import type { ScoreResult } from "@/lib/minds/inner-child/types";
import {
  SCREENING_ITEMS,
  COMMON_ITEM,
  DRILLDOWN_ITEMS,
  GUARDIAN_ITEMS,
  SCT_ITEMS,
} from "@/lib/minds/inner-child/en/questions";

/**
 * POST /api/inner-child/en/free-report  (public — no login)
 *
 * 영어 내면 아이 무료 리포트 생성. 한국어 /api/inner-child/free-report 의 영어판.
 * 채점 엔진(computeScore)은 언어 무관(ID 기반)이라 그대로 공유하고, LLM 프롬프트·유형카드·
 * 저장 answers 텍스트·폴백만 영어로 갈아끼운다. 저장 스토어(minds_leads.parts_map, v2.0)는
 * 언어 중립적이라 재사용한다. 위기 판정은 한국어(computeScore) + 영어(detectCrisisEn) OR.
 *
 * Body: { input: ScoreInput, leadId?: string }
 * Resp: { ok: true, crisis: boolean, cached?: true }
 */

const DAILY_LIMIT = Number(process.env.MINDS_LLM_DAILY_LIMIT ?? 500);

/**
 * 오늘 LLM 호출이 일일 상한 안인지 확인 + 원자적 증가. (KR 라우트와 카운터 공유)
 * DB RPC 실패 시 무제한 fail-open 대신 인메모리 카운터를 예비 천장으로 얹는다
 * (DB 장애 = 비용 상한 붕괴를 막는 fail-safe 백스톱). KR 라우트와 동일.
 */
async function withinDailyBudget(): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("minds_llm_bump", { p_limit: DAILY_LIMIT });
    if (error) {
      console.error("[inner-child/en/free-report] 일일 카운터 RPC 오류:", error);
      return consumeDailyBudget("minds_llm_fallback", DAILY_LIMIT).allowed;
    }
    if (typeof data === "number" && data > DAILY_LIMIT) {
      console.warn(`[inner-child/en/free-report] 일일 상한(${DAILY_LIMIT}) 도달 — 폴백 사용`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[inner-child/en/free-report] 일일 카운터 확인 실패:", err);
    return consumeDailyBudget("minds_llm_fallback", DAILY_LIMIT).allowed;
  }
}

interface FlatAnswer {
  id: string;
  question: string;
  answer: string;
}

/**
 * ScoreInput → 사람이 읽는 평탄화 배열(영어 문항 텍스트). 결제 create 라우트의 "완료" 검증
 * (Array.isArray&&length>0)을 무수정 통과시키고 운영자가 원답을 읽게 보존한다.
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

/** schema_id 로 영어 드릴다운/공통 문항의 원문을 찾는다(top_item_text 를 영어로 치환). */
function enTopItemText(schemaId: string): string {
  const d = DRILLDOWN_ITEMS.find((x) => x.schema_id === schemaId);
  if (d) return d.text;
  if (schemaId === COMMON_ITEM.schema_id) return COMMON_ITEM.text;
  return "";
}

function isScoreInput(v: unknown): v is ScoreInput {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.screening === "object" &&
    typeof o.guardian === "object" &&
    typeof o.sct === "object"
  );
}

/**
 * SCT 자유서술을 프롬프트에 넣기 전에 필드별 길이를 캡한다(토큰 폭증 방어).
 * SCT 는 위기(자·타해) 감지의 유일 입력이므로 위기어를 놓치지 않도록 넉넉히 1000자로 자른다.
 */
function clampScoreInputText(input: ScoreInput): void {
  if (input.sct && typeof input.sct === "object") {
    for (const key of Object.keys(input.sct) as (keyof typeof input.sct)[]) {
      input.sct[key] = clampInput(input.sct[key], 1000);
    }
  }
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
    return NextResponse.json({ error: "Invalid request format." }, { status: 400 });
  }
  const input = b.input;
  clampScoreInputText(input);

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

  // 서버 권위 채점(언어 무관). 영어 위기어 감지를 OR 로 얹는다.
  let score: ScoreResult;
  try {
    score = computeScore(input);
  } catch (err) {
    console.error("[inner-child/en/free-report] 채점 실패:", err);
    return NextResponse.json({ error: "Scoring failed." }, { status: 500 });
  }
  const crisis =
    score.crisis_flag ||
    detectCrisisEn([
      input.sct?.childhood_self,
      input.sct?.inner_voice,
      input.sct?.family_rule,
      input.sct?.regression_trigger,
      input.sct?.escape_behavior,
    ]);
  if (crisis) score.crisis_flag = true;

  // LLM 이 영어 문항 원문을 참고하도록 top_item_text 를 영어로 치환한다.
  if (score.primary_child) {
    const en = enTopItemText(score.primary_child.schema_id);
    if (en) score.primary_child.top_item_text = en;
  }

  const answers = flattenAnswers(input);
  const admin = createAdminClient();

  // 위기 응답 — LLM 스킵, free_report 없이 블롭만 저장. 페이지가 전문기관 안내를 렌더한다.
  if (score.crisis_flag) {
    if (leadId) {
      try {
        await admin
          .from("minds_leads")
          .update({ answers, parts_map: { test_version: "v2.0", score_result: score } })
          .eq("id", leadId);
      } catch (err) {
        console.error("[inner-child/en/free-report] 위기 블롭 저장 실패:", err);
      }
    }
    return NextResponse.json({ ok: true, crisis: true });
  }

  const card = getEnTypeCard(score.primary_child.schema_id);

  let free: FreeReportGenerated | null = null;
  if (card && (await withinDailyBudget())) {
    for (let attempt = 0; attempt < 2 && !free; attempt++) {
      try {
        free = await generateFreeReport(card, score);
      } catch (err) {
        console.error(`[inner-child/en/free-report] LLM 시도 ${attempt + 1} 실패:`, err);
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
      console.error("[inner-child/en/free-report] 리드 UPDATE 실패:", err);
    }
  }

  return NextResponse.json({ ok: true, crisis: false });
}

/* ─────────────── LLM 생성 (English) ─────────────── */

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
  if (!gap || !relation) return null;
  return {
    gap,
    relation_pattern: relation,
    ...(portrait ? { portrait } : {}),
    ...(insight ? { insight } : {}),
    ...(daily ? { daily_prediction: daily } : {}),
  };
}

/* ─────────────── Deterministic fallback (English) ─────────────── */

function buildFallbackFreeReport(
  card: TypeCard | null,
  score: ScoreResult,
): FreeReportGenerated {
  const portrait = card
    ? `${card.one_liner}. ${card.traits}\n\nDeep down sits the belief that '${card.core_belief}'. So even in moments that look small to others, you're the first to react. Let's meet this child, one piece at a time, starting now.`
    : `Inside you lives an inner child who has kept its place for a long time. Let's get to know this child together, starting now.`;

  const insight = card
    ? `Usually quiet, this child wakes up unusually strongly in certain moments. In those moments you tend to step forward looking '${card.surface_reaction}'. On the surface it can look like ${card.key_emotion}, but underneath is an old wish to protect yourself. That isn't weakness — it was once a way that genuinely kept you safe. But why it happens in that exact moment, and how to step out of it, is still ahead.`
    : `Your reactions carry an old wish to protect yourself. Why that is, and how it can change, is something we'll look at together from here.`;

  const daily_prediction = card
    ? `Hasn't this happened to you more than once? In relationships, ${card.domains["관계"]} At work, ${card.domains["일"]} And even when you're alone, ${card.domains["자기관리"]} The situations look different each time, but the same child is moving underneath.`
    : `The situations look different each time, but the same child is always moving underneath — in relationships, at work, even when you're alone, a similar grain repeats.`;

  const gap = card
    ? `${card.gap_hint}. There's a gap between how you look on the outside and how you are on the inside, and almost no one notices it. This report has now read that gap.`
    : `There's a hard-to-notice gap between how you look on the outside and how you are on the inside. This report has now read that gap.`;

  const top = score.primary_child.top_item_text ?? "";
  const sctQuote =
    score.sct.childhood_self?.trim() ||
    score.sct.regression_trigger?.trim() ||
    score.sct.inner_voice?.trim() ||
    "";
  const relation_pattern = `${top ? `A pattern like '${top}' tends to repeat inside your relationships. ` : ""}${
    sctQuote ? `What you shared — "${sctQuote}" — lines up with this pattern. ` : ""
  }In relationships, this child responds again and again to the same signal.`;

  return { gap, relation_pattern, portrait, insight, daily_prediction };
}
