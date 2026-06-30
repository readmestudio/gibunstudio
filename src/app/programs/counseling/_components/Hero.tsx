import Link from "next/link";
import { ChatIcon } from "./Icons";
import { MeshGradientBg } from "./MeshGradientBg";

/**
 * [1] HERO — 다크. 텍스트만 중앙 정렬, 일렁이는 셰이더 배경 + 격자.
 * CTA 1개(상담 시작하기) — 입문가(1회 체험) 결제 페이지로 연결.
 */
export function Hero() {
  return (
    <section className="c-hero dark">
      <MeshGradientBg />
      <div className="grid-bg" />
      <div className="wrap-4 c-hero-inner">
        <div className="f-up">
          <span className="eyebrow on-dark">
            <span className="dot" />
            1:1 PSYCHOLOGICAL COUNSELING
          </span>
        </div>
        <h1 className="f-blur">
          명상은 어렵고,
          <br />
          병원은 <em>부담스럽다면?</em>
        </h1>
        <p className="sub f-up delay-1">
          IFS와 인지행동치료 기반으로 1급 심리상담사가 직접 상담합니다
        </p>
        <div className="f-up delay-3">
          <Link href="/payment/counseling/trial" className="cta-pill accent">
            <ChatIcon /> 상담 시작하기 <span className="arrow">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
