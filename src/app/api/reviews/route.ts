import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/reviews
 *
 * 무료 테스트(성취중독·minds)를 끝내고 페이월에서 이탈하려던 방문자가 남긴 후기를 저장한다.
 * 비로그인 방문자가 쓰므로 인증은 요구하지 않고, 입력값을 서버에서 다시 검증한 뒤
 * service role 클라이언트로 INSERT 한다(RLS 우회). 매달 추첨용 연락처(contact)도 함께 받는다.
 */

// 후기를 받을 수 있는 테스트 종류 — 클라이언트가 보낸 값은 이 화이트리스트로만 통과시킨다.
const ALLOWED_TYPES = new Set(["achievement", "minds"]);

const MAX_CONTENT = 2000;
const MAX_CONTACT = 200;

export async function POST(req: NextRequest) {
  let body: {
    testType?: string;
    rating?: number;
    content?: string;
    contact?: string;
    leadId?: string | null;
    landingPath?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청" }, { status: 400 });
  }

  // 1) 테스트 종류 — 화이트리스트 검증
  const testType = String(body.testType ?? "");
  if (!ALLOWED_TYPES.has(testType)) {
    return NextResponse.json({ ok: false, error: "알 수 없는 테스트" }, { status: 400 });
  }

  // 2) 별점 — 1~5 정수
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ ok: false, error: "별점을 선택해 주세요" }, { status: 400 });
  }

  // 3) 본문 — 최대한 많이 모으기 위해 선택값으로 둔다(별점만 남겨도 OK). 길이 상한만 적용.
  const content = String(body.content ?? "").trim().slice(0, MAX_CONTENT);

  // 4) 연락처 — 추첨용. 선택값이지만 받으면 길이만 제한한다(형식은 폭넓게 허용).
  const contact = String(body.contact ?? "").trim().slice(0, MAX_CONTACT) || null;

  // 5) leadId(minds 전용) — UUID 형식일 때만 채운다. 아니면 익명.
  const rawLeadId = typeof body.leadId === "string" ? body.leadId.trim() : "";
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const leadId = UUID_RE.test(rawLeadId) ? rawLeadId : null;

  const landingPath = String(body.landingPath ?? "").slice(0, 300) || null;
  const userAgent = req.headers.get("user-agent")?.slice(0, 400) ?? null;

  const admin = createAdminClient();
  const { error } = await admin.from("test_reviews").insert({
    test_type: testType,
    rating,
    content,
    contact,
    lead_id: leadId,
    landing_path: landingPath,
    user_agent: userAgent,
  });

  if (error) {
    // 후기 저장 실패는 사용자 흐름의 핵심이 아니므로 조용히 500 만 돌려준다.
    return NextResponse.json({ ok: false, error: "저장에 실패했어요" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
