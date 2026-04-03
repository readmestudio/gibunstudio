'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

interface PaymentClientProps {
  phase1Id: string;
  userEmail: string;
}

const NICEPAY_CLIENT_ID = process.env.NEXT_PUBLIC_NICEPAY_MERCHANT_ID || '';
const NICEPAY_SDK_URL = process.env.NEXT_PUBLIC_NICEPAY_SDK_URL || '';
const IS_NICEPAY_ENABLED = !!NICEPAY_CLIENT_ID;

const BANK_NAME = '신한은행';
const ACCOUNT_NUMBER = '140-015-244655';
const ACCOUNT_HOLDER = '원모어 스푼';
const AMOUNT = 14900;

export function PaymentClient({ phase1Id, userEmail }: PaymentClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [depositorName, setDepositorName] = useState('');
  const [copied, setCopied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank_transfer'>(
    IS_NICEPAY_ENABLED ? 'card' : 'bank_transfer'
  );
  const [sdkLoaded, setSdkLoaded] = useState(false);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(ACCOUNT_NUMBER);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /** 카드 결제 처리 */
  const handleCardPayment = async () => {
    if (!window.AUTHNICE) {
      alert('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. 서버에 pending 결제 레코드 생성
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
      console.log('결제 생성 응답:', response.status, data);

      if (!response.ok) {
        throw new Error(data.error || '결제 준비에 실패했습니다');
      }

      const { order_id } = data;

      // 2. NicePay 결제창 호출
      window.AUTHNICE.requestPay({
        clientId: NICEPAY_CLIENT_ID,
        method: 'card',
        orderId: order_id,
        amount: AMOUNT,
        goodsName: '기분 심층 분석 리포트',
        returnUrl: `${window.location.origin}/api/payment/nicepay/return`,
        fnError: (result) => {
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

  /** 무통장입금 처리 */
  const handleBankTransfer = async () => {
    if (!depositorName.trim()) {
      alert('입금자명을 입력해주세요.');
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
          payment_method: 'bank_transfer',
          depositor_name: depositorName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment record');
      }

      const { payment_id } = await response.json();
      router.push(`/husband-match/payment/waiting/${payment_id}`);
    } catch (error) {
      console.error('Payment submission error:', error);
      alert('결제 신청에 실패했습니다. 다시 시도해주세요.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--surface)] to-white py-12 px-4">
      {/* NicePay JS SDK 로드 */}
      {IS_NICEPAY_ENABLED && NICEPAY_SDK_URL && (
        <Script
          src={NICEPAY_SDK_URL}
          strategy="afterInteractive"
          onLoad={() => setSdkLoaded(true)}
        />
      )}

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-[var(--foreground)] mb-3">
            심층 분석 결제
          </h1>
          <p className="text-[var(--foreground)]/70">
            결제 방법을 선택해주세요
          </p>
        </div>

        {/* Payment Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-[var(--border)] overflow-hidden">
          {/* Amount */}
          <div className="p-8 border-b border-[var(--border)] bg-gradient-to-br from-[var(--accent)]/5 to-transparent">
            <p className="text-sm text-[var(--foreground)]/70 mb-2">결제 금액</p>
            <p className="text-4xl font-bold text-[var(--accent)]">
              ₩{AMOUNT.toLocaleString()}
            </p>
            <p className="text-sm text-[var(--foreground)]/60 mt-2">
              심층 분석 리포트 (18문항 서베이 + 10장 카드)
            </p>
          </div>

          {/* Payment Method Tabs */}
          {IS_NICEPAY_ENABLED && (
            <div className="flex border-b border-[var(--border)]">
              <button
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 py-4 text-center font-medium transition-colors ${
                  paymentMethod === 'card'
                    ? 'text-[var(--accent)] border-b-2 border-[var(--accent)] bg-[var(--accent)]/5'
                    : 'text-[var(--foreground)]/60 hover:text-[var(--foreground)]'
                }`}
              >
                카드 결제
              </button>
              <button
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`flex-1 py-4 text-center font-medium transition-colors ${
                  paymentMethod === 'bank_transfer'
                    ? 'text-[var(--accent)] border-b-2 border-[var(--accent)] bg-[var(--accent)]/5'
                    : 'text-[var(--foreground)]/60 hover:text-[var(--foreground)]'
                }`}
              >
                무통장입금
              </button>
            </div>
          )}

          {/* Card Payment */}
          {paymentMethod === 'card' && IS_NICEPAY_ENABLED && (
            <div className="p-8">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-[var(--surface)] rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-[var(--foreground)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <p className="text-[var(--foreground)]/70 mb-2">
                  신용카드 / 체크카드로 안전하게 결제합니다
                </p>
                <p className="text-xs text-[var(--foreground)]/50 mb-6">
                  나이스페이 보안 결제창이 열립니다
                </p>
              </div>
            </div>
          )}

          {/* Bank Transfer */}
          {paymentMethod === 'bank_transfer' && (
            <>
              <div className="p-8 border-b border-[var(--border)]">
                <h2 className="text-lg font-bold text-[var(--foreground)] mb-4">
                  입금 계좌 정보
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-lg">
                    <div>
                      <p className="text-sm text-[var(--foreground)]/60 mb-1">은행</p>
                      <p className="text-lg font-semibold text-[var(--foreground)]">{BANK_NAME}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm text-[var(--foreground)]/60 mb-1">계좌번호</p>
                      <p className="text-lg font-semibold text-[var(--foreground)] font-mono">{ACCOUNT_NUMBER}</p>
                    </div>
                    <button
                      onClick={handleCopyAccount}
                      className="ml-4 px-4 py-2 bg-[var(--accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
                    >
                      {copied ? '복사됨!' : '복사'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-lg">
                    <div>
                      <p className="text-sm text-[var(--foreground)]/60 mb-1">예금주</p>
                      <p className="text-lg font-semibold text-[var(--foreground)]">{ACCOUNT_HOLDER}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <label className="block mb-2 text-sm font-medium text-[var(--foreground)]">
                  입금자명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={depositorName}
                  onChange={(e) => setDepositorName(e.target.value)}
                  placeholder="입금하실 때 사용한 이름을 입력해주세요"
                  className="w-full p-4 border-2 border-[var(--border)] rounded-lg focus:border-[var(--accent)] focus:outline-none"
                />
                <p className="mt-2 text-xs text-[var(--foreground)]/60">
                  입금 확인을 위해 필요합니다. 정확히 입력해주세요.
                </p>
              </div>

              <div className="p-8 bg-blue-50 border-t border-blue-200">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-900 mb-2">입금 안내</p>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• 입금 후 아래 버튼을 눌러 입금 신청을 해주세요</li>
                      <li>• 관리자 확인 후 심층 분석이 시작됩니다 (영업일 기준 1일 이내)</li>
                      <li>• 입금 확인은 이메일로 안내드립니다: {userEmail}</li>
                      <li>• 정확한 금액(₩{AMOUNT.toLocaleString()})을 입금해주세요</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Submit Button */}
        <div className="mt-8">
          {paymentMethod === 'card' ? (
            <button
              onClick={handleCardPayment}
              disabled={isSubmitting || !sdkLoaded}
              className="w-full py-4 bg-[var(--accent)] text-white font-semibold rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '결제 진행 중...' : !sdkLoaded ? '결제 모듈 로딩 중...' : `₩${AMOUNT.toLocaleString()} 카드 결제하기`}
            </button>
          ) : (
            <button
              onClick={handleBankTransfer}
              disabled={isSubmitting || !depositorName.trim()}
              className="w-full py-4 bg-[var(--accent)] text-white font-semibold rounded-lg hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '처리 중...' : '입금 완료 신청하기'}
            </button>
          )}
          <p className="text-center text-sm text-[var(--foreground)]/60 mt-4">
            {paymentMethod === 'card'
              ? '나이스페이 보안 결제로 안전하게 처리됩니다'
              : '입금을 완료하셨다면 위 버튼을 눌러주세요'}
          </p>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.back()}
            className="text-sm text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:underline"
          >
            ← 뒤로 가기
          </button>
        </div>
      </div>
    </div>
  );
}
