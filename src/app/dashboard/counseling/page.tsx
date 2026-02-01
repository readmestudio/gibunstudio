import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CounselingBookingContent } from "./CounselingBookingContent";

export default async function DashboardCounselingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // TODO: Supabase에서 구매한 상담 목록 조회
  const purchasedCounseling: { id: string; type: string; title: string; status: string }[] = [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <Link href="/dashboard" className="text-sm text-[var(--foreground)]/60 hover:underline">
        ← 대시보드
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-[var(--foreground)]">
        1:1 상담 예약
      </h1>
      <p className="mt-2 text-[var(--foreground)]/70">
        구매한 상담의 예약 현황을 확인하고 예약 요청을 진행할 수 있습니다.
      </p>

      <CounselingBookingContent purchasedCounseling={purchasedCounseling} />
    </div>
  );
}
