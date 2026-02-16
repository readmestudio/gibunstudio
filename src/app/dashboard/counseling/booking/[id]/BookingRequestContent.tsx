"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BookingCalendar, type SlotData } from "@/components/booking/BookingCalendar";
import { MAX_SLOT_SELECTIONS } from "@/lib/counseling/types";

type Props = { bookingId: string };

export function BookingRequestContent({ bookingId }: Props) {
  const router = useRouter();
  const [availableSlots, setAvailableSlots] = useState<SlotData[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<
    { id: string; slotTime: string }[]
  >([]);
  const [surveyAnswers, setSurveyAnswers] = useState({
    concern: "",
    goal: "",
  });
  const [loading, setLoading] = useState(true);

  const fetchSlots = useCallback(async () => {
    try {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const res = await fetch(`/api/booking/available-slots?month=${month}`);
      const data = await res.json();
      setAvailableSlots(data.slots || []);
    } catch {
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  function handleSelectSlot(slotId: string, slotTime: string) {
    if (selectedSlots.length >= MAX_SLOT_SELECTIONS) return;
    setSelectedSlots((prev) => [...prev, { id: slotId, slotTime }]);
  }

  function handleDeselectSlot(slotId: string) {
    setSelectedSlots((prev) => prev.filter((s) => s.id !== slotId));
  }

  const handleSubmit = async () => {
    if (selectedSlots.length === 0) return;
    alert(
      "예약 요청이 전송되었습니다. 상담사가 희망 시간 중 하나를 확정하면 알려드립니다."
    );
    router.push("/dashboard/counseling");
  };

  const selectedSlotIds = selectedSlots.map((s) => s.id);

  return (
    <div className="mt-8 space-y-8">
      <section className="rounded-xl border border-[var(--border)] bg-white p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          예약 가능 시간
        </h2>
        <p className="mt-1 text-sm text-[var(--foreground)]/60 mb-4">
          상담사와 시간 조율을 위해 최대 {MAX_SLOT_SELECTIONS}개의 희망 시간을
          선택해주세요.
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-[var(--foreground)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <BookingCalendar
            availableSlots={availableSlots}
            selectedSlotIds={selectedSlotIds}
            onSelectSlot={handleSelectSlot}
            onDeselectSlot={handleDeselectSlot}
            maxSelections={MAX_SLOT_SELECTIONS}
          />
        )}

        {selectedSlots.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
            <p className="text-sm font-medium text-[var(--foreground)] mb-1">
              선택한 시간 ({selectedSlots.length}/{MAX_SLOT_SELECTIONS})
            </p>
            {selectedSlots.map((slot, i) => {
              const d = new Date(slot.slotTime);
              return (
                <p key={slot.id} className="text-sm text-[var(--foreground)]/80">
                  {i + 1}순위: {d.getMonth() + 1}월 {d.getDate()}일{" "}
                  {String(d.getHours()).padStart(2, "0")}:
                  {String(d.getMinutes()).padStart(2, "0")}
                </p>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-white p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          사전 설문
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)]">
              상담에서 다루고 싶은 고민
            </label>
            <textarea
              value={surveyAnswers.concern}
              onChange={(e) =>
                setSurveyAnswers((prev) => ({
                  ...prev,
                  concern: e.target.value,
                }))
              }
              rows={3}
              placeholder="간단히 적어 주세요"
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)]">
              상담을 통해 얻고 싶은 것
            </label>
            <textarea
              value={surveyAnswers.goal}
              onChange={(e) =>
                setSurveyAnswers((prev) => ({
                  ...prev,
                  goal: e.target.value,
                }))
              }
              rows={2}
              placeholder="간단히 적어 주세요"
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)]"
            />
          </div>
        </div>
      </section>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={selectedSlots.length === 0}
          className="rounded-lg bg-[var(--foreground)] px-6 py-3 font-semibold text-white disabled:opacity-50 hover:bg-[var(--foreground)]/80 transition-colors"
        >
          예약 요청 보내기
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard/counseling")}
          className="rounded-lg border border-[var(--border)] px-6 py-3 font-medium text-[var(--foreground)]/80 hover:bg-[var(--surface)] transition-colors"
        >
          돌아가기
        </button>
      </div>
    </div>
  );
}
