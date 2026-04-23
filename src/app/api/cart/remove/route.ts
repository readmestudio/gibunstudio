import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * DELETE /api/cart/remove
 * Body: { product_id?: string, cart_item_id?: string }
 *
 * product_id와 cart_item_id 중 하나는 필수.
 */
export async function DELETE(request: NextRequest) {
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
    const cartItemId: unknown = body?.cart_item_id;

    if (typeof productId !== "string" && typeof cartItemId !== "string") {
      return NextResponse.json(
        { error: "product_id 또는 cart_item_id가 필요합니다" },
        { status: 400 }
      );
    }

    let query = supabase.from("cart_items").delete().eq("user_id", user.id);

    if (typeof cartItemId === "string") {
      query = query.eq("id", cartItemId);
    } else if (typeof productId === "string") {
      query = query.eq("product_id", productId);
    }

    const { error } = await query;

    if (error) {
      console.error("장바구니 삭제 실패:", error);
      return NextResponse.json(
        { error: "삭제에 실패했어요" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("장바구니 삭제 오류:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
