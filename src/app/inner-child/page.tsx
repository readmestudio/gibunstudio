import type { Metadata } from "next";
import { InnerChildFlow } from "@/components/minds/inner-child/InnerChildFlow";

/**
 * /inner-child — 무료 "내면 아이 찾기" 공개 깔때기 (비로그인).
 *
 * /minds 와 경험은 동일하되(첫 화면·로딩·결제·인증 UI 공유), 테스트 문항과 리포트
 * 내용만 다른 병렬 퍼널. 랜딩은 MindsLanding 을 그대로 재사용하고, 상태머신만
 * InnerChildFlow 로 갈라진다(§1). /minds 는 무접촉 — 회귀 위험 0.
 */

export const metadata: Metadata = {
  title: "내 무의식 속 내면 아이 찾기 | GIBUN",
  description:
    "똑같은 상황에서 유독 크게 흔들리는 순간, 그 반응의 뿌리에는 오래된 내면의 아이가 있습니다. 3분이면 지금 가장 크게 반응하는 아이를 만나볼 수 있어요. (무료)",
  robots: { index: false, follow: false },
};

export default function InnerChildPage() {
  return (
    <main className="min-h-screen" style={{ background: "#F7F4EE" }}>
      <InnerChildFlow />
    </main>
  );
}
