import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * POST /api/cart/add
 * Body: { product_id: string, quantity?: number }
 *
 * - 비로그인: 401
 * - 존재하지 않거나 비활성 상품: 400
 * - Phase 2 리포트처럼 장바구니 불가 상품: 400
 * - 이미 구매한 워크북: { already_purchased: true } 200 (클라이언트가 안내)
 * - 같은 상품을 다시 담으면 quantity 증가 (UNIQUE user_id, product_id)
 */
export async function POST(request: NextRequest) {
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

    const quantity =
      typeof quantityRaw === "number" && Number.isInteger(quantityRaw) && quantityRaw > 0
        ? quantityRaw
        : 1;

    // 상품 존재 + 활성 확인
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, category, workshop_type, is_active")
      .eq("id", productId)
      .maybeSingle();

    if (productError) {
      console.error("상품 조회 실패:", productError);
      return NextResponse.json(
        { error: "상품을 불러오지 못했어요" },
        { status: 500 }
      );
    }

    if (!product || !product.is_active) {
      return NextResponse.json(
        { error: "존재하지 않거나 판매 중이 아닌 상품입니다" },
        { status: 400 }
      );
    }

    // Phase 2 리포트 등 세션 특정 상품은 장바구니 불가
    if (product.category === "phase2_report") {
      return NextResponse.json(
        { error: "이 상품은 장바구니에 담을 수 없어요" },
        { status: 400 }
      );
    }

    // 워크북: 이미 구매했는지 확인
    if (product.category === "workbook" && product.workshop_type) {
      const { data: purchased } = await supabase
        .from("workshop_purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("workshop_type", product.workshop_type)
        .eq("status", "confirmed")
        .maybeSingle();

      if (purchased) {
        return NextResponse.json({
          already_purchased: true,
          message: "이미 구매한 워크북입니다",
        });
      }
    }

    // upsert: 같은 user_id + product_id가 있으면 quantity 합산
    const { data: existing } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .maybeSingle();

    if (existing) {
      const newQuantity = existing.quantity + quantity;
      const { error: updateError } = await supabase
        .from("cart_items")
        .update({ quantity: newQuantity })
        .eq("id", existing.id);

      if (updateError) {
        console.error("장바구니 수량 증가 실패:", updateError);
        return NextResponse.json(
          { error: "장바구니 업데이트에 실패했어요" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        cart_item_id: existing.id,
        quantity: newQuantity,
      });
    }

    const { data: inserted, error: insertError } = await supabase
      .from("cart_items")
      .insert({
        user_id: user.id,
        product_id: productId,
        quantity,
      })
      .select("id, quantity")
      .single();

    if (insertError) {
      console.error("장바구니 추가 실패:", insertError);
      return NextResponse.json(
        { error: "장바구니에 담지 못했어요" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      cart_item_id: inserted.id,
      quantity: inserted.quantity,
    });
  } catch (err) {
    console.error("장바구니 추가 오류:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
