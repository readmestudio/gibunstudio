import { after, NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { notifyMindsLogin } from "@/lib/minds/notify";

/**
 * POST /api/minds/lead
 *
 * 무료 /minds 깔때기에서 연락처(리드)를 확보하는 즉시 1행을 INSERT 한다.
 * 대화·분석은 그 뒤에 이어지므로(/api/minds/parts-map 에서 같은 행을 UPDATE),
 * 도중에 이탈해도 연락처만은 남는다 — 리드젠의 목적.
 *
 * 채널별 신원:
 *   · email — 비로그인. 클라이언트가 입력한 이메일을 형식 검증 후 저장.
 *   · kakao — 실제 Supabase OAuth 로 로그인된 상태. 클라이언트 값은 믿지 않고
 *     서버 세션에서 직접 user_id·email 을 꺼내 저장한다(위조 방지).
 *
 * service role(admin) 클라이언트로 RLS 우회 INSERT.
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
  let email =
    typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  let userId: string | null = null;

  if (channel === "kakao") {
    // 카카오는 실제 로그인. 클라이언트 값 대신 서버 세션에서 신원을 확정한다.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "카카오 로그인이 필요해요." },
        { status: 401 }
      );
    }
    userId = user.id;
    email = (user.email ?? "").trim().toLowerCase();
  } else if (!EMAIL_REGEX.test(email)) {
    // email 채널이면 형식 검증.
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
      ...(userId ? { user_id: userId } : {}),
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

  // 카카오는 실제 로그인 → 운영자 채널에 "테스트 시작" 알림(fire-and-forget).
  // email 채널은 비로그인 리드라 로그인 알림 대상이 아니다.
  if (channel === "kakao" && userId) {
    after(() => notifyMindsLogin({ email, userId }));
  }

  return NextResponse.json({ ok: true, id: data.id });
}
