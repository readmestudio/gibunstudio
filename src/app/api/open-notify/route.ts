import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone } = body;

    if (!name || typeof name !== "string" || !phone || typeof phone !== "string") {
      return NextResponse.json(
        { error: "이름과 휴대폰 번호를 입력해 주세요." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.from("open_notifications").insert({
      name: name.trim(),
      phone: phone.trim(),
      program_type: "7day",
    });

    if (error) {
      console.error("open_notify insert error:", error);
      return NextResponse.json(
        { error: "알림 신청 저장에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "알림 신청에 실패했습니다." },
      { status: 500 }
    );
  }
}
