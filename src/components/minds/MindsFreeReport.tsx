"use client";

/**
 * /minds 4단계 — 무료 리포트 "내 마음 속에 사는 마음들" (카드 캐러셀).
 *
 *   [커버] → [캐릭터 1..N] → [개념] → [배역 설명] → [이유] → [좋은 점]
 *          → [당신의 무대 · 잠긴 배역표] → [프라이싱]
 *
 * 한 장씩 넘겨보는 드라마 인물 소개 형식. 캐릭터 카드(이름·초상·줄글 리포트·인용)는
 * 무료. 이후 아웃트로 6장이 "왜 배역을 알아야 하는가 → 당신의 무대 → 결제"로
 * 서서히 몰입시키며, 마지막에 잠긴 배역표와 프라이싱으로 전환을 만든다.
 *
 * 카드 넘김은 검증된 husband-match CardCarousel을 재사용한다(스와이프+화살표+도트).
 */

import { CardCarousel } from "@/components/husband-match/CardCarousel";
import type { PartsMap } from "@/lib/self-workshop/core-belief-excavation";
import { buildCharacterViews } from "@/lib/minds/characters";
import { MindsCoverCard } from "./MindsCoverCard";
import { MindsCharacterCard } from "./MindsCharacterCard";
import {
  MindsConceptCard,
  MindsRolesCard,
  MindsWhyCard,
  MindsBenefitCard,
  MindsActiveStageCard,
  MindsPricingCard,
} from "./MindsOutroCards";

export function MindsFreeReport({ partsMap }: { partsMap: PartsMap }) {
  const views = buildCharacterViews(partsMap);

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
    // 아웃트로 — 서서히 전환되는 6장 시퀀스
    <MindsConceptCard key="concept" />,
    <MindsRolesCard key="roles" />,
    <MindsWhyCard key="why" />,
    <MindsBenefitCard key="benefit" />,
    <MindsActiveStageCard key="stage" views={views} />,
    <MindsPricingCard key="pricing" />,
  ];

  return (
    <div className="w-full">
      <CardCarousel cards={cards} />
    </div>
  );
}
