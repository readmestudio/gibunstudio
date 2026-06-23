"use client";

/**
 * /minds 3단계 — 축약 대화 (5문항, ~7~10분). 콰이엇 에디토리얼 리스킨.
 *
 * FREE_MINDS_STEPS를 한 문항씩 진행한다. {대사} 토큰은 loudest_voice 답으로 치환,
 * optional 문항은 건너뛰기 허용. 답변을 MindAnswer[]로 모아 onComplete로 넘긴다.
 *
 * 골격: LLM 동적 후속질문(explore-followup)은 아직 없음 — 정적 흐름. 다음 단계에서
 * 핵심 문항(loudest_voice 등)에 "한 걸음 더" 후속질문을 붙여 답의 충실도를 높인다.
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
  const [draft, setDraft] = useState("");

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

  const trimmed = draft.trim();
  const tooShort =
    !step.optional &&
    typeof step.minChars === "number" &&
    trimmed.length > 0 &&
    trimmed.length < step.minChars;
  const canAdvance = step.optional || (trimmed.length > 0 && !tooShort);

  const advance = (value: string) => {
    const next = [...answers, { id: step.id, question, answer: value }];
    if (index + 1 >= total) {
      onComplete(next);
      return;
    }
    setAnswers(next);
    setDraft("");
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

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={5}
        autoFocus
        placeholder="떠오르는 대로 편하게 적어보세요."
        style={{
          marginTop: 22,
          width: "100%",
          resize: "none",
          borderRadius: 2,
          background: M.paper2,
          boxShadow: `inset 0 0 0 1px ${M.line}`,
          padding: "14px 16px",
          fontSize: 15,
          lineHeight: 1.7,
          color: M.ink,
          fontFamily: M.font,
          outline: "none",
        }}
      />
      {tooShort && (
        <p style={{ marginTop: 8, fontSize: 12, color: M.mute, fontFamily: M.font }}>
          조금만 더 적어주시면 마음을 또렷이 그릴 수 있어요.
        </p>
      )}

      <button
        type="button"
        disabled={!canAdvance}
        onClick={() => advance(trimmed)}
        style={{ ...ctaStyle, marginTop: 22, padding: "18px 20px", opacity: canAdvance ? 1 : 0.4 }}
        className="transition-transform active:scale-[0.99]"
      >
        {index + 1 >= total ? "내 마음들 만나보기" : "다음"}
      </button>

      {step.optional && (
        <button
          type="button"
          onClick={() => advance("")}
          style={{ marginTop: 12, width: "100%", padding: "8px 0", fontSize: 13, color: M.mute, fontFamily: M.font, background: "none", border: "none", cursor: "pointer" }}
        >
          이 질문은 건너뛸게요
        </button>
      )}
    </section>
  );
}
