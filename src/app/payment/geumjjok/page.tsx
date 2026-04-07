import { PurchaseClient } from "@/components/payment/PurchaseClient";

export const metadata = {
  title: "금쪽 상담소 결제",
};

export default function GeumjjokPaymentPage() {
  return (
    <PurchaseClient
      slug="geumjjok"
      title="금쪽 상담소"
      description="사소한 고민이 많은 걸 설명해줘요. 고민을 털어놓으면 내면 분석 리포트가 나와요."
      amount={9900}
      goodsName="금쪽 상담소"
      features={[
        "사소한 고민에서 출발하는 내면 분석",
        "정서·신념·자동 사고 패턴 리포트",
        "맞춤형 마음 가이드",
      ]}
    />
  );
}
