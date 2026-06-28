"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * 관리자 화면용 — 설문 응답 한 건의 워크북을 전달(공개)/취소한다.
 *
 *  · 링크를 비우고 [기본 워크북으로 전달] → 기본 성취중독 워크북(인앱 1단계)으로 열림.
 *  · 링크를 넣고 [이 링크로 전달] → 그 커스텀 링크(노션/PDF 등)로 열림.
 *  · [전달 취소] → 다시 "제작 중" 상태로.
 */
export function WorkshopDeliverControl({
  id,
  initialUrl,
  releasedAt,
}: {
  id: string;
  initialUrl: string | null;
  releasedAt: string | null;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const released = !!releasedAt;
  const isCustom = released && !!initialUrl;

  const send = async (body: {
    release: boolean;
    workbookUrl?: string;
  }) => {
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/workshop-survey/deliver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? "저장에 실패했어요.");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  };

  const trimmed = url.trim();

  return (
    <div className="mt-4 rounded-lg border-2 border-[var(--foreground)]/10 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[var(--foreground)]/50">
          워크북 전달
        </p>
        {released ? (
          <span className="rounded-full bg-[var(--foreground)] px-2.5 py-0.5 text-[11px] font-semibold text-white">
            전달됨 · {isCustom ? "커스텀 링크" : "기본 워크북"}
            {releasedAt
              ? ` · ${new Date(releasedAt).toLocaleDateString("ko-KR")}`
              : ""}
          </span>
        ) : (
          <span className="rounded-full border border-[var(--foreground)]/20 px-2.5 py-0.5 text-[11px] font-medium text-[var(--foreground)]/50">
            미전달
          </span>
        )}
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-[var(--foreground)]/45">
        링크를 비워두면 기본 성취중독 워크북(1단계)으로 열려요. 커스텀 워크북은
        링크를 넣어 전달하세요.
      </p>

      <div className="mt-2 flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://… (비우면 기본 워크북)"
          className="min-w-0 flex-1 rounded-lg border-2 border-[var(--foreground)]/15 bg-white px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/35 focus:border-[var(--foreground)] focus:outline-none"
        />
        <button
          type="button"
          onClick={() => send({ release: true, workbookUrl: trimmed })}
          disabled={saving}
          className="shrink-0 rounded-lg border-2 border-[var(--foreground)] bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {saving
            ? "저장 중…"
            : trimmed
              ? "이 링크로 전달"
              : "기본 워크북으로 전달"}
        </button>
      </div>

      {released && (
        <button
          type="button"
          onClick={() => {
            setUrl("");
            send({ release: false });
          }}
          disabled={saving}
          className="mt-2 text-xs font-medium text-red-600 underline underline-offset-2 disabled:opacity-40"
        >
          전달 취소
        </button>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
