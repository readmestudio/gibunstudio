import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { nanoid } from "nanoid";

/**
 * POST /api/payment/workshop/create
 *
 * 워크북 결제 레코드 생성 (NicePay 호출 전에 DB에 먼저 기록)
 * Body: { workshopType?, amount, mindsLeadId? }
 *
 * mindsLeadId: 무료 /minds 를 거쳐온 사용자의 리드 id(minds_leads.id). 결제에 실어
 * 두면 승인 시 워크북 진행으로 복사돼, 워크북 단계에서 minds 배역을 이어 보여준다.
 */

/** UUID 형식만 통과(그 외 값은 무시) — minds_lead_id 컬럼은 UUID. */
function sanitizeLeadId(value: unknown): string | null {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }

    const {
      workshopType = "achievement-addiction",
      amount,
      mindsLeadId,
    } = await request.json();
    const leadId = sanitizeLeadId(mindsLeadId);

    if (!amount) {
      return NextResponse.json(
        { error: "결제 금액이 필요합니다" },
        { status: 400 }
      );
    }

    // 기존 pending/confirmed 결제 중복 확인
    const { data: existing } = await supabase
      .from("workshop_purchases")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("workshop_type", workshopType)
      .in("status", ["pending", "confirmed"])
      .maybeSingle();

    if (existing?.status === "confirmed") {
      return NextResponse.json({
        purchase_id: existing.id,
        message: "이미 구매한 워크북입니다",
        already_purchased: true,
      });
    }

    // 기존 pending이 있으면 재사용
    if (existing?.status === "pending") {
      const { data: pendingRecord } = await supabase
        .from("workshop_purchases")
        .select("id, order_id, minds_lead_id")
        .eq("id", existing.id)
        .single();

      if (pendingRecord) {
        // 이전 pending 에 leadId 가 비어 있고 이번에 들고 왔으면 보강한다.
        if (leadId && !pendingRecord.minds_lead_id) {
          await supabase
            .from("workshop_purchases")
            .update({ minds_lead_id: leadId })
            .eq("id", pendingRecord.id);
        }
        return NextResponse.json({
          success: true,
          purchase_id: pendingRecord.id,
          order_id: pendingRecord.order_id,
        });
      }
    }

    // 새 결제 레코드 생성
    const orderId = `WB-${Date.now()}-${nanoid(8)}`;

    const { data: purchase, error } = await supabase
      .from("workshop_purchases")
      .insert({
        user_id: user.id,
        workshop_type: workshopType,
        amount,
        order_id: orderId,
        status: "pending",
        minds_lead_id: leadId,
      })
      .select("id, order_id")
      .single();

    if (error) {
      console.error("워크북 결제 레코드 생성 실패:", error);
      return NextResponse.json(
        { error: "결제 레코드 생성에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      purchase_id: purchase.id,
      order_id: purchase.order_id,
    });
  } catch (err) {
    console.error("워크북 결제 생성 오류:", err);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
