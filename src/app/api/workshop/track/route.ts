import { after, NextRequest, NextResponse } from "next/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  notifyWorkshopBuyAttempt,
  notifyWorkshopTestStart,
} from "@/lib/minds/notify";

/**
 * POST /api/workshop/track
 *
 * 워크북 결제수단 버튼 "클릭"(구매 시도)을 운영자 슬랙으로 중계한다. 슬랙 봇 토큰은
 * 서버 전용이라 클라이언트가 직접 못 쏘므로 이 라우트가 다리 역할.
 *
 * 왜 별도 신호가 필요한가: 결제 시작 알림(notifyMindsPaymentStart)은 워크북 결제
 * 생성 라우트의 로그인 인증을 통과한 뒤에야 뜬다. 성취중독 무료 테스트는 로그인
 * 불필요 퍼널이라, 비로그인 사용자가 결제 버튼을 눌러도 그 알림이 안 뜬다 → 여기서
 * 클릭 즉시(로그인 전에도) 신호를 받아 채운다.
 *
 * 또한 같은 무료 퍼널의 "테스트 시작"(첫 문항 응답)도 이 다리로 중계한다 — 별도
 * 시작 버튼이 없어 단순 방문과 구분되는 '진짜 시작' 신호를 운영자가 보도록.
 *
 * Body:
 *   · { event: "buy_attempt", source: SourceKey, method?: string }  — 결제수단 클릭
 *   · { event: "test_start",  source: SourceKey }                   — 첫 문항 응답(시작)
 *
 * 보안: 토큰 없이 누구나 호출 가능 → 슬랙 스팸에 노출된다. 그래서
 *   · event/source/method 를 모두 화이트리스트로만 통과시키고(임의 텍스트 차단),
 *   · 일반 rate limit(IP당 60회/분)을 건다.
 *   · 클라이언트도 세션·이벤트별 1회만 보내도록 dedupe 한다(workshop/track.ts).
 */

// source 키 → 슬랙에 표시할 안전한 라벨. 키만 받고 서버가 라벨로 바꿔(임의 텍스트 주입 차단).
const SOURCE_LABELS: Record<string, string> = {
  "achievement-test": "성취중독 테스트",
};

// 알려진 NicePay 결제수단 코드만 통과. 그 외는 null → "통합결제"로 표기된다.
const KNOWN_METHODS = new Set(["kakaopay", "naverpayCard", "card"]);

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

  const source =
    typeof b.source === "string" ? SOURCE_LABELS[b.source] : undefined;
  if (!source) {
    return NextResponse.json({ error: "알 수 없는 출처입니다." }, { status: 400 });
  }

  // 알림은 부가 기능 — fire-and-forget 으로 보내고 즉시 200.
  if (b.event === "test_start") {
    after(() => notifyWorkshopTestStart({ source }));
  } else if (b.event === "buy_attempt") {
    const method =
      typeof b.method === "string" && KNOWN_METHODS.has(b.method)
        ? b.method
        : null;
    after(() => notifyWorkshopBuyAttempt({ method, source }));
  } else {
    return NextResponse.json({ error: "알 수 없는 이벤트입니다." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
