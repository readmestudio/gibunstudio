import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CounselingBookingContent } from "./CounselingBookingContent";
import { getCounselingType } from "@/lib/counseling/types";

export default async function DashboardCounselingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Supabase에서 예약 목록 조회
  const { data: bookingsRaw } = await supabase
    .from("counseling_bookings")
    .select(
      "id, requested_slots, status, confirmed_slot, zoom_link, created_at, purchases(id, counseling_type, amount, status)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const bookings = (bookingsRaw || []).map((b) => {
    const purchase = b.purchases as unknown as {
      id: string;
      counseling_type: string;
      amount: number;
      status: string;
    } | null;
    const typeInfo = getCounselingType(purchase?.counseling_type || "");
    return {
      id: b.id,
      counselingType: purchase?.counseling_type || "",
      title: typeInfo?.title || "상담",
      amount: purchase?.amount || 0,
      status: b.status as string,
      paymentStatus: (purchase?.status as string) || "pending",
      requestedSlots: (b.requested_slots || []) as string[],
      confirmedSlot: b.confirmed_slot as string | null,
      zoomLink: b.zoom_link as string | null,
      createdAt: b.created_at as string,
    };
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Link
        href="/dashboard"
        className="text-sm text-[var(--foreground)]/60 hover:underline"
      >
        &larr; 대시보드
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-[var(--foreground)]">
        1:1 상담 예약
      </h1>
      <p className="mt-2 text-[var(--foreground)]/70">
        예약 현황을 확인하고 상담을 관리할 수 있습니다.
      </p>

      <CounselingBookingContent bookings={bookings} />
    </div>
  );
}
