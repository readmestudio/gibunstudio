"use client";

/**
 * Period CTA Banner — 캘린더 페이지 상단.
 *
 * "ready" 상태(미결제 entry 3개 이상)면 결제 시작 버튼 표시.
 * 버튼 클릭 → /api/payment/mind-spill/create 호출하여 period_report 생성 +
 * period_purchase pending 생성 → period 리포트 페이지로 이동.
 *
 * "none" 상태면 안내 카드(점선)만 표시.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MIND_SPILL_REPORT_PRICE } from "@/lib/mind-spill/constants";

type PeriodCta =
  | { kind: "none"; unclaimedCount: number }
  | { kind: "ready"; unclaimedCount: number; entryIds: string[] };

export function PeriodCtaBanner({ periodCta }: { periodCta: PeriodCta }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  if (periodCta.kind === "none") {
    const remaining = Math.max(0, 3 - periodCta.unclaimedCount);
    return (
      <div
        style={{
          padding: 20,
          border: "1px dashed var(--ms-line)",
          borderRadius: 14,
          background: "transparent",
        }}
      >
        <div
          className="ms-eyebrow"
          style={{ marginBottom: 8, color: "var(--ms-ink-3)" }}
        >
          ₩{MIND_SPILL_REPORT_PRICE.toLocaleString("ko-KR")} · PERIOD REPORT
        </div>
        <div
          style={{
            fontFamily: "var(--ms-font-display)",
            fontWeight: 600,
            fontSize: 16,
            color: "var(--ms-ink)",
            marginBottom: 6,
            letterSpacing: "-0.015em",
          }}
        >
          체크인 {remaining > 0 ? `${remaining}일` : "조금"} 더 모이면 종합 리포트를
          받을 수 있어요
        </div>
        <p
          style={{
            fontSize: 13,
            color: "var(--ms-ink-3)",
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          3개 이상 체크인이 쌓이면 반복 패턴 · 강점 · 상담사 편지가 한 통에 담긴
          종합 리포트를 받을 수 있어요.
        </p>
      </div>
    );
  }

  async function handleStartPurchase() {
    if (periodCta.kind !== "ready") return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/payment/mind-spill/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entry_ids: periodCta.entryIds }),
      });
      if (res.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.period_report_id) {
        throw new Error(data.error || "결제 정보 생성에 실패했습니다");
      }
      // 결제 게이트 페이지로 이동 (period 리포트 페이지의 미결제 분기).
      router.push(`/dashboard/mind-spill/period/${data.period_report_id}`);
    } catch (err) {
      console.error("[period CTA] start failed:", err);
      alert(err instanceof Error ? err.message : "결제를 시작할 수 없습니다");
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        padding: 24,
        border: "2px solid var(--ms-ink)",
        borderRadius: 16,
        background: "var(--ms-surface)",
      }}
    >
      <div
        className="ms-eyebrow"
        style={{ marginBottom: 10, color: "var(--ms-accent)" }}
      >
        ₩{MIND_SPILL_REPORT_PRICE.toLocaleString("ko-KR")} · PERIOD REPORT ·{" "}
        {periodCta.unclaimedCount}일치
      </div>
      <h3
        style={{
          fontFamily: "var(--ms-font-display)",
          fontWeight: 600,
          fontSize: 21,
          color: "var(--ms-ink)",
          margin: "0 0 10px",
          letterSpacing: "-0.018em",
        }}
      >
        지난 {periodCta.unclaimedCount}일치 종합 리포트가 준비됐어요
      </h3>
      <p
        style={{
          fontSize: 14,
          color: "var(--ms-ink-3)",
          lineHeight: 1.75,
          marginBottom: 16,
        }}
      >
        모인 체크인에서 발견한 반복 패턴, 당신만의 강점 3가지, 상담사의 한 통의
        편지까지. 약 1분 안에 받아보세요.
      </p>
      <button
        onClick={handleStartPurchase}
        disabled={submitting}
        className="ms-btn-ink"
        style={{
          padding: "12px 22px",
          fontSize: 14,
          fontWeight: 600,
          cursor: submitting ? "not-allowed" : "pointer",
          opacity: submitting ? 0.6 : 1,
        }}
      >
        {submitting ? "결제 준비 중…" : "₩4,900 종합 리포트 받기 →"}
      </button>
    </div>
  );
}
