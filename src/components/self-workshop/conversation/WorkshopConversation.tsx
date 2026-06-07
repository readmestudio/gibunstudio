"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Body,
  D,
  EditorialInput,
  Headline,
  Mono,
  TS,
} from "@/components/self-workshop/clinical-report/v3-shared";
import {
  MAX_FOLLOWUP_TURN_INDEX,
  compactRecentContext,
  emptyTranscript,
  substituteAnswerTokens,
  turnsForPoint,
  type ConversationTranscript,
  type ConversationTurn,
  type ExplorePoint,
  type StepKey,
  type StepRecap,
} from "@/lib/self-workshop/conversation";
import {
  CoreWishBanner,
  PartProfileCard,
  SurfaceCard,
  TruthCard,
} from "@/components/self-workshop/conversation/WorkshopConversationVisuals";

interface Props {
  stepKey: StepKey;
  /** 단계별 앵커 질문(탐색 지점). 순서대로 진행. */
  explorePoints: ExplorePoint[];
  /** 이어하기용 기존 transcript. */
  initialTranscript?: ConversationTranscript;
  /** explore-followup에 보낼 ≤200자 이전 단계 요약 (선택). */
  priorSummary?: string;
  /** done 화면 상담사 코멘트에서 "○○님" 호칭에 쓸 사용자 이름 (선택). */
  userName?: string | null;
  /**
   * 질문 토큰 → 그 답을 가져올 explore_point_id 매핑.
   * 이후 질문의 토큰을 이전 답으로 런타임 치환한다. 미지정이면 치환 없음.
   * (Step 3 = { "{이름}": "name_part", "{대사}": "part_dialogue" })
   */
  questionTokens?: Record<string, string>;
  /**
   * 완료(done) 화면을 호스트가 직접 그리고 싶을 때 주입. 제공되면 기본 시각화
   * 카드/‘다음 단계로’ 버튼/step-recap fetch를 모두 건너뛰고 이 노드를 렌더한다.
   * (Step 4 = 자동사고·핵심신념 선택 화면) 미지정이면 기존 기본 done 화면.
   */
  renderDone?: (ctx: { transcript: ConversationTranscript }) => React.ReactNode;
  /** transcript 변경 시 호출 — 호스트가 디바운스 저장. */
  onTranscriptChange: (t: ConversationTranscript) => void;
  /** 사용자가 done 화면에서 "다음 단계로" 클릭 시 — 호스트가 구조화 추출 + dialogue_recap 저장 + 단계 이동. recap은 fetch 성공 시 함께 전달. */
  onComplete: (
    t: ConversationTranscript,
    recap: StepRecap | null
  ) => Promise<void> | void;
  /** 완료 처리(추출/저장) 진행 중 표시. */
  completing?: boolean;
}

/**
 * IFS 상담사형 적응형 대화 엔진 — 채팅 + 시각화 done 화면.
 *
 * 화면 상태를 transcript 하나에서 파생(deriveCursor)시켜, 새로고침에도
 * 정확히 같은 자리에서 이어진다. in-progress는 카카오톡 채팅처럼 위에서
 * 아래로 누적되고, done은 시각화 인포그래픽 3카드(표면·진심·CORE WISH).
 *
 * 어떤 LLM 실패든 "진행"으로 처리해 사용자를 막지 않는다.
 */
export function WorkshopConversation({
  stepKey,
  explorePoints,
  initialTranscript,
  priorSummary,
  userName,
  questionTokens,
  renderDone,
  onTranscriptChange,
  onComplete,
  completing = false,
}: Props) {
  const [transcript, setTranscript] = useState<ConversationTranscript>(
    () => initialTranscript ?? emptyTranscript(stepKey)
  );
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [recap, setRecap] = useState<StepRecap | null>(null);
  const [recapLoading, setRecapLoading] = useState(false);
  const recapFetchedRef = useRef(false);
  const composerRef = useRef<HTMLDivElement | null>(null);
  // deriveCursor가 바뀔 때 draft를 초기화하기 위한 ref.
  const lastCursorKeyRef = useRef<string>("");

  /** transcript에서 "지금 보여줄 질문"을 파생. null이면 모든 지점 완료. */
  const cursor = useMemo<Cursor | null>(() => {
    const c = deriveCursor(transcript, explorePoints);
    // 토큰({이름}·{대사}) 치환 — 표시(composer)와 저장(handleSubmit이 cursor.question
    // 으로 turn 생성)이 모두 치환된 문구를 쓰도록 단일 지점에서 처리.
    if (c && questionTokens) {
      return {
        ...c,
        question: substituteAnswerTokens(c.question, transcript, questionTokens),
      };
    }
    return c;
  }, [transcript, explorePoints, questionTokens]);

  // 채팅형에서는 활성 cursor의 답을 재편집하지 않음 → draft는 비워둠.
  const cursorKey = cursor
    ? `${cursor.pointId}:${cursor.turnIndex}`
    : "__done__";
  if (cursorKey !== lastCursorKeyRef.current) {
    lastCursorKeyRef.current = cursorKey;
    setDraft("");
  }

  const persist = useCallback(
    (next: ConversationTranscript) => {
      setTranscript(next);
      onTranscriptChange(next);
    },
    [onTranscriptChange]
  );

  // 새 메시지/후속질문이 추가될 때 composer 영역으로 부드러운 스크롤.
  const turnCount = transcript.turns.length;
  useEffect(() => {
    if (!composerRef.current) return;
    composerRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turnCount, cursorKey]);

  // 모든 주제 완료 진입 시 step-recap 한 번 fetch.
  const isDone = cursor === null;
  useEffect(() => {
    if (!isDone) return;
    // 호스트가 done 화면을 직접 그리면 기본 recap은 불필요.
    if (renderDone) return;
    if (recapFetchedRef.current) return;
    recapFetchedRef.current = true;
    setRecapLoading(true);
    void (async () => {
      try {
        const res = await fetch("/api/self-workshop/step-recap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step_key: stepKey, transcript, user_name: userName ?? "" }),
        });
        if (!res.ok) throw new Error("recap fetch failed");
        const j = (await res.json()) as { recap?: StepRecap };
        setRecap(j.recap ?? null);
      } catch {
        setRecap(null);
      } finally {
        setRecapLoading(false);
      }
    })();
  }, [isDone, stepKey, transcript, userName, renderDone]);

  const handleSubmit = useCallback(async () => {
    if (!cursor || loading || completing) return;
    const point = explorePoints[cursor.pointIndex];
    const answer = draft.trim();

    // optional 지점인데 빈 답 → 후속질문 없이 충분 처리하고 진행.
    const isOptionalSkip = point.optional && answer.length === 0;
    // 지점별 후속질문 상한 (미지정 시 기본 2). 0이면 후속 없이 바로 다음.
    const maxFollowups = point.maxFollowups ?? MAX_FOLLOWUP_TURN_INDEX;
    const capped = cursor.turnIndex >= maxFollowups;

    setLoading(true);
    try {
      let sufficient = true;
      let followup = "";

      if (!isOptionalSkip && !capped && answer.length > 0) {
        const res = await fetch("/api/self-workshop/explore-followup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step_key: stepKey,
            explore_point_id: point.id,
            question: cursor.question,
            answer,
            turn_index: cursor.turnIndex,
            recent_context: compactRecentContext(transcript, point.id, 2),
            prior_summary: priorSummary ?? "",
          }),
        });
        if (res.ok) {
          const json = (await res.json()) as {
            sufficient?: boolean;
            followup?: string;
          };
          sufficient = json.sufficient !== false;
          followup =
            typeof json.followup === "string" ? json.followup.trim() : "";
        }
        // res.ok가 아니면 sufficient=true 유지 → 진행 (차단 금지).
      }

      // 1) 현재 활성 turn을 답으로 기록(upsert).
      let nextTurns = upsertTurn(transcript.turns, {
        explore_point_id: point.id,
        turn_index: cursor.turnIndex,
        question: cursor.question,
        answer,
        was_followup: cursor.turnIndex > 0,
        sufficient: sufficient || capped || isOptionalSkip ? true : false,
        asked_at: new Date().toISOString(),
      });

      // 2) 부족하고 후속질문이 있으면, 빈 답의 후속 turn을 미리 추가.
      const willFollowUp =
        !sufficient && !capped && !isOptionalSkip && followup.length > 0;
      if (willFollowUp) {
        nextTurns = [
          ...nextTurns,
          {
            explore_point_id: point.id,
            turn_index: cursor.turnIndex + 1,
            question: followup,
            answer: "",
            was_followup: true,
            asked_at: new Date().toISOString(),
          },
        ];
      }

      const advanced = !willFollowUp;

      // 3) 다음 주제로 진행하고 그 주제에 topic이 있으면, 직전 답을 바탕으로
      //    시작 질문을 LLM이 동적으로 만들어 빈 답 turn으로 미리 넣어둔다.
      if (advanced) {
        const tentative: ConversationTranscript = {
          ...transcript,
          turns: nextTurns,
        };
        const nc = deriveCursor(tentative, explorePoints);
        if (nc !== null) {
          const nextPoint = explorePoints[nc.pointIndex];
          const alreadyHasTurn = nextTurns.some(
            (t) => t.explore_point_id === nextPoint.id
          );
          if (nextPoint.topic && !alreadyHasTurn) {
            const dynamicQ = await fetchDynamicOpening(
              nextPoint,
              nextTurns,
              stepKey,
              priorSummary
            );
            if (dynamicQ) {
              nextTurns = [
                ...nextTurns,
                {
                  explore_point_id: nextPoint.id,
                  turn_index: 0,
                  question: dynamicQ,
                  answer: "",
                  was_followup: false,
                  asked_at: new Date().toISOString(),
                },
              ];
            }
          }
        }
      }

      const next: ConversationTranscript = {
        ...transcript,
        turns: nextTurns,
        completed: false,
        updated_at: new Date().toISOString(),
      };

      // 4) 완료 체크 — 자동 onComplete 호출하지 않는다.
      const nextCursor = advanced
        ? deriveCursor(next, explorePoints)
        : cursor;
      if (advanced && nextCursor === null) {
        next.completed = true;
      }

      persist(next);
    } finally {
      setLoading(false);
    }
  }, [
    cursor,
    loading,
    completing,
    explorePoints,
    draft,
    stepKey,
    transcript,
    priorSummary,
    persist,
  ]);

  /* ─────────────────────────── 완료 상태 ─────────────────────────── */
  // 호스트가 done 화면을 직접 그리면(예: Step 4 선택 화면) 그것을 렌더.
  if (!cursor && renderDone) {
    return <>{renderDone({ transcript })}</>;
  }

  /* 기본 완료 화면 (시각화 카드) */
  if (!cursor) {
    return (
      <section className="space-y-6">
        <header className="space-y-2">
          <Mono size={10} weight={600} color={D.accent} tracking={0.16}>
            ● 대화 완료 · 함께 발견한 것
          </Mono>
          <Headline size="h3">여기서 함께 발견한 것들</Headline>
        </header>

        {recapLoading ? (
          <DoneLoading />
        ) : (
          <>
            {recap?.part_profile && <PartProfileCard data={recap.part_profile} />}
            <SurfaceCard data={recap?.surface_card} />
            <TruthCard data={recap?.truth_card} />
            <CoreWishBanner data={recap?.core_wish} />

            {recap?.next_step_bridge && (
              <p
                style={{
                  marginTop: 8,
                  fontFamily: D.font,
                  fontSize: 14.5,
                  color: D.text2,
                  fontStyle: "italic",
                  textAlign: "center",
                  lineHeight: 1.6,
                }}
              >
                {recap.next_step_bridge}
              </p>
            )}
          </>
        )}

        <div className="pt-2">
          <button
            onClick={() => void onComplete(transcript, recap)}
            disabled={completing}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--foreground)] bg-[var(--foreground)] px-8 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {completing ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                정리하는 중…
              </>
            ) : (
              "다음 단계로 →"
            )}
          </button>
        </div>
      </section>
    );
  }

  /* ─────────────────────────── 진행 중 (채팅형) ─────────────────────────── */
  const point = explorePoints[cursor.pointIndex];
  const isFollowUp = cursor.turnIndex > 0;
  // 채팅 히스토리에 보일 turn = 답이 있는 turn만 (활성 미답 turn은 composer가 처리).
  const historyTurns = transcript.turns.filter((t) => t.answer.trim().length > 0);

  return (
    <section className="space-y-4">
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <Mono size={10} weight={600} color={D.text3} tracking={0.16}>
            ● {String(cursor.pointIndex + 1).padStart(2, "0")} / {String(
              explorePoints.length
            ).padStart(2, "0")} · 함께 알아가는 중
          </Mono>
          <Mono size={10} weight={500} color={D.text3} tracking={0.16}>
            총 {explorePoints.length}개 주제
          </Mono>
        </div>
        <ProgressDots total={explorePoints.length} current={cursor.pointIndex} />
      </header>

      <ChatTranscript turns={historyTurns} />

      <div ref={composerRef}>
        <ChatComposer
          question={cursor.question}
          isFollowUp={isFollowUp}
          draft={draft}
          onDraftChange={setDraft}
          onSubmit={() => void handleSubmit()}
          loading={loading}
          completing={completing}
          optional={!!point.optional}
        />
      </div>

      <p
        className="text-center"
        style={{ color: D.text3, fontSize: TS.micro, fontFamily: D.font }}
      >
        대화 내용은 자동으로 저장됩니다
      </p>
    </section>
  );
}

/* ─────────────────────────── 채팅 컴포넌트 ─────────────────────────── */

function ChatTranscript({ turns }: { turns: ConversationTurn[] }) {
  if (turns.length === 0) return null;
  // 연속된 같은 화자 메시지는 라벨을 처음에만 표시하기 위해 직전 화자 추적.
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        paddingTop: 4,
      }}
    >
      {turns.map((t, i) => (
        <div key={`${t.explore_point_id}-${t.turn_index}`}>
          <CounselorBubble
            text={t.question}
            showLabel={i === 0 || turns[i - 1].explore_point_id !== t.explore_point_id}
            isFollowUp={t.was_followup}
          />
          <div style={{ height: 8 }} />
          <UserBubble text={t.answer} />
        </div>
      ))}
    </div>
  );
}

function ChatComposer({
  question,
  isFollowUp,
  draft,
  onDraftChange,
  onSubmit,
  loading,
  completing,
  optional,
}: {
  question: string;
  isFollowUp: boolean;
  draft: string;
  onDraftChange: (s: string) => void;
  onSubmit: () => void;
  loading: boolean;
  completing: boolean;
  optional: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <CounselorBubble text={question} showLabel isFollowUp={isFollowUp} />

      <div style={{ marginTop: 6 }}>
        <EditorialInput
          multiline
          rows={4}
          value={draft}
          onChange={onDraftChange}
          maxLength={600}
          placeholder="떠오르는 대로 편하게 적어주세요"
          ariaLabel="답변 입력"
        />
      </div>

      <div className="flex items-center justify-between">
        {optional ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading || completing}
            className="text-sm text-[var(--foreground)]/50 hover:text-[var(--foreground)] hover:underline disabled:opacity-40"
          >
            건너뛰기
          </button>
        ) : (
          <span />
        )}

        <button
          onClick={onSubmit}
          disabled={
            loading || completing || (!optional && draft.trim().length === 0)
          }
          className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--foreground)] bg-[var(--foreground)] px-6 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {loading ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              듣는 중…
            </>
          ) : (
            "보내기 →"
          )}
        </button>
      </div>
    </div>
  );
}

function CounselorBubble({
  text,
  showLabel,
  isFollowUp,
}: {
  text: string;
  showLabel: boolean;
  isFollowUp: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      {showLabel && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 6,
            marginLeft: 8,
          }}
        >
          <Mono size={9.5} weight={600} color={D.text3} tracking={0.16}>
            ● 함께 알아가는 중
          </Mono>
          {isFollowUp && (
            <Mono size={9.5} weight={600} color={D.accent} tracking={0.16}>
              · 한 걸음 더
            </Mono>
          )}
        </div>
      )}
      <div
        style={{
          maxWidth: "82%",
          background: D.hair3,
          color: D.ink,
          fontFamily: D.font,
          fontSize: 15,
          lineHeight: 1.55,
          padding: "12px 16px",
          borderRadius: 18,
          borderTopLeftRadius: 6,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end" }}>
      <div
        style={{
          maxWidth: "82%",
          background: D.ink,
          color: "#fff",
          fontFamily: D.font,
          fontSize: 15,
          lineHeight: 1.55,
          padding: "12px 16px",
          borderRadius: 18,
          borderTopRightRadius: 6,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => {
        const state =
          i < current ? "done" : i === current ? "active" : "pending";
        return (
          <span
            key={i}
            style={{
              width: state === "active" ? 18 : 6,
              height: 6,
              borderRadius: 3,
              background:
                state === "done"
                  ? D.ink
                  : state === "active"
                    ? D.accent
                    : D.hair,
              transition: "width 0.3s ease",
            }}
          />
        );
      })}
    </div>
  );
}

function DoneLoading() {
  return (
    <div
      style={{
        border: `1px solid ${D.hair}`,
        borderRadius: 14,
        background: D.paper,
        padding: 28,
        textAlign: "center",
      }}
    >
      <Body
        muted
        style={{
          fontStyle: "italic",
          fontFamily: D.font,
        }}
      >
        흩어진 마음들을 한 자리에 모으는 중…
      </Body>
    </div>
  );
}

/* ─────────────────────────── 내부 헬퍼 ─────────────────────────── */

interface Cursor {
  pointIndex: number;
  pointId: string;
  turnIndex: number;
  question: string;
  existingAnswer: string;
}

/**
 * transcript + 탐색 지점 목록에서 "지금 보여줄 질문"을 파생한다.
 * 규칙: 각 지점을 순서대로 보며 — 마지막 턴이 충분(sufficient) 또는
 * 캡(turn_index>=MAX)이면 완료로 보고 다음 지점으로. 그 외엔 그 지점이 활성.
 * 모든 지점이 완료면 null.
 */
function deriveCursor(
  t: ConversationTranscript,
  explorePoints: ExplorePoint[]
): Cursor | null {
  for (let i = 0; i < explorePoints.length; i++) {
    const point = explorePoints[i];
    const turns = turnsForPoint(t, point.id);

    if (turns.length === 0) {
      return {
        pointIndex: i,
        pointId: point.id,
        turnIndex: 0,
        question: point.opening,
        existingAnswer: "",
      };
    }

    const last = turns[turns.length - 1];
    const done =
      last.sufficient === true || last.turn_index >= MAX_FOLLOWUP_TURN_INDEX;
    if (done) continue;

    return {
      pointIndex: i,
      pointId: point.id,
      turnIndex: last.turn_index,
      question: last.question,
      existingAnswer: last.answer,
    };
  }
  return null;
}

/** 같은 (explore_point_id, turn_index) turn이 있으면 교체, 없으면 추가. */
function upsertTurn(
  turns: ConversationTurn[],
  turn: ConversationTurn
): ConversationTurn[] {
  const idx = turns.findIndex(
    (x) =>
      x.explore_point_id === turn.explore_point_id &&
      x.turn_index === turn.turn_index
  );
  if (idx === -1) return [...turns, turn];
  const next = [...turns];
  next[idx] = turn;
  return next;
}

/**
 * 다음 주제(point)의 시작 질문을 LLM이 직전 답에 흐르도록 생성한다.
 * 실패 시 빈 문자열을 반환해 호출자가 폴백 opening을 사용하게 한다.
 */
async function fetchDynamicOpening(
  nextPoint: ExplorePoint,
  currentTurns: ConversationTurn[],
  stepKey: StepKey,
  priorSummary?: string
): Promise<string> {
  try {
    const recent = currentTurns
      .filter((t) => t.answer.trim().length > 0)
      .slice(-4)
      .map((t) => `Q: ${t.question}\nA: ${t.answer}`)
      .join("\n");
    const res = await fetch("/api/self-workshop/explore-opening", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        step_key: stepKey,
        next_point_id: nextPoint.id,
        next_point_topic: nextPoint.topic,
        recent_context: recent,
        prior_summary: priorSummary ?? "",
      }),
    });
    if (!res.ok) return "";
    const j = (await res.json()) as { question?: string };
    return typeof j.question === "string" ? j.question.trim() : "";
  } catch {
    return "";
  }
}
