"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BookingCalendar, type SlotData } from "@/components/booking/BookingCalendar";
import { MAX_SLOT_SELECTIONS } from "@/lib/counseling/types";

interface Props {
  counselingTypeId: string;
}

export function BookingContent({ counselingTypeId }: Props) {
  const router = useRouter();
  const [availableSlots, setAvailableSlots] = useState<SlotData[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<
    { id: string; slotTime: string }[]
  >([]);
  const [surveyData, setSurveyData] = useState({ concern: "", goal: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const fetchSlots = useCallback(async (month: string) => {
    setLoading(true);
    try {
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
    fetchSlots(currentMonth);
  }, [currentMonth, fetchSlots]);

  // 캘린더 월 변경 감지를 위한 커스텀 핸들러
  // BookingCalendar 내부에서 월이 변하면 이쪽에서도 fetch
  useEffect(() => {
    // 다음달과 이전달도 미리 가져오기 (선택적 최적화)
  }, []);

  function handleSelectSlot(slotId: string, slotTime: string) {
    if (selectedSlots.length >= MAX_SLOT_SELECTIONS) return;
    if (selectedSlots.some((s) => s.id === slotId)) return;
    setSelectedSlots((prev) => [...prev, { id: slotId, slotTime }]);
  }

  function handleDeselectSlot(slotId: string) {
    setSelectedSlots((prev) => prev.filter((s) => s.id !== slotId));
  }

  async function handleSubmit() {
    if (selectedSlots.length === 0) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          counselingType: counselingTypeId,
          slotIds: selectedSlots.map((s) => s.id),
          surveyData,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/payment/checkout/${data.bookingId}`);
      } else {
        alert(data.error || "예약 생성에 실패했습니다.");
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedSlotIds = selectedSlots.map((s) => s.id);

  return (
    <div className="space-y-8">
      {/* 캘린더 섹션 */}
      <section className="rounded-xl border border-[var(--border)] bg-white p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-1">
          희망 상담 시간 선택
        </h2>
        <p className="text-sm text-[var(--foreground)]/60 mb-6">
          상담사와 시간 조율을 위해 가능한 시간을 최대 {MAX_SLOT_SELECTIONS}개
          선택해주세요. 상담사가 그 중 하나를 확정합니다.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-12">
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

        {/* 선택한 슬롯 요약 */}
        {selectedSlots.length > 0 && (
          <div className="mt-6 p-4 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2">
              선택한 시간 ({selectedSlots.length}/{MAX_SLOT_SELECTIONS})
            </h4>
            <div className="space-y-1">
              {selectedSlots.map((slot, idx) => {
                const d = new Date(slot.slotTime);
                const label = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
                return (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-[var(--foreground)]">
                      {idx + 1}순위: {label}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeselectSlot(slot.id)}
                      className="text-[var(--foreground)]/50 hover:text-[var(--foreground)] text-xs"
                    >
                      삭제
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* 서베이 섹션 */}
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
              value={surveyData.concern}
              onChange={(e) =>
                setSurveyData((prev) => ({ ...prev, concern: e.target.value }))
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
              value={surveyData.goal}
              onChange={(e) =>
                setSurveyData((prev) => ({ ...prev, goal: e.target.value }))
              }
              rows={2}
              placeholder="간단히 적어 주세요"
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)]"
            />
          </div>
        </div>
      </section>

      {/* 결제하기 버튼 */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={selectedSlots.length === 0 || submitting}
          className="rounded-lg bg-[var(--foreground)] px-8 py-3 font-semibold text-white disabled:opacity-50 hover:bg-[var(--foreground)]/80 transition-colors"
        >
          {submitting ? "처리 중..." : "결제하기"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-[var(--border)] px-6 py-3 font-medium text-[var(--foreground)]/80 hover:bg-[var(--surface)] transition-colors"
        >
          돌아가기
        </button>
      </div>
    </div>
  );
}
