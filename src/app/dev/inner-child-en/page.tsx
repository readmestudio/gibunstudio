"use client";

/**
 * [개발 미리보기] /dev/inner-child-en
 *
 * 영어 무료 리포트(InnerChildEnFreeReport)를 로그인·DB 없이 16유형별로 확인한다.
 * 2026-07-18 리포트가 KR 판매페이지 구조로 전면 이식되면서 지형/지킴이/두 번째 아이 카드가
 * score 를 요구한다 → 여기서 목(mock) score 와 샘플 concern 을 주입해 **전체 흐름**을 렌더한다
 * (실서비스는 blob.score_result / computeScore 로 채운다). free={null} 이면 staticPortrait 폴백.
 * (배포 화면과 무관, 언제든 삭제 가능.)
 */

import { useState, type CSSProperties } from "react";
import { InnerChildEnFreeReport } from "@/components/minds/inner-child/en/report/InnerChildEnFreeReport";
import { EN_TYPE_CARDS, getEnTypeCard } from "@/lib/minds/inner-child/en/type-cards";
import type { TypeCard } from "@/lib/minds/inner-child/report-types";
import type { ScoreResult } from "@/lib/minds/inner-child/types";

const IDS = Object.keys(EN_TYPE_CARDS);

const SAMPLE_CONCERN =
  "Whenever a friend takes a while to reply, I spiral and assume I did something wrong.";

/** 프리뷰용 합성 score — 지형/지킴이/두 번째 아이 카드를 띄우기 위한 더미(실데이터 아님). */
function mockScore(card: TypeCard, secondId: string): ScoreResult {
  const second = getEnTypeCard(secondId);
  return {
    test_version: "v2.0",
    crisis_flag: false,
    areas: {
      disconnection: { score: 22, rank: 1 },
      overvigilance: { score: 18, rank: 2 },
      other_directedness: { score: 11, rank: 3 },
      impaired_autonomy: { score: 7, rank: 4 },
    },
    primary_child: {
      schema_id: card.schema_id,
      child_name: card.child_name,
      score: 22,
      conditional: card.conditional,
    },
    secondary_children: second
      ? [{ schema_id: second.schema_id, child_name: second.child_name, score: 15, conditional: second.conditional }]
      : [],
    entitlement_score: 3,
    guardian: { type: "avoidance", label: "재우는 지킴이", answers: ["avoidance", "avoidance", "surrender"] },
    sct: {
      childhood_self: "",
      inner_voice: "",
      family_rule: "",
      regression_trigger: "",
      escape_behavior: "",
    },
  };
}

export default function InnerChildEnDevPage() {
  const [id, setId] = useState(IDS[0]);
  const card = getEnTypeCard(id);
  const secondId = IDS.find((s) => s !== id) ?? id;

  return (
    <div style={{ position: "relative" }}>
      <select
        value={id}
        onChange={(e) => setId(e.target.value)}
        style={selectStyle}
      >
        {IDS.map((s) => (
          <option key={s} value={s}>
            {getEnTypeCard(s)?.child_name ?? s}
          </option>
        ))}
      </select>

      {card ? (
        <InnerChildEnFreeReport
          key={id}
          card={card}
          score={mockScore(card, secondId)}
          free={null}
          concern={SAMPLE_CONCERN}
          leadId="preview"
        />
      ) : (
        <div style={{ height: "100dvh", background: "#15120D", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <p style={{ color: "#EDE4D3", fontFamily: "'Pretendard',sans-serif", textAlign: "center" }}>
            (type card not written — {id})
          </p>
        </div>
      )}
    </div>
  );
}

const selectStyle: CSSProperties = {
  position: "fixed",
  top: 12,
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 80,
  background: "#211D18",
  color: "#EDE4D3",
  border: "1px solid rgba(237,228,211,.25)",
  borderRadius: 8,
  padding: "6px 10px",
  fontSize: 13,
  fontFamily: "ui-monospace,Menlo,monospace",
};
