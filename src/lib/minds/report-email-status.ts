/**
 * 리포트 이메일 "발송 여부"를 DB(minds_leads.parts_map.email_sent)에 남기는 공용 헬퍼.
 *
 * 왜 필요한가: saju/en · inner-child/en 자동 발송 파이프라인은 지금까지 발송 성공/실패를
 * 슬랙으로만 흘려보내고 DB 엔 안 남겼다. 그래서 "누가 실제로 메일을 받았나"를 어드민/쿼리로
 * 확인할 방법이 없었다(슬랙이 유실되면 영영 모른다). 여기서 발송 직후 도장을 찍어
 * /admin/report-requests 가 읽을 수 있게 한다.
 *
 * 저장 위치: parts_map(jsonb) 안의 email_sent 키 → **마이그레이션 불필요**.
 *
 * ⚠️ 병합 저장이 핵심: parts_map 에는 이미 리포트 블롭(saju: report / inner-child: manual_report)
 *    이 들어 있다. 통째로 덮어쓰면 리포트가 날아가므로, 기존 parts_map 을 읽어 email_sent 키만
 *    얹어 되쓴다(full-report-store.saveManualReport 와 동일 원칙).
 *    saju 는 saveSajuBlob 이 parts_map 을 통째로 덮으므로 **반드시 저장 이후**에 이 함수를 호출할 것.
 */

import { createAdminClient } from "@/lib/supabase/admin";

export interface ReportEmailStatus {
  ok: boolean; // Resend 발송 성공 여부
  at: string; // 시도 시각(ISO)
  reason?: string; // 실패 사유(ok=false 일 때)
  messageId?: string; // Resend 메시지 id(성공 시 — 추후 대조용)
}

/** email_sent 도장을 기존 parts_map 에 병합 저장. 실패해도 throw 하지 않는다(부가 기록). */
export async function markReportEmailStatus(
  leadId: string,
  status: ReportEmailStatus,
): Promise<boolean> {
  if (!leadId) return false;
  try {
    const admin = createAdminClient();
    const { data, error: readErr } = await admin
      .from("minds_leads")
      .select("parts_map")
      .eq("id", leadId)
      .maybeSingle();
    if (readErr) {
      console.error("[report-email-status] parts_map 조회 실패(기록 중단):", readErr);
      return false;
    }
    const existing =
      data?.parts_map && typeof data.parts_map === "object"
        ? (data.parts_map as Record<string, unknown>)
        : {};
    const { error: writeErr } = await admin
      .from("minds_leads")
      .update({ parts_map: { ...existing, email_sent: status } })
      .eq("id", leadId);
    if (writeErr) {
      console.error("[report-email-status] email_sent 기록 실패:", writeErr);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[report-email-status] email_sent 기록 예외:", err);
    return false;
  }
}

/** parts_map 에서 발송 도장을 읽어온다(없으면 null = 아직 기록 안 됨/구버전). */
export function readReportEmailStatus(raw: unknown): ReportEmailStatus | null {
  if (!raw || typeof raw !== "object") return null;
  const es = (raw as Record<string, unknown>).email_sent;
  if (!es || typeof es !== "object") return null;
  const o = es as Record<string, unknown>;
  if (typeof o.ok !== "boolean") return null;
  return {
    ok: o.ok,
    at: typeof o.at === "string" ? o.at : "",
    reason: typeof o.reason === "string" ? o.reason : undefined,
    messageId: typeof o.messageId === "string" ? o.messageId : undefined,
  };
}
