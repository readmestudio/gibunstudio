import { after, NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  notifyMindsTestStart,
  notifyMindsReachedPaywall,
  notifyMindsCheckoutClick,
} from "@/lib/minds/notify";

/**
 * POST /api/minds/track
 *
 * 브라우저에서만 일어나는 깔때기 이벤트(②③)를 받아 운영자 슬랙으로 중계한다.
 * 슬랙 봇 토큰은 서버 전용이라, 클라이언트가 직접 슬랙에 못 쏜다 — 이 라우트가 다리.
 * /minds 와 /inner-child 가 같은 라우트·같은 봇·같은 채널을 공유하고, variant 로만 구분된다.
 *
 * Body: {
 *   event: "test_start" | "reached_paywall" | "checkout_click",
 *   leadId?: string(UUID),
 *   variant?: "minds" | "inner_child"   // 기본 minds(현행 무회귀)
 * }
 *
 * 보안: 토큰 없이 누구나 호출 가능한 엔드포인트라 슬랙 스팸에 노출된다. 그래서
 *   · 이벤트 화이트리스트로만 분기하고,
 *   · 일반 rate limit(IP당 60회/분)을 건다.
 *   · 클라이언트도 세션당 이벤트 1회만 보내도록 dedupe 한다(track.ts).
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, RATE_LIMITS.general);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;

  const leadId =
    typeof b.leadId === "string" && UUID_RE.test(b.leadId) ? b.leadId : null;

  // 화이트리스트 밖 값은 기본 minds 로 안전 폴백(현행 무회귀).
  const variant = b.variant === "inner_child" ? "inner_child" : "minds";

  // 알림은 부가 기능 — fire-and-forget 으로 보내고 즉시 200.
  if (b.event === "test_start") {
    after(() => notifyMindsTestStart({ leadId, variant }));
  } else if (b.event === "reached_paywall") {
    after(() => notifyMindsReachedPaywall({ leadId, variant }));
  } else if (b.event === "checkout_click") {
    after(() => notifyMindsCheckoutClick({ leadId, variant }));
  } else {
    return NextResponse.json({ error: "알 수 없는 이벤트입니다." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
