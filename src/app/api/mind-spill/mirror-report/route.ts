/**
 * POST /api/mind-spill/mirror-report
 *   { entry_id }  →  Mirror Report 분석 후 daily_entry.mirror_report 갱신, 결과 반환.
 *
 * 무료 LLM 1회/entry. mirror_generated_at 으로 중복 호출 멱등 처리.
 * 호출 시점: 사용자가 작성 페이지에서 "오늘 감정 분석 보기" 버튼 클릭.
 *
 * Brain Dump 가 비어있으면 400. 분석 실패 시 502.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import {
  MIRROR_SYSTEM_PROMPT,
  buildMirrorUserPrompt,
  validateMirrorReport,
} from "@/lib/mind-spill/mirror-prompt";
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
  // workbookId는 레거시 wrapper(weekly-parts/WeeklyEmpty)에서 보낼 때 호환용.
  const entryId = body?.entry_id ?? body?.entryId ?? body?.workbookId;
  if (typeof entryId !== "string") {
    return NextResponse.json(
      { error: "entry_id 가 필요합니다" },
      { status: 400 }
    );
  }

  const { data: row } = await supabase
    .from("mind_spill_daily_entries")
    .select("*")
    .eq("id", entryId)
    .maybeSingle();
  if (!row || row.user_id !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }
  const entry = row as DailyEntry;

  // 멱등성 — 이미 생성됐으면 기존 결과 그대로 반환 (LLM 비용 방어).
  if (entry.mirror_generated_at && entry.mirror_report) {
    return NextResponse.json({
      mirror_report: entry.mirror_report,
      already_generated: true,
    });
  }

  // 최소 입력 확인.
  const totalBd =
    (entry.brain_dump.recurring?.length ?? 0) +
    (entry.brain_dump.discomfort?.length ?? 0) +
    (entry.brain_dump.todos?.length ?? 0);
  if (totalBd === 0) {
    return NextResponse.json(
      {
        error: "분석할 내용이 없어요. 머릿속을 한 줄이라도 적어주세요.",
      },
      { status: 400 }
    );
  }

  // LLM 호출
  let report;
  try {
    const userPrompt = buildMirrorUserPrompt({
      brain_dump: entry.brain_dump,
      weekly_scan: entry.daily_scan,
    });
    const text = await chatCompletion(
      [
        { role: "system", content: MIRROR_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      {
        model: "gemini-2.5-pro",
        temperature: 0.5,
        max_tokens: 4096,
        response_format: { type: "json_object" },
      }
    );

    const parsed = safeJsonParse(text);
    report = validateMirrorReport(parsed);
    if (!report) {
      console.error("[mirror-report] validate failed:", text.slice(0, 500));
      return NextResponse.json(
        { error: "분석 결과 형식이 맞지 않아요. 잠시 후 다시 시도해주세요." },
        { status: 502 }
      );
    }
  } catch (e) {
    console.error("[mirror-report] LLM call failed:", e);
    return NextResponse.json(
      { error: "분석 호출에 실패했어요. 잠시 후 다시 시도해주세요." },
      { status: 502 }
    );
  }

  // entry에 저장 — admin client 사용 (RLS는 SELECT/INSERT만 허용).
  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("mind_spill_daily_entries")
    .update({
      mirror_report: report,
      mirror_generated_at: new Date().toISOString(),
    })
    .eq("id", entryId);
  if (updateError) {
    console.error("[mirror-report] update failed:", updateError);
    return NextResponse.json(
      { error: "리포트 저장에 실패했어요." },
      { status: 500 }
    );
  }

  return NextResponse.json({ mirror_report: report });
}
