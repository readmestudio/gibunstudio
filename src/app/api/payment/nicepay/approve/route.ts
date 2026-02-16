import { NextRequest, NextResponse } from "next/server";
import { isNicepayEnabled, NICEPAY_CONFIG } from "@/lib/nicepay/config";

/**
 * POST /api/payment/nicepay/approve
 * NicePay 결제 승인 콜백 처리
 *
 * NicePay 가입 후 활성화됩니다.
 * 현재는 placeholder입니다.
 */
export async function POST(request: NextRequest) {
  if (!isNicepayEnabled()) {
    return NextResponse.json(
      { error: "NicePay 결제가 설정되지 않았습니다" },
      { status: 503 }
    );
  }

  const body = await request.json();
  const { tid, orderId, amount } = body;

  // TODO: NicePay 가입 후 구현
  // 1. NicePay 승인 API 호출 (NICEPAY_CONFIG.apiUrl + "/v1/payments/" + tid)
  // 2. 승인 결과 검증 (amount 일치 확인)
  // 3. purchases/counseling_bookings 상태 업데이트
  // 4. 성공 시 결제 완료 페이지로 리다이렉트 URL 반환

  console.log("NicePay approve placeholder:", { tid, orderId, amount });
  console.log("API URL:", NICEPAY_CONFIG.apiUrl);

  return NextResponse.json({
    error: "NicePay 승인 API는 가입 후 활성화됩니다",
  }, { status: 503 });
}
