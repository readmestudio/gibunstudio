import { NICEPAY_CONFIG, getNicepayAuthHeader } from "./config";

export interface NicepayApprovalResult {
  success: boolean;
  resultCode: string;
  resultMsg: string;
  tid?: string;
  orderId?: string;
  amount?: number;
  raw?: Record<string, unknown>;
}

/**
 * NicePay 승인 API 호출
 *
 * 고객 인증 후 받은 tid로 최종 결제 승인을 요청합니다.
 * 금액 검증을 포함하여 위변조를 방지합니다.
 */
export async function approveNicepayPayment(
  tid: string,
  amount: number
): Promise<NicepayApprovalResult> {
  const url = `${NICEPAY_CONFIG.apiUrl}/${tid}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getNicepayAuthHeader(),
    },
    body: JSON.stringify({ amount }),
  });

  const data = await response.json();

  if (data.resultCode === "0000") {
    return {
      success: true,
      resultCode: data.resultCode,
      resultMsg: data.resultMsg,
      tid: data.tid,
      orderId: data.orderId,
      amount: data.amount,
      raw: data,
    };
  }

  return {
    success: false,
    resultCode: data.resultCode || "UNKNOWN",
    resultMsg: data.resultMsg || "승인 실패",
    raw: data,
  };
}

/**
 * NicePay 결제 취소 API 호출
 */
export async function cancelNicepayPayment(
  tid: string,
  reason: string,
  orderId: string
): Promise<NicepayApprovalResult> {
  const url = `${NICEPAY_CONFIG.apiUrl}/${tid}/cancel`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getNicepayAuthHeader(),
    },
    body: JSON.stringify({ reason, orderId }),
  });

  const data = await response.json();

  if (data.resultCode === "0000") {
    return {
      success: true,
      resultCode: data.resultCode,
      resultMsg: data.resultMsg,
      tid: data.tid,
      orderId: data.orderId,
      raw: data,
    };
  }

  return {
    success: false,
    resultCode: data.resultCode || "UNKNOWN",
    resultMsg: data.resultMsg || "취소 실패",
    raw: data,
  };
}
