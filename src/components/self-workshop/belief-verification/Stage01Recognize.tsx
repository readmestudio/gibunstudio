"use client";

import { useEffect, useState } from "react";
import type {
  ChoiceValue,
  RecognizeRound,
  RecognizeStatement,
  Stage01Recognize as Stage01Data,
} from "@/lib/self-workshop/belief-verification";
import { Mono } from "@/components/self-workshop/clinical-report/shared/Mono";
import { Eyebrow } from "@/components/self-workshop/clinical-report/shared/Eyebrow";
import { ChoiceCard } from "./shared/ChoiceCard";
import { QuoteBlock } from "./shared/QuoteBlock";
import { ReceiptLine } from "./shared/ReceiptLine";

/**
 * Stage 01 — RECOGNIZE: 상황·기분·생각 구분하기.
 *
 * *기분 다스리기(Mind Over Mood)*의 표준 분리 실습.
 * 사용자가 이전 단계에서 적은 자료(상황, 감정 단어들, 자동사고, 신념 라인)를
 * 카드 단위로 분류하면서 *덩어리진 자기 진술이 사실상 세 컬럼으로 나뉜다*는
 * 감각을 익힌다. 신념 검증(Stage 02~06) 전에 분리 도구를 먼저 손에 쥐는 자리.
 *
 * 진행:
 * 1) 한 라운드 = STMT 라벨 + 인용 + 카드 3장(상황/기분/생각)
 * 2) 카드 선택 → 0.4s 페이드 → 다음 라운드
 * 3) 마지막 라운드 종료 → 동적 RECEIPT + "다음 단계로" 활성화
 */

const CHOICE_KOR_LABEL: Record<ChoiceValue, string> = {
  situation: "상황",
  emotion: "기분",
  thought: "생각",
};

const CHOICE_DESCRIPTION: Record<ChoiceValue, string> = {
  situation: "어디서·언제·누구와의 사실 — 카메라가 찍을 수 있는 장면.",
  emotion: "한 단어로 부를 수 있는 감정 — 슬픔·분노·불안·외로움 같은.",
  thought: "머릿속을 스친 문장 — 판단·해석·예측이 담긴 말.",
};

export function Stage01Recognize({
  statements,
  savedRounds,
  onUpdate,
}: {
  statements: RecognizeStatement[];
  savedRounds: RecognizeRound[];
  /** 라운드가 추가될 때마다 호출 — 부모가 즉시 자동저장 */
  onUpdate: (next: Stage01Data) => void;
}) {
  const total = statements.length;

  // 이어하기: 이미 답한 라운드는 건너뛰고 다음 인덱스부터 시작
  const initialIndex = Math.min(savedRounds.length, total);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [transition, setTransition] = useState(false);
  const [rounds, setRounds] = useState<RecognizeRound[]>(savedRounds);

  // savedRounds가 외부에서 바뀌면 동기화 (예: 다른 탭에서 진행 후 복귀)
  useEffect(() => {
    if (savedRounds.length > rounds.length) {
      setRounds(savedRounds);
      setCurrentIndex(Math.min(savedRounds.length, total));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedRounds.length, total]);

  const isFinished = currentIndex >= total;
  const current = !isFinished ? statements[currentIndex] : null;

  function handleChoice(choice: ChoiceValue) {
    if (!current || transition) return;
    const round: RecognizeRound = {
      statement_id: current.id,
      statement_text: current.text,
      choice,
      answered_at: new Date().toISOString(),
    };
    const nextRounds = [...rounds, round];
    setTransition(true);
    setTimeout(() => {
      setRounds(nextRounds);
      setCurrentIndex((i) => i + 1);
      setTransition(false);
      onUpdate({ rounds: nextRounds });
    }, 380);
  }

  // 데이터 부족 시 가드
  if (total === 0) {
    return (
      <div
        style={{
          padding: "32px 0",
          textAlign: "center",
          color: "var(--v2-mute)",
          fontSize: 13,
        }}
      >
        분류할 문장이 아직 충분하지 않아요. 이전 단계에서 상황·감정·자동사고를
        먼저 작성해 주세요.
      </div>
    );
  }

  return (
    <div>
      {/* 안내 1줄 */}
      <p
        style={{
          fontSize: 14,
          lineHeight: 1.7,
          color: "var(--v2-body)",
          letterSpacing: "-0.005em",
          marginBottom: 28,
        }}
      >
        그동안 적어둔 문장들을 한 장씩 보면서, 이게{" "}
        <strong style={{ color: "var(--v2-ink)" }}>상황·기분·생각</strong> 중
        어디에 가까운지 골라봐요. 머릿속에서 한 덩어리로 뭉쳐 있던 진술이 세
        가지로 나뉘는 게 보일 거예요.
      </p>

      {!isFinished && current && (
        <div
          style={{
            opacity: transition ? 0 : 1,
            transform: transition ? "translateY(6px)" : "translateY(0)",
            transition: "opacity 0.32s ease, transform 0.32s ease",
          }}
        >
          {/* 진행 인디케이터 */}
          <div
            className="flex items-center justify-between"
            style={{ marginBottom: 18 }}
          >
            <Mono size={11} weight={600} color="var(--v2-mute)" tracked={0.12}>
              {String(currentIndex + 1).padStart(2, "0")} /{" "}
              {String(total).padStart(2, "0")}
            </Mono>
            <Eyebrow
              size={9}
              weight={700}
              color="var(--v2-mute)"
              tracked="0.22em"
            >
              {current.monoLabel} · {current.korLabel}
            </Eyebrow>
          </div>

          {/* 인용 */}
          <div style={{ marginBottom: 28 }}>
            <QuoteBlock text={current.text} size="lg" />
          </div>

          {/* 세 선택지 (1열 세로 스택) */}
          <div className="flex flex-col gap-3">
            <ChoiceCard
              optionLabel="OPTION A · 상황"
              title="장면이 묘사된 사실에 가깝다"
              description={CHOICE_DESCRIPTION.situation}
              selected={false}
              onClick={() => handleChoice("situation")}
            />
            <ChoiceCard
              optionLabel="OPTION B · 기분"
              title="감정 단어로 부를 수 있다"
              description={CHOICE_DESCRIPTION.emotion}
              selected={false}
              onClick={() => handleChoice("emotion")}
            />
            <ChoiceCard
              optionLabel="OPTION C · 생각"
              title="판단·해석·예측이 담긴 말이다"
              description={CHOICE_DESCRIPTION.thought}
              selected={false}
              onClick={() => handleChoice("thought")}
            />
          </div>

          {/* 진행률 미니 도트 */}
          <div
            className="flex items-center justify-center gap-2"
            style={{ marginTop: 28 }}
          >
            {statements.map((_, i) => (
              <span
                key={i}
                aria-hidden
                style={{
                  width: i === currentIndex ? 18 : 6,
                  height: 6,
                  borderRadius: 9999,
                  background:
                    i < currentIndex
                      ? "var(--v2-ink)"
                      : i === currentIndex
                      ? "var(--v2-ink)"
                      : "var(--v2-line)",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {isFinished && <FinishedSummary rounds={rounds} total={total} />}
    </div>
  );
}

function FinishedSummary({
  rounds,
  total,
}: {
  rounds: RecognizeRound[];
  total: number;
}) {
  const counts: Record<ChoiceValue, number> = {
    situation: 0,
    emotion: 0,
    thought: 0,
  };
  for (const r of rounds) counts[r.choice] += 1;

  // 톤 — 사용자가 *생각* 카테고리에 가장 많이 분류했다면, 그게 정상 패턴이라는 안심.
  const top: ChoiceValue =
    counts.thought >= counts.emotion && counts.thought >= counts.situation
      ? "thought"
      : counts.emotion >= counts.situation
      ? "emotion"
      : "situation";

  const tail =
    top === "thought"
      ? "머릿속 문장 대부분이 *생각*이었네요. 사실처럼 들렸지만 실은 *판단과 해석*이었던 거예요."
      : top === "emotion"
      ? "감정의 비중이 컸어요. 감정은 사실도 신념도 아니지만, 분명한 신호로 함께 다뤄볼 가치가 있어요."
      : "상황 묘사가 많았네요. 이미 사실을 사실로 부르는 감각이 있어요.";

  return (
    <div>
      <div
        style={{
          padding: "20px 22px",
          borderRadius: 14,
          border: "1px solid var(--v2-line)",
          background: "var(--v2-line3)",
        }}
      >
        <Mono size={10} weight={700} color="var(--v2-mute)" tracked={0.18}>
          ROUND SUMMARY
        </Mono>
        <p
          style={{
            marginTop: 10,
            fontSize: 16,
            lineHeight: 1.6,
            color: "var(--v2-ink)",
            letterSpacing: "-0.01em",
            fontFamily: "var(--font-clinical-body)",
            fontWeight: 600,
          }}
        >
          {total}장을 풀어내 보니{" "}
          <span style={{ color: "var(--v2-accent)" }}>
            상황 {counts.situation} · 기분 {counts.emotion} · 생각{" "}
            {counts.thought}
          </span>
          이었어요.
        </p>

        {/* 라운드 별 미니 표 */}
        <ul style={{ marginTop: 14, display: "grid", rowGap: 6 }}>
          {rounds.map((r, i) => (
            <li
              key={i}
              className="flex items-center justify-between gap-3"
              style={{
                fontSize: 12,
                color: "var(--v2-body2)",
                fontFamily: "var(--font-clinical-body)",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Mono
                  size={10}
                  weight={500}
                  color="var(--v2-mute)"
                  tracked={0.06}
                >
                  {String(i + 1).padStart(2, "0")}
                </Mono>
                <span
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.statement_text}
                </span>
              </span>
              <Mono
                size={10}
                weight={700}
                color={
                  r.choice === "thought"
                    ? "var(--v2-accent)"
                    : "var(--v2-body2)"
                }
                tracked={0.1}
              >
                {CHOICE_KOR_LABEL[r.choice]}
              </Mono>
            </li>
          ))}
        </ul>
      </div>

      <ReceiptLine>
        OK. {tail}{" "}
        <strong style={{ color: "var(--v2-ink)" }}>
          상황과 분리해 다시 본 *생각*은 검증할 수 있어요.
        </strong>{" "}
        다음 단계에서 이 신념이 *처음 어떻게 당신을 도왔는지* 살펴볼게요.
      </ReceiptLine>
    </div>
  );
}
