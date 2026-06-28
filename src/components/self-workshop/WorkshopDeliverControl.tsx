"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * 관리자 화면용 — 설문 응답 한 건에 맞춤 워크북 링크를 저장(전달/공개)/해제한다.
 * 링크를 저장하면 해당 회원의 전달 안내 페이지에 "워크북 열기"가 노출된다.
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
  const delivered = !!initialUrl;

  const save = async (workbookUrl: string) => {
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/admin/workshop-survey/deliver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, workbookUrl }),
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

  return (
    <div className="mt-4 rounded-lg border-2 border-[var(--foreground)]/10 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[var(--foreground)]/50">
          맞춤 워크북 링크
        </p>
        {delivered ? (
          <span className="rounded-full bg-[var(--foreground)] px-2.5 py-0.5 text-[11px] font-semibold text-white">
            전달됨
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

      <div className="mt-2 flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://… (노션/PDF 등 워크북 링크)"
          className="min-w-0 flex-1 rounded-lg border-2 border-[var(--foreground)]/15 bg-white px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground)]/35 focus:border-[var(--foreground)] focus:outline-none"
        />
        <button
          type="button"
          onClick={() => save(url.trim())}
          disabled={saving || !url.trim() || url.trim() === (initialUrl ?? "")}
          className="shrink-0 rounded-lg border-2 border-[var(--foreground)] bg-[var(--foreground)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {saving ? "저장 중…" : delivered ? "수정" : "전달하기"}
        </button>
      </div>

      {delivered && (
        <button
          type="button"
          onClick={() => {
            setUrl("");
            save("");
          }}
          disabled={saving}
          className="mt-2 text-xs font-medium text-red-600 underline underline-offset-2 disabled:opacity-40"
        >
          전달 취소(링크 비우기)
        </button>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
