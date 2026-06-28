"use client";

/**
 * 결과 다시보기 링크 안내 바. 로그인이 없는 /minds 에서 유저가 자신의 결과를
 * 다시 찾을 수 있도록, 결과 화면 상단에 공유/저장용 링크와 복사 버튼을 보여준다.
 */

import { useState } from "react";
import { M } from "./quiet-editorial";

export function MindsResultLinkBar({ leadId }: { leadId: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      const url = `${window.location.origin}/minds/r/${leadId}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 권한 거부 등 — 조용히 무시(주소창에서 직접 복사 가능).
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        marginBottom: 16,
        padding: "12px 14px",
        borderRadius: 3,
        border: `1px solid ${M.line}`,
        background: M.paper2,
      }}
    >
      <span style={{ fontSize: 12.5, lineHeight: 1.5, color: M.mute2, fontFamily: M.font }}>
        이 결과는 이 링크로 언제든 다시 볼 수 있어요.
      </span>
      <button
        type="button"
        onClick={copy}
        style={{
          flexShrink: 0,
          padding: "8px 14px",
          borderRadius: 999,
          border: `1px solid ${M.ink}`,
          background: copied ? M.ink : "transparent",
          color: copied ? M.paper : M.ink,
          fontSize: 12.5,
          fontWeight: 600,
          fontFamily: M.font,
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        {copied ? "복사됨!" : "링크 복사"}
      </button>
    </div>
  );
}
