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
 * 결제: 페이월/이후 카드의 CTA는 통일 결제 페이지(/payment/start)로 이동한다.
 * 거기서 워크북(₩49,000) 또는 심리상담(1회 ₩129,000 / 8회 ₩792,000)을 같은 가격으로
 * 선택해 결제한다 — 성취중독·멘탈헬스 테스트와 동일한 화면.
 *
 * 카드 넘김은 검증된 husband-match CardCarousel을 재사용한다(스와이프+화살표+도트).
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CardCarousel } from "@/components/husband-match/CardCarousel";
import { ReviewPopup } from "@/components/reviews/ReviewPopup";
import { MINDS_LEAD_STORAGE_KEY } from "@/lib/minds/storage";
import type { PartsMap } from "@/lib/self-workshop/core-belief-excavation";
import { buildCharacterViews } from "@/lib/minds/characters";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { trackMindsFunnel } from "@/lib/minds/track";
import { MindsCoverCard } from "./MindsCoverCard";
import { MindsCharacterCard } from "./MindsCharacterCard";
import {
  MindsSummaryCard,
  MindsConceptCard,
  MindsRolesCard,
  MindsWhyCard,
  MindsBenefitCard,
  MindsActiveStageCard,
  MindsPricingCard,
} from "./MindsOutroCards";

export function MindsFreeReport({ partsMap }: { partsMap: PartsMap }) {
  const views = buildCharacterViews(partsMap);
  const router = useRouter();

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
      content_name: "minds_to_store",
      currency: "KRW",
    });
    // ③ 운영자 슬랙 알림 — 결제 페이지로 이탈하기 직전 신호(sendBeacon).
    trackMindsFunnel("checkout_click");
    router.push("/payment/start");
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
    // 아웃트로 — 개념·배역 → 당신의 무대 → 페이월
    <MindsConceptCard key="concept" />,
    <MindsRolesCard key="roles" />,
    <MindsActiveStageCard key="stage" views={views} />,
    <MindsPricingCard key="pricing" onCheckout={openCheckout} />,
    // 페이월 이후 — 결제를 한 번 더 끌어올리는 장(상시 CTA 부착)
    <MindsWhyCard key="why" onCheckout={openCheckout} />,
    <MindsBenefitCard key="benefit" onCheckout={openCheckout} />,
  ];

  return (
    <div className="w-full">
      <CardCarousel cards={cards} />
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
