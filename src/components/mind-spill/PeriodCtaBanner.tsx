"use client";

/**
 * Period 종합 리포트 promo 카드 — 캘린더 상단 topgrid 좌측.
 * (report-redesign / 감정 캘린더.html 의 .promo 카드 디자인)
 *
 * "ready" (미결제 entry 3개 이상): 결제 시작 버튼.
 *   클릭 → /api/payment/mind-spill/create → period 리포트 페이지(미결제 분기)로 이동.
 * "none": 진행률 바(이번 주기 X / 3 DAYS)만 보여주는 안내 카드.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MIND_SPILL_REPORT_PRICE } from "@/lib/mind-spill/constants";

type PeriodCta =
  | { kind: "none"; unclaimedCount: number }
  | { kind: "ready"; unclaimedCount: number; entryIds: string[] };

const PRICE = `₩${MIND_SPILL_REPORT_PRICE.toLocaleString("ko-KR")}`;

export function PeriodCtaBanner({ periodCta }: { periodCta: PeriodCta }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

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
        router.push(
          `/login?redirect=${encodeURIComponent(window.location.pathname)}`
        );
        return;
      }
      const data = await res.json();
      if (!res.ok || !data.period_report_id) {
        throw new Error(data.error || "결제 정보 생성에 실패했습니다");
      }
      router.push(`/dashboard/mind-spill/period/${data.period_report_id}`);
    } catch (err) {
      console.error("[period CTA] start failed:", err);
      alert(err instanceof Error ? err.message : "결제를 시작할 수 없습니다");
      setSubmitting(false);
    }
  }

  if (periodCta.kind === "ready") {
    return (
      <button
        type="button"
        className="ms-cal-promo ms-cal-grain"
        style={{ ["--grain" as string]: "0.14" }}
        onClick={handleStartPurchase}
        disabled={submitting}
      >
        <div className="lbl">
          {PRICE} · PERIOD REPORT · {periodCta.unclaimedCount}일치
        </div>
        <h2>
          지난 {periodCta.unclaimedCount}일치
          <br />
          종합 리포트가 준비됐어요
        </h2>
        <p>
          모인 체크인에서 발견한 반복 패턴, 당신만의 강점 3가지, 상담사의 한 통의
          편지까지. 약 1분 안에 받아보세요.
        </p>
        <span className="promo-cta">
          {submitting ? "결제 준비 중…" : `${PRICE} 종합 리포트 받기 →`}
        </span>
      </button>
    );
  }

  const prog = Math.min(3, periodCta.unclaimedCount);
  return (
    <div
      className="ms-cal-promo ms-cal-grain"
      style={{ ["--grain" as string]: "0.14" }}
    >
      <div className="lbl">{PRICE} · PERIOD REPORT</div>
      <h2>
        3일이 모이면
        <br />
        종합 리포트가 완성돼요
      </h2>
      <p>
        매일 작성 + 그날 감정 분석은 무료. 3일치가 모이면 반복 패턴 · 강점 ·
        상담사 편지가 한 통에 담긴 종합 리포트를 받아요.
      </p>
      <div className="barwrap">
        <div className="meta">
          <span>이번 주기 진행</span>
          <span>{prog} / 3 DAYS</span>
        </div>
        <div className="track">
          <i style={{ width: `${(prog / 3) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
