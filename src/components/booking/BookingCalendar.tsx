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
  /** 월 변경 시 호출 (슬롯 재조회용) */
  onMonthChange?: (year: number, month: number) => void;
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 07:00 ~ 22:00 (16개 시간대) */
const ALL_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

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
  onMonthChange,
}: BookingCalendarProps) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [direction, setDirection] = useState(0);

  // 최대 선택 가능 날짜: 오늘 + 31일
  const maxDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 31);
    return d;
  }, []);

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

  // 선택된 날짜의 DB 슬롯 (시간별 매칭용)
  const slotsForSelectedDate = useMemo(() => {
    if (!selectedDate) return [];
    const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`;
    return slotsByDate.get(key) || [];
  }, [selectedDate, slotsByDate]);

  function goToPrevMonth() {
    setDirection(-1);
    let newYear = currentYear;
    let newMonth = currentMonth;
    if (currentMonth === 0) {
      newYear = currentYear - 1;
      newMonth = 11;
    } else {
      newMonth = currentMonth - 1;
    }
    setCurrentYear(newYear);
    setCurrentMonth(newMonth);
    setSelectedDate(null);
    onMonthChange?.(newYear, newMonth);
  }

  function goToNextMonth() {
    setDirection(1);
    let newYear = currentYear;
    let newMonth = currentMonth;
    if (currentMonth === 11) {
      newYear = currentYear + 1;
      newMonth = 0;
    } else {
      newMonth = currentMonth + 1;
    }
    setCurrentYear(newYear);
    setCurrentMonth(newMonth);
    setSelectedDate(null);
    onMonthChange?.(newYear, newMonth);
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

  function isOutOfRange(day: number) {
    const d = new Date(currentYear, currentMonth, day);
    return d > maxDate;
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
            const outOfRange = isOutOfRange(day);
            const disabled = past || outOfRange;
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
                disabled={disabled}
                onClick={() =>
                  setSelectedDate(new Date(currentYear, currentMonth, day))
                }
                className={`relative p-2 text-sm text-center rounded-lg transition-colors ${
                  isSelected
                    ? "bg-[var(--foreground)] text-white"
                    : isToday
                    ? "bg-[var(--surface)] font-semibold text-[var(--foreground)]"
                    : disabled
                    ? "text-[var(--foreground)]/20 cursor-default"
                    : "text-[var(--foreground)] hover:bg-[var(--surface)]"
                }`}
              >
                {day}
                {hasSlots && !past && !outOfRange && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent)]" />
                )}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* 선택된 날짜의 시간대 (07:00 ~ 22:00) */}
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
              시간 선택
              <span className="ml-2 text-xs font-normal text-[var(--foreground)]/50">
                (최대 {maxSelections}개 선택)
              </span>
            </h4>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {ALL_HOURS.map((hour) => {
                const timeLabel = `${String(hour).padStart(2, "0")}:00`;

                // DB에 상담사가 설정한 슬롯이 있는지 확인
                const matchingSlot = slotsForSelectedDate.find((s) => {
                  const d = new Date(s.slotTime);
                  return d.getHours() === hour;
                });

                const isAvailable = matchingSlot && !matchingSlot.isBooked;
                const isBooked = matchingSlot?.isBooked;
                const isSelected = matchingSlot
                  ? selectedSlotIds.includes(matchingSlot.id)
                  : false;
                const isMaxReached =
                  selectedSlotIds.length >= maxSelections && !isSelected;

                // 상담사가 설정하지 않은 시간 or 이미 예약된 시간 → disabled
                const slotDisabled = !isAvailable || isMaxReached;

                return (
                  <button
                    key={hour}
                    type="button"
                    disabled={slotDisabled}
                    onClick={() => {
                      if (!matchingSlot) return;
                      if (isSelected) {
                        onDeselectSlot(matchingSlot.id);
                      } else {
                        onSelectSlot(matchingSlot.id, matchingSlot.slotTime);
                      }
                    }}
                    className={`px-2 py-2 text-sm rounded-lg border transition-colors ${
                      isSelected
                        ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
                        : isAvailable && !isMaxReached
                        ? "border-[var(--foreground)]/30 text-[var(--foreground)] hover:border-[var(--foreground)] hover:bg-[var(--surface)]"
                        : isBooked
                        ? "border-[var(--border)] text-[var(--foreground)]/20 cursor-not-allowed line-through"
                        : "border-[var(--border)] text-[var(--foreground)]/20 cursor-not-allowed"
                    }`}
                    title={
                      !matchingSlot
                        ? "상담사 미설정"
                        : isBooked
                        ? "예약 완료"
                        : isMaxReached
                        ? `최대 ${maxSelections}개까지 선택 가능`
                        : ""
                    }
                  >
                    {timeLabel}
                  </button>
                );
              })}
            </div>

            {/* 범례 */}
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--foreground)]/50">
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded border border-[var(--foreground)]/30" />
                선택 가능
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded border border-[var(--border)] bg-[var(--surface)]" />
                상담사 미설정
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded bg-[var(--foreground)]" />
                선택됨
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
