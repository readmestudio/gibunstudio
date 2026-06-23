import type { Metadata } from "next";
import { AchievementTestFunnel } from "@/components/test/AchievementTestFunnel";

export const metadata: Metadata = {
  title: "성취 중독 무료 테스트 | GIBUN",
  description:
    "쉬면 불안하고 늘 더 해내야 할 것 같다면? 20문항 CBT 기반 자가 진단으로 내 성취 패턴의 위험 레벨과 4가지 핵심 지표를 무료로 확인해보세요.",
  openGraph: {
    title: "성취 중독 무료 테스트",
    description:
      "20문항으로 내 성취 패턴이 지금 어디까지 와 있는지 진단해요. 로그인 없이 무료로 결과를 확인하세요.",
  },
};

export default function AchievementAddictionTestPage() {
  return <AchievementTestFunnel />;
}
