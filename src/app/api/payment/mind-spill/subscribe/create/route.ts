import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createClient } from "@/lib/supabase/server";
import { MIND_SPILL_DAILY_SUB_PRICE } from "@/lib/mind-spill/constants";

/**
 * POST /api/payment/mind-spill/subscribe/create
 *
 * Mind Spill 데일리 구독("오늘 하루 정리하기" 무제한) 결제 레코드 생성.
 * 현재는 일회성 결제로 1개월 이용권을 부여(자동 갱신 빌링키는 후속).
 *
 * 동작:
 *   1. pending 상태의 daily_subscription 생성 (expires_at 은 승인 시 갱신).
 *   2. 응답: { order_id (MD-...), amount }.
 *
 * 승인은 /api/payment/nicepay/return 의 MD- 분기에서 처리.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const orderId = `MD-${Date.now()}-${nanoid(8)}`;

    const { data: sub, error: insertError } = await supabase
      .from("mind_spill_daily_subscriptions")
      .insert({
        user_id: user.id,
        status: "pending",
        order_id: orderId,
        amount: MIND_SPILL_DAILY_SUB_PRICE,
        // 승인 시 now + 31일로 갱신. 미승인 상태에선 사용되지 않음.
        expires_at: new Date().toISOString(),
      })
      .select("id, order_id, amount")
      .single();

    if (insertError || !sub) {
      console.error("[mind-spill subscribe create] insert 실패:", insertError);
      return NextResponse.json(
        { error: "구독 결제 레코드 생성에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription_id: sub.id,
      order_id: sub.order_id,
      amount: sub.amount,
    });
  } catch (err) {
    console.error("[mind-spill subscribe create] 오류:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
