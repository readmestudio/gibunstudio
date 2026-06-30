import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isNicepayEnabled } from "@/lib/nicepay/config";
import { approveNicepayPayment } from "@/lib/nicepay/approve";
import { MIND_SPILL_DAILY_SUB_DAYS } from "@/lib/mind-spill/constants";
import { COUNSELING_TYPES, getCounselingType } from "@/lib/counseling/types";

/**
 * POST /api/payment/nicepay/return
 *
 * NicePay Server 승인 모델의 returnUrl 콜백입니다.
 * orderId prefix로 결제 유형 분기:
 *   HM- → husband_match_payments
 *   WB- → workshop_purchases (단일 워크북)
 *   CT- → cart_orders (장바구니 통합 결제, 여러 상품)
 *   MS- → mind_spill_report_purchases (Mind Spill 리포트 1건)
 *   CN- → 상담 결제 (CN-{typeId}-... ; DB 기록 없이 금액 검증 후 승인/캡처)
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
  const isCart = orderId.startsWith("CT-");
  const isMindSpill = orderId.startsWith("MS-");
  const isMindSpillDailySub = orderId.startsWith("MD-");
  const isCounseling = orderId.startsWith("CN-");

  // 1. 인증 실패 시 실패 페이지로 리다이렉트
  if (resultCode !== "0000") {
    console.error("NicePay 인증 실패:", { resultCode, resultMsg, orderId });
    let failUrl: string;
    if (isCart) {
      failUrl = `/cart?error=${encodeURIComponent(resultMsg)}`;
    } else if (isWorkshop) {
      failUrl = `/payment/self-workshop?error=${encodeURIComponent(resultMsg)}`;
    } else if (isMindSpill || isMindSpillDailySub) {
      failUrl = `/dashboard/mind-spill?error=${encodeURIComponent(resultMsg)}`;
    } else if (isCounseling) {
      failUrl = `/programs/counseling?error=${encodeURIComponent(resultMsg)}`;
    } else {
      failUrl = `/husband-match/payment/failed?orderId=${orderId}&message=${encodeURIComponent(resultMsg)}`;
    }
    return NextResponse.redirect(`${baseUrl}${failUrl}`);
  }

  const supabase = await createClient();

  // ── 장바구니 통합 결제 처리 ──
  if (isCart) {
    return handleCartOrder(supabase, { tid, orderId, amount, baseUrl });
  }

  // ── 워크북 결제 처리 ──
  if (isWorkshop) {
    return handleWorkshopPayment(supabase, { tid, orderId, amount, baseUrl });
  }

  // ── 상담 결제 처리 (orderId 의 typeId 로 금액 검증 → 승인/캡처 → DB 기록) ──
  if (isCounseling) {
    return handleCounselingPayment(supabase, { tid, orderId, amount, baseUrl });
  }

  // ── Mind Spill 리포트 결제 처리 ──
  if (isMindSpill) {
    return handleMindSpillReportPayment(supabase, {
      tid,
      orderId,
      amount,
      baseUrl,
    });
  }

  // ── Mind Spill 데일리 구독 결제 처리 ──
  if (isMindSpillDailySub) {
    return handleMindSpillDailySubscription(supabase, {
      tid,
      orderId,
      amount,
      baseUrl,
    });
  }

  // ── 남편상 분석 결제 처리 (기존 로직) ──
  return handleHusbandMatchPayment(supabase, {
    tid,
    orderId,
    amount,
    baseUrl,
  });
}

/* ── Mind Spill Period(3일치 종합) 결제 처리 ── */

async function handleMindSpillReportPayment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: { tid: string; orderId: string; amount: number; baseUrl: string }
) {
  const { tid, orderId, amount, baseUrl } = params;
  const failUrl = `${baseUrl}/dashboard/mind-spill?error=${encodeURIComponent("결제 처리 중 오류가 발생했습니다")}`;

  // period_purchase 조회 — period_report_id로 리다이렉트 경로 결정.
  const { data: purchase, error: queryError } = await supabase
    .from("mind_spill_period_purchases")
    .select("id, user_id, period_report_id, amount, status")
    .eq("order_id", orderId)
    .single();

  if (queryError || !purchase) {
    console.error("Mind Spill period 결제 레코드 조회 실패:", { orderId, queryError });
    return NextResponse.redirect(failUrl);
  }

  // 결제 후 리다이렉트 — period 리포트 페이지에서 LLM 자동 트리거.
  const reportUrl = `${baseUrl}/dashboard/mind-spill/period/${purchase.period_report_id}`;

  // 이미 confirmed → 리포트 페이지로 직행 (멱등성).
  if (purchase.status === "confirmed") {
    return NextResponse.redirect(reportUrl);
  }

  if (purchase.status !== "pending") {
    return NextResponse.redirect(failUrl);
  }

  // 금액 검증.
  if (purchase.amount !== amount) {
    console.error("Mind Spill period 결제 금액 불일치:", {
      dbAmount: purchase.amount,
      nicepayAmount: amount,
      orderId,
    });
    return NextResponse.redirect(failUrl);
  }

  // NicePay 승인.
  const approval = await approveNicepayPayment(tid, amount);
  if (!approval.success) {
    console.error("Mind Spill period NicePay 승인 실패:", {
      resultCode: approval.resultCode,
      resultMsg: approval.resultMsg,
      orderId,
    });
    return NextResponse.redirect(failUrl);
  }

  // pending → confirmed (optimistic concurrency + partial unique index).
  const { error: updateError } = await supabase
    .from("mind_spill_period_purchases")
    .update({
      status: "confirmed",
      payment_key: tid,
      paid_at: new Date().toISOString(),
    })
    .eq("id", purchase.id)
    .eq("status", "pending");

  if (updateError) {
    console.error("Mind Spill period 결제 상태 업데이트 실패:", { updateError, orderId });
    return NextResponse.redirect(failUrl);
  }

  return NextResponse.redirect(reportUrl);
}

/* ── Mind Spill 데일리 구독 결제 처리 ── */

async function handleMindSpillDailySubscription(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: { tid: string; orderId: string; amount: number; baseUrl: string }
) {
  const { tid, orderId, amount, baseUrl } = params;
  const successUrl = `${baseUrl}/dashboard/mind-spill?subscribed=1`;
  const failUrl = `${baseUrl}/dashboard/mind-spill?error=${encodeURIComponent("결제 처리 중 오류가 발생했습니다")}`;

  // pending 구독 레코드 조회.
  const { data: sub, error: queryError } = await supabase
    .from("mind_spill_daily_subscriptions")
    .select("id, user_id, amount, status")
    .eq("order_id", orderId)
    .single();

  if (queryError || !sub) {
    console.error("Mind Spill 데일리 구독 레코드 조회 실패:", { orderId, queryError });
    return NextResponse.redirect(failUrl);
  }

  // 이미 활성화됨 → 멱등성.
  if (sub.status === "active") {
    return NextResponse.redirect(successUrl);
  }
  if (sub.status !== "pending") {
    return NextResponse.redirect(failUrl);
  }

  // 금액 검증.
  if (sub.amount !== amount) {
    console.error("Mind Spill 데일리 구독 결제 금액 불일치:", {
      dbAmount: sub.amount,
      nicepayAmount: amount,
      orderId,
    });
    return NextResponse.redirect(failUrl);
  }

  // NicePay 승인.
  const approval = await approveNicepayPayment(tid, amount);
  if (!approval.success) {
    console.error("Mind Spill 데일리 구독 NicePay 승인 실패:", {
      resultCode: approval.resultCode,
      resultMsg: approval.resultMsg,
      orderId,
    });
    return NextResponse.redirect(failUrl);
  }

  // pending → active. started_at = now, expires_at = now + 31일.
  const now = new Date();
  const expires = new Date(now.getTime() + MIND_SPILL_DAILY_SUB_DAYS * 24 * 60 * 60 * 1000);
  const { error: updateError } = await supabase
    .from("mind_spill_daily_subscriptions")
    .update({
      status: "active",
      started_at: now.toISOString(),
      expires_at: expires.toISOString(),
      payment_key: tid,
      paid_at: now.toISOString(),
    })
    .eq("id", sub.id)
    .eq("status", "pending");

  if (updateError) {
    console.error("Mind Spill 데일리 구독 활성화 실패:", { updateError, orderId });
    return NextResponse.redirect(failUrl);
  }

  return NextResponse.redirect(successUrl);
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
    .select("id, user_id, amount, status, minds_lead_id")
    .eq("order_id", orderId)
    .single();

  if (queryError || !purchase) {
    console.error("워크북 결제 레코드 조회 실패:", { orderId, queryError });
    return NextResponse.redirect(failUrl);
  }

  // 이미 승인됨 → 생성 중 안내로 (워크북은 답변 기반 제작 후 별도 전달)
  if (purchase.status === "confirmed") {
    return NextResponse.redirect(
      `${baseUrl}/dashboard/self-workshop/generating`
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

  // workshop_progress 레코드가 없으면 자동 생성 (step 3부터 시작)
  // minds 를 거쳐온 결제라면 leadId 를 진행으로 복사해, 워크북 단계에서 배역을 잇는다.
  const admin = createAdminClient();
  const { data: existingProgress } = await admin
    .from("workshop_progress")
    .select("id, current_step, minds_lead_id")
    .eq("user_id", purchase.user_id)
    .eq("workshop_type", "achievement-addiction")
    .maybeSingle();

  if (!existingProgress) {
    await admin.from("workshop_progress").insert({
      user_id: purchase.user_id,
      workshop_type: "achievement-addiction",
      current_step: 3,
      status: "in_progress",
      purchase_id: purchase.id,
      minds_lead_id: purchase.minds_lead_id ?? null,
    });
  } else {
    // 진행이 이미 있으면 step 을 앞당기고, 비어 있던 leadId 만 보강한다(덮어쓰지 않음).
    const patch: Record<string, unknown> = {};
    if ((existingProgress.current_step ?? 0) < 3) {
      patch.current_step = 3;
      patch.status = "in_progress";
    }
    if (purchase.minds_lead_id && !existingProgress.minds_lead_id) {
      patch.minds_lead_id = purchase.minds_lead_id;
    }
    if (Object.keys(patch).length > 0) {
      await admin
        .from("workshop_progress")
        .update(patch)
        .eq("id", existingProgress.id);
    }
  }

  // 결제 직후: 워크북은 답변에 맞춰 제작 후 별도 전달 → "생성 중" 안내로 이동
  return NextResponse.redirect(
    `${baseUrl}/dashboard/self-workshop/generating`
  );
}

/* ── 상담 결제 처리 ── */
//
// 상담은 별도 DB 테이블 없이 처리한다(현재 운영은 결제 후 카카오/대시보드로 수동 예약).
// 위변조 방지를 위해 orderId 에 박힌 상담 유형(CN-{typeId}-...)으로 서버에서 정가를
// 다시 조회해 amount 와 대조한 뒤에만 승인(캡처)한다.
async function handleCounselingPayment(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    tid: string;
    orderId: string;
    amount: number;
    baseUrl: string;
  }
) {
  const { tid, orderId, amount, baseUrl } = params;

  // orderId = "CN-{typeId}-{timestamp}-{rand}". typeId 에 하이픈이 있을 수 있어
  // (예: report-interpret) 알려진 유형 목록과 prefix 매칭으로 안전하게 식별한다.
  const matched = COUNSELING_TYPES.find((t) =>
    orderId.startsWith(`CN-${t.id}-`)
  );
  const ct = matched ? getCounselingType(matched.id) : undefined;

  if (!ct) {
    console.error("상담 결제 유형 식별 실패:", { orderId });
    return NextResponse.redirect(
      `${baseUrl}/programs/counseling?error=${encodeURIComponent("결제 정보를 확인할 수 없습니다")}`
    );
  }

  const failUrl = `${baseUrl}/payment/counseling/${ct.id}`;

  // 금액 위변조 검증 — 서버 정가와 다르면 승인하지 않는다.
  if (ct.price !== amount) {
    console.error("상담 결제 금액 불일치:", {
      expected: ct.price,
      nicepayAmount: amount,
      orderId,
    });
    return NextResponse.redirect(
      `${failUrl}?error=${encodeURIComponent("결제 금액이 일치하지 않습니다")}`
    );
  }

  // NicePay 최종 승인(캡처).
  const approval = await approveNicepayPayment(tid, amount);
  if (!approval.success) {
    console.error("상담 NicePay 승인 실패:", {
      resultCode: approval.resultCode,
      resultMsg: approval.resultMsg,
      orderId,
    });
    return NextResponse.redirect(
      `${failUrl}?error=${encodeURIComponent(approval.resultMsg)}`
    );
  }

  // 결제 성공 → 원장 기록. 로그인 사용자면 user_id 도 남긴다(비로그인은 NULL).
  // 기록 실패가 캡처된 결제의 완료 화면을 막지 않도록 try/catch 로 감싼다.
  try {
    let userId: string | null = null;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      // 비로그인/세션 없음 — user_id NULL 로 진행.
    }

    const admin = createAdminClient();
    const { error: insertError } = await admin
      .from("counseling_purchases")
      .upsert(
        {
          order_id: orderId,
          counseling_type: ct.id,
          title: ct.title,
          amount,
          status: "confirmed",
          user_id: userId,
          payment_key: tid,
          paid_at: new Date().toISOString(),
        },
        { onConflict: "order_id" }
      );

    if (insertError) {
      console.error("상담 결제 기록 저장 실패:", { orderId, insertError });
    }
  } catch (e) {
    console.error("상담 결제 기록 저장 예외:", { orderId, error: e });
  }

  // order 를 실어 보내 완료 페이지에서 사전 설문 제출 여부를 분기한다.
  return NextResponse.redirect(
    `${baseUrl}/payment/counseling/complete?order=${encodeURIComponent(orderId)}`
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

/* ── 장바구니 통합결제 처리 ── */

interface CartItemSnapshot {
  product_id: string;
  name: string;
  category: string;
  workshop_type: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

async function handleCartOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: { tid: string; orderId: string; amount: number; baseUrl: string }
) {
  const { tid, orderId, amount, baseUrl } = params;
  const failUrl = `${baseUrl}/cart?error=${encodeURIComponent("결제 처리 중 오류가 발생했습니다")}`;

  const { data: cartOrder, error: queryError } = await supabase
    .from("cart_orders")
    .select("id, user_id, total_amount, items, status")
    .eq("order_id", orderId)
    .single();

  if (queryError || !cartOrder) {
    console.error("cart_orders 조회 실패:", { orderId, queryError });
    return NextResponse.redirect(failUrl);
  }

  // 이미 승인됨 → 완료 페이지
  if (cartOrder.status === "confirmed") {
    return NextResponse.redirect(
      `${baseUrl}/cart/complete/${cartOrder.id}`
    );
  }

  if (cartOrder.status !== "pending") {
    return NextResponse.redirect(failUrl);
  }

  // 금액 검증
  if (cartOrder.total_amount !== amount) {
    console.error("cart_order 금액 불일치:", {
      dbAmount: cartOrder.total_amount,
      nicepayAmount: amount,
      orderId,
    });
    return NextResponse.redirect(failUrl);
  }

  // NicePay 승인 호출
  const approval = await approveNicepayPayment(tid, amount);
  if (!approval.success) {
    console.error("cart_order NicePay 승인 실패:", {
      resultCode: approval.resultCode,
      resultMsg: approval.resultMsg,
      orderId,
    });
    await supabase
      .from("cart_orders")
      .update({ status: "cancelled" })
      .eq("id", cartOrder.id)
      .eq("status", "pending");
    return NextResponse.redirect(failUrl);
  }

  // 멱등성: pending일 때만 confirmed로
  const { error: updateError } = await supabase
    .from("cart_orders")
    .update({
      status: "confirmed",
      payment_key: tid,
      paid_at: new Date().toISOString(),
    })
    .eq("id", cartOrder.id)
    .eq("status", "pending");

  if (updateError) {
    console.error("cart_orders 상태 업데이트 실패:", { updateError, orderId });
    return NextResponse.redirect(failUrl);
  }

  // 각 상품 카테고리별 소유권 부여 (admin client 사용)
  const admin = createAdminClient();
  const items = (cartOrder.items as CartItemSnapshot[]) ?? [];

  for (const item of items) {
    if (item.category === "workbook" && item.workshop_type) {
      // 이미 confirmed 건이 있는지 확인 (멱등성)
      const { data: existingConfirmed } = await admin
        .from("workshop_purchases")
        .select("id")
        .eq("user_id", cartOrder.user_id)
        .eq("workshop_type", item.workshop_type)
        .eq("status", "confirmed")
        .maybeSingle();

      if (existingConfirmed) {
        continue;
      }

      const { data: insertedPurchase, error: insertError } = await admin
        .from("workshop_purchases")
        .insert({
          user_id: cartOrder.user_id,
          workshop_type: item.workshop_type,
          amount: item.subtotal,
          order_id: null,
          cart_order_id: cartOrder.id,
          payment_key: tid,
          status: "confirmed",
          paid_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insertError) {
        console.error("workshop_purchases 생성 실패:", {
          error: insertError,
          item,
        });
        continue;
      }

      // workshop_progress 부트스트랩
      const { data: existingProgress } = await admin
        .from("workshop_progress")
        .select("id, current_step")
        .eq("user_id", cartOrder.user_id)
        .eq("workshop_type", item.workshop_type)
        .maybeSingle();

      if (!existingProgress) {
        await admin.from("workshop_progress").insert({
          user_id: cartOrder.user_id,
          workshop_type: item.workshop_type,
          current_step: 3,
          status: "in_progress",
          purchase_id: insertedPurchase?.id,
        });
      } else if ((existingProgress.current_step ?? 0) < 3) {
        await admin
          .from("workshop_progress")
          .update({ current_step: 3, status: "in_progress" })
          .eq("id", existingProgress.id);
      }
    }
  }

  // 구매 완료된 상품을 장바구니에서 제거
  const purchasedProductIds = items.map((it) => it.product_id);
  if (purchasedProductIds.length > 0) {
    await admin
      .from("cart_items")
      .delete()
      .eq("user_id", cartOrder.user_id)
      .in("product_id", purchasedProductIds);
  }

  return NextResponse.redirect(`${baseUrl}/cart/complete/${cartOrder.id}`);
}
