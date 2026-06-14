"use client";

/**
 * "오늘 하루 정리하기" — 데일리 체크인 마무리 분석 섹션.
 *
 *   · 버튼을 누르면 오늘 작성한 내용(+이전 기록 맥락)을 분석해 변화·반복·희망을 짚어줌.
 *   · entry당 1회 멱등(재분석 버튼 없음 — 하루 여러 번 호출 방지).
 *   · 월 무료 MIND_SPILL_DAILY_FREE_QUOTA 회, 초과 시 데일리 구독(페이월).
 */

import { useState } from "react";
import Script from "next/script";
import {
  MIND_SPILL_DAILY_FREE_QUOTA,
  MIND_SPILL_DAILY_SUB_GOODS_NAME,
  MIND_SPILL_DAILY_SUB_PRICE,
} from "@/lib/mind-spill/constants";
import type { DailyAnalysis } from "@/lib/mind-spill/types";

const NICEPAY_CLIENT_ID = process.env.NEXT_PUBLIC_NICEPAY_MERCHANT_ID || "";
const NICEPAY_SDK_URL =
  process.env.NEXT_PUBLIC_NICEPAY_SDK_URL || "https://pay.nicepay.co.kr/v1/js/";

type Props = {
  entryId: string;
  initialAnalysis: DailyAnalysis | null;
  /** 분석 전에 미저장 내용을 즉시 저장(flush)하기 위한 콜백. */
  onBeforeAnalyze?: () => void | Promise<void>;
};

export function DailyWrapUp({ entryId, initialAnalysis, onBeforeAnalyze }: Props) {
  const [analysis, setAnalysis] = useState<DailyAnalysis | null>(initialAnalysis);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paywall, setPaywall] = useState(false);
  const [freeRemaining, setFreeRemaining] = useState<number | null>(null);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  async function runAnalyze() {
    setLoading(true);
    setError(null);
    try {
      if (onBeforeAnalyze) await onBeforeAnalyze();
      const res = await fetch("/api/mind-spill/daily-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entry_id: entryId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 402) {
        setPaywall(true);
        return;
      }
      if (!res.ok) {
        setError(data?.error ?? "분석 중 문제가 생겼어요.");
        return;
      }
      setAnalysis(data.daily_analysis as DailyAnalysis);
      if (typeof data.free_remaining === "number") {
        setFreeRemaining(data.free_remaining);
      }
    } catch (e) {
      console.error(e);
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  async function startSubscribe() {
    if (!NICEPAY_CLIENT_ID) {
      alert("결제 모듈이 아직 설정되지 않았어요. 잠시 후 다시 시도해주세요.");
      return;
    }
    if (!window.AUTHNICE) {
      alert("결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    setSubscribing(true);
    try {
      const res = await fetch("/api/payment/mind-spill/subscribe/create", {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        window.location.href = `/login?redirect=${encodeURIComponent(
          window.location.pathname
        )}`;
        return;
      }
      if (!res.ok || !data.order_id) {
        alert(data?.error ?? "결제를 시작할 수 없습니다");
        setSubscribing(false);
        return;
      }
      window.AUTHNICE.requestPay({
        clientId: NICEPAY_CLIENT_ID,
        orderId: data.order_id,
        amount: data.amount,
        goodsName: MIND_SPILL_DAILY_SUB_GOODS_NAME,
        returnUrl: `${window.location.origin}/api/payment/nicepay/return`,
        fnError: (result) => {
          console.error("NicePay 에러:", result);
          alert(`결제 오류: ${result.errorMsg}`);
          setSubscribing(false);
        },
      });
    } catch (e) {
      console.error(e);
      alert("결제를 시작할 수 없습니다");
      setSubscribing(false);
    }
  }

  /* ── 1. 분석 결과 ── */
  if (analysis) {
    return (
      <section className="ms-step" style={{ marginTop: 24 }}>
        <div className="ms-step-header">
          <div className="ms-step-num">✓</div>
          <h2 className="ms-step-title">오늘 하루, 이렇게 정리했어요</h2>
        </div>
        <DailyAnalysisView analysis={analysis} />
        {freeRemaining != null && (
          <p
            style={{
              marginTop: 16,
              fontSize: 12,
              color: "var(--ms-ink-3)",
              fontFamily: "var(--ms-font-mono)",
              letterSpacing: "0.03em",
            }}
          >
            이번 달 무료 분석 {freeRemaining}회 남음
          </p>
        )}
      </section>
    );
  }

  /* ── 2. 페이월 ── */
  if (paywall) {
    return (
      <section className="ms-step" style={{ marginTop: 24 }}>
        {NICEPAY_CLIENT_ID && (
          <Script
            src={NICEPAY_SDK_URL}
            strategy="afterInteractive"
            onLoad={() => setSdkLoaded(true)}
            onReady={() => setSdkLoaded(true)}
          />
        )}
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
            DAILY · 구독
          </div>
          <h3
            style={{
              fontFamily: "var(--ms-font-display)",
              fontWeight: 600,
              fontSize: 20,
              color: "var(--ms-ink)",
              margin: "0 0 10px",
              letterSpacing: "-0.018em",
            }}
          >
            이번 달 무료 {MIND_SPILL_DAILY_FREE_QUOTA}회를 다 썼어요
          </h3>
          <p
            style={{
              fontSize: 14,
              color: "var(--ms-ink-3)",
              lineHeight: 1.75,
              marginBottom: 12,
            }}
          >
            데일리 구독을 하면 매일 &lsquo;오늘 하루 정리하기&rsquo;를 횟수 제한 없이
            받아볼 수 있어요. 체크인 작성과 3일치 종합 리포트는 그대로예요.
          </p>
          <p
            style={{
              fontSize: 12,
              color: "var(--ms-ink-3)",
              lineHeight: 1.6,
              marginBottom: 18,
            }}
          >
            한 번 결제로 <b style={{ color: "var(--ms-ink)" }}>31일간 무제한</b>이에요.
            자동 갱신되지 않으니, 만료 후 이어서 쓰시려면 다시 결제하시면 돼요.
          </p>
          <button
            type="button"
            onClick={startSubscribe}
            disabled={
              subscribing || (!!NICEPAY_CLIENT_ID && !sdkLoaded) || !NICEPAY_CLIENT_ID
            }
            className="ms-btn-ink"
            style={{
              padding: "13px 22px",
              fontSize: 14,
              fontWeight: 600,
              cursor:
                subscribing || (!!NICEPAY_CLIENT_ID && !sdkLoaded)
                  ? "not-allowed"
                  : "pointer",
              opacity:
                subscribing || (!!NICEPAY_CLIENT_ID && !sdkLoaded) ? 0.55 : 1,
            }}
          >
            {!NICEPAY_CLIENT_ID
              ? "결제 모듈 준비 중"
              : subscribing
              ? "결제 진행 중…"
              : !sdkLoaded
              ? "결제 모듈 로딩 중…"
              : `월 ₩${MIND_SPILL_DAILY_SUB_PRICE.toLocaleString(
                  "ko-KR"
                )} 구독하고 무제한 →`}
          </button>
        </div>
      </section>
    );
  }

  /* ── 3. 분석 트리거 ── */
  return (
    <section className="ms-step" style={{ marginTop: 24 }}>
      <div className="ms-step-header">
        <div className="ms-step-num">viii.</div>
        <h2 className="ms-step-title">오늘 하루를 정리합니다</h2>
      </div>
      <p className="ms-step-intro">
        여기서 끝내지 말고, 오늘 적은 것들을 한 번 정리해 보세요. 이전 기록이 있다면
        그 흐름까지 읽어 무엇이 달라졌고 무엇이 반복되는지, 그리고 희망적인 부분을
        함께 짚어드려요.
      </p>
      <div className="ms-mirror-cta">
        <button
          type="button"
          className="ms-btn-ink"
          onClick={runAnalyze}
          disabled={loading}
        >
          {loading ? "정리하는 중…" : "오늘 하루 정리하기 →"}
        </button>
        <p className="ms-mirror-cta-hint">
          매달 {MIND_SPILL_DAILY_FREE_QUOTA}회까지 무료예요. 약 10~30초 소요.
        </p>
        {error && <div className="ms-mirror-error">{error}</div>}
      </div>
    </section>
  );
}

/* ── 분석 결과 표시 ── */

function DailyAnalysisView({ analysis }: { analysis: DailyAnalysis }) {
  return (
    <div className="ms-report" style={{ marginTop: 8 }}>
      <p className="ms-report-intro">{analysis.intro}</p>

      {analysis.today_focus && (
        <p
          style={{
            fontFamily: "var(--ms-font-display)",
            fontWeight: 600,
            fontSize: 16,
            color: "var(--ms-ink)",
            lineHeight: 1.5,
            margin: "16px 0",
            letterSpacing: "-0.01em",
          }}
        >
          {analysis.today_focus}
        </p>
      )}

      <AnalysisSection
        label="달라진 점"
        num="a."
        items={analysis.changes}
      />
      <AnalysisSection
        label="반복되는 생각"
        num="b."
        items={analysis.recurring_themes}
      />
      <AnalysisSection
        label="희망적인 부분"
        num="c."
        items={analysis.hopeful}
        accent
      />

      {analysis.closing && (
        <p
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: "1px solid var(--ms-line)",
            fontSize: 14,
            color: "var(--ms-ink-2, var(--ms-ink-3))",
            lineHeight: 1.75,
          }}
        >
          {analysis.closing}
        </p>
      )}
    </div>
  );
}

function AnalysisSection({
  label,
  num,
  items,
  accent,
}: {
  label: string;
  num: string;
  items: string[];
  accent?: boolean;
}) {
  if (!items || items.length === 0) return null;
  return (
    <div className="ms-report-section">
      <div className="ms-report-section-label">
        <span className="num">{num}</span>
        <span className="name">{label}</span>
      </div>
      <ul
        style={{
          margin: "8px 0 0",
          paddingLeft: 0,
          listStyle: "none",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {items.map((it, i) => (
          <li
            key={i}
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "var(--ms-ink-2, var(--ms-ink-3))",
              paddingLeft: 14,
              borderLeft: `2px solid ${
                accent ? "var(--ms-accent)" : "var(--ms-line-2)"
              }`,
            }}
          >
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
