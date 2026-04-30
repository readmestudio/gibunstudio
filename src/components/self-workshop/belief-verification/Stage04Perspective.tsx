"use client";

import type { Stage04Perspective as Stage04Data } from "@/lib/self-workshop/belief-verification";
import { Mono } from "@/components/self-workshop/clinical-report/shared/Mono";
import { QuoteBlock } from "./shared/QuoteBlock";
import { ReceiptLine } from "./shared/ReceiptLine";

/**
 * Stage 04 — PERSPECTIVE: Self-distancing.
 * 사용자 신념을 *친구의 발화*로 옮겨 인용. 비대칭 잣대 드러내기.
 * counter가 비었던 사용자에 대해서는 reflect 메시지 1줄 추가.
 */
export function Stage04Perspective({
  data,
  beliefLine,
  showCounterEmptyReflect,
  onUpdate,
}: {
  data: Stage04Data | undefined;
  beliefLine: string;
  showCounterEmptyReflect: boolean;
  onUpdate: (next: Stage04Data) => void;
}) {
  const value = data ?? {};

  return (
    <div className="flex flex-col gap-7">
      {showCounterEmptyReflect && (
        <p
          style={{
            fontSize: 13.5,
            lineHeight: 1.7,
            color: "var(--v2-body)",
            padding: "12px 14px",
            background: "var(--v2-line3)",
            borderRadius: 10,
          }}
        >
          오른쪽이 비어있던 게 의미하는 건, 사실이 없다는 게 아니라{" "}
          <strong style={{ color: "var(--v2-ink)" }}>
            평소에 보지 않으려 했다
          </strong>
          는 뜻일 수도 있어요.
        </p>
      )}

      <QuoteBlock
        text={beliefLine}
        size="lg"
        caption="─ 친한 친구가 당신에게 와서 이렇게 말했어요."
      />

      <div>
        <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
          <Mono size={10} weight={700} color="var(--v2-mute)" tracked={0.18}>
            YOUR REPLY
          </Mono>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--v2-ink)",
              letterSpacing: "-0.01em",
            }}
          >
            당신은 친구에게 뭐라고 답해주실 건가요?
          </span>
        </div>
        <textarea
          value={value.friend_response ?? ""}
          onChange={(e) => onUpdate({ friend_response: e.target.value })}
          rows={5}
          placeholder="예: 너는 결과를 못 냈다고 가치가 0이 되는 사람이 아니야. 잠시 쉬었던 시간도 너의 일부야."
          style={{
            width: "100%",
            resize: "vertical",
            padding: "14px 16px",
            borderRadius: 12,
            border: "1px solid var(--v2-line)",
            background: "var(--v2-paper)",
            fontSize: 14.5,
            lineHeight: 1.7,
            color: "var(--v2-ink)",
            fontFamily: "var(--font-clinical-body)",
            outline: "none",
          }}
        />
      </div>

      <ReceiptLine>
        방금 친구에게 해준 그 말,{" "}
        <strong style={{ color: "var(--v2-ink)" }}>
          자신에게도 똑같이 들려줄 수 있을까요?
        </strong>
      </ReceiptLine>
    </div>
  );
}
