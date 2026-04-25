"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { type NewBeliefData } from "@/lib/self-workshop/new-belief";

interface Props {
  workshopId: string;
  savedData?: Partial<NewBeliefData>;
  /** Step 3 mechanism_analysis.recent_situation */
  recentSituation: string;
  /** FIND_OUT 2 synthesis.belief_line */
  oldBeliefLine: string;
  /** FIND_OUT 2 synthesis.reframe_invitation */
  reframeInvitation: string;
}

export function WorkshopNewBeliefContent({
  workshopId,
  savedData,
  recentSituation,
  oldBeliefLine,
  reframeInvitation,
}: Props) {
  const router = useRouter();

  const initial: NewBeliefData = {
    situation: savedData?.situation ?? recentSituation,
    old_belief_snapshot: savedData?.old_belief_snapshot ?? oldBeliefLine,
    reframe_invitation: savedData?.reframe_invitation ?? reframeInvitation,
    new_core_belief: savedData?.new_core_belief ?? "",
    why_this_works: savedData?.why_this_works ?? "",
    ai_candidates: savedData?.ai_candidates,
  };

  const [data, setData] = useState<NewBeliefData>(initial);
  const [showHint, setShowHint] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<NodeJS.Timeout>(undefined);

  const autoSave = useCallback(
    (updated: NewBeliefData) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        await fetch("/api/self-workshop/save-progress", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workshopId,
            field: "new_belief",
            data: updated,
          }),
        });
      }, 1000);
    },
    [workshopId]
  );

  function update(patch: Partial<NewBeliefData>) {
    const updated = { ...data, ...patch };
    setData(updated);
    autoSave(updated);
  }

  async function handleNext() {
    if (!data.new_core_belief.trim()) {
      setError("새 핵심 믿음을 한 줄이라도 적어주세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/self-workshop/save-progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workshopId,
          field: "new_belief",
          data,
          advanceStep: 9,
        }),
      });
      if (!res.ok) throw new Error("저장에 실패했습니다.");
      router.push("/dashboard/self-workshop/step/9");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  // 선행 데이터가 비어있으면 안내
  if (!recentSituation || !oldBeliefLine) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <p className="text-sm text-[var(--foreground)]/60">
          이 단계로 오기 전 단계들이 비어 있어요. FIND OUT 단계부터 다시 진행해 주세요.
        </p>
        <Link
          href="/dashboard/self-workshop"
          className="mt-4 inline-block text-sm font-medium text-[var(--foreground)] underline"
        >
          워크북 목록으로 돌아가기 →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-20">
      {/* 인트로 */}
      <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--foreground)]/50">
          새 신념 만들기
        </p>
        <p className="mt-3 text-base font-bold leading-snug text-[var(--foreground)]">
          이번엔 같은 상황에서 다르게 말 걸어볼 거예요
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]/70">
          이전 단계에서 오랜 핵심 믿음에 균열을 냈죠. 이번엔 그 균열 사이로
          새 신념이 자라날 자리를 만들어볼게요.
        </p>
      </div>

      {/* 상황 카드 */}
      <div className="rounded-xl border-2 border-[var(--foreground)]/30 bg-[var(--surface)] p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground)]/50">
          그때 그 상황
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--foreground)]/80">
          {recentSituation}
        </p>
      </div>

      {/* 옛 신념 카드 (회색) */}
      <div className="rounded-xl border-2 border-[var(--foreground)]/15 bg-white p-5 opacity-70">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--foreground)]/40">
          지금까지의 핵심 믿음
        </p>
        <p className="mt-2 text-sm font-semibold text-[var(--foreground)]/60 line-through decoration-[var(--foreground)]/40 decoration-2">
          “{oldBeliefLine}”
        </p>
      </div>

      {/* 리프레임 힌트 (접기/펼치기) */}
      {reframeInvitation && (
        <div className="rounded-xl border-2 border-dashed border-[var(--foreground)]/30 bg-white p-5">
          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            className="flex w-full items-center justify-between text-left"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--foreground)]/60">
              💡 힌트가 필요하면 펼쳐보기
            </p>
            <span className="text-sm text-[var(--foreground)]/50">
              {showHint ? "접기" : "펼치기"}
            </span>
          </button>
          {showHint && (
            <p className="mt-3 text-sm leading-relaxed text-[var(--foreground)]/70">
              {reframeInvitation}
            </p>
          )}
        </div>
      )}

      {/* 새 핵심 믿음 입력 */}
      <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-6">
        <label className="block">
          <span className="text-base font-bold text-[var(--foreground)]">
            이 상황에서 새로운 핵심 믿음은 무엇이 될 수 있을까요?
          </span>
          <span className="mt-1 block text-xs text-[var(--foreground)]/60">
            짧고 한 줄이어도 좋아요. 진심으로 자신에게 말할 수 있는 문장이면 충분해요.
          </span>
          <textarea
            value={data.new_core_belief}
            onChange={(e) => update({ new_core_belief: e.target.value })}
            rows={4}
            className="mt-3 w-full resize-none rounded-lg border-2 border-[var(--foreground)]/15 bg-white px-3 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
            placeholder="예: 나는 결과로 내 가치를 증명하지 않아도 충분한 사람이다."
          />
        </label>

        <label className="mt-5 block">
          <span className="text-sm font-semibold text-[var(--foreground)]/80">
            왜 이 새 믿음이 당신에게 맞을까요? <span className="text-[var(--foreground)]/40">(선택)</span>
          </span>
          <textarea
            value={data.why_this_works}
            onChange={(e) => update({ why_this_works: e.target.value })}
            rows={3}
            className="mt-2 w-full resize-none rounded-lg border-2 border-[var(--foreground)]/15 bg-white px-3 py-2.5 text-sm focus:border-[var(--foreground)] focus:outline-none"
            placeholder="예: 이 믿음이 있었다면 그날 나에게 더 다정할 수 있었을 거예요."
          />
        </label>
      </div>

      {/* 다음 */}
      {error && (
        <p className="text-center text-sm text-red-600">{error}</p>
      )}
      <div className="text-center pt-2">
        <button
          onClick={handleNext}
          disabled={submitting}
          className="inline-flex rounded-xl border-2 border-[var(--foreground)] bg-[var(--foreground)] px-8 py-4 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "저장 중..." : "대체 사고와 실천 계획 →"}
        </button>
      </div>
    </div>
  );
}
