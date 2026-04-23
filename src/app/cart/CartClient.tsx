"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import { ProductBuyButtons } from "@/components/commerce/ProductBuyButtons";
import type { BuyAction } from "@/types/payment";

const NICEPAY_CLIENT_ID = process.env.NEXT_PUBLIC_NICEPAY_MERCHANT_ID || "";
const NICEPAY_SDK_URL =
  process.env.NEXT_PUBLIC_NICEPAY_SDK_URL || "https://pay.nicepay.co.kr/v1/js/";
const BUYNOW_METHOD = process.env.NEXT_PUBLIC_NICEPAY_BUYNOW_METHOD || "";

export interface CartInitialItem {
  cartItemId: string;
  productId: string;
  quantity: number;
  name: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  category: string;
  illustration: string | null;
}

interface CartClientProps {
  initialItems: CartInitialItem[];
}

export function CartClient({ initialItems }: CartClientProps) {
  const router = useRouter();
  const [items, setItems] = useState<CartInitialItem[]>(initialItems);
  const [submittingAction, setSubmittingAction] = useState<BuyAction | null>(
    null
  );
  const [sdkLoaded, setSdkLoaded] = useState(false);

  const total = items.reduce((sum, it) => sum + it.price * it.quantity, 0);
  const count = items.length;

  async function updateQuantity(productId: string, nextQty: number) {
    const prev = items;
    if (nextQty <= 0) {
      setItems((rows) => rows.filter((r) => r.productId !== productId));
    } else {
      setItems((rows) =>
        rows.map((r) =>
          r.productId === productId ? { ...r, quantity: nextQty } : r
        )
      );
    }

    try {
      const res = await fetch("/api/cart/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, quantity: nextQty }),
      });
      if (!res.ok) throw new Error("수량 변경 실패");
    } catch (err) {
      console.error(err);
      alert("수량 변경에 실패했어요.");
      setItems(prev);
    }
  }

  async function removeItem(productId: string) {
    if (!confirm("이 상품을 장바구니에서 뺄까요?")) return;
    const prev = items;
    setItems((rows) => rows.filter((r) => r.productId !== productId));
    try {
      const res = await fetch("/api/cart/remove", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
      });
      if (!res.ok) throw new Error("삭제 실패");
    } catch (err) {
      console.error(err);
      alert("삭제에 실패했어요.");
      setItems(prev);
    }
  }

  async function startCheckout(action: "buyNow" | "npay", method?: string) {
    if (!NICEPAY_CLIENT_ID) {
      alert("결제 모듈이 아직 설정되지 않았어요.");
      return;
    }
    if (!window.AUTHNICE) {
      alert("결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    if (items.length === 0) {
      alert("장바구니가 비어있어요.");
      return;
    }

    setSubmittingAction(action);

    try {
      const res = await fetch("/api/cart/checkout", { method: "POST" });

      if (res.status === 401) {
        alert("로그인이 필요합니다.");
        router.push("/login?redirect=/cart");
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "결제 준비에 실패했어요.");
      }

      if (data.excluded_count > 0) {
        alert(
          `이미 구매한 상품 ${data.excluded_count}개는 자동으로 제외되었어요.`
        );
      }

      window.AUTHNICE.requestPay({
        clientId: NICEPAY_CLIENT_ID,
        ...(method ? { method } : {}),
        orderId: data.order_id,
        amount: data.total_amount,
        goodsName: data.goods_name,
        returnUrl: `${window.location.origin}/api/payment/nicepay/return`,
        fnError: (result: { errorMsg: string }) => {
          console.error("NicePay 에러:", result);
          alert(`결제 오류: ${result.errorMsg}`);
          setSubmittingAction(null);
        },
      });
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error ? err.message : "결제를 시작할 수 없어요."
      );
      setSubmittingAction(null);
    }
  }

  const handleBuyNow = () =>
    startCheckout("buyNow", BUYNOW_METHOD || undefined);
  const handleNpay = () => startCheckout("npay", "naverpayCard");

  const isSubmitting = submittingAction !== null;

  if (count === 0) {
    return (
      <div className="min-h-screen bg-white px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">
            장바구니
          </h1>
          <div className="mt-16 rounded-xl border-2 border-[var(--foreground)]/20 bg-white p-12">
            <p className="text-base text-[var(--foreground)]/60 mb-6">
              장바구니가 비어있어요.
            </p>
            <Link
              href="/payment/self-workshop"
              className="inline-block rounded-lg border-2 border-[var(--foreground)] bg-[var(--foreground)] px-6 py-3 text-sm font-bold text-white hover:opacity-90"
            >
              워크북 구경하기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white px-4 py-12 pb-40">
      {NICEPAY_CLIENT_ID && (
        <Script
          src={NICEPAY_SDK_URL}
          strategy="afterInteractive"
          onLoad={() => setSdkLoaded(true)}
          onReady={() => setSdkLoaded(true)}
        />
      )}

      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          장바구니
        </h1>
        <p className="text-sm text-[var(--foreground)]/60 mb-8">
          총 {count}개의 상품
        </p>

        {/* 상품 리스트 */}
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.cartItemId}
              className="rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--foreground)]/50 mb-1">
                    {item.category === "workbook" ? "마음 챙김 워크북" : item.category}
                  </p>
                  <p className="text-base font-bold text-[var(--foreground)] mb-1 break-keep">
                    {item.name}
                  </p>
                  {item.description && (
                    <p className="text-xs text-[var(--foreground)]/60 line-clamp-2 break-keep">
                      {item.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  aria-label="상품 삭제"
                  className="flex-shrink-0 text-[var(--foreground)]/40 hover:text-[var(--foreground)]"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between">
                {/* 수량 조절 */}
                <div className="inline-flex items-center rounded-full border-2 border-[var(--foreground)]/20">
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity - 1)
                    }
                    disabled={item.quantity <= 1}
                    className="h-8 w-8 text-sm font-bold text-[var(--foreground)] disabled:opacity-30"
                    aria-label="수량 감소"
                  >
                    −
                  </button>
                  <span className="min-w-[2ch] text-center text-sm font-semibold">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateQuantity(item.productId, item.quantity + 1)
                    }
                    className="h-8 w-8 text-sm font-bold text-[var(--foreground)]"
                    aria-label="수량 증가"
                  >
                    +
                  </button>
                </div>

                {/* 소계 */}
                <div className="text-right">
                  {item.originalPrice && item.originalPrice > item.price && (
                    <p className="text-xs text-[var(--foreground)]/40 line-through">
                      {(item.originalPrice * item.quantity).toLocaleString()}원
                    </p>
                  )}
                  <p className="text-base font-bold text-[var(--foreground)]">
                    {(item.price * item.quantity).toLocaleString()}원
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 총 합계 */}
        <div className="mt-8 rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--foreground)]/60">
              총 {count}개
            </span>
            <span className="text-2xl font-bold text-[var(--foreground)]">
              {total.toLocaleString()}원
            </span>
          </div>
          <p className="text-xs text-[var(--foreground)]/50">
            이미 구매한 상품은 결제 시 자동으로 제외됩니다.
          </p>
        </div>

        {/* 결제 버튼 */}
        <div className="mt-6">
          <ProductBuyButtons
            variant="inline"
            productId="cart"
            productName={`장바구니 (${count}개)`}
            price={total}
            hideAddToCart
            onBuyNow={handleBuyNow}
            onNpayBuy={handleNpay}
            isSubmitting={isSubmitting}
            submittingAction={submittingAction}
            disabled={!!NICEPAY_CLIENT_ID && !sdkLoaded}
            disabledLabel="결제 모듈 로딩 중..."
          />
          <p className="mt-4 text-center text-xs text-[var(--foreground)]/50">
            결제는 NicePay를 통해 안전하게 처리됩니다.
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/payment/self-workshop"
            className="text-sm text-[var(--foreground)]/60 underline hover:text-[var(--foreground)]"
          >
            계속 쇼핑하기
          </Link>
        </div>
      </div>
    </div>
  );
}
