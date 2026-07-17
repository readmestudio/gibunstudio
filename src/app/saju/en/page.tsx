import type { Metadata } from "next";
import { SajuEnFlow } from "@/components/minds/saju/en/SajuEnFlow";

/**
 * /saju/en — English "Korean Saju" funnel (no login).
 *
 * inner-child 후속 병렬 퍼널. 사주팔자 × 자미두수 이중 엔진을 영어권에 판매하며,
 * 디자인은 한국어 inner-child의 "밤하늘 서사 ↔ 크림 카드" 시스템에 얼라인한다.
 * 현재는 프론트 퍼널만(명반 더미). 엔진·이메일 백엔드는 후속.
 */

export const metadata: Metadata = {
  title: "Korean Saju — Your birth chart, read the Korean way | GIBUN",
  description:
    "Two ancient Korean systems — Four Pillars and Purple Star — read the same moment you were born. In minutes, see the chart where they agree. (Beta)",
  robots: { index: false, follow: false },
};

export default function SajuEnPage() {
  return (
    <main className="min-h-screen" style={{ background: "#1C1813" }}>
      <SajuEnFlow />
    </main>
  );
}
