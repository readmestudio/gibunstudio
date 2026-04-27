import Link from "next/link";
import { WORKSHOP_STEPS } from "@/lib/self-workshop/diagnosis";
import { MonoTag, ArrowGlyph } from "./atoms";

/**
 * 챕터(템플릿) 페이지 상단 헤더 — METRIC 안
 *
 * 핸드오프 명세:
 *   - 브레드크럼 → 메타 라인(WORKBOOK · TEST · 2단계) → 거대 번호(140px) + 타이틀 + 키커
 *   - 세그먼트 진행바: 완료 3px ink, 현재 6px 오렌지, 미진행 3px hair
 *   - 슬림 페이저: 좌·우 화살 + 모노 메타 + 챕터 타이틀
 *
 * - prev/next 가 없으면 placeholder 로 자리만 잡아 양측 정렬을 유지.
 * - maxAccessibleStep 보다 큰 next 는 잠긴 상태로 클릭 비활성.
 */

interface Props {
  currentStep: number;
  /** 접근 가능한 최대 step. 다음 페이저에서 잠금 판정에 사용. */
  maxAccessibleStep: number;
  /** 진행 카운터(완료 챕터 수). 세그먼트 바에서 done 표시에 사용. */
  doneCount: number;
}

export function WorkbookChapterHeader({
  currentStep,
  maxAccessibleStep,
  doneCount,
}: Props) {
  const total = WORKSHOP_STEPS.length;
  const current = WORKSHOP_STEPS.find((s) => s.step === currentStep);
  if (!current) return null;

  const prev = WORKSHOP_STEPS.find((s) => s.step === currentStep - 1) ?? null;
  const next = WORKSHOP_STEPS.find((s) => s.step === currentStep + 1) ?? null;
  const nextLocked = !!next && next.step > maxAccessibleStep;

  // 완료 비율(진행 표시용)
  const pct = total > 0 ? Math.min(doneCount / total, 1) : 0;

  return (
    <div
      className="wb-container mx-auto"
      style={{
        maxWidth: 1024,
        padding: "56px 64px 0",
        background: "var(--wb-surface)",
        color: "var(--wb-text)",
        fontFamily: "Pretendard, system-ui, sans-serif",
      }}
    >
      {/* 브레드크럼 */}
      <Link
        href="/dashboard/self-workshop"
        className="inline-block transition-opacity hover:opacity-70"
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: 12,
          color: "var(--wb-text2)",
          letterSpacing: "0.04em",
          marginBottom: 36,
        }}
      >
        ← 워크북 목록
      </Link>

      {/* 메타 라인 */}
      <div
        className="flex flex-wrap items-center"
        style={{ gap: 16, marginBottom: 24 }}
      >
        <MonoTag size={11} tracking={0.18}>
          WORKBOOK · 성취 중독 마음챙김
        </MonoTag>
        <span
          aria-hidden="true"
          style={{ width: 1, height: 12, background: "var(--wb-hair)" }}
        />
        <MonoTag size={11} tracking={0.18} color="var(--wb-text3)">
          {current.sectionLabel} · {current.sectionStepNumber}단계
        </MonoTag>
      </div>

      {/* Hero — 거대 번호 + 타이틀 */}
      <div
        className="wb-ch-hero"
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: 48,
          alignItems: "flex-end",
          marginBottom: 32,
        }}
      >
        <div>
          <MonoTag size={11} tracking={0.1} color="var(--wb-text3)">
            CH.
          </MonoTag>
          <div
            className="wb-ch-num"
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 600,
              fontSize: 140,
              lineHeight: 0.9,
              letterSpacing: "-0.05em",
              color: "var(--wb-ink)",
            }}
          >
            {String(current.step).padStart(2, "0")}
          </div>
        </div>
        <div style={{ paddingBottom: 18 }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 12,
              color: "var(--wb-text3)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            {current.subtitle}
          </div>
          <h1
            className="wb-ch-title"
            style={{
              margin: 0,
              fontFamily: "Pretendard, system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 52,
              letterSpacing: "-0.03em",
              color: "var(--wb-ink)",
              lineHeight: 1.04,
              wordBreak: "keep-all",
            }}
          >
            {current.title}
          </h1>
        </div>
      </div>

      {/* 세그먼트 진행바 */}
      <div
        style={{
          borderTop: "1px solid var(--wb-ink)",
          borderBottom: "1px solid var(--wb-hair)",
          padding: "20px 0",
          marginBottom: 16,
        }}
      >
        <div
          className="flex items-center"
          style={{ gap: 4, marginBottom: 14 }}
          aria-label={`진행 ${current.step} / ${total}`}
        >
          {Array.from({ length: total }).map((_, i) => {
            const n = i + 1;
            const isCur = n === current.step;
            const isDone = n < current.step;
            return (
              <div
                key={n}
                style={{
                  flex: 1,
                  height: isCur ? 6 : 3,
                  borderRadius: 3,
                  background: isCur
                    ? "var(--wb-accent)"
                    : isDone
                      ? "var(--wb-ink)"
                      : "var(--wb-hair)",
                  transition: "all 200ms ease",
                }}
              />
            );
          })}
        </div>
        <div className="flex justify-between">
          <MonoTag size={10} color="var(--wb-text3)">
            01
          </MonoTag>
          <MonoTag size={10} color="var(--wb-text2)">
            {String(current.step).padStart(2, "0")} / {String(total).padStart(2, "0")} ·{" "}
            {Math.round(pct * 100)}% COMPLETE
          </MonoTag>
          <MonoTag size={10} color="var(--wb-text3)">
            {String(total).padStart(2, "0")}
          </MonoTag>
        </div>
      </div>

      {/* Slim pager */}
      <div
        className="wb-ch-pager flex items-center justify-between"
        style={{ padding: "4px 0" }}
      >
        <PagerButton
          dir="left"
          step={prev}
          locked={false} /* 이전은 항상 접근 가능 */
        />
        <PagerButton
          dir="right"
          step={next}
          locked={nextLocked}
        />
      </div>
    </div>
  );
}

/* ───────── Pager button ───────── */

interface PagerButtonProps {
  dir: "left" | "right";
  step: (typeof WORKSHOP_STEPS)[number] | null;
  locked: boolean;
}

function PagerButton({ dir, step, locked }: PagerButtonProps) {
  const isLeft = dir === "left";
  const labelKr = isLeft ? "이전" : "다음";

  // 아예 없는 경우(첫/마지막 단계): 자리만 차지하는 placeholder
  if (!step) {
    return (
      <div
        aria-hidden="true"
        className="flex items-center"
        style={{
          gap: 14,
          padding: "6px 0",
          opacity: 0.3,
          textAlign: isLeft ? "left" : "right",
        }}
      >
        {isLeft && <ArrowGlyph dir="left" color="var(--wb-text3)" />}
        <div style={{ textAlign: isLeft ? "left" : "right" }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 10,
              color: "var(--wb-text3)",
              letterSpacing: "0.08em",
            }}
          >
            {labelKr}
          </div>
          <div
            style={{
              fontFamily: "Pretendard, system-ui, sans-serif",
              fontWeight: 600,
              fontSize: 14,
              color: "var(--wb-text3)",
            }}
          >
            {isLeft ? "처음 단계예요" : "마지막 단계예요"}
          </div>
        </div>
        {!isLeft && <ArrowGlyph dir="right" color="var(--wb-text3)" />}
      </div>
    );
  }

  // 잠긴 다음 단계: 클릭 비활성, dimmed
  if (locked) {
    return (
      <div
        aria-disabled="true"
        className="flex items-center"
        style={{
          gap: 14,
          padding: "6px 0",
          opacity: 0.45,
          cursor: "not-allowed",
          textAlign: isLeft ? "left" : "right",
        }}
      >
        {isLeft && <ArrowGlyph dir="left" color="var(--wb-text3)" />}
        <div style={{ textAlign: isLeft ? "left" : "right" }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 10,
              color: "var(--wb-text3)",
              letterSpacing: "0.08em",
            }}
          >
            {labelKr} · {step.sectionLabel}
          </div>
          <div
            style={{
              fontFamily: "Pretendard, system-ui, sans-serif",
              fontWeight: 600,
              fontSize: 14,
              color: "var(--wb-text3)",
            }}
          >
            아직 잠겨 있어요
          </div>
        </div>
        {!isLeft && <ArrowGlyph dir="right" color="var(--wb-text3)" />}
      </div>
    );
  }

  return (
    <Link
      href={`/dashboard/self-workshop/step/${step.step}`}
      className="flex items-center transition-opacity hover:opacity-70"
      style={{
        gap: 14,
        padding: "6px 0",
        textAlign: isLeft ? "left" : "right",
        textDecoration: "none",
      }}
    >
      {isLeft && <ArrowGlyph dir="left" color="var(--wb-text2)" />}
      <div style={{ textAlign: isLeft ? "left" : "right" }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: 10,
            color: "var(--wb-text3)",
            letterSpacing: "0.08em",
          }}
        >
          {labelKr} · {step.sectionLabel}
        </div>
        <div
          style={{
            fontFamily: "Pretendard, system-ui, sans-serif",
            fontWeight: 600,
            fontSize: 14,
            color: "var(--wb-ink)",
          }}
        >
          {step.title}
        </div>
      </div>
      {!isLeft && <ArrowGlyph dir="right" color="var(--wb-text2)" />}
    </Link>
  );
}
