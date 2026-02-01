import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { BookingRequestContent } from "./BookingRequestContent";

export default async function BookingRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">
        예약 요청
      </h1>
      <p className="mt-2 text-[var(--foreground)]/70">
        코치가 설정한 예약 가능 시간대를 선택하고 서베이를 제출하세요.
      </p>

      <BookingRequestContent bookingId={id} />
    </div>
  );
}
