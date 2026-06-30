import { StoreCheckout } from "@/components/payment/StoreCheckout";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "워크북 또는 심리상담 구매",
  description:
    "마음 챙김 워크북 또는 1급 심리상담사 1:1 상담을 선택해 결제하세요.",
};

export default async function PaymentStartPage() {
  // 로그인 여부를 읽어 StoreCheckout 으로 넘긴다. 워크북·상담 모두 결제는 로그인이
  // 필요하며, 상담은 비로그인 클릭 시 로그인 페이지로 보낸다.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <StoreCheckout isLoggedIn={!!user} />;
}
