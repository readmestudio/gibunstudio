import { notFound } from "next/navigation";
import { getCounselingType } from "@/lib/counseling/types";
import { PurchaseClient } from "@/components/payment/PurchaseClient";

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

  const includedFeatures = counseling.features
    .filter((f) => f.included)
    .map((f) => f.text);

  return (
    <PurchaseClient
      slug={`counseling-${counseling.id}`}
      title={counseling.title}
      description={counseling.description}
      amount={counseling.price}
      goodsName={counseling.title}
      features={includedFeatures}
    />
  );
}
