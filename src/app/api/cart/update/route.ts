import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * PATCH /api/cart/update
 * Body: { product_id: string, quantity: number }
 *
 * quantity > 0: 수량 변경
 * quantity <= 0: 항목 삭제
 */
export async function PATCH(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request, RATE_LIMITS.general);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const productId: unknown = body?.product_id;
    const quantityRaw: unknown = body?.quantity;

    if (typeof productId !== "string" || productId.length === 0) {
      return NextResponse.json(
        { error: "product_id가 필요합니다" },
        { status: 400 }
      );
    }
    if (typeof quantityRaw !== "number" || !Number.isInteger(quantityRaw)) {
      return NextResponse.json(
        { error: "quantity는 정수여야 합니다" },
        { status: 400 }
      );
    }

    if (quantityRaw <= 0) {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);

      if (error) {
        return NextResponse.json(
          { error: "삭제에 실패했어요" },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true, deleted: true });
    }

    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: quantityRaw })
      .eq("user_id", user.id)
      .eq("product_id", productId);

    if (error) {
      console.error("장바구니 수량 변경 실패:", error);
      return NextResponse.json(
        { error: "수량 변경에 실패했어요" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, quantity: quantityRaw });
  } catch (err) {
    console.error("장바구니 수량 변경 오류:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
