"use client";

import Link from "next/link";
import {
  WORKSHOP_STEPS,
  WORKSHOP_SECTIONS,
  type WorkshopSection,
  type WorkshopStep,
} from "@/lib/self-workshop/diagnosis";
import {
  MonoTag,
  StateDisc,
  ProgressRing,
  BtnGhost,
  BtnSolid,
} from "./atoms";

/**
 * 워크북 목록 화면 (EDITORIAL 안)
 *
 * 핸드오프 명세:
 *   - max-width 920–1024px, padding 56/64/80
 *   - Hero(64px H1) → ProgressStrip(160px ring + 메타 3열) → Section 별 ChapterCard 리스트
 *   - 액티브 카드만 흰 배경 + 1px ink 보더 + 좌측 2px 오렌지 룰 + 가운데 오렌지 도트
 */

interface Props {
  currentStep: number;
  completedSteps: number[]; // 완료된 step 번호
}

type ChapterState = "done" | "active" | "locked";

function chapterHref(step: number) {
  return `/dashboard/self-workshop/step/${step}`;
}

export function WorkbookIndex({ currentStep, completedSteps }: Props) {
  const total = WORKSHOP_STEPS.length;
  const done = completedSteps.length;
  const pct = total > 0 ? done / total : 0;

  // 예상 소요 시간 동적 합산
  const totalMin = WORKSHOP_STEPS.reduce((acc, s) => acc + s.estimatedMinutes[0], 0);
  const totalMax = WORKSHOP_STEPS.reduce((acc, s) => acc + s.estimatedMinutes[1], 0);
  const estimate = `${totalMin}–${totalMax}분`;

  // 섹션별 그룹핑 + 상태 계산
  const stepsBySection = new Map<WorkshopSection, WorkshopStep[]>();
  for (const s of WORKSHOP_STEPS) {
    const arr = stepsBySection.get(s.section) ?? [];
    arr.push(s);
    stepsBySection.set(s.section, arr);
  }
  const completedSet = new Set(completedSteps);
  const stateOf = (step: WorkshopStep): ChapterState => {
    if (completedSet.has(step.step)) return "done";
    if (step.step === currentStep) return "active";
    return "locked";
  };

  // "현재 진행 중" 안내문에 쓸 active step
  const activeStep = WORKSHOP_STEPS.find((s) => s.step === currentStep);
  const activeSectionLabel = activeStep?.sectionLabel ?? "";
  const activeStepTitle = activeStep?.title ?? "";

  return (
    <div
      className="wb-container mx-auto"
      style={{
        maxWidth: 1024,
        padding: "56px 64px 80px",
        background: "var(--wb-surface)",
        color: "var(--wb-text)",
        fontFamily: "Pretendard, system-ui, sans-serif",
      }}
    >
      {/* 브레드크럼 */}
      <Link
        href="/dashboard"
        className="inline-block transition-opacity hover:opacity-70"
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: 12,
          color: "var(--wb-text2)",
          letterSpacing: "0.04em",
          marginBottom: 36,
        }}
      >
        ← 대시보드
      </Link>

      {/* Hero */}
      <div style={{ marginBottom: 64 }}>
        <MonoTag size={11} tracking={0.22} color="var(--wb-text2)">
          A MINDFULNESS WORKBOOK
        </MonoTag>
        <h1
          className="wb-hero-title"
          style={{
            fontFamily: "Pretendard, system-ui, sans-serif",
            fontWeight: 700,
            fontSize: 64,
            lineHeight: 1.02,
            margin: "20px 0 0",
            letterSpacing: "-0.035em",
            color: "var(--wb-ink)",
            textWrap: "balance",
            wordBreak: "keep-all",
          }}
        >
          성취 중독에서
          <br />
          자유로워지는 3단계
        </h1>
        <p
          style={{
            margin: "24px 0 0",
            color: "var(--wb-text2)",
            fontSize: 18,
            maxWidth: 560,
            lineHeight: 1.5,
            wordBreak: "keep-all",
          }}
        >
          CBT 기반의 자기 진단·실습을 따라가며 성취 중독의 패턴을 발견하고,
          새로운 가능성을 찾아봅니다
        </p>
      </div>

      {/* Progress strip — 160px ring + 메타 3열 + 안내문 */}
      <div
        className="wb-progress-strip"
        style={{
          display: "grid",
          gridTemplateColumns: "180px 1fr",
          gap: 40,
          alignItems: "center",
          padding: "32px 0",
          borderTop: "1px solid var(--wb-hair)",
          borderBottom: "1px solid var(--wb-hair)",
          marginBottom: 80,
        }}
      >
        <ProgressRing pct={pct} done={done} total={total} />
        <div>
          <div
            className="wb-progress-meta"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, auto)",
              gap: 40,
            }}
          >
            <div>
              <MonoTag size={10}>EST. TIME</MonoTag>
              <div
                style={{
                  fontFamily: "Pretendard, system-ui, sans-serif",
                  fontWeight: 600,
                  fontSize: 22,
                  marginTop: 6,
                  letterSpacing: "-0.015em",
                  color: "var(--wb-ink)",
                }}
              >
                {estimate}
              </div>
            </div>
            <div>
              <MonoTag size={10}>SECTIONS</MonoTag>
              <div
                style={{
                  fontFamily: "Pretendard, system-ui, sans-serif",
                  fontWeight: 600,
                  fontSize: 22,
                  marginTop: 6,
                  letterSpacing: "-0.015em",
                  color: "var(--wb-ink)",
                }}
              >
                {WORKSHOP_SECTIONS.length}
              </div>
            </div>
            <div>
              <MonoTag size={10}>FRAMEWORK</MonoTag>
              <div
                style={{
                  fontFamily: "Pretendard, system-ui, sans-serif",
                  fontWeight: 600,
                  fontSize: 22,
                  marginTop: 6,
                  letterSpacing: "-0.015em",
                  color: "var(--wb-ink)",
                }}
              >
                CBT
              </div>
            </div>
          </div>
          {activeStep && (
            <div
              style={{
                marginTop: 20,
                fontSize: 14,
                color: "var(--wb-text2)",
                lineHeight: 1.55,
                wordBreak: "keep-all",
              }}
            >
              현재{" "}
              <b style={{ color: "var(--wb-ink)" }}>
                {activeSectionLabel} · {activeStepTitle}
              </b>
              를 진행 중이에요. 이어서 돌아가요.
            </div>
          )}
        </div>
      </div>

      {/* Sections */}
      {WORKSHOP_SECTIONS.map((sectionMeta, idx) => {
        const sectionSteps = stepsBySection.get(sectionMeta.section) ?? [];
        if (sectionSteps.length === 0) return null;
        return (
          <SectionBlock
            key={sectionMeta.section}
            idx={String(idx + 1).padStart(2, "0")}
            label={sectionMeta.label}
            description={sectionMeta.description}
            steps={sectionSteps}
            stateOf={stateOf}
          />
        );
      })}
    </div>
  );
}

/* ───────── Section block ───────── */

interface SectionBlockProps {
  idx: string;
  label: string;
  description: string;
  steps: WorkshopStep[];
  stateOf: (step: WorkshopStep) => ChapterState;
}

function SectionBlock({ idx, label, description, steps, stateOf }: SectionBlockProps) {
  return (
    <section style={{ marginBottom: 64 }}>
      <header
        className="wb-section-header"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 2fr",
          gap: 40,
          marginBottom: 24,
          alignItems: "baseline",
        }}
      >
        <div>
          <MonoTag size={11} tracking={0.18} color="var(--wb-text3)">
            SECTION {idx}
          </MonoTag>
          <h2
            style={{
              margin: "8px 0 0",
              fontFamily: "'Inter', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 32,
              letterSpacing: "-0.02em",
              color: "var(--wb-ink)",
            }}
          >
            {label}
          </h2>
        </div>
        <p
          style={{
            margin: 0,
            color: "var(--wb-text2)",
            fontSize: 15,
            lineHeight: 1.55,
            wordBreak: "keep-all",
          }}
        >
          {description}
        </p>
      </header>
      <div className="flex flex-col gap-2">
        {steps.map((s) => (
          <ChapterCard key={s.step} step={s} state={stateOf(s)} />
        ))}
      </div>
    </section>
  );
}

/* ───────── Chapter card ───────── */

function ChapterCard({ step, state }: { step: WorkshopStep; state: ChapterState }) {
  const isActive = state === "active";
  const isLocked = state === "locked";
  const minutes = `${step.estimatedMinutes[0]}–${step.estimatedMinutes[1]}`;
  const ch = `CH.${String(step.step).padStart(2, "0")}`;
  const href = chapterHref(step.step);

  const card = (
    <div
      className="wb-chapter-card relative grid items-center"
      style={{
        gridTemplateColumns: "40px 1fr auto auto",
        gap: 24,
        padding: "20px 24px",
        borderRadius: 16,
        background: isActive ? "var(--wb-surface)" : "var(--wb-surface2)",
        border: `1px solid ${isActive ? "var(--wb-ink)" : "var(--wb-hair2)"}`,
        opacity: isLocked ? 0.55 : 1,
        transition: "background 120ms ease, border-color 120ms ease",
      }}
    >
      {/* State disc */}
      <div className="flex items-center justify-center">
        <StateDisc state={state} />
      </div>

      {/* Title block */}
      <div className="min-w-0">
        <div
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: 11,
            color: "var(--wb-text3)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: 4,
          }}
          className="truncate"
        >
          {ch} · {step.subtitle}
        </div>
        <div
          style={{
            fontFamily: "Pretendard, system-ui, sans-serif",
            fontWeight: 600,
            fontSize: 18,
            color: "var(--wb-ink)",
            letterSpacing: "-0.01em",
          }}
        >
          {step.title}
        </div>
      </div>

      {/* Time */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: 12,
          color: "var(--wb-text2)",
        }}
      >
        {minutes}분
      </div>

      {/* Action */}
      <div>
        {state === "done" && <BtnGhost href={href}>다시 보기</BtnGhost>}
        {state === "active" && <BtnSolid href={href}>이어하기</BtnSolid>}
        {state === "locked" && (
          <span
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 11,
              color: "var(--wb-text3)",
              letterSpacing: "0.08em",
            }}
          >
            LOCKED
          </span>
        )}
      </div>

      {/* Active accent rule (좌측 2px 오렌지) */}
      {isActive && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            top: 16,
            bottom: 16,
            width: 2,
            background: "var(--wb-accent)",
            borderRadius: 2,
          }}
        />
      )}
    </div>
  );

  // 잠금 카드는 클릭 비활성, 그 외엔 Link 로 감싸 카드 전체가 클릭 가능
  if (isLocked) {
    return <div aria-disabled="true">{card}</div>;
  }

  return (
    <Link
      href={href}
      className="block transition-opacity"
      style={{ textDecoration: "none" }}
    >
      {card}
    </Link>
  );
}
