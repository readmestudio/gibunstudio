import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  WORKSHOP_PRICE,
  WORKSHOP_ORDER_PREFIX,
} from "@/lib/minds/relationship-constants";

/**
 * POST /api/payment/workshop-intake/create  (로그인 필수)
 *
 * "내면 아이 찾기 워크샵"(₩99,000) 결제 레코드(pending)를 만들고 NicePay 에 넘길
 * order_id 를 반환한다. 리포트 결제(MR-/IC-)와 달리 무료 테스트·leadId 가 없는
 * 직접 구매 상품이라 **로그인을 강제**한다(구매·intake 토큰을 계정에 귀속).
 *
 * 흐름: 여기서 pending 생성(IW- prefix) → NicePay 결제창 → return 라우트가 승인 후
 * intake 진단 세션(토큰)을 발급해 완료 페이지+알림톡으로 전달한다.
 *
 * 금액은 서버 상수(WORKSHOP_PRICE)로 고정해 위변조를 막는다(클라이언트가 보낸
 * 금액은 신뢰하지 않음). 휴대폰 번호는 진단 링크 알림톡 발송에 필수라 검증한다.
 *
 * Body: { phone: string, name?: string, email?: string }
 * Resp:
 *   { success: true, order_id, amount, purchase_id }        — pending 생성됨, 결제창 진행
 *   { already_purchased: true, purchase_id, intake_token }  — 이미 결제 완료(1인 1회 → 진단으로)
 *   { error, needLogin? }                                    — 실패 (401 이면 로그인 필요)
 */
export async function POST(request: NextRequest) {
  const limited = checkRateLimit(request, RATE_LIMITS.general);
  if (limited) return limited;

  try {
    const body = await request.json().catch(() => ({}));
    const rawPhone = typeof body?.phone === "string" ? body.phone : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim() : "";

    // 로그인 필수 — 워크샵 구매·intake 토큰은 계정에 귀속된다(익명 결제 없음).
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다.", needLogin: true },
        { status: 401 }
      );
    }

    // 휴대폰 검증 — 진단 링크 알림톡 발송에 필요하다. 숫자만 남겨 KR 휴대폰 형식 확인.
    const phone = rawPhone.replace(/\D/g, "");
    if (!/^01\d{8,9}$/.test(phone)) {
      return NextResponse.json(
        { error: "휴대폰 번호를 확인해주세요." },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 멱등성 — 이미 결제 완료된 계정이면 새 결제를 막고 진단으로 보낸다(1인 1회 정책).
    const { data: confirmed } = await admin
      .from("workshop_intake_purchases")
      .select("id, intake_token")
      .eq("user_id", user.id)
      .eq("status", "confirmed")
      .maybeSingle();
    if (confirmed) {
      return NextResponse.json({
        already_purchased: true,
        purchase_id: confirmed.id,
        intake_token: confirmed.intake_token,
      });
    }

    // pending 결제 레코드 생성. 금액은 서버 상수로 고정(위변조 방지).
    // orderId prefix(IW-)로 결제 유형을 영속화한다(return 라우트가 prefix 로 분기).
    const orderId = `${WORKSHOP_ORDER_PREFIX}${Date.now()}-${nanoid(8)}`;
    const { data: purchase, error: purchaseError } = await admin
      .from("workshop_intake_purchases")
      .insert({
        user_id: user.id,
        name: name || null,
        phone,
        email: email || null,
        amount: WORKSHOP_PRICE,
        order_id: orderId,
        status: "pending",
      })
      .select("id, order_id, amount")
      .single();

    if (purchaseError || !purchase) {
      console.error(
        "[workshop-intake/create] 결제 레코드 생성 실패:",
        purchaseError
      );
      return NextResponse.json(
        { error: "결제 레코드 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order_id: purchase.order_id,
      amount: purchase.amount,
      purchase_id: purchase.id,
    });
  } catch (err) {
    console.error("[workshop-intake/create] 오류:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
