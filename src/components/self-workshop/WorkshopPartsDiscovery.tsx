"use client";

/**
 * Step 3 — PART 찾기 (IFS 모델 기반, 2026-05-31 신규).
 *
 * IFS 활동지2 "부분들을 알아가기" 흐름:
 *   한 사건 → 그 안에서 활성화된 마음 → 한 마음에 머물며 9개 질문으로 깊이 탐색.
 *
 * WorkshopConversation 엔진 재사용. PARTS_DISCOVERY_STEPS를 explore points로.
 * 사용자에게는 IFS 전문 용어(부분·관리자·소방관·추방자·참자아) 노출 금지 —
 * LLM 시스템 프롬프트의 IFS_TERM_BAN_RULES가 강제한다.
 *
 * 산출물: parts_discovery JSONB 컬럼 = { dialogue, dialogue_recap? }
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Body,
  COL,
  D,
  Headline,
  SectionHeader,
} from "@/components/self-workshop/clinical-report/v3-shared";
import { WorkshopConversation } from "@/components/self-workshop/conversation/WorkshopConversation";
import {
  readDialogue,
  type ConversationTranscript,
  type StepRecap,
} from "@/lib/self-workshop/conversation";
import { PARTS_DISCOVERY_STEPS } from "@/lib/self-workshop/ifs-parts-data";

interface Props {
  workshopId: string;
  /** parts_discovery JSONB 컬럼 값 (이어하기용). */
  savedData?: unknown;
  /** done 화면 상담사 코멘트 호칭용 사용자 이름. */
  userName?: string | null;
}

/** #4~#7 질문의 토큰 → 답을 가져올 explore_point_id. 모듈 상수(참조 안정성). */
const QUESTION_TOKENS: Record<string, string> = {
  "{이름}": "name_part",
  "{대사}": "part_dialogue",
};

export function WorkshopPartsDiscovery({ workshopId, savedData, userName }: Props) {
  const router = useRouter();
  const initialDialogue = useMemo(() => readDialogue(savedData), [savedData]);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleTranscriptChange = useCallback(
    (t: ConversationTranscript) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        // 진행 중: dialogue만 디바운스 저장. advanceStep 없음.
        void fetch("/api/self-workshop/save-progress", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workshopId,
            field: "parts_discovery",
            data: { dialogue: t },
          }),
        });
      }, 1000);
    },
    [workshopId]
  );

  const handleComplete = useCallback(
    async (t: ConversationTranscript, recap: StepRecap | null) => {
      setCompleting(true);
      setError("");
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = undefined;
      }
      try {
        const data = {
          dialogue: t,
          ...(recap ? { dialogue_recap: recap } : {}),
        };
        const saveRes = await fetch("/api/self-workshop/save-progress", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workshopId,
            field: "parts_discovery",
            advanceStep: 4,
            data,
          }),
        });
        if (!saveRes.ok) {
          throw new Error("저장에 실패했어요. 잠시 후 다시 시도해주세요.");
        }
        router.push("/dashboard/self-workshop/step/4");
      } catch (err) {
        setError(err instanceof Error ? err.message : "오류가 발생했어요");
        setCompleting(false);
      }
    },
    [workshopId, router]
  );

  return (
    <div
      className="space-y-8 pb-20"
      style={{ maxWidth: COL + 96, margin: "0 auto", padding: "0 48px" }}
    >
      <section className="space-y-5">
        <SectionHeader kicker="● FIND OUT · STEP 3" rightLabel="OPENING" />
        <Headline>마음 안의 다른 존재들을 만나볼게요</Headline>
        <Body muted style={{ marginTop: 12 }}>
          이 워크북은 특히 <strong style={{ color: D.ink }}>일·성과·성취</strong>와
          관련해 마음이 흔들리는 순간을 함께 살펴봐요. 한 사람 안에는 한 가지 마음만이
          아니라, 상황에 따라 다른 목소리·움직임이 있을 수 있어요. 그런 한 순간을
          떠올리며 그 안에서 올라온 감정·생각을 하나씩 알아갈 거예요.{" "}
          <strong style={{ color: D.ink }}>
            정답은 없어요. 떠오르는 대로 답하면, 답에 따라 다음 질문이 이어져요.
          </strong>
        </Body>
      </section>

      <WorkshopConversation
        stepKey="parts_discovery"
        explorePoints={PARTS_DISCOVERY_STEPS}
        initialTranscript={initialDialogue}
        userName={userName}
        questionTokens={QUESTION_TOKENS}
        onTranscriptChange={handleTranscriptChange}
        onComplete={handleComplete}
        completing={completing}
      />

      {error && <p className="text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
