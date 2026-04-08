import { redirect } from "next/navigation";
import { getCounselingType } from "@/lib/counseling/types";

interface Props {
  params: Promise<{ type: string }>;
}

/**
 * 상담 예약 페이지는 현재 카드 심사 통과 목적으로
 * 결제 페이지(/payment/counseling/[type])로 직접 리다이렉트합니다.
 * 시간 슬롯 예약 플로우는 추후 RLS 정책 정리 후 재활성화 예정.
 */
export default async function BookingPage({ params }: Props) {
  const { type } = await params;
  const counselingType = getCounselingType(type);

  if (!counselingType) {
    redirect("/programs/counseling");
  }

  redirect(`/payment/counseling/${type}`);
}
