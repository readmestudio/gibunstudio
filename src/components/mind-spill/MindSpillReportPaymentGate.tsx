"use client";

import { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import {
  MIND_SPILL_REPORT_PRICE,
  MIND_SPILL_REPORT_GOODS_NAME,
} from "@/lib/mind-spill/constants";

const NICEPAY_CLIENT_ID = process.env.NEXT_PUBLIC_NICEPAY_MERCHANT_ID || "";
const NICEPAY_SDK_URL =
  process.env.NEXT_PUBLIC_NICEPAY_SDK_URL ||
  "https://pay.nicepay.co.kr/v1/js/";

type Props = {
  /** PeriodReport ID — period_purchase pending이 이미 존재한다고 가정. */
  periodReportId: string;
  /** "5/30~6/1" 형태 기간 라벨 */
  dateRangeLabel: string;
  /** 묶인 entry 개수 */
  entryCount: number;
  /** 이미 생성된 pending purchase의 order_id (있으면 결제창 즉시 호출). */
  pendingOrderId: string;
  /** 결제 금액 */
  amount: number;
};

/**
 * Period 종합 리포트 결제 게이트.
 *
 * 페이지 진입 시 이미 period_purchase pending이 만들어져 있는 상태.
 * 사용자가 "결제하기" 버튼을 누르면 NicePay 결제창 호출.
 * 결제 완료 → return URL이 같은 period 리포트 페이지로 리다이렉트 → LLM 트리거 → 결과 표시.
 */
export function MindSpillReportPaymentGate({
  periodReportId,
  dateRangeLabel,
  entryCount,
  pendingOrderId,
  amount,
}: Props) {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handlePay() {
    if (!NICEPAY_CLIENT_ID) {
      alert("결제 모듈이 아직 설정되지 않았어요. 잠시 후 다시 시도해주세요.");
      return;
    }
    if (!window.AUTHNICE) {
      alert("결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }
    setSubmitting(true);

    window.AUTHNICE.requestPay({
      clientId: NICEPAY_CLIENT_ID,
      orderId: pendingOrderId,
      amount,
      goodsName: `${MIND_SPILL_REPORT_GOODS_NAME} · ${dateRangeLabel}`,
      returnUrl: `${window.location.origin}/api/payment/nicepay/return`,
      fnError: (result) => {
        console.error("NicePay 에러:", result);
        alert(`결제 오류: ${result.errorMsg}`);
        setSubmitting(false);
      },
    });
  }

  return (
    <div className="mind-spill">
      {NICEPAY_CLIENT_ID && (
        <Script
          src={NICEPAY_SDK_URL}
          strategy="afterInteractive"
          onLoad={() => setSdkLoaded(true)}
          onReady={() => setSdkLoaded(true)}
        />
      )}

      <main
        className="ms-container"
        style={{ paddingTop: 48, paddingBottom: 96 }}
      >
        <Link
          href="/dashboard/mind-spill"
          style={{
            display: "inline-block",
            fontFamily: "var(--ms-font-mono)",
            fontSize: 11,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--ms-ink-3)",
            textDecoration: "none",
            marginBottom: 32,
            fontWeight: 500,
          }}
        >
          ← 캘린더로 돌아가기
        </Link>

        {/* Hero */}
        <div style={{ marginBottom: 40 }}>
          <div
            className="ms-eyebrow"
            style={{ marginBottom: 16, color: "var(--ms-accent)" }}
          >
            PERIOD REPORT · {dateRangeLabel} · {entryCount}일치
          </div>
          <h1
            style={{
              fontFamily: "var(--ms-font-display)",
              fontWeight: 700,
              fontSize: "clamp(32px, 5.5vw, 56px)",
              lineHeight: 1.04,
              letterSpacing: "-0.035em",
              color: "var(--ms-ink)",
              margin: 0,
              wordBreak: "keep-all",
            }}
          >
            {entryCount}일 동안 당신에게서
            <br />
            <span style={{ color: "var(--ms-accent)" }}>발견한 것</span>이 있어요
          </h1>
          <p
            style={{
              marginTop: 20,
              fontSize: 16,
              maxWidth: 560,
              color: "var(--ms-ink-2, var(--ms-ink-3))",
              lineHeight: 1.7,
              wordBreak: "keep-all",
            }}
          >
            모인 체크인에서 옆에서 본 사람의 시선으로 반복되는 패턴, 강점,
            그리고 다음 한 걸음을 발견했어요. 한 통의 노트로 정리해서 보내드릴게요.
          </p>
        </div>

        {/* 발견 카드 */}
        <section style={{ marginBottom: 36 }}>
          <div className="ms-eyebrow" style={{ marginBottom: 18, display: "block" }}>
            결제하시면 받게 되는 것
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <DiscoveryCard
              num="01"
              title={`${entryCount}일치 반복 패턴`}
              promise="감정·생각·행동에서 발견된 반복 신호"
              hook="여러 날에 걸쳐 반복된 감정/인지 왜곡 패턴을 짚어드려요. 하루만 보면 안 보이는 것들."
            />
            <DiscoveryCard
              num="02"
              title="당신만의 강점 3가지"
              promise="좋았던 순간들에서 추출한 강점 분석"
              hook="자신은 모르는, 옆에서만 보이는 강점이 있어요. 모인 좋았던 순간들에서 일관되게 드러나는 셋을 골라드려요."
            />
            <DiscoveryCard
              num="03"
              title="상담사가 건네는 편지 + 처방"
              promise="발견한 것들을 한 통으로 정리, 처방 1~3개"
              hook="발견한 패턴과 강점을 한 통의 노트로 묶고, 다음 며칠에 해볼 수 있는 작은 처방을 함께 받아요."
            />
          </div>
        </section>

        {/* 결제 안내 */}
        <section
          style={{
            padding: "16px 20px",
            border: "1px solid var(--ms-line-2)",
            borderRadius: 12,
            background: "transparent",
            marginBottom: 28,
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 13,
            color: "var(--ms-ink-3)",
            lineHeight: 1.6,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "var(--ms-ink)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            ✓
          </div>
          <span>
            결제 즉시 분석을 시작하고{" "}
            <b style={{ color: "var(--ms-ink)" }}>1분 안에</b> 완성된 리포트를
            받아볼 수 있어요. 한 번 결제로 영구 열람.
          </span>
        </section>

        {/* 가격 카드 */}
        <section
          style={{
            padding: 24,
            background: "var(--ms-surface)",
            border: "2px solid var(--ms-ink)",
            borderRadius: 16,
            marginBottom: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <span
              style={{
                fontFamily: "var(--ms-font-display)",
                fontWeight: 700,
                fontSize: 44,
                color: "var(--ms-ink)",
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}
            >
              ₩{amount.toLocaleString("ko-KR")}
            </span>
            <span style={{ fontSize: 13, color: "var(--ms-ink-3)" }}>
              · {entryCount}일치 종합 1회
            </span>
          </div>
          <p
            style={{
              marginTop: 12,
              fontSize: 12,
              color: "var(--ms-ink-3)",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            이 기간({dateRangeLabel})의 리포트만 열려요. 셀프 체크인 작성 +
            매일 감정 분석은 계속 무료예요.
          </p>
        </section>

        <button
          onClick={handlePay}
          disabled={
            submitting ||
            (!!NICEPAY_CLIENT_ID && !sdkLoaded) ||
            !NICEPAY_CLIENT_ID
          }
          className="ms-btn-ink"
          style={{
            width: "100%",
            padding: "16px 24px",
            fontSize: 15,
            fontWeight: 600,
            cursor:
              submitting || (!!NICEPAY_CLIENT_ID && !sdkLoaded)
                ? "not-allowed"
                : "pointer",
            opacity:
              submitting || (!!NICEPAY_CLIENT_ID && !sdkLoaded) ? 0.55 : 1,
          }}
        >
          {!NICEPAY_CLIENT_ID
            ? "결제 모듈 준비 중"
            : submitting
            ? "결제 진행 중..."
            : !sdkLoaded
            ? "결제 모듈 로딩 중..."
            : `₩${amount.toLocaleString("ko-KR")} · 발견 받아보기`}
        </button>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Link
            href="/dashboard/mind-spill"
            style={{
              fontSize: 13,
              color: "var(--ms-ink-3)",
              textDecoration: "underline",
            }}
          >
            나중에 — 캘린더로 돌아가기 ({periodReportId.slice(0, 8)}…)
          </Link>
        </div>
      </main>
    </div>
  );
}

function DiscoveryCard({
  num,
  title,
  promise,
  hook,
}: {
  num: string;
  title: string;
  promise: string;
  hook: string;
}) {
  return (
    <div
      style={{
        padding: 20,
        border: "1px solid var(--ms-line)",
        borderRadius: 14,
        background: "var(--ms-surface)",
        display: "flex",
        gap: 16,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          fontFamily: "var(--ms-font-mono)",
          fontWeight: 600,
          fontSize: 13,
          color: "var(--ms-ink-3)",
          letterSpacing: "0.05em",
          flexShrink: 0,
          paddingTop: 2,
        }}
      >
        {num}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: "var(--ms-font-display)",
            fontWeight: 600,
            fontSize: 17,
            color: "var(--ms-ink)",
            lineHeight: 1.3,
            letterSpacing: "-0.015em",
            marginBottom: 4,
          }}
        >
          {title}
        </div>
        <div
          className="ms-eyebrow"
          style={{
            marginBottom: 10,
            color: "var(--ms-ink-3)",
            display: "block",
          }}
        >
          {promise}
        </div>
        <p
          style={{
            fontSize: 13,
            color: "var(--ms-ink-3)",
            lineHeight: 1.7,
            margin: 0,
          }}
        >
          {hook}
        </p>
      </div>
    </div>
  );
}
