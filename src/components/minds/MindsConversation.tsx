"use client";

/**
 * /minds 축약 진단 — 하이브리드 6문항 (~1~2분). 콰이엇 에디토리얼 리스킨.
 *
 * FREE_MINDS_STEPS 를 한 문항씩 진행한다. 문항 유형에 따라 렌더가 갈린다:
 *   · single   — 보기 칩 택1. 탭하면 곧바로 다음으로(가장 빠른 경로).
 *   · multi    — 보기 칩 다중선택 후 '다음'.
 *   · sentence — 문장 완성(빈칸 채우기). {대사} 토큰은 loudest_voice 답으로 치환,
 *                optional 문항은 건너뛰기 허용.
 *
 * 답변은 MindAnswer[](분석이 읽는 Q/A 텍스트)로 모아 onComplete 로 넘긴다.
 * 객관식 답은 사람이 읽는 label 로 저장해, 분석 프롬프트가 맥락으로 소화한다.
 */

import { useMemo, useState } from "react";
import { M, dispStyle, ctaStyle } from "./quiet-editorial";
import {
  FREE_MINDS_STEPS,
  FREE_MINDS_TOKENS,
} from "@/lib/minds/free-minds-flow";

export interface MindAnswer {
  id: string;
  question: string;
  answer: string;
}

export function MindsConversation({
  onComplete,
}: {
  onComplete: (answers: MindAnswer[]) => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<MindAnswer[]>([]);
  const [draft, setDraft] = useState(""); // sentence 입력
  const [picked, setPicked] = useState<string[]>([]); // multi 선택 label 들

  const step = FREE_MINDS_STEPS[index];
  const total = FREE_MINDS_STEPS.length;

  // {대사} 등 토큰을 이전 답으로 치환한 질문 문구.
  const question = useMemo(() => {
    let out = step.opening;
    for (const [token, pointId] of Object.entries(FREE_MINDS_TOKENS)) {
      if (!out.includes(token)) continue;
      const prev = answers.find((a) => a.id === pointId)?.answer.trim();
      out = out.replaceAll(token, prev || "그 마음");
    }
    return out;
  }, [step.opening, answers]);

  // 공통 진행 — value(사람이 읽는 답변 텍스트)를 저장하고 다음 문항으로.
  const advance = (value: string) => {
    const next = [...answers, { id: step.id, question, answer: value }];
    if (index + 1 >= total) {
      onComplete(next);
      return;
    }
    setAnswers(next);
    setDraft("");
    setPicked([]);
    setIndex(index + 1);
  };

  return (
    <section style={{ paddingTop: 16 }}>
      {/* 진행 표시 — 헤어라인 세그먼트 막대 */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
        {FREE_MINDS_STEPS.map((s, i) => (
          <span
            key={s.id}
            style={{ height: 3, flex: 1, borderRadius: 2, background: i <= index ? M.ink : M.line }}
          />
        ))}
      </div>
      <p style={{ marginBottom: 18, fontSize: 11, color: M.mute, fontFamily: M.mono, letterSpacing: "0.18em", fontVariantNumeric: "tabular-nums" }}>
        {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </p>

      <h2 style={{ ...dispStyle, fontSize: 23, fontWeight: 700 }}>{question}</h2>
      {step.hint && (
        <p style={{ marginTop: 12, fontSize: 13.5, lineHeight: 1.7, color: M.mute, fontFamily: M.font }}>
          {step.hint}
        </p>
      )}

      {/* ── 유형별 입력 ── */}
      {step.type === "single" && (
        <ChoiceList
          options={step.options ?? []}
          selected={picked}
          multi={false}
          onToggle={(label) => advance(label)} // 택1은 탭 즉시 진행
        />
      )}

      {step.type === "multi" && (
        <>
          <ChoiceList
            options={step.options ?? []}
            selected={picked}
            multi
            maxSelect={step.maxSelect}
            onToggle={(label) =>
              setPicked((cur) => {
                if (cur.includes(label)) return cur.filter((x) => x !== label);
                if (step.maxSelect && cur.length >= step.maxSelect) return cur;
                return [...cur, label];
              })
            }
          />
          <button
            type="button"
            disabled={picked.length === 0}
            onClick={() => advance(picked.join(", "))}
            style={{ ...ctaStyle, marginTop: 22, padding: "18px 20px", opacity: picked.length ? 1 : 0.4 }}
            className="transition-transform active:scale-[0.99]"
          >
            다음
          </button>
        </>
      )}

      {step.type === "sentence" && (
        <SentenceInput
          step={step}
          draft={draft}
          setDraft={setDraft}
          isLast={index + 1 >= total}
          onSubmit={advance}
        />
      )}
    </section>
  );
}

/* ─────────────── 객관식 보기(칩) ─────────────── */

function ChoiceList({
  options,
  selected,
  multi,
  maxSelect,
  onToggle,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  multi: boolean;
  maxSelect?: number;
  onToggle: (label: string) => void;
}) {
  const atLimit = multi && maxSelect ? selected.length >= maxSelect : false;
  return (
    <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 10 }}>
      {options.map((o) => {
        const on = selected.includes(o.label);
        const dim = !on && atLimit;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onToggle(o.label)}
            disabled={dim}
            style={{
              textAlign: "left",
              padding: "16px 18px",
              borderRadius: 2,
              background: on ? M.ink : M.paper2,
              color: on ? M.paper : M.ink,
              boxShadow: on ? "none" : `inset 0 0 0 1px ${M.line}`,
              fontSize: 15,
              lineHeight: 1.5,
              fontFamily: M.font,
              cursor: dim ? "default" : "pointer",
              opacity: dim ? 0.4 : 1,
              transition: "background 0.12s, color 0.12s",
            }}
            className="active:scale-[0.99]"
          >
            {multi && (
              <span
                aria-hidden
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 18,
                  height: 18,
                  marginRight: 12,
                  borderRadius: 3,
                  verticalAlign: "-3px",
                  background: on ? M.paper : "transparent",
                  boxShadow: on ? "none" : `inset 0 0 0 1.5px ${M.line}`,
                  color: M.ink,
                  fontSize: 12,
                }}
              >
                {on ? "✓" : ""}
              </span>
            )}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────── 문장 완성 입력 ─────────────── */

function SentenceInput({
  step,
  draft,
  setDraft,
  isLast,
  onSubmit,
}: {
  step: (typeof FREE_MINDS_STEPS)[number];
  draft: string;
  setDraft: (v: string) => void;
  isLast: boolean;
  onSubmit: (value: string) => void;
}) {
  const trimmed = draft.trim();
  const tooShort =
    !step.optional &&
    typeof step.minChars === "number" &&
    trimmed.length > 0 &&
    trimmed.length < step.minChars;
  const canAdvance = step.optional || (trimmed.length > 0 && !tooShort);

  return (
    <>
      {step.stemLead && (
        <p style={{ marginTop: 22, fontSize: 15, lineHeight: 1.6, color: M.ink, fontFamily: M.font, fontWeight: 600 }}>
          {step.stemLead}
        </p>
      )}
      <div style={{ position: "relative", marginTop: step.stemLead ? 10 : 22 }}>
        {step.quoted && (
          <span aria-hidden style={{ position: "absolute", top: 8, left: 14, fontSize: 22, color: M.mute, fontFamily: M.font }}>
            &ldquo;
          </span>
        )}
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          autoFocus
          placeholder={step.quoted ? "여기에 그 목소리를 그대로 적어보세요…" : "떠오르는 대로 편하게 적어보세요…"}
          style={{
            width: "100%",
            resize: "none",
            borderRadius: 2,
            background: M.paper2,
            boxShadow: `inset 0 0 0 1px ${M.line}`,
            padding: step.quoted ? "14px 20px 14px 26px" : "14px 16px",
            fontSize: 15,
            lineHeight: 1.7,
            color: M.ink,
            fontFamily: M.font,
            outline: "none",
          }}
        />
      </div>
      {tooShort && (
        <p style={{ marginTop: 8, fontSize: 12, color: M.mute, fontFamily: M.font }}>
          조금만 더 적어주시면 마음을 또렷이 그릴 수 있어요.
        </p>
      )}

      <button
        type="button"
        disabled={!canAdvance}
        onClick={() => onSubmit(trimmed)}
        style={{ ...ctaStyle, marginTop: 22, padding: "18px 20px", opacity: canAdvance ? 1 : 0.4 }}
        className="transition-transform active:scale-[0.99]"
      >
        {isLast ? "내 마음들 만나보기" : "다음"}
      </button>

      {step.optional && (
        <button
          type="button"
          onClick={() => onSubmit("")}
          style={{ marginTop: 12, width: "100%", padding: "8px 0", fontSize: 13, color: M.mute, fontFamily: M.font, background: "none", border: "none", cursor: "pointer" }}
        >
          이 질문은 건너뛸게요
        </button>
      )}
    </>
  );
}
