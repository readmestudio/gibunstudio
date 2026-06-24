import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * POST /api/minds/lead
 *
 * 무료 /minds 깔때기에서 연락처(리드)를 확보하는 즉시 1행을 INSERT 한다.
 * 대화·분석은 그 뒤에 이어지므로(/api/minds/parts-map 에서 같은 행을 UPDATE),
 * 도중에 이탈해도 연락처만은 남는다 — 리드젠의 목적.
 *
 * 로그인 없이 누구나 호출. service role(admin) 클라이언트로 RLS 우회 INSERT.
 *
 * Body: { channel: "email"|"kakao", email?: string, attribution?: {...} }
 * Resp: { ok: true, id } | { error }
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;

  const channel = b.channel === "kakao" ? "kakao" : "email";
  const email =
    typeof b.email === "string" ? b.email.trim().toLowerCase() : "";

  // email 채널이면 형식 검증. kakao 골격은 빈 값 허용.
  if (channel === "email" && !EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: "이메일 형식을 확인해주세요." },
      { status: 400 }
    );
  }

  const attr = (b.attribution ?? {}) as Record<string, unknown>;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("minds_leads")
    .insert({
      channel,
      email: email || null,
      source: "minds",
      utm_source: utm(attr.utm_source),
      utm_medium: utm(attr.utm_medium),
      utm_campaign: utm(attr.utm_campaign),
      utm_content: utm(attr.utm_content),
      utm_term: utm(attr.utm_term),
      fbclid: utm(attr.fbclid),
      landing_path: utm(attr.landing_path),
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("[minds/lead] INSERT 실패:", error);
    // 리드 저장 실패가 사용자 경험(결과 보기)을 막지 않도록 200 + id:null.
    return NextResponse.json({ ok: false, id: null });
  }

  return NextResponse.json({ ok: true, id: data.id });
}
