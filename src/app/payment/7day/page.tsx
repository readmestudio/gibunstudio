"use client";

import { useState } from "react";
import Link from "next/link";

const BANK_ACCOUNT = "140-015-244655";
const BANK_NAME = "신한은행";
const ACCOUNT_HOLDER = "원모어 스푼";
const ORIGINAL_PRICE = 99000;
const DISCOUNT = 10000;
const FINAL_PRICE = ORIGINAL_PRICE - DISCOUNT;

export default function Payment7DayPage() {
  const [copied, setCopied] = useState(false);

  const copyAccount = () => {
    navigator.clipboard.writeText(BANK_ACCOUNT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-2xl font-bold text-[var(--foreground)]">
        7일 내면 아이 찾기 결제
      </h1>
      <p className="mt-2 text-[var(--foreground)]/70">
        아직 카드 결제 준비 중입니다. 무통장 입금 할인 1만원 적용해드렸어요.
      </p>

      <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <p className="text-sm text-[var(--foreground)]/60">정가</p>
        <p className="text-xl font-semibold text-[var(--foreground)] line-through">
          {ORIGINAL_PRICE.toLocaleString()}원
        </p>
        <p className="mt-2 text-sm text-[var(--accent)]">무통장 입금 할인 -10,000원</p>
        <p className="mt-2 text-2xl font-bold text-[var(--foreground)]">
          {FINAL_PRICE.toLocaleString()}원
        </p>
      </div>

      <div className="mt-8 rounded-xl border-2 border-[var(--accent)] bg-[var(--accent-muted)] p-6">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">
          입금 안내
        </h2>
        <div className="mt-4 space-y-2">
          <p className="text-[var(--foreground)]/80">은행: {BANK_NAME}</p>
          <p className="text-[var(--foreground)]/80">예금주: {ACCOUNT_HOLDER}</p>
          <div className="flex items-center gap-3">
            <p className="text-xl font-bold text-[var(--foreground)]">
              계좌번호: {BANK_ACCOUNT}
            </p>
            <button
              type="button"
              onClick={copyAccount}
              className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--accent-hover)]"
            >
              {copied ? "복사됨!" : "복사"}
            </button>
          </div>
        </div>
        <p className="mt-4 text-sm text-[var(--foreground)]/70">
          입금 확인 후 코치가 승인하면 7일 프로그램이 시작됩니다. 입금 확인 시점이 1일차 시작일입니다.
        </p>
      </div>

      <div className="mt-8 flex gap-4">
        <Link
          href="/payment/7day/complete"
          className="flex-1 rounded-lg bg-[var(--accent)] px-6 py-3 text-center font-semibold text-[var(--foreground)] hover:bg-[var(--accent-hover)]"
        >
          입금 완료했어요
        </Link>
        <Link
          href="/programs/7day"
          className="rounded-lg border border-[var(--border)] px-6 py-3 text-center font-medium text-[var(--foreground)]/80 hover:bg-[var(--surface)]"
        >
          돌아가기
        </Link>
      </div>
    </div>
  );
}
