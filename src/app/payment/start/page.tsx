import { StoreCheckout } from "@/components/payment/StoreCheckout";

export const metadata = {
  title: "워크북 또는 심리상담 구매",
  description:
    "마음 챙김 워크북 또는 1급 심리상담사 1:1 상담을 선택해 결제하세요.",
};

export default function PaymentStartPage() {
  return <StoreCheckout />;
}
