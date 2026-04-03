'use client';

import { useState } from 'react';
import Script from 'next/script';
import { CardPatternDecoration } from './CardPatternDecoration';

interface PaymentGateProps {
  onProceed: () => void;
  phase1Id: string;
}

const NICEPAY_CLIENT_ID = process.env.NEXT_PUBLIC_NICEPAY_MERCHANT_ID || '';
const NICEPAY_SDK_URL = process.env.NEXT_PUBLIC_NICEPAY_SDK_URL || '';
const AMOUNT = 14900;

export function PaymentGate({ onProceed, phase1Id }: PaymentGateProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);

  const handlePayment = async () => {
    // 나이스페이가 비활성화된 경우 기존 결제 페이지로 이동
    if (!NICEPAY_CLIENT_ID) {
      onProceed();
      return;
    }

    if (!window.AUTHNICE) {
      alert('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase1_id: phase1Id,
          amount: AMOUNT,
          payment_method: 'card',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '결제 준비에 실패했습니다');
      }

      const { order_id } = data;

      window.AUTHNICE.requestPay({
        clientId: NICEPAY_CLIENT_ID,
        method: 'card',
        orderId: order_id,
        amount: AMOUNT,
        goodsName: '기분 심층 분석 리포트',
        returnUrl: `${window.location.origin}/api/payment/nicepay/return`,
        fnError: (result: { errorMsg: string }) => {
          console.error('NicePay 에러:', result);
          alert(`결제 오류: ${result.errorMsg}`);
          setIsSubmitting(false);
        },
      });
    } catch (error) {
      console.error('카드 결제 오류:', error);
      alert(`결제 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-[var(--foreground)] overflow-hidden min-h-[500px] flex flex-col">
      {/* NicePay SDK 로드 */}
      {NICEPAY_CLIENT_ID && NICEPAY_SDK_URL && (
        <Script
          src={NICEPAY_SDK_URL}
          strategy="afterInteractive"
          onLoad={() => setSdkLoaded(true)}
        />
      )}

      {/* Header */}
      <div className="p-8 pb-6 border-b border-[var(--border)]">
        <h2 className="text-2xl font-bold text-[var(--foreground)] leading-tight">
          더 깊은 분석이 궁금하신가요?
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 flex flex-col justify-center">
        {/* Preview with Blur */}
        <div className="mb-8 p-6 bg-[var(--surface)] rounded-xl relative overflow-hidden border border-[var(--border)]">
          <div className="absolute inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center">
            <div className="text-center">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-[var(--foreground)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <p className="text-sm font-medium text-[var(--foreground)]">
                8장의 심층 분석 리포트
              </p>
            </div>
          </div>
          <div className="blur-md select-none">
            <p className="font-medium text-[var(--foreground)] mb-2">
              당신의 결혼 가치관 심층 분석
            </p>
            <p className="text-sm text-[var(--foreground)]/70">
              YouTube 데이터와 직접 응답한 서베이를 교차 분석하여
              더욱 정확한 인사이트를 제공합니다...
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-8">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-[var(--foreground)] mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="font-medium text-[var(--foreground)]">9가지 심층 질문</p>
              <p className="text-sm text-[var(--foreground)]/70">
                연애, 결혼 관련 가치관을 직접 묻습니다
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-[var(--foreground)] mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="font-medium text-[var(--foreground)]">교차 검증 인사이트</p>
              <p className="text-sm text-[var(--foreground)]/70">
                YouTube와 설문의 불일치를 분석해 숨겨진 욕구를 발견합니다
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-[var(--foreground)] mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="font-medium text-[var(--foreground)]">8장의 심층 리포트</p>
              <p className="text-sm text-[var(--foreground)]/70">
                AI가 생성한 맞춤형 분석과 비유로 당신을 이해합니다
              </p>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="text-center mb-6">
          <div className="inline-block px-6 py-3 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
            <p className="text-sm text-[var(--foreground)]/70 mb-1">심층 분석 가격</p>
            <p className="text-3xl font-bold text-[var(--foreground)]">₩{AMOUNT.toLocaleString()}</p>
          </div>
        </div>

        {/* CTA Button - 바로 결제 */}
        <button
          onClick={handlePayment}
          disabled={isSubmitting || (!!NICEPAY_CLIENT_ID && !sdkLoaded)}
          className="w-full py-4 bg-white text-[var(--foreground)] font-semibold rounded-lg border-2 border-[var(--foreground)] hover:bg-[var(--surface)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? '결제 진행 중...'
            : NICEPAY_CLIENT_ID && !sdkLoaded
              ? '결제 모듈 로딩 중...'
              : '심층 분석 시작하기'}
        </button>
      </div>

      {/* 하단 장식 패턴 */}
      <CardPatternDecoration />
    </div>
  );
}
