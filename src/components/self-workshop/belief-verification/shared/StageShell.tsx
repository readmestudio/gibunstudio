"use client";

import type { ReactNode } from "react";
import { HeaderStrip } from "@/components/self-workshop/clinical-report/shared/HeaderStrip";
import { V2TitleBlock } from "@/components/self-workshop/clinical-report/shared/V2TitleBlock";
import { Mono } from "@/components/self-workshop/clinical-report/shared/Mono";
import { deriveCaseId } from "@/components/self-workshop/clinical-report/shared/deriveCaseId";
import {
  SHARED_COPY,
  STAGE_META,
} from "@/lib/self-workshop/belief-verification-copy";
import type { StageNumber } from "@/lib/self-workshop/belief-verification";
import { PersistentExit } from "./PersistentExit";

/**
 * 6스테이지 공통 셸. 헤더(HeaderStrip + V2TitleBlock) + (옵션) 신념 배너 + 본문 slot + 푸터.
 *
 * - 시각 토큰은 clinical-report/shared 100% 재사용 — 신규 색상/폰트 없음.
 * - 모든 입력 영역은 1열(max-width 580px). 핸드오프의 좌우 2컬럼은 사용자 요구로 1열 전환.
 * - `beliefBanner`: "당신의 핵심 신념은 \"___\" 였어요" — 본문 첫 머리에 박아 노출.
 *   "이 신념"이라는 표현이 등장하는 스테이지(02·03)에서 사용자 인지 부담 감소를 위해 사용.
 */
export function StageShell({
  stage,
  workshopId,
  totalStages = 6,
  beliefBanner,
  onPrev,
  onNext,
  nextDisabled,
  nextLabel,
  hidePrev,
  children,
}: {
  stage: StageNumber;
  workshopId: string;
  totalStages?: number;
  beliefBanner?: string;
  onPrev?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  hidePrev?: boolean;
  children: ReactNode;
}) {
  const meta = STAGE_META[stage];
  const caseId = deriveCaseId(workshopId);
  const figureNumber = String(stage).padStart(2, "0");

  return (
    <div
      style={{
        background: "var(--v2-paper)",
        color: "var(--v2-ink)",
        fontFamily: "var(--font-clinical-body)",
      }}
      className="mx-auto max-w-[640px]"
    >
      <HeaderStrip
        reportLabel={SHARED_COPY.reportLabel}
        figureNumber={figureNumber}
        caseId={caseId}
        sectionLabel="SOFTEN"
        sectionTitle="핵심 믿음 다시 보기"
      />

      <V2TitleBlock
        idx={stage}
        total={totalStages}
        eyebrowEn={meta.eyebrowEn}
        headlineKr={meta.headlineKr}
        headlineEn={meta.headlineEn}
      />

      {beliefBanner && <BeliefBanner text={beliefBanner} />}

      <div style={{ padding: "28px 20px 8px" }}>{children}</div>

      <div
        style={{
          padding: "20px 20px 28px",
          borderTop: "1px solid var(--v2-line3)",
          marginTop: 20,
        }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        {!hidePrev && onPrev ? (
          <button
            type="button"
            onClick={onPrev}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--v2-line)] bg-white px-4 py-2 text-sm text-[var(--v2-body)] transition-colors hover:border-[var(--v2-ink)]"
          >
            <Mono size={11} weight={500} color="var(--v2-mute)">
              ← PREV
            </Mono>
          </button>
        ) : (
          <div />
        )}

        {onNext && (
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className="inline-flex items-center gap-2 rounded-full bg-[var(--v2-ink)] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <span>{nextLabel ?? "다음 단계로"}</span>
            <Mono size={11} weight={500} color="rgba(255,255,255,0.6)">
              NEXT →
            </Mono>
          </button>
        )}
      </div>

      <PersistentExit />

      <div
        style={{
          padding: "16px 20px 32px",
          fontSize: 11,
          lineHeight: 1.7,
          color: "var(--v2-mute)",
          textAlign: "center",
          fontFamily: "var(--font-clinical-body)",
        }}
      >
        {SHARED_COPY.disclaimer}
      </div>
    </div>
  );
}

/**
 * 본문 위에 박는 신념 컨텍스트 배너.
 * 화면에서 "이 신념"이 무엇을 가리키는지 한눈에 보이도록.
 */
function BeliefBanner({ text }: { text: string }) {
  return (
    <div
      style={{
        margin: "20px 20px 0",
        padding: "16px 18px 18px",
        borderRadius: 12,
        border: "1px solid var(--v2-line)",
        background: "var(--v2-line3)",
      }}
    >
      <Mono size={10} weight={700} color="var(--v2-mute)" tracked={0.18}>
        YOUR CORE BELIEF
      </Mono>
      <p
        style={{
          marginTop: 8,
          fontSize: 14.5,
          lineHeight: 1.6,
          color: "var(--v2-body2)",
          fontFamily: "var(--font-clinical-body)",
          letterSpacing: "-0.005em",
        }}
      >
        당신의 핵심 신념은{" "}
        <strong
          style={{
            color: "var(--v2-ink)",
            fontWeight: 700,
          }}
        >
          “{text}”
        </strong>{" "}
        였어요.
      </p>
    </div>
  );
}
