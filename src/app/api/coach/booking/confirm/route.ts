import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isCoachEmail } from "@/lib/auth/coach";

/**
 * POST /api/coach/booking/confirm
 * 예약 확정 또는 거절
 *
 * body: {
 *   bookingId: string,
 *   action: "confirm" | "reject",
 *   confirmedSlot?: string,   // 확정 시 선택한 시간 (ISO string)
 *   zoomLink?: string
 * }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isCoachEmail(user.email)) {
    return NextResponse.json(
      { error: "코치 권한이 필요합니다" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { bookingId, action, confirmedSlot, zoomLink } = body;

  if (!bookingId || !["confirm", "reject"].includes(action)) {
    return NextResponse.json(
      { error: "bookingId와 action(confirm/reject)이 필요합니다" },
      { status: 400 }
    );
  }

  if (action === "confirm") {
    if (!confirmedSlot) {
      return NextResponse.json(
        { error: "확정할 시간(confirmedSlot)이 필요합니다" },
        { status: 400 }
      );
    }

    // 예약 확정
    const { error: bookingError } = await supabase
      .from("counseling_bookings")
      .update({
        status: "confirmed",
        confirmed_slot: confirmedSlot,
        zoom_link: zoomLink || null,
        confirmed_by: user.id,
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    if (bookingError) {
      return NextResponse.json(
        { error: bookingError.message },
        { status: 500 }
      );
    }

    // 해당 슬롯을 예약 상태로 변경
    await supabase
      .from("coach_available_slots")
      .update({ is_booked: true })
      .eq("slot_time", confirmedSlot);

    // purchase 상태도 confirmed로
    const { data: booking } = await supabase
      .from("counseling_bookings")
      .select("purchase_id")
      .eq("id", bookingId)
      .single();

    if (booking) {
      await supabase
        .from("purchases")
        .update({
          status: "confirmed",
          confirmed_at: new Date().toISOString(),
          confirmed_by: user.id,
          d1_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", booking.purchase_id);
    }
  } else {
    // 예약 거절
    const { error: bookingError } = await supabase
      .from("counseling_bookings")
      .update({ status: "rejected" })
      .eq("id", bookingId);

    if (bookingError) {
      return NextResponse.json(
        { error: bookingError.message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ success: true, action });
}
