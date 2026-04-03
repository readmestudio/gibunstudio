import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isCoachEmail } from "@/lib/auth/coach";
import { isNicepayEnabled } from "@/lib/nicepay/config";
import { cancelNicepayPayment } from "@/lib/nicepay/approve";

/**
 * POST /api/payment/nicepay/cancel
 * 결제 취소 (환불) 처리
 * 코치만 호출 가능
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

  const body = await request.json();
  const { paymentId, reason } = body;

  if (!paymentId || !reason) {
    return NextResponse.json(
      { error: "paymentId와 reason이 필요합니다" },
      { status: 400 }
    );
  }

  // DB에서 결제 정보 조회
  const { data: payment, error: paymentError } = await supabase
    .from("husband_match_payments")
    .select("id, payment_key, order_id, payment_method, status")
    .eq("id", paymentId)
    .single();

  if (paymentError || !payment) {
    return NextResponse.json(
      { error: "결제 정보를 찾을 수 없습니다" },
      { status: 404 }
    );
  }

  if (payment.status !== "confirmed") {
    return NextResponse.json(
      { error: "확인된 결제만 취소할 수 있습니다" },
      { status: 400 }
    );
  }

  // 무통장입금은 수동 환불 안내
  if (payment.payment_method === "bank_transfer") {
    return NextResponse.json(
      { error: "무통장입금 건은 수동으로 환불해주세요" },
      { status: 400 }
    );
  }

  // NicePay 카드 결제 취소
  if (!isNicepayEnabled()) {
    return NextResponse.json(
      { error: "NicePay 결제가 설정되지 않았습니다" },
      { status: 503 }
    );
  }

  const tid = payment.payment_key;
  if (!tid) {
    return NextResponse.json(
      { error: "결제 TID를 찾을 수 없습니다" },
      { status: 400 }
    );
  }

  const result = await cancelNicepayPayment(tid, reason, payment.order_id);

  if (!result.success) {
    return NextResponse.json(
      { error: result.resultMsg, resultCode: result.resultCode },
      { status: 400 }
    );
  }

  // DB 상태 업데이트
  const { error: updateError } = await supabase
    .from("husband_match_payments")
    .update({ status: "refunded" })
    .eq("id", paymentId);

  if (updateError) {
    console.error("환불 상태 업데이트 실패:", updateError);
    return NextResponse.json(
      { error: "NicePay 취소는 성공했으나 DB 업데이트에 실패했습니다" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, message: "환불이 완료되었습니다" });
}
