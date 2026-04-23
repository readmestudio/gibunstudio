import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CartClient, type CartInitialItem } from "./CartClient";

export const metadata = {
  title: "장바구니 · 기분 스튜디오",
};

export default async function CartPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/cart");
  }

  const { data: rows } = await supabase
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

  type CartRow = {
    id: string;
    product_id: string;
    quantity: number;
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

  const initialItems: CartInitialItem[] = ((rows ?? []) as unknown as CartRow[])
    .filter((row) => row.product && row.product.is_active)
    .map((row) => ({
      cartItemId: row.id,
      productId: row.product_id,
      quantity: row.quantity,
      name: row.product!.name,
      description: row.product!.description,
      price: row.product!.price,
      originalPrice: row.product!.original_price,
      category: row.product!.category,
      illustration:
        (row.product!.metadata as { illustration?: string } | null)
          ?.illustration ?? null,
    }));

  return <CartClient initialItems={initialItems} />;
}
