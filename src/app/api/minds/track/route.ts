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
 * ⚠️ 현재 inner-child 만 광고 집행 중 → variant !== "inner_child" 인 퍼널 신호는
 *    슬랙으로 쏘지 않는다(minds 깔때기 노이즈 차단). /minds 광고 재개 시 가드 해제.
 *
 * Body: {
 *   event: "test_start" | "reached_paywall" | "checkout_click",
 *   leadId?: string(UUID),
 *   variant?: "minds" | "inner_child"   // inner_child 만 슬랙 발화, 그 외는 무시
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

  const variant = b.variant === "inner_child" ? "inner_child" : "minds";

  // 이벤트 화이트리스트 밖은 400.
  if (
    b.event !== "test_start" &&
    b.event !== "reached_paywall" &&
    b.event !== "checkout_click"
  ) {
    return NextResponse.json({ error: "알 수 없는 이벤트입니다." }, { status: 400 });
  }

  // 지금은 inner-child 랜딩만 광고 집행 중 — /minds 깔때기 top-of-funnel(테스트 시작·
  // 페이월 도달) 슬랙은 노이즈다. 그래서 그 둘은 inner_child 일 때만 쏘고, minds(및
  // variant 유실로 minds 로 폴백된 값)는 조용히 무시하고 200 만 돌려준다(클라이언트 dedupe 유지).
  //
  // 단, "지금 바로 잠금 해제하기" 클릭(checkout_click)은 결제 의향이 담긴 '높은 신호'라
  // 노이즈가 아니다 → minds 퍼널이어도 통과시켜 운영자 슬랙에 띄운다.
  // ⚠️ 여기는 퍼널 단계 신호만 담당한다. 결제 완료 등 '돈' 알림은 별도 라우트라 영향 없음.
  // 다시 /minds 광고를 전면 켜면 아래 가드를 통째로 풀면 된다.
  if (variant !== "inner_child" && b.event !== "checkout_click") {
    return NextResponse.json({ ok: true, skipped: "minds_muted" });
  }

  // 알림은 부가 기능 — fire-and-forget 으로 보내고 즉시 200.
  if (b.event === "test_start") {
    after(() => notifyMindsTestStart({ leadId, variant }));
  } else if (b.event === "reached_paywall") {
    after(() => notifyMindsReachedPaywall({ leadId, variant }));
  } else if (b.event === "checkout_click") {
    after(() => notifyMindsCheckoutClick({ leadId, variant }));
  }

  return NextResponse.json({ ok: true });
}
