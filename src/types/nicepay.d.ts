/** NicePay JS SDK 글로벌 타입 선언 */

interface AuthNicePayOptions {
  clientId: string;
  /**
   * 결제 수단.
   * 생략 시 NICE PAY 기본 통합 결제창(카드 + 간편결제 탭)이 노출된다.
   * 특정 수단으로 바로 열고 싶을 때만 지정.
   */
  method?: string;
  orderId: string;
  amount: number;
  goodsName: string;
  returnUrl: string;
  mallReserved?: string;
  fnError?: (result: { errorCode: string; errorMsg: string }) => void;
}

interface AuthNice {
  requestPay: (options: AuthNicePayOptions) => void;
}

interface Window {
  AUTHNICE: AuthNice;
}
