import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS, type RateLimitConfig } from "@/lib/rate-limit";
import { isWorkshopTestUser } from "@/lib/self-workshop/test-users";

const MAX_BODY_BYTES = 50_000;
const DEFAULT_WORKSHOP_TYPE = "achievement-addiction";

export type WorkshopGuardResult =
  | {
      ok: true;
      user: User;
      supabase: SupabaseClient;
      isTestUser: boolean;
    }
  | {
      ok: false;
      response: NextResponse;
    };

interface GuardOptions {
  /**
   * 구매·만료 검증을 생략. 진단(Step 1)처럼 무료 구간에서만 사용.
   * Rate Limit·인증·입력 길이 검증은 그대로 적용된다.
   */
  skipPurchaseCheck?: boolean;
  workshopType?: string;
  /**
   * Rate Limit 프리셋 override. 미지정 시 RATE_LIMITS.ai (5회/분).
   * 멀티턴 대화 라우트(explore-followup)는 RATE_LIMITS.conversation 사용.
   * 주의: rate limit은 인증·테스트유저 판정보다 먼저 적용되므로
   * 테스트 유저도 이 한도에 걸린다.
   */
  rateLimit?: RateLimitConfig;
}

/**
 * 워크북 API 진입 가드.
 *
 * 검증 순서 (실패 시 즉시 차단):
 *   1. Rate Limit (IP+경로, 5회/분) — 인증 전에 LLM 비용 폭주 차단
 *   2. 입력 길이 (Content-Length 헤더, 50KB) — 토큰 폭탄 차단
 *   3. 인증 (Supabase getUser)
 *   4. 구매 확인 (workshop_purchases.status='confirmed')
 *   5. 만료 확인 (expires_at > now())  ← 컬럼이 없으면 체크 스킵 (마이그레이션 전 호환)
 *
 * 사용 패턴:
 *   const guard = await requireWorkshopAccess(req);
 *   if (!guard.ok) return guard.response;
 *   const { user, supabase } = guard;
 */
export async function requireWorkshopAccess(
  request: Request,
  options: GuardOptions = {}
): Promise<WorkshopGuardResult> {
  const {
    skipPurchaseCheck = false,
    workshopType = DEFAULT_WORKSHOP_TYPE,
    rateLimit = RATE_LIMITS.ai,
  } = options;

  const rateLimitResponse = checkRateLimit(
    request as NextRequest,
    rateLimit
  );
  if (rateLimitResponse) return { ok: false, response: rateLimitResponse };

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "입력이 너무 큽니다 (최대 50KB)" },
        { status: 413 }
      ),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      ),
    };
  }

  const isTestUser = isWorkshopTestUser(user.email);

  if (skipPurchaseCheck || isTestUser) {
    return { ok: true, user, supabase, isTestUser };
  }

  const { data: purchase } = await supabase
    .from("workshop_purchases")
    .select("id, expires_at")
    .eq("user_id", user.id)
    .eq("workshop_type", workshopType)
    .eq("status", "confirmed")
    .maybeSingle();

  if (!purchase) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "워크북을 구매한 사용자만 이용할 수 있습니다" },
        { status: 403 }
      ),
    };
  }

  const expiresAtRaw = (purchase as { expires_at?: string | null }).expires_at;
  if (expiresAtRaw) {
    const expiresAt = new Date(expiresAtRaw).getTime();
    if (Number.isFinite(expiresAt) && expiresAt < Date.now()) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "워크북 이용 기간(90일)이 만료되었습니다" },
          { status: 403 }
        ),
      };
    }
  }

  return { ok: true, user, supabase, isTestUser };
}
