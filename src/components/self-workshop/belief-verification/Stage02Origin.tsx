"use client";

import { useMemo, useState } from "react";
import type {
  BeliefKey,
  OriginBelief,
  OriginCheckId,
  OriginEntry,
  PrimaryKeyword,
  Stage02Origin as Stage02Data,
} from "@/lib/self-workshop/belief-verification";
import {
  STAGE_02_BRIEF,
  STAGE_02_INSIGHT,
  STAGE_02_ORIGIN_OPTIONS,
} from "@/lib/self-workshop/belief-verification-copy";
import { Mono } from "@/components/self-workshop/clinical-report/shared/Mono";
import { Eyebrow } from "@/components/self-workshop/clinical-report/shared/Eyebrow";
import { InvertedInsightCard } from "./shared/InvertedInsightCard";
import { QuoteBlock } from "./shared/QuoteBlock";

/**
 * Stage 02 — ORIGIN: 신념의 기원.
 *
 * **신념별 반복 흐름** (v3):
 * - 사용자의 핵심 신념이 여러 개(core/self/others/world에서 dedup 후 1~3개)이면
 *   각 신념마다 따로 답변 받음.
 * - 한 신념당 흐름:
 *   1) 신념 인용 노출
 *   2) Q1: "이 신념은 어디서부터 시작됐을까요?" — 단일 선택 (객관식 7개 + 직접 입력)
 *   3) Q2(펼침): "어떤 장면이 떠오르나요? 어떤 사람·상황·판단이 영향을 주었을까요?" — 자유 텍스트
 * - 모든 답변은 optional. SKIP 가능.
 * - 하단에 키워드(P0/P1/P2)별 INSIGHT CARD 1회 노출.
 */
export function Stage02Origin({
  beliefs,
  data,
  primaryKeyword,
  onUpdate,
  onSkipStage,
}: {
  beliefs: OriginBelief[];
  data: Stage02Data | undefined;
  primaryKeyword: PrimaryKeyword;
  onUpdate: (next: Stage02Data) => void;
  /** 부모(Shell)의 다음 스테이지 진행 콜백 — Nudge 안에 명시적 skip CTA로 노출 */
  onSkipStage?: () => void;
}) {
  const value: Stage02Data = useMemo(() => data ?? {}, [data]);
  const [activeIdx, setActiveIdx] = useState(0);

  // 데이터 누락 방어 — 빌더가 dedup 후 0개를 반환하는 케이스
  if (beliefs.length === 0) {
    return (
      <div
        style={{
          padding: "32px 0",
          textAlign: "center",
          color: "var(--v2-mute)",
          fontSize: 13,
        }}
      >
        탐색할 신념이 아직 충분하지 않아요. 이전 단계로 돌아가 신념을 먼저
        작성해 주세요.
      </div>
    );
  }

  const active = beliefs[activeIdx];
  const entry: OriginEntry = value.per_belief?.[active.key] ?? {};

  function patchEntry(p: Partial<OriginEntry>) {
    const nextPerBelief: Partial<Record<BeliefKey, OriginEntry>> = {
      ...(value.per_belief ?? {}),
      [active.key]: { ...entry, ...p },
    };
    onUpdate({ ...value, per_belief: nextPerBelief, skipped: false });
  }

  function selectOrigin(id: OriginCheckId | "other") {
    if (id === "other") {
      patchEntry({ origin_id: "other" });
    } else {
      // 다른 옵션 선택 시 origin_other_label은 비워두지 않고 보존 (사용자 실수 보호)
      patchEntry({ origin_id: id });
    }
  }

  function setOtherLabel(s: string) {
    patchEntry({ origin_id: "other", origin_other_label: s });
  }

  function setSceneText(s: string) {
    patchEntry({ scene_text: s });
  }

  // 진행 인디케이터: 답변(origin 선택 또는 scene/identity 작성)이 있으면 완료로 표시
  function isAnswered(key: BeliefKey): boolean {
    const e = value.per_belief?.[key];
    if (!e) return false;
    return (
      !!e.origin_id ||
      (typeof e.scene_text === "string" && e.scene_text.trim().length > 0) ||
      (typeof e.identity_text === "string" &&
        e.identity_text.trim().length > 0)
    );
  }

  const answeredCount = beliefs.filter((b) => isAnswered(b.key)).length;
  const totalCount = beliefs.length;

  return (
    <div className="flex flex-col gap-7">
      {/* INSIGHT 카드 — 본문 맨 위로 이동.
          키워드별 카피 + 공통 brief("앞서 발견한 핵심 믿음들이 어디서 시작됐는지...")가
          한 카드 안에서 자연스럽게 이어지며 *왜 이 실습을 하는지* 먼저 안내. */}
      <InvertedInsightCard
        label="INSIGHT"
        body={STAGE_02_INSIGHT[primaryKeyword]}
        closing={STAGE_02_BRIEF}
      />

      {/* 신념 진행 탭 (신념이 1개면 표시 안 함) */}
      {beliefs.length > 1 && (
        <BeliefTabs
          beliefs={beliefs}
          activeIdx={activeIdx}
          onChange={setActiveIdx}
          isAnswered={isAnswered}
        />
      )}

      {/* 현재 신념 인용 */}
      <CurrentBeliefHero
        belief={active}
        index={activeIdx}
        total={beliefs.length}
      />

      {/* Q1 — 단일 선택 */}
      <QuestionBlock
        label="Q1"
        title="이 신념은 어디서부터 시작됐을까요?"
        sub="가장 가깝다고 느껴지는 한 곳을 골라보세요. 정답은 없어요."
      >
        <SingleChoice
          selected={entry.origin_id}
          otherLabel={entry.origin_other_label ?? ""}
          onSelect={selectOrigin}
          onOtherLabelChange={setOtherLabel}
        />
      </QuestionBlock>

      {/* Q2 — Q1 선택 후 펼쳐지는 follow-up: 장면 구체화 */}
      {entry.origin_id && (
        <QuestionBlock
          label="Q2"
          title="그때 어떤 장면이 떠오르나요?"
          sub="어떤 사람·상황·말 한마디가 이 신념을 새기게 했을까요? 짧고 구체적인 한 장면이면 충분해요."
        >
          <textarea
            value={entry.scene_text ?? ""}
            onChange={(e) => setSceneText(e.target.value)}
            rows={4}
            placeholder="예: 입사 첫 달, 동기 발표가 끝나고 김 부장님이 ‘쟤는 좀 늦구나’라고 말한 순간이 잊히지 않아요. 그날 이후로 어디서든 가장 먼저 끝내는 사람이 돼야 한다고 느꼈어요."
            style={textareaStyle}
          />
        </QuestionBlock>
      )}

      {/* Q3 — 정체성·이득 인정.
          Q2와 함께 펼쳐지지만, 별도 블록으로 분리해 *한때 도움이 됐던* 측면을 명확히 묻는다.
          이건 SOFTEN의 핵심 — 신념을 부수기 전에 *준 것*을 먼저 인정. */}
      {entry.origin_id && (
        <QuestionBlock
          label="Q3"
          title="이 신념은 당신을 어떤 사람으로 만들어줬나요?"
          sub="이 신념을 택함으로써 *얻었던 것*도 함께 떠올려보세요. 한때 당신을 도왔던 모습을 부정하지 말고 그대로 인정해주는 게 출발이에요."
        >
          <textarea
            value={entry.identity_text ?? ""}
            onChange={(e) =>
              patchEntry({ identity_text: e.target.value })
            }
            rows={4}
            placeholder="예: 늘 결과를 먼저 내는 사람이 됐어요. 책임감 있다는 평판이 따라왔고, 무엇보다 동료들 사이에서 ‘믿을 수 있는 사람’이라는 자리를 얻었어요."
            style={textareaStyle}
          />
        </QuestionBlock>
      )}

      {/* 신념 간 이동 (현재 답변하던 신념을 떠나 다른 신념으로) */}
      {beliefs.length > 1 && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
            disabled={activeIdx === 0}
            className="text-sm text-[var(--v2-mute)] underline-offset-4 hover:text-[var(--v2-ink)] hover:underline disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:no-underline"
          >
            ← 이전 신념
          </button>
          <button
            type="button"
            onClick={() =>
              setActiveIdx((i) => Math.min(beliefs.length - 1, i + 1))
            }
            disabled={activeIdx === beliefs.length - 1}
            className="text-sm font-semibold text-[var(--v2-ink)] underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:no-underline"
          >
            다음 신념 →
          </button>
        </div>
      )}

      {/* 진행 nudge — 신념 2개 이상일 때만. 1개면 일반 흐름이라 불필요. */}
      {beliefs.length > 1 && (
        <ProgressNudge
          answered={answeredCount}
          total={totalCount}
          onSkipStage={onSkipStage}
        />
      )}
    </div>
  );
}

/* ─────────────────────────── 진행 nudge ─────────────────────────── */

/**
 * Stage 02 하단의 *다른 신념도 살펴봐 + 건너뛸 자유* 안내.
 *
 * 상태별 카피:
 * - 0/N: 한 신념도 답 안 함 → "한 신념만 답해도 다음 단계로" 안내
 * - 1+/N: 일부 답함 → 남은 신념 권유 + 명시적 skip CTA
 * - N/N: 모두 답함 → 긍정 강화, skip CTA 숨김
 */
function ProgressNudge({
  answered,
  total,
  onSkipStage,
}: {
  answered: number;
  total: number;
  onSkipStage?: () => void;
}) {
  const allDone = answered === total;
  const hasStarted = answered > 0;
  const remaining = total - answered;

  return (
    <div
      style={{
        marginTop: 4,
        padding: "16px 18px",
        borderRadius: 12,
        border: "1px dashed var(--v2-line)",
        background: "var(--v2-paper)",
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 10 }}
      >
        <Mono size={10} weight={700} color="var(--v2-mute)" tracked={0.18}>
          PROGRESS · {answered} / {total} 신념 답변
          {allDone ? " 완료 ✓" : ""}
        </Mono>
        <ProgressDots answered={answered} total={total} />
      </div>

      <p
        style={{
          fontSize: 13,
          lineHeight: 1.65,
          color: "var(--v2-body)",
          letterSpacing: "-0.005em",
        }}
      >
        {allDone &&
          "충분해요. 신념별로 깊이 들여다본 시간 자체가 의미가 있어요. 다음 단계로 넘어갈 준비가 됐어요."}
        {!allDone && hasStarted && (
          <>
            남은 <strong style={{ color: "var(--v2-ink)" }}>{remaining}개 신념</strong>
            도 한두 줄씩만 살펴보면, 같은 패턴이 *어디에서* 자라났는지 그림이
            더 또렷해져요. 물론 지금까지 적은 것만으로 다음 단계로 가셔도
            괜찮아요.
          </>
        )}
        {!hasStarted &&
          "한 신념이라도 답해보면 다음 단계로 넘어갈 수 있어요. 잘 떠오르지 않으면 비워두고 다음 단계로 가셔도 괜찮아요."}
      </p>

      {onSkipStage && !allDone && (
        <button
          type="button"
          onClick={onSkipStage}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-[var(--v2-mute)] underline-offset-4 hover:text-[var(--v2-ink)] hover:underline"
        >
          {hasStarted
            ? "지금까지 적은 것으로 다음 단계로 →"
            : "비우고 다음 단계로 →"}
        </button>
      )}
    </div>
  );
}

function ProgressDots({
  answered,
  total,
}: {
  answered: number;
  total: number;
}) {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: 9999,
            background:
              i < answered ? "var(--v2-ink)" : "var(--v2-line)",
            transition: "background 0.2s ease",
          }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────── 보조 컴포넌트 ─────────────────────────── */

function BeliefTabs({
  beliefs,
  activeIdx,
  onChange,
  isAnswered,
}: {
  beliefs: OriginBelief[];
  activeIdx: number;
  onChange: (i: number) => void;
  isAnswered: (k: BeliefKey) => boolean;
}) {
  return (
    <div
      className="flex flex-col gap-2"
      style={{
        padding: "12px 14px",
        borderRadius: 10,
        background: "var(--v2-line3)",
        border: "1px solid var(--v2-line)",
      }}
    >
      <Mono size={10} weight={700} color="var(--v2-mute)" tracked={0.18}>
        EXPLORE EACH BELIEF · {beliefs.length}개
      </Mono>
      <div className="flex flex-wrap gap-2">
        {beliefs.map((b, i) => {
          const isActive = i === activeIdx;
          const answered = isAnswered(b.key);
          return (
            <button
              key={b.key}
              type="button"
              onClick={() => onChange(i)}
              className="text-left transition-colors"
              style={{
                padding: "8px 12px",
                borderRadius: 9999,
                border: isActive
                  ? "2px solid var(--v2-ink)"
                  : "1px solid var(--v2-line)",
                background: isActive ? "var(--v2-ink)" : "var(--v2-paper)",
                color: isActive ? "#fff" : "var(--v2-body)",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "var(--font-clinical-body)",
                letterSpacing: "-0.005em",
              }}
            >
              <Mono
                size={10}
                weight={500}
                color={isActive ? "rgba(255,255,255,0.6)" : "var(--v2-mute)"}
              >
                {String(i + 1).padStart(2, "0")}
              </Mono>
              <span>{b.korLabel}</span>
              {answered && (
                <span
                  aria-hidden
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 9999,
                    background: isActive ? "#fff" : "var(--v2-accent)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CurrentBeliefHero({
  belief,
  index,
  total,
}: {
  belief: OriginBelief;
  index: number;
  total: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <Eyebrow size={9} weight={700} color="var(--v2-mute)" tracked="0.22em">
          {belief.monoLabel} · {belief.korLabel}
        </Eyebrow>
        {total > 1 && (
          <Mono size={11} weight={500} color="var(--v2-mute)" tracked={0.1}>
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(total).padStart(2, "0")}
          </Mono>
        )}
      </div>
      <QuoteBlock text={belief.text} size="md" />
    </div>
  );
}

function QuestionBlock({
  label,
  title,
  sub,
  children,
}: {
  label: string;
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2" style={{ marginBottom: 6 }}>
        <Mono size={10} weight={700} color="var(--v2-mute)" tracked={0.18}>
          {label}
        </Mono>
        <span
          style={{
            fontSize: 15.5,
            fontWeight: 700,
            color: "var(--v2-ink)",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </span>
      </div>
      {sub && (
        <p
          style={{
            fontSize: 12.5,
            lineHeight: 1.65,
            color: "var(--v2-mute)",
            marginBottom: 14,
          }}
        >
          {sub}
        </p>
      )}
      {children}
    </div>
  );
}

function SingleChoice({
  selected,
  otherLabel,
  onSelect,
  onOtherLabelChange,
}: {
  selected: OriginCheckId | "other" | undefined;
  otherLabel: string;
  onSelect: (id: OriginCheckId | "other") => void;
  onOtherLabelChange: (s: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {STAGE_02_ORIGIN_OPTIONS.map((opt) => {
        const isOn = selected === opt.id;
        return (
          <button
            type="button"
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            aria-pressed={isOn}
            className="text-left transition-colors"
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: isOn
                ? "2px solid var(--v2-ink)"
                : "1px solid var(--v2-line)",
              background: "var(--v2-paper)",
              boxShadow: isOn
                ? "0 2px 8px rgba(0,0,0,0.04)"
                : "0 1px 1px rgba(0,0,0,0.01)",
            }}
          >
            <div className="flex items-start gap-3">
              <Radio on={isOn} />
              <span style={{ flex: 1 }}>
                <span
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--v2-ink)",
                    letterSpacing: "-0.005em",
                  }}
                >
                  {opt.label}
                </span>
                {opt.sub && (
                  <span
                    style={{
                      display: "block",
                      marginTop: 4,
                      fontSize: 12,
                      lineHeight: 1.55,
                      color: "var(--v2-mute)",
                      letterSpacing: "-0.005em",
                    }}
                  >
                    {opt.sub}
                  </span>
                )}
              </span>
            </div>
          </button>
        );
      })}

      {/* "그 외" 직접 입력 — 카드를 토글하면 input 활성화 */}
      <div
        style={{
          padding: "12px 14px",
          borderRadius: 12,
          border:
            selected === "other"
              ? "2px solid var(--v2-ink)"
              : "1px solid var(--v2-line)",
          background: "var(--v2-paper)",
          boxShadow:
            selected === "other"
              ? "0 2px 8px rgba(0,0,0,0.04)"
              : "0 1px 1px rgba(0,0,0,0.01)",
        }}
      >
        <button
          type="button"
          onClick={() => onSelect("other")}
          aria-pressed={selected === "other"}
          className="flex w-full items-center gap-3 text-left"
        >
          <Radio on={selected === "other"} />
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--v2-ink)",
              letterSpacing: "-0.005em",
            }}
          >
            그 외 — 직접 적을게요
          </span>
        </button>
        {selected === "other" && (
          <input
            type="text"
            value={otherLabel}
            onChange={(e) => onOtherLabelChange(e.target.value)}
            placeholder="예: 첫 직장 1년차에 받은 평가 결과 이후"
            style={{
              marginTop: 10,
              marginLeft: 28,
              width: "calc(100% - 28px)",
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid var(--v2-line)",
              background: "var(--v2-paper)",
              fontSize: 13.5,
              color: "var(--v2-ink)",
              fontFamily: "var(--font-clinical-body)",
              outline: "none",
            }}
          />
        )}
      </div>
    </div>
  );
}

const textareaStyle: React.CSSProperties = {
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
};

function Radio({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        marginTop: 3,
        width: 16,
        height: 16,
        borderRadius: 9999,
        border: on
          ? "2px solid var(--v2-ink)"
          : "1.5px solid var(--v2-line)",
        background: "var(--v2-paper)",
        position: "relative",
        flexShrink: 0,
      }}
    >
      {on && (
        <span
          style={{
            position: "absolute",
            top: 2,
            left: 2,
            width: 8,
            height: 8,
            borderRadius: 9999,
            background: "var(--v2-ink)",
          }}
        />
      )}
    </span>
  );
}
