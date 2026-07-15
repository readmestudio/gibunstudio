import { after, NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  notifyEnTestStart,
  notifyEnReachedPaywall,
  notifyEnRequestClick,
} from "@/lib/minds/inner-child/en/notify";
import { recordFunnelEvent } from "@/lib/funnel-events";

/**
 * POST /api/inner-child/en/track
 *
 * 영어 퍼널(/inner-child/en)의 브라우저 전용 깔때기 이벤트를 받아 운영자 슬랙으로 중계한다.
 * 슬랙 봇 토큰은 서버 전용이라 클라이언트가 직접 못 쏜다 — 이 라우트가 다리.
 *
 * KR 의 /api/minds/track 을 쓰지 않고 분리한 이유:
 *  · KR 라우트는 variant 를 minds|inner_child 로만 받고 "minds 뮤트" 가드가 걸려 있어,
 *    영어를 끼워 넣으려면 공유 파일을 손대야 한다(회귀 위험).
 *  · 영어는 단계 구성이 다르다(로그인·결제 없음, request_click 이 최종 전 단계).
 *  → 전용 라우트로 분리해 KR 신호와 완전히 격리한다. 이메일 제출(최종 접수) 알림은
 *    /api/inner-child/en/request 가 담당한다.
 *
 * Body: { event: "test_start"|"reached_paywall"|"request_click", leadId?: string(UUID) }
 *
 * 보안: 토큰 없이 호출 가능한 엔드포인트라 슬랙 스팸에 노출된다. 그래서
 *   · 이벤트 화이트리스트로만 분기하고
 *   · 일반 rate limit(IP당 60회/분)을 걸며
 *   · 클라이언트도 세션당 이벤트 1회만 보낸다(en/track.ts dedupe).
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  const leadId =
    typeof b.leadId === "string" && UUID_RE.test(b.leadId) ? b.leadId : null;

  const EVENTS = ["test_start", "reached_paywall", "request_click"] as const;
  const event = EVENTS.find((e) => e === b.event);
  if (!event) {
    return NextResponse.json({ error: "Unknown event." }, { status: 400 });
  }

  // 기록(집계)과 알림(실시간 인지)을 함께 건다 — 둘 다 부가 기능이므로
  // fire-and-forget 으로 보내고 즉시 200.
  after(() =>
    recordFunnelEvent({
      funnel: "inner_child_en",
      event,
      leadId,
      notified: true,
    })
  );

  if (event === "test_start") {
    after(() => notifyEnTestStart({ leadId }));
  } else if (event === "reached_paywall") {
    after(() => notifyEnReachedPaywall({ leadId }));
  } else if (event === "request_click") {
    after(() => notifyEnRequestClick({ leadId }));
  }

  return NextResponse.json({ ok: true });
}
