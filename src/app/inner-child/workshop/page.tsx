import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import { WorkshopLanding } from "./WorkshopLanding";

/**
 * /inner-child/workshop — "내면 아이 찾기 워크샵"(₩99,000) 판매 랜딩.
 *
 * 광고 전용 링크(별도 유입 경로)라 검색 노출은 막는다(noindex). 무료 퍼널(/inner-child)과
 * 별개의 직접 구매 상품 — 결제 성공 시 return 라우트가 intake 토큰을 발급해 사전진단으로
 * 이어진다. 디자인: 핸드오프 최종 시안(다크 타이포 브루탈리즘) — WorkshopLanding 참조.
 */

// 핸드오프의 라벨·번호·수치용 모노 폰트 — CSS 변수로 주입해 랜딩 서브트리에서
// var(--font-space-mono) 로 참조한다(Pretendard 는 앱 전역 로드 재사용).
const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "내면 아이 찾기 워크샵 · 기분 스튜디오",
  description:
    "심리도식 검사 + 1급 상담사 사전 분석 + 90분 1:1 세션 + 종합 리포트. 어른이 된 지금도 나 대신 반응하는 내면 아이를 만나는 워크샵.",
  robots: { index: false, follow: false },
};

export default function InnerChildWorkshopPage() {
  return (
    <div className={spaceMono.variable}>
      <WorkshopLanding />
    </div>
  );
}
