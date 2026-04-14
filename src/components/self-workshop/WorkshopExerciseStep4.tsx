"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EMOTION_CHIPS } from "@/lib/self-workshop/diagnosis";

interface MechanismAnalysis {
  recent_situation: string;
  automatic_thought: string;
  common_thoughts_checked: string[];
  trigger_context: string;
  emotions_body: {
    emotions: string[];
    body_text: string;
  };
  core_beliefs: {
    about_self: string;
    about_others: string;
    about_world: string;
  };
}

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
  automatic_thought: "",
  common_thoughts_checked: [],
  trigger_context: "",
  emotions_body: { emotions: [], body_text: "" },
  core_beliefs: { about_self: "", about_others: "", about_world: "" },
};

function mergeSaved(
  saved: Partial<MechanismAnalysis> | undefined
): MechanismAnalysis {
  if (!saved) return EMPTY;
  return {
    recent_situation: saved.recent_situation ?? "",
    automatic_thought: saved.automatic_thought ?? "",
    common_thoughts_checked: saved.common_thoughts_checked ?? [],
    trigger_context: saved.trigger_context ?? "",
    emotions_body: {
      emotions: saved.emotions_body?.emotions ?? [],
      body_text: saved.emotions_body?.body_text ?? "",
    },
    core_beliefs: {
      about_self: saved.core_beliefs?.about_self ?? "",
      about_others: saved.core_beliefs?.about_others ?? "",
      about_world: saved.core_beliefs?.about_world ?? "",
    },
  };
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

  function toggleEmotion(emotion: string) {
    const current = data.emotions_body.emotions;
    const next = current.includes(emotion)
      ? current.filter((e) => e !== emotion)
      : [...current, emotion];
    update("emotions_body", { ...data.emotions_body, emotions: next });
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

  const isComplete =
    data.recent_situation.trim().length > 0 &&
    data.automatic_thought.trim().length > 0 &&
    hasContext &&
    data.core_beliefs.about_self.trim().length > 0;

  const missingItems: string[] = [];
  if (data.recent_situation.trim().length === 0) missingItems.push("1번 상황");
  if (data.automatic_thought.trim().length === 0) missingItems.push("2번 생각");
  if (!hasContext) missingItems.push("3번 체크리스트 또는 4번 맥락");
  if (data.core_beliefs.about_self.trim().length === 0)
    missingItems.push("6-1번 (나에 대한 신념)");

  async function handleNext() {
    if (!isComplete) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/self-workshop/save-progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshopId,
          field: "mechanism_analysis",
          data,
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
        <div className="rounded-xl border-2 border-[var(--foreground)]/20 bg-white p-4">
          <p className="text-sm leading-relaxed text-[var(--foreground)]/65">
            정답은 없어요. 아래 여섯 가지 질문에 떠오르는 대로 솔직하게
            적어주세요. 한 번에 모두 적지 않아도 괜찮아요 — 적은 만큼 자동
            저장되고, 언제든 이어서 쓸 수 있습니다.
          </p>
        </div>
      </div>

      {/* 섹션 1: 최근 상황 */}
      <Section
        label="1. 최근 '성취 때문에' 마음이 불편했던 순간"
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

      {/* 섹션 2: 자동 사고 */}
      <Section
        label="2. 그 상황에서 머릿속에 자동으로 스친 생각"
        guide="‘생각’이라기보다 훅 지나간 말·문장·이미지에 가까워요. 길지 않아도 괜찮아요."
      >
        <textarea
          value={data.automatic_thought}
          onChange={(e) => update("automatic_thought", e.target.value)}
          placeholder="예: ‘내 아이디어가 별로인가 봐. 나 진짜 별 볼일 없네.’"
          rows={3}
          className={textareaClass}
        />
      </Section>

      {/* 섹션 3: 체크리스트 */}
      <Section
        label="3. 최근에 아래 같은 생각을 한 적 있나요?"
        guide="비슷하다고 느껴지는 걸 모두 골라주세요. 2번에 적은 생각과 유사한 것도 포함됩니다."
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

      {/* 섹션 4: 맥락 */}
      <Section
        label="4. 이런 생각은 주로 어떤 상황에서 드나요?"
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

      {/* 섹션 5: 신체·감정 */}
      <Section
        label="5. 그때 몸과 마음의 반응은 어땠나요?"
        guide="느꼈던 감정을 모두 고르고, 몸의 반응이 있었다면 아래에 적어주세요."
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {EMOTION_CHIPS.map((emotion) => {
            const selected = data.emotions_body.emotions.includes(emotion);
            return (
              <button
                key={emotion}
                type="button"
                onClick={() => toggleEmotion(emotion)}
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

        <textarea
          value={data.emotions_body.body_text}
          onChange={(e) => updateBodyText(e.target.value)}
          placeholder="몸의 반응도 함께 적어주세요. 예: ‘가슴이 답답했다’, ‘잠을 못 잤다’"
          rows={3}
          className={textareaClass}
        />
      </Section>

      {/* 섹션 6: 핵심 신념 (3축) */}
      <div className="space-y-4">
        <div>
          <h4 className="text-base font-semibold text-[var(--foreground)]">
            6. 그 생각은 당신에게 어떤 이야기를 들려주고 있나요?
          </h4>
        </div>

        <div className="rounded-xl border-2 border-[var(--foreground)]/15 bg-[var(--surface)] p-5 text-sm leading-relaxed text-[var(--foreground)]/75">
          자동으로 떠오르는 생각 뒤에는, <strong>자신·타인·세상에 대한 깊은 믿음</strong>이
          숨어 있어요. 당신이 2번에 적은 그 생각이 각각에 대해 뭐라고 말하고 있는지
          천천히 풀어보세요. 한 줄이어도 괜찮고, 떠오르는 것만 적어도 괜찮아요.
        </div>

        <SubSection
          label="6-1. 그 생각은 나에 대해 뭐라고 말하고 있나요?"
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
          label="6-2. 그 생각은 남(타인)에 대해 뭐라고 말하고 있나요?"
          guide="예: ‘남들은 나보다 앞서 있어.’ ‘사람들은 내 실수를 기억해.’"
        >
          <textarea
            value={data.core_beliefs.about_others}
            onChange={(e) => updateCoreBelief("about_others", e.target.value)}
            placeholder="떠오르지 않으면 비워도 괜찮아요."
            rows={3}
            className={textareaClass}
          />
        </SubSection>

        <SubSection
          label="6-3. 그 생각은 세상에 대해 뭐라고 말하고 있나요?"
          guide="예: ‘세상은 증명한 사람만 인정해.’ ‘쉬면 낙오되는 곳이야.’"
        >
          <textarea
            value={data.core_beliefs.about_world}
            onChange={(e) => updateCoreBelief("about_world", e.target.value)}
            placeholder="떠오르지 않으면 비워도 괜찮아요."
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
  guide: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-[var(--foreground)]">
        {label}
      </label>
      <p className="mb-2 text-xs text-[var(--foreground)]/55">{guide}</p>
      {children}
    </div>
  );
}
