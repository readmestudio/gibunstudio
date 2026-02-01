"use client";

import { useState } from "react";

type BookingRequest = {
  id: string;
  userEmail: string;
  counselingType: string;
  requestedSlots: string[];
  survey: { concern: string; goal: string };
  status: "pending" | "confirmed" | "rejected";
};

export function CoachCounselingContent() {
  const [zoomLink, setZoomLink] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  // TODO: Supabase에서 예약 요청 목록 조회
  const bookingRequests: BookingRequest[] = [];

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          입금 대기
        </h2>
        <p className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-[var(--foreground)]/60">
          Supabase 연동 후 1:1 상담 입금 대기 목록이 표시됩니다.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          예약 가능 시간 설정
        </h2>
        <p className="mt-2 text-sm text-[var(--foreground)]/70">
          회원이 예약 요청 시 선택할 수 있는 시간대를 설정합니다.
        </p>
        <div className="mt-4 space-y-2">
          <input
            type="text"
            placeholder="예: 2025-02-05 14:00"
            className="w-full rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--foreground)]"
          />
          <button
            type="button"
            className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--accent-hover)]"
          >
            시간대 추가
          </button>
        </div>
        <p className="mt-4 text-sm text-[var(--foreground)]/60">
          Supabase 연동 후 캘린더 형식으로 구현됩니다.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          예약 요청
        </h2>
        {bookingRequests.length === 0 ? (
          <p className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-[var(--foreground)]/60">
            예약 요청이 없습니다.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {bookingRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-lg border border-[var(--border)] bg-white p-4"
              >
                <p className="font-medium text-[var(--foreground)]">{req.userEmail}</p>
                <p className="text-sm text-[var(--foreground)]/70">{req.counselingType}</p>
                <p className="mt-2 text-sm text-[var(--foreground)]/60">
                  요청 시간: {req.requestedSlots.join(", ")}
                </p>
                <div className="mt-4 flex gap-2">
                  <input
                    type="url"
                    placeholder="Zoom 링크"
                    value={zoomLink}
                    onChange={(e) => setZoomLink(e.target.value)}
                    className="flex-1 rounded-lg border border-[var(--border)] px-4 py-2 text-sm"
                  />
                  <button
                    type="button"
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    확정
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--surface)]"
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
