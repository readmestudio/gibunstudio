"use client";

import type { SlotData } from "./BookingCalendar";

interface TimeSlotPickerProps {
  slots: SlotData[];
  selectedSlotIds: string[];
  onSelectSlot: (slotId: string, slotTime: string) => void;
  onDeselectSlot: (slotId: string) => void;
  maxSelections: number;
}

/**
 * 독립형 시간대 선택 패널
 * BookingCalendar 내부에서도 시간 선택을 제공하지만,
 * 이 컴포넌트는 별도로 시간대만 표시할 때 사용
 */
export function TimeSlotPicker({
  slots,
  selectedSlotIds,
  onSelectSlot,
  onDeselectSlot,
  maxSelections,
}: TimeSlotPickerProps) {
  const availableSlots = slots
    .filter((s) => !s.isBooked)
    .sort(
      (a, b) =>
        new Date(a.slotTime).getTime() - new Date(b.slotTime).getTime()
    );

  if (availableSlots.length === 0) {
    return (
      <p className="text-sm text-[var(--foreground)]/50">
        선택 가능한 시간이 없습니다.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {availableSlots.map((slot) => {
        const time = new Date(slot.slotTime);
        const timeLabel = `${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`;
        const isSelected = selectedSlotIds.includes(slot.id);
        const isMaxReached =
          selectedSlotIds.length >= maxSelections && !isSelected;

        return (
          <button
            key={slot.id}
            type="button"
            disabled={isMaxReached}
            onClick={() => {
              if (isSelected) {
                onDeselectSlot(slot.id);
              } else {
                onSelectSlot(slot.id, slot.slotTime);
              }
            }}
            className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
              isSelected
                ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                : isMaxReached
                ? "border-[var(--border)] text-[var(--foreground)]/30 cursor-not-allowed"
                : "border-[var(--border)] text-[var(--foreground)] hover:border-[var(--foreground)]"
            }`}
          >
            {timeLabel}
          </button>
        );
      })}
    </div>
  );
}
