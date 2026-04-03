import { NextRequest, NextResponse } from "next/server";
import { isNicepayEnabled } from "@/lib/nicepay/config";
import { approveNicepayPayment } from "@/lib/nicepay/approve";

/**
 * POST /api/payment/nicepay/approve
 *
 * NicePay 결제 승인 API (JSON)
 * 관리 도구나 수동 승인 시 사용할 수 있습니다.
 * 일반적인 결제 흐름은 /api/payment/nicepay/return을 통해 처리됩니다.
 */
export async function POST(request: NextRequest) {
  if (!isNicepayEnabled()) {
    return NextResponse.json(
      { error: "NicePay 결제가 설정되지 않았습니다" },
      { status: 503 }
    );
  }

  const body = await request.json();
  const { tid, amount } = body;

  if (!tid || !amount) {
    return NextResponse.json(
      { error: "tid와 amount가 필요합니다" },
      { status: 400 }
    );
  }

  const result = await approveNicepayPayment(tid, Number(amount));

  if (result.success) {
    return NextResponse.json({
      success: true,
      tid: result.tid,
      orderId: result.orderId,
      amount: result.amount,
    });
  }

  return NextResponse.json(
    {
      error: result.resultMsg,
      resultCode: result.resultCode,
    },
    { status: 400 }
  );
}
