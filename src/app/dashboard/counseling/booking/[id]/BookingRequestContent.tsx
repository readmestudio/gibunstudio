"use client";

import { useState } from "react";
import Link from "next/link";

type Props = { bookingId: string };

export function BookingRequestContent({ bookingId }: Props) {
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [surveyAnswers, setSurveyAnswers] = useState({ concern: "", goal: "" });

  // TODO: 코치가 설정한 가능 시간대 조회 (Supabase)
  const availableSlots: { date: string; time: string; id: string }[] = [];

  const handleSubmit = () => {
    alert("예약 요청이 전송되었습니다. 코치가 확정하면 알려드립니다.");
  };

  return (
    <div className="mt-8 space-y-8">
      <section className="rounded-xl border border-[var(--border)] bg-white p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          예약 가능 시간
        </h2>
        {availableSlots.length === 0 ? (
          <p className="mt-4 text-[var(--foreground)]/60">
            코치가 설정한 예약 가능 시간이 없습니다. 나중에 다시 확인해 주세요.
          </p>
        ) : (
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {availableSlots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() =>
                  setSelectedSlots((prev) =>
                    prev.includes(slot.id)
                      ? prev.filter((s) => s !== slot.id)
                      : [...prev, slot.id]
                  )
                }
                className={`rounded-lg border px-4 py-2 text-sm ${
                  selectedSlots.includes(slot.id)
                    ? "border-[var(--accent)] bg-[var(--accent-muted)]"
                    : "border-[var(--border)] hover:border-[var(--accent)]"
                }`}
              >
                {slot.date} {slot.time}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-white p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          서베이
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)]">
              상담에서 다루고 싶은 고민
            </label>
            <textarea
              value={surveyAnswers.concern}
              onChange={(e) =>
                setSurveyAnswers((prev) => ({ ...prev, concern: e.target.value }))
              }
              rows={3}
              placeholder="간단히 적어 주세요"
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--foreground)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)]">
              상담을 통해 얻고 싶은 것
            </label>
            <textarea
              value={surveyAnswers.goal}
              onChange={(e) =>
                setSurveyAnswers((prev) => ({ ...prev, goal: e.target.value }))
              }
              rows={2}
              placeholder="간단히 적어 주세요"
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--foreground)]"
            />
          </div>
        </div>
      </section>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={selectedSlots.length === 0}
          className="rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--foreground)] disabled:opacity-50 hover:bg-[var(--accent-hover)]"
        >
          예약 요청 보내기
        </button>
        <Link
          href="/dashboard/counseling"
          className="rounded-lg border border-[var(--border)] px-6 py-3 font-medium text-[var(--foreground)]/80 hover:bg-[var(--surface)]"
        >
          돌아가기
        </Link>
      </div>
    </div>
  );
}
