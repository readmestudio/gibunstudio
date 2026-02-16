"use client";

import { useState, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface SlotData {
  id: string;
  slotTime: string; // ISO string
  isBooked: boolean;
}

interface BookingCalendarProps {
  availableSlots: SlotData[];
  /** 선택된 슬롯 ID 배열 (최대 3개) */
  selectedSlotIds: string[];
  onSelectSlot: (slotId: string, slotTime: string) => void;
  onDeselectSlot: (slotId: string) => void;
  maxSelections?: number;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function isSameDay(d1: Date, d2: Date) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function BookingCalendar({
  availableSlots,
  selectedSlotIds,
  onSelectSlot,
  onDeselectSlot,
  maxSelections = 3,
}: BookingCalendarProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [direction, setDirection] = useState(0);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth);

  // 날짜별 슬롯 그룹핑
  const slotsByDate = useMemo(() => {
    const map = new Map<string, SlotData[]>();
    availableSlots.forEach((slot) => {
      const d = new Date(slot.slotTime);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(slot);
    });
    return map;
  }, [availableSlots]);

  // 선택된 날짜의 가용 슬롯
  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`;
    return (slotsByDate.get(key) || [])
      .filter((s) => !s.isBooked)
      .sort(
        (a, b) =>
          new Date(a.slotTime).getTime() - new Date(b.slotTime).getTime()
      );
  }, [selectedDate, slotsByDate]);

  function goToPrevMonth() {
    setDirection(-1);
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDate(null);
  }

  function goToNextMonth() {
    setDirection(1);
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDate(null);
  }

  function hasAvailableSlots(day: number) {
    const key = `${currentYear}-${currentMonth}-${day}`;
    const slots = slotsByDate.get(key);
    return slots ? slots.some((s) => !s.isBooked) : false;
  }

  function isPast(day: number) {
    const d = new Date(currentYear, currentMonth, day);
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    return d < todayStart;
  }

  // 달력 셀 빌드
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="w-full">
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goToPrevMonth}
          className="p-2 rounded-lg hover:bg-[var(--surface)] transition-colors"
          aria-label="이전 달"
        >
          <svg
            className="w-5 h-5 text-[var(--foreground)]"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h3 className="text-lg font-semibold text-[var(--foreground)]">
          {currentYear}년 {currentMonth + 1}월
        </h3>
        <button
          type="button"
          onClick={goToNextMonth}
          className="p-2 rounded-lg hover:bg-[var(--surface)] transition-colors"
          aria-label="다음 달"
        >
          <svg
            className="w-5 h-5 text-[var(--foreground)]"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((wd, i) => (
          <div
            key={wd}
            className={`text-center text-xs font-medium py-2 ${
              i === 0
                ? "text-red-400"
                : i === 6
                ? "text-blue-400"
                : "text-[var(--foreground)]/50"
            }`}
          >
            {wd}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${currentYear}-${currentMonth}`}
          initial={{ opacity: 0, x: direction * 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -30 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-7"
        >
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="p-2" />;
            }

            const isToday = isSameDay(
              new Date(currentYear, currentMonth, day),
              today
            );
            const hasSlots = hasAvailableSlots(day);
            const past = isPast(day);
            const isSelected =
              selectedDate &&
              isSameDay(
                selectedDate,
                new Date(currentYear, currentMonth, day)
              );

            return (
              <button
                key={day}
                type="button"
                disabled={past || !hasSlots}
                onClick={() =>
                  setSelectedDate(new Date(currentYear, currentMonth, day))
                }
                className={`relative p-2 text-sm text-center rounded-lg transition-colors ${
                  isSelected
                    ? "bg-[var(--foreground)] text-white"
                    : isToday
                    ? "bg-[var(--surface)] font-semibold text-[var(--foreground)]"
                    : past || !hasSlots
                    ? "text-[var(--foreground)]/20 cursor-default"
                    : "text-[var(--foreground)] hover:bg-[var(--surface)]"
                }`}
              >
                {day}
                {hasSlots && !past && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent)]" />
                )}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* 선택된 날짜의 시간대 */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 overflow-hidden"
          >
            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">
              {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
              가능한 시간
              <span className="ml-2 text-xs font-normal text-[var(--foreground)]/50">
                (최대 {maxSelections}개 선택)
              </span>
            </h4>

            {slotsForSelectedDate.length === 0 ? (
              <p className="text-sm text-[var(--foreground)]/50">
                해당 날짜에 가능한 시간이 없습니다.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slotsForSelectedDate.map((slot) => {
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
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
