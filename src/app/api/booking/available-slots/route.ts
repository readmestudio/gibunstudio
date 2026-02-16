import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/booking/available-slots?month=2026-02
 * 해당 월의 미예약 코치 가용 슬롯 조회
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // "2026-02" 형태

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { error: "month 파라미터가 필요합니다 (형식: YYYY-MM)" },
      { status: 400 }
    );
  }

  const [year, mon] = month.split("-").map(Number);
  const startDate = new Date(year, mon - 1, 1).toISOString();
  const endDate = new Date(year, mon, 1).toISOString();

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("coach_available_slots")
    .select("id, slot_time, is_booked")
    .gte("slot_time", startDate)
    .lt("slot_time", endDate)
    .eq("is_booked", false)
    .order("slot_time", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const slots = (data || []).map((s) => ({
    id: s.id,
    slotTime: s.slot_time,
    isBooked: s.is_booked,
  }));

  return NextResponse.json({ slots });
}
