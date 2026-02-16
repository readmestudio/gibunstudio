"use client";

import Link from "next/link";

type BookingItem = {
  id: string;
  counselingType: string;
  title: string;
  amount: number;
  status: string;
  paymentStatus: string;
  requestedSlots: string[];
  confirmedSlot: string | null;
  zoomLink: string | null;
  createdAt: string;
};

type Props = { bookings: BookingItem[] };

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "대기중", color: "text-yellow-600 bg-yellow-50" },
  confirmed: { label: "확정됨", color: "text-green-600 bg-green-50" },
  rejected: { label: "거절됨", color: "text-red-600 bg-red-50" },
  completed: { label: "완료", color: "text-blue-600 bg-blue-50" },
  cancelled: { label: "취소됨", color: "text-[var(--foreground)]/50 bg-[var(--surface)]" },
};

function formatSlot(isoString: string) {
  const d = new Date(isoString);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function CounselingBookingContent({ bookings }: Props) {
  if (bookings.length === 0) {
    return (
      <div className="mt-8 rounded-xl border-2 border-[var(--accent)] bg-[var(--accent-muted)] p-8 text-center">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          예약된 상담이 없습니다
        </h2>
        <p className="mt-2 text-[var(--foreground)]/70">
          1:1 상담 프로그램을 예약하면 여기에 표시됩니다.
        </p>
        <Link
          href="/programs/counseling"
          className="mt-6 inline-flex rounded-lg bg-[var(--foreground)] px-6 py-3 font-semibold text-white hover:bg-[var(--foreground)]/80"
        >
          상담 프로그램 보기
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {bookings.map((b) => {
        const statusInfo = STATUS_LABELS[b.status] || STATUS_LABELS.pending;

        return (
          <div
            key={b.id}
            className="rounded-xl border border-[var(--border)] bg-white p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-[var(--foreground)]">
                  {b.title}
                </h3>
                <p className="text-sm text-[var(--foreground)]/60 mt-1">
                  {b.amount.toLocaleString("ko-KR")}원
                </p>
              </div>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusInfo.color}`}
              >
                {statusInfo.label}
              </span>
            </div>

            {/* 확정된 시간 + Zoom */}
            {b.status === "confirmed" && b.confirmedSlot && (
              <div className="mt-4 p-3 rounded-lg bg-green-50 border border-green-200">
                <p className="text-sm font-medium text-green-800">
                  확정 시간: {formatSlot(b.confirmedSlot)}
                </p>
                {b.zoomLink && (
                  <a
                    href={b.zoomLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 text-sm text-green-700 underline hover:text-green-900"
                  >
                    Zoom 링크 열기
                  </a>
                )}
              </div>
            )}

            {/* 대기 중일 때 요청 시간 표시 */}
            {b.status === "pending" && (
              <div className="mt-4">
                <p className="text-xs text-[var(--foreground)]/60 mb-1">
                  희망 시간 (상담사 확정 대기)
                </p>
                {b.requestedSlots.map((slot, i) => (
                  <p
                    key={i}
                    className="text-sm text-[var(--foreground)]/80 ml-2"
                  >
                    {i + 1}순위: {formatSlot(slot)}
                  </p>
                ))}
                {b.paymentStatus === "pending" && (
                  <p className="mt-2 text-xs text-yellow-600">
                    입금 확인 대기 중
                  </p>
                )}
              </div>
            )}

            {/* 거절 시 재예약 안내 */}
            {b.status === "rejected" && (
              <div className="mt-4">
                <p className="text-sm text-[var(--foreground)]/60">
                  상담사가 예약을 거절했습니다. 다른 시간으로 다시 예약해주세요.
                </p>
                <Link
                  href={`/booking/${b.counselingType}`}
                  className="mt-2 inline-flex text-sm font-medium text-[var(--foreground)] underline"
                >
                  다시 예약하기
                </Link>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
