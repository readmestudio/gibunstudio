"use client";

/**
 * Step 4 마무리 — 내면 파츠맵 섹션 래퍼 (Classic·Adaptive 두 모드 공용).
 *
 * - savedData(core_belief_excavation)에 parts_map 캐시가 있으면 즉시 렌더(멱등).
 * - 없으면 /api/self-workshop/parts-map 을 1회 POST 해서 생성.
 * - 로딩 중 안내, 실패/빈 결과는 섹션 자체를 조용히 숨김(마무리 흐름 방해 금지).
 * - 표시 전용 — 저장/이동 버튼 없음(API가 이미 merge 저장).
 *
 * source 만 prop 으로 다르게: Classic="sct", Adaptive="dialogue".
 */

import { useEffect, useRef, useState } from "react";
import {
  readPartsMap,
  type PartsMap,
} from "@/lib/self-workshop/core-belief-excavation";
import {
  Body,
  D,
  Mono,
} from "@/components/self-workshop/clinical-report/v3-shared";
import { PartsRelationshipMap } from "./PartsRelationshipMap";

interface Props {
  workshopId: string;
  source: "sct" | "dialogue";
  /** core_belief_excavation 원본 — parts_map 캐시 복원용. */
  savedData?: unknown;
}

export function PartsMapSection({ workshopId, source, savedData }: Props) {
  const cached = readPartsMap(savedData);
  const [partsMap, setPartsMap] = useState<PartsMap | null>(cached);
  const [loading, setLoading] = useState(!cached);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (cached) return; // 캐시 사용 — fetch 불필요.
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    void (async () => {
      // 네트워크 일시 오류로 마음 캐릭터가 사라지지 않도록 최대 2회 시도.
      // 서버는 입력이 있으면 (LLM 실패 시에도) 폴백 parts_map을 반드시 돌려준다.
      let result: PartsMap | null = null;
      for (let attempt = 0; attempt < 2 && !result; attempt++) {
        try {
          const res = await fetch("/api/self-workshop/parts-map", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workshopId, source }),
          });
          const j = (await res.json()) as { parts_map?: unknown };
          result = readPartsMap({ parts_map: j.parts_map });
        } catch {
          // 다음 시도로.
        }
      }
      setPartsMap(result);
      setLoading(false);
    })();
  }, [cached, workshopId, source]);

  if (loading) {
    return (
      <section className="space-y-3">
        <Mono size={10} weight={600} color={D.accent} tracking={0.16}>
          ● 내 안의 마음들
        </Mono>
        <Body muted style={{ fontStyle: "italic" }}>
          지금까지 적은 답을 바탕으로, 내 안의 마음들을 그려보고 있어요…
        </Body>
      </section>
    );
  }

  // 실패·빈 결과 → 섹션 숨김(마무리 흐름을 막지 않음).
  if (!partsMap || partsMap.parts.length === 0) return null;

  return <PartsRelationshipMap partsMap={partsMap} />;
}
