import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{ purchase_id: string }>;
}

export default async function WorkshopPaymentCompletePage({ params }: Props) {
  const { purchase_id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 결제 확인
  const { data: purchase } = await supabase
    .from("workshop_purchases")
    .select("id, status, amount, paid_at")
    .eq("id", purchase_id)
    .eq("user_id", user.id)
    .single();

  if (!purchase || purchase.status !== "confirmed") {
    redirect("/payment/self-workshop");
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[var(--foreground)]">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-[var(--foreground)]">
        결제가 완료되었습니다
      </h1>
      <p className="mt-3 text-sm text-[var(--foreground)]/60">
        마음 챙김 워크북이 준비되었어요.
        <br />
        지금 바로 시작해보세요.
      </p>

      <div className="mt-8 rounded-xl border-2 border-[var(--foreground)]/20 bg-white p-6 text-left">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--foreground)]/60">결제 금액</span>
          <span className="text-base font-bold text-[var(--foreground)]">
            {purchase.amount.toLocaleString()}원
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm text-[var(--foreground)]/60">결제 일시</span>
          <span className="text-sm text-[var(--foreground)]">
            {purchase.paid_at
              ? new Date(purchase.paid_at).toLocaleDateString("ko-KR")
              : "-"}
          </span>
        </div>
      </div>

      <Link
        href="/dashboard/self-workshop"
        className="mt-8 inline-flex w-full items-center justify-center rounded-xl border-2 border-[var(--foreground)] px-6 py-4 text-base font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
      >
        워크북 시작하기
      </Link>

      <Link
        href="/dashboard"
        className="mt-4 block text-sm text-[var(--foreground)]/60 underline hover:text-[var(--foreground)]"
      >
        대시보드로 돌아가기
      </Link>
    </div>
  );
}
