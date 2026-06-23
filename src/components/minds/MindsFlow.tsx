"use client";

/**
 * 무료 "마음 확인"(/minds) 상태머신 오케스트레이터.
 *
 *   landing → capture → conversation → report
 *
 * 공유 상태(리드·대화기록·마음지도)를 들고 단계를 전환한다. 현재는 *골격* —
 * 대화 종료 시 답변에서 목(mock) PartsMap을 구성해 리포트를 끝까지 보여준다.
 * (TODO 표시: 공개 parts-map API·리드 저장 배선은 다음 단계.)
 */

import { useState } from "react";
import type { PartsMap } from "@/lib/self-workshop/core-belief-excavation";
import { MindsLanding } from "./MindsLanding";
import { MindsLeadCapture, type MindsLead } from "./MindsLeadCapture";
import { MindsConversation, type MindAnswer } from "./MindsConversation";
import { MindsFreeReport } from "./MindsFreeReport";

type Phase = "landing" | "capture" | "conversation" | "report";

export function MindsFlow() {
  const [phase, setPhase] = useState<Phase>("landing");
  const [, setLead] = useState<MindsLead | null>(null);
  const [partsMap, setPartsMap] = useState<PartsMap | null>(null);

  return (
    <div className="mx-auto w-full max-w-[448px] px-6 py-8 sm:py-10">
      {phase === "landing" && (
        <MindsLanding onStart={() => setPhase("capture")} />
      )}

      {phase === "capture" && (
        <MindsLeadCapture
          onSubmit={(lead) => {
            setLead(lead);
            setPhase("conversation");
          }}
          onBack={() => setPhase("landing")}
        />
      )}

      {phase === "conversation" && (
        <MindsConversation
          onComplete={(answers) => {
            // TODO(다음 단계): 공개 /api/minds/parts-map 호출로 교체.
            // 지금은 답변에서 목 마음지도를 구성해 리포트를 끝까지 보여준다.
            setPartsMap(buildMockPartsMap(answers));
            setPhase("report");
          }}
        />
      )}

      {phase === "report" && partsMap && (
        <MindsFreeReport partsMap={partsMap} />
      )}
    </div>
  );
}

/* ─────────────── 골격용 목 마음지도 ───────────────
 *
 * 실제 분석(LLM parts-map)을 붙이기 전, 사용자가 적은 답에서 최소한 "납득되는"
 * 마음 2개를 구성한다. 캐릭터 카드만 무료로 보이므로 leader_id/conflicts는
 * 페이월 티저(목 블러)용으로만 채운다. 진짜 분석으로 교체될 자리.
 */
function buildMockPartsMap(answers: MindAnswer[]): PartsMap {
  const byId = (id: string) =>
    answers.find((a) => a.id === id)?.answer.trim() ?? "";
  const loudest = byId("loudest_voice");
  const situation = byId("situation");
  const counter = byId("counter_voice");
  const other = byId("other_minds");

  const trim = (s: string, n = 60) =>
    s.length > n ? `${s.slice(0, n - 1)}…` : s;

  const parts: PartsMap["parts"] = [
    {
      id: "p1",
      name: "더 해야 한다고 다그치는 마음",
      traits: ["성취 압박", "통제"],
      catchphrase: trim(loudest || "더 해야 해, 멈추면 안 돼", 24),
      evidence_quote: trim(loudest || situation),
      role: "manager",
    },
    {
      id: "p2",
      name: counter ? "다르게 속삭이는 마음" : "이제는 멈추고 쉬고 싶은 마음",
      traits: counter ? ["반대 방향", "쉼"] : ["피로", "쉼"],
      catchphrase: "이제 좀 쉬어도 되지 않을까",
      evidence_quote: trim(counter || situation),
      role: "exile",
    },
  ];

  // 5번 질문에서 또 다른 마음을 적었으면 세 번째 캐릭터로 추가.
  if (other) {
    parts.push({
      id: "p3",
      name: "한켠에서 또 다른 목소리를 낸 마음",
      traits: ["또 다른 목소리"],
      catchphrase: trim(other, 24),
      evidence_quote: trim(other),
      role: "unclear",
    });
  }

  return {
    parts,
    leader_id: "p1",
    conflicts: [
      {
        a: "p1",
        b: "p2",
        reason:
          "한 마음은 더 몰아붙이려 하고, 다른 마음은 멈추고 쉬고 싶어 해서 자주 부딪쳐요",
      },
    ],
    summary:
      "당신 안에는 끊임없이 더 하라고 다그치는 마음과, 이제는 멈추고 쉬고 싶은 마음이 함께 있어요.",
    source: "dialogue",
    generated_at: new Date().toISOString(),
  };
}
