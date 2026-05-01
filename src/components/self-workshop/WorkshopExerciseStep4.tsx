"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EMOTION_CHIPS } from "@/lib/self-workshop/diagnosis";
import {
  Body,
  COL,
  D,
  EditorialInput,
  Headline,
  Mono,
  SectionHeader,
  TS,
} from "@/components/self-workshop/clinical-report/v3-shared";

interface MechanismAnalysis {
  recent_situation: string;
  primary_emotion: string;
  emotion_intensity: number;
  candidate_thoughts: string[];
  automatic_thought: string;
  common_thoughts_checked: string[];
  trigger_context: string;
  emotions_body: {
    emotions: string[];
    body_text: string;
  };
  worst_case_result: string;
  thought_image: string;
  social_perception: string;
  resulting_behavior: string;
  core_beliefs: {
    about_self: string;
    // about_others / about_world: 옵셔널 — 이전 사용자 데이터 보존용 (신규 UI에서 노출 X)
    about_others?: string;
    about_world?: string;
  };
}

const MAX_CANDIDATE_THOUGHTS = 5;

interface Props {
  workshopId: string;
  savedData?: Partial<MechanismAnalysis>;
}

const COMMON_ACHIEVEMENT_THOUGHTS = [
  "내가 지금 뒤처지고 있어",
  "이 정도로는 부족해",
  "쉬는 건 게으른 거야",
  "남들은 다 잘하고 있는데 나만…",
  "이 성과로는 인정받을 수 없을 거야",
  "완벽하지 않으면 의미가 없어",
  "다음엔 더 잘해야 해",
  "실수하면 나는 끝이야",
  "왜 나는 남들처럼 쉽게 못할까",
  "지금 쉬면 다 망할 거야",
  "나는 아직 증명해야 해",
  "여기서 멈추면 그동안 한 게 다 물거품이야",
] as const;

const EMPTY: MechanismAnalysis = {
  recent_situation: "",
  primary_emotion: "",
  emotion_intensity: 0,
  candidate_thoughts: [],
  automatic_thought: "",
  common_thoughts_checked: [],
  trigger_context: "",
  emotions_body: { emotions: [], body_text: "" },
  worst_case_result: "",
  thought_image: "",
  social_perception: "",
  resulting_behavior: "",
  core_beliefs: { about_self: "" },
};

function mergeSaved(
  saved: Partial<MechanismAnalysis> | undefined
): MechanismAnalysis {
  if (!saved) return EMPTY;

  const legacyThought = saved.automatic_thought?.trim() ?? "";
  const candidatesFromSave = saved.candidate_thoughts ?? [];
  const seededCandidates =
    candidatesFromSave.length > 0
      ? candidatesFromSave
      : legacyThought.length > 0
        ? [legacyThought]
        : [];

  const savedEmotions = saved.emotions_body?.emotions ?? [];
  const primaryEmotion = saved.primary_emotion ?? savedEmotions[0] ?? "";

  return {
    recent_situation: saved.recent_situation ?? "",
    primary_emotion: primaryEmotion,
    emotion_intensity:
      typeof saved.emotion_intensity === "number" ? saved.emotion_intensity : 0,
    candidate_thoughts: seededCandidates,
    automatic_thought: saved.automatic_thought ?? "",
    common_thoughts_checked: saved.common_thoughts_checked ?? [],
    trigger_context: saved.trigger_context ?? "",
    emotions_body: {
      emotions: savedEmotions,
      body_text: saved.emotions_body?.body_text ?? "",
    },
    worst_case_result: saved.worst_case_result ?? "",
    thought_image: saved.thought_image ?? "",
    social_perception: saved.social_perception ?? "",
    resulting_behavior: saved.resulting_behavior ?? "",
    core_beliefs: {
      about_self: saved.core_beliefs?.about_self ?? "",
      // 이전 작성값은 그대로 보존(미노출) — DB 손실 방지
      about_others: saved.core_beliefs?.about_others,
      about_world: saved.core_beliefs?.about_world,
    },
  };
}

function mergeEmotions(primary: string, extras: string[]): string[] {
  const out: string[] = [];
  if (primary) out.push(primary);
  for (const emo of extras) {
    if (emo && !out.includes(emo)) out.push(emo);
  }
  return out;
}

export function WorkshopExerciseStep4({ workshopId, savedData }: Props) {
  const router = useRouter();
  const [data, setData] = useState<MechanismAnalysis>(() => mergeSaved(savedData));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  const autoSave = useCallback(
    (updated: MechanismAnalysis) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        await fetch("/api/self-workshop/save-progress", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workshopId,
            field: "mechanism_analysis",
            data: updated,
          }),
        });
      }, 1000);
    },
    [workshopId]
  );

  function update<K extends keyof MechanismAnalysis>(
    key: K,
    value: MechanismAnalysis[K]
  ) {
    const next = { ...data, [key]: value };
    setData(next);
    autoSave(next);
  }

  function toggleChecklist(thought: string) {
    const current = data.common_thoughts_checked;
    const next = current.includes(thought)
      ? current.filter((t) => t !== thought)
      : [...current, thought];
    update("common_thoughts_checked", next);
  }

  function setPrimaryEmotion(emotion: string) {
    // 같은 칩을 다시 누르면 해제
    const nextPrimary = data.primary_emotion === emotion ? "" : emotion;
    const extras = data.emotions_body.emotions.filter(
      (e) => e !== data.primary_emotion && e !== emotion
    );
    const next: MechanismAnalysis = {
      ...data,
      primary_emotion: nextPrimary,
      emotions_body: {
        ...data.emotions_body,
        emotions: mergeEmotions(nextPrimary, extras),
      },
    };
    setData(next);
    autoSave(next);
  }

  function updateCandidateThought(index: number, value: string) {
    const next = data.candidate_thoughts.map((t, i) =>
      i === index ? value : t
    );
    // 현재 핵심으로 선정된 문장이 편집되고 있다면 automatic_thought도 동기화
    const oldThought = data.candidate_thoughts[index] ?? "";
    const patch: Partial<MechanismAnalysis> = { candidate_thoughts: next };
    if (data.automatic_thought === oldThought) {
      patch.automatic_thought = value;
    }
    const merged = { ...data, ...patch };
    setData(merged);
    autoSave(merged);
  }

  function addCandidateThought() {
    if (data.candidate_thoughts.length >= MAX_CANDIDATE_THOUGHTS) return;
    const next = [...data.candidate_thoughts, ""];
    const merged = { ...data, candidate_thoughts: next };
    setData(merged);
    autoSave(merged);
  }

  function removeCandidateThought(index: number) {
    const removed = data.candidate_thoughts[index] ?? "";
    const next = data.candidate_thoughts.filter((_, i) => i !== index);
    const patch: Partial<MechanismAnalysis> = { candidate_thoughts: next };
    if (data.automatic_thought === removed) {
      patch.automatic_thought = next.length === 1 ? (next[0]?.trim() ?? "") : "";
    }
    const merged = { ...data, ...patch };
    setData(merged);
    autoSave(merged);
  }

  function toggleSecondaryEmotion(emotion: string) {
    // primary로 고른 감정은 여기서 토글 불가(잠금)
    if (emotion === data.primary_emotion) return;
    const current = data.emotions_body.emotions.filter(
      (e) => e !== data.primary_emotion
    );
    const nextExtras = current.includes(emotion)
      ? current.filter((e) => e !== emotion)
      : [...current, emotion];
    update("emotions_body", {
      ...data.emotions_body,
      emotions: mergeEmotions(data.primary_emotion, nextExtras),
    });
  }

  function updateBodyText(text: string) {
    update("emotions_body", { ...data.emotions_body, body_text: text });
  }

  function updateCoreBelief(
    key: keyof MechanismAnalysis["core_beliefs"],
    value: string
  ) {
    update("core_beliefs", { ...data.core_beliefs, [key]: value });
  }

  const nonEmptyCandidates = data.candidate_thoughts.filter(
    (t) => t.trim().length > 0
  );
  // 가장 먼저 떠오른 생각(첫 후보)을 자동으로 핵심 자동사고로 사용
  const effectiveCoreThought = nonEmptyCandidates[0]?.trim() ?? "";

  const isComplete =
    data.recent_situation.trim().length > 0 &&
    data.primary_emotion.length > 0 &&
    nonEmptyCandidates.length >= 1 &&
    effectiveCoreThought.length > 0 &&
    data.core_beliefs.about_self.trim().length > 0 &&
    data.worst_case_result.trim().length > 0 &&
    data.resulting_behavior.trim().length > 0;

  const missingItems: string[] = [];
  if (data.recent_situation.trim().length === 0) missingItems.push("① 상황");
  if (data.primary_emotion.length === 0) missingItems.push("② 감정");
  if (
    nonEmptyCandidates.length === 0 ||
    effectiveCoreThought.length === 0 ||
    data.core_beliefs.about_self.trim().length === 0 ||
    data.worst_case_result.trim().length === 0
  )
    missingItems.push("③ 생각");
  if (data.resulting_behavior.trim().length === 0)
    missingItems.push("⑤ 행동");

  async function handleNext() {
    if (!isComplete) return;
    setSubmitting(true);
    setError("");

    // 제출 직전 정규화: candidate_thoughts의 빈 문자열 제거, automatic_thought 보정
    const cleanedCandidates = data.candidate_thoughts
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    const normalized: MechanismAnalysis = {
      ...data,
      candidate_thoughts: cleanedCandidates,
      automatic_thought: effectiveCoreThought,
    };

    try {
      const res = await fetch("/api/self-workshop/save-progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshopId,
          field: "mechanism_analysis",
          data: normalized,
          advanceStep: 4,
        }),
      });

      if (!res.ok) throw new Error("저장에 실패했습니다.");

      router.push("/dashboard/self-workshop/step/4");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <div
      className="pb-20"
      style={{ maxWidth: COL + 96, margin: "0 auto", padding: "0 48px" }}
    >
      {/* 이전 페이지로 돌아가기 */}
      <Link
        href="/dashboard/self-workshop/step/3"
        className="inline-flex items-center text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:underline"
      >
        ← 이전 페이지 보기
      </Link>

      {/* 인트로 — 박스 없이 메타 헤더 + 본문 */}
      <section className="mt-10 mb-12 space-y-5">
        <SectionHeader kicker="● PART A · STEP 3" rightLabel="5-PART MODEL" />
        <Headline>이제, 당신의 성취 중독 패턴을 함께 찾아볼 차례예요</Headline>
        <Body muted style={{ marginTop: 12 }}>
          최근 마음이 불편했던 한 순간을 떠올리고, 그 순간을{" "}
          <strong style={{ color: D.ink }}>
            상황 · 감정 · 생각 · 신체 · 행동
          </strong>{" "}
          다섯 축으로 풀어볼게요. 정답은 없으니, 떠오르는 대로 솔직하게 적어주세요. 한
          번에 모두 적지 않아도 괜찮아요 — 적은 만큼 자동 저장됩니다.
        </Body>
      </section>

      {/* 5-Part Model — SectionHeader 가 자체 hairline 을 그리므로 divide-y 불필요 */}
      <div className="space-y-12">
        {/* ── ① 상황 ───────────────────────────────────── */}
        <AxisCard
          index={1}
          title="상황"
          engCode="SITUATION"
          subtitle="무슨 일이 있었나요"
        >
          <SubField
            label="최근 '성취 때문에' 마음이 불편했던 순간"
            guide="지난 일주일 안에, 일·성과·경쟁 때문에 마음이 무거워진 장면을 하나 떠올려 주세요."
          >
            <EditorialInput
              multiline
              rows={4}
              value={data.recent_situation}
              onChange={(next) => update("recent_situation", next)}
              placeholder="예: 금요일 회의에서 팀장이 내 제안을 가볍게 넘기고 다음 주제로 넘어갔을 때"
              ariaLabel="최근 성취 때문에 마음이 불편했던 순간"
            />
          </SubField>
        </AxisCard>

        {/* ── ② 감정 ───────────────────────────────────── */}
        <AxisCard
          index={2}
          title="감정"
          engCode="EMOTIONS"
          subtitle="마음의 첫 반응"
        >
          <div className="space-y-6">
            <SubField
              label="그 순간 가장 강하게 올라온 감정 하나"
              guide="가장 크게 훅 올라온 감정 하나를 골라 주세요."
            >
              <div className="flex flex-wrap gap-2">
                {EMOTION_CHIPS.map((emotion) => {
                  const selected = data.primary_emotion === emotion;
                  return (
                    <button
                      key={emotion}
                      type="button"
                      onClick={() => setPrimaryEmotion(emotion)}
                      className={`rounded-full border-2 px-3 py-1 text-sm font-medium transition-colors ${
                        selected
                          ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                          : "border-[var(--foreground)]/20 text-[var(--foreground)]/60 hover:border-[var(--foreground)]"
                      }`}
                    >
                      {emotion}
                    </button>
                  );
                })}
              </div>
            </SubField>

            <SubField
              label="함께 떠오른 다른 감정"
              guide="위에서 고른 감정 외에 동반된 감정이 있으면 골라주세요."
              optional
            >
              <div className="flex flex-wrap gap-2">
                {EMOTION_CHIPS.map((emotion) => {
                  const isPrimary = data.primary_emotion === emotion;
                  const selected =
                    isPrimary ||
                    data.emotions_body.emotions.includes(emotion);
                  return (
                    <button
                      key={emotion}
                      type="button"
                      onClick={() => toggleSecondaryEmotion(emotion)}
                      disabled={isPrimary}
                      title={isPrimary ? "위에서 고른 감정이에요" : undefined}
                      className={`rounded-full border-2 px-3 py-1 text-sm font-medium transition-colors ${
                        isPrimary
                          ? "cursor-not-allowed border-[var(--foreground)]/60 bg-[var(--foreground)]/10 text-[var(--foreground)]/70"
                          : selected
                            ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                            : "border-[var(--foreground)]/20 text-[var(--foreground)]/60 hover:border-[var(--foreground)]"
                      }`}
                    >
                      {emotion}
                      {isPrimary && <span className="ml-1 text-xs">· 핵심</span>}
                    </button>
                  );
                })}
              </div>
            </SubField>
          </div>
        </AxisCard>

        {/* ── ③ 생각 ───────────────────────────────────── */}
        <AxisCard
          index={3}
          title="생각"
          engCode="THOUGHTS"
          subtitle="머릿속에 스친 말"
        >
          <div className="space-y-6">
            {/* a) 그때 떠오른 생각들 */}
            <SubField label="그 순간 머릿속에 어떤 생각이 가장 먼저 스쳐 지나갔나요?">
              <div className="mb-4">
                <Body muted>
                  머릿속을 스친 생각들은{" "}
                  <strong style={{ color: D.ink }}>화재경보기</strong>{" "}
                  같아요. 실제 화재를 판단한 게 아니라 ‘일단 위험’이라고 빠르게 울린
                  신호죠. 합리적이지 않아도 괜찮아요 — 그냥 떠오른 대로 모두 적어봅니다.
                </Body>
              </div>

              <div className="space-y-3">
                {(data.candidate_thoughts.length === 0
                  ? [""]
                  : data.candidate_thoughts
                ).map((thought, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="mt-3 shrink-0">
                      <Mono
                        size={10}
                        weight={500}
                        color={D.text3}
                        tracking={0.16}
                      >
                        {String(idx + 1).padStart(2, "0")}
                      </Mono>
                    </span>
                    <div className="flex-1">
                      <EditorialInput
                        multiline
                        rows={2}
                        value={thought}
                        onChange={(next) => {
                          if (data.candidate_thoughts.length === 0) {
                            // 초기 렌더 때 빈 줄 1개를 시드
                            const merged = {
                              ...data,
                              candidate_thoughts: [next],
                            };
                            setData(merged);
                            autoSave(merged);
                          } else {
                            updateCandidateThought(idx, next);
                          }
                        }}
                        placeholder={
                          idx === 0
                            ? "예: ‘내 아이디어가 별로인가 봐.’"
                            : "예: ‘나 진짜 별 볼일 없네.’"
                        }
                        ariaLabel={`생각 후보 ${idx + 1}`}
                      />
                    </div>
                    {data.candidate_thoughts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCandidateThought(idx)}
                        className="mt-2 shrink-0 px-2 py-1 hover:opacity-70"
                        aria-label={`${idx + 1}번 생각 삭제`}
                      >
                        <Mono size={9} weight={500} color={D.text3} tracking={0.18}>
                          REMOVE
                        </Mono>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {data.candidate_thoughts.length < MAX_CANDIDATE_THOUGHTS && (
                <button
                  type="button"
                  onClick={addCandidateThought}
                  className="mt-4 inline-flex items-center gap-1.5 hover:opacity-70"
                >
                  <Mono size={10} weight={600} color={D.accent} tracking={0.18}>
                    + ADD THOUGHT
                  </Mono>
                </button>
              )}
              {data.candidate_thoughts.length >= MAX_CANDIDATE_THOUGHTS && (
                <p className="mt-2">
                  <Mono size={9} weight={500} color={D.text3} tracking={0.16}>
                    최대 {MAX_CANDIDATE_THOUGHTS}개까지 적을 수 있어요
                  </Mono>
                </p>
              )}
            </SubField>

            {/* b) 그 생각이 나에 대해 말하는 것 */}
            <SubField
              label="그 생각은 나에 대해 뭐라고 말하고 있나요?"
              guide="예: ‘나는 부족해.’ ‘나는 뒤처지고 있어.’ ‘나는 아직 인정받을 만하지 않아.’"
            >
              <EditorialInput
                multiline
                rows={3}
                value={data.core_beliefs.about_self}
                onChange={(next) => updateCoreBelief("about_self", next)}
                placeholder="‘나는 …한 사람이다’로 시작해도 좋아요."
                ariaLabel="나에 대한 핵심 믿음"
              />
            </SubField>

            {/* f) 떠오른 이미지 */}
            <SubField
              label="그때 떠오른 장면이나 이미지는?"
              guide="머릿속에 구체적인 그림으로 그려진 장면이 있다면 적어주세요."
              optional
            >
              <EditorialInput
                multiline
                rows={3}
                value={data.thought_image}
                onChange={(next) => update("thought_image", next)}
                placeholder="예: ‘회의실에서 사람들이 나에 대해 수군거리는 모습.’"
                ariaLabel="떠오른 장면이나 이미지"
              />
            </SubField>

            {/* g) 사회적 시선 */}
            <SubField
              label="남들에게 내가 어떤 사람으로 보여질까요?"
              guide="그 상황에서 다른 사람들 눈에 비친 ‘나’는 어떤 모습일지."
              optional
            >
              <EditorialInput
                multiline
                rows={3}
                value={data.social_perception}
                onChange={(next) => update("social_perception", next)}
                placeholder="예: ‘업무도 제대로 못하는 형편없는 사람.’"
                ariaLabel="남들에게 비친 나의 모습"
              />
            </SubField>

            {/* h) 최악의 결과 */}
            <SubField
              label="최악의 경우, 어떤 일이 일어날 것 같다는 생각이 들었나요?"
              guide="그 생각이 사실이라면 앞으로 어떤 결과가 벌어질지 떠오르는 대로 적어주세요."
            >
              <EditorialInput
                multiline
                rows={3}
                value={data.worst_case_result}
                onChange={(next) => update("worst_case_result", next)}
                placeholder="예: ‘사람들이 나를 별로라고 생각할 것이고, 회사 내 평가도 엉망이 될 것이다.’"
                ariaLabel="최악의 결과"
              />
            </SubField>
          </div>
        </AxisCard>

        {/* ── ④ 신체 ───────────────────────────────────── */}
        <AxisCard
          index={4}
          title="신체"
          engCode="BODY"
          subtitle="몸이 보낸 신호"
        >
          <SubField
            label="그때 몸의 반응은 어땠나요?"
            guide="몸의 어디에서, 어떤 감각이 있었는지 적어주세요."
          >
            <EditorialInput
              multiline
              rows={3}
              value={data.emotions_body.body_text}
              onChange={(next) => updateBodyText(next)}
              placeholder="예: ‘가슴이 답답했다’, ‘잠을 못 잤다’, ‘어깨에 힘이 들어갔다’"
              ariaLabel="몸의 반응"
            />
          </SubField>
        </AxisCard>

        {/* ── ⑤ 행동 ───────────────────────────────────── */}
        <AxisCard
          index={5}
          title="행동"
          engCode="BEHAVIORS"
          subtitle="그래서 어떻게 했나"
        >
          <SubField
            label="그 상황을 해결하기 위해 어떤 행동을 하게 되었나요?"
            guide="쉼, 회피, 과몰두, 새 목표 설정 — 무엇이든 좋아요. 그 순간을 마주하기 위해 실제로 한 행동을 돌아보며 적어주세요."
          >
            <EditorialInput
              multiline
              rows={3}
              value={data.resulting_behavior}
              onChange={(next) => update("resulting_behavior", next)}
              placeholder="예: ‘그래서 주말에도 쉬지 않고 새로운 프로젝트를 시작했다.’"
              ariaLabel="실제로 한 행동"
            />
          </SubField>
        </AxisCard>

        {/* ── ⑥ 추가 질문 ──────────────────────────────── */}
        <AxisCard
          index={6}
          title="추가 질문"
          engCode="EXTRA"
          subtitle="평소에 비슷한 생각을 한 적이 있나요 · 선택"
        >
          <SubField
            label="최근에 아래 같은 생각을 한 적 있나요?"
            guide="앞에서 떠올린 생각과 비슷하게 느껴지는 것들을 모두 골라주세요. 해당 없으면 비워둬도 괜찮아요."
            optional
          >
            <div className="space-y-2">
              {COMMON_ACHIEVEMENT_THOUGHTS.map((thought) => {
                const checked = data.common_thoughts_checked.includes(thought);
                return (
                  <button
                    key={thought}
                    type="button"
                    onClick={() => toggleChecklist(thought)}
                    className={`flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition-colors ${
                      checked
                        ? "border-[var(--foreground)] bg-[var(--foreground)]/5"
                        : "border-[var(--foreground)]/15 bg-white hover:border-[var(--foreground)]/40"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                        checked
                          ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                          : "border-[var(--foreground)]/30 bg-white"
                      }`}
                    >
                      {checked && (
                        <svg
                          className="h-3 w-3"
                          viewBox="0 0 12 12"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            d="M2 6l3 3 5-6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </span>
                    <span
                      className={
                        checked
                          ? "font-medium text-[var(--foreground)]"
                          : "text-[var(--foreground)]/75"
                      }
                    >
                      {thought}
                    </span>
                  </button>
                );
              })}
            </div>
          </SubField>
        </AxisCard>
      </div>

      {/* 자동 저장 안내 */}
      <div className="mt-12 text-center">
        <Mono size={10} weight={500} color={D.text3} tracking={0.16}>
          작성 내용은 자동으로 저장됩니다
        </Mono>
      </div>

      {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

      {/* 제출 */}
      <div className="mt-6 text-center">
        <button
          onClick={handleNext}
          disabled={!isComplete || submitting}
          className="inline-flex rounded-xl border-2 border-[var(--foreground)] bg-[var(--foreground)] px-8 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          {submitting ? "저장 중..." : "인지 패턴 분석 받기 →"}
        </button>
        {!isComplete && missingItems.length > 0 && (
          <p className="mt-3">
            <Mono size={10} weight={500} color={D.text3} tracking={0.16}>
              아직 {missingItems.join(", ")}이(가) 비어 있어요
            </Mono>
          </p>
        )}
      </div>
    </div>
  );
}

/* ─ 헬퍼 컴포넌트 ─ */

function AxisCard({
  index,
  title,
  engCode,
  subtitle,
  children,
}: {
  index: number;
  title: string;
  engCode: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const kicker = `● ${String(index).padStart(2, "0")} · ${title}`;
  return (
    <section className="space-y-4">
      <SectionHeader kicker={kicker} rightLabel={engCode} accent />
      <Body muted>{subtitle}</Body>
      <div className="pt-2">{children}</div>
    </section>
  );
}

function SubField({
  label,
  guide,
  optional,
  children,
}: {
  label: string;
  guide?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2">
        <span
          style={{
            fontFamily: D.font,
            fontSize: TS.body,
            fontWeight: 600,
            color: D.ink,
            lineHeight: 1.5,
          }}
        >
          {label}
        </span>
        {optional && (
          <Mono size={11} weight={500} color={D.text3} tracking={0.16}>
            선택
          </Mono>
        )}
      </div>
      {guide && (
        <p
          style={{
            margin: "0 0 16px",
            fontFamily: D.font,
            fontSize: TS.body,
            color: D.text2,
            lineHeight: 1.7,
          }}
        >
          {guide}
        </p>
      )}
      {children}
    </div>
  );
}

