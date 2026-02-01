'use client';

interface PaymentGateProps {
  onProceed: () => void;
  phase1Id: string;
}

export function PaymentGate({ onProceed, phase1Id }: PaymentGateProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden min-h-[500px] flex flex-col">
      {/* Header */}
      <div className="p-8 pb-6 border-b border-[var(--border)]">
        <h2 className="text-2xl font-bold text-[var(--foreground)] leading-tight">
          더 깊은 분석이 궁금하신가요?
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 flex flex-col justify-center">
        {/* Preview with Blur */}
        <div className="mb-8 p-6 bg-gradient-to-br from-[var(--accent)]/10 to-[var(--accent)]/5 rounded-xl relative overflow-hidden">
          <div className="absolute inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center">
            <div className="text-center">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-[var(--accent)]"
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
              className="w-5 h-5 text-[var(--accent)] mt-0.5 flex-shrink-0"
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
              className="w-5 h-5 text-[var(--accent)] mt-0.5 flex-shrink-0"
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
              className="w-5 h-5 text-[var(--accent)] mt-0.5 flex-shrink-0"
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
          <div className="inline-block px-6 py-3 bg-[var(--accent)]/10 rounded-lg">
            <p className="text-sm text-[var(--foreground)]/70 mb-1">심층 분석 가격</p>
            <p className="text-3xl font-bold text-[var(--accent)]">₩4,900</p>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onProceed}
          className="w-full py-4 bg-[var(--accent)] text-white font-semibold rounded-lg hover:bg-[var(--accent-hover)] transition-colors"
        >
          심층 분석 시작하기
        </button>
      </div>
    </div>
  );
}
