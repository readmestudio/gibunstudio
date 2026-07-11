import { after, NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  notifyMindsPurchaseComplete,
  notifyMindsRelationshipPurchase,
  notifyPaymentComplete,
} from "@/lib/minds/notify";
import { isNicepayEnabled } from "@/lib/nicepay/config";
import { approveNicepayPayment } from "@/lib/nicepay/approve";
import { MIND_SPILL_DAILY_SUB_DAYS } from "@/lib/mind-spill/constants";
import { COUNSELING_TYPES, getCounselingType } from "@/lib/counseling/types";
import { WORKSHOP_PRICE } from "@/lib/minds/relationship-constants";
import { isReportPrice } from "@/lib/minds/price-experiment";
import {
  sendPaidReportAlimtalk,
  sendWorkshopIntakeAlimtalk,
} from "@/lib/solapi/messages";
import { createSession } from "@/lib/intake/store";
import { sendMetaPurchaseEvent } from "@/lib/meta-capi";

/**
 * 결제 후 페이지로 보내는 리다이렉트는 반드시 303(See Other)을 쓴다.
 *
 * NicePay 결제창은 returnUrl 로 **POST** 한다. 기본 NextResponse.redirect 는 307이라
 * HTTP 메서드를 보존 → 브라우저가 목적지 페이지(예: /minds)로 다시 POST 하고, 페이지는
 * GET 만 받으므로 405(Method Not Allowed)가 난다. 303은 브라우저가 GET 으로 전환해
 * 따라가게 하여(Post/Redirect/Get) 정상적으로 페이지를 연다.
 */
function seeOther(url: string | URL) {
  return NextResponse.redirect(url, 303);
}

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
 *   MR- → minds_relationship_purchases (/minds 다섯 배역+관계 해설 리포트, 비로그인 리드 기반)
 *   IW- → workshop_intake_purchases (내면 아이 찾기 워크샵 ₩99,000, 로그인 필수 → intake 토큰 발급)
 */
export async function POST(request: NextRequest) {
  if (!isNicepayEnabled()) {
    return seeOther(
      new URL("/payment/failed?message=결제가+설정되지+않았습니다", request.url)
    );
  }

  let resultCode: string;
  let resultMsg: string;
  let tid: string;
  let orderId: string;
  let amount: number;

  // NicePay는 form-encoded 또는 JSON으로 POST할 수 있음.
  // NicePay V2 결제창 콜백은 인증 결과를 authResultCode/authResultMsg 로 보낸다.
  // (구버전/일부 흐름은 resultCode 로 보낼 수 있어 폴백으로 함께 읽는다.)
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData();
    resultCode =
      (formData.get("authResultCode") as string) ||
      (formData.get("resultCode") as string) ||
      "";
    resultMsg =
      (formData.get("authResultMsg") as string) ||
      (formData.get("resultMsg") as string) ||
      "";
    tid = (formData.get("tid") as string) || "";
    orderId = (formData.get("orderId") as string) || "";
    amount = Number(formData.get("amount")) || 0;
  } else {
    const body = await request.json();
    resultCode = body.authResultCode || body.resultCode || "";
    resultMsg = body.authResultMsg || body.resultMsg || "";
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
  const isMindsRelationship = orderId.startsWith("MR-");
  // 내면 아이 리포트 결제 — MR- 와 같은 테이블·핸들러를 쓰되 리다이렉트 경로만 갈라진다.
  const isInnerChild = orderId.startsWith("IC-");
  // 내면 아이 찾기 워크샵 결제 — 로그인 필수 직접 구매, 승인 후 intake 진단 토큰 발급.
  const isWorkshopIntake = orderId.startsWith("IW-");

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
    } else if (isMindsRelationship) {
      failUrl = `/minds?error=${encodeURIComponent(resultMsg)}`;
    } else if (isInnerChild) {
      failUrl = `/inner-child?error=${encodeURIComponent(resultMsg)}`;
    } else if (isWorkshopIntake) {
      failUrl = `/inner-child/workshop?error=${encodeURIComponent(resultMsg)}`;
    } else {
      failUrl = `/husband-match/payment/failed?orderId=${orderId}&message=${encodeURIComponent(resultMsg)}`;
    }
    return seeOther(`${baseUrl}${failUrl}`);
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

  // ── /minds 관계 해설 리포트 결제 처리 (MR-) ──
  if (isMindsRelationship) {
    return handleMindsRelationshipPayment({ tid, orderId, amount, baseUrl });
  }

  // ── /inner-child 내면 아이 리포트 결제 처리 (IC-) ──
  // 같은 핸들러·테이블·금액검증·승인·알림을 공유하되 리다이렉트 경로만 갈라진다.
  if (isInnerChild) {
    return handleMindsRelationshipPayment({
      tid,
      orderId,
      amount,
      baseUrl,
      reportBase: "/inner-child/full",
      failBase: "/inner-child",
      variant: "inner_child",
    });
  }

  // ── 내면 아이 찾기 워크샵 결제 처리 (IW-) ──
  if (isWorkshopIntake) {
    return handleWorkshopIntakePayment({ tid, orderId, amount, baseUrl });
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

/* ── /minds 관계 해설 리포트 결제 처리 (MR-) ── */
//
// 비로그인 리드 기반(minds_relationship_purchases, RLS admin-only)이라 admin 클라이언트로
// 조회/갱신한다. orderId 로 pending 레코드를 찾아 금액(서버 상수)을 검증하고, NicePay 승인 후
// confirmed 로 전환한 다음 리포트 페이지로 보낸다(그 페이지에서 LLM 생성·캐시).
async function handleMindsRelationshipPayment(params: {
  tid: string;
  orderId: string;
  amount: number;
  baseUrl: string;
  // 유료 리포트 페이지 베이스 — MR- 는 기본값(/minds/relationship)으로 현행과 동일.
  // IC- 는 /inner-child/full 로 호출된다. 알림톡 리포트 링크도 이 경로를 따른다.
  reportBase?: string;
  // 실패 리다이렉트 베이스 — MR- 는 /minds, IC- 는 /inner-child.
  failBase?: string;
  // 슬랙 결제완료 알림 라벨용 퍼널 변형 — MR- 는 기본 minds, IC- 는 inner_child.
  variant?: "minds" | "inner_child";
}) {
  const {
    tid,
    orderId,
    amount,
    baseUrl,
    reportBase = "/minds/relationship",
    failBase = "/minds",
    variant = "minds",
  } = params;
  const admin = createAdminClient();
  // [임시 진단] 운영 로그 접근이 어려워, 어느 단계에서 왜 실패했는지 URL error 파라미터로
  // 노출한다. 원인 확인 후 다시 일반 메시지로 되돌릴 것.
  const fail = (step: string, detail = "") =>
    seeOther(`${baseUrl}${failBase}?error=${encodeURIComponent(`[${step}] ${detail}`.trim())}`);

  const { data: purchase, error: queryError } = await admin
    .from("minds_relationship_purchases")
    .select("id, lead_id, amount, status, phone, user_id")
    .eq("order_id", orderId)
    .single();

  if (queryError || !purchase) {
    console.error("[minds-relationship] 결제 레코드 조회 실패:", { orderId, queryError });
    return fail("record", queryError?.message ?? "no purchase");
  }

  // Step 4 대기: IC- 의 경우 /inner-child/full/[id] 페이지는 아직 미구현이다.
  // 실결제가 완료되면 이 URL 로 리다이렉트되며, Step 4 에서 페이지가 생기기 전까지는 404 다(의도된 갭).
  const reportUrl = `${baseUrl}${reportBase}/${purchase.id}`;

  // 이미 승인됨 → 리포트로 직행(멱등성).
  if (purchase.status === "confirmed") {
    return seeOther(reportUrl);
  }
  if (purchase.status !== "pending") {
    return fail("status", String(purchase.status));
  }

  // 금액 검증 — minds(MR-)·inner-child(IC-) 모두 가격 A/B 실험 중(₩9,900/₩19,900).
  // create 가 leadId 로 확정해 저장한 purchase.amount 와 NicePay 금액이 일치하고(위변조
  // 방지), 그 금액이 유효한 리포트 판매가여야 한다. amount 자체가 variant 를 인코딩하므로
  // 별도 컬럼 없이 검증한다(무마이그레이션). 실험이전 minds 금액(₩19,900)도 그대로 통과.
  if (purchase.amount !== amount || !isReportPrice(amount)) {
    console.error("[minds-relationship] 결제 금액 불일치:", {
      dbAmount: purchase.amount,
      nicepayAmount: amount,
      orderId,
    });
    return fail("amount", `db=${purchase.amount} np=${amount}`);
  }

  // NicePay 최종 승인(캡처).
  const approval = await approveNicepayPayment(tid, amount);
  if (!approval.success) {
    console.error("[minds-relationship] NicePay 승인 실패:", {
      resultCode: approval.resultCode,
      resultMsg: approval.resultMsg,
      orderId,
    });
    return fail("approve", `${approval.resultCode} ${approval.resultMsg}`);
  }

  // pending → confirmed (멱등성: pending 일 때만 전환).
  const { error: updateError } = await admin
    .from("minds_relationship_purchases")
    .update({
      status: "confirmed",
      payment_key: tid,
      paid_at: new Date().toISOString(),
    })
    .eq("id", purchase.id)
    .eq("status", "pending");

  if (updateError) {
    console.error("[minds-relationship] 결제 상태 업데이트 실패:", { updateError, orderId });
    return fail("update", updateError.message);
  }

  // 운영자 슬랙 알림 — 실제 구매 완료 시점(fire-and-forget). 리포트 링크를 함께 남겨,
  // 생성 대기 중 이탈한 유저가 문의해 오면 운영자가 슬랙에서 찾아 전달할 수 있게 한다.
  after(() =>
    notifyMindsRelationshipPurchase({
      amount,
      orderId,
      mindsLeadId: purchase.lead_id ?? null,
      reportUrl,
      variant,
    })
  );

  // 구매자에게 '결제(제작) 완료' 카카오 알림톡 발송(fire-and-forget). 수신번호는 결제 시
  // 입력받은 purchase.phone 을 우선 쓰고, 없으면 로그인 계정의 profiles.phone 으로 대체한다.
  after(async () => {
    let phone = (purchase.phone ?? "").trim();
    let name: string | null = null;
    if (purchase.user_id) {
      const { data: prof } = await admin
        .from("profiles")
        .select("phone, name")
        .eq("id", purchase.user_id)
        .maybeSingle();
      if (!phone) phone = (prof?.phone ?? "").trim();
      name = prof?.name ?? null;
    }
    if (!phone) return; // 번호가 없으면 발송 불가(조용히 스킵).
    const res = await sendPaidReportAlimtalk({ phone, reportCode: purchase.id, reportUrl, name });
    if (!res.success) {
      console.error("[minds-relationship] 결제완료 알림톡 실패:", res.reason);
    }
  });

  // Meta CAPI 로 Purchase 전환 전송(fire-and-forget) — 브라우저 픽셀이 유실돼도 확실히 도달.
  // event_id 를 결제 id 로 넘겨 브라우저 픽셀과 중복 제거(dedup)한다.
  after(async () => {
    const res = await sendMetaPurchaseEvent({
      eventId: purchase.id,
      value: amount,
      contentName: variant === "inner_child" ? "inner_child_full" : "minds_relationship",
      eventSourceUrl: reportUrl,
      externalIdSource: purchase.user_id ?? purchase.id,
      phone: purchase.phone,
    });
    if (!res.success && res.reason !== "no-token") {
      console.error("[minds-relationship] CAPI Purchase 실패:", res.reason);
    }
  });

  // 리포트 페이지로 — 거기서 report_json 이 없으면 LLM 생성·캐시 후 렌더.
  // (Purchase 픽셀 발화는 페이지가 paid_at 기준으로 서버에서 판단한다 — 과거 `?purchased=1`
  //  쿼리 마커는 로그인/소유권 리다이렉트에서 유실돼 폐기했다.)
  return seeOther(reportUrl);
}

/* ── 내면 아이 찾기 워크샵 결제 처리 (IW-) ── */
//
// 로그인 필수 직접 구매(₩99,000, workshop_intake_purchases). 승인이 확정되면 상담사용
// 사전진단(intake) 세션을 발급하고, 진단 링크를 알림톡 + 완료 페이지 두 경로로 전달한다.
// 테이블이 RLS admin-only 라 admin 클라이언트로 조회/갱신하고, 금액은 서버 상수
// (WORKSHOP_PRICE)로 검증한다.
async function handleWorkshopIntakePayment(params: {
  tid: string;
  orderId: string;
  amount: number;
  baseUrl: string;
}) {
  const { tid, orderId, amount, baseUrl } = params;
  const admin = createAdminClient();
  // [임시 진단] handleMindsRelationshipPayment 와 동일 — 어느 단계에서 왜 실패했는지
  // URL error 파라미터로 노출한다. 원인 확인 후 다시 일반 메시지로 되돌릴 것.
  const fail = (step: string, detail = "") =>
    seeOther(
      `${baseUrl}/inner-child/workshop?error=${encodeURIComponent(`[${step}] ${detail}`.trim())}`
    );

  const { data: purchase, error: queryError } = await admin
    .from("workshop_intake_purchases")
    .select("id, user_id, name, phone, email, amount, status, intake_token")
    .eq("order_id", orderId)
    .single();

  if (queryError || !purchase) {
    console.error("[workshop-intake] 결제 레코드 조회 실패:", { orderId, queryError });
    return fail("record", queryError?.message ?? "no purchase");
  }

  const doneUrl = `${baseUrl}/inner-child/workshop/done?p=${purchase.id}`;

  // 이미 승인됨 → 완료 페이지로 직행(멱등성 — intake_token 이 이미 있으면 거기서 보여준다).
  if (purchase.status === "confirmed") {
    return seeOther(doneUrl);
  }
  if (purchase.status !== "pending") {
    return fail("status", String(purchase.status));
  }

  // 금액 검증 — DB 금액·NicePay 금액·서버 상수가 모두 일치해야 한다(위변조 방지).
  if (purchase.amount !== amount || amount !== WORKSHOP_PRICE) {
    console.error("[workshop-intake] 결제 금액 불일치:", {
      dbAmount: purchase.amount,
      nicepayAmount: amount,
      expected: WORKSHOP_PRICE,
      orderId,
    });
    return fail("amount", `db=${purchase.amount} np=${amount} expect=${WORKSHOP_PRICE}`);
  }

  // NicePay 최종 승인(캡처).
  const approval = await approveNicepayPayment(tid, amount);
  if (!approval.success) {
    console.error("[workshop-intake] NicePay 승인 실패:", {
      resultCode: approval.resultCode,
      resultMsg: approval.resultMsg,
      orderId,
    });
    return fail("approve", `${approval.resultCode} ${approval.resultMsg}`);
  }

  // 사전진단(intake) 세션 발급 — 토큰이 곧 진단 링크의 인증이다.
  let session: Awaited<ReturnType<typeof createSession>>;
  try {
    session = await createSession({
      display_name: purchase.name?.trim() || "워크샵 참가자",
      memo: `워크샵 결제 ${orderId}`,
    });
  } catch (e) {
    console.error("[workshop-intake] intake 세션 발급 실패:", { orderId, error: e });
    return fail("intake", e instanceof Error ? e.message : "session");
  }

  // pending → confirmed + 발급된 세션 연결 (멱등성: pending 일 때만 전환).
  const { error: updateError } = await admin
    .from("workshop_intake_purchases")
    .update({
      status: "confirmed",
      tid,
      confirmed_at: new Date().toISOString(),
      intake_session_id: session.id,
      intake_token: session.token,
    })
    .eq("id", purchase.id)
    .eq("status", "pending");

  if (updateError) {
    // 세션은 이미 발급됐지만 결제 레코드 연결에 실패 — 로그를 남기고 실패 처리한다
    // (세션 자체는 어드민에서 확인 가능하므로 수동 복구 가능).
    console.error("[workshop-intake] 결제 상태 업데이트 실패:", {
      updateError,
      orderId,
      intakeSessionId: session.id,
    });
    return fail("update", updateError.message);
  }

  // 운영자 슬랙 알림 — 실제 구매 완료 시점(fire-and-forget).
  after(() =>
    notifyPaymentComplete({
      product: "내면 아이 찾기 워크샵",
      amount,
      orderId,
      userId: purchase.user_id,
    })
  );

  // 구매자에게 사전진단 링크 카카오 알림톡 발송(fire-and-forget).
  // 번호는 결제 생성 시 검증해 저장한 purchase.phone 을 쓴다(없으면 조용히 스킵).
  after(async () => {
    const phone = (purchase.phone ?? "").trim();
    if (!phone) return;
    const res = await sendWorkshopIntakeAlimtalk({
      phone,
      name: purchase.name,
      // 솔라피 템플릿 버튼 URL 이 `.../intake/#{진단토큰}` 이라 토큰만 넘긴다(도메인은 템플릿 고정).
      intakeToken: session.token,
    });
    if (!res.success) {
      console.error("[workshop-intake] 알림톡 실패:", res.reason);
    }
  });

  // Meta CAPI 로 Purchase 전환 전송(fire-and-forget) — 브라우저 픽셀과 event_id(결제 id)로 dedup.
  after(async () => {
    const res = await sendMetaPurchaseEvent({
      eventId: purchase.id,
      value: amount,
      contentName: "inner_child_workshop",
      eventSourceUrl: doneUrl,
      externalIdSource: purchase.user_id ?? purchase.id,
      phone: purchase.phone,
      email: purchase.email,
    });
    if (!res.success && res.reason !== "no-token") {
      console.error("[workshop-intake] CAPI Purchase 실패:", res.reason);
    }
  });

  // 완료 페이지로 — 거기서 사전진단 시작 버튼(/intake/{token})을 보여준다.
  return seeOther(doneUrl);
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
    return seeOther(failUrl);
  }

  // 결제 후 리다이렉트 — period 리포트 페이지에서 LLM 자동 트리거.
  const reportUrl = `${baseUrl}/dashboard/mind-spill/period/${purchase.period_report_id}`;

  // 이미 confirmed → 리포트 페이지로 직행 (멱등성).
  if (purchase.status === "confirmed") {
    return seeOther(reportUrl);
  }

  if (purchase.status !== "pending") {
    return seeOther(failUrl);
  }

  // 금액 검증.
  if (purchase.amount !== amount) {
    console.error("Mind Spill period 결제 금액 불일치:", {
      dbAmount: purchase.amount,
      nicepayAmount: amount,
      orderId,
    });
    return seeOther(failUrl);
  }

  // NicePay 승인.
  const approval = await approveNicepayPayment(tid, amount);
  if (!approval.success) {
    console.error("Mind Spill period NicePay 승인 실패:", {
      resultCode: approval.resultCode,
      resultMsg: approval.resultMsg,
      orderId,
    });
    return seeOther(failUrl);
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
    return seeOther(failUrl);
  }

  // 운영자 슬랙 알림 — 결제 완료(fire-and-forget).
  after(() =>
    notifyPaymentComplete({
      product: "마음 정리 리포트",
      amount,
      orderId,
      userId: purchase.user_id,
    })
  );

  return seeOther(reportUrl);
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
    return seeOther(failUrl);
  }

  // 이미 활성화됨 → 멱등성.
  if (sub.status === "active") {
    return seeOther(successUrl);
  }
  if (sub.status !== "pending") {
    return seeOther(failUrl);
  }

  // 금액 검증.
  if (sub.amount !== amount) {
    console.error("Mind Spill 데일리 구독 결제 금액 불일치:", {
      dbAmount: sub.amount,
      nicepayAmount: amount,
      orderId,
    });
    return seeOther(failUrl);
  }

  // NicePay 승인.
  const approval = await approveNicepayPayment(tid, amount);
  if (!approval.success) {
    console.error("Mind Spill 데일리 구독 NicePay 승인 실패:", {
      resultCode: approval.resultCode,
      resultMsg: approval.resultMsg,
      orderId,
    });
    return seeOther(failUrl);
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
    return seeOther(failUrl);
  }

  // 운영자 슬랙 알림 — 이용권 결제 완료(fire-and-forget).
  after(() =>
    notifyPaymentComplete({
      product: `마음 정리 데일리 이용권 (${MIND_SPILL_DAILY_SUB_DAYS}일)`,
      amount,
      orderId,
      userId: sub.user_id,
    })
  );

  return seeOther(successUrl);
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
    return seeOther(failUrl);
  }

  // 이미 승인됨 → 생성 중 안내로 (워크북은 답변 기반 제작 후 별도 전달)
  if (purchase.status === "confirmed") {
    return seeOther(
      `${baseUrl}/dashboard/self-workshop/generating`
    );
  }

  if (purchase.status !== "pending") {
    return seeOther(failUrl);
  }

  // 금액 검증
  if (purchase.amount !== amount) {
    console.error("워크북 결제 금액 불일치:", {
      dbAmount: purchase.amount,
      nicepayAmount: amount,
      orderId,
    });
    return seeOther(failUrl);
  }

  // NicePay 승인 호출
  const approval = await approveNicepayPayment(tid, amount);
  if (!approval.success) {
    console.error("워크북 NicePay 승인 실패:", {
      resultCode: approval.resultCode,
      resultMsg: approval.resultMsg,
      orderId,
    });
    return seeOther(failUrl);
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
    return seeOther(failUrl);
  }

  // ⑤ 운영자 슬랙 알림 — 승인/캡처 성공 후 confirmed 전환에 성공한 시점(실제 구매 완료).
  // minds 를 거쳐온 결제면 리드 정보도 함께 표기(fire-and-forget).
  after(() =>
    notifyMindsPurchaseComplete({
      amount,
      orderId,
      mindsLeadId: purchase.minds_lead_id ?? null,
    })
  );

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
  return seeOther(
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
    return seeOther(
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
    return seeOther(
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
    return seeOther(
      `${failUrl}?error=${encodeURIComponent(approval.resultMsg)}`
    );
  }

  // 결제 성공 → 원장 기록. 로그인 사용자면 user_id 도 남긴다(비로그인은 NULL).
  // 기록 실패가 캡처된 결제의 완료 화면을 막지 않도록 try/catch 로 감싼다.
  // userId 는 슬랙 알림에서도 쓰므로 try 밖에 선언한다.
  let userId: string | null = null;
  try {
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

  // 운영자 슬랙 알림 — 상담 결제 완료(fire-and-forget). 상담 유형명을 상품명으로.
  after(() =>
    notifyPaymentComplete({
      product: `상담 예약 · ${ct.title}`,
      amount,
      orderId,
      userId,
    })
  );

  // order 를 실어 보내 완료 페이지에서 사전 설문 제출 여부를 분기한다.
  return seeOther(
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
    return seeOther(
      `${baseUrl}/husband-match/payment/failed?orderId=${orderId}&message=${encodeURIComponent("결제 정보를 찾을 수 없습니다")}`
    );
  }

  if (payment.status === "confirmed") {
    return seeOther(
      `${baseUrl}/husband-match/payment/complete/${payment.id}`
    );
  }

  if (payment.status !== "pending") {
    return seeOther(
      `${baseUrl}/husband-match/payment/failed?orderId=${orderId}&message=${encodeURIComponent("처리할 수 없는 결제 상태입니다")}`
    );
  }

  if (payment.amount !== amount) {
    console.error("금액 불일치:", {
      dbAmount: payment.amount,
      nicepayAmount: amount,
      orderId,
    });
    return seeOther(
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
    return seeOther(
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
    return seeOther(
      `${baseUrl}/husband-match/payment/failed?orderId=${orderId}&message=${encodeURIComponent("결제 처리 중 오류가 발생했습니다")}`
    );
  }

  // 운영자 슬랙 알림 — 남편상 분석 결제 완료(fire-and-forget).
  after(() =>
    notifyPaymentComplete({
      product: "남편상 분석",
      amount,
      orderId,
    })
  );

  return seeOther(
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
    return seeOther(failUrl);
  }

  // 이미 승인됨 → 완료 페이지
  if (cartOrder.status === "confirmed") {
    return seeOther(
      `${baseUrl}/cart/complete/${cartOrder.id}`
    );
  }

  if (cartOrder.status !== "pending") {
    return seeOther(failUrl);
  }

  // 금액 검증
  if (cartOrder.total_amount !== amount) {
    console.error("cart_order 금액 불일치:", {
      dbAmount: cartOrder.total_amount,
      nicepayAmount: amount,
      orderId,
    });
    return seeOther(failUrl);
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
    return seeOther(failUrl);
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
    return seeOther(failUrl);
  }

  // 각 상품 카테고리별 소유권 부여 (admin client 사용)
  const admin = createAdminClient();
  const items = (cartOrder.items as CartItemSnapshot[]) ?? [];

  // 운영자 슬랙 알림 — 통합결제 완료(fire-and-forget). 담긴 품목명을 상세로.
  const itemNames = items.map((it) => it.name).filter(Boolean).join(", ");
  after(() =>
    notifyPaymentComplete({
      product: "통합결제(장바구니)",
      amount,
      orderId,
      userId: cartOrder.user_id,
      detail: itemNames ? `🛒 ${itemNames}` : undefined,
    })
  );

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

  return seeOther(`${baseUrl}/cart/complete/${cartOrder.id}`);
}
