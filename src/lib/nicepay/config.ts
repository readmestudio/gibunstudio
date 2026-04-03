/**
 * NicePay 결제 설정
 *
 * .env.local에 아래 변수를 설정하세요:
 *   NEXT_PUBLIC_NICEPAY_MERCHANT_ID=your_client_id
 *   NICEPAY_MERCHANT_KEY=your_secret_key
 *   NEXT_PUBLIC_NICEPAY_SDK_URL=https://pay.nicepay.co.kr/v1/js/
 */

export const NICEPAY_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_NICEPAY_MERCHANT_ID || "",
  secretKey: process.env.NICEPAY_MERCHANT_KEY || "",
  /** 결제창 JS SDK URL */
  sdkUrl:
    process.env.NEXT_PUBLIC_NICEPAY_SDK_URL ||
    "https://pay.nicepay.co.kr/v1/js/",
  /** 서버 승인 API URL */
  apiUrl:
    process.env.NODE_ENV === "production"
      ? "https://api.nicepay.co.kr/v1/payments"
      : "https://sandbox-api.nicepay.co.kr/v1/payments",
};

/** NicePay 결제가 활성화되었는지 확인 (서버용) */
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

/** 서버 승인 API용 Basic 인증 헤더 생성 */
export function getNicepayAuthHeader(): string {
  const { clientId, secretKey } = NICEPAY_CONFIG;
  const encoded = Buffer.from(`${clientId}:${secretKey}`).toString("base64");
  return `Basic ${encoded}`;
}

/** 은행 정보 (무통장입금용) */
export const BANK_INFO = {
  bank: "신한은행",
  account: "140-015-244655",
  holder: "원모어 스푼",
};
