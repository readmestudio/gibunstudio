/**
 * POST /api/intake/session — 세션 생성 / 토큰 재발급 (관리자 전용, SPEC Phase B).
 *
 * body:
 *   { action: "create", display_name, memo?, session_date? } → 세션 생성 + 토큰 발급
 *   { action: "reissue", id } → 새 토큰 재발급 (status→issued)
 *
 * 관리자(ADMIN_EMAILS) 로그인 세션 필수 — 비관리자는 403.
 * (관리자 UI 는 server action 을 주로 쓰므로 이 라우트는 얇은 위임만 한다.)
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin/auth";
import { createSession, reissueToken } from "@/lib/intake/store";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // 관리자 인증 (Supabase 로그인 세션 + ADMIN_EMAILS)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json(
      { ok: false, error: "관리자만 사용할 수 있습니다." },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, error: "잘못된 요청 형식입니다." },
      { status: 400 },
    );
  }

  const action = body.action;

  try {
    // ── 세션 생성 → 토큰 발급 ──
    if (action === "create") {
      const displayName =
        typeof body.display_name === "string" ? body.display_name.trim() : "";
      if (!displayName) {
        return NextResponse.json(
          { ok: false, error: "display_name 은 필수입니다." },
          { status: 400 },
        );
      }
      const session = await createSession({
        display_name: displayName,
        memo: typeof body.memo === "string" ? body.memo : undefined,
        session_date:
          typeof body.session_date === "string" ? body.session_date : undefined,
      });
      return NextResponse.json({ ok: true, session });
    }

    // ── 토큰 재발급 (기존 링크 무효화 + status→issued) ──
    if (action === "reissue") {
      const id = typeof body.id === "string" ? body.id : "";
      if (!id) {
        return NextResponse.json(
          { ok: false, error: "id 는 필수입니다." },
          { status: 400 },
        );
      }
      const token = await reissueToken(id);
      return NextResponse.json({ ok: true, token });
    }

    return NextResponse.json(
      { ok: false, error: "지원하지 않는 action 입니다. (create | reissue)" },
      { status: 400 },
    );
  } catch (e) {
    console.error("[intake/session] 처리 실패:", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "처리에 실패했습니다." },
      { status: 500 },
    );
  }
}
