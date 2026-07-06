import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCoachEmail } from "@/lib/auth/coach";
import { isAdminEmail } from "@/lib/admin/auth";
import { isNicepayEnabled } from "@/lib/nicepay/config";
import { cancelNicepayPayment } from "@/lib/nicepay/approve";

/**
 * 환불(취소) 가능한 결제 유형 → 테이블 매핑.
 *
 * 모든 테이블이 id / payment_key(NicePay tid) / order_id / status 컬럼을 공유하므로
 * 이 매핑 하나로 분기를 처리한다. (status 는 'refunded' 값을 허용해야 한다.)
 *  - payment_method 컬럼은 남편상(husband_match)에만 존재 → hasPaymentMethod 로 구분.
 *  - 코치가 "타인의" 결제를 환불하는 흐름이라 RLS(본인 것만 조회/수정)를 우회해야 한다.
 *    상단에서 코치 권한을 검증한 뒤 admin(service role) 클라이언트로 조회·수정한다.
 */
const REFUNDABLE_TYPES = {
  husband_match: {
    table: "husband_match_payments",
    label: "남편상 분석",
    hasPaymentMethod: true,
  },
  counseling: {
    table: "counseling_purchases",
    label: "상담",
    hasPaymentMethod: false,
  },
  workshop: {
    table: "workshop_purchases",
    label: "워크북",
    hasPaymentMethod: false,
  },
  minds_relationship: {
    table: "minds_relationship_purchases",
    label: "관계 해설 리포트",
    hasPaymentMethod: false,
  },
} as const;

type RefundType = keyof typeof REFUNDABLE_TYPES;

/**
 * POST /api/payment/nicepay/cancel
 * 결제 취소 (환불) 처리 — 코치만 호출 가능.
 *
 * body: { type?: "husband_match" | "counseling" | "workshop" | "minds_relationship", paymentId, reason }
 *   - type 미지정 시 기존 호환을 위해 "husband_match" 로 간주.
 *   - paymentId 는 각 테이블의 행 id(uuid).
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 환불은 코치뿐 아니라 관리자(ADMIN_EMAILS)도 처리할 수 있어야 한다.
  // (어드민 결제/환불 화면 /admin/payments 이 이 라우트를 호출한다.)
  if (!user || (!isCoachEmail(user.email) && !isAdminEmail(user.email))) {
    return NextResponse.json(
      { error: "코치 또는 관리자 권한이 필요합니다" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { paymentId, reason } = body;
  const type: RefundType = body.type ?? "husband_match";

  if (!paymentId || !reason) {
    return NextResponse.json(
      { error: "paymentId와 reason이 필요합니다" },
      { status: 400 }
    );
  }

  const config = REFUNDABLE_TYPES[type];
  if (!config) {
    return NextResponse.json(
      {
        error: `지원하지 않는 결제 유형입니다 (가능: ${Object.keys(REFUNDABLE_TYPES).join(", ")})`,
      },
      { status: 400 }
    );
  }

  // 코치가 타인의 결제를 다루므로 service role 로 조회·수정한다(권한은 위에서 검증됨).
  const admin = createAdminClient();

  // DB에서 결제 정보 조회 (payment_method 는 남편상에만 존재)
  const columns = config.hasPaymentMethod
    ? "id, payment_key, order_id, payment_method, status"
    : "id, payment_key, order_id, status";

  const { data: payment, error: paymentError } = await admin
    .from(config.table)
    .select(columns)
    .eq("id", paymentId)
    .single<{
      id: string;
      payment_key: string | null;
      order_id: string | null;
      payment_method?: string | null;
      status: string;
    }>();

  if (paymentError || !payment) {
    return NextResponse.json(
      { error: `${config.label} 결제 정보를 찾을 수 없습니다` },
      { status: 404 }
    );
  }

  if (payment.status === "refunded") {
    return NextResponse.json(
      { error: "이미 환불된 결제입니다" },
      { status: 400 }
    );
  }

  if (payment.status !== "confirmed") {
    return NextResponse.json(
      { error: "확인된 결제만 취소할 수 있습니다" },
      { status: 400 }
    );
  }

  // 무통장입금은 수동 환불 안내 (남편상에만 해당)
  if (config.hasPaymentMethod && payment.payment_method === "bank_transfer") {
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

  // 취소 요청의 orderId — 장바구니 경유 워크북은 order_id 가 null 일 수 있어 tid 기반 대체값 사용.
  const cancelOrderId = payment.order_id ?? `RF-${tid}`;
  const result = await cancelNicepayPayment(tid, reason, cancelOrderId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.resultMsg, resultCode: result.resultCode },
      { status: 400 }
    );
  }

  // DB 상태 업데이트
  const { error: updateError } = await admin
    .from(config.table)
    .update({ status: "refunded" })
    .eq("id", paymentId);

  if (updateError) {
    console.error(`${config.label} 환불 상태 업데이트 실패:`, updateError);
    return NextResponse.json(
      { error: "NicePay 취소는 성공했으나 DB 업데이트에 실패했습니다" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `${config.label} 환불이 완료되었습니다`,
  });
}
