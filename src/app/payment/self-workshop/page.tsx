import { PurchaseClient } from "@/components/payment/PurchaseClient";

export const metadata = {
  title: "내면 탐색 워크샵 결제",
};

export default function SelfWorkshopPaymentPage() {
  return (
    <PurchaseClient
      slug="self-workshop"
      title="내면 탐색 워크샵"
      description="가치관 월드컵, 삶의 의미 탐색 같은 활동지로 직접 답을 찾아가는 워크샵이에요."
      amount={99000}
      goodsName="내면 탐색 워크샵"
      features={[
        "가치관 월드컵 활동지",
        "삶의 의미 탐색 워크북",
        "내 속도대로 진행하는 자기 탐색 가이드",
      ]}
    />
  );
}
