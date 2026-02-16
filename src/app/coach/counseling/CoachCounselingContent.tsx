"use client";

import { useState, useEffect, useCallback } from "react";

type SlotItem = {
  id: string;
  slot_time: string;
  is_booked: boolean;
};

type BookingRequest = {
  id: string;
  purchase_id: string;
  user_id: string;
  requested_slots: string[];
  survey_data: { concern?: string; goal?: string };
  status: "pending" | "confirmed" | "rejected" | "completed" | "cancelled";
  confirmed_slot: string | null;
  zoom_link: string | null;
  purchases?: {
    counseling_type: string;
    amount: number;
    status: string;
    profiles?: { email: string; name: string } | null;
  };
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function CoachCounselingContent() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newTime, setNewTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [zoomLinks, setZoomLinks] = useState<Record<string, string>>({});

  const monthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/coach/slots?month=${monthStr}`);
      const data = await res.json();
      setSlots(data.slots || []);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [monthStr]);

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch("/api/coach/bookings");
      if (res.ok) {
        const data = await res.json();
        setBookings(data.bookings || []);
      }
    } catch {
      // 아직 API가 없을 수 있음
    }
  }, []);

  useEffect(() => {
    fetchSlots();
    fetchBookings();
  }, [fetchSlots, fetchBookings]);

  // 날짜별 슬롯 그룹핑
  const slotsByDate = new Map<string, SlotItem[]>();
  slots.forEach((slot) => {
    const d = new Date(slot.slot_time);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!slotsByDate.has(key)) slotsByDate.set(key, []);
    slotsByDate.get(key)!.push(slot);
  });

  function hasSlots(day: number) {
    const key = `${currentYear}-${currentMonth}-${day}`;
    return slotsByDate.has(key);
  }

  function getSlotsForDate(date: Date) {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return (slotsByDate.get(key) || []).sort(
      (a, b) =>
        new Date(a.slot_time).getTime() - new Date(b.slot_time).getTime()
    );
  }

  async function addSlot() {
    if (!selectedDate || !newTime) return;

    const [hours, minutes] = newTime.split(":").map(Number);
    const slotDate = new Date(selectedDate);
    slotDate.setHours(hours, minutes, 0, 0);

    try {
      const res = await fetch("/api/coach/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotTimes: [slotDate.toISOString()] }),
      });
      if (res.ok) {
        setNewTime("");
        fetchSlots();
      } else {
        const data = await res.json();
        alert(data.error || "추가 실패");
      }
    } catch {
      alert("네트워크 오류");
    }
  }

  async function deleteSlot(slotId: string) {
    try {
      const res = await fetch("/api/coach/slots", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId }),
      });
      if (res.ok) {
        fetchSlots();
      } else {
        const data = await res.json();
        alert(data.error || "삭제 실패");
      }
    } catch {
      alert("네트워크 오류");
    }
  }

  async function handleBookingAction(
    bookingId: string,
    action: "confirm" | "reject",
    confirmedSlot?: string
  ) {
    try {
      const res = await fetch("/api/coach/booking/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId,
          action,
          confirmedSlot,
          zoomLink: zoomLinks[bookingId] || null,
        }),
      });
      if (res.ok) {
        fetchBookings();
        fetchSlots();
      } else {
        const data = await res.json();
        alert(data.error || "처리 실패");
      }
    } catch {
      alert("네트워크 오류");
    }
  }

  function goToPrevMonth() {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDate(null);
  }

  function goToNextMonth() {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDate(null);
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth);
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const pendingBookings = bookings.filter((b) => b.status === "pending");

  return (
    <div className="space-y-8">
      {/* 예약 가능 시간 설정 */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          예약 가능 시간 설정
        </h2>
        <p className="mt-1 text-sm text-[var(--foreground)]/70">
          캘린더에서 날짜를 클릭하고 시간을 추가하세요.
        </p>

        {/* 월 네비게이션 */}
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={goToPrevMonth}
            className="p-2 rounded-lg hover:bg-[var(--surface)]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="text-base font-semibold text-[var(--foreground)]">
            {currentYear}년 {currentMonth + 1}월
          </h3>
          <button
            type="button"
            onClick={goToNextMonth}
            className="p-2 rounded-lg hover:bg-[var(--surface)]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 mt-2">
          {WEEKDAYS.map((wd) => (
            <div
              key={wd}
              className="text-center text-xs font-medium py-2 text-[var(--foreground)]/50"
            >
              {wd}
            </div>
          ))}
        </div>

        {/* 달력 그리드 */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-[var(--foreground)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (day === null) return <div key={`e-${idx}`} className="p-2" />;

              const isSel =
                selectedDate &&
                selectedDate.getFullYear() === currentYear &&
                selectedDate.getMonth() === currentMonth &&
                selectedDate.getDate() === day;
              const hasSl = hasSlots(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() =>
                    setSelectedDate(
                      new Date(currentYear, currentMonth, day)
                    )
                  }
                  className={`relative p-2 text-sm text-center rounded-lg transition-colors ${
                    isSel
                      ? "bg-[var(--foreground)] text-white"
                      : "text-[var(--foreground)] hover:bg-[var(--surface)]"
                  }`}
                >
                  {day}
                  {hasSl && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent)]" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* 선택된 날짜의 시간 관리 */}
        {selectedDate && (
          <div className="mt-4 p-4 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
            <h4 className="text-sm font-semibold text-[var(--foreground)] mb-3">
              {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일
              시간대
            </h4>

            {/* 기존 슬롯 */}
            <div className="space-y-1 mb-3">
              {getSlotsForDate(selectedDate).map((slot) => {
                const t = new Date(slot.slot_time);
                const label = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
                return (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-[var(--foreground)]">
                      {label}
                      {slot.is_booked && (
                        <span className="ml-2 text-xs text-red-500">
                          (예약됨)
                        </span>
                      )}
                    </span>
                    {!slot.is_booked && (
                      <button
                        type="button"
                        onClick={() => deleteSlot(slot.id)}
                        className="text-xs text-[var(--foreground)]/50 hover:text-red-500"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                );
              })}
              {getSlotsForDate(selectedDate).length === 0 && (
                <p className="text-xs text-[var(--foreground)]/50">
                  등록된 시간이 없습니다
                </p>
              )}
            </div>

            {/* 시간 추가 */}
            <div className="flex gap-2">
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--foreground)]"
              />
              <button
                type="button"
                onClick={addSlot}
                disabled={!newTime}
                className="rounded-lg bg-[var(--foreground)] px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50 hover:bg-[var(--foreground)]/80"
              >
                추가
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 예약 요청 관리 */}
      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          예약 요청 ({pendingBookings.length}건 대기)
        </h2>

        {pendingBookings.length === 0 ? (
          <p className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-[var(--foreground)]/60">
            대기 중인 예약 요청이 없습니다.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {pendingBookings.map((req) => (
              <div
                key={req.id}
                className="rounded-lg border border-[var(--border)] bg-white p-4"
              >
                <p className="font-medium text-[var(--foreground)]">
                  {req.purchases?.counseling_type || "상담"}
                </p>

                {/* 사용자 선택 시간대 (최대 3개) */}
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-[var(--foreground)]/60">
                    희망 시간:
                  </p>
                  {req.requested_slots.map((slot, i) => {
                    const d = new Date(slot);
                    const label = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-sm text-[var(--foreground)]">
                          {i + 1}순위: {label}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleBookingAction(req.id, "confirm", slot)
                          }
                          className="text-xs px-2 py-0.5 rounded bg-green-600 text-white hover:bg-green-700"
                        >
                          이 시간 확정
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* 서베이 내용 */}
                {req.survey_data && (
                  <div className="mt-3 p-3 rounded bg-[var(--surface)] text-xs text-[var(--foreground)]/70">
                    {req.survey_data.concern && (
                      <p>고민: {req.survey_data.concern}</p>
                    )}
                    {req.survey_data.goal && (
                      <p>목표: {req.survey_data.goal}</p>
                    )}
                  </div>
                )}

                {/* Zoom 링크 + 액션 */}
                <div className="mt-3 flex gap-2">
                  <input
                    type="url"
                    placeholder="Zoom 링크 (선택)"
                    value={zoomLinks[req.id] || ""}
                    onChange={(e) =>
                      setZoomLinks((prev) => ({
                        ...prev,
                        [req.id]: e.target.value,
                      }))
                    }
                    className="flex-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleBookingAction(req.id, "reject")}
                    className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-medium hover:bg-[var(--surface)]"
                  >
                    거절
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
