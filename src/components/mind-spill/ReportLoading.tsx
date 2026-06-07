"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  periodReportId: string;
};

/**
 * 결제 직후 Period LLM 통합 리포트 자동 생성.
 *
 * 마운트 시 /api/mind-spill/period/generate 호출 → 완료되면 페이지 refresh.
 * 멱등성이 보장되므로 새로고침이나 중복 마운트에도 안전.
 */
export function ReportLoading({ periodReportId }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      try {
        const res = await fetch("/api/mind-spill/period/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ period_report_id: periodReportId }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `리포트 생성 실패 (status ${res.status})`);
        }
        router.refresh();
      } catch (e) {
        console.error("[ReportLoading]", e);
        setStatus("error");
        setErrorMsg(e instanceof Error ? e.message : "알 수 없는 오류");
      }
    })();
  }, [periodReportId, router]);

  if (status === "error") {
    return (
      <div className="mind-spill">
        <main
          className="ms-container"
          style={{ paddingTop: 96, paddingBottom: 120, textAlign: "center" }}
        >
          <div
            className="ms-eyebrow"
            style={{ color: "#c63a3a", marginBottom: 14 }}
          >
            ERROR
          </div>
          <h1
            style={{
              fontFamily: "var(--ms-font-display)",
              fontWeight: 600,
              fontSize: 28,
              color: "var(--ms-ink)",
              margin: "0 0 12px",
              letterSpacing: "-0.02em",
            }}
          >
            리포트 생성에 실패했어요
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--ms-ink-3)",
              lineHeight: 1.7,
              marginBottom: 28,
            }}
          >
            {errorMsg}
            <br />
            결제는 완료되었으니, 잠시 후 새로고침해주세요.
          </p>
          <button
            onClick={() => {
              startedRef.current = false;
              setStatus("loading");
              setErrorMsg("");
              router.refresh();
            }}
            className="ms-btn-ink"
            style={{
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="mind-spill">
      <main
        className="ms-container"
        style={{
          paddingTop: 80,
          paddingBottom: 120,
          textAlign: "center",
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <PulseDot />
        <div
          className="ms-eyebrow"
          style={{ marginTop: 32, marginBottom: 14, color: "var(--ms-accent)" }}
        >
          ANALYZING · ABOUT 1 MIN
        </div>
        <h1
          style={{
            fontFamily: "var(--ms-font-display)",
            fontWeight: 700,
            fontSize: "clamp(28px, 5vw, 40px)",
            color: "var(--ms-ink)",
            margin: "0 0 16px",
            letterSpacing: "-0.025em",
            lineHeight: 1.15,
            wordBreak: "keep-all",
            maxWidth: 480,
          }}
        >
          상담사 한 분이<br />
          당신의 노트들을 읽는 중이에요
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--ms-ink-3)",
            lineHeight: 1.7,
            maxWidth: 440,
            wordBreak: "keep-all",
            margin: 0,
          }}
        >
          반복 패턴 · 강점 · 한 통의 편지 · 처방까지. 약 1분 안에 완성된 리포트를
          받아볼 수 있어요. 이 페이지를 닫지 말고 잠시 기다려주세요.
        </p>
      </main>
    </div>
  );
}

function PulseDot() {
  return (
    <div
      style={{
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: "var(--ms-ink)",
        animation: "ms-pulse 1.4s ease-in-out infinite",
      }}
    >
      <style>{`
        @keyframes ms-pulse {
          0%, 100% { opacity: 0.25; transform: scale(0.85); }
          50%      { opacity: 1;    transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}
