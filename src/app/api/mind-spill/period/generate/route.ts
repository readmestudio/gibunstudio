/**
 * POST /api/mind-spill/period/generate
 *   { period_report_id }  →  단일 LLM 호출로 4개 섹션 모두 생성 후 저장.
 *
 * 정책: 리포트당 LLM 호출 1회. 이전의 Strengths + Coach 병렬 호출을
 *       통합 period-prompt 단일 호출로 대체.
 *
 * 흐름:
 *   1. 결제 가드 (canViewPeriodReport) — 비결제 → 402.
 *   2. 이미 generated_at 있으면 noop (멱등).
 *   3. entries 조회 (entry_ids로) + multi-entry → workbook-like 머지.
 *   4. **chatCompletion 1회만 호출** (PERIOD_SYSTEM_PROMPT + buildPeriodUserPrompt).
 *   5. validatePeriodResponse 로 4개 섹션 분해 → period_reports 일괄 업데이트.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { chatCompletion, safeJsonParse } from "@/lib/gemini-client";
import {
  PERIOD_SYSTEM_PROMPT,
  buildPeriodUserPrompt,
  validatePeriodResponse,
} from "@/lib/mind-spill/period-prompt";
import { canViewPeriodReport } from "@/lib/mind-spill/access";
import type {
  BDItem,
  Classification,
  DailyEntry,
  PeriodReport,
  Workbook,
} from "@/lib/mind-spill/types";

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
  const periodReportId = body?.period_report_id;
  if (typeof periodReportId !== "string") {
    return NextResponse.json(
      { error: "period_report_id 가 필요합니다" },
      { status: 400 }
    );
  }

  const { data: row } = await supabase
    .from("mind_spill_period_reports")
    .select("*")
    .eq("id", periodReportId)
    .maybeSingle();
  if (!row || row.user_id !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
  }
  const periodReport = row as PeriodReport;

  // 결제 가드.
  const allowed = await canViewPeriodReport(
    supabase,
    user.id,
    user.email,
    periodReportId
  );
  if (!allowed) {
    return NextResponse.json(
      { error: "리포트 결제가 필요합니다", code: "payment_required" },
      { status: 402 }
    );
  }

  // 멱등성 — 이미 생성됐으면 LLM 호출 안 함.
  if (periodReport.generated_at) {
    return NextResponse.json({ success: true, already_generated: true });
  }

  // entries 조회.
  const { data: entries } = await supabase
    .from("mind_spill_daily_entries")
    .select("*")
    .in("id", periodReport.entry_ids)
    .order("entry_date", { ascending: true });
  if (!entries || entries.length < 3) {
    return NextResponse.json(
      { error: "필요한 entries를 찾을 수 없습니다" },
      { status: 400 }
    );
  }

  const mergedWorkbook = mergeEntriesToWorkbook(entries as DailyEntry[]);

  // 최소 입력 확인.
  const totalBd =
    (mergedWorkbook.brain_dump.recurring?.length ?? 0) +
    (mergedWorkbook.brain_dump.discomfort?.length ?? 0) +
    (mergedWorkbook.brain_dump.todos?.length ?? 0);
  if (totalBd === 0) {
    return NextResponse.json(
      {
        error:
          "리포트를 만들 만큼의 내용이 없어요. 머릿속을 한 줄이라도 적어주세요.",
        code: "insufficient_input",
      },
      { status: 400 }
    );
  }

  // ── 단일 LLM 호출 ──
  let analysis;
  try {
    const text = await chatCompletion(
      [
        { role: "system", content: PERIOD_SYSTEM_PROMPT },
        {
          role: "user",
          content: buildPeriodUserPrompt({ workbook: mergedWorkbook }),
        },
      ],
      {
        model: "gemini-2.5-pro",
        temperature: 0.6,
        max_tokens: 9000,
        response_format: { type: "json_object" },
      }
    );
    const parsed = safeJsonParse(text);
    analysis = validatePeriodResponse(parsed);
    if (!analysis) {
      console.error(
        "[period generate] validate failed:",
        text.slice(0, 800)
      );
      return NextResponse.json(
        {
          error: "리포트 형식이 맞지 않아요. 잠시 후 다시 시도해주세요.",
        },
        { status: 502 }
      );
    }
  } catch (e) {
    console.error("[period generate] LLM call failed:", e);
    return NextResponse.json(
      { error: "리포트 생성에 실패했어요. 잠시 후 다시 시도해주세요." },
      { status: 502 }
    );
  }

  // 일괄 저장 — 검증 통과 후 4개 섹션 모두 set + generated_at.
  const admin = createAdminClient();
  const { error: updateError } = await admin
    .from("mind_spill_period_reports")
    .update({
      patterns: analysis.patterns,
      strengths_report: analysis.strengths_report,
      coach_note: analysis.coach_note,
      prescriptions: analysis.prescriptions,
      generated_at: new Date().toISOString(),
    })
    .eq("id", periodReportId);

  if (updateError) {
    console.error("[period generate] update 실패:", updateError);
    return NextResponse.json(
      { error: "리포트 저장에 실패했어요." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    patterns: analysis.patterns,
    strengths_report: analysis.strengths_report,
    coach_note: analysis.coach_note,
    prescriptions: analysis.prescriptions,
  });
}

/**
 * 여러 entry의 활동을 합쳐서 prompt builder가 기대하는 Workbook 객체로 변환.
 *
 * 머지 전략:
 *   · brain_dump: 카테고리별로 모든 항목 concat (시간순).
 *   · moments: 모두 concat.
 *   · classification: union (사실/생각 + controllable/uncontrollable 합치기).
 *   · released: union.
 *   · actions: 모두 concat.
 *   · daily_scan: 가장 최근 entry의 scan (기준점 — 3일치 평균은 정확도 낮음).
 *   · mirror_report: 가장 최근 entry의 mirror (참고용).
 */
function mergeEntriesToWorkbook(entries: DailyEntry[]): Workbook {
  const sorted = [...entries].sort((a, b) =>
    a.entry_date.localeCompare(b.entry_date)
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const recurring: BDItem[] = [];
  const discomfort: BDItem[] = [];
  const todos: BDItem[] = [];
  const moments: Workbook["moments"] = [];
  const factCheck: Record<string, "fact" | "thought"> = {};
  const controllable: string[] = [];
  const influenceable: string[] = [];
  const uncontrollable: string[] = [];
  const released: string[] = [];
  const actions: Workbook["actions"] = [];

  for (const e of sorted) {
    recurring.push(...(e.brain_dump.recurring ?? []));
    discomfort.push(...(e.brain_dump.discomfort ?? []));
    todos.push(...(e.brain_dump.todos ?? []));
    moments.push(...(e.moments ?? []));

    const cls = (e.classification ?? {}) as Classification;
    if (cls.fact_check) Object.assign(factCheck, cls.fact_check);
    controllable.push(...(cls.controllable ?? []));
    influenceable.push(...(cls.influenceable ?? []));
    uncontrollable.push(...(cls.uncontrollable ?? []));
    released.push(...(e.released ?? []));
    actions.push(...(e.actions ?? []));
  }

  return {
    id: `period-${first.entry_date}-${last.entry_date}`,
    user_id: first.user_id,
    subscription_id: "",
    volume_no: 0,
    week_label: null,
    status: "completed",
    current_step: 3,
    weekly_scan: last.daily_scan,
    brain_dump: { recurring, discomfort, todos },
    mirror_report: last.mirror_report,
    classification: {
      fact_check: factCheck,
      controllable,
      influenceable,
      uncontrollable,
    },
    released,
    actions,
    moments,
    strengths_report: null,
    coach_note: null,
    prescriptions: null,
    created_at: first.created_at,
    updated_at: last.updated_at,
    completed_at: null,
  };
}
