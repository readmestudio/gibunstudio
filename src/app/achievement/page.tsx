import type { Metadata } from "next";
import { AchievementTestFunnel } from "@/components/test/AchievementTestFunnel";

/**
 * /achievement — 성취중독 자가진단 무료 리드젠 깔때기 (비로그인).
 *
 * 광고/인스타 카드뉴스 유입 전용 진입점. 기존 /test/achievement-addiction 의
 * 랜딩(Intro)을 건너뛰고 `skipIntro` 로 바로 첫 문항부터 시작해 이탈을 줄이고
 * 진단 완료율을 높인다. 동일한 문항·점수계산·리포트·결제 로직을 그대로 재사용하며,
 * 리포트 하단에서 성취중독 워크북(₩49,000) 결제로 전환한다.
 */

export const metadata: Metadata = {
  title: "성취 중독 무료 자가진단 | GIBUN",
  description:
    "쉬면 불안하고 늘 더 해내야 할 것 같다면? 20문항 CBT 기반 자가 진단으로 내 성취 패턴의 위험 레벨과 4가지 핵심 지표를 무료로 바로 확인해보세요.",
  openGraph: {
    title: "성취 중독 무료 자가진단",
    description:
      "20문항으로 내 성취 패턴이 지금 어디까지 와 있는지 진단해요. 로그인 없이, 지금 바로 첫 문항부터 시작하세요.",
  },
};

export default function AchievementLeadGenPage() {
  return <AchievementTestFunnel skipIntro />;
}
