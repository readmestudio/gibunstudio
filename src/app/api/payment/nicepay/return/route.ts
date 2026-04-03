import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isNicepayEnabled } from "@/lib/nicepay/config";
import { approveNicepayPayment } from "@/lib/nicepay/approve";

/**
 * POST /api/payment/nicepay/return
 *
 * NicePay Server 승인 모델의 returnUrl 콜백입니다.
 * 고객이 결제창에서 인증을 완료하면 NicePay가 이 URL로 POST합니다.
 *
 * 흐름:
 * 1. NicePay에서 받은 resultCode 확인
 * 2. orderId로 DB에서 결제 레코드 조회
 * 3. 금액 위변조 검증
 * 4. 승인 API 호출 (tid + amount)
 * 5. DB 업데이트 (status → confirmed, payment_key → tid)
 * 6. 사용자를 결과 페이지로 리다이렉트
 */
export async function POST(request: NextRequest) {
  if (!isNicepayEnabled()) {
    return NextResponse.redirect(
      new URL("/husband-match/payment/failed?message=결제가+설정되지+않았습니다", request.url)
    );
  }

  let resultCode: string;
  let resultMsg: string;
  let tid: string;
  let orderId: string;
  let amount: number;

  // NicePay는 form-encoded 또는 JSON으로 POST할 수 있음
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData();
    resultCode = (formData.get("resultCode") as string) || "";
    resultMsg = (formData.get("resultMsg") as string) || "";
    tid = (formData.get("tid") as string) || "";
    orderId = (formData.get("orderId") as string) || "";
    amount = Number(formData.get("amount")) || 0;
  } else {
    const body = await request.json();
    resultCode = body.resultCode || "";
    resultMsg = body.resultMsg || "";
    tid = body.tid || "";
    orderId = body.orderId || "";
    amount = Number(body.amount) || 0;
  }

  const baseUrl = new URL(request.url).origin;

  // 1. 인증 실패 시 실패 페이지로 리다이렉트
  if (resultCode !== "0000") {
    console.error("NicePay 인증 실패:", { resultCode, resultMsg, orderId });
    return NextResponse.redirect(
      `${baseUrl}/husband-match/payment/failed?orderId=${orderId}&message=${encodeURIComponent(resultMsg)}`
    );
  }

  // 2. DB에서 결제 레코드 조회
  const supabase = await createClient();
  const { data: payment, error: paymentError } = await supabase
    .from("husband_match_payments")
    .select("id, phase1_id, amount, status")
    .eq("order_id", orderId)
    .single();

  if (paymentError || !payment) {
    console.error("결제 레코드 조회 실패:", { orderId, paymentError });
    return NextResponse.redirect(
      `${baseUrl}/husband-match/payment/failed?orderId=${orderId}&message=${encodeURIComponent("결제 정보를 찾을 수 없습니다")}`
    );
  }

  // 이미 승인된 결제는 성공 페이지로 바로 이동 (중복 처리 방지)
  if (payment.status === "confirmed") {
    return NextResponse.redirect(
      `${baseUrl}/husband-match/payment/complete/${payment.id}`
    );
  }

  // pending 상태가 아니면 처리 불가
  if (payment.status !== "pending") {
    return NextResponse.redirect(
      `${baseUrl}/husband-match/payment/failed?orderId=${orderId}&message=${encodeURIComponent("처리할 수 없는 결제 상태입니다")}`
    );
  }

  // 3. 금액 위변조 검증
  if (payment.amount !== amount) {
    console.error("금액 불일치:", {
      dbAmount: payment.amount,
      nicepayAmount: amount,
      orderId,
    });
    return NextResponse.redirect(
      `${baseUrl}/husband-match/payment/failed?orderId=${orderId}&message=${encodeURIComponent("결제 금액이 일치하지 않습니다")}`
    );
  }

  // 4. NicePay 승인 API 호출
  const approval = await approveNicepayPayment(tid, amount);

  if (!approval.success) {
    console.error("NicePay 승인 실패:", {
      resultCode: approval.resultCode,
      resultMsg: approval.resultMsg,
      orderId,
    });
    return NextResponse.redirect(
      `${baseUrl}/husband-match/payment/failed?orderId=${orderId}&message=${encodeURIComponent(approval.resultMsg)}`
    );
  }

  // 5. DB 업데이트 — confirmed + tid 저장
  const { error: updateError } = await supabase
    .from("husband_match_payments")
    .update({
      status: "confirmed",
      payment_key: tid,
      payment_method: "card",
      paid_at: new Date().toISOString(),
    })
    .eq("id", payment.id)
    .eq("status", "pending"); // 낙관적 잠금: pending인 경우만 업데이트

  if (updateError) {
    console.error("결제 상태 업데이트 실패:", { updateError, orderId });
    return NextResponse.redirect(
      `${baseUrl}/husband-match/payment/failed?orderId=${orderId}&message=${encodeURIComponent("결제 처리 중 오류가 발생했습니다")}`
    );
  }

  // 6. 성공 페이지로 리다이렉트
  return NextResponse.redirect(
    `${baseUrl}/husband-match/payment/complete/${payment.id}`
  );
}
