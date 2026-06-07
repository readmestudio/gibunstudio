"use client";

import { useState } from "react";
import {
  Body,
  D,
  EditorialInput,
  Mono,
} from "@/components/self-workshop/clinical-report/v3-shared";
import {
  type ConversationTurn,
  type StepKey,
} from "@/lib/self-workshop/conversation";

interface Props {
  stepKey: StepKey;
  /** 이 reflection을 식별하는 slug (보통 신념 source). dialogue turn의 explore_point_id. */
  pointId: string;
  /** IFS 오프닝 질문 (한국어). */
  opening: string;
  /** explore-followup에 보낼 ≤200자 맥락 (선택). */
  priorSummary?: string;
  /** 이어하기용 기존 turns (이 pointId 것). */
  initialTurns?: ConversationTurn[];
  /** turns 변경 시 호출 — 호스트가 dialogue에 병합·저장. */
  onTurnsChange: (turns: ConversationTurn[]) => void;
}

/**
 * 거대 위저드(Step 7·8) 안에 끼워 넣는 경량 IFS 성찰.
 * 오프닝 질문 1개 + 얕으면 후속 1개(하드캡). 완료되면 답을 정적으로 보여준다.
 * 어떤 LLM 실패든 "완료"로 처리해 위저드 흐름을 막지 않는다.
 */
const MAX_FOLLOWUP = 1;

export function InlineReflection({
  stepKey,
  pointId,
  opening,
  priorSummary,
  initialTurns,
  onTurnsChange,
}: Props) {
  const hadPrior = (initialTurns?.length ?? 0) > 0;
  const [turns, setTurns] = useState<ConversationTurn[]>(initialTurns ?? []);
  const [question, setQuestion] = useState(opening);
  const [followupCount, setFollowupCount] = useState(0);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(hadPrior);

  async function submit() {
    const answer = draft.trim();
    if (!answer || loading) return;
    setLoading(true);
    try {
      let sufficient = true;
      let followup = "";
      if (followupCount < MAX_FOLLOWUP) {
        const res = await fetch("/api/self-workshop/explore-followup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step_key: stepKey,
            explore_point_id: pointId,
            question,
            answer,
            turn_index: followupCount,
            prior_summary: priorSummary ?? "",
          }),
        });
        if (res.ok) {
          const j = (await res.json()) as {
            sufficient?: boolean;
            followup?: string;
          };
          sufficient = j.sufficient !== false;
          followup = typeof j.followup === "string" ? j.followup.trim() : "";
        }
      }

      const willFollowUp =
        !sufficient && followup.length > 0 && followupCount < MAX_FOLLOWUP;

      const turn: ConversationTurn = {
        explore_point_id: pointId,
        turn_index: followupCount,
        question,
        answer,
        was_followup: followupCount > 0,
        sufficient: willFollowUp ? false : true,
        asked_at: new Date().toISOString(),
      };
      const nextTurns = [...turns, turn];
      setTurns(nextTurns);
      onTurnsChange(nextTurns);

      if (willFollowUp) {
        setQuestion(followup);
        setFollowupCount((c) => c + 1);
        setDraft("");
      } else {
        setDone(true);
      }
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    const lastAnswer = turns.length ? turns[turns.length - 1].answer : "";
    return (
      <div>
        <Mono size={10} weight={600} color={D.text3} tracking={0.14}>
          ✓ 함께 짚어봤어요
        </Mono>
        {lastAnswer && (
          <Body small muted style={{ marginTop: 8, whiteSpace: "pre-line" }}>
            {lastAnswer}
          </Body>
        )}
      </div>
    );
  }

  return (
    <div>
      {followupCount > 0 && (
        <Mono size={10} weight={600} color={D.accent} tracking={0.14}>
          한 걸음 더
        </Mono>
      )}
      <Body style={{ fontWeight: 600, marginTop: followupCount > 0 ? 8 : 0 }}>
        {question}
      </Body>
      <EditorialInput
        multiline
        rows={3}
        value={draft}
        onChange={setDraft}
        maxLength={500}
        placeholder="떠오르는 대로 편하게 적어보세요"
        ariaLabel={`${pointId} 성찰`}
      />
      <div style={{ marginTop: 10 }}>
        <button
          onClick={() => void submit()}
          disabled={loading || draft.trim().length === 0}
          style={{
            fontFamily: D.font,
            fontWeight: 600,
            fontSize: 14,
            background: draft.trim().length === 0 ? D.hair : D.ink,
            color: "#fff",
            border: "none",
            borderRadius: 999,
            padding: "10px 20px",
            cursor: draft.trim().length === 0 ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {loading ? "듣는 중…" : "답하기"}
        </button>
      </div>
    </div>
  );
}
