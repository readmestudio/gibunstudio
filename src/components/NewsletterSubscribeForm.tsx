"use client";

import { useState } from "react";

type Status = "idle" | "submitting" | "success" | "already" | "error";

interface Props {
  /** "banner" — /essays 상단 큰 배너용, "inline" — 에세이 하단 삽입용 */
  variant?: "banner" | "inline";
}

/**
 * 뉴스레터 구독 폼.
 *
 * 비회원도 이메일만 입력하면 구독 가능. 제출 후 서버에서 환영 메일 발송.
 * 이미 구독 중인 경우에도 조용히 성공 처리(alreadySubscribed 플래그로 문구만 다르게).
 */
export function NewsletterSubscribeForm({ variant = "banner" }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;

    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error ?? "잠시 후 다시 시도해주세요.");
        setStatus("error");
        return;
      }
      setStatus(data.alreadySubscribed ? "already" : "success");
    } catch {
      setErrorMessage("네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
      setStatus("error");
    }
  }

  const isBanner = variant === "banner";
  const isSuccess = status === "success" || status === "already";

  return (
    <div
      className={
        isBanner
          ? "rounded-2xl border-2 border-[var(--foreground)] bg-white p-8 md:p-10"
          : "rounded-xl border border-[var(--foreground)]/20 bg-[var(--surface)] p-6 md:p-8"
      }
    >
      <div className={isBanner ? "text-center mb-6" : "mb-5"}>
        <p className="text-xs font-semibold tracking-widest uppercase text-[var(--foreground)]/60 mb-2">
          마음 구독 에세이
        </p>
        <h2
          className={
            isBanner
              ? "text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-3 leading-snug"
              : "text-lg md:text-xl font-bold text-[var(--foreground)] mb-2 leading-snug"
          }
          style={{ wordBreak: "keep-all" }}
        >
          매주 목요일, 마음에게 편지를 보내드려요
        </h2>
        <p
          className="text-sm md:text-base text-[var(--foreground)]/70 leading-relaxed"
          style={{ wordBreak: "keep-all" }}
        >
          번아웃, 조급함, 완벽주의 — 조용히 덜어내고 싶은 마음들에게 건네는
          짧은 이야기. 이메일만 남겨두시면 목요일 아침 받은편지함에 도착해요.
        </p>
      </div>

      {isSuccess ? (
        <div className="text-center py-4">
          <p className="text-base font-semibold text-[var(--foreground)] mb-1">
            {status === "already"
              ? "이미 구독 중이에요 🌱"
              : "구독 신청이 완료됐어요 🌱"}
          </p>
          <p
            className="text-sm text-[var(--foreground)]/70 leading-relaxed"
            style={{ wordBreak: "keep-all" }}
          >
            {status === "already"
              ? "이미 등록된 이메일이에요. 이번 주 목요일에 뵙겠습니다."
              : "환영 편지가 곧 도착할 거예요. 확인해 주세요."}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className={isBanner ? "max-w-md mx-auto" : ""}>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              placeholder="이메일 주소"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "submitting"}
              className="flex-1 px-4 py-3 rounded-lg border-2 border-[var(--foreground)]/20 bg-white text-base text-[var(--foreground)] placeholder:text-[var(--foreground)]/40 focus:outline-none focus:border-[var(--foreground)] disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={status === "submitting" || !email.trim()}
              className="px-6 py-3 rounded-lg bg-[var(--foreground)] text-white font-semibold text-base whitespace-nowrap transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "submitting" ? "신청 중..." : "구독 신청"}
            </button>
          </div>
          {status === "error" && errorMessage && (
            <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
          )}
          <p className="mt-3 text-xs text-[var(--foreground)]/50 text-center">
            언제든 구독 해지 가능해요.
          </p>
        </form>
      )}
    </div>
  );
}
