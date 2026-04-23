/**
 * 결제 관련 공용 타입
 */

export type NicepayMethod =
  | "card"
  | "kakaopay"
  | "naverpayCard"
  | "cardAndEasyPay";

export type BuyAction = "buyNow" | "addToCart" | "npay";

export type ProductCategory =
  | "workbook"
  | "phase2_report"
  | "counseling";

export interface ProductSummary {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  originalPrice?: number | null;
  category: ProductCategory;
  workshopType?: string | null;
  metadata?: Record<string, unknown> | null;
  isActive?: boolean;
}

export interface CartItemWithProduct {
  id: string;
  productId: string;
  quantity: number;
  product: ProductSummary;
  subtotal: number;
}
