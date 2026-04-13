"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface InsightCard {
  card_type: string;
  title: string;
  content: string;
}

interface Props {
  workshopId: string;
  step: 5 | 8; // Step 5: 메커니즘 분석, Step 8: 통합 써머리
  savedCards?: InsightCard[];
}

export function WorkshopAIAnalysis({ workshopId, step, savedCards }: Props) {
  const router = useRouter();
  const [cards, setCards] = useState<InsightCard[]>(savedCards ?? []);
  const [loading, setLoading] = useState(!savedCards?.length);
  const [currentCard, setCurrentCard] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (savedCards?.length) return;

    async function fetchAnalysis() {
      try {
        const endpoint =
          step === 5
            ? "/api/self-workshop/analyze-mechanism"
            : "/api/self-workshop/generate-summary";

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workshopId }),
        });

        if (!res.ok) throw new Error("분석에 실패했습니다.");
        const data = await res.json();
        setCards(data.cards);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchAnalysis();
  }, [workshopId, step, savedCards]);

  const nextStep = step === 5 ? 6 : 9;
  const nextLabel = step === 5 ? "대처법 알아보기 →" : "마무리 성찰 →";

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[var(--foreground)] border-t-transparent" />
          <p className="text-base font-medium text-[var(--foreground)]">
            {step === 5
              ? "당신의 패턴을 분석하고 있어요..."
              : "워크북을 정리하고 있어요..."}
          </p>
          <p className="mt-2 text-sm text-[var(--foreground)]/50">
            잠시만 기다려 주세요
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg border-2 border-[var(--foreground)] px-6 py-2 text-sm font-medium"
        >
          다시 시도
        </button>
      </div>
    );
  }

  const card = cards[currentCard];

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* 카드 */}
      {card && (
        <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-8">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--foreground)]/50">
            {card.card_type === "pattern_summary" && "패턴 요약"}
            {card.card_type === "cross_validation" && "진단 교차검증"}
            {card.card_type === "hidden_pattern" && "숨겨진 패턴"}
            {card.card_type === "key_question" && "핵심 질문"}
            {card.card_type === "summary" && "전체 요약"}
          </p>
          <h3 className="mb-4 text-xl font-bold text-[var(--foreground)]">
            {card.title}
          </h3>
          <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--foreground)]/80">
            {card.content}
          </p>
        </div>
      )}

      {/* 카드 네비게이션 */}
      {cards.length > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentCard((i) => Math.max(0, i - 1))}
            disabled={currentCard === 0}
            className="rounded-lg border-2 border-[var(--foreground)]/20 px-4 py-2 text-sm disabled:opacity-30"
          >
            ←
          </button>
          <span className="text-sm text-[var(--foreground)]/60">
            {currentCard + 1} / {cards.length}
          </span>
          <button
            onClick={() =>
              setCurrentCard((i) => Math.min(cards.length - 1, i + 1))
            }
            disabled={currentCard === cards.length - 1}
            className="rounded-lg border-2 border-[var(--foreground)]/20 px-4 py-2 text-sm disabled:opacity-30"
          >
            →
          </button>
        </div>
      )}

      {/* 도트 인디케이터 */}
      {cards.length > 1 && (
        <div className="flex justify-center gap-2">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentCard(i)}
              className={`h-2 w-2 rounded-full transition-colors ${
                i === currentCard
                  ? "bg-[var(--foreground)]"
                  : "bg-[var(--foreground)]/20"
              }`}
            />
          ))}
        </div>
      )}

      {/* 다음 단계 */}
      <div className="text-center pt-4">
        <button
          onClick={() =>
            router.push(`/dashboard/self-workshop/step/${nextStep}`)
          }
          className="inline-flex rounded-xl border-2 border-[var(--foreground)] px-8 py-4 text-base font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
