import type { Metadata } from "next";
import { MindCheckFunnel } from "@/components/test/MindCheckFunnel";

/**
 * /test/mind-check — 마음 체크 무료 온보딩 스크리너 (정규 진입점).
 *
 * 랜딩(Intro)을 건너뛰고 첫 문항이 곧 첫 페이지가 되도록 바로 21문항 테스트부터
 * 시작한다 → 진단 리포트 → 상담 유도 순으로 진행한다.
 * 광고 유입 전용 진입점 /check 와 동일하게 Intro 를 스킵한다.
 */

export const metadata: Metadata = {
  title: "마음 체크 — 무료 심리 자가 점검 | GIBUN",
  description:
    "불안·우울·번아웃·스트레스·성취중독·자존감·주의력, 7가지 마음 신호를 한 번에 점검해요. 21문항 자가 점검으로 지금 내게 가장 큰 마음이 무엇인지 무료로 확인하세요.",
  openGraph: {
    title: "마음 체크 — 무료 심리 자가 점검",
    description:
      "요즘 내 마음, 어디가 가장 힘든 걸까요? 7가지 마음 신호를 21문항으로 점검하고 결과 리포트를 받아보세요.",
  },
};

export default function MindCheckPage() {
  return <MindCheckFunnel skipIntro />;
}
