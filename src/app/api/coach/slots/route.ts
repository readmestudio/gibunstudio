import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isCoachEmail } from "@/lib/auth/coach";

/**
 * 코치 가용 시간 관리 API
 *
 * GET  /api/coach/slots?month=2026-02  → 슬롯 목록 조회
 * POST /api/coach/slots                → 슬롯 추가
 * DELETE /api/coach/slots              → 슬롯 삭제
 */

async function verifyCoach() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isCoachEmail(user.email)) {
    return { supabase: null, user: null, error: "코치 권한이 필요합니다" };
  }
  return { supabase, user, error: null };
}

export async function GET(request: NextRequest) {
  const { supabase, user, error } = await verifyCoach();
  if (error || !supabase || !user) {
    return NextResponse.json({ error: error }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month");

  let query = supabase
    .from("coach_available_slots")
    .select("id, coach_id, slot_time, is_booked, created_at")
    .order("slot_time", { ascending: true });

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [year, mon] = month.split("-").map(Number);
    const startDate = new Date(year, mon - 1, 1).toISOString();
    const endDate = new Date(year, mon, 1).toISOString();
    query = query.gte("slot_time", startDate).lt("slot_time", endDate);
  }

  const { data, error: dbError } = await query;

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ slots: data || [] });
}

export async function POST(request: NextRequest) {
  const { supabase, user, error } = await verifyCoach();
  if (error || !supabase || !user) {
    return NextResponse.json({ error: error }, { status: 403 });
  }

  const body = await request.json();
  const { slotTimes } = body; // string[] - ISO datetime 배열

  if (!Array.isArray(slotTimes) || slotTimes.length === 0) {
    return NextResponse.json(
      { error: "slotTimes 배열이 필요합니다" },
      { status: 400 }
    );
  }

  const rows = slotTimes.map((t: string) => ({
    coach_id: user.id,
    slot_time: t,
    is_booked: false,
  }));

  const { data, error: dbError } = await supabase
    .from("coach_available_slots")
    .insert(rows)
    .select("id, slot_time");

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, slots: data });
}

export async function DELETE(request: NextRequest) {
  const { supabase, user, error } = await verifyCoach();
  if (error || !supabase || !user) {
    return NextResponse.json({ error: error }, { status: 403 });
  }

  const body = await request.json();
  const { slotId } = body;

  if (!slotId) {
    return NextResponse.json(
      { error: "slotId가 필요합니다" },
      { status: 400 }
    );
  }

  // 이미 예약된 슬롯은 삭제 불가
  const { data: slot } = await supabase
    .from("coach_available_slots")
    .select("is_booked")
    .eq("id", slotId)
    .single();

  if (slot?.is_booked) {
    return NextResponse.json(
      { error: "이미 예약된 시간은 삭제할 수 없습니다" },
      { status: 409 }
    );
  }

  const { error: dbError } = await supabase
    .from("coach_available_slots")
    .delete()
    .eq("id", slotId);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
