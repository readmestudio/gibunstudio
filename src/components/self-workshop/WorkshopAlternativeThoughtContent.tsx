"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isAlternativeThoughtMinimallyComplete,
  NEW_EMOTIONS,
  seedSimulationFromMechanism,
  TUTORIAL_EMOTIONS,
  TUTORIAL_SITUATION,
  TUTORIAL_THOUGHTS,
  type AltThoughtCard,
  type AltThoughtCardId,
  type AlternativeThoughtSimulation,
  type EmotionId,
  type TutorialEmotionId,
} from "@/lib/self-workshop/alternative-thought-simulation";
import { Mono } from "@/components/self-workshop/clinical-report/shared/Mono";

const ACCENT = "#FF5A1F";
const ACCENT_SOFT = "rgba(255,90,31,0.08)";

interface MechanismSnapshot {
  situation: string;
  automatic_thought: string;
  emotion: string;
  behavior: string;
}

interface Props {
  workshopId: string;
  savedData?: Partial<AlternativeThoughtSimulation>;
  mechanism: MechanismSnapshot;
}

/**
 * Stage 07 — 대안 자동사고 시뮬레이션.
 * PART A 튜토리얼 (워밍업) → PART B 본인 사례 (시뮬레이션) → RECAP → 다음 단계.
 */
export function WorkshopAlternativeThoughtContent({
  workshopId,
  savedData,
  mechanism,
}: Props) {
  const router = useRouter();

  const initial: AlternativeThoughtSimulation = useMemo(
    () => seedSimulationFromMechanism(savedData, mechanism),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [data, setData] = useState<AlternativeThoughtSimulation>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const autoSave = useCallback(
    (next: AlternativeThoughtSimulation) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void fetch("/api/self-workshop/save-progress", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workshopId,
            field: "alternative_thought_simulation",
            data: next,
          }),
        });
      }, 1000);
    },
    [workshopId]
  );

  function patch(p: Partial<AlternativeThoughtSimulation>) {
    const next: AlternativeThoughtSimulation = { ...data, ...p };
    setData(next);
    autoSave(next);
  }

  const canAdvance = isAlternativeThoughtMinimallyComplete(data);

  async function handleAdvance() {
    if (submitting || !canAdvance) return;
    setSubmitting(true);
    setError("");
    try {
      const finalState: AlternativeThoughtSimulation = {
        ...data,
        completed_at: data.completed_at ?? new Date().toISOString(),
      };
      const res = await fetch("/api/self-workshop/save-progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshopId,
          field: "alternative_thought_simulation",
          data: finalState,
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

  return (
    <div
      className="mx-auto flex flex-col gap-12 px-5"
      style={{ maxWidth: 760 }}
    >
      <PartATutorial
        state={data.tutorial ?? {}}
        onUpdate={(t) => patch({ tutorial: { ...data.tutorial, ...t } })}
      />

      <PartBYourTurn
        data={data}
        onPatch={patch}
        onAdvance={handleAdvance}
        submitting={submitting}
        canAdvance={canAdvance}
      />

      {error && (
        <p style={{ textAlign: "center", color: "#c2410c", fontSize: 13 }}>
          {error}
        </p>
      )}

      <DisclaimerFooter />

      <style>{`
        @keyframes atSwap {
          0%   { opacity: 0; transform: translateY(-6px) scale(0.992); filter: blur(2px); }
          60%  { opacity: 1; filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes atFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes atDrop {
          0%   { transform: translateY(-12px); opacity: 0; }
          30%  { opacity: 1; }
          100% { transform: translateY(22px); opacity: 0; }
        }
        @keyframes atDropLoop {
          0%   { transform: translateY(-12px); opacity: 0; }
          20%  { opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(22px); opacity: 0; }
        }
        @keyframes atSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   PART A · TUTORIAL
   ════════════════════════════════════════════════════════════════════════ */

function PartATutorial({
  state,
  onUpdate,
}: {
  state: {
    first_emotion?: TutorialEmotionId;
    first_emotion_custom?: string;
    second_emotion?: TutorialEmotionId;
    second_emotion_custom?: string;
  };
  onUpdate: (next: {
    first_emotion?: TutorialEmotionId;
    first_emotion_custom?: string;
    second_emotion?: TutorialEmotionId;
    second_emotion_custom?: string;
  }) => void;
}) {
  const firstPicked =
    !!state.first_emotion ||
    (state.first_emotion_custom?.trim().length ?? 0) > 0;
  const secondPicked =
    !!state.second_emotion ||
    (state.second_emotion_custom?.trim().length ?? 0) > 0;

  const phase: "first" | "second" | "done" = !firstPicked
    ? "first"
    : !secondPicked
      ? "second"
      : "done";

  const [glow, setGlow] = useState(false);
  const askingNewEmotion = phase !== "first";
  const thoughtIdx = phase === "first" ? 0 : 1;
  const thought = TUTORIAL_THOUGHTS[thoughtIdx];

  function pickFirst(id: TutorialEmotionId) {
    if (phase !== "first") return;
    onUpdate({ first_emotion: id, first_emotion_custom: undefined });
    setTimeout(() => setGlow(true), 280);
    setTimeout(() => setGlow(false), 2100);
  }
  function customFirst(text: string) {
    if (phase !== "first") return;
    onUpdate({ first_emotion: undefined, first_emotion_custom: text });
    setTimeout(() => setGlow(true), 280);
    setTimeout(() => setGlow(false), 2100);
  }
  function pickSecond(id: TutorialEmotionId) {
    onUpdate({ second_emotion: id, second_emotion_custom: undefined });
  }
  function customSecond(text: string) {
    onUpdate({ second_emotion: undefined, second_emotion_custom: text });
  }
  function reset() {
    onUpdate({
      first_emotion: undefined,
      first_emotion_custom: undefined,
      second_emotion: undefined,
      second_emotion_custom: undefined,
    });
  }

  const firstEmoDef = state.first_emotion
    ? TUTORIAL_EMOTIONS.find((e) => e.id === state.first_emotion)
    : null;
  const secondEmoDef = state.second_emotion
    ? TUTORIAL_EMOTIONS.find((e) => e.id === state.second_emotion)
    : null;
  const firstCustomLabel = state.first_emotion_custom?.trim() || null;
  const secondCustomLabel = state.second_emotion_custom?.trim() || null;
  const currentEmoDef = askingNewEmotion ? secondEmoDef : firstEmoDef;
  const currentCustomLabel = askingNewEmotion
    ? secondCustomLabel
    : firstCustomLabel;

  return (
    <section>
      <SectionHeader
        kicker="● PART A · TUTORIAL"
        rightLabel="WARM-UP"
        accent={false}
      />

      <h2
        style={{
          margin: "20px 0 0",
          fontWeight: 700,
          fontSize: 32,
          lineHeight: 1.15,
          letterSpacing: "-0.025em",
          color: "var(--v2-ink)",
          textWrap: "balance",
          fontFamily: "var(--font-clinical-body)",
        }}
      >
        생각이 바뀌면, 감정도 바뀝니다.
      </h2>
      <p
        style={{
          margin: "14px 0 0",
          fontSize: 15,
          lineHeight: 1.7,
          color: "var(--v2-body)",
          maxWidth: 640,
          letterSpacing: "-0.005em",
          fontFamily: "var(--font-clinical-body)",
        }}
      >
        같은 상황이라도, 그 사이에 어떤 자동사고가 끼어드느냐에 따라 마지막에 도착하는
        감정이 달라져요. 본인 사례로 들어가기 전에, 짧은 예시 하나로 그 흐름을 먼저
        느껴볼게요.
      </p>

      <DiagramFrame label="FIG. 07-A · SAME SITUATION → DIFFERENT THOUGHT">
        <DiagramNode label="STEP 01 · 상황" kind="SITUATION">
          <div
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: "var(--v2-ink)",
              lineHeight: 1.45,
              letterSpacing: "-0.01em",
              fontFamily: "var(--font-clinical-body)",
            }}
          >
            {TUTORIAL_SITUATION}
          </div>
          <div style={{ marginTop: 8 }}>
            <Mono size={10} weight={500} color="var(--v2-mute)" tracked={0.16}>
              FIXED · 변하지 않음
            </Mono>
          </div>
        </DiagramNode>

        <Connector label="자동사고" animKey={thought.id} />

        <DiagramNode
          label={`STEP 02 · 자동사고 ${thoughtIdx === 0 ? "· FIRST" : "· ALTERNATIVE"}`}
          kind="THOUGHT"
          accent
          glow={glow}
          animKey={thought.id}
        >
          <div
            style={{
              fontSize: 21,
              fontWeight: 700,
              color: "var(--v2-ink)",
              lineHeight: 1.4,
              letterSpacing: "-0.015em",
              textWrap: "pretty",
              fontFamily: "var(--font-clinical-body)",
            }}
          >
            {thought.text}
          </div>
          <div style={{ marginTop: 12 }}>
            <Mono size={10} weight={500} color={ACCENT} tracked={0.16}>
              ↻ MORPHING · 이 한 칸만 바뀝니다
            </Mono>
          </div>
        </DiagramNode>

        <Connector
          label="결과 감정"
          animKey={
            (askingNewEmotion ? state.second_emotion : state.first_emotion) ??
            thought.id
          }
        />

        <DiagramNode
          label={`STEP 03 · 감정 ${askingNewEmotion ? "· NEW" : ""}`}
          kind="EMOTION"
          animKey={
            (askingNewEmotion ? state.second_emotion : state.first_emotion) ??
            "empty"
          }
        >
          {currentEmoDef ? (
            <EmotionDisplay
              ko={currentEmoDef.ko}
              en={currentEmoDef.en}
              glyph={currentEmoDef.glyph}
              glyphColor={ACCENT}
            />
          ) : currentCustomLabel ? (
            <EmotionDisplay
              ko={currentCustomLabel}
              en="CUSTOM"
              glyph="◎"
              glyphColor={ACCENT}
            />
          ) : (
            <div
              style={{
                fontSize: 14,
                color: "var(--v2-mute)",
                lineHeight: 1.5,
                fontFamily: "var(--font-clinical-body)",
              }}
            >
              아래에서 어울리는 감정을 골라보세요.
            </div>
          )}
        </DiagramNode>
      </DiagramFrame>

      <div style={{ marginTop: 32 }}>
        <Mono size={10} weight={600} color="var(--v2-mute)" tracked={0.16}>
          QUESTION {askingNewEmotion ? "02" : "01"}
        </Mono>
        <h3
          style={{
            margin: "10px 0 0",
            fontWeight: 700,
            fontSize: 22,
            color: "var(--v2-ink)",
            lineHeight: 1.35,
            letterSpacing: "-0.018em",
            textWrap: "pretty",
            fontFamily: "var(--font-clinical-body)",
          }}
        >
          {askingNewEmotion ? (
            <>
              자동사고가{" "}
              <span style={{ color: ACCENT }}>{thought.text}</span>로
              바뀌었어요. 그렇다면 감정은 어떻게 변할까요?
            </>
          ) : (
            <>
              만약 당신의 자동사고가{" "}
              <span style={{ color: ACCENT }}>{thought.text}</span>였다면, 어떤
              감정이 들었을까요?
            </>
          )}
        </h3>

        <EmotionGrid
          options={TUTORIAL_EMOTIONS}
          pickedId={askingNewEmotion ? state.second_emotion : state.first_emotion}
          customValue={
            askingNewEmotion
              ? state.second_emotion_custom
              : state.first_emotion_custom
          }
          locked={
            askingNewEmotion
              ? phase === "done" && (!!state.second_emotion || !!secondCustomLabel)
              : phase !== "first"
          }
          onPick={(id) => (askingNewEmotion ? pickSecond(id) : pickFirst(id))}
          onCustomCommit={(text) =>
            askingNewEmotion ? customSecond(text) : customFirst(text)
          }
        />

        {phase !== "first" && (firstEmoDef || firstCustomLabel) && (
          <div
            style={{
              marginTop: 16,
              padding: "12px 14px",
              borderRadius: 12,
              background: "var(--v2-line3)",
              animation: "atFadeIn .3s ease",
            }}
          >
            <Mono size={9} weight={500} color="var(--v2-mute)" tracked={0.14}>
              NOTED · 첫 자동사고 → 감정
            </Mono>
            <div
              style={{
                marginTop: 6,
                fontSize: 13,
                color: "var(--v2-ink)",
                lineHeight: 1.6,
                fontFamily: "var(--font-clinical-body)",
              }}
            >
              <span style={{ color: "var(--v2-body)" }}>
                {TUTORIAL_THOUGHTS[0].text}
              </span>
              <span
                style={{
                  margin: "0 8px",
                  color: "var(--v2-mute)",
                  fontFamily: "var(--font-clinical-mono)",
                }}
              >
                →
              </span>
              <b style={{ color: "var(--v2-ink)" }}>
                {firstEmoDef?.ko ?? firstCustomLabel}
              </b>
            </div>
          </div>
        )}

        {phase === "done" && (secondEmoDef || secondCustomLabel) && (
          <div
            style={{
              marginTop: 12,
              padding: "12px 14px",
              borderRadius: 12,
              background: "var(--v2-ink)",
              color: "#fff",
              animation: "atFadeIn .3s ease",
            }}
          >
            <Mono
              size={9}
              weight={500}
              color="rgba(255,255,255,0.55)"
              tracked={0.14}
            >
              NOTED · 대안 자동사고 → 감정
            </Mono>
            <div
              style={{
                marginTop: 6,
                fontSize: 13,
                lineHeight: 1.6,
                fontFamily: "var(--font-clinical-body)",
              }}
            >
              <span style={{ opacity: 0.7 }}>{TUTORIAL_THOUGHTS[1].text}</span>
              <span
                style={{
                  margin: "0 8px",
                  opacity: 0.5,
                  fontFamily: "var(--font-clinical-mono)",
                }}
              >
                →
              </span>
              <b style={{ color: "#fff" }}>
                {secondEmoDef?.ko ?? secondCustomLabel}
              </b>
            </div>
          </div>
        )}
      </div>

      {phase === "done" && (
        <div
          style={{
            marginTop: 32,
            background: "var(--v2-ink)",
            color: "#fff",
            borderRadius: 18,
            padding: "22px 24px",
            animation: "atFadeIn .4s ease",
          }}
        >
          <Mono
            size={10}
            weight={600}
            color="rgba(255,255,255,0.55)"
            tracked={0.14}
          >
            SYSTEM · TAKEAWAY
          </Mono>
          <div
            style={{
              marginTop: 12,
              fontSize: 15.5,
              lineHeight: 1.65,
              color: "#fff",
              letterSpacing: "-0.005em",
              fontFamily: "var(--font-clinical-body)",
            }}
          >
            상황은 그대로였어요. 바뀐 건 가운데 한 칸,{" "}
            <span style={{ color: ACCENT, fontWeight: 700 }}>자동사고</span>뿐이었고,
            마지막 칸의 감정이 그에 따라 따라왔습니다. 이걸 이제, 본인 이야기에 그대로
            적용해볼게요.
          </div>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 14,
              fontSize: 12,
              fontWeight: 500,
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "rgba(255,255,255,0.85)",
              borderRadius: 999,
              padding: "6px 14px",
              cursor: "pointer",
              fontFamily: "var(--font-clinical-body)",
            }}
          >
            ↺ 다시 해보기
          </button>
        </div>
      )}
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   PART B · YOUR TURN
   ════════════════════════════════════════════════════════════════════════ */

function PartBYourTurn({
  data,
  onPatch,
  onAdvance,
  submitting,
  canAdvance,
}: {
  data: AlternativeThoughtSimulation;
  onPatch: (p: Partial<AlternativeThoughtSimulation>) => void;
  onAdvance: () => void;
  submitting: boolean;
  canAdvance: boolean;
}) {
  const picked = data.cards?.find((c) => c.id === data.picked_card_id) ?? null;
  const newEmoDef = data.new_emotion_id
    ? NEW_EMOTIONS.find((e) => e.id === data.new_emotion_id)
    : null;
  const newCustomLabel = data.new_emotion_custom?.trim() || null;
  const hasNewEmotion = !!newEmoDef || !!newCustomLabel;

  const phase: "original" | "pick" | "emotion" | "done" = !picked
    ? "original"
    : !hasNewEmotion
      ? "emotion"
      : "done";

  const [pickerOpen, setPickerOpen] = useState(false);
  const [glow, setGlow] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);
  const [cardsError, setCardsError] = useState<string | null>(null);

  const showAlt = !!picked;
  const thoughtText = showAlt
    ? picked!.text
    : data.original_automatic_thought ?? "";
  const thoughtLabel = showAlt
    ? `STEP 02 · 대안 자동사고 · ${picked!.code}`
    : "STEP 02 · 자동사고 · ORIGINAL";
  const thoughtAnimKey = showAlt ? picked!.id : "orig";

  const ensureCards = useCallback(async () => {
    if (data.cards && data.cards.length >= 3) return;
    if (loadingCards) return;
    setLoadingCards(true);
    setCardsError(null);
    try {
      const res = await fetch(
        "/api/self-workshop/alternative-thought-suggestions",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            situation: data.situation ?? "",
            original_automatic_thought: data.original_automatic_thought ?? "",
          }),
        }
      );
      if (!res.ok) throw new Error("ai_failed");
      const json = (await res.json()) as { cards?: AltThoughtCard[] };
      const cards = json.cards ?? [];
      if (cards.length < 3) throw new Error("incomplete");
      onPatch({ cards });
    } catch {
      setCardsError(
        "대안 자동사고를 가져오지 못했어요. 잠시 후 다시 시도해주세요."
      );
    } finally {
      setLoadingCards(false);
    }
  }, [
    data.cards,
    data.situation,
    data.original_automatic_thought,
    loadingCards,
    onPatch,
  ]);

  function startPicking() {
    setPickerOpen(true);
    void ensureCards();
  }

  function chooseAlt(id: AltThoughtCardId) {
    onPatch({ picked_card_id: id, new_emotion_id: undefined });
    setPickerOpen(false);
    setTimeout(() => setGlow(true), 150);
    setTimeout(() => setGlow(false), 1700);
    setTimeout(() => {
      const el = document.getElementById("atb-diagram");
      if (el && typeof window !== "undefined") {
        window.scrollTo({
          top: el.getBoundingClientRect().top + window.scrollY - 80,
          behavior: "smooth",
        });
      }
    }, 80);
  }

  function chooseEmotion(id: EmotionId) {
    onPatch({ new_emotion_id: id, new_emotion_custom: undefined });
  }

  function customEmotion(text: string) {
    onPatch({ new_emotion_id: undefined, new_emotion_custom: text });
  }

  function resetPick() {
    onPatch({
      picked_card_id: undefined,
      new_emotion_id: undefined,
      new_emotion_custom: undefined,
    });
    setPickerOpen(true);
  }

  return (
    <section>
      <SectionHeader
        kicker="● PART B · YOUR TURN"
        rightLabel="FROM YOUR ENTRY"
        accent
      />

      <h2
        style={{
          margin: "20px 0 0",
          fontWeight: 700,
          fontSize: 32,
          lineHeight: 1.15,
          letterSpacing: "-0.025em",
          color: "var(--v2-ink)",
          textWrap: "balance",
          fontFamily: "var(--font-clinical-body)",
        }}
      >
        이번엔 본인 사례로, 같은 흐름을 따라가 봅니다.
      </h2>
      <p
        style={{
          margin: "14px 0 0",
          fontSize: 15,
          lineHeight: 1.7,
          color: "var(--v2-body)",
          maxWidth: 640,
          letterSpacing: "-0.005em",
          fontFamily: "var(--font-clinical-body)",
        }}
      >
        먼저 본인이 적었던 상황 · 자동사고 · 감정이 그대로 들어와 있어요. 가운데 자동사고만
        다른 버전으로 바꾸면, 마지막 감정이 어떻게 흘러가는지 따라가 봅니다.
      </p>

      <DiagramFrame
        id="atb-diagram"
        label={`FIG. 07-B · ${showAlt ? "YOUR SIMULATION" : "YOUR ORIGINAL ENTRY"}`}
      >
        <DiagramNode label="STEP 01 · 상황" kind="SITUATION">
          <div
            style={{
              fontSize: 16.5,
              fontWeight: 500,
              color: "var(--v2-ink)",
              lineHeight: 1.5,
              letterSpacing: "-0.005em",
              fontFamily: "var(--font-clinical-body)",
            }}
          >
            {data.situation ?? "—"}
          </div>
          <div style={{ marginTop: 8 }}>
            <Mono size={10} weight={500} color="var(--v2-mute)" tracked={0.16}>
              FIXED · 변하지 않음
            </Mono>
          </div>
        </DiagramNode>

        <Connector label="자동사고" animKey={thoughtAnimKey} />

        <DiagramNode
          label={thoughtLabel}
          kind="THOUGHT"
          accent
          glow={glow}
          animKey={thoughtAnimKey}
        >
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "var(--v2-ink)",
              lineHeight: 1.45,
              letterSpacing: "-0.015em",
              textWrap: "pretty",
              fontFamily: "var(--font-clinical-body)",
            }}
          >
            {thoughtText}
          </div>
          <div style={{ marginTop: 12 }}>
            <Mono size={10} weight={500} color={ACCENT} tracked={0.16}>
              {showAlt ? "↻ 이 칸이 바뀌었어요" : "↻ 이 한 칸을 바꿔볼 거예요"}
            </Mono>
          </div>
        </DiagramNode>

        <Connector
          label={showAlt ? "달라진 감정" : "결과 감정"}
          animKey={`${thoughtAnimKey}-${data.new_emotion_id ?? "orig"}`}
        />

        <DiagramNode
          label={`STEP 03 · 감정${showAlt ? " · NEW" : " · ORIGINAL"}`}
          kind="EMOTION"
          animKey={`${thoughtAnimKey}-${data.new_emotion_id ?? "orig"}`}
        >
          {showAlt ? (
            newEmoDef ? (
              <EmotionDisplay
                ko={newEmoDef.ko}
                en={newEmoDef.en}
                glyph={newEmoDef.glyph}
                glyphColor={ACCENT}
              />
            ) : newCustomLabel ? (
              <EmotionDisplay
                ko={newCustomLabel}
                en="CUSTOM"
                glyph="◎"
                glyphColor={ACCENT}
              />
            ) : (
              <div
                style={{
                  fontSize: 14,
                  color: "var(--v2-mute)",
                  lineHeight: 1.5,
                  fontFamily: "var(--font-clinical-body)",
                }}
              >
                아래에서 어울리는 감정을 골라보세요.
              </div>
            )
          ) : (
            <EmotionDisplay
              ko={data.original_emotion ?? "—"}
              detail={data.original_emotion_detail}
              glyph="◆"
              glyphColor="var(--v2-body)"
            />
          )}
        </DiagramNode>
      </DiagramFrame>

      {phase === "original" && !pickerOpen && (
        <div
          style={{
            marginTop: 28,
            animation: "atFadeIn .3s ease",
            textAlign: "center",
          }}
        >
          <Mono size={10} weight={500} color="var(--v2-mute)" tracked={0.16}>
            READY?
          </Mono>
          <div style={{ marginTop: 12 }}>
            <button
              type="button"
              onClick={startPicking}
              style={{
                fontWeight: 600,
                fontSize: 14,
                padding: "12px 22px",
                borderRadius: 999,
                background: "var(--v2-ink)",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                letterSpacing: "-0.005em",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                fontFamily: "var(--font-clinical-body)",
              }}
            >
              <span>자동사고 바꿔보기</span>
              <ArrowIcon />
            </button>
          </div>
        </div>
      )}

      {pickerOpen && phase !== "done" && (
        <div style={{ marginTop: 32, animation: "atFadeIn .3s ease" }}>
          <Mono size={10} weight={500} color="var(--v2-mute)" tracked={0.16}>
            STEP 01 · CHOOSE
          </Mono>
          <h3
            style={{
              margin: "10px 0 0",
              fontWeight: 700,
              fontSize: 22,
              color: "var(--v2-ink)",
              lineHeight: 1.35,
              letterSpacing: "-0.018em",
              fontFamily: "var(--font-clinical-body)",
            }}
          >
            자동사고를 바꿔봅시다.
          </h3>
          <p
            style={{
              margin: "10px 0 0",
              fontSize: 14,
              color: "var(--v2-body)",
              lineHeight: 1.7,
              fontFamily: "var(--font-clinical-body)",
            }}
          >
            <span
              style={{
                textDecoration: "line-through",
                textDecorationColor: "var(--v2-mute)",
                color: "var(--v2-body)",
              }}
            >
              {data.original_automatic_thought}
            </span>{" "}
            대신, 다음 중 어떤 자동사고를 골라보고 싶으세요?
          </p>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 12.5,
              color: "var(--v2-mute)",
              lineHeight: 1.6,
              fontFamily: "var(--font-clinical-body)",
            }}
          >
            고른 문장은 위 도식 가운데 칸에 들어가 자동사고를 바꿔놓아요.
          </p>

          {loadingCards && (
            <div
              style={{
                marginTop: 16,
                padding: 18,
                borderRadius: 12,
                background: "var(--v2-line3)",
                fontSize: 13,
                color: "var(--v2-body)",
                fontFamily: "var(--font-clinical-body)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 999,
                  border: "1.5px solid rgba(0,0,0,0.15)",
                  borderTopColor: "var(--v2-ink)",
                  display: "inline-block",
                  animation: "atSpin 0.7s linear infinite",
                }}
              />
              <span>당신 사례에 맞는 대안 자동사고를 떠올려보는 중…</span>
            </div>
          )}

          {cardsError && (
            <div
              style={{
                marginTop: 16,
                padding: 14,
                borderRadius: 12,
                border: `1px solid ${ACCENT}`,
                background: ACCENT_SOFT,
                fontSize: 13,
                color: "var(--v2-ink)",
                fontFamily: "var(--font-clinical-body)",
              }}
            >
              <p style={{ margin: 0 }}>{cardsError}</p>
              <button
                type="button"
                onClick={() => void ensureCards()}
                style={{
                  marginTop: 8,
                  background: "transparent",
                  border: `1px solid ${ACCENT}`,
                  color: ACCENT,
                  padding: "4px 12px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--font-clinical-body)",
                }}
              >
                다시 시도
              </button>
            </div>
          )}

          {!loadingCards && !cardsError && data.cards && data.cards.length >= 3 && (
            <div
              style={{
                marginTop: 18,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {data.cards.map((card, i) => (
                <AltThoughtCardButton
                  key={card.id}
                  card={card}
                  index={i}
                  total={data.cards!.length}
                  onPick={() => chooseAlt(card.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {(phase === "emotion" || phase === "done") && picked && (
        <div style={{ marginTop: 32, animation: "atFadeIn .3s ease" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Mono size={10} weight={500} color="var(--v2-mute)" tracked={0.16}>
              STEP 02 · NEW EMOTION
            </Mono>
            <button
              type="button"
              onClick={resetPick}
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--v2-body)",
                background: "transparent",
                border: "1px solid var(--v2-line)",
                borderRadius: 999,
                padding: "5px 12px",
                cursor: "pointer",
                fontFamily: "var(--font-clinical-body)",
              }}
            >
              ↺ 다른 자동사고로 바꾸기
            </button>
          </div>
          <h3
            style={{
              margin: "10px 0 0",
              fontWeight: 700,
              fontSize: 22,
              color: "var(--v2-ink)",
              lineHeight: 1.35,
              letterSpacing: "-0.018em",
              fontFamily: "var(--font-clinical-body)",
            }}
          >
            자동사고가 바뀌었어요. 그렇다면 감정은 어떻게 변할까요?
          </h3>

          <EmotionGrid
            options={NEW_EMOTIONS}
            pickedId={data.new_emotion_id}
            customValue={data.new_emotion_custom}
            onPick={(id) => chooseEmotion(id as EmotionId)}
            onCustomCommit={(text) => customEmotion(text)}
          />
        </div>
      )}

      {phase === "done" && picked && (newEmoDef || newCustomLabel) && (
        <DoneSection
          picked={picked}
          newEmotionLabel={newEmoDef?.ko ?? newCustomLabel ?? ""}
          original={{
            thought: data.original_automatic_thought ?? "",
            emotion: data.original_emotion ?? "",
          }}
          onAdvance={onAdvance}
          submitting={submitting}
          canAdvance={canAdvance}
        />
      )}
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   DONE — RECAP + NEXT-STAGE PREVIEW + CTA
   ════════════════════════════════════════════════════════════════════════ */

function DoneSection({
  picked,
  newEmotionLabel,
  original,
  onAdvance,
  submitting,
  canAdvance,
}: {
  picked: AltThoughtCard;
  newEmotionLabel: string;
  original: { thought: string; emotion: string };
  onAdvance: () => void;
  submitting: boolean;
  canAdvance: boolean;
}) {
  return (
    <div style={{ marginTop: 32, animation: "atFadeIn .4s ease" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Mono size={10} weight={600} color="var(--v2-mute)" tracked={0.18}>
          ● STAGE 07 · RECAP
        </Mono>
        <div style={{ flex: 1, height: 1, background: "var(--v2-line)" }} />
      </div>

      <div
        style={{
          background: "var(--v2-ink)",
          color: "#fff",
          borderRadius: 18,
          padding: "26px 28px",
        }}
      >
        <Mono
          size={10}
          weight={600}
          color="rgba(255,255,255,0.55)"
          tracked={0.14}
        >
          BEFORE → AFTER
        </Mono>
        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 14,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "80px 1fr",
              gap: 14,
              alignItems: "baseline",
              paddingBottom: 14,
              borderBottom: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <Mono size={9} weight={500} color="rgba(255,255,255,0.5)">
              자동사고
            </Mono>
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                fontFamily: "var(--font-clinical-body)",
              }}
            >
              <span style={{ opacity: 0.55, textDecoration: "line-through" }}>
                {original.thought}
              </span>
              <span
                style={{
                  margin: "0 8px",
                  color: ACCENT,
                  fontFamily: "var(--font-clinical-mono)",
                }}
              >
                →
              </span>
              <span style={{ color: "#fff", fontWeight: 600 }}>
                {picked.text}
              </span>
            </div>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "80px 1fr",
              gap: 14,
              alignItems: "center",
            }}
          >
            <Mono size={9} weight={500} color="rgba(255,255,255,0.5)">
              감정
            </Mono>
            <div
              style={{
                fontSize: 16,
                lineHeight: 1.4,
                fontFamily: "var(--font-clinical-body)",
              }}
            >
              <span style={{ opacity: 0.55, textDecoration: "line-through" }}>
                {original.emotion}
              </span>
              <span
                style={{
                  margin: "0 8px",
                  color: ACCENT,
                  fontFamily: "var(--font-clinical-mono)",
                }}
              >
                →
              </span>
              <b style={{ color: "#fff", fontSize: 18 }}>{newEmotionLabel}</b>
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 18,
            paddingTop: 16,
            borderTop: "1px solid rgba(255,255,255,0.12)",
            fontSize: 14,
            color: "rgba(255,255,255,0.85)",
            lineHeight: 1.7,
            fontFamily: "var(--font-clinical-body)",
          }}
        >
          자동사고 한 줄을 바꿨을 뿐인데, 마지막 감정의 결이 달라졌어요. 자주 연습할수록,
          같은 상황에서 가운데 칸이 다르게 흘러갈 가능성이 커집니다.
        </div>
      </div>

      <div
        style={{
          marginTop: 22,
          border: "1px solid var(--v2-line)",
          borderRadius: 18,
          padding: "22px 24px",
          background: "var(--v2-paper)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <Mono size={10} weight={700} color={ACCENT} tracked={0.16}>
            ● UP NEXT · STAGE 07
          </Mono>
          <div style={{ flex: 1, height: 1, background: "var(--v2-line2)" }} />
          <Mono size={9} weight={500} color="var(--v2-mute)" tracked={0.16}>
            RESHAPE · LOCKED
          </Mono>
        </div>
        <h4
          style={{
            margin: 0,
            fontWeight: 700,
            fontSize: 20,
            color: "var(--v2-ink)",
            letterSpacing: "-0.018em",
            lineHeight: 1.35,
            fontFamily: "var(--font-clinical-body)",
          }}
        >
          다음 단계에서는, 새 핵심 신념을 빚고 살아있는 증거로 떠받칩니다.
        </h4>
        <p
          style={{
            margin: "12px 0 0",
            fontSize: 13.5,
            color: "var(--v2-body)",
            lineHeight: 1.7,
            fontFamily: "var(--font-clinical-body)",
          }}
        >
          지금까지 시뮬레이션한 자동사고들을 모아, 옛 신념 옆에 균형 잡힌{" "}
          <b style={{ color: "var(--v2-ink)" }}>새 핵심 신념</b>을 둡니다. 그 다음, 그 신념을
          떠받칠{" "}
          <b style={{ color: "var(--v2-ink)" }}>살아있는 작은 증거들</b>을 함께 길어 올려요.
        </p>
        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
          }}
        >
          {[
            { code: "07·NEW BELIEF", label: "새 핵심 신념 찾기" },
            { code: "08·EVIDENCE", label: "새 신념 떠받치기" },
          ].map((p) => (
            <div
              key={p.code}
              style={{
                border: "1px solid var(--v2-line2)",
                borderRadius: 12,
                padding: "12px 14px",
                background: "var(--v2-line3)",
              }}
            >
              <Mono size={9} weight={500} color="var(--v2-mute)" tracked={0.16}>
                {p.code}
              </Mono>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: "var(--v2-ink)",
                  letterSpacing: "-0.005em",
                  fontFamily: "var(--font-clinical-body)",
                }}
              >
                {p.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          marginTop: 22,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <Mono size={10} weight={500} color="var(--v2-mute)" tracked={0.16}>
          SAVED · 시뮬레이션 결과
        </Mono>
        <button
          type="button"
          onClick={onAdvance}
          disabled={submitting || !canAdvance}
          style={{
            fontWeight: 600,
            fontSize: 14,
            padding: "12px 22px",
            borderRadius: 999,
            background: "var(--v2-ink)",
            color: "#fff",
            border: "none",
            cursor: submitting || !canAdvance ? "not-allowed" : "pointer",
            opacity: submitting || !canAdvance ? 0.6 : 1,
            letterSpacing: "-0.005em",
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            fontFamily: "var(--font-clinical-body)",
          }}
        >
          <span>
            {submitting ? "저장 중..." : "다음으로 넘어가기 · 새 핵심 신념"}
          </span>
          <ArrowIcon />
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   PRIMITIVES
   ════════════════════════════════════════════════════════════════════════ */

function SectionHeader({
  kicker,
  rightLabel,
  accent,
}: {
  kicker: string;
  rightLabel?: string;
  accent: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Mono
        size={10}
        weight={600}
        color={accent ? ACCENT : "var(--v2-mute)"}
        tracked={0.18}
      >
        {kicker}
      </Mono>
      <div style={{ flex: 1, height: 1, background: "var(--v2-line)" }} />
      {rightLabel && (
        <Mono size={10} weight={500} color="var(--v2-mute)" tracked={0.16}>
          {rightLabel}
        </Mono>
      )}
    </div>
  );
}

function DiagramFrame({
  id,
  label,
  children,
}: {
  id?: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      style={{
        marginTop: 32,
        padding: "26px 22px",
        borderRadius: 22,
        background: "var(--v2-line3)",
        border: "1px solid var(--v2-line2)",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 18 }}>
        <Mono size={10} weight={500} color="var(--v2-mute)" tracked={0.16}>
          {label}
        </Mono>
      </div>
      {children}
    </div>
  );
}

function DiagramNode({
  label,
  kind,
  accent,
  glow,
  animKey,
  children,
}: {
  label: string;
  kind: string;
  accent?: boolean;
  glow?: boolean;
  animKey?: string | number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: "100%",
        boxSizing: "border-box",
        border: `1px solid ${accent ? "var(--v2-ink)" : "var(--v2-line)"}`,
        background: "var(--v2-paper)",
        borderRadius: 16,
        padding: "20px 22px",
        position: "relative",
        boxShadow: glow
          ? "0 0 0 1px rgba(255,90,31,0.35), 0 0 30px rgba(255,90,31,0.30), 0 0 60px rgba(255,90,31,0.18)"
          : accent
            ? "0 1px 0 rgba(0,0,0,0.02), 0 8px 24px -12px rgba(255,90,31,0.18)"
            : "none",
        transition: "box-shadow .35s cubic-bezier(.2,.7,.2,1), border-color .2s",
      }}
    >
      {accent && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            top: 18,
            bottom: 18,
            width: 2,
            background: ACCENT,
            borderRadius: 2,
          }}
        />
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <Mono
          size={10}
          weight={600}
          color={accent ? ACCENT : "var(--v2-mute)"}
          tracked={0.16}
        >
          {accent ? "● " : ""}
          {label}
        </Mono>
        <Mono size={9} weight={500} color="var(--v2-mute)" tracked={0.16}>
          {kind}
        </Mono>
      </div>
      <div
        key={animKey}
        style={{
          animation:
            animKey != null ? "atSwap .42s cubic-bezier(.2,.7,.2,1)" : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Connector({
  label,
  animKey,
}: {
  label: string;
  animKey?: string | number;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "6px 0",
      }}
    >
      <div
        style={{
          width: 1,
          height: 20,
          background: "var(--v2-line)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          key={animKey}
          style={{
            position: "absolute",
            left: -1,
            width: 3,
            height: 8,
            background: ACCENT,
            borderRadius: 2,
            animation:
              animKey != null
                ? "atDrop .9s ease-in-out"
                : "atDropLoop 2.6s ease-in-out infinite",
          }}
        />
      </div>
      <Mono size={9} weight={500} color="var(--v2-mute)" tracked={0.16}>
        {label}
      </Mono>
      <div style={{ width: 1, height: 20, background: "var(--v2-line)" }} />
    </div>
  );
}

function EmotionDisplay({
  ko,
  en,
  detail,
  glyph,
  glyphColor,
}: {
  ko: string;
  en?: string;
  detail?: string;
  glyph: string;
  glyphColor: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <span
        style={{
          fontFamily: "var(--font-clinical-mono)",
          fontSize: 26,
          color: glyphColor,
          lineHeight: 1,
          width: 32,
          textAlign: "center",
        }}
      >
        {glyph}
      </span>
      <div>
        <div
          style={{
            fontSize: 21,
            fontWeight: 700,
            color: "var(--v2-ink)",
            letterSpacing: "-0.015em",
            lineHeight: 1.2,
            fontFamily: "var(--font-clinical-body)",
          }}
        >
          {ko}
        </div>
        {en && (
          <div style={{ marginTop: 4 }}>
            <Mono size={10} weight={500} color="var(--v2-mute)" tracked={0.16}>
              {en}
            </Mono>
          </div>
        )}
        {detail && (
          <div
            style={{
              marginTop: 4,
              fontSize: 13,
              color: "var(--v2-body)",
              lineHeight: 1.5,
              fontFamily: "var(--font-clinical-body)",
            }}
          >
            {detail}
          </div>
        )}
      </div>
    </div>
  );
}

function EmotionGrid<TId extends string>({
  options,
  pickedId,
  customValue,
  locked,
  onPick,
  onCustomCommit,
}: {
  options: ReadonlyArray<{ id: TId; ko: string; en: string; glyph: string }>;
  pickedId: TId | undefined;
  customValue?: string;
  locked?: boolean;
  onPick: (id: TId) => void;
  onCustomCommit: (text: string) => void;
}) {
  const customTrimmed = customValue?.trim() ?? "";
  const customPicked = !pickedId && customTrimmed.length > 0;

  return (
    <>
      <div
        style={{
          marginTop: 18,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
        }}
      >
        {options.map((e) => {
          const isPicked = pickedId === e.id;
          const isLocked = !!locked && !isPicked;
          return (
            <button
              key={e.id}
              type="button"
              disabled={isLocked}
              onClick={() => onPick(e.id)}
              style={{
                textAlign: "left",
                cursor: isLocked ? "not-allowed" : "pointer",
                border: `1px solid ${isPicked ? "var(--v2-ink)" : "var(--v2-line2)"}`,
                background: isPicked ? "var(--v2-paper)" : "var(--v2-line3)",
                borderRadius: 12,
                padding: "12px 14px",
                position: "relative",
                transition: "all .12s",
                opacity: isLocked ? 0.5 : 1,
                fontFamily: "var(--font-clinical-body)",
              }}
            >
              {isPicked && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 12,
                    bottom: 12,
                    width: 2,
                    background: ACCENT,
                    borderRadius: 2,
                  }}
                />
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-clinical-mono)",
                    fontSize: 16,
                    color: isPicked ? ACCENT : "var(--v2-mute)",
                  }}
                >
                  {e.glyph}
                </span>
                {isPicked && (
                  <Mono size={9} weight={700} color={ACCENT} tracked={0.16}>
                    ● PICK
                  </Mono>
                )}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--v2-ink)",
                  letterSpacing: "-0.005em",
                  lineHeight: 1.3,
                  fontFamily: "var(--font-clinical-body)",
                }}
              >
                {e.ko}
              </div>
              <div style={{ marginTop: 2 }}>
                <Mono size={9} weight={500} color="var(--v2-mute)" tracked={0.16}>
                  {e.en}
                </Mono>
              </div>
            </button>
          );
        })}
      </div>

      <CustomEmotionInput
        value={customValue ?? ""}
        picked={customPicked}
        locked={!!locked && !customPicked}
        onCommit={onCustomCommit}
      />
    </>
  );
}

function CustomEmotionInput({
  value,
  picked,
  locked,
  onCommit,
}: {
  value: string;
  picked: boolean;
  locked: boolean;
  onCommit: (text: string) => void;
}) {
  const [draft, setDraft] = useState(value);

  // 외부 value 동기화 (다른 픽으로 reset되면 내부 draft도 리셋)
  if (value !== "" && draft === "" && !picked) setDraft(value);

  function commit() {
    const next = draft.trim();
    if (!next) return;
    onCommit(next);
  }

  return (
    <div
      style={{
        marginTop: 10,
        padding: "12px 14px",
        borderRadius: 12,
        border: `1px solid ${picked ? "var(--v2-ink)" : "var(--v2-line2)"}`,
        background: picked ? "var(--v2-paper)" : "var(--v2-line3)",
        position: "relative",
        opacity: locked ? 0.55 : 1,
        transition: "all .12s",
      }}
    >
      {picked && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            top: 12,
            bottom: 12,
            width: 2,
            background: ACCENT,
            borderRadius: 2,
          }}
        />
      )}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <Mono
          size={10}
          weight={600}
          color={picked ? ACCENT : "var(--v2-mute)"}
          tracked={0.16}
        >
          {picked ? "● CUSTOM PICK" : "직접 입력"}
        </Mono>
        <Mono size={9} weight={500} color="var(--v2-mute)" tracked={0.16}>
          OWN WORDS
        </Mono>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="text"
          value={draft}
          disabled={locked}
          placeholder="떠오른 감정을 자유롭게 적어주세요"
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
              (e.target as HTMLInputElement).blur();
            }
          }}
          style={{
            flex: 1,
            border: "1px solid var(--v2-line)",
            borderRadius: 8,
            padding: "8px 12px",
            fontSize: 14,
            color: "var(--v2-ink)",
            background: "var(--v2-paper)",
            fontFamily: "var(--font-clinical-body)",
            outline: "none",
          }}
        />
        <button
          type="button"
          onClick={commit}
          disabled={locked || draft.trim().length === 0}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--v2-ink)",
            background: "transparent",
            border: "1px solid var(--v2-ink)",
            borderRadius: 999,
            padding: "6px 12px",
            cursor:
              locked || draft.trim().length === 0 ? "not-allowed" : "pointer",
            opacity: locked || draft.trim().length === 0 ? 0.4 : 1,
            fontFamily: "var(--font-clinical-body)",
            whiteSpace: "nowrap",
          }}
        >
          이 감정 →
        </button>
      </div>
    </div>
  );
}

function AltThoughtCardButton({
  card,
  index,
  total,
  onPick,
}: {
  card: AltThoughtCard;
  index: number;
  total: number;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      style={{
        cursor: "pointer",
        textAlign: "left",
        border: "1px solid var(--v2-line)",
        background: "var(--v2-paper)",
        borderRadius: 16,
        padding: "18px 20px",
        position: "relative",
        transition: "all .15s",
        fontFamily: "var(--font-clinical-body)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--v2-ink)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--v2-line)";
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Mono size={10} weight={700} color="var(--v2-ink)" tracked={0.16}>
            {card.code}
          </Mono>
          <span
            style={{
              fontSize: 12,
              color: "var(--v2-mute)",
              fontFamily: "var(--font-clinical-body)",
            }}
          >
            · {card.label}
          </span>
        </div>
        <Mono size={9} weight={500} color="var(--v2-mute)" tracked={0.16}>
          {String(index + 1).padStart(2, "0")} /{" "}
          {String(total).padStart(2, "0")}
        </Mono>
      </div>
      <div
        style={{
          fontSize: 17,
          fontWeight: 600,
          color: "var(--v2-ink)",
          lineHeight: 1.5,
          letterSpacing: "-0.01em",
          textWrap: "pretty",
          fontFamily: "var(--font-clinical-body)",
        }}
      >
        &ldquo;{card.text}&rdquo;
      </div>
      <div
        style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: "1px solid var(--v2-line2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 14,
        }}
      >
        <span
          style={{
            fontSize: 12.5,
            color: "var(--v2-body)",
            lineHeight: 1.5,
            fontFamily: "var(--font-clinical-body)",
          }}
        >
          ↳ {card.why}
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--v2-body)",
            border: "1px solid var(--v2-line)",
            borderRadius: 999,
            padding: "5px 11px",
            whiteSpace: "nowrap",
            fontFamily: "var(--font-clinical-body)",
          }}
        >
          이걸로 골라요 →
        </span>
      </div>
    </button>
  );
}

function ArrowIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M3 8 H13 M9 4 L13 8 L9 12"
        stroke="#fff"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DisclaimerFooter() {
  return (
    <div
      style={{
        marginTop: 32,
        paddingTop: 18,
        borderTop: "1px solid var(--v2-line2)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
      }}
    >
      <Mono size={9} weight={500} color="var(--v2-mute)" tracked={0.16}>
        DOC/FIG-07.SIMULATION · BELIEF VERIFIED
      </Mono>
      <Mono size={9} weight={500} color="var(--v2-mute)" tracked={0.16}>
        이 실습은 자기 이해를 돕는 도구이며 임상 치료를 대체하지 않습니다.
      </Mono>
    </div>
  );
}
