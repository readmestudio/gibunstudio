import { after, NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { notifyEnReportRequest } from "@/lib/minds/inner-child/en/notify";

/**
 * POST /api/inner-child/en/request  (public — no login)
 *
 * 영어 퍼널 전용 "유료 리포트 요청(beta tester)" 캡처. 해외 결제 미지원이라 실제 결제 대신
 * 이메일만 받는다. 자동 발송은 하지 않는다 — 운영자가 슬랙 알림을 보고 영문 리포트를
 * 수동 작성·발송한다.
 *
 * 동작:
 *  1) 이메일 형식 검증
 *  2) leadId 가 있으면 그 리드행에 email 저장(어드민 /admin/leads 에서 요청자 식별)
 *  3) 저장된 무료 리포트 블롭에서 유형(child_name)·결과링크를 뽑아 운영자 슬랙에 알림
 *
 * 마이그레이션 불필요 — 기존 minds_leads.email 컬럼 + 슬랙만 사용.
 *
 * Body: { leadId?: string, email: string }
 * Resp: { ok: true } | { error }
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const email =
    typeof b.email === "string" ? b.email.trim().toLowerCase() : "";

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: "Please check your email address." },
      { status: 400 },
    );
  }

  const admin = createAdminClient();

  // 리드행에 요청 이메일 저장 — 익명 리드(email=null)를 요청자 이메일로 채운다.
  // 실패해도 요청 접수 자체는 성공으로 본다(운영자 슬랙 알림이 백업).
  if (leadId) {
    try {
      await admin.from("minds_leads").update({ email }).eq("id", leadId);
    } catch (err) {
      console.error("[inner-child/en/request] 리드 email 저장 실패:", err);
    }
  }

  // 운영자 슬랙 알림(fire-and-forget) — 요청 이메일 + 유형 + 결과 링크로 수동 발송을 돕는다.
  after(() => notifyEnReportRequest({ leadId, email }));

  return NextResponse.json({ ok: true });
}
