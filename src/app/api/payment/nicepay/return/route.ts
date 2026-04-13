import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isNicepayEnabled } from "@/lib/nicepay/config";
import { approveNicepayPayment } from "@/lib/nicepay/approve";

/**
 * POST /api/payment/nicepay/return
 *
 * NicePay Server 승인 모델의 returnUrl 콜백입니다.
 * orderId prefix로 결제 유형 분기:
 *   HM- → husband_match_payments
 *   WB- → workshop_purchases
 */
export async function POST(request: NextRequest) {
  if (!isNicepayEnabled()) {
    return NextResponse.redirect(
      new URL("/payment/failed?message=결제가+설정되지+않았습니다", request.url)
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

  // orderId prefix로 결제 유형 분기
  const isWorkshop = orderId.startsWith("WB-");

  // 1. 인증 실패 시 실패 페이지로 리다이렉트
  if (resultCode !== "0000") {
    console.error("NicePay 인증 실패:", { resultCode, resultMsg, orderId });
    const failUrl = isWorkshop
      ? `/payment/self-workshop?error=${encodeURIComponent(resultMsg)}`
      : `/husband-match/payment/failed?orderId=${orderId}&message=${encodeURIComponent(resultMsg)}`;
    return NextResponse.redirect(`${baseUrl}${failUrl}`);
  }

  const supabase = await createClient();

  // ── 워크북 결제 처리 ──
  if (isWorkshop) {
    return handleWorkshopPayment(supabase, { tid, orderId, amount, baseUrl });
  }

  // ── 남편상 분석 결제 처리 (기존 로직) ──
  return handleHusbandMatchPayment(supabase, {
    tid,
    orderId,
    amount,
    baseUrl,
  });
}

/* ── 워크북 결제 처리 ── */

async function handleWorkshopPayment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: { tid: string; orderId: string; amount: number; baseUrl: string }
) {
  const { tid, orderId, amount, baseUrl } = params;
  const failUrl = `${baseUrl}/payment/self-workshop?error=${encodeURIComponent("결제 처리 중 오류가 발생했습니다")}`;

  // DB에서 결제 레코드 조회
  const { data: purchase, error: queryError } = await supabase
    .from("workshop_purchases")
    .select("id, user_id, amount, status")
    .eq("order_id", orderId)
    .single();

  if (queryError || !purchase) {
    console.error("워크북 결제 레코드 조회 실패:", { orderId, queryError });
    return NextResponse.redirect(failUrl);
  }

  // 이미 승인됨 → 완료 페이지로
  if (purchase.status === "confirmed") {
    return NextResponse.redirect(
      `${baseUrl}/payment/self-workshop/complete/${purchase.id}`
    );
  }

  if (purchase.status !== "pending") {
    return NextResponse.redirect(failUrl);
  }

  // 금액 검증
  if (purchase.amount !== amount) {
    console.error("워크북 결제 금액 불일치:", {
      dbAmount: purchase.amount,
      nicepayAmount: amount,
      orderId,
    });
    return NextResponse.redirect(failUrl);
  }

  // NicePay 승인 호출
  const approval = await approveNicepayPayment(tid, amount);
  if (!approval.success) {
    console.error("워크북 NicePay 승인 실패:", {
      resultCode: approval.resultCode,
      resultMsg: approval.resultMsg,
      orderId,
    });
    return NextResponse.redirect(failUrl);
  }

  // 결제 상태 업데이트
  const { error: updateError } = await supabase
    .from("workshop_purchases")
    .update({
      status: "confirmed",
      payment_key: tid,
      paid_at: new Date().toISOString(),
    })
    .eq("id", purchase.id)
    .eq("status", "pending");

  if (updateError) {
    console.error("워크북 결제 상태 업데이트 실패:", { updateError, orderId });
    return NextResponse.redirect(failUrl);
  }

  // workshop_progress 레코드가 없으면 자동 생성
  const admin = createAdminClient();
  const { data: existingProgress } = await admin
    .from("workshop_progress")
    .select("id")
    .eq("user_id", purchase.user_id)
    .eq("workshop_type", "achievement-addiction")
    .maybeSingle();

  if (!existingProgress) {
    await admin.from("workshop_progress").insert({
      user_id: purchase.user_id,
      workshop_type: "achievement-addiction",
      current_step: 1,
      status: "in_progress",
      purchase_id: purchase.id,
    });
  }

  return NextResponse.redirect(
    `${baseUrl}/payment/self-workshop/complete/${purchase.id}`
  );
}

/* ── 남편상 분석 결제 처리 (기존 로직) ── */

async function handleHusbandMatchPayment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: { tid: string; orderId: string; amount: number; baseUrl: string }
) {
  const { tid, orderId, amount, baseUrl } = params;

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

  if (payment.status === "confirmed") {
    return NextResponse.redirect(
      `${baseUrl}/husband-match/payment/complete/${payment.id}`
    );
  }

  if (payment.status !== "pending") {
    return NextResponse.redirect(
      `${baseUrl}/husband-match/payment/failed?orderId=${orderId}&message=${encodeURIComponent("처리할 수 없는 결제 상태입니다")}`
    );
  }

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

  const { error: updateError } = await supabase
    .from("husband_match_payments")
    .update({
      status: "confirmed",
      payment_key: tid,
      payment_method: "card",
      paid_at: new Date().toISOString(),
    })
    .eq("id", payment.id)
    .eq("status", "pending");

  if (updateError) {
    console.error("결제 상태 업데이트 실패:", { updateError, orderId });
    return NextResponse.redirect(
      `${baseUrl}/husband-match/payment/failed?orderId=${orderId}&message=${encodeURIComponent("결제 처리 중 오류가 발생했습니다")}`
    );
  }

  return NextResponse.redirect(
    `${baseUrl}/husband-match/payment/complete/${payment.id}`
  );
}
