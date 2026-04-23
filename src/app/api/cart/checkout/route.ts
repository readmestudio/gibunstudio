import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { nanoid } from "nanoid";

/**
 * POST /api/cart/checkout
 *
 * 장바구니 통합 결제 준비:
 * 1) 인증 체크
 * 2) cart_items + products JOIN
 * 3) 이미 구매한 워크북 자동 제외 (workshop_purchases.confirmed)
 * 4) 서버에서 total_amount 재계산 (클라 body 무시)
 * 5) cart_orders 레코드 생성 (status='pending', items JSONB 스냅샷)
 * 6) 응답: { order_id, total_amount, goods_name }
 *
 * body는 받지 않는다 (가격 조작 방지).
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

    // cart_items + products JOIN
    const { data: rows, error: fetchError } = await supabase
      .from("cart_items")
      .select(
        `id, product_id, quantity,
         product:products (
           id, name, price, category, workshop_type, is_active
         )`
      )
      .eq("user_id", user.id);

    if (fetchError) {
      console.error("장바구니 조회 실패:", fetchError);
      return NextResponse.json(
        { error: "장바구니를 불러오지 못했어요" },
        { status: 500 }
      );
    }

    type CartRow = {
      id: string;
      product_id: string;
      quantity: number;
      product: {
        id: string;
        name: string;
        price: number;
        category: string;
        workshop_type: string | null;
        is_active: boolean;
      } | null;
    };

    const validRows = ((rows ?? []) as unknown as CartRow[]).filter(
      (row) => row.product && row.product.is_active
    );

    if (validRows.length === 0) {
      return NextResponse.json(
        { error: "장바구니가 비어있어요" },
        { status: 400 }
      );
    }

    // 이미 구매한 워크북 조회
    const workshopTypes = validRows
      .map((row) => row.product?.workshop_type)
      .filter((w): w is string => !!w);

    let purchasedTypes = new Set<string>();
    if (workshopTypes.length > 0) {
      const { data: purchased } = await supabase
        .from("workshop_purchases")
        .select("workshop_type")
        .eq("user_id", user.id)
        .in("workshop_type", workshopTypes)
        .eq("status", "confirmed");

      purchasedTypes = new Set(
        (purchased ?? []).map((p) => p.workshop_type as string)
      );
    }

    // 결제 대상 = 활성 + 미구매
    const itemsForCheckout = validRows.filter((row) => {
      if (!row.product) return false;
      if (row.product.category === "phase2_report") return false;
      if (
        row.product.workshop_type &&
        purchasedTypes.has(row.product.workshop_type)
      ) {
        return false;
      }
      return true;
    });

    if (itemsForCheckout.length === 0) {
      return NextResponse.json(
        { error: "결제 가능한 상품이 없어요" },
        { status: 400 }
      );
    }

    const itemsSnapshot = itemsForCheckout.map((row) => ({
      product_id: row.product_id,
      name: row.product!.name,
      category: row.product!.category,
      workshop_type: row.product!.workshop_type,
      quantity: row.quantity,
      unit_price: row.product!.price,
      subtotal: row.product!.price * row.quantity,
    }));

    const totalAmount = itemsSnapshot.reduce(
      (sum, it) => sum + it.subtotal,
      0
    );

    if (totalAmount <= 0) {
      return NextResponse.json(
        { error: "결제 금액이 올바르지 않아요" },
        { status: 400 }
      );
    }

    const orderId = `CT-${Date.now()}-${nanoid(8)}`;

    const { data: orderRow, error: insertError } = await supabase
      .from("cart_orders")
      .insert({
        user_id: user.id,
        order_id: orderId,
        total_amount: totalAmount,
        items: itemsSnapshot,
        status: "pending",
      })
      .select("id, order_id, total_amount")
      .single();

    if (insertError || !orderRow) {
      console.error("cart_orders 생성 실패:", insertError);
      return NextResponse.json(
        { error: "결제 준비에 실패했어요" },
        { status: 500 }
      );
    }

    const goodsName =
      itemsSnapshot.length === 1
        ? itemsSnapshot[0].name
        : `${itemsSnapshot[0].name} 외 ${itemsSnapshot.length - 1}건`;

    // 제외된 상품 안내 (선택적)
    const excludedCount = validRows.length - itemsForCheckout.length;

    return NextResponse.json({
      success: true,
      cart_order_id: orderRow.id,
      order_id: orderRow.order_id,
      total_amount: orderRow.total_amount,
      goods_name: goodsName,
      item_count: itemsSnapshot.length,
      excluded_count: excludedCount,
    });
  } catch (err) {
    console.error("장바구니 결제 준비 오류:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
