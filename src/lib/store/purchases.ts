/**
 * 구매/입금 데이터 (로컬 테스트용)
 * 추후 Supabase 연동 시 DB로 대체
 */
export type PurchaseStatus = "pending" | "confirmed";

export type Purchase = {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  programType: "7day" | "counseling";
  counselingType?: string;
  amount: number;
  status: PurchaseStatus;
  createdAt: string;
  confirmedAt?: string;
};

// 로컬 스토리지 키
const STORAGE_KEY = "innerchild_purchases";

function getPurchases(): Purchase[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setPurchases(purchases: Purchase[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));
}

export function createPurchase(purchase: Omit<Purchase, "id" | "createdAt">): Purchase {
  const purchases = getPurchases();
  const newPurchase: Purchase = {
    ...purchase,
    id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
  };
  purchases.push(newPurchase);
  setPurchases(purchases);
  return newPurchase;
}

export function getPendingPurchases(): Purchase[] {
  return getPurchases().filter((p) => p.status === "pending");
}

export function confirmPurchase(id: string): Purchase | null {
  const purchases = getPurchases();
  const idx = purchases.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  purchases[idx] = {
    ...purchases[idx],
    status: "confirmed",
    confirmedAt: new Date().toISOString(),
  };
  setPurchases(purchases);
  return purchases[idx];
}
