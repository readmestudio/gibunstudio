import { createAdminClient } from "@/lib/supabase/admin";

/**
 * 퍼널 이벤트 기록 헬퍼.
 *
 * 슬랙 알림(`@/lib/slack`)이 '실시간 인지'를 담당한다면, 이 모듈은 '집계'를 담당한다.
 * 슬랙 메시지는 세어서 통계를 낼 수 없고(뮤트·디듀프·전송 실패로 유실), 채널 히스토리를
 * 읽으려면 별도 스코프가 필요하다 → 집계는 DB 기록으로만 신뢰할 수 있다.
 *
 * 운영 정책 (slack.ts 와 동일):
 *  · 실패해도 절대 throw 하지 않는다 — 기록은 부가 기능이고, 집계 실패가 사용자
 *    요청을 막아선 안 된다. 실패는 콘솔 에러로만 남긴다.
 *  · 호출부는 await 하지 말고 `after(() => ...)` 로 부를 것(응답 지연 회피).
 */

export type FunnelName = "minds" | "inner_child" | "inner_child_en" | "workshop";

export type FunnelEventName =
  | "test_start"
  | "reached_paywall"
  | "checkout_click"
  | "buy_attempt"
  | "request_click";

interface RecordFunnelEventInput {
  funnel: FunnelName;
  event: FunnelEventName;
  /** minds_leads.id. 비로그인/미발급이면 null. */
  leadId?: string | null;
  /** workshop 퍼널의 출처 라벨. 그 외엔 생략. */
  source?: string | null;
  /** workshop buy_attempt 의 결제수단. 그 외엔 생략. */
  method?: string | null;
  /**
   * 같은 이벤트가 슬랙으로도 발송됐는지.
   * /minds 뮤트 가드에 걸려 슬랙엔 안 뜬 이벤트도 기록은 남기므로, 이 값으로 구분한다.
   */
  notified?: boolean;
}

export async function recordFunnelEvent(
  input: RecordFunnelEventInput
): Promise<void> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("funnel_events").insert({
      funnel: input.funnel,
      event: input.event,
      lead_id: input.leadId ?? null,
      source: input.source ?? null,
      method: input.method ?? null,
      notified: input.notified ?? false,
    });
    if (error) {
      console.error("[funnel-events] insert 실패:", error.message, {
        funnel: input.funnel,
        event: input.event,
      });
    }
  } catch (err) {
    console.error("[funnel-events] insert 예외:", err);
  }
}
