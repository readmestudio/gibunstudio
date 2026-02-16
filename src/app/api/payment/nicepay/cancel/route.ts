import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isCoachEmail } from "@/lib/auth/coach";
import { isNicepayEnabled } from "@/lib/nicepay/config";

/**
 * POST /api/payment/nicepay/cancel
 * 결제 취소 (환불) 처리
 * 코치만 호출 가능
 *
 * NicePay 가입 후 활성화됩니다.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isCoachEmail(user.email)) {
    return NextResponse.json(
      { error: "코치 권한이 필요합니다" },
      { status: 403 }
    );
  }

  if (!isNicepayEnabled()) {
    return NextResponse.json(
      { error: "NicePay 결제가 설정되지 않았습니다. 무통장입금 건은 수동 환불해주세요." },
      { status: 503 }
    );
  }

  const body = await request.json();
  const { paymentId, reason } = body;

  // TODO: NicePay 가입 후 구현
  // 1. payments 테이블에서 tid 조회
  // 2. NicePay 취소 API 호출
  // 3. 상태 업데이트

  console.log("NicePay cancel placeholder:", { paymentId, reason });

  return NextResponse.json({
    error: "NicePay 취소 API는 가입 후 활성화됩니다",
  }, { status: 503 });
}
