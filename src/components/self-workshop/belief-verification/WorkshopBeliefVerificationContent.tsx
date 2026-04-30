"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BeliefDestroyData } from "@/lib/self-workshop/belief-destroy";
import type { BeliefAnalysis } from "@/lib/self-workshop/core-belief-excavation";
import {
  buildOriginBeliefs,
  buildRecognizeStatements,
  canAdvanceFromStage03,
  canAdvanceFromStage05,
  derivePrimaryKeyword,
  isStage01Complete,
  isStage06Complete,
  normalizeBeliefVerification,
  type BeliefVerificationData,
  type StageNumber,
} from "@/lib/self-workshop/belief-verification";
import { StageShell } from "./shared/StageShell";
import { PauseInterstitial } from "./shared/PauseInterstitial";
import { Stage01Recognize } from "./Stage01Recognize";
import { Stage02Origin } from "./Stage02Origin";
import { Stage03Evidence } from "./Stage03Evidence";
import { Stage04Perspective } from "./Stage04Perspective";
import { Stage05Spectrum } from "./Stage05Spectrum";
import { Stage06Rewrite } from "./Stage06Rewrite";

interface Props {
  workshopId: string;
  /** 기존 belief_destroy JSONB 전체 — 신규 belief_verification 서브키 + 레거시 4기법 데이터 보존 */
  savedData?: Partial<BeliefDestroyData>;
  beliefLine: string;
  beliefAnalysis: BeliefAnalysis | null;
  /** Step 3 mechanism_analysis.automatic_thought */
  automaticThought: string;
  /** Step 3 mechanism_analysis.recent_situation — Stage 01 분류 카드용 */
  recentSituation?: string;
  /** Step 3 mechanism_analysis.emotions_body.emotions — Stage 01 분류 카드용(단어별 한 카드) */
  emotions?: string[];
  /** Step 7 alternative_thought_simulation.original_automatic_thought (자동사고와 다를 때만) */
  altAutomaticThought?: string;
  /** Step 7 alternative_thought_simulation.original_emotion (있을 때만) */
  altEmotion?: string;
}

/**
 * Step 6 — "핵심 믿음 다시 보기"
 * 6스테이지 검증 흐름의 셸. 통합 state + 1초 debounce 자동저장 + 스테이지 라우팅.
 *
 * - DB: belief_destroy JSONB의 belief_verification 서브키에 모든 신규 데이터 저장.
 *   레거시 4기법 키(triple_column 등)는 그대로 보존 (마이그레이션 X).
 * - 다음 단계 진입 시 advanceStep: 7로 monotonic 처리.
 */
export function WorkshopBeliefVerificationContent({
  workshopId,
  savedData,
  beliefLine,
  beliefAnalysis,
  automaticThought,
  recentSituation,
  emotions,
  altAutomaticThought,
  altEmotion,
}: Props) {
  const router = useRouter();

  // belief_line 없으면 이전 단계로 안내
  if (!beliefLine) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <p className="text-sm text-[var(--v2-body)]">
          먼저 핵심 신념 찾기 실습을 완료해 주세요.
        </p>
        <Link
          href="/dashboard/self-workshop/step/4"
          className="mt-4 inline-block text-sm font-medium text-[var(--v2-ink)] underline"
        >
          핵심 신념 찾기로 이동 →
        </Link>
      </div>
    );
  }

  return (
    <Inner
      workshopId={workshopId}
      savedData={savedData}
      beliefLine={beliefLine}
      beliefAnalysis={beliefAnalysis}
      automaticThought={automaticThought}
      recentSituation={recentSituation}
      emotions={emotions}
      altAutomaticThought={altAutomaticThought}
      altEmotion={altEmotion}
      router={router}
    />
  );
}

function Inner({
  workshopId,
  savedData,
  beliefLine,
  beliefAnalysis,
  automaticThought,
  recentSituation,
  emotions,
  altAutomaticThought,
  altEmotion,
  router,
}: Props & { router: ReturnType<typeof useRouter> }) {
  const primaryKeyword = useMemo(
    () => derivePrimaryKeyword(beliefAnalysis),
    [beliefAnalysis]
  );

  const initial: BeliefVerificationData = useMemo(
    () =>
      normalizeBeliefVerification(savedData?.belief_verification, {
        beliefLine,
        primaryKeyword,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [data, setData] = useState<BeliefVerificationData>(initial);
  const [stage, setStage] = useState<StageNumber>(initial.current_stage);
  const [pauseTo, setPauseTo] = useState<StageNumber | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const statements = useMemo(
    () =>
      buildRecognizeStatements({
        automaticThought,
        beliefLine,
        beliefAnalysis,
        recentSituation,
        emotions,
        altAutomaticThought,
        altEmotion,
      }),
    [
      automaticThought,
      beliefLine,
      beliefAnalysis,
      recentSituation,
      emotions,
      altAutomaticThought,
      altEmotion,
    ]
  );

  const originBeliefs = useMemo(
    () => buildOriginBeliefs({ beliefLine, beliefAnalysis }),
    [beliefLine, beliefAnalysis]
  );

  // 자동저장 (1s debounce)
  const autoSave = useCallback(
    (next: BeliefVerificationData) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const payload: Partial<BeliefDestroyData> = {
          ...savedData,
          input_belief_line:
            savedData?.input_belief_line ?? next.input_belief_line,
          belief_verification: next,
        };
        void fetch("/api/self-workshop/save-progress", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workshopId,
            field: "belief_destroy",
            data: payload,
          }),
        });
      }, 1000);
    },
    [workshopId, savedData]
  );

  function patch(p: Partial<BeliefVerificationData>) {
    const next = { ...data, ...p };
    setData(next);
    autoSave(next);
  }

  function gotoStage(s: StageNumber, withPause = false) {
    if (withPause) {
      setPauseTo(s);
      return;
    }
    setStage(s);
    patch({ current_stage: s });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // 진행 가능 여부
  const stage01Done = isStage01Complete(data.stage_01_recognize, statements.length);
  const stage03Can = canAdvanceFromStage03(data.stage_03_evidence);
  const stage05Can = canAdvanceFromStage05(data.stage_05_spectrum);
  const stage06Done = isStage06Complete(data.stage_06_rewrite);

  async function handleComplete() {
    setSubmitting(true);
    setError("");
    try {
      const finalState: BeliefVerificationData = {
        ...data,
        completed_at: data.completed_at ?? new Date().toISOString(),
      };
      const payload: Partial<BeliefDestroyData> = {
        ...savedData,
        input_belief_line:
          savedData?.input_belief_line ?? finalState.input_belief_line,
        belief_verification: finalState,
      };
      const res = await fetch("/api/self-workshop/save-progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshopId,
          field: "belief_destroy",
          data: payload,
          advanceStep: 7,
        }),
      });
      if (!res.ok) throw new Error("저장에 실패했습니다.");
      router.push("/dashboard/self-workshop/step/7");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  function nextLabel(s: StageNumber): string {
    if (s === 6) return submitting ? "저장 중..." : "대안 자동사고로 →";
    return "다음 단계로";
  }

  function nextDisabled(s: StageNumber): boolean {
    if (submitting) return true;
    switch (s) {
      case 1:
        return !stage01Done;
      case 3:
        return !stage03Can;
      case 5:
        return !stage05Can;
      case 6:
        return !stage06Done;
      default:
        return false;
    }
  }

  function onNext() {
    if (stage === 6) {
      void handleComplete();
      return;
    }
    gotoStage((stage + 1) as StageNumber, true);
  }

  function onPrev() {
    if (stage <= 1) return;
    gotoStage((stage - 1) as StageNumber);
  }

  // 신념 배너: 모든 스테이지에서 미사용.
  // Stage 02는 신념별 반복 흐름이라 컴포넌트 내부에서 현재 신념을 직접 인용.
  // Stage 03은 BeliefRecap이 본문 상단에 모든 신념을 표시하므로 단일 배너는 중복.
  // Stage 04(친구 인용)·Stage 06(ORIGINAL BELIEF)는 자체 인용이 있어 중복.
  const beliefBanner = undefined;

  return (
    <>
      <StageShell
        stage={stage}
        workshopId={workshopId}
        beliefBanner={beliefBanner}
        onPrev={stage > 1 ? onPrev : undefined}
        onNext={onNext}
        nextDisabled={nextDisabled(stage)}
        nextLabel={nextLabel(stage)}
        hidePrev={stage === 1}
      >
        {stage === 1 && (
          <Stage01Recognize
            statements={statements}
            savedRounds={data.stage_01_recognize?.rounds ?? []}
            onUpdate={(s1) => patch({ stage_01_recognize: s1 })}
          />
        )}
        {stage === 2 && (
          <Stage02Origin
            beliefs={originBeliefs}
            data={data.stage_02_origin}
            primaryKeyword={data.primary_keyword}
            onUpdate={(s2) => patch({ stage_02_origin: s2 })}
            onSkipStage={onNext}
          />
        )}
        {stage === 3 && (
          <Stage03Evidence
            data={data.stage_03_evidence}
            beliefs={originBeliefs}
            onUpdate={(s3) => patch({ stage_03_evidence: s3 })}
          />
        )}
        {stage === 4 && (
          <Stage04Perspective
            data={data.stage_04_perspective}
            beliefLine={data.input_belief_line}
            showCounterEmptyReflect={
              // 어느 신념이라도 counter가 비었던 경우 reflect 노출
              (data.stage_03_evidence?.beliefs ?? []).some(
                (b) =>
                  b.status === "done" &&
                  b.counter.every((s) => !s || !s.trim())
              )
            }
            onUpdate={(s4) => patch({ stage_04_perspective: s4 })}
          />
        )}
        {stage === 5 && (
          <Stage05Spectrum
            data={data.stage_05_spectrum}
            onUpdate={(s5) => patch({ stage_05_spectrum: s5 })}
          />
        )}
        {stage === 6 && (
          <Stage06Rewrite
            data={data.stage_06_rewrite}
            primaryKeyword={data.primary_keyword}
            originalBeliefLine={data.input_belief_line}
            onUpdate={(s6) => patch({ stage_06_rewrite: s6 })}
          />
        )}

        {error && (
          <p
            style={{
              marginTop: 16,
              textAlign: "center",
              fontSize: 13,
              color: "#c2410c",
            }}
          >
            {error}
          </p>
        )}
      </StageShell>

      {pauseTo !== null && (
        <PauseInterstitial
          onDone={() => {
            const next = pauseTo;
            setPauseTo(null);
            if (next !== null) {
              setStage(next);
              patch({ current_stage: next });
              if (typeof window !== "undefined") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }
          }}
        />
      )}
    </>
  );
}
