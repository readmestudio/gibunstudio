"use client";

import { useMemo, useState } from "react";
import type {
  PrimaryKeyword,
  RewriteCardId,
  Stage06Rewrite as Stage06Data,
} from "@/lib/self-workshop/belief-verification";
import { STAGE_06_CARDS } from "@/lib/self-workshop/belief-verification-copy";
import { Mono } from "@/components/self-workshop/clinical-report/shared/Mono";
import { ReceiptLine } from "./shared/ReceiptLine";

/**
 * Stage 06 — REWRITE (중심 단계).
 *
 * 카드 3장(SOFTEN / REFRAME / DECOUPLE) 중 *조금이라도 동의되는* 버전을
 * **여러 개** 선택 가능. 다시 클릭하면 해제.
 * "어느 것도 동의되지 않아요" → 옵션 A 본문을 채운 textarea로 진입, 한 단어만 수정해도 OK.
 */
export function Stage06Rewrite({
  data,
  primaryKeyword,
  originalBeliefLine,
  onUpdate,
}: {
  data: Stage06Data | undefined;
  primaryKeyword: PrimaryKeyword;
  originalBeliefLine: string;
  onUpdate: (next: Stage06Data) => void;
}) {
  const cards = STAGE_06_CARDS[primaryKeyword];
  const value: Stage06Data = useMemo(() => data ?? {}, [data]);

  // 레거시 단일 선택 데이터를 chosen_cards로 호환 매핑
  const chosenCards: RewriteCardId[] = useMemo(() => {
    if (Array.isArray(value.chosen_cards) && value.chosen_cards.length > 0) {
      return value.chosen_cards;
    }
    if (value.chosen_card) return [value.chosen_card];
    return [];
  }, [value.chosen_cards, value.chosen_card]);

  const [editMode, setEditMode] = useState(
    typeof value.edited_text === "string" &&
      chosenCards.length === 0 &&
      !!value.edited_text
  );
  const [draftEdit, setDraftEdit] = useState(
    value.edited_text ?? cards[0].body
  );

  function toggleCard(id: RewriteCardId) {
    const isSelected = chosenCards.includes(id);
    const nextCards = isSelected
      ? chosenCards.filter((c) => c !== id)
      : [...chosenCards, id];

    onUpdate({
      ...value,
      chosen_cards: nextCards.length > 0 ? nextCards : undefined,
      // 카드를 선택하면 편집 텍스트는 무효화
      edited_text: undefined,
      // 레거시 필드 비움 — 새 모델로 통일
      chosen_card: undefined,
      chosen_text: undefined,
    });
    setEditMode(false);
  }

  function commitEdited() {
    onUpdate({
      ...value,
      chosen_cards: undefined,
      chosen_card: undefined,
      chosen_text: undefined,
      edited_text: draftEdit.trim(),
    });
  }

  const hasChoice = chosenCards.length > 0 || !!value.edited_text;

  return (
    <div className="flex flex-col gap-7">
      {/* 원래 신념 회색 */}
      <div>
        <Mono size={10} weight={700} color="var(--v2-mute)" tracked={0.18}>
          ORIGINAL BELIEF
        </Mono>
        <p
          style={{
            marginTop: 8,
            fontSize: 14,
            color: "var(--v2-mute)",
            fontStyle: "italic",
            letterSpacing: "-0.005em",
          }}
        >
          “{originalBeliefLine}”
        </p>
      </div>

      <p
        style={{
          fontSize: 14,
          lineHeight: 1.7,
          color: "var(--v2-body)",
          letterSpacing: "-0.005em",
        }}
      >
        이 신념을 한 번에 바꿀 필요는 없어요. 지금{" "}
        <strong style={{ color: "var(--v2-ink)" }}>
          조금이라도 동의가 되는
        </strong>{" "}
        버전을 골라보세요. 여러 개 골라도 괜찮아요. 정답은 없어요.
      </p>

      {!editMode && (
        <div className="flex flex-col gap-4">
          {cards.map((c, i) => (
            <RewriteCardView
              key={c.id}
              card={c}
              index={i}
              total={cards.length}
              selected={chosenCards.includes(c.id)}
              onToggle={() => toggleCard(c.id)}
            />
          ))}
        </div>
      )}

      {!editMode && chosenCards.length === 0 && (
        <button
          type="button"
          onClick={() => {
            setEditMode(true);
            setDraftEdit(value.edited_text ?? cards[0].body);
          }}
          className="self-start text-sm text-[var(--v2-mute)] underline-offset-4 hover:text-[var(--v2-ink)] hover:underline"
        >
          어느 것도 동의되지 않아요 →
        </button>
      )}

      {editMode && (
        <div
          style={{
            padding: "20px 22px",
            borderRadius: 14,
            border: "1px solid var(--v2-line)",
            background: "var(--v2-line3)",
          }}
        >
          <Mono size={10} weight={700} color="var(--v2-mute)" tracked={0.18}>
            CUSTOM REWRITE
          </Mono>
          <p
            style={{
              marginTop: 10,
              fontSize: 14,
              lineHeight: 1.7,
              color: "var(--v2-body)",
            }}
          >
            한 가지만 물을게요.{" "}
            <strong style={{ color: "var(--v2-ink)" }}>
              원래 신념과 옵션 A 사이
            </strong>{" "}
            어딘가에, 당신이 동의할 수 있는 지점이 있을까요? 한 단어만 바꿔도
            괜찮아요.
          </p>
          <textarea
            value={draftEdit}
            onChange={(e) => setDraftEdit(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              marginTop: 14,
              resize: "vertical",
              padding: "14px 16px",
              borderRadius: 10,
              border: "1px solid var(--v2-line)",
              background: "var(--v2-paper)",
              fontSize: 14.5,
              lineHeight: 1.7,
              color: "var(--v2-ink)",
              fontFamily: "var(--font-clinical-body)",
              outline: "none",
            }}
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={commitEdited}
              disabled={draftEdit.trim().length === 0}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--v2-ink)] px-5 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-30"
            >
              이 버전으로 갈게요 →
            </button>
            <button
              type="button"
              onClick={() => setEditMode(false)}
              className="text-sm text-[var(--v2-mute)] hover:text-[var(--v2-ink)]"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {hasChoice && (
        <ReceiptLine>
          방금 고른 문장이 100% 믿어질 필요는 없어요.{" "}
          <strong style={{ color: "var(--v2-ink)" }}>
            조금이라도 동의가 된다
          </strong>
          면 그걸로 충분해요. 같은 문장을 자주 보면, 어느 순간 살짝 더
          사실처럼 느껴지는 순간이 와요.
        </ReceiptLine>
      )}
    </div>
  );
}

function RewriteCardView({
  card,
  index,
  total,
  selected,
  onToggle,
}: {
  card: { id: RewriteCardId; stepLabel: string; body: string; why: string };
  index: number;
  total: number;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      style={{
        borderRadius: 14,
        padding: "20px 22px",
        background: "var(--v2-paper)",
        border: selected
          ? "2px solid var(--v2-ink)"
          : "1px solid var(--v2-line)",
        boxShadow: selected
          ? "0 4px 20px rgba(0,0,0,0.06)"
          : "0 1px 2px rgba(0,0,0,0.02)",
      }}
    >
      <div className="flex items-center justify-between">
        <Mono size={10} weight={700} color="var(--v2-mute)" tracked={0.18}>
          {card.stepLabel}
        </Mono>
        <Mono size={10} weight={500} color="var(--v2-mute)">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </Mono>
      </div>

      <p
        style={{
          marginTop: 14,
          fontSize: 16.5,
          fontWeight: 700,
          lineHeight: 1.55,
          color: "var(--v2-ink)",
          letterSpacing: "-0.015em",
          fontFamily: "var(--font-clinical-body)",
          textWrap: "pretty",
        }}
      >
        “{card.body}”
      </p>

      <p
        style={{
          marginTop: 12,
          fontSize: 12.5,
          lineHeight: 1.7,
          color: "var(--v2-body2)",
        }}
      >
        ↳ 왜 이게 더 정확할까: {card.why}
      </p>

      <button
        type="button"
        onClick={onToggle}
        className={
          selected
            ? "mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--v2-ink)] bg-white px-5 py-2 text-sm font-semibold text-[var(--v2-ink)] transition-opacity hover:opacity-90"
            : "mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--v2-ink)] bg-[var(--v2-ink)] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        }
      >
        {selected ? "선택됨 ✓ — 다시 누르면 해제" : "이걸로 골라요"}
      </button>
    </div>
  );
}
