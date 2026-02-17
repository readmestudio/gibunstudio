"use client";

import { useState } from "react";

interface NotifyButtonProps {
  programId: string;
  programTitle: string;
}

export function NotifyButton({ programId, programTitle }: NotifyButtonProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !phone.trim()) {
      setError("이름과 휴대폰 번호를 모두 입력해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/open-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          program_type: programId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "알림 신청에 실패했습니다.");
      }

      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알림 신청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <span className="mt-4 inline-flex items-center text-sm font-semibold text-[var(--foreground)]/60">
        알림 신청 완료!
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex items-center text-sm font-semibold text-[var(--foreground)] hover:opacity-70 transition-opacity"
      >
        알림신청하기 →
      </button>

      {/* 모달 */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm mx-4 rounded-2xl border-2 border-[var(--foreground)] bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">
              알림 신청
            </h3>
            <p className="text-sm text-[var(--foreground)]/60 mb-5">
              <strong>{programTitle}</strong> 오픈 시 알려드릴게요.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border-2 border-[var(--foreground)]/20 px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/40 focus:border-[var(--foreground)] focus:outline-none"
              />
              <input
                type="tel"
                placeholder="휴대폰 번호 (010-0000-0000)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border-2 border-[var(--foreground)]/20 px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/40 focus:border-[var(--foreground)] focus:outline-none"
              />

              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}

              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border-2 border-[var(--foreground)]/20 px-4 py-2.5 text-sm font-medium text-[var(--foreground)]/60 hover:bg-[var(--surface)] transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg border-2 border-[var(--foreground)] bg-[var(--foreground)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading ? "신청 중..." : "신청하기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
