import { HeroManifesto } from "@/components/HeroManifesto";
import { ProgramCards } from "@/components/ProgramCards";
import { ComparisonSection } from "@/components/ComparisonSection";
import { SelfHackingElements } from "@/components/SelfHackingElements";
import { Testimonials } from "@/components/Testimonials";
import { PricingTable } from "@/components/PricingTable";

export default function Home() {
  return (
    <div>
      {/* 히어로 — 매니페스토 (Hack yourself. Stay in good vibes.) */}
      <HeroManifesto />

      {/* 프로그램 카드 */}
      <ProgramCards />

      {/* "AI 시대에 가장 중요한 건 나를 알아가는 것입니다" + 3스텝/폰 목업 */}
      <ComparisonSection />

      {/* 셀프 해킹 구성요소 4카드 */}
      <SelfHackingElements />

      {/* 유저 리뷰 */}
      <Testimonials />

      {/* 상담 프라이싱 */}
      <PricingTable />
    </div>
  );
}
