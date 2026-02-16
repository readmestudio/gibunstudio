import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCounselingType } from "@/lib/counseling/types";
import { CheckoutContent } from "./CheckoutContent";

interface Props {
  params: Promise<{ bookingId: string }>;
}

export default async function CheckoutPage({ params }: Props) {
  const { bookingId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 예약 정보 조회
  const { data: booking } = await supabase
    .from("counseling_bookings")
    .select("id, purchase_id, requested_slots, status")
    .eq("id", bookingId)
    .eq("user_id", user.id)
    .single();

  if (!booking) {
    redirect("/programs/counseling");
  }

  // 구매 정보 조회
  const { data: purchase } = await supabase
    .from("purchases")
    .select("id, counseling_type, amount")
    .eq("id", booking.purchase_id)
    .single();

  if (!purchase) {
    redirect("/programs/counseling");
  }

  const counselingType = getCounselingType(purchase.counseling_type || "");

  // 요청된 시간대 포맷
  const requestedSlots = (booking.requested_slots || []).map((s: string) => {
    const d = new Date(s);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });

  return (
    <div>
      <section
        className="relative bg-center bg-no-repeat bg-cover py-16"
        style={{ backgroundImage: "url('/patterns/patternTop.svg')" }}
      >
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            결제
          </h1>
          <p className="mt-2 text-[var(--foreground)]/70">
            결제를 완료하면 상담사가 시간을 확정합니다.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
        <CheckoutContent
          bookingId={bookingId}
          purchaseId={purchase.id}
          counselingTitle={counselingType?.title || "상담"}
          amount={purchase.amount}
          requestedSlots={requestedSlots}
        />
      </div>
    </div>
  );
}
