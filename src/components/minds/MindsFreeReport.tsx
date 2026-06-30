"use client";

/**
 * /minds 4단계 — 무료 리포트 "내 마음 속에 사는 마음들" (카드 캐러셀).
 *
 *   [커버] → [캐릭터 1..N] → [개념] → [배역 설명] → [당신의 무대 · 잠긴 배역표]
 *          → [프라이싱] → [이유] → [좋은 점]
 *
 * 한 장씩 넘겨보는 드라마 인물 소개 형식. 캐릭터 카드(이름·초상·줄글 리포트·인용)는
 * 무료. 이후 아웃트로가 "왜 배역을 알아야 하는가 → 당신의 무대 → 결제"로 서서히
 * 몰입시킨다. 프라이싱(페이월) *이후* 장(이유·좋은 점)은 전환을 한 번 더 끌어올리는
 * 잔상 — 그래서 이 장들에는 항상 결제 CTA가 따라붙는다.
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
import { MindsCheckoutModal } from "./MindsCheckoutModal";
import { MindsCoverCard } from "./MindsCoverCard";
import { MindsCharacterCard } from "./MindsCharacterCard";
import {
  MindsSummaryCard,
  MindsConceptCard,
  MindsRolesCard,
  MindsActiveStageCard,
  MindsPricingCard,
  MindsCategoryReviewCard,
  MindsWhyBenefitCard,
} from "./MindsOutroCards";

export function MindsFreeReport({ partsMap }: { partsMap: PartsMap }) {
  const views = buildCharacterViews(partsMap);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

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
      currency: "KRW",
    });
    // ③ 운영자 슬랙 알림 — 결제 의향 신호(sendBeacon).
    trackMindsFunnel("checkout_click");
    // 워크북 페이지로 이동하지 않고, 그 자리에서 결제 모달을 연다(₩9,900 리포트).
    setCheckoutOpen(true);
  };

  const cards = [
    <MindsCoverCard key="cover" views={views} />,
    ...views.map((v, i) => (
      <MindsCharacterCard
        key={v.archetype.id}
        view={v}
        index={i}
        total={views.length}
      />
    )),
    // 3 배역 다음 — 답변+배역을 합친 개인화 요약 한 장
    <MindsSummaryCard key="summary" summary={partsMap.summary} views={views} />,
    // 아웃트로 — 개념·배역 → 당신의 무대 → 판매 3장
    <MindsConceptCard key="concept" />,
    <MindsRolesCard key="roles" />,
    <MindsActiveStageCard key="stage" views={views} />,
    // 판매 3장(모든 CTA → 결제 모달): 분석완료+배역표 → 카테고리+후기 → Why+Benefit
    <MindsPricingCard key="analysis" onCheckout={openCheckout} />,
    <MindsCategoryReviewCard key="categories" onCheckout={openCheckout} />,
    <MindsWhyBenefitCard key="whybenefit" onCheckout={openCheckout} />,
  ];

  return (
    <div className="w-full">
      <CardCarousel cards={cards} />
      {/* 페이월 CTA → 그 자리에서 결제 모달(₩9,900 관계 해설 리포트). */}
      <MindsCheckoutModal open={checkoutOpen} onClose={() => setCheckoutOpen(false)} />
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
