"use client";

/**
 * [개발 미리보기] /dev/inner-child-preview
 *
 * 테스트/결제 없이 리포트 화면을 유형별로 바로 확인하기 위한 dev 전용 페이지.
 * 상단 컨트롤: (1) 무료/유료 전환 (2) 16유형 전환.
 * 무료=InnerChildFreeReport, 유료=InnerChildPaidView 를 목 데이터로 렌더한다.
 * (프로필 일러스트 + 상단바 확인용. 배포 화면과 무관, 언제든 삭제 가능.)
 */

import { useState } from "react";
import { InnerChildFreeReport } from "@/components/minds/inner-child/report/InnerChildFreeReport";
import { InnerChildPaidView } from "@/app/inner-child/full/[id]/InnerChildPaidView";
import { TYPE_CARDS, getTypeCard } from "@/lib/minds/inner-child/type-cards";
import type { ScoreResult } from "@/lib/minds/inner-child/types";
import type { PaidReportGenerated, FreeReportGenerated } from "@/lib/minds/inner-child/report-types";

const IDS = Object.keys(TYPE_CARDS);

// 대표 아이 = 선택 유형, 두 번째 아이 = 목록상 다음 유형(순환).
function mockScore(schemaId: string): ScoreResult {
  const card = getTypeCard(schemaId)!;
  const secId = IDS[(IDS.indexOf(schemaId) + 1) % IDS.length];
  const secCard = getTypeCard(secId)!;
  return {
    test_version: "v2.0",
    crisis_flag: false,
    areas: {},
    primary_child: { schema_id: schemaId, child_name: card.child_name, score: 20, conditional: false },
    secondary_children: [{ schema_id: secId, child_name: secCard.child_name, score: 12, conditional: false }],
    entitlement_score: 0,
    guardian: { type: "avoidance", label: "피하는 지킴이", answers: [] },
    sct: {
      core_word: "괜찮아",
      body_reaction: "가슴이 답답",
      family_rule: "티내지 않아야",
      regression_trigger: "혼자 결정을 내려야",
      escape_behavior: "잠",
    },
  } as unknown as ScoreResult;
}

const MOCK_FREE: FreeReportGenerated = {
  gap: "겉으로는 담담하고 무던해 보이지만, 속에서는 관계의 온도를 끊임없이 재고 있습니다. (미리보기용 예시 문장)",
  relation_pattern: "가까워질수록 확인이 늘고, 상대의 미세한 변화에 마음이 크게 흔들립니다. (미리보기용 예시 문장)",
};

const MOCK_PAID: PaidReportGenerated = {
  loop_narrative:
    "같은 장면이 반복됩니다. 작은 신호를 크게 읽고, 미리 대비하려다 오히려 관계를 흔드는 흐름이에요. (미리보기용 예시 문장)",
  second_child_relation: "두 번째 아이는 첫 번째 아이가 지칠 때 슬며시 올라옵니다. (미리보기용 예시 문장)",
  guardian_anatomy: "이 지킴이는 당신을 지키려 앞장서지만, 때로는 필요 이상으로 오래 머뭅니다. (미리보기용 예시 문장)",
  core_need_bridge: "이 아이가 정말 원했던 것은 확실성이 아니라, 지금 이 순간의 연결입니다. (미리보기용 예시 문장)",
  reparenting: {
    scene: "당신은 「혼자 결정을 내려야」 할 때 어린아이가 된 것 같다고 썼습니다. 다음에 그 순간이 오면—",
    steps: [
      { title: "알아차리는 신호", body: "가슴이 답답해질 때, 그게 신호예요. (미리보기용 예시 문장)" },
      { title: "그때 할 한 가지", body: "결정을 미루지 말고, 작은 것 하나만 스스로 정해보세요. (미리보기용 예시 문장)" },
    ],
  },
  closing: "당신은 이미 그 아이를 알아차렸습니다. 그것만으로 충분한 시작이에요. (미리보기용 예시 문장)",
};

export default function Page() {
  const [id, setId] = useState(IDS[0]);
  const [paid, setPaid] = useState(false);
  const card = getTypeCard(id)!;

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          position: "fixed",
          top: 10,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 80,
          display: "flex",
          gap: 8,
          alignItems: "center",
          background: "rgba(0,0,0,.6)",
          border: "1px solid rgba(255,255,255,.2)",
          borderRadius: 999,
          padding: "6px 10px",
          backdropFilter: "blur(6px)",
        }}
      >
        <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,.08)", borderRadius: 999, padding: 2 }}>
          {([["무료", false], ["유료", true]] as const).map(([label, v]) => (
            <button
              key={label}
              type="button"
              onClick={() => setPaid(v)}
              style={{
                border: "none",
                borderRadius: 999,
                padding: "4px 12px",
                fontSize: 12,
                cursor: "pointer",
                background: paid === v ? "#FF5A1F" : "transparent",
                color: paid === v ? "#fff" : "rgba(255,255,255,.7)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          value={id}
          onChange={(e) => setId(e.target.value)}
          style={{
            background: "#141519",
            color: "#fff",
            border: "1px solid rgba(255,255,255,.25)",
            borderRadius: 8,
            padding: "5px 8px",
            fontSize: 13,
          }}
        >
          {IDS.map((s) => (
            <option key={s} value={s}>
              {getTypeCard(s)!.child_name}
            </option>
          ))}
        </select>
      </div>

      {paid ? (
        <InnerChildPaidView
          key={`paid-${id}`}
          purchaseId="preview"
          status="confirmed"
          initialReport={MOCK_PAID}
          score={mockScore(id)}
          free={MOCK_FREE}
        />
      ) : (
        <InnerChildFreeReport key={`free-${id}`} card={card} score={mockScore(id)} />
      )}
    </div>
  );
}
