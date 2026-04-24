"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WorkshopCognitiveReport } from "./WorkshopCognitiveReport";

interface InsightCard {
  card_type: string;
  title: string;
  content: string;
}

interface Props {
  workshopId: string;
  step: 4 | 7;
  savedCards?: InsightCard[];
  savedReport?: unknown;
  mechanismAnalysis?: unknown;
  userName?: string | null;
}

export function WorkshopAIAnalysis({
  workshopId,
  step,
  savedCards,
  savedReport,
  mechanismAnalysis,
  userName,
}: Props) {
  if (step === 4) {
    return (
      <WorkshopCognitiveReport
        workshopId={workshopId}
        savedReport={savedReport ?? null}
        mechanismAnalysis={mechanismAnalysis ?? null}
        userName={userName}
      />
    );
  }

  return (
    <SummaryCarousel workshopId={workshopId} savedCards={savedCards} />
  );
}

function SummaryCarousel({
  workshopId,
  savedCards,
}: {
  workshopId: string;
  savedCards?: InsightCard[];
}) {
  const router = useRouter();
  const [cards, setCards] = useState<InsightCard[]>(savedCards ?? []);
  const [loading, setLoading] = useState(!savedCards?.length);
  const [currentCard, setCurrentCard] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (savedCards?.length) return;

    async function fetchAnalysis() {
      try {
        const res = await fetch("/api/self-workshop/generate-summary", {
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
  }, [workshopId, savedCards]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[var(--foreground)] border-t-transparent" />
          <p className="text-base font-medium text-[var(--foreground)]">
            워크북을 정리하고 있어요...
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
      {card && (
        <div className="rounded-xl border-2 border-[var(--foreground)] bg-white p-8">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-[var(--foreground)]/50">
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

      <div className="text-center pt-4">
        <button
          onClick={() => router.push("/dashboard/self-workshop/step/8")}
          className="inline-flex rounded-xl border-2 border-[var(--foreground)] px-8 py-4 text-base font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
        >
          마무리 성찰 →
        </button>
      </div>
    </div>
  );
}
