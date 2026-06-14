import { WorkbookOverviewPage } from "@/components/self-workshop/WorkbookOverviewPage";

export const metadata = {
  title: "심리 상담 워크북",
  description:
    "직장인을 위한 심리 상담 워크북. 마음 안의 여러 부분을 알아보고, 다음 한 달을 다르게 살아보는 라이팅 테라피.",
};

export default async function SelfWorkshopPaymentPage() {
  return <WorkbookOverviewPage />;
}
