"use client";

/**
 * /minds 4단계 — 무료 리포트 "내 마음 속에 사는 마음들" (카드 캐러셀).
 *
 *   [커버] → [캐릭터 1(리더·전체 공개)] → [캐릭터 2..N(블러+잠금 해제 CTA)]
 *          → [개념] → [프라이싱] → [이유] → [좋은 점]
 *
 * 한 장씩 넘겨보는 드라마 인물 소개 형식. 첫 캐릭터(리더)는 속마음까지 전부 공개해
 * "제대로 된 분석"을 체감시키고, 나머지 마음들은 메인 카피 아래를 블러로 가려
 * "지금 바로 잠금 해제하기" CTA 로 결제를 유도한다. 이후 아웃트로(개념 → 결제 3장)가
 * 몰입을 한 번 더 끌어올린다 — 그래서 이 장들에는 항상 결제 CTA가 따라붙는다.
 *
 * 결제: 페이월/이후 카드의 CTA는 페이지 이동 없이 그 자리에서 MindsCheckoutModal 을
 * 띄운다. 판매 상품은 "다섯 배역 + 관계 해설" 리포트(₩9,900) — 비로그인 leadId 결제 →
 * 승인 후 /minds/relationship/[id] 리포트 페이지로 이동.
 *
 * 카드 넘김은 검증된 husband-match CardCarousel을 재사용한다(스와이프+화살표+도트).
 */

import { useEffect, useState } from "react";
import { CardCarousel } from "@/components/husband-match/CardCarousel";
import { ReviewPopup } from "@/components/reviews/ReviewPopup";
import { MINDS_LEAD_STORAGE_KEY } from "@/lib/minds/storage";
import type { PartsMap } from "@/lib/self-workshop/core-belief-excavation";
import { buildCharacterViews } from "@/lib/minds/characters";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { trackMindsFunnel } from "@/lib/minds/track";
import { reportPricing } from "@/lib/minds/price-experiment";
import { MindsCheckoutModal } from "./MindsCheckoutModal";
import { MindsCoverCard } from "./MindsCoverCard";
import { MindsCharacterCard } from "./MindsCharacterCard";
import {
  MindsConceptCard,
  MindsPricingCard,
  MindsCategoryReviewCard,
  MindsWhyBenefitCard,
} from "./MindsOutroCards";

export function MindsFreeReport({ partsMap, leadId }: { partsMap: PartsMap; leadId?: string }) {
  const views = buildCharacterViews(partsMap);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  // 유료 리포트 단일가(₩9,900) — 표시·픽셀 전용이며 실제 결제 금액은 서버가 재확정한다(단일 출처).
  const pricing = reportPricing(leadId);

  // 카카오 로그인 복귀 자동 결제 재개 — 인증 관문에서 카카오로 로그인하면 /auth/callback 이
  // /minds/r/[leadId]?checkout=1 로 되돌려보낸다. 그 표식을 보면 결제 모달을 자동으로 다시
  // 연다(이제 로그인 상태라 모달이 곧장 결제 화면을 보여준다). 표식은 URL 에서 즉시 지운다.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") !== "1") return;
    // 표식은 URL 에서 즉시 지운다(새로고침/뒤로가기 재트리거 방지).
    const url = window.location.pathname + window.location.hash;
    window.history.replaceState(null, "", url);
    // 모달 열기는 마이크로태스크로 미뤄 effect 동기 본문에서 setState 하지 않는다.
    const id = window.setTimeout(() => setCheckoutOpen(true), 0);
    return () => window.clearTimeout(id);
  }, []);

  // 페이월(MindsPricingCard) 카드에 도달하면 후기 팝업의 이탈 감지를 켠다.
  // 페이월을 본 방문자만 대상으로 하기 위해, 카드가 쏘는 window 이벤트를 듣고 무장한다.
  const [paywallReached, setPaywallReached] = useState(false);
  useEffect(() => {
    const onReached = () => setPaywallReached(true);
    window.addEventListener("minds:paywall-reached", onReached);
    return () => window.removeEventListener("minds:paywall-reached", onReached);
  }, []);
  const openCheckout = () => {
    trackMetaEvent("InitiateCheckout", {
      content_name: "minds_to_relationship",
      value: pricing.price,
      currency: "KRW",
    });
    // ③ 운영자 슬랙 알림 — 결제 의향 신호(sendBeacon).
    trackMindsFunnel("checkout_click");
    // 워크북 페이지로 이동하지 않고, 그 자리에서 결제 모달을 연다(₩9,900 리포트).
    setCheckoutOpen(true);
  };

  const cards = [
    <MindsCoverCard key="cover" views={views} />,
    // 첫 캐릭터(리더, index 0)는 속마음까지 전부 공개(full), 나머지 마음은 메인 카피
    // 아래를 블러로 가리고 "지금 바로 잠금 해제하기" CTA 로 결제를 유도(teaser).
    ...views.map((v, i) => (
      <MindsCharacterCard
        key={v.archetype.id}
        view={v}
        index={i}
        total={views.length}
        variant={i === 0 ? "full" : "teaser"}
        onUnlock={openCheckout}
      />
    )),
    // 아웃트로 — 개념 → 판매 3장 (배역 설명·당신의 무대 카드는 제거)
    // (개인화 요약 카드는 유료 리포트로 이관 — 무료는 리더 1장 전체 공개까지만)
    <MindsConceptCard key="concept" />,
    // 판매 3장(모든 CTA → 결제 모달): 분석완료+배역표 → 카테고리+후기 → Why+Benefit
    <MindsPricingCard key="analysis" onCheckout={openCheckout} price={pricing.price} originalPrice={pricing.originalPrice} />,
    <MindsCategoryReviewCard key="categories" onCheckout={openCheckout} price={pricing.price} originalPrice={pricing.originalPrice} />,
    <MindsWhyBenefitCard key="whybenefit" onCheckout={openCheckout} price={pricing.price} originalPrice={pricing.originalPrice} />,
  ];

  return (
    <div className="w-full">
      <CardCarousel cards={cards} />
      {/* 페이월 CTA → 그 자리에서 결제 모달(관계 해설 리포트). 표시가는 단일가(₩9,900). */}
      <MindsCheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        priceOverride={{ price: pricing.price, originalPrice: pricing.originalPrice }}
      />
      {/* 페이월을 본 뒤, 결제 없이 이탈하려는 순간 후기 팝업. minds 는 leadId 로 누가 썼는지 잇는다. */}
      <ReviewPopup
        testType="minds"
        armed={paywallReached}
        getLeadId={() => {
          try {
            return localStorage.getItem(MINDS_LEAD_STORAGE_KEY);
          } catch {
            return null;
          }
        }}
      />
    </div>
  );
}
