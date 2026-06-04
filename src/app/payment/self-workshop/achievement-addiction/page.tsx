import { WorkbookStorePage } from "@/components/self-workshop/WorkbookStorePage";

export const metadata = {
  title: "성취 중독 워크북 | GIBUN",
  description:
    "멈출 수 없는 성취 욕구, 쉼에 대한 죄책감. 자가 진단과 실습으로 나만의 순환 패턴을 발견하고 다음 행동을 그려보세요.",
};

export default async function AchievementAddictionPage() {
  return <WorkbookStorePage />;
}
