import { notFound, redirect } from "next/navigation";
import { getCounselingType } from "@/lib/counseling/types";
import { PurchaseClient } from "@/components/payment/PurchaseClient";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const counseling = getCounselingType(type);
  return {
    title: counseling ? `${counseling.title} 결제` : "상담 결제",
  };
}

export default async function CounselingPaymentPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const counseling = getCounselingType(type);
  if (!counseling) notFound();

  // 상담은 로그인 후에만 결제 가능 — 비로그인은 로그인 페이지로 보낸 뒤 되돌아온다.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=/payment/counseling/${type}`);
  }

  const includedFeatures = counseling.features
    .filter((f) => f.included)
    .map((f) => f.text);

  return (
    <PurchaseClient
      slug={`counseling-${counseling.id}`}
      returnSlug="counseling"
      orderIdPrefix={`CN-${counseling.id}`}
      returnPath="/api/payment/nicepay/return"
      title={counseling.title}
      description={counseling.description}
      amount={counseling.price}
      goodsName={counseling.title}
      features={includedFeatures}
    />
  );
}
