import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, RATE_LIMITS, getClientIp } from "@/lib/rate-limit";

/**
 * POST /api/minds/visit
 *
 * 광고로 랜딩에 "도착한" 순간 1행을 남긴다(minds_visits). 리드가 생기기 한참 전이다.
 *
 * 왜 필요한가:
 *   /api/minds/lead 는 테스트를 끝낸 사람만 기록한다. 그래서 들어왔다 그냥 나간
 *   사람은 DB 에 흔적이 없고, "광고 세트별로 몇 명이 왔는가"라는 **분모**가 없다.
 *   분모가 없으면 전환율을 못 구하고, 지역(광고 세트)별 성과 비교도 불가능하다.
 *
 * 기록 조건 — 광고 유입만:
 *   utm_* 또는 fbclid 가 하나라도 있을 때만 저장한다. 자연 유입·크롤러까지 전부 담으면
 *   비용만 늘고 분모가 오염된다. 판정은 서버가 한다(클라이언트 신뢰 안 함).
 *
 * 중복 방지 3겹:
 *   · 클라이언트가 sessionStorage 로 세션당 1회만 호출(visit.ts)
 *   · IP당 60회/분 rate limit
 *   · 유입 파라미터 없는 호출은 서버가 조용히 버림
 *
 * 실패해도 사용자 경험을 막지 않는다 — 측정은 부가 기능이라 항상 200 을 준다.
 *
 * Body: { testType: string, attribution?: {...}, referrer?: string }
 * Resp: { ok: boolean }
 */

// 퍼널 슬러그 화이트리스트. 임의 문자열을 그대로 넣으면 오타 하나로 집계가
// 갈라지고(los_angeles vs losangeles 사고와 같은 종류), 스팸이 표를 오염시킨다.
const TEST_TYPES = new Set([
  "inner_child_en",
  "saju_en",
  "inner_child",
  "minds",
]);

function utm(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 200) : null;
}

export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, RATE_LIMITS.general);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false });
  }
  const b = (body ?? {}) as Record<string, unknown>;

  const testType = typeof b.testType === "string" ? b.testType : "";
  if (!TEST_TYPES.has(testType)) return NextResponse.json({ ok: false });

  const attr = (b.attribution ?? {}) as Record<string, unknown>;
  const row = {
    utm_source: utm(attr.utm_source),
    utm_medium: utm(attr.utm_medium),
    utm_campaign: utm(attr.utm_campaign),
    utm_content: utm(attr.utm_content),
    utm_term: utm(attr.utm_term),
    fbclid: utm(attr.fbclid),
  };

  // 광고 유입이 아니면(추적 파라미터 전무) 기록하지 않는다.
  const isAdVisit = Object.values(row).some((v) => v !== null);
  if (!isAdVisit) return NextResponse.json({ ok: false });

  const admin = createAdminClient();
  const { error } = await admin.from("minds_visits").insert({
    test_type: testType,
    ...row,
    landing_path: utm(attr.landing_path),
    referrer: utm(b.referrer),
    ip_address: getClientIp(req),
    user_agent: (req.headers.get("user-agent") ?? "").slice(0, 500) || null,
  });

  if (error) {
    // 측정 실패가 랜딩을 망가뜨리면 안 된다 — 로그만 남기고 200.
    console.error("[minds/visit] INSERT 실패:", error);
    return NextResponse.json({ ok: false });
  }

  return NextResponse.json({ ok: true });
}
