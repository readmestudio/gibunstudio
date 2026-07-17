import { after, NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { consumeDailyBudget, clampInput } from "@/lib/llm-budget";
import { computeSajuChart } from "@/lib/saju/engine";
import { generateSajuReport } from "@/lib/saju/report";
import { getSavedSaju, saveSajuBlob } from "@/lib/saju/report-store";
import { sendSajuReportEmail } from "@/lib/saju/email";
import { notifySajuReportRequest, notifySajuReportSent } from "@/lib/saju/notify";
import type { BirthInput, Gender } from "@/lib/saju/types";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * POST /api/saju/en/request  (public — no login)
 *
 * 영어 사주 퍼널의 "유료 리포트 요청". 해외 결제 미지원이라 결제 대신 이메일을 받고,
 * inner-child(수동 발송)와 달리 **자동 파이프라인**을 돈다:
 *   이메일 저장 → (after) 명반 재계산 → LLM 리포트 생성 → 블롭 저장 → Resend 링크 발송 → 슬랙
 *
 * 응답은 즉시 200 — 생성은 after() 에서 돌아 사용자를 기다리게 하지 않는다.
 * 명반은 클라이언트 값을 믿지 않고 출생 입력으로 **서버에서 재계산**한다.
 *
 * Body: { leadId?, email, date, timeIndex, gender, concern? }
 * Resp: { ok: true } | { error }
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DAILY_LIMIT = Number(process.env.SAJU_REPORT_DAILY_LIMIT ?? 200);

export async function POST(req: NextRequest) {
  // LLM 을 태우는 라우트이므로 무거운 1회성 호출용 엄격 프리셋(5회/분)을 쓴다.
  // (기존 general 60회/분은 LLM 라우트엔 지나치게 느슨했다)
  const limited = checkRateLimit(req, RATE_LIMITS.ai);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request format." }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;

  const clientLeadId = typeof b.leadId === "string" ? b.leadId.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Please check your email address." }, { status: 400 });
  }

  const date = String(b.date ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Please check your birth date." }, { status: 400 });
  }
  const timeIndex =
    typeof b.timeIndex === "number" && Number.isFinite(b.timeIndex) ? b.timeIndex : null;
  const gender: Gender = b.gender === "male" ? "male" : "female";
  // 자유서술 고민 — 프롬프트에 그대로 들어가므로 길이를 캡해 토큰 폭증을 막는다.
  const concernText = clampInput(b.concern, 1500);
  const concern = concernText || null;

  const input: BirthInput = { date, timeIndex, gender };

  /**
   * 리드 확보 — 리포트를 저장하고 링크를 만들려면 leadId 가 반드시 있어야 한다.
   * 클라이언트의 익명 리드 생성은 fire-and-forget 이라 아직 안 왔을 수 있으므로,
   * 없으면 **여기서 만든다**. (leadId 가 비면 메일 링크가 /saju/en/r/ 로 깨진다)
   */
  let leadId = clientLeadId;
  const admin = createAdminClient();
  try {
    if (leadId) {
      await admin.from("minds_leads").update({ email }).eq("id", leadId);
    } else {
      const { data, error } = await admin
        .from("minds_leads")
        .insert({
          channel: "saju",
          test_type: "saju",
          email,
          source: "minds",
          landing_path: "/saju/en",
        })
        .select("id")
        .single();
      if (error || !data) {
        console.error("[saju/en/request] 리드 생성 실패:", error);
      } else {
        leadId = data.id as string;
      }
    }
  } catch (err) {
    console.error("[saju/en/request] 리드 처리 실패:", err);
  }

  // 무거운 작업은 응답 후로 — 사용자는 즉시 "발송 예정" 확인 화면을 본다.
  after(async () => {
    let chart;
    try {
      chart = computeSajuChart(input);
    } catch (err) {
      console.error("[saju/en/request] 명반 계산 실패:", err);
      await notifySajuReportSent({ leadId, email, ok: false, reason: "chart_compute_failed" });
      return;
    }

    await notifySajuReportRequest({
      leadId,
      email,
      dayMaster: chart.four.dayMaster,
      personaName: chart.persona.name,
      concern,
    });

    // 중복 방지 — 같은 리드가 이미 리포트를 생성했다면 LLM 을 다시 태우지 않는다.
    // (재제출/새로고침으로 submitEmail 이 반복돼도 비용은 1회만 발생) 이미 생성된
    // 경우엔 링크 메일만 다시 보내 사용자가 리포트를 못 받는 일이 없게 한다.
    if (leadId) {
      const existing = await getSavedSaju(leadId);
      if (existing?.report) {
        const sent = await sendSajuReportEmail({
          to: email,
          leadId,
          personaName: existing.chart.persona.name,
          polarity: existing.chart.persona.polarity,
        });
        await notifySajuReportSent({
          leadId, email, ok: sent.ok,
          reason: sent.ok ? "already generated — 링크 재발송" : sent.reason,
        });
        return;
      }
    }

    // LLM 비용 방어 — 상한 도달 시 생성 스킵(요청은 슬랙에 남아 수동 처리 가능).
    const budget = consumeDailyBudget("saju_report", DAILY_LIMIT);
    if (!budget.allowed) {
      await notifySajuReportSent({
        leadId, email, ok: false,
        reason: `daily LLM budget reached (${budget.count}/${budget.limit})`,
      });
      return;
    }

    try {
      const report = await generateSajuReport(chart, concern);
      if (leadId) {
        await saveSajuBlob(leadId, { test_version: "saju-v1", chart, concern, report });
      }
      if (!leadId) {
        await notifySajuReportSent({ leadId, email, ok: false, reason: "no leadId — 링크 발송 불가" });
        return;
      }
      const sent = await sendSajuReportEmail({
        to: email,
        leadId,
        personaName: chart.persona.name,
        polarity: chart.persona.polarity,
      });
      await notifySajuReportSent({ leadId, email, ok: sent.ok, reason: sent.reason });
    } catch (err) {
      console.error("[saju/en/request] 리포트 생성/발송 실패:", err);
      await notifySajuReportSent({
        leadId, email, ok: false,
        reason: err instanceof Error ? err.message : "unknown",
      });
    }
  });

  return NextResponse.json({ ok: true });
}
