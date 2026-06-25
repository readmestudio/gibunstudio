import type { Metadata } from "next";
import { MindCheckFunnel } from "@/components/test/MindCheckFunnel";

/**
 * /check — 마음 체크 무료 온보딩 스크리너 (비로그인).
 *
 * 심리상담 키워드 광고/카드뉴스 유입 전용 진입점. 정규 진입점(/test/mind-check)의
 * 랜딩(Intro)을 건너뛰고 `skipIntro` 로 바로 첫 문항부터 시작해 이탈을 줄이고
 * 진단 완료율을 높인다. 동일한 문항·점수계산·리포트 로직을 그대로 재사용하며,
 * 리포트 하단에서 1:1 심리 상담(/programs/counseling)으로 전환한다.
 */

export const metadata: Metadata = {
  title: "마음 체크 — 무료 심리 자가 점검 | GIBUN",
  description:
    "불안·우울·번아웃·스트레스·성취중독·자존감·주의력, 7가지 마음 신호를 한 번에 점검해요. 21문항 자가 점검으로 지금 내게 가장 큰 마음이 무엇인지 무료로 바로 확인하세요.",
  openGraph: {
    title: "마음 체크 — 무료 심리 자가 점검",
    description:
      "요즘 내 마음, 어디가 가장 힘든 걸까요? 7가지 마음 신호를 21문항으로 바로 점검해요. 로그인 없이, 지금 바로 시작하세요.",
  },
};

export default function MindCheckLeadGenPage() {
  return <MindCheckFunnel skipIntro />;
}
