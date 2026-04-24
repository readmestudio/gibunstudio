"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EMOTION_CHIPS } from "@/lib/self-workshop/diagnosis";

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

  function setEmotionIntensity(n: number) {
    update("emotion_intensity", Math.max(0, Math.min(10, n)));
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

  function pickCoreThought(thought: string) {
    update("automatic_thought", thought);
  }

  function toggleSecondaryEmotion(emotion: string) {
    // 2a에서 고른 primary는 여기서 토글 불가(잠금)
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

  const hasContext =
    data.common_thoughts_checked.length > 0 ||
    data.trigger_context.trim().length > 0;

  const nonEmptyCandidates = data.candidate_thoughts.filter(
    (t) => t.trim().length > 0
  );
  const effectiveCoreThought =
    data.automatic_thought.trim().length > 0
      ? data.automatic_thought.trim()
      : nonEmptyCandidates.length === 1
        ? nonEmptyCandidates[0]!.trim()
        : "";

  const isComplete =
    data.recent_situation.trim().length > 0 &&
    data.primary_emotion.length > 0 &&
    data.emotion_intensity >= 1 &&
    nonEmptyCandidates.length >= 1 &&
    effectiveCoreThought.length > 0 &&
    hasContext &&
    data.core_beliefs.about_self.trim().length > 0 &&
    data.worst_case_result.trim().length > 0 &&
    data.resulting_behavior.trim().length > 0;

  const missingItems: string[] = [];
  if (data.recent_situation.trim().length === 0) missingItems.push("불편했던 상황");
  if (data.primary_emotion.length === 0 || data.emotion_intensity < 1)
    missingItems.push("감정과 강도");
  if (nonEmptyCandidates.length === 0) missingItems.push("떠오른 생각");
  else if (effectiveCoreThought.length === 0)
    missingItems.push("핵심 생각 선택");
  if (!hasContext) missingItems.push("비슷한 생각 체크 또는 주로 드는 맥락");
  if (data.core_beliefs.about_self.trim().length === 0)
    missingItems.push("나에 대한 신념");
  if (data.worst_case_result.trim().length === 0)
    missingItems.push("생각으로 인한 결과");
  if (data.resulting_behavior.trim().length === 0)
    missingItems.push("그 생각이 만든 행동");

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
    <div className="mx-auto max-w-lg space-y-10 pb-20">
      {/* 이전 페이지로 돌아가기 */}
      <Link
        href="/dashboard/self-workshop/step/3"
        className="inline-flex items-center text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:underline"
      >
        ← 이전 페이지 보기
      </Link>

      {/* 안내 */}
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-[var(--foreground)]">
          이제, 당신의 성취 중독 패턴을 함께 찾아볼 차례예요
        </h3>
        <p className="text-sm leading-relaxed text-[var(--foreground)]/65">
          정답은 없어요. 아래 질문에 떠오르는 대로 솔직하게 적어주세요. 한
          번에 모두 적지 않아도 괜찮아요 — 적은 만큼 자동 저장되고, 언제든
          이어서 쓸 수 있습니다.
        </p>
      </div>

      {/* 섹션: 최근 상황 */}
      <Section
        label="최근 '성취 때문에' 마음이 불편했던 순간"
        guide="지난 일주일 안에, 일·성과·경쟁 때문에 마음이 무거워진 장면을 하나 떠올려 주세요."
      >
        <textarea
          value={data.recent_situation}
          onChange={(e) => update("recent_situation", e.target.value)}
          placeholder="예: 금요일 회의에서 팀장이 내 제안을 가볍게 넘기고 다음 주제로 넘어갔을 때"
          rows={4}
          className={textareaClass}
        />
      </Section>

      {/* 섹션 2: 자동 사고 — 2a 감정·강도 / 2b 후보 생각 / 2c 핵심 선정 */}
      <div className="space-y-6">
        {/* 가장 강했던 감정 + 강도 */}
        <SubSection
          label="그 순간 가장 강하게 올라온 감정 하나"
          guide="가장 크게 훅 올라온 감정 하나를 고르고, 0~10 중 몇 점쯤이었는지 체크해 주세요. (5점 = 보통 불편, 10점 = 견디기 힘듦)"
        >
          <div className="mb-3 flex flex-wrap gap-2">
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

          <IntensitySlider
            value={data.emotion_intensity}
            onChange={setEmotionIntensity}
            disabled={data.primary_emotion.length === 0}
          />
        </SubSection>

        {/* 머릿속에 스쳐 지나간 생각들 (후보) */}
        <SubSection label="그 순간 머릿속에 스쳐 지나간 생각들">
          <p className="mb-4 text-sm leading-relaxed text-[var(--foreground)]/60">
            머릿속을 스친 생각들은 <strong className="text-[var(--foreground)]/80">화재경보기</strong> 같아요.
            실제 화재를 판단한 게 아니라 ‘일단 위험’이라고 빠르게 울린 신호죠.
            합리적이지 않아도 괜찮아요 — 그냥 떠오른 대로 모두 적어봅니다.
          </p>

          <div className="space-y-2">
            {(data.candidate_thoughts.length === 0
              ? [""]
              : data.candidate_thoughts
            ).map((thought, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="mt-3 shrink-0 text-sm text-[var(--foreground)]/40">
                  {idx + 1}.
                </span>
                <textarea
                  value={thought}
                  onChange={(e) => {
                    if (data.candidate_thoughts.length === 0) {
                      // 초기 렌더 때 빈 줄 1개를 시드
                      const merged = {
                        ...data,
                        candidate_thoughts: [e.target.value],
                      };
                      setData(merged);
                      autoSave(merged);
                    } else {
                      updateCandidateThought(idx, e.target.value);
                    }
                  }}
                  placeholder={
                    idx === 0
                      ? "예: ‘내 아이디어가 별로인가 봐.’"
                      : "예: ‘나 진짜 별 볼일 없네.’"
                  }
                  rows={2}
                  className={textareaClass}
                />
                {data.candidate_thoughts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCandidateThought(idx)}
                    className="mt-1 shrink-0 rounded-lg border-2 border-[var(--foreground)]/20 px-2 py-1 text-xs text-[var(--foreground)]/50 hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
                    aria-label={`${idx + 1}번 생각 삭제`}
                  >
                    삭제
                  </button>
                )}
              </div>
            ))}
          </div>

          {data.candidate_thoughts.length < MAX_CANDIDATE_THOUGHTS && (
            <button
              type="button"
              onClick={addCandidateThought}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:underline"
            >
              + 생각 추가하기
            </button>
          )}
          {data.candidate_thoughts.length >= MAX_CANDIDATE_THOUGHTS && (
            <p className="mt-2 text-xs text-[var(--foreground)]/40">
              최대 {MAX_CANDIDATE_THOUGHTS}개까지 적을 수 있어요.
            </p>
          )}
        </SubSection>

        {/* 감정과 가장 직접 연결된 생각 고르기 */}
        {nonEmptyCandidates.length >= 2 && (
          <SubSection
            label="그 감정을 가장 직접 불러온 생각 하나 고르기"
            guide={
              data.primary_emotion && data.emotion_intensity > 0
                ? `“이 생각을 떠올리면 다시 ${data.primary_emotion}(${data.emotion_intensity}점)이 올라오나요?” 한 개만 골라주세요.`
                : "감정과 가장 직접 연결된 생각을 하나만 골라주세요."
            }
          >
            <div className="space-y-2">
              {nonEmptyCandidates.map((thought) => {
                const selected = data.automatic_thought === thought;
                return (
                  <button
                    key={thought}
                    type="button"
                    onClick={() => pickCoreThought(thought)}
                    className={`flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm transition-colors ${
                      selected
                        ? "border-[var(--foreground)] bg-[var(--foreground)]/5"
                        : "border-[var(--foreground)]/15 bg-white hover:border-[var(--foreground)]/40"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        selected
                          ? "border-[var(--foreground)] bg-[var(--foreground)]"
                          : "border-[var(--foreground)]/30 bg-white"
                      }`}
                    >
                      {selected && (
                        <span className="block h-2 w-2 rounded-full bg-white" />
                      )}
                    </span>
                    <span
                      className={
                        selected
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
          </SubSection>
        )}
      </div>

      {/* 섹션: 체크리스트 */}
      <Section
        label="최근에 아래 같은 생각을 한 적 있나요?"
        guide="앞에서 떠올린 생각과 비슷하게 느껴지는 것들을 모두 골라주세요."
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
                      <path d="M2 6l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
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
      </Section>

      {/* 섹션: 맥락 */}
      <Section
        label="이런 생각은 주로 어떤 상황에서 드나요?"
        guide="자주 떠오르는 장면이 있다면 적어주세요. (예: 월말 평가 직전, 친구 SNS 보고, 퇴근 후 혼자 있을 때)"
      >
        <textarea
          value={data.trigger_context}
          onChange={(e) => update("trigger_context", e.target.value)}
          placeholder="예: 주말 저녁에 혼자 있을 때, 동기가 좋은 소식을 올릴 때"
          rows={3}
          className={textareaClass}
        />
      </Section>

      {/* 섹션: 몸 반응 중심 (+ 동반 감정 선택) */}
      <Section
        label="그때 몸의 반응은 어땠나요?"
        guide="몸에서 어떤 반응이 있었는지 적어주세요. 위에서 고른 감정 외에 동반된 감정이 있으면 아래에서 더 골라도 좋아요."
      >
        <textarea
          value={data.emotions_body.body_text}
          onChange={(e) => updateBodyText(e.target.value)}
          placeholder="예: ‘가슴이 답답했다’, ‘잠을 못 잤다’, ‘어깨에 힘이 들어갔다’"
          rows={3}
          className={textareaClass}
        />

        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-[var(--foreground)]/55">
            동반 감정 (선택)
          </p>
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
        </div>
      </Section>

      {/* 섹션: 자동사고 완성하기 (상황에 대한 생각 + 생각으로 인한 결과) */}
      <div className="space-y-4">
        <div>
          <h4 className="text-base font-semibold text-[var(--foreground)]">
            그 생각은 당신에게 어떤 이야기를 들려주고 있나요?
          </h4>
        </div>

        <p className="text-sm leading-relaxed text-[var(--foreground)]/60">
          앞에서 고른 핵심 생각이 당신에게 어떤 이야기를 들려주고 있는지
          천천히 풀어보세요. 이 답들이 모여 당신의{" "}
          <strong className="text-[var(--foreground)]/80">자동사고</strong>가 완성돼요.
        </p>

        <SubSection
          label="그 생각은 나에 대해 뭐라고 말하고 있나요?"
          guide="예: ‘나는 부족해.’ ‘나는 뒤처지고 있어.’ ‘나는 아직 인정받을 만하지 않아.’"
        >
          <textarea
            value={data.core_beliefs.about_self}
            onChange={(e) => updateCoreBelief("about_self", e.target.value)}
            placeholder="‘나는 …한 사람이다’로 시작해도 좋아요."
            rows={3}
            className={textareaClass}
          />
        </SubSection>

        <SubSection
          label="최악의 경우, 어떤 일이 일어날 것 같다는 생각이 들었나요?"
          guide="그 생각이 사실이라면 앞으로 어떤 결과가 벌어질지 떠오르는 대로 적어주세요. (생각으로 인한 결과)"
        >
          <textarea
            value={data.worst_case_result}
            onChange={(e) =>
              update("worst_case_result", e.target.value)
            }
            placeholder="예: ‘사람들이 나를 별로라고 생각할 것이고, 회사 내 평가도 엉망이 될 것이다.’"
            rows={3}
            className={textareaClass}
          />
        </SubSection>

        <SubSection
          label="그때 떠오른 장면이나 이미지는?"
          guide="머릿속에 구체적인 그림으로 그려진 장면이 있다면 적어주세요. 떠오르지 않으면 비워도 괜찮아요."
        >
          <textarea
            value={data.thought_image}
            onChange={(e) => update("thought_image", e.target.value)}
            placeholder="예: ‘회의실에서 사람들이 나에 대해 수군거리는 모습.’"
            rows={3}
            className={textareaClass}
          />
        </SubSection>

        <SubSection
          label="남들에게 내가 어떤 사람으로 보여질까요?"
          guide="그 상황에서 다른 사람들 눈에 비친 ‘나’는 어떤 모습일지. 떠오르지 않으면 비워도 괜찮아요."
        >
          <textarea
            value={data.social_perception}
            onChange={(e) => update("social_perception", e.target.value)}
            placeholder="예: ‘업무도 제대로 못하는 형편없는 사람.’"
            rows={3}
            className={textareaClass}
          />
        </SubSection>

        <SubSection
          label="그 생각 때문에 실제로 어떤 행동을 하게 되었나요?"
          guide="자동사고가 당신을 어떤 행동으로 이끌었는지 돌아보며 적어주세요. 쉼, 회피, 과몰두, 새 목표 설정 — 무엇이든 좋아요."
        >
          <textarea
            value={data.resulting_behavior}
            onChange={(e) => update("resulting_behavior", e.target.value)}
            placeholder="예: ‘그래서 주말에도 쉬지 않고 새로운 프로젝트를 시작했다.’"
            rows={3}
            className={textareaClass}
          />
        </SubSection>
      </div>

      {/* 자동 저장 안내 */}
      <p className="text-center text-xs text-[var(--foreground)]/40">
        작성 내용은 자동으로 저장됩니다
      </p>

      {error && <p className="text-center text-sm text-red-600">{error}</p>}

      {/* 제출 */}
      <div className="text-center">
        <button
          onClick={handleNext}
          disabled={!isComplete || submitting}
          className="inline-flex rounded-xl border-2 border-[var(--foreground)] px-8 py-4 text-base font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-30"
        >
          {submitting ? "저장 중..." : "인지 패턴 분석 받기 →"}
        </button>
        {!isComplete && missingItems.length > 0 && (
          <p className="mt-2 text-xs text-[var(--foreground)]/50">
            아직 {missingItems.join(", ")}이(가) 비어 있어요
          </p>
        )}
      </div>
    </div>
  );
}

/* ─ 헬퍼 컴포넌트 ─ */

const textareaClass =
  "w-full resize-none rounded-xl border-2 border-[var(--foreground)]/20 px-4 py-3 text-base text-[var(--foreground)] placeholder:text-[var(--foreground)]/30 focus:border-[var(--foreground)] focus:outline-none transition-colors";

function Section({
  label,
  guide,
  children,
}: {
  label: string;
  guide: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-base font-semibold text-[var(--foreground)]">
        {label}
      </label>
      <p className="mb-3 text-sm text-[var(--foreground)]/60">{guide}</p>
      {children}
    </div>
  );
}

function SubSection({
  label,
  guide,
  children,
}: {
  label: string;
  guide?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-[var(--foreground)]">
        {label}
      </label>
      {guide && (
        <p className="mb-2 text-xs text-[var(--foreground)]/55">{guide}</p>
      )}
      {children}
    </div>
  );
}

function IntensitySlider({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  const steps = Array.from({ length: 11 }, (_, i) => i);
  return (
    <div className={disabled ? "opacity-40" : undefined}>
      <div className="flex items-center justify-between text-[11px] text-[var(--foreground)]/50">
        <span>전혀 아님 0</span>
        <span>보통 5</span>
        <span>10 견디기 힘듦</span>
      </div>
      <div
        role="group"
        aria-label="감정 강도 0~10"
        className="mt-2 grid grid-cols-11 gap-1"
      >
        {steps.map((n) => {
          const selected = value === n;
          return (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onChange(n)}
              aria-pressed={selected}
              aria-label={`강도 ${n}`}
              className={`flex h-10 items-center justify-center rounded-lg border-2 text-sm font-semibold transition-colors ${
                selected
                  ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                  : "border-[var(--foreground)]/20 text-[var(--foreground)]/60 hover:border-[var(--foreground)]"
              } ${disabled ? "cursor-not-allowed" : ""}`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
