import type { Metadata } from "next";
import { InnerChildEnFlow } from "@/components/minds/inner-child/en/InnerChildEnFlow";

/**
 * /inner-child/en — English "Find your inner child" funnel (no login).
 *
 * 한국어 /inner-child 와 테스트·무료/유료 리포트 경험은 동일하되, 로그인 관문이 없고
 * (무료 리포트까지 비로그인 열람), 해외 결제 미지원이라 유료 결제 대신 이메일 요청(베타
 * 무료 발송)으로 갈린다. 채점 엔진·스토어·타입은 한국어와 공유하고 콘텐츠만 영어로 포크했다.
 */

export const metadata: Metadata = {
  title: "Find Your Inner Child | GIBUN",
  description:
    "Some moments shake you far harder than they should. At the root of that reaction is an old inner child. In 3 minutes, meet the child reacting the loudest in you right now. (Free)",
  robots: { index: false, follow: false },
};

export default function InnerChildEnPage() {
  return (
    <main className="min-h-screen" style={{ background: "#050506" }}>
      <InnerChildEnFlow />
    </main>
  );
}
