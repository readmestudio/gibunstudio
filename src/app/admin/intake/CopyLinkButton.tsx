"use client";

/**
 * 검사 링크 복사 버튼 (관리자 목록용).
 *
 * 유저마다 고유한 /intake/{token} 링크를 원클릭으로 클립보드에 복사한다.
 * navigator.clipboard 미지원 환경(구형·비 HTTPS)은 execCommand 로 폴백.
 */

import { useState } from "react";

export default function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        // 폴백: 임시 textarea 선택 후 복사
        const ta = document.createElement("textarea");
        ta.value = link;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // 복사 실패 시 사용자가 직접 선택할 수 있게 링크를 알림으로 노출
      window.prompt("아래 링크를 복사하세요", link);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <code
        className="block max-w-[220px] cursor-text select-all truncate rounded-lg border border-[var(--foreground)]/10 bg-[var(--surface)] px-2 py-1 text-xs text-[var(--foreground)]/70"
        title={link}
      >
        {link}
      </code>
      <button
        type="button"
        onClick={copy}
        aria-live="polite"
        className={`shrink-0 rounded-lg border-2 px-3 py-1 text-xs font-semibold transition-colors ${
          copied
            ? "border-[var(--foreground)] bg-[var(--foreground)] text-white"
            : "border-[var(--foreground)]/20 bg-white text-[var(--foreground)] hover:border-[var(--foreground)]"
        }`}
      >
        {copied ? "복사됨!" : "복사"}
      </button>
    </div>
  );
}
