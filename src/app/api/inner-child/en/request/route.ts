import { after, NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { consumeDailyBudget } from "@/lib/llm-budget";
import { notifyEnReportRequest, notifyEnReportSent } from "@/lib/minds/inner-child/en/notify";
import { getSavedFreeReport } from "@/lib/minds/inner-child/free-report-store";
import { getEnTypeCard } from "@/lib/minds/inner-child/en/type-cards";
import { getManualReport } from "@/lib/minds/inner-child/en/manual-report-store";
import { isManualReportExpired, type ManualReport } from "@/lib/minds/inner-child/en/manual-reports";
import { saveManualReport } from "@/lib/minds/inner-child/en/full-report-store";
import { generateEnFullReport, type GeneratedFull } from "@/lib/minds/inner-child/en/full-report";
import { sendEnFullReportEmail } from "@/lib/minds/inner-child/en/email";
import { markReportEmailStatus } from "@/lib/minds/report-email-status";

/**
 * POST /api/inner-child/en/request  (public — no login)
 *
 * 영어 퍼널 "full 리포트 요청(beta tester)". 해외 결제 미지원이라 결제 대신 이메일만 받고,
 * 서버가 **자동으로** LLM full 리포트를 생성·발송한다(K-Saju /saju/en 파이프라인 미러).
 *
 * 흐름:
 *  1) 이메일 검증 + leadId 행에 email 저장
 *  2) 즉시 { ok: true } 반환(유저는 접수 화면을 본다)
 *  3) after() 백그라운드 파이프라인:
 *     접수 알림 → (멱등: 원고 있으면 링크만 재발송) → 위기/리드/카드 가드 → 일일예산 →
 *     LLM 생성(2회 재시도) → parts_map.manual_report 병합 저장 → Resend 링크 발송 → 결과 알림
 *
 * 마이그레이션 불필요 — 기존 minds_leads.email + parts_map(jsonb) 만 사용.
 *
 * Body: { leadId?: string, email: string }
 * Resp: { ok: true } | { error }
 */

// 백그라운드 생성이 응답 이후에도 돌아야 하므로 Node 런타임 + 넉넉한 최대 실행시간.
export const runtime = "nodejs";
export const maxDuration = 300;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DAILY_LIMIT = Number(process.env.INNER_CHILD_EN_REPORT_DAILY_LIMIT ?? 100);

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, RATE_LIMITS.general);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request format." }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const leadId = typeof b.leadId === "string" ? b.leadId.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Please check your email address." }, { status: 400 });
  }

  // 리드행에 요청 이메일 저장 — 익명 리드(email=null)를 요청자 이메일로 채운다.
  // 실패해도 접수 자체는 성공으로 본다(파이프라인이 슬랙으로 결과를 알린다).
  if (leadId) {
    try {
      const admin = createAdminClient();
      await admin.from("minds_leads").update({ email }).eq("id", leadId);
    } catch (err) {
      console.error("[inner-child/en/request] 리드 email 저장 실패:", err);
    }
  }

  // 자동 생성·발송은 응답을 막지 않게 after() 백그라운드로.
  after(() => runEnReportPipeline(leadId, email));

  return NextResponse.json({ ok: true });
}

/**
 * 자동 생성·발송 파이프라인. 모든 종료 경로가 notifyEnReportSent 로 결과를 남긴다
 * (성공이든 실패든 운영자가 슬랙만 보면 상태를 안다). 절대 throw 하지 않는다.
 */
async function runEnReportPipeline(leadId: string, email: string): Promise<void> {
  try {
    await notifyEnReportRequest({ leadId, email });

    if (!leadId) {
      await notifyEnReportSent({ leadId: "", email, ok: false, reason: "no_lead (링크를 만들 수 없음)" });
      return;
    }

    // [멱등] 이미 원고가 있고 만료 전이면 재생성 없이 링크만 재발송(LLM 비용·중복 방지).
    const existing = await getManualReport(leadId);
    if (existing && !isManualReportExpired(existing)) {
      const sent = await sendEnFullReportEmail({ to: email, leadId, childName: existing.child_name });
      await markReportEmailStatus(leadId, {
        ok: sent.ok,
        at: new Date().toISOString(),
        reason: sent.reason,
        messageId: sent.messageId,
      });
      await notifyEnReportSent({ leadId, email, ok: sent.ok, reason: sent.reason });
      return;
    }
    // 만료된 원고는 수동 원고일 수 있어 자동으로 덮어쓰지 않는다 — 운영자 수동 연장.
    if (existing && isManualReportExpired(existing)) {
      await notifyEnReportSent({ leadId, email, ok: false, reason: "expired_manual (자동 연장 안 함)" });
      return;
    }

    const blob = await getSavedFreeReport(leadId);
    if (!blob) {
      await notifyEnReportSent({ leadId, email, ok: false, reason: "no_report_blob (무료 리포트 없음)" });
      return;
    }
    if (blob.score_result.crisis_flag) {
      // 위기 응답 — 자동 발송하지 않는다(수동 대응). 페이지는 안내를 렌더한다.
      await notifyEnReportSent({ leadId, email, ok: false, reason: "crisis (자동 발송 스킵)" });
      return;
    }

    const schemaId = blob.score_result.primary_child.schema_id;
    const card = getEnTypeCard(schemaId);
    if (!card) {
      await notifyEnReportSent({ leadId, email, ok: false, reason: `no_card (${schemaId})` });
      return;
    }

    // 일일 상한(서킷 브레이커) — LLM 호출 직전에 소비.
    const budget = consumeDailyBudget("inner_child_en_full", DAILY_LIMIT);
    if (!budget.allowed) {
      await notifyEnReportSent({ leadId, email, ok: false, reason: `budget (${budget.count}/${budget.limit})` });
      return;
    }

    const secondId = blob.score_result.secondary_children[0]?.schema_id;
    const secondCard = secondId ? getEnTypeCard(secondId) : null;

    let generated: GeneratedFull | null = null;
    for (let attempt = 0; attempt < 2 && !generated; attempt++) {
      try {
        generated = await generateEnFullReport(blob.score_result, card, secondCard, blob.concern ?? "");
      } catch (err) {
        console.error(`[inner-child/en/request] full 생성 시도 ${attempt + 1} 실패:`, err);
      }
    }
    if (!generated) {
      await notifyEnReportSent({ leadId, email, ok: false, reason: "generation_failed (LLM)" });
      return;
    }

    const report: ManualReport = {
      schema_id: card.schema_id,
      child_name: card.child_name,
      hook: generated.hook,
      intro: generated.intro,
      // 섹션 번호는 코드가 붙인다("01".."0N").
      sections: generated.sections.map((s, i) => ({ n: String(i + 1).padStart(2, "0"), ...s })),
      closing: generated.closing,
      // 자동 생성본은 만료 없음(항상 재생성 가능) — 메일도 "reopen anytime" 로 안내한다.
    };

    // 발송보다 먼저 저장 — 메일이 실패해도 링크로 열리는 리포트는 남는다(saju 패턴).
    const saved = await saveManualReport(leadId, report);
    if (!saved) {
      await notifyEnReportSent({ leadId, email, ok: false, reason: "save_failed (DB)" });
      return;
    }

    const sent = await sendEnFullReportEmail({ to: email, leadId, childName: card.child_name });
    // 발송 도장 — saveManualReport 병합 이후이므로 안전하게 email_sent 키만 얹는다.
    await markReportEmailStatus(leadId, {
      ok: sent.ok,
      at: new Date().toISOString(),
      reason: sent.reason,
      messageId: sent.messageId,
    });
    await notifyEnReportSent({ leadId, email, ok: sent.ok, reason: sent.reason });
  } catch (err) {
    console.error("[inner-child/en/request] 파이프라인 예외:", err);
    if (leadId) {
      await markReportEmailStatus(leadId, {
        ok: false,
        at: new Date().toISOString(),
        reason: err instanceof Error ? err.message : String(err),
      }).catch(() => {});
    }
    await notifyEnReportSent({
      leadId,
      email,
      ok: false,
      reason: err instanceof Error ? err.message : String(err),
    }).catch(() => {});
  }
}
