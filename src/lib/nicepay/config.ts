/**
 * NicePay 결제 설정
 *
 * NicePay 가입 후 .env.local에 아래 변수를 설정하세요:
 *   NICEPAY_MERCHANT_ID=your_merchant_id
 *   NICEPAY_MERCHANT_KEY=your_merchant_key
 *
 * 환경변수가 없으면 결제 비활성화 (무통장입금 안내)
 */

export const NICEPAY_CONFIG = {
  merchantId: process.env.NEXT_PUBLIC_NICEPAY_MERCHANT_ID || "",
  merchantKey: process.env.NICEPAY_MERCHANT_KEY || "",
  apiUrl:
    process.env.NODE_ENV === "production"
      ? "https://pay.nicepay.co.kr"
      : "https://sandbox-pay.nicepay.co.kr",
};

/** NicePay 결제가 활성화되었는지 확인 */
export function isNicepayEnabled(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_NICEPAY_MERCHANT_ID &&
    process.env.NICEPAY_MERCHANT_KEY
  );
}

/** 클라이언트에서 확인용 */
export function isNicepayEnabledClient(): boolean {
  return !!process.env.NEXT_PUBLIC_NICEPAY_MERCHANT_ID;
}

/** 은행 정보 (무통장입금용) */
export const BANK_INFO = {
  bank: "신한은행",
  account: "140-015-244655",
  holder: "원모어 스푼",
};
