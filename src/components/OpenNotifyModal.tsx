"use client";

import { useState } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function OpenNotifyModal({ isOpen, onClose }: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/open-notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "알림 신청에 실패했습니다.");
      setMessage({ type: "success", text: "알림 신청이 완료되었습니다. 오픈 시 연락드리겠습니다." });
      setName("");
      setPhone("");
      setTimeout(() => {
        onClose();
        setMessage(null);
      }, 1500);
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "알림 신청에 실패했습니다.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="open-notify-title"
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 id="open-notify-title" className="text-xl font-bold text-[var(--foreground)]">
            오픈 예정인 프로그램입니다
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-[var(--foreground)]/60 hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
            aria-label="닫기"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-sm text-[var(--foreground)]/70">
          오픈 시 알림을 받으시려면 이름과 휴대폰 번호를 입력해 주세요.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="open-notify-name" className="block text-sm font-medium text-[var(--foreground)]">
              이름
            </label>
            <input
              id="open-notify-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="홍길동"
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--foreground)]/50 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label htmlFor="open-notify-phone" className="block text-sm font-medium text-[var(--foreground)]">
              휴대폰 번호
            </label>
            <input
              id="open-notify-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="010-1234-5678"
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-4 py-2.5 text-[var(--foreground)] placeholder:text-[var(--foreground)]/50 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
          {message && (
            <p className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
              {message.text}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[var(--accent)] px-4 py-3 font-semibold text-[var(--foreground)] hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            오픈 알림 받기
          </button>
        </form>
      </div>
    </div>
  );
}
