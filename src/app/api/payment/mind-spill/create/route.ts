import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createClient } from "@/lib/supabase/server";
import { MIND_SPILL_REPORT_PRICE } from "@/lib/mind-spill/constants";

/**
 * POST /api/payment/mind-spill/create
 *
 * Mind Spill Period(3일치 누적) 종합 리포트 결제 레코드 생성.
 * Body: { entry_ids: string[] } — 최소 3개.
 *
 * 동작:
 *   1. entry_ids 검증 (모두 본인 소유, 3개 이상).
 *   2. period_report 빈 row 생성 (entry_ids, period_start, period_end).
 *   3. period_purchase pending 생성.
 *   4. 응답: { order_id, amount, period_report_id }.
 *
 * 응답:
 *   { success: true, period_report_id, order_id, amount } — 정상.
 *   { error }                                            — 실패.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const { entry_ids } = await request.json().catch(() => ({}));
    if (!Array.isArray(entry_ids) || entry_ids.length < 3) {
      return NextResponse.json(
        { error: "entry_ids가 3개 이상 필요합니다" },
        { status: 400 }
      );
    }
    if (entry_ids.some((id) => typeof id !== "string" || !id)) {
      return NextResponse.json(
        { error: "entry_ids 형식 오류" },
        { status: 400 }
      );
    }

    // entries 조회 — 본인 소유 + entry_date 추출.
    const { data: entries, error: entriesError } = await supabase
      .from("mind_spill_daily_entries")
      .select("id, user_id, entry_date")
      .in("id", entry_ids);
    if (entriesError || !entries) {
      console.error("[mind-spill period create] entries 조회 실패:", entriesError);
      return NextResponse.json(
        { error: "entries를 조회하지 못했습니다" },
        { status: 500 }
      );
    }
    if (entries.length !== entry_ids.length) {
      return NextResponse.json(
        { error: "일부 entry를 찾을 수 없습니다" },
        { status: 404 }
      );
    }
    if (entries.some((e) => e.user_id !== user.id)) {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }

    const dates = entries.map((e) => e.entry_date).sort();
    const period_start = dates[0];
    const period_end = dates[dates.length - 1];

    // period_report 생성 (LLM 결과는 결제 + 트리거 후 채워짐).
    const { data: report, error: reportError } = await supabase
      .from("mind_spill_period_reports")
      .insert({
        user_id: user.id,
        entry_ids,
        period_start,
        period_end,
      })
      .select("id")
      .single();
    if (reportError || !report) {
      console.error("[mind-spill period create] report insert 실패:", reportError);
      return NextResponse.json(
        { error: "리포트 생성에 실패했습니다" },
        { status: 500 }
      );
    }

    // period_purchase pending 생성.
    const orderId = `MS-${Date.now()}-${nanoid(8)}`;
    const { data: purchase, error: purchaseError } = await supabase
      .from("mind_spill_period_purchases")
      .insert({
        user_id: user.id,
        period_report_id: report.id,
        amount: MIND_SPILL_REPORT_PRICE,
        order_id: orderId,
        status: "pending",
      })
      .select("id, order_id, amount")
      .single();
    if (purchaseError || !purchase) {
      console.error("[mind-spill period create] purchase insert 실패:", purchaseError);
      return NextResponse.json(
        { error: "결제 레코드 생성에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      period_report_id: report.id,
      purchase_id: purchase.id,
      order_id: purchase.order_id,
      amount: purchase.amount,
    });
  } catch (err) {
    console.error("[mind-spill period create] 오류:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
