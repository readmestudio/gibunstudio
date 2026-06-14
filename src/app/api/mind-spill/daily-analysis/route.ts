/**
 * POST /api/mind-spill/daily-analysis
 *   { entry_id }  →  "오늘 하루 정리하기" 분석 후 daily_entry 갱신, 결과 반환.
 *
 * 정책:
 *   · entry당 1회 멱등 — daily_analysis_generated_at 있으면 기존 결과 그대로 반환(무료).
 *   · 신규 생성은 월 무료 3회까지. 초과 시 데일리 구독 필요 → 402 payment_required.
 *   · 이전 체크인이 있으면 그 맥락(변화·반복·희망)까지 엮어서 분석.
 *
 * mirror_report 를 대체하는 통합 일일 분석.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import { checkDailyAnalysisAccess } from "@/lib/mind-spill/access";
import {
  DAILY_ANALYSIS_SYSTEM_PROMPT,
  buildDailyAnalysisUserPrompt,
  validateDailyAnalysis,
  type DailyAnalysisPriorSummary,
} from "@/lib/mind-spill/daily-analysis-prompt";
import {
  MIND_SPILL_DAILY_SUB_PRICE,
} from "@/lib/mind-spill/constants";
import type { DailyEntry } from "@/lib/mind-spill/types";

export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const entryId = body?.entry_id ?? body?.entryId;
  if (typeof entryId !== "string") {
    return NextResponse.json(
      { error: "entry_id 가 필요합니다" },
      { status: 400 }
    );
  }

  // 본인 소유 entry 확인.
  const { data: row } = await supabase
    .from("mind_spill_daily_entries")
    .select("*")
    .eq("id", entryId)
    .maybeSingle();
  if (!row || row.user_id !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }
  const entry = row as DailyEntry;

  // 멱등성 — 이미 생성됐으면 기존 결과 반환 (무료, 게이트 무관).
  if (entry.daily_analysis_generated_at && entry.daily_analysis) {
    return NextResponse.json({
      daily_analysis: entry.daily_analysis,
      already_generated: true,
    });
  }

  // 최소 입력 확인 — Brain Dump 또는 좋았던 순간 중 하나는 있어야.
  const totalBd =
    (entry.brain_dump.recurring?.length ?? 0) +
    (entry.brain_dump.discomfort?.length ?? 0) +
    (entry.brain_dump.todos?.length ?? 0);
  const totalMoments = (entry.moments ?? []).filter(
    (m) => m.title?.trim() || m.experience?.trim()
  ).length;
  if (totalBd === 0 && totalMoments === 0) {
    return NextResponse.json(
      { error: "정리할 내용이 없어요. 머릿속이나 좋았던 순간을 한 줄이라도 적어주세요." },
      { status: 400 }
    );
  }

  // ── 게이트: 무료 쿼터 / 구독 ──
  const access = await checkDailyAnalysisAccess(supabase, user.id, user.email);
  if (!access.allowed) {
    return NextResponse.json(
      {
        error: "이번 달 무료 분석을 모두 사용했어요.",
        paywall: {
          reason: "quota_exhausted",
          price: MIND_SPILL_DAILY_SUB_PRICE,
          free_used: access.freeUsed,
        },
      },
      { status: 402 }
    );
  }

  // ── 이전 체크인 요약 (변화·반복 맥락용) ──
  const { data: priorRows } = await supabase
    .from("mind_spill_daily_entries")
    .select("entry_date, daily_scan, brain_dump, moments")
    .eq("user_id", user.id)
    .lt("entry_date", entry.entry_date)
    .order("entry_date", { ascending: false })
    .limit(10);

  const prior: DailyAnalysisPriorSummary[] = (priorRows ?? [])
    .map((p) => {
      const scan = p.daily_scan ?? {};
      const bd = p.brain_dump ?? {};
      const moments = Array.isArray(p.moments) ? p.moments : [];
      return {
        entry_date: p.entry_date as string,
        emotions: Array.isArray(scan.emotions) ? scan.emotions : [],
        recurring: (bd.recurring ?? [])
          .map((b: { text?: string }) => b.text?.trim() ?? "")
          .filter(Boolean),
        discomfort: (bd.discomfort ?? [])
          .map((b: { text?: string }) => b.text?.trim() ?? "")
          .filter(Boolean),
        moment_titles: moments
          .map((m: { title?: string }) => m.title?.trim() ?? "")
          .filter(Boolean),
      };
    })
    // 내용이 아예 없는 날은 맥락에서 제외.
    .filter(
      (p) =>
        p.emotions.length ||
        p.recurring.length ||
        p.discomfort.length ||
        p.moment_titles.length
    );

  // ── LLM 호출 ──
  let analysis;
  try {
    const userPrompt = buildDailyAnalysisUserPrompt({
      today: {
        entry_date: entry.entry_date,
        daily_scan: entry.daily_scan,
        brain_dump: entry.brain_dump,
        moments: entry.moments ?? [],
      },
      prior,
    });
    const text = await chatCompletion(
      [
        { role: "system", content: DAILY_ANALYSIS_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      {
        model: "gemini-2.5-pro",
        temperature: 0.6,
        max_tokens: 4096,
        response_format: { type: "json_object" },
      }
    );

    const parsed = safeJsonParse(text);
    analysis = validateDailyAnalysis(parsed);
    if (!analysis) {
      console.error("[daily-analysis] validate failed:", text.slice(0, 500));
      return NextResponse.json(
        { error: "분석 결과 형식이 맞지 않아요. 잠시 후 다시 시도해주세요." },
        { status: 502 }
      );
    }
  } catch (e) {
    console.error("[daily-analysis] LLM call failed:", e);
    return NextResponse.json(
      { error: "분석 호출에 실패했어요. 잠시 후 다시 시도해주세요." },
      { status: 502 }
    );
  }

  // ── 저장 — admin client (RLS는 SELECT/INSERT/UPDATE 본인) ──
  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("mind_spill_daily_entries")
    .update({
      daily_analysis: analysis,
      daily_analysis_generated_at: new Date().toISOString(),
    })
    .eq("id", entryId);
  if (updateError) {
    console.error("[daily-analysis] update failed:", updateError);
    return NextResponse.json(
      { error: "분석 저장에 실패했어요." },
      { status: 500 }
    );
  }

  // 구독자는 무제한, 무료 사용자는 이번 생성으로 1회 소모.
  const freeRemaining = access.subscribed
    ? null
    : Math.max(0, access.freeRemaining - 1);

  return NextResponse.json({
    daily_analysis: analysis,
    subscribed: access.subscribed,
    free_remaining: freeRemaining,
  });
}
