import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ purchase_id: string }>;
}

// 레거시 완료 경로 — 워크북은 즉시 제공되지 않고 제작 후 카카오톡으로 전달되므로,
// 결제 완료 안내는 단일 소스인 제작 중 안내 페이지(generating)로 통일한다.
export default async function WorkshopPaymentCompletePage({ params }: Props) {
  const { purchase_id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 결제 확인 (본인 + confirmed 인 경우에만 통과)
  const { data: purchase } = await supabase
    .from("workshop_purchases")
    .select("id, status")
    .eq("id", purchase_id)
    .eq("user_id", user.id)
    .single();

  if (!purchase || purchase.status !== "confirmed") {
    redirect("/payment/self-workshop");
  }

  redirect("/dashboard/self-workshop/generating");
}
