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
 * 재수행하고(클라 값 불신), 유형카드 고정필드 + LLM 생성 1필드(portrait)로
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
  // 고민 자유서술(텍스트) — 채점 무관, blob 최상위에 그대로 저장한다. 결과 '고민 카드' 되돌려주기용.
  const concern = typeof b.concern === "string" ? b.concern.trim() : "";

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

  // 생성 1필드(portrait) — 유형카드가 있고 예산이 남았을 때만 LLM. 실패 시 결정론적 폴백.
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
  if (!free) free = buildFallbackFreeReport(card);

  if (leadId) {
    try {
      await admin
        .from("minds_leads")
        .update({
          answers,
          parts_map: {
            test_version: "v2.0",
            score_result: score,
            free_report: free,
            ...(concern.length ? { concern } : {}),
          },
        })
        .eq("id", leadId);
    } catch (err) {
      console.error("[inner-child/free-report] 리드 UPDATE 실패:", err);
    }
  }

  return NextResponse.json({ ok: true, crisis: false });
}

/* ─────────────── LLM 생성 (portrait) ─────────────── */

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
      //
      // ⚠️ max_tokens 를 내리지 말 것. portrait 은 300자 남짓이라 낮춰도 될 것 같지만,
      // gemini-2.5-pro 는 thinking 이 이 예산을 함께 쓴다 — 2048 로 낮추면 생각에 다 쓰고
      // **빈 문자열**이 돌아온다(2026-07-14 실측: 2048→0자 / 4096→324자 / 8192→273자).
      // 그러면 safeJsonParse 실패 → 재시도도 실패 → 전원이 정적 폴백을 받는다.
      // 게다가 max_tokens 는 상한이지 예약이 아니라, 낮춰도 비용은 한 푼도 안 준다.
      model: "gemini-2.5-pro",
      temperature: 0.7,
      max_tokens: 8192,
      response_format: { type: "json_object" },
    },
  );

  const parsed = safeJsonParse<Record<string, unknown>>(response);
  if (!parsed || typeof parsed !== "object") return null;
  const portrait = typeof parsed.portrait === "string" ? parsed.portrait.trim() : "";
  // portrait 은 무료의 유일한 생성 문단 — 없으면 실패로 보고 재시도/폴백.
  if (!portrait) return null;
  return { portrait };
}

/* ─────────────── 결정론적 폴백 (무료라 항상 결과 보장) ─────────────── */

/**
 * LLM 이 없을 때의 결정론적 portrait. 유저 응답을 되풀이하지 않는 게 원칙이므로
 * (고정 리포트 인상 방지) 유형카드 필드만으로 조립한다. 프롬프트와 같은 네 박자
 * (장면 → 규칙 → 반전 → 여운)를 지킨다. 반전 박자("그건 A가 아니라 B")를 빼면 판정으로
 * 읽히므로 폴백에도 반드시 넣는다.
 *
 * ⚠️ one_liner·child_name·traits 절대 금지 — 전부 유형을 특정하거나 유료 소구 대상이다
 * (one_liner 예: "늘 문 쪽을 바라보는 아이" = 유형명 그 자체). core_belief 만 쓴다.
 * 판매 페이지 렌더러의 staticPortrait 과 같은 문장 — 둘 다 마지막 방어선이다.
 */
function buildFallbackFreeReport(card: TypeCard | null): FreeReportGenerated {
  const portrait = card
    ? `남들에겐 사소해 보이는 순간에, 유독 당신만 먼저 반응하게 되는 때가 있죠. 마음 깊은 곳에 '${card.core_belief}'는 믿음이 자리 잡고 있어서, 이 아이는 그 순간을 그냥 지나치지 못하거든요.\n\n그건 예민해서가 아니라, 그렇게 먼저 알아차리는 일이 오래 당신을 지켜줬기 때문이에요. 다만 왜 하필 그 순간에 이 아이가 깨어나는지는, 아직 설명되지 않은 채 남아 있어요.`
    : `당신 안에는 오래 자리를 지켜온 내면 아이가 있어요. 남들에겐 사소해 보이는 순간에 당신이 먼저 반응하게 되는 건, 이 아이가 그 순간을 그냥 지나치지 못하기 때문이에요.\n\n그건 예민해서가 아니라, 그렇게 먼저 알아차리는 일이 오래 당신을 지켜줬기 때문이에요. 다만 왜 하필 그 순간인지는, 아직 설명되지 않은 채 남아 있어요.`;

  return { portrait };
}
