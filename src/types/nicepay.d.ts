/** NicePay JS SDK 글로벌 타입 선언 */

interface AuthNicePayOptions {
  clientId: string;
  method: string;
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
