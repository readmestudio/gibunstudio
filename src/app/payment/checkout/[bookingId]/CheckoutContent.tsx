"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BANK_INFO } from "@/lib/nicepay/config";

interface Props {
  bookingId: string;
  purchaseId: string;
  counselingTitle: string;
  amount: number;
  requestedSlots: string[];
}

const nicepayEnabled = !!process.env.NEXT_PUBLIC_NICEPAY_MERCHANT_ID;

export function CheckoutContent({
  bookingId,
  purchaseId,
  counselingTitle,
  amount,
  requestedSlots,
}: Props) {
  const router = useRouter();
  const [depositorName, setDepositorName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const formattedAmount = amount.toLocaleString("ko-KR");

  async function handleCopyAccount() {
    await navigator.clipboard.writeText(BANK_INFO.account);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleNicepayPayment() {
    // NicePay 가입 후 활성화
    alert(
      "NicePay 결제 연동 준비 중입니다.\n현재는 무통장입금을 이용해주세요."
    );
  }

  async function handleBankTransferComplete() {
    if (!depositorName.trim()) {
      alert("입금자명을 입력해주세요.");
      return;
    }
    setSubmitted(true);

    // 결제 정보 저장 (무통장입금)
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase1_id: null,
          amount,
          payment_method: "bank_transfer",
          depositor_name: depositorName,
          purchase_id: purchaseId,
          booking_id: bookingId,
        }),
      });

      if (res.ok) {
        router.push("/payment/checkout/complete");
      } else {
        alert("처리 중 오류가 발생했습니다.");
        setSubmitted(false);
      }
    } catch {
      alert("네트워크 오류가 발생했습니다.");
      setSubmitted(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 예약 요약 */}
      <div className="rounded-xl border border-[var(--border)] bg-white p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          예약 요약
        </h2>
        <div className="mt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--foreground)]/70">상담 유형</span>
            <span className="font-medium text-[var(--foreground)]">
              {counselingTitle}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--foreground)]/70">결제 금액</span>
            <span className="font-bold text-[var(--foreground)]">
              {formattedAmount}원
            </span>
          </div>
          <div className="pt-2 border-t border-[var(--border)]">
            <p className="text-sm text-[var(--foreground)]/70 mb-1">
              희망 시간 (상담사가 1개 확정)
            </p>
            {requestedSlots.map((slot, i) => (
              <p
                key={i}
                className="text-sm text-[var(--foreground)] ml-2"
              >
                {i + 1}순위: {slot}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* NicePay 결제 (미가입 시 비활성) */}
      {nicepayEnabled ? (
        <div className="rounded-xl border border-[var(--border)] bg-white p-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            카드/간편 결제
          </h2>
          <button
            type="button"
            onClick={handleNicepayPayment}
            className="mt-4 w-full rounded-lg bg-[var(--foreground)] px-6 py-3 font-semibold text-white hover:bg-[var(--foreground)]/80 transition-colors"
          >
            {formattedAmount}원 결제하기
          </button>
        </div>
      ) : null}

      {/* 무통장입금 */}
      <div className="rounded-xl border border-[var(--border)] bg-white p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          {nicepayEnabled ? "또는 " : ""}무통장 입금
        </h2>
        <div className="mt-4 p-4 rounded-lg bg-[var(--surface)]">
          <div className="space-y-1 text-sm text-[var(--foreground)]">
            <p>
              은행: <strong>{BANK_INFO.bank}</strong>
            </p>
            <p>
              계좌번호: <strong>{BANK_INFO.account}</strong>
              <button
                type="button"
                onClick={handleCopyAccount}
                className="ml-2 text-xs text-[var(--foreground)]/50 hover:text-[var(--foreground)] underline"
              >
                {copied ? "복사됨!" : "복사"}
              </button>
            </p>
            <p>
              예금주: <strong>{BANK_INFO.holder}</strong>
            </p>
            <p>
              입금액: <strong>{formattedAmount}원</strong>
            </p>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-[var(--foreground)]">
            입금자명
          </label>
          <input
            type="text"
            value={depositorName}
            onChange={(e) => setDepositorName(e.target.value)}
            placeholder="입금자명을 입력해주세요"
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-4 py-2 text-[var(--foreground)] focus:outline-none focus:border-[var(--foreground)]"
          />
        </div>

        <button
          type="button"
          onClick={handleBankTransferComplete}
          disabled={!depositorName.trim() || submitted}
          className="mt-4 w-full rounded-lg bg-[var(--foreground)] px-6 py-3 font-semibold text-white disabled:opacity-50 hover:bg-[var(--foreground)]/80 transition-colors"
        >
          {submitted ? "처리 중..." : "입금 완료했어요"}
        </button>
      </div>
    </div>
  );
}
