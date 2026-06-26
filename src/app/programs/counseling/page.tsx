import type { Metadata } from "next";
import "./counseling-theme.css";
import { Hero } from "./_components/Hero";
import { NeedSection } from "./_components/NeedSection";
import { FixSection } from "./_components/FixSection";
import { Counselor } from "./_components/Counselor";
import { Pricing } from "./_components/Pricing";
import { Curriculum } from "./_components/Curriculum";
import { GptSection } from "./_components/GptSection";
import { KeepSection } from "./_components/KeepSection";
import { Reviews } from "./_components/Reviews";
import { Faq } from "./_components/Faq";
import { FinalCta } from "./_components/FinalCta";
import { Footer } from "./_components/Footer";
import { StickyKakao } from "./_components/StickyKakao";
import { RevealController } from "./_components/RevealController";

export const metadata: Metadata = {
  title: "기분 심리상담소 | 1:1 심리 상담",
  description:
    "쉬라는 말이 와닿지 않는 성취중독 불안이들을 위한 1:1 심리 상담. 1급 심리상담사와 함께하는 8회차 구조화 커리큘럼 — 유료 검사·해석·사후 리포트까지 한 가격에 포함.",
};

/**
 * 기분 심리상담소 1:1 상담 상세페이지 — `/programs/counseling`.
 *
 * 디자인 기준: design_handoff_counseling_detail (다크 히어로 + 오렌지 강조).
 * 모든 스타일은 `counseling-theme.css`에서 `.counseling-page` 스코프로 격리해
 * 사이트의 기존 모노톤 토큰(노란 --accent)과 충돌하지 않는다.
 *
 * 섹션 순서(핸드오프 c05-app.jsx 렌더 순서 기준):
 *   Hero → Need → Fix → Counselor → Pricing → Curriculum →
 *   Gpt → Keep → Reviews → Faq → FinalCta → Footer → StickyKakao
 */
export default function ProgramCounselingPage() {
  return (
    <div className="counseling-page">
      <Hero />
      <NeedSection />
      <FixSection />
      <Counselor />
      <Pricing />
      <Curriculum />
      <GptSection />
      <KeepSection />
      <Reviews />
      <Faq />
      <FinalCta />
      <Footer />
      <StickyKakao />
      <RevealController />
    </div>
  );
}
