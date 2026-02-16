import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCounselingType, MAX_SLOT_SELECTIONS } from "@/lib/counseling/types";

/**
 * POST /api/booking/create
 * 예약 생성 (최대 3개 슬롯 선택)
 *
 * body: {
 *   counselingType: string,
 *   slotIds: string[],       // 최대 3개
 *   surveyData: { concern: string, goal: string }
 * }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const body = await request.json();
  const { counselingType, slotIds, surveyData } = body;

  // 유효성 검증
  const typeInfo = getCounselingType(counselingType);
  if (!typeInfo) {
    return NextResponse.json(
      { error: "유효하지 않은 상담 유형입니다" },
      { status: 400 }
    );
  }

  if (
    !Array.isArray(slotIds) ||
    slotIds.length === 0 ||
    slotIds.length > MAX_SLOT_SELECTIONS
  ) {
    return NextResponse.json(
      { error: `1~${MAX_SLOT_SELECTIONS}개의 시간을 선택해주세요` },
      { status: 400 }
    );
  }

  // 선택한 슬롯들이 아직 미예약인지 확인
  const { data: slots, error: slotError } = await supabase
    .from("coach_available_slots")
    .select("id, slot_time, is_booked")
    .in("id", slotIds);

  if (slotError) {
    return NextResponse.json({ error: slotError.message }, { status: 500 });
  }

  if (!slots || slots.length !== slotIds.length) {
    return NextResponse.json(
      { error: "선택한 시간 중 일부가 존재하지 않습니다" },
      { status: 400 }
    );
  }

  const bookedSlot = slots.find((s) => s.is_booked);
  if (bookedSlot) {
    return NextResponse.json(
      { error: "선택한 시간 중 이미 예약된 시간이 있습니다" },
      { status: 409 }
    );
  }

  // 1. purchases 테이블에 insert (pending 상태)
  const { data: purchase, error: purchaseError } = await supabase
    .from("purchases")
    .insert({
      user_id: user.id,
      program_type: "counseling",
      counseling_type: counselingType,
      amount: typeInfo.price,
      status: "pending",
    })
    .select("id")
    .single();

  if (purchaseError) {
    return NextResponse.json(
      { error: purchaseError.message },
      { status: 500 }
    );
  }

  // 2. counseling_bookings 테이블에 insert
  const requestedSlots = slots.map((s) => s.slot_time);
  const { data: booking, error: bookingError } = await supabase
    .from("counseling_bookings")
    .insert({
      purchase_id: purchase.id,
      user_id: user.id,
      requested_slots: requestedSlots,
      survey_data: surveyData || {},
      status: "pending",
    })
    .select("id")
    .single();

  if (bookingError) {
    return NextResponse.json(
      { error: bookingError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    bookingId: booking.id,
    purchaseId: purchase.id,
  });
}
