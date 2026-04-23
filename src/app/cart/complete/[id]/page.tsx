import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

interface CartCompletePageProps {
  params: Promise<{ id: string }>;
}

interface CartItemSnapshot {
  product_id: string;
  name: string;
  category: string;
  workshop_type: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export const metadata = {
  title: "결제 완료 · 기분 스튜디오",
};

export default async function CartCompletePage({ params }: CartCompletePageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/cart");
  }

  const { data: order } = await supabase
    .from("cart_orders")
    .select("id, user_id, total_amount, items, status, paid_at, order_id")
    .eq("id", id)
    .maybeSingle();

  if (!order || order.user_id !== user.id) {
    notFound();
  }

  const items = (order.items as CartItemSnapshot[]) ?? [];
  const isConfirmed = order.status === "confirmed";
  const hasWorkbook = items.some((it) => it.category === "workbook");

  return (
    <div className="min-h-screen bg-white px-4 py-16">
      <div className="mx-auto max-w-xl">
        <div className="text-center mb-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--foreground)]">
            <svg
              className="h-8 w-8 text-[var(--foreground)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
            {isConfirmed ? "결제가 완료되었어요" : "결제 확인 중"}
          </h1>
          <p className="text-sm text-[var(--foreground)]/60">
            주문번호 · {order.order_id}
          </p>
        </div>

        {/* 주문 상품 */}
        <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6 mb-6">
          <p className="text-sm text-[var(--foreground)]/60 mb-4">주문 상품</p>
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.product_id}
                className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3 last:border-0 last:pb-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--foreground)] break-keep">
                    {item.name}
                  </p>
                  <p className="text-xs text-[var(--foreground)]/50">
                    수량 {item.quantity}
                  </p>
                </div>
                <span className="text-sm font-bold text-[var(--foreground)]">
                  {item.subtotal.toLocaleString()}원
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-5 border-t-2 border-[var(--foreground)] pt-4 flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--foreground)]/70">
              총 결제 금액
            </span>
            <span className="text-xl font-bold text-[var(--foreground)]">
              {order.total_amount.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* 이동 버튼 */}
        <div className="space-y-3">
          {hasWorkbook && (
            <Link
              href="/dashboard/self-workshop/step/3"
              className="block rounded-lg border-2 border-[var(--foreground)] bg-[var(--foreground)] py-3.5 text-center text-sm font-bold text-white hover:opacity-90"
            >
              워크북 시작하기
            </Link>
          )}
          <Link
            href="/dashboard"
            className="block rounded-lg border-2 border-[var(--foreground)] bg-white py-3.5 text-center text-sm font-bold text-[var(--foreground)] hover:bg-[var(--surface)]"
          >
            대시보드로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}
