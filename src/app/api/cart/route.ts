import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * GET /api/cart
 * 내 장바구니 항목 + 총액 조회
 */
export async function GET(request: NextRequest) {
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

    const { data: rows, error } = await supabase
      .from("cart_items")
      .select(
        `id, product_id, quantity, created_at,
         product:products (
           id, name, description, price, original_price, category,
           workshop_type, metadata, is_active
         )`
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("장바구니 조회 실패:", error);
      return NextResponse.json(
        { error: "장바구니를 불러오지 못했어요" },
        { status: 500 }
      );
    }

    type CartRow = {
      id: string;
      product_id: string;
      quantity: number;
      created_at: string;
      product: {
        id: string;
        name: string;
        description: string | null;
        price: number;
        original_price: number | null;
        category: string;
        workshop_type: string | null;
        metadata: Record<string, unknown> | null;
        is_active: boolean;
      } | null;
    };

    const validItems = ((rows ?? []) as unknown as CartRow[]).filter(
      (row) => row.product && row.product.is_active
    );

    const items = validItems.map((row) => ({
      id: row.id,
      productId: row.product_id,
      quantity: row.quantity,
      subtotal: (row.product?.price ?? 0) * row.quantity,
      product: row.product,
    }));

    const total = items.reduce((sum, it) => sum + it.subtotal, 0);

    return NextResponse.json({ items, total, count: items.length });
  } catch (err) {
    console.error("장바구니 조회 오류:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
