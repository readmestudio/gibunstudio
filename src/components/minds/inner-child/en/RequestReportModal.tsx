"use client";

/**
 * English funnel — "Request the full report" modal (replaces payment checkout).
 *
 * 해외 결제 미지원이라 결제창 대신 이메일만 받는다. 유저가 "Get the full report · $12.90"
 * 를 누르면 이 모달이 뜨고, 무료 베타테스터 선정 축하 + 이메일 입력을 받아
 * POST /api/inner-child/en/request 로 접수한다(운영자 수동 발송).
 *
 * 상태: "form"(축하+입력) → 제출 → "done"(접수 완료).
 */

import { useState, type CSSProperties } from "react";
import { trackMetaEvent } from "@/lib/meta-pixel";

const INK = {
  shell: "#211D18",
  surface: "#29241D",
  border: "#3A3228",
  accent: "#A6A2E0",
  accent2: "#8B89C4",
  grad: "linear-gradient(135deg,#A6A2E0 0%,#8B89C4 50%,#9A97C8 100%)",
  white: "#EDE4D3",
  t82: "rgba(237,228,211,.82)",
  t62: "rgba(237,228,211,.62)",
  t4: "rgba(237,228,211,.4)",
  line: "rgba(237,228,211,.08)",
  font: "'Pretendard',-apple-system,BlinkMacSystemFont,system-ui,sans-serif",
  display: "'Inter','Pretendard',-apple-system,system-ui,sans-serif",
  mono: "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace",
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RequestReportModal({
  open,
  onClose,
  leadId,
}: {
  open: boolean;
  onClose: () => void;
  /** 무료 테스트 리드 id — 요청을 유형·결과링크에 묶는다. */
  leadId?: string;
}) {
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<"form" | "sending" | "done">("form");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const submit = async () => {
    const value = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(value)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError(null);
    setPhase("sending");
    // 요청 = 광고 최적화 신호(구매 의사). 결제는 아니지만 리드 가치가 높다.
    trackMetaEvent("Lead", { content_name: "inner_child_en_request" });
    try {
      await fetch("/api/inner-child/en/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, email: value }),
      });
    } catch {
      // 네트워크 실패라도 접수 화면은 보여준다(운영자에겐 재시도 여지, 유저 이탈 방지).
    }
    setPhase("done");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        background: "rgba(5,5,6,0.72)",
        padding: "0 0 max(0px, env(safe-area-inset-bottom))",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 448,
          background: INK.shell,
          borderTop: `1px solid ${INK.border}`,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: "22px 24px 30px",
          maxHeight: "92vh",
          overflowY: "auto",
          fontFamily: INK.font,
          boxShadow: "0 -20px 60px -20px rgba(166,162,224,.4)",
        }}
      >
        {/* handle + close */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <span style={{ fontFamily: INK.mono, fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: INK.accent2 }}>
            {phase === "done" ? "Request received" : "Free beta access"}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ border: "none", background: "none", cursor: "pointer", color: INK.t4, fontSize: 22, lineHeight: 1, padding: 4 }}
          >
            ×
          </button>
        </div>

        {phase === "done" ? (
          <DoneView email={email.trim().toLowerCase()} onClose={onClose} />
        ) : (
          <FormView
            email={email}
            setEmail={(v) => {
              setEmail(v);
              if (error) setError(null);
            }}
            error={error}
            sending={phase === "sending"}
            onSubmit={submit}
          />
        )}
      </div>
    </div>
  );
}

function FormView({
  email,
  setEmail,
  error,
  sending,
  onSubmit,
}: {
  email: string;
  setEmail: (v: string) => void;
  error: string | null;
  sending: boolean;
  onSubmit: () => void;
}) {
  return (
    <>
      {/* 축하 히어로 */}
      <div style={{ textAlign: "center", marginBottom: 6 }}>
        <div style={{ fontSize: 34 }}>🎉</div>
        <h2 style={{ fontFamily: INK.display, fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", color: INK.white, margin: "10px 0 0" }}>
          You&rsquo;re in — as a free beta tester
        </h2>
        <p style={{ fontSize: 14.5, lineHeight: 1.7, color: INK.t62, margin: "12px auto 0", maxWidth: 360 }}>
          We&rsquo;re still opening up outside Korea, so payments aren&rsquo;t live yet. While we&rsquo;re in beta,
          your full report is <b style={{ color: INK.accent2, fontWeight: 700 }}>on the house</b>. Drop your email
          and we&rsquo;ll write and send your complete report there.
        </p>
      </div>

      {/* value strip */}
      <div style={{ margin: "20px 0 4px", padding: "14px 16px", background: INK.surface, border: `1px solid ${INK.border}`, borderRadius: 12 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 10 }}>
          <span style={{ fontFamily: INK.display, fontSize: 15, color: INK.t4, textDecoration: "line-through" }}>$12.90</span>
          <span style={{ fontFamily: INK.display, fontSize: 24, fontWeight: 800, background: INK.grad, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
            Free · beta
          </span>
        </div>
        <p style={{ fontFamily: INK.mono, fontSize: 10.5, color: INK.t4, textAlign: "center", margin: "8px 0 0", lineHeight: 1.6 }}>
          Sent by email, by hand · usually within a day or two
        </p>
      </div>

      <label
        htmlFor="ic-en-email"
        style={{ display: "block", fontFamily: INK.mono, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: INK.t62, margin: "20px 0 6px" }}
      >
        Email to receive the report
      </label>
      <input
        id="ic-en-email"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !sending) onSubmit();
        }}
        placeholder="you@example.com"
        style={{
          width: "100%",
          padding: "14px 15px",
          borderRadius: 12,
          border: `1.5px solid ${error ? INK.accent : INK.border}`,
          background: INK.surface,
          fontFamily: INK.font,
          fontSize: 16,
          color: INK.white,
          outline: "none",
        }}
      />
      {error && (
        <p style={{ fontSize: 12.5, color: INK.accent2, margin: "8px 0 0", fontFamily: INK.font }}>{error}</p>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={sending}
        style={{
          ...btnStyle,
          opacity: sending ? 0.6 : 1,
          cursor: sending ? "default" : "pointer",
        }}
      >
        {sending ? "Sending…" : "Claim my free report →"}
      </button>
      <p style={{ fontSize: 11.5, color: INK.t4, textAlign: "center", margin: "13px 0 0", lineHeight: 1.6, fontFamily: INK.font }}>
        We only use your email to send this report. No spam.
      </p>
    </>
  );
}

function DoneView({ email, onClose }: { email: string; onClose: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "6px 0 0" }}>
      <div style={{ fontSize: 40 }}>✅</div>
      <h2 style={{ fontFamily: INK.display, fontSize: 23, fontWeight: 800, letterSpacing: "-0.02em", color: INK.white, margin: "12px 0 0" }}>
        Got it — you&rsquo;re on the list
      </h2>
      <p style={{ fontSize: 14.5, lineHeight: 1.75, color: INK.t62, margin: "14px auto 0", maxWidth: 360 }}>
        We&rsquo;ll write your full Inner Child report by hand and email a private link to it at{" "}
        <b style={{ color: INK.t82, fontWeight: 700, wordBreak: "break-all" }}>{email || "your email"}</b>,
        usually within a day or two. The link is yours alone and stays open for 7 days. Keep an eye on your
        inbox (and the spam folder, just in case).
      </p>
      <button type="button" onClick={onClose} style={{ ...btnStyle, marginTop: 24 }}>
        Back to my report
      </button>
    </div>
  );
}

const btnStyle: CSSProperties = {
  width: "100%",
  marginTop: 20,
  padding: "16px 18px",
  borderRadius: 13,
  background: INK.grad,
  color: INK.shell,
  border: "none",
  fontFamily: INK.font,
  fontWeight: 800,
  fontSize: 16,
  cursor: "pointer",
  boxShadow: "0 16px 40px -16px rgba(166,162,224,.7)",
};
